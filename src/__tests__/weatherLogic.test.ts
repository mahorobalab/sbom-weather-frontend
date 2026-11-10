import { describe, it, expect } from 'vitest';
import type { Vulnerability, Dependency } from '../types';
import {
  calculateWeatherStatus,
  build7DayForecastFromDependencies
} from '../mockData';

export { calculateWeatherStatus };

/**
 * PURL normalization helper (Test Target)
 */
export function normalizeToPurl(ecosystem: string, name: string, version: string): string {
  const cleanVer = version.replace(/^v/, '').trim();
  const safeName = name.trim();
  const eco = ecosystem.toLowerCase();

  if (eco === 'npm' && safeName.startsWith('@')) {
    return `pkg:npm/${encodeURIComponent(safeName)}@${cleanVer}`;
  }
  if (eco === 'wordpress' || eco === 'wp') {
    return `pkg:wordpress/${safeName}@${cleanVer}`;
  }
  return `pkg:composer/${safeName}@${cleanVer}`;
}

describe('SBOM Weather evaluation logic tests', () => {
  it('should return sunny when there are 0 vulnerabilities', () => {
    expect(calculateWeatherStatus([], 0)).toBe('sunny');
  });

  it('should return cloudy for LOW or MEDIUM severity warnings regardless of days', () => {
    const lowVulns: Vulnerability[] = [
      {
        id: 'CVE-2026-0001',
        title: 'Minor bug',
        severity: 'LOW',
        cvss: 2.5,
        packageName: 'sample/pkg',
        affectedVersion: '< 1.0.1',
        fixedVersion: '1.0.1',
        detectedAt: '2026-10-22',
        description: 'Minor non-critical bug'
      }
    ];
    const medVulns: Vulnerability[] = [
      {
        id: 'CVE-2026-0002',
        title: 'XSS flaw',
        severity: 'MEDIUM',
        cvss: 5.3,
        packageName: 'sample/pkg',
        affectedVersion: '< 2.0.0',
        fixedVersion: '2.0.0',
        detectedAt: '2026-10-22',
        description: 'XSS vulnerability'
      }
    ];
    expect(calculateWeatherStatus(lowVulns, 1)).toBe('cloudy');
    expect(calculateWeatherStatus(medVulns, 2)).toBe('cloudy');
    expect(calculateWeatherStatus(medVulns, 10)).toBe('cloudy');
  });

  it('should return rain for CRITICAL/HIGH severity on days 0-2 (initial stage)', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell: Unauthenticated Remote Code Execution (RCE)',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25',
        detectedAt: '2026-10-21',
        description: 'Unauthenticated RCE'
      }
    ];
    expect(calculateWeatherStatus(vulns, 0)).toBe('rain');
    expect(calculateWeatherStatus(vulns, 2)).toBe('rain');
  });

  it('should escalate to thunderstorm when CRITICAL/HIGH vulnerabilities are unaddressed for 3-6 days', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell: Unauthenticated Remote Code Execution (RCE)',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25',
        detectedAt: '2026-10-21',
        description: 'Unauthenticated RCE'
      }
    ];
    expect(calculateWeatherStatus(vulns, 3)).toBe('thunderstorm');
    expect(calculateWeatherStatus(vulns, 6)).toBe('thunderstorm');
  });

  it('should escalate to typhoon when CRITICAL/HIGH vulnerabilities are left unaddressed for 7+ days', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2025-14179',
        title: 'PHP 8.2 < 8.2.31 Critical Vulnerability',
        severity: 'CRITICAL',
        cvss: 9.8,
        packageName: 'php',
        affectedVersion: '< 8.2.31',
        fixedVersion: '8.2.31',
        detectedAt: '2026-05-10',
        description: 'Published in May 2026'
      }
    ];
    expect(calculateWeatherStatus(vulns, 7)).toBe('typhoon');
    expect(calculateWeatherStatus(vulns, 180)).toBe('typhoon');
  });

  it('should build all 7 days as typhoon when a CRITICAL CVE was published more than a week ago (e.g. CVE-2025-14179 on 2026-05-10)', () => {
    const deps: Dependency[] = [
      {
        name: 'php',
        version: '8.2.29',
        ecosystem: 'wordpress',
        vulnerabilities: [
          {
            id: 'CVE-2025-14179',
            title: 'PHP 8.2 < 8.2.31 Critical Vulnerability',
            severity: 'CRITICAL',
            cvss: 9.8,
            packageName: 'php',
            affectedVersion: '< 8.2.31',
            fixedVersion: '8.2.31',
            detectedAt: '2026-05-10',
            description: 'Published 2026-05-10'
          }
        ]
      }
    ];
    const baseDate = new Date(2026, 10, 9); // 2026-11-09
    const forecast = build7DayForecastFromDependencies(deps, 'typhoon', 180, baseDate);
    expect(forecast).toHaveLength(7);
    expect(forecast.every((d) => d.weather === 'typhoon')).toBe(true);
    expect(forecast.every((d) => d.vulnerabilityCount === 1)).toBe(true);
  });

  it('should transition sunny -> rain (days 0-2) -> thunderstorm (days 3+) across the 7-day trend for a newly published CVE', () => {
    const deps: Dependency[] = [
      {
        name: 'php',
        version: '8.2.29',
        ecosystem: 'wordpress',
        vulnerabilities: [
          {
            id: 'CVE-2026-9999',
            title: 'Recent Critical Vulnerability',
            severity: 'CRITICAL',
            cvss: 9.1,
            packageName: 'php',
            affectedVersion: '< 8.2.31',
            fixedVersion: '8.2.31',
            detectedAt: '2026-11-05', // 4 days before 2026-11-09
            description: 'Published 4 days ago'
          }
        ]
      }
    ];
    const baseDate = new Date(2026, 10, 9); // 2026-11-09 (7-day window: 11/03..11/09)
    const forecast = build7DayForecastFromDependencies(deps, 'thunderstorm', 4, baseDate);
    expect(forecast.map((f) => f.weather)).toEqual([
      'sunny',        // 11/03 (-2 days)
      'sunny',        // 11/04 (-1 day)
      'rain',         // 11/05 (day 0)
      'rain',         // 11/06 (day 1)
      'rain',         // 11/07 (day 2)
      'thunderstorm', // 11/08 (day 3)
      'thunderstorm'  // 11/09 (day 4, Today)
    ]);
  });
});

describe('PURL (Package URL) normalization tests', () => {
  it('should properly convert Composer packages to PURL', () => {
    expect(normalizeToPurl('composer', 'laravel/framework', 'v10.35.0')).toBe(
      'pkg:composer/laravel/framework@10.35.0'
    );
  });

  it('should properly URL-encode npm scoped packages with @', () => {
    expect(normalizeToPurl('npm', '@angular/core', 'v16.2.0')).toBe(
      'pkg:npm/%40angular%2Fcore@16.2.0'
    );
  });

  it('should properly normalize WordPress plugin slugs', () => {
    expect(normalizeToPurl('wordpress', 'contact-form-7', '5.7.0')).toBe(
      'pkg:wordpress/contact-form-7@5.7.0'
    );
  });
});
