export type WeatherStatus = 'sunny' | 'cloudy' | 'rain' | 'thunderstorm' | 'typhoon';

export interface Vulnerability {
  id: string; // e.g. CVE-2026-109618
  title: string;
  titleKey?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cvss: number;
  packageName: string;
  affectedVersion: string;
  fixedVersion: string;
  detectedAt: string;
  description: string;
  descriptionKey?: string;
}

export interface Dependency {
  name: string;
  version: string;
  ecosystem: 'composer' | 'npm' | 'wordpress';
  componentType?: 'core' | 'runtime' | 'plugin' | 'theme' | 'package';
  active?: boolean;
  displayName?: string;
  needsSlugResolution?: boolean;
  latestVersion?: string;
  vulnerabilities: Vulnerability[];
}

export interface DayForecast {
  date: string; // MM/DD or YYYY-MM-DD
  dayLabel: string; // Fallback or direct display (e.g., "Thu", "Today")
  dayLabelKey?: string; // Optional i18n key for translation (e.g., "forecast.days.thu")
  weather: WeatherStatus;
  summary: string;
  summaryKey?: string; // Optional i18n key for summary
  summaryParams?: Record<string, any>;
  vulnerabilityCount: number;
}

export interface ProjectSite {
  id: string;
  name: string;
  nameKey?: string;
  url: string;
  ecosystem: 'composer' | 'npm' | 'wordpress';
  syncMethod: 'actions' | 'wp_plugin' | 'wp_cli' | 'crawler';
  isVerified: boolean;
  verificationToken: string;
  currentWeather: WeatherStatus;
  lastScannedAt: string;
  daysUnresolved: number; // 7+ days triggers typhoon alert
  createdAt?: number | null; // UNIX epoch seconds of initial site registration
  expiresAt?: number | null; // UNIX epoch seconds, null/undefined = unlimited (Free plan etc.)
  dependencies: Dependency[];
  forecast: DayForecast[];
}

export interface TeamMember {
  id: string;
  name: string;
  nameKey?: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  addedAt: string;
}

export interface SiteMonitorShare {
  id: string;
  siteId: string;
  name: string;
  token: string;
  expiresAt: string | null; // ISO format or null for unlimited
  pin: string; // 6-digit numeric PIN
  pinMode: 'input' | 'url'; // 'input': visitor must enter PIN, 'url': included in query params
  isOneTime: boolean; // Invalidates after first successful view
  createdAt: string; // ISO format
  viewCount: number;
  lastViewedAt?: string | null;
  isRevoked?: boolean;
}

export type PlanTier = 'free' | 'basic' | 'pro';

export interface PlanConfig {
  tier: PlanTier;
  nameKey: string;
  priceMonthly: number;
  maxSites: number;
  featuresKeys: string[];
  isPopular?: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    nameKey: 'pricing.freeName',
    priceMonthly: 0,
    maxSites: 1,
    featuresKeys: [
      'pricing.featManualScan',
      'pricing.featCycloneDxExport',
      'pricing.featSingleSite',
      'pricing.featBasicWeather'
    ]
  },
  basic: {
    tier: 'basic',
    nameKey: 'pricing.basicName',
    priceMonthly: 3000,
    maxSites: 3,
    featuresKeys: [
      'pricing.featUpTo3Sites',
      'pricing.featDailyMonitoring',
      'pricing.featGhActionsWpSync',
      'pricing.featMultiNotifications',
      'pricing.featPdfReportExport'
    ]
  },
  pro: {
    tier: 'pro',
    nameKey: 'pricing.proName',
    priceMonthly: 5500,
    maxSites: 6,
    isPopular: true,
    featuresKeys: [
      'pricing.featUpTo6Sites',
      'pricing.featAllBasicFeatures',
      'pricing.featPackageHistory',
      'pricing.featPriorityEmergencyAlerts',
      'pricing.featWhiteLabelPdf'
    ]
  }
};
