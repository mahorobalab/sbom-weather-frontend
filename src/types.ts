export type WeatherStatus = 'sunny' | 'cloudy' | 'rain' | 'thunderstorm' | 'typhoon';

export interface Vulnerability {
  id: string; // e.g. CVE-2026-109618
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cvss: number;
  packageName: string;
  affectedVersion: string;
  fixedVersion: string;
  detectedAt: string;
  description: string;
}

export interface Dependency {
  name: string;
  version: string;
  ecosystem: 'composer' | 'npm' | 'wordpress';
  vulnerabilities: Vulnerability[];
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "月", "火", "水", etc.
  weather: WeatherStatus;
  summary: string;
  vulnerabilityCount: number;
}

export interface ProjectSite {
  id: string;
  name: string;
  url: string;
  ecosystem: 'composer' | 'npm' | 'wordpress';
  syncMethod: 'actions' | 'wp_plugin' | 'wp_cli' | 'crawler';
  isVerified: boolean;
  verificationToken: string;
  currentWeather: WeatherStatus;
  lastScannedAt: string;
  daysUnresolved: number; // 7日以上で台風
  dependencies: Dependency[];
  forecast: DayForecast[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  addedAt: string;
}
