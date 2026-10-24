import type { ProjectSite, Dependency, Vulnerability } from '../types';

export interface CycloneDXComponent {
  type: string;
  name: string;
  version: string;
  group?: string;
  purl?: string;
  description?: string;
}

export interface CycloneDXVulnerabilityRating {
  source?: { name: string; url?: string };
  score?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'none' | 'unknown';
  method?: string;
}

export interface CycloneDXVulnerability {
  id: string;
  source?: { name: string; url?: string };
  ratings?: CycloneDXVulnerabilityRating[];
  description?: string;
  affects?: Array<{ ref: string }>;
}

export interface CycloneDXBom {
  $schema?: string;
  bomFormat: 'CycloneDX';
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools?: Array<{ vendor?: string; name: string; version?: string }>;
    component?: {
      type: string;
      name: string;
      version?: string;
    };
  };
  components: CycloneDXComponent[];
  vulnerabilities?: CycloneDXVulnerability[];
}

/**
 * Generates a standard Package URL (PURL) from dependency details
 */
export function generatePurl(ecosystem: string, name: string, version: string): string {
  const cleanVersion = version.replace(/^v/, '').trim();
  const safeName = name.trim();
  const lowerEco = ecosystem.toLowerCase();

  if (lowerEco === 'npm' || lowerEco === 'javascript') {
    if (safeName.startsWith('@')) {
      const parts = safeName.split('/');
      if (parts.length === 2) {
        return `pkg:npm/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}@${cleanVersion}`;
      }
    }
    return `pkg:npm/${encodeURIComponent(safeName)}@${cleanVersion}`;
  }

  if (lowerEco === 'wordpress' || lowerEco === 'wp') {
    return `pkg:wordpress/${safeName}@${cleanVersion}`;
  }

  return `pkg:composer/${safeName}@${cleanVersion}`;
}

/**
 * Determines whether the given JSON object adheres to CycloneDX format
 */
export function isCycloneDX(json: any): boolean {
  if (!json || typeof json !== 'object') return false;
  if (json.bomFormat && String(json.bomFormat).toLowerCase() === 'cyclonedx') return true;
  if (Array.isArray(json.components) && (json.specVersion || json.$schema?.includes('cyclonedx'))) return true;
  return false;
}

/**
 * Parses a CycloneDX JSON object into internal Dependency objects
 */
export function parseCycloneDX(json: any): { dependencies: Dependency[]; ecosystem: 'composer' | 'npm' | 'wordpress' } {
  const components: any[] = Array.isArray(json.components) ? json.components : [];
  const rawVulns: any[] = Array.isArray(json.vulnerabilities) ? json.vulnerabilities : [];

  let detectedEcosystem: 'composer' | 'npm' | 'wordpress' = 'composer';
  let npmCount = 0;
  let composerCount = 0;
  let wpCount = 0;

  const dependencies: Dependency[] = components.map((comp: any) => {
    let name = comp.name || 'unknown';
    if (comp.group && !name.includes('/')) {
      name = `${comp.group}/${name}`;
    }

    const version = comp.version || 'unknown';
    const purl = comp.purl || '';
    let depEcosystem: 'composer' | 'npm' | 'wordpress' = 'composer';

    if (purl.toLowerCase().startsWith('pkg:npm/')) {
      depEcosystem = 'npm';
      npmCount++;
    } else if (purl.toLowerCase().startsWith('pkg:wordpress/') || purl.toLowerCase().startsWith('pkg:wp/')) {
      depEcosystem = 'wordpress';
      wpCount++;
    } else if (purl.toLowerCase().startsWith('pkg:composer/') || purl.toLowerCase().startsWith('pkg:packagist/')) {
      depEcosystem = 'composer';
      composerCount++;
    }

    // Map any embedded CycloneDX vulnerabilities
    const matchedVulns: Vulnerability[] = [];
    rawVulns.forEach((rv: any) => {
      const affectsMatch = Array.isArray(rv.affects) && rv.affects.some((a: any) => {
        return a.ref === comp['bom-ref'] || (comp.purl && a.ref === comp.purl) || (rv.id && rv.id.toLowerCase().includes(name.toLowerCase()));
      });

      if (affectsMatch) {
        const rating = rv.ratings?.[0] || {};
        const sevStr = String(rating.severity || 'MEDIUM').toUpperCase();
        const severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
          sevStr.includes('CRIT') ? 'CRITICAL' : sevStr.includes('HIGH') ? 'HIGH' : sevStr.includes('LOW') ? 'LOW' : 'MEDIUM';

        matchedVulns.push({
          id: rv.id || 'CVE-UNKNOWN',
          title: rv.description ? rv.description.slice(0, 80) : `${name} vulnerability`,
          severity,
          cvss: typeof rating.score === 'number' ? rating.score : (severity === 'CRITICAL' ? 9.0 : severity === 'HIGH' ? 7.5 : 5.0),
          packageName: name,
          affectedVersion: `< ${version}`,
          fixedVersion: 'Recommended upgrade',
          detectedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          description: rv.description || rv.detail || 'Detected via CycloneDX SBOM specification.'
        });
      }
    });

    return {
      name,
      version,
      ecosystem: depEcosystem,
      vulnerabilities: matchedVulns
    };
  });

  if (npmCount > composerCount && npmCount > wpCount) {
    detectedEcosystem = 'npm';
  } else if (wpCount > composerCount && wpCount > npmCount) {
    detectedEcosystem = 'wordpress';
  } else {
    detectedEcosystem = 'composer';
  }

  return { dependencies, ecosystem: detectedEcosystem };
}

/**
 * Exports current ProjectSite information as CycloneDX 1.5 JSON
 */
export function exportToCycloneDX(site: ProjectSite): string {
  const timestamp = new Date().toISOString();
  const serialNumber = `urn:uuid:${
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '3e671687-395b-41f5-a30f-' + Math.random().toString(16).substring(2, 14)
  }`;

  const allVulns: CycloneDXVulnerability[] = [];

  const components: CycloneDXComponent[] = site.dependencies.map((dep) => {
    const purl = generatePurl(dep.ecosystem, dep.name, dep.version);

    // Map vulnerabilities if present
    if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
      dep.vulnerabilities.forEach((v) => {
        allVulns.push({
          id: v.id,
          source: {
            name: 'SBOM Weather / OSV.dev',
            url: `https://osv.dev/vulnerability/${v.id}`
          },
          ratings: [
            {
              source: { name: 'NVD / CVSS' },
              score: v.cvss,
              severity: v.severity.toLowerCase() as any,
              method: 'CVSSv31'
            }
          ],
          description: v.description,
          affects: [{ ref: purl }]
        });
      });
    }

    return {
      type: 'library',
      name: dep.name,
      version: dep.version,
      purl
    };
  });

  const bom: CycloneDXBom = {
    $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      timestamp,
      tools: [
        {
          vendor: 'Mahoroba Lab',
          name: 'SBOM Weather',
          version: '1.0.0'
        }
      ],
      component: {
        type: 'application',
        name: site.name,
        version: '1.0.0'
      }
    },
    components,
    ...(allVulns.length > 0 ? { vulnerabilities: allVulns } : {})
  };

  return JSON.stringify(bom, null, 2);
}

/**
 * Triggers a client-side file download of the CycloneDX JSON
 */
export function downloadCycloneDXFile(site: ProjectSite): void {
  const jsonContent = exportToCycloneDX(site);
  const blob = new Blob([jsonContent], { type: 'application/vnd.cyclonedx+json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = site.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  anchor.href = url;
  anchor.download = `sbom-weather-${safeName}-cyclonedx.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
