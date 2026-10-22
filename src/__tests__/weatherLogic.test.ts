import { describe, it, expect } from 'vitest';
import type { Vulnerability, WeatherStatus } from '../types';

/**
 * Weather status evaluation logic (Test Target)
 */
export function calculateWeatherStatus(
  vulnerabilities: Vulnerability[],
  daysUnresolved: number
): WeatherStatus {
  if (vulnerabilities.length === 0) return 'sunny';

  const hasCriticalOrHigh = vulnerabilities.some(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH' || v.cvss >= 7.0
  );

  // Severe vulnerabilities unaddressed for 7+ days escalate to "typhoon"
  if (daysUnresolved >= 7 && hasCriticalOrHigh) {
    return 'typhoon';
  }

  // Critical/High severity returns "thunderstorm"
  if (hasCriticalOrHigh) {
    return 'thunderstorm';
  }

  // Medium severity returns "rain"
  const hasMedium = vulnerabilities.some((v) => v.severity === 'MEDIUM' || v.cvss >= 4.0);
  if (hasMedium) {
    return 'rain';
  }

  return 'cloudy';
}

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

  it('should return cloudy for minor LOW severity warnings', () => {
    const vulns: Vulnerability[] = [
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
    expect(calculateWeatherStatus(vulns, 1)).toBe('cloudy');
  });

  it('should return rain for MEDIUM severity vulnerabilities', () => {
    const vulns: Vulnerability[] = [
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
    expect(calculateWeatherStatus(vulns, 2)).toBe('rain');
  });

  it('should return thunderstorm for CRITICAL severity (e.g., php2shell)', () => {
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
    expect(calculateWeatherStatus(vulns, 1)).toBe('thunderstorm');
  });

  it('should escalate to typhoon when CRITICAL/HIGH vulnerabilities are left unaddressed for 7+ days', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell RCE',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25',
        detectedAt: '2026-10-14',
        description: 'Unaddressed RCE left unattended'
      }
    ];
    expect(calculateWeatherStatus(vulns, 8)).toBe('typhoon');
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
