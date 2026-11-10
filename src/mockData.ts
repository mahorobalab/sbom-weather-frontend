import type { ProjectSite, TeamMember, DayForecast, Dependency, Vulnerability, WeatherStatus } from './types';

const DAY_KEYS = [
  'forecast.days.sun',
  'forecast.days.mon',
  'forecast.days.tue',
  'forecast.days.wed',
  'forecast.days.thu',
  'forecast.days.fri',
  'forecast.days.sat'
] as const;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Evaluates weather status from vulnerability list and days unresolved:
 * - 0 vulnerabilities: sunny
 * - Warning (MEDIUM / LOW): cloudy
 * - Danger (CRITICAL / HIGH):
 *   - 0 to 2 days unaddressed: rain
 *   - 3 to 6 days unaddressed: thunderstorm
 *   - 7+ days unaddressed: typhoon
 */
export function calculateWeatherStatus(
  vulnerabilities: Vulnerability[],
  daysUnresolved: number
): WeatherStatus {
  if (!vulnerabilities || vulnerabilities.length === 0) return 'sunny';

  const hasCriticalOrHigh = vulnerabilities.some(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH' || (v.cvss ?? 0) >= 7.0
  );

  if (hasCriticalOrHigh) {
    if (daysUnresolved >= 7) return 'typhoon';
    if (daysUnresolved >= 3) return 'thunderstorm';
    return 'rain';
  }

  return 'cloudy';
}

function toMidnightDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseVulnStartDate(
  detectedAt: string | undefined,
  fallbackDaysUnresolved: number,
  baseMidnight: Date
): Date {
  if (detectedAt) {
    const match = String(detectedAt)
      .trim()
      .match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const parsed = new Date(y, m, day);
      if (!Number.isNaN(parsed.getTime())) {
        if (parsed.getTime() > baseMidnight.getTime()) {
          return new Date(baseMidnight);
        }
        return parsed;
      }
    }
  }
  const fb = new Date(baseMidnight);
  fb.setDate(fb.getDate() - Math.max(0, fallbackDaysUnresolved));
  return fb;
}

/**
 * Calculates maximum days unresolved across dependencies from CVE published/detected dates
 */
export function calculateMaxDaysUnresolved(
  dependencies: Dependency[],
  fallbackDaysUnresolved: number = 0,
  baseDate: Date = new Date()
): number {
  const allVulns = (dependencies || []).flatMap((d) => d.vulnerabilities || []);
  if (allVulns.length === 0) return 0;

  const baseMidnight = toMidnightDate(baseDate);
  const severeVulns = allVulns.filter(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH' || (v.cvss ?? 0) >= 7.0
  );
  const targetList = severeVulns.length > 0 ? severeVulns : allVulns;

  let maxDays = 0;
  for (const v of targetList) {
    const vStart = parseVulnStartDate(v.detectedAt, fallbackDaysUnresolved, baseMidnight);
    const elapsed = Math.max(
      0,
      Math.round((baseMidnight.getTime() - vStart.getTime()) / 86400000)
    );
    if (elapsed > maxDays) maxDays = elapsed;
  }
  return Math.max(maxDays, fallbackDaysUnresolved);
}

/**
 * Dynamically builds the 7-day security weather trend from package vulnerabilities and baseDate
 */
