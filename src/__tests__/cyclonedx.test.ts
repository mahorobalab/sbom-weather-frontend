import { describe, it, expect } from 'vitest';
import {
  generatePurl,
  isCycloneDX,
  parseCycloneDX,
  exportToCycloneDX
} from '../lib/cyclonedx';
import type { ProjectSite } from '../types';

describe('CycloneDX utilities', () => {
  it('generatePurl correctly formats package URLs for composer, npm, and wordpress', () => {
    expect(generatePurl('composer', 'laravel/framework', '10.35.0')).toBe('pkg:composer/laravel/framework@10.35.0');
    expect(generatePurl('npm', 'express', '4.19.2')).toBe('pkg:npm/express@4.19.2');
    expect(generatePurl('npm', '@vitejs/plugin-react', '4.3.0')).toBe('pkg:npm/%40vitejs/plugin-react@4.3.0');
    expect(generatePurl('wordpress', 'contact-form-7', '5.9.0')).toBe('pkg:wordpress/contact-form-7@5.9.0');
  });

  it('isCycloneDX accurately identifies CycloneDX payloads', () => {
    expect(isCycloneDX({ bomFormat: 'CycloneDX', specVersion: '1.5' })).toBe(true);
    expect(isCycloneDX({ specVersion: '1.4', components: [] })).toBe(true);
    expect(isCycloneDX({ packages: [] })).toBe(false);
    expect(isCycloneDX(null)).toBe(false);
  });

  it('parseCycloneDX extracts components and determines ecosystem', () => {
    const mockBom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      components: [
        {
          type: 'library',
          name: 'framework',
          group: 'laravel',
          version: '10.35.0',
          purl: 'pkg:composer/laravel/framework@10.35.0'
        },
        {
          type: 'library',
          name: 'monolog/monolog',
          version: '3.5.0',
          purl: 'pkg:composer/monolog/monolog@3.5.0'
        }
      ]
    };

    const { dependencies, ecosystem } = parseCycloneDX(mockBom);
    expect(dependencies.length).toBe(2);
    expect(dependencies[0].name).toBe('laravel/framework');
    expect(dependencies[0].version).toBe('10.35.0');
    expect(dependencies[0].ecosystem).toBe('composer');
    expect(ecosystem).toBe('composer');
  });

  it('exportToCycloneDX creates valid CycloneDX 1.5 JSON with components and vulnerabilities', () => {
    const mockSite: ProjectSite = {
      id: 'test-site',
      name: 'Test Project',
      url: 'https://test.example.com',
      ecosystem: 'composer',
      syncMethod: 'actions',
      isVerified: true,
      verificationToken: 'token_123',
      currentWeather: 'thunderstorm',
      lastScannedAt: 'Just now',
      daysUnresolved: 1,
      dependencies: [
        {
          name: 'php',
          version: '8.2.14',
          ecosystem: 'composer',
          vulnerabilities: [
            {
              id: 'CVE-2026-109618',
              title: 'php2shell RCE',
              severity: 'CRITICAL',
              cvss: 9.2,
              packageName: 'php',
              affectedVersion: '< 8.2.25',
              fixedVersion: '8.2.25',
              detectedAt: '2026-10-24 14:00',
              description: 'Remote code execution vulnerability in PHP query parsing.'
            }
          ]
        }
      ],
      forecast: []
    };

    const jsonString = exportToCycloneDX(mockSite);
    const parsed = JSON.parse(jsonString);

    expect(parsed.bomFormat).toBe('CycloneDX');
    expect(parsed.specVersion).toBe('1.5');
    expect(parsed.metadata.component.name).toBe('Test Project');
    expect(parsed.components.length).toBe(1);
    expect(parsed.components[0].name).toBe('php');
    expect(parsed.components[0].purl).toBe('pkg:composer/php@8.2.14');
    expect(parsed.vulnerabilities.length).toBe(1);
    expect(parsed.vulnerabilities[0].id).toBe('CVE-2026-109618');
    expect(parsed.vulnerabilities[0].ratings[0].score).toBe(9.2);
  });
});
