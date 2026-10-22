import { describe, it, expect } from 'vitest';
import type { Vulnerability, WeatherStatus } from '../types';

// お天気ステータス判定ロジック (テスト対象)
export function calculateWeatherStatus(
  vulnerabilities: Vulnerability[],
  daysUnresolved: number
): WeatherStatus {
  if (vulnerabilities.length === 0) return 'sunny';

  const hasCriticalOrHigh = vulnerabilities.some(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH' || v.cvss >= 7.0
  );

  // 7日以上未対処かつ重大な脆弱性がある場合は「台風」
  if (daysUnresolved >= 7 && hasCriticalOrHigh) {
    return 'typhoon';
  }

  // 重大脆弱性があれば「雷雨」
  if (hasCriticalOrHigh) {
    return 'thunderstorm';
  }

  // 中程度脆弱性があれば「雨」
  const hasMedium = vulnerabilities.some((v) => v.severity === 'MEDIUM' || v.cvss >= 4.0);
  if (hasMedium) {
    return 'rain';
  }

  return 'cloudy';
}

// PURL正規化ヘルパー (テスト対象)
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

describe('SBOM Weather お天気判定ロジックのテスト', () => {
  it('脆弱性0件の場合は「快晴 (sunny)」を返すこと', () => {
    expect(calculateWeatherStatus([], 0)).toBe('sunny');
  });

  it('LOWレベルの軽微な警告の場合は「曇り (cloudy)」を返すこと', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-0001',
        title: 'Minor bug',
        severity: 'LOW',
        cvss: 2.5,
        packageName: 'sample/pkg',
        affectedVersion: '< 1.0.1',
        fixedVersion: '1.0.1',
        detectedAt: '2026-10-22'
      }
    ];
    expect(calculateWeatherStatus(vulns, 1)).toBe('cloudy');
  });

  it('MEDIUMレベルの脆弱性の場合は「雨 (rain)」を返すこと', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-0002',
        title: 'XSS flaw',
        severity: 'MEDIUM',
        cvss: 5.3,
        packageName: 'sample/pkg',
        affectedVersion: '< 2.0.0',
        fixedVersion: '2.0.0',
        detectedAt: '2026-10-22'
      }
    ];
    expect(calculateWeatherStatus(vulns, 2)).toBe('rain');
  });

  it('php2shellなどCRITICALレベルの場合は「雷雨 (thunderstorm)」を返すこと', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell: 未認証リモートコード実行 (RCE)',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25',
        detectedAt: '2026-10-21'
      }
    ];
    expect(calculateWeatherStatus(vulns, 1)).toBe('thunderstorm');
  });

  it('CRITICAL/HIGH脆弱性が7日以上放置されている場合は「台風 (typhoon)」へ悪化すること', () => {
    const vulns: Vulnerability[] = [
      {
        id: 'CVE-2026-109618',
        title: 'php2shell RCE',
        severity: 'CRITICAL',
        cvss: 9.2,
        packageName: 'php',
        affectedVersion: '< 8.2.25',
        fixedVersion: '8.2.25',
        detectedAt: '2026-10-14'
      }
    ];
    expect(calculateWeatherStatus(vulns, 8)).toBe('typhoon');
  });
});

describe('PURL (Package URL) 表記揺れ正規化のテスト', () => {
  it('ComposerパッケージをPURLへ正しく変換すること', () => {
    expect(normalizeToPurl('composer', 'laravel/framework', 'v10.35.0')).toBe(
      'pkg:composer/laravel/framework@10.35.0'
    );
  });

  it('npmスコープパッケージ（@付き）を正しくURLエンコードして変換すること', () => {
    expect(normalizeToPurl('npm', '@angular/core', 'v16.2.0')).toBe(
      'pkg:npm/%40angular%2Fcore@16.2.0'
    );
  });

  it('WordPressプラグインのスラッグを正しく正規化すること', () => {
    expect(normalizeToPurl('wordpress', 'contact-form-7', '5.7.0')).toBe(
      'pkg:wordpress/contact-form-7@5.7.0'
    );
  });
});