export function build7DayForecastFromDependencies(
  dependencies: Dependency[],
  fallbackWeather: WeatherStatus = 'sunny',
  fallbackDaysUnresolved: number = 0,
  baseDate: Date = new Date()
): DayForecast[] {
  const baseMidnight = toMidnightDate(baseDate);
  const allVulns = (dependencies || []).flatMap((d) => d.vulnerabilities || []);

  const days: DayForecast[] = [];
  for (let idx = 0; idx < 7; idx++) {
    const daysAgo = 6 - idx;
    const d = new Date(baseMidnight);
    d.setDate(baseMidnight.getDate() - daysAgo);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dow = d.getDay();
    const isToday = daysAgo === 0;

    const activeOnDay = allVulns
      .map((vuln) => {
        const vStart = parseVulnStartDate(vuln.detectedAt, fallbackDaysUnresolved, baseMidnight);
        const elapsedDays = Math.round((d.getTime() - vStart.getTime()) / 86400000);
        return { vuln, elapsedDays };
      })
      .filter((item) => item.elapsedDays >= 0);

    if (activeOnDay.length === 0) {
      if (allVulns.length === 0 && isToday && fallbackWeather !== 'sunny') {
        days.push({
          date: `${mm}/${dd}`,
          dayLabel: 'Today',
          dayLabelKey: 'forecast.days.today',
          weather: fallbackWeather,
          summary: 'Vulnerability detected',
          summaryKey: 'forecast.summaries.stormAlert',
          vulnerabilityCount: 1
        });
      } else {
        days.push({
          date: `${mm}/${dd}`,
          dayLabel: isToday ? 'Today' : DAY_LABELS[dow],
          dayLabelKey: isToday ? 'forecast.days.today' : DAY_KEYS[dow],
          weather: 'sunny',
          summary: isToday
            ? 'Clear skies today: System in optimal health'
            : 'Safe, no anomalies',
          summaryKey: isToday ? 'forecast.summaries.cleanSystem' : 'forecast.summaries.safe',
          vulnerabilityCount: 0
        });
      }
      continue;
    }

    const vulnCount = activeOnDay.length;
    const severeOnDay = activeOnDay.filter(
      (item) =>
        item.vuln.severity === 'CRITICAL' ||
        item.vuln.severity === 'HIGH' ||
        (item.vuln.cvss ?? 0) >= 7.0
    );

    if (severeOnDay.length > 0) {
      const maxSevereElapsed = Math.max(...severeOnDay.map((item) => item.elapsedDays));
      const dayWeather = calculateWeatherStatus(
        severeOnDay.map((item) => item.vuln),
        maxSevereElapsed
      );

      let summary = '';
      let summaryKey = '';
      let summaryParams: Record<string, any> | undefined;

      if (dayWeather === 'typhoon') {
        if (isToday) {
          summary = 'Direct typhoon hit: Consult your maintenance vendor immediately!';
          summaryKey = 'forecast.summaries.typhoonHit';
        } else if (maxSevereElapsed === 7) {
          summary = 'Unaddressed 7 days reached (Degraded to Typhoon)';
          summaryKey = 'forecast.summaries.typhoonArrival';
        } else {
          summary = `Unaddressed ${maxSevereElapsed} days elapsed`;
          summaryKey = 'forecast.summaries.daysElapsed';
          summaryParams = { days: maxSevereElapsed };
        }
      } else if (dayWeather === 'thunderstorm') {
        if (isToday) {
          summary = 'Thunderstorm warning: Urgent patch required';
          summaryKey = 'forecast.summaries.stormAlert';
        } else if (maxSevereElapsed === 3) {
          summary = 'Unaddressed 3 days reached (Degraded to Thunderstorm)';
          summaryKey = 'forecast.summaries.thunderstormArrival';
        } else {
          summary = `Unaddressed ${maxSevereElapsed} days elapsed`;
          summaryKey = 'forecast.summaries.daysElapsed';
          summaryParams = { days: maxSevereElapsed };
        }
      } else {
        // rain (0-2 days)
        if (maxSevereElapsed === 0) {
          summary = 'Rain advisory: Severe vulnerability detected';
          summaryKey = 'forecast.summaries.rainInitial';
        } else {
          summary = `Unaddressed ${maxSevereElapsed} days elapsed`;
          summaryKey = 'forecast.summaries.daysElapsed';
          summaryParams = { days: maxSevereElapsed };
        }
      }

      days.push({
        date: `${mm}/${dd}`,
        dayLabel: isToday ? 'Today' : DAY_LABELS[dow],
        dayLabelKey: isToday ? 'forecast.days.today' : DAY_KEYS[dow],
        weather: dayWeather,
        summary,
        summaryKey,
        ...(summaryParams ? { summaryParams } : {}),
        vulnerabilityCount: vulnCount
      });
    } else {
      // Warning (MEDIUM / LOW) only -> cloudy
      days.push({
        date: `${mm}/${dd}`,
        dayLabel: isToday ? 'Today' : DAY_LABELS[dow],
        dayLabelKey: isToday ? 'forecast.days.today' : DAY_KEYS[dow],
        weather: 'cloudy',
        summary: 'Cloudy: Minor or moderate warnings present',
        summaryKey: 'forecast.summaries.cloudyWarning',
        vulnerabilityCount: vulnCount
      });
    }
  }

  return days;
}

export function applyDynamic7DayDates(forecast: DayForecast[], baseDate: Date = new Date()): DayForecast[] {
  const total = forecast.length || 7;
  return forecast.map((item, idx) => {
    const daysAgo = total - 1 - idx;
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - daysAgo);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dow = d.getDay();
    const isToday = daysAgo === 0;

    return {
      ...item,
      date: `${mm}/${dd}`,
      dayLabel: isToday ? 'Today' : DAY_LABELS[dow],
      dayLabelKey: isToday ? 'forecast.days.today' : DAY_KEYS[dow]
    };
  });
}

