import type { ProjectSite, TeamMember } from './types';

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
    lastScannedAt: '2026-10-22 18:00',
    daysUnresolved: 1,
    dependencies: [
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
            detectedAt: '2026-10-21 23:05',
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
    ],
    forecast: [
      { date: '10/16', dayLabel: 'Thu', dayLabelKey: 'forecast.days.thu', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
      { date: '10/17', dayLabel: 'Fri', dayLabelKey: 'forecast.days.fri', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
      { date: '10/18', dayLabel: 'Sat', dayLabelKey: 'forecast.days.sat', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
      { date: '10/19', dayLabel: 'Sun', dayLabelKey: 'forecast.days.sun', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
      { date: '10/20', dayLabel: 'Mon', dayLabelKey: 'forecast.days.mon', weather: 'sunny', summary: 'Safe, no anomalies', summaryKey: 'forecast.summaries.safe', vulnerabilityCount: 0 },
      { date: '10/21', dayLabel: 'Tue', dayLabelKey: 'forecast.days.tue', weather: 'thunderstorm', summary: 'Late night 23:00 Emergency patch released (CVSS 9.2)', summaryKey: 'forecast.summaries.patchAlert', vulnerabilityCount: 1 },
      { date: '10/22', dayLabel: 'Today', dayLabelKey: 'forecast.days.today', weather: 'thunderstorm', summary: 'Heavy rain warning in effect: Urgent patch required', summaryKey: 'forecast.summaries.stormAlert', vulnerabilityCount: 1 }
    ]
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
    lastScannedAt: '2026-10-22 17:30',
    daysUnresolved: 12,
    dependencies: [
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
            detectedAt: '2026-10-10 14:00',
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
    ],
    forecast: [
      { date: '10/16', dayLabel: 'Thu', dayLabelKey: 'forecast.days.thu', weather: 'rain', summary: 'Unaddressed 6 days elapsed', summaryKey: 'forecast.summaries.daysElapsed', summaryParams: { days: 6 }, vulnerabilityCount: 1 },
      { date: '10/17', dayLabel: 'Fri', dayLabelKey: 'forecast.days.fri', weather: 'typhoon', summary: 'Unaddressed 7 days reached (Degraded to Typhoon)', summaryKey: 'forecast.summaries.typhoonArrival', vulnerabilityCount: 1 },
      { date: '10/18', dayLabel: 'Sat', dayLabelKey: 'forecast.days.sat', weather: 'typhoon', summary: 'Unaddressed 8 days elapsed', summaryKey: 'forecast.summaries.daysElapsed', summaryParams: { days: 8 }, vulnerabilityCount: 1 },
      { date: '10/19', dayLabel: 'Sun', dayLabelKey: 'forecast.days.sun', weather: 'typhoon', summary: 'Unaddressed 9 days elapsed', summaryKey: 'forecast.summaries.daysElapsed', summaryParams: { days: 9 }, vulnerabilityCount: 1 },
      { date: '10/20', dayLabel: 'Mon', dayLabelKey: 'forecast.days.mon', weather: 'typhoon', summary: 'Unaddressed 10 days elapsed', summaryKey: 'forecast.summaries.daysElapsed', summaryParams: { days: 10 }, vulnerabilityCount: 1 },
      { date: '10/21', dayLabel: 'Tue', dayLabelKey: 'forecast.days.tue', weather: 'typhoon', summary: 'Unaddressed 11 days elapsed', summaryKey: 'forecast.summaries.daysElapsed', summaryParams: { days: 11 }, vulnerabilityCount: 1 },
      { date: '10/22', dayLabel: 'Today', dayLabelKey: 'forecast.days.today', weather: 'typhoon', summary: 'Direct typhoon hit: Consult your maintenance vendor immediately!', summaryKey: 'forecast.summaries.typhoonHit', vulnerabilityCount: 1 }
    ]
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
    lastScannedAt: '2026-10-22 18:20',
    daysUnresolved: 0,
    dependencies: [
      { name: 'vite', version: '5.4.10', ecosystem: 'npm', vulnerabilities: [] },
      { name: 'react', version: '18.3.1', ecosystem: 'npm', vulnerabilities: [] },
      { name: 'tailwindcss', version: '3.4.14', ecosystem: 'npm', vulnerabilities: [] }
    ],
    forecast: [
      { date: '10/16', dayLabel: 'Thu', dayLabelKey: 'forecast.days.thu', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/17', dayLabel: 'Fri', dayLabelKey: 'forecast.days.fri', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/18', dayLabel: 'Sat', dayLabelKey: 'forecast.days.sat', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/19', dayLabel: 'Sun', dayLabelKey: 'forecast.days.sun', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/20', dayLabel: 'Mon', dayLabelKey: 'forecast.days.mon', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/21', dayLabel: 'Tue', dayLabelKey: 'forecast.days.tue', weather: 'sunny', summary: 'Clear skies, no anomalies', summaryKey: 'forecast.summaries.sunny', vulnerabilityCount: 0 },
      { date: '10/22', dayLabel: 'Today', dayLabelKey: 'forecast.days.today', weather: 'sunny', summary: 'Clear skies today: System in optimal health', summaryKey: 'forecast.summaries.cleanSystem', vulnerabilityCount: 0 }
    ]
  }
];

export const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm-1', name: 'Shingo Maeda (You)', nameKey: 'mock.member1Name', email: 'maeda@example.com', role: 'owner', addedAt: '2026-10-01' },
  { id: 'm-2', name: 'Sato (Internal SE)', nameKey: 'mock.member2Name', email: 'sato@example.com', role: 'admin', addedAt: '2026-10-15' },
  { id: 'm-3', name: 'External Maintenance Partner (SIer)', nameKey: 'mock.member3Name', email: 'partner@sier-tech.jp', role: 'viewer', addedAt: '2026-10-21' }
];