const formatDaysAgoDateTime = (daysAgo: number, timeStr: string): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${timeStr}`;
};

const formatTodayDateTime = (timeStr: string): string => formatDaysAgoDateTime(0, timeStr);

const SITE1_DEPS: Dependency[] = [
  {
    name: 'php',
    version: '8.2.14',
    ecosystem: 'composer',
    vulnerabilities: [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell: Unauthenticated Remote Code Execution (RCE)',
        titleKey: 'mock.vulnPhpTitle',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25 / 8.3.13',
        detectedAt: formatDaysAgoDateTime(3, '00:05'),
        description:
          'Buffer overflow in specific URL parameter processing. Attackers can seize server privileges without authentication.',
        descriptionKey: 'mock.vulnPhpDesc'
      }
    ]
  },
  {
    name: 'laravel/framework',
    version: '10.35.0',
    ecosystem: 'composer',
    vulnerabilities: []
  },
  {
    name: 'guzzlehttp/guzzle',
    version: '7.8.1',
    ecosystem: 'composer',
    vulnerabilities: []
  }
];

const SITE2_DEPS: Dependency[] = [
  {
    name: 'wordpress-core',
    version: '6.2.2',
    ecosystem: 'wordpress',
    vulnerabilities: [
      {
        id: 'CVE-2026-8812',
        title: 'WordPress Core SQL Injection Vulnerability',
        titleKey: 'mock.vulnWpTitle',
        severity: 'HIGH',
        cvss: 8.5,
        packageName: 'wordpress-core',
        affectedVersion: '< 6.5.4',
        fixedVersion: '6.5.4',
        detectedAt: formatDaysAgoDateTime(10, '14:00'),
        description:
          'Left unaddressed for over 10 days. High risk of direct database tampering from external sources.',
        descriptionKey: 'mock.vulnWpDesc'
      }
    ]
  },
  {
    name: 'woocommerce',
    version: '7.8.0',
    ecosystem: 'wordpress',
    vulnerabilities: []
  }
];

const SITE3_DEPS: Dependency[] = [
  { name: 'vite', version: '5.4.10', ecosystem: 'npm', vulnerabilities: [] },
  { name: 'react', version: '18.3.1', ecosystem: 'npm', vulnerabilities: [] },
  { name: 'tailwindcss', version: '3.4.14', ecosystem: 'npm', vulnerabilities: [] }
];

export const INITIAL_PROJECTS: ProjectSite[] = [
  {
    id: 'proj-laravel-ec',
    name: 'EC Mall Order System (Laravel 10)',
    nameKey: 'mock.site1Name',
    url: 'https://ec-orders.example.com',
    ecosystem: 'composer',
    syncMethod: 'actions',
    isVerified: true,
    verificationToken: 'ninja-site-verification=ec99f1a23b4c',
    currentWeather: 'thunderstorm',
    lastScannedAt: formatTodayDateTime('06:00'),
    daysUnresolved: 3,
    dependencies: SITE1_DEPS,
    forecast: build7DayForecastFromDependencies(SITE1_DEPS, 'thunderstorm', 3)
  },
  {
    id: 'proj-legacy-hanko',
    name: 'Franchise Store Order Backend (Legacy WP)',
    nameKey: 'mock.site2Name',
    url: 'https://hanko-fc-backend.local',
    ecosystem: 'wordpress',
    syncMethod: 'wp_plugin',
    isVerified: true,
    verificationToken: 'ninja-site-verification=hk77a88b99c0',
    currentWeather: 'typhoon',
    lastScannedAt: formatTodayDateTime('06:00'),
    daysUnresolved: 10,
    dependencies: SITE2_DEPS,
    forecast: build7DayForecastFromDependencies(SITE2_DEPS, 'typhoon', 10)
  },
  {
    id: 'proj-modern-app',
    name: 'Marketing Landing Page (Vite + React)',
    nameKey: 'mock.site3Name',
    url: 'https://ninja-landing.dev',
    ecosystem: 'npm',
    syncMethod: 'actions',
    isVerified: true,
    verificationToken: 'ninja-site-verification=lp1100223344',
    currentWeather: 'sunny',
    lastScannedAt: formatTodayDateTime('06:00'),
    daysUnresolved: 0,
    dependencies: SITE3_DEPS,
    forecast: build7DayForecastFromDependencies(SITE3_DEPS, 'sunny', 0)
  }
];

export const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm-1', name: 'Shingo Maeda (You)', nameKey: 'mock.member1Name', email: 'maeda@example.com', role: 'owner', addedAt: '2026-10-01' },
  { id: 'm-2', name: 'Sato (Internal SE)', nameKey: 'mock.member2Name', email: 'sato@example.com', role: 'admin', addedAt: '2026-10-15' },
  { id: 'm-3', name: 'External Maintenance Partner (SIer)', nameKey: 'mock.member3Name', email: 'partner@sier-tech.jp', role: 'viewer', addedAt: '2026-10-21' }
];
