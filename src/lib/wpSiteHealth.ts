import type { Dependency } from '../types';

const WP_PLUGIN_DISPLAY_NAME_TO_SLUG: Record<string, string> = {
  'sbom weather connector': 'sbom-weather-connector',
  'contact form 7': 'contact-form-7',
  'yoast seo': 'wordpress-seo',
  'akismet anti-spam: spam protection': 'akismet',
  'akismet anti-spam': 'akismet',
  'all-in-one wp migration and backup': 'all-in-one-wp-migration',
  'all-in-one wp migration': 'all-in-one-wp-migration',
  'updraftplus - backup/restore': 'updraftplus',
  'wordfence security': 'wordfence',
  'site kit by google': 'google-site-kit',
  'really simple security': 'really-simple-ssl',
  'really simple ssl': 'really-simple-ssl',
  'elementor website builder': 'elementor',
  'elementor': 'elementor',
  'woocommerce': 'woocommerce',
  'classic editor': 'classic-editor',
  'classic widgets': 'classic-widgets',
  'wp multibyte patch': 'wp-multibyte-patch',
  'advanced custom fields (acf)': 'advanced-custom-fields',
  'advanced custom fields': 'advanced-custom-fields',
  'custom post type ui': 'custom-post-type-ui',
  'wp mail smtp by wpforms': 'wp-mail-smtp',
  'wp mail smtp': 'wp-mail-smtp',
  'wpforms lite': 'wpforms-lite',
  'monsterinsights - google analytics dashboard for wordpress': 'google-analytics-for-wordpress',
  'all in one seo': 'all-in-one-seo-pack',
  'siteguard wp plugin': 'siteguard',
  'backwpup - wordpress backup & restore plugin': 'backwpup',
  'backwpup': 'backwpup',
  'ewww image optimizer': 'ewww-image-optimizer',
  'litespeed cache': 'litespeed-cache',
  'wp super cache': 'wp-super-cache',
  'w3 total cache': 'w3-total-cache',
  'wp fastest cache': 'wp-fastest-cache',
  'autoptimize': 'autoptimize',
  'redirection': 'redirection',
  'duplicate post': 'duplicate-post',
  'yoast duplicate post': 'duplicate-post',
  'tablepress': 'tablepress',
  'xml sitemaps': 'google-sitemap-generator',
  'xml sitemap & google news': 'xml-sitemap-feed'
};

/**
 * Checks if a raw plugin/theme name is deterministically known without querying WordPress.org API
 */
export function isKnownWpDisplayName(rawName: string, kind: 'plugin' | 'theme'): boolean {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return true;
  if (/\([a-z0-9_-]+\)\s*$/i.test(trimmed)) return true;
  if (/^[a-z0-9_-]+$/.test(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  if (kind === 'plugin' && WP_PLUGIN_DISPLAY_NAME_TO_SLUG[lower]) return true;
  if (kind === 'theme' && /^twenty\s+[a-z-\s]+$/i.test(lower)) return true;

  const baseName = lower.split(/\s+[-|:]\s+|:\s+/)[0].trim();
  if (kind === 'plugin' && WP_PLUGIN_DISPLAY_NAME_TO_SLUG[baseName]) return true;

  return false;
}

export interface ParsedWpSiteHealth {
  dependencies: Dependency[];
  wpVersion?: string;
  phpVersion?: string;
  activeTheme?: string;
  environmentType?: string;
}

/**
 * Checks whether the given raw text is from WordPress Site Health Info ("Copy site info to clipboard")
 */
export function isWpSiteHealthText(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;
  return (
    /###\s*wp-core\s*###/i.test(rawText) ||
    /###\s*wp-active-theme\s*###/i.test(rawText) ||
    /###\s*wp-plugins-(?:active|inactive)/i.test(rawText) ||
    /###\s*wp-server\s*###/i.test(rawText)
  );
}

/**
 * Extracts a clean semantic version and optional latestVersion from Site Health version fields
 * e.g. "8.2.29 64bit" -> { version: "8.2.29" }
 * e.g. "5.8.1 (latest version: 5.9.8)" -> { version: "5.8.1", latestVersion: "5.9.8" }
 */
export function cleanWpVersion(rawVersion: string): { version: string; latestVersion?: string } {
  const raw = String(rawVersion || '').trim();
  if (!raw || raw === '(undefined)' || raw === 'undefined') {
    return { version: 'unknown' };
  }

  let latestVersion: string | undefined;
  const latestMatch = raw.match(/\(latest version:\s*([^)]+)\)/i);
  if (latestMatch) {
    latestVersion = latestMatch[1].trim();
  }

  const stripped = raw
    .replace(/\s*\(latest version:[^)]*\)/i, '')
    .replace(/\s+\d+bit\b/i, '')
    .replace(/^[vV]/, '')
    .trim();

  const tokenMatch = stripped.match(/^([0-9]+(?:\.[0-9a-zA-Z_-]+)*)/);
  return {
    version: tokenMatch ? tokenMatch[1] : stripped || 'unknown',
    ...(latestVersion ? { latestVersion } : {})
  };
}

/**
 * Normalizes a WordPress plugin or theme display name from Site Health Info into its canonical slug
 */
export function normalizeWpSlug(
  rawName: string,
  kind: 'plugin' | 'theme'
): { slug: string; displayName: string } {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) {
    return { slug: 'unknown', displayName: 'Unknown' };
  }

  // Case 1: Active/Parent theme format "Twenty Twenty-Five (twentytwentyfive)"
  const parenMatch = trimmed.match(/^(.+?)\s*\(([a-z0-9_-]+)\)\s*$/i);
  if (parenMatch) {
    return {
      displayName: parenMatch[1].trim(),
      slug: parenMatch[2].toLowerCase()
    };
  }

  const lower = trimmed.toLowerCase();

  // Case 2: Known plugin display name to slug mapping
  if (kind === 'plugin' && WP_PLUGIN_DISPLAY_NAME_TO_SLUG[lower]) {
    return {
      displayName: trimmed,
      slug: WP_PLUGIN_DISPLAY_NAME_TO_SLUG[lower]
    };
  }

  // Case 3: Official WordPress default themes ("Twenty Twenty-Four" -> "twentytwentyfour")
  if (kind === 'theme' && /^twenty\s+[a-z-\s]+$/i.test(lower)) {
    return {
      displayName: trimmed,
      slug: lower.replace(/[^a-z0-9]/g, '')
    };
  }

  // Case 4: Strip subtitle after " - ", ": ", " | " and convert to kebab-case
  const baseName = lower.split(/\s+[-|:]\s+|:\s+/)[0].trim();
  if (kind === 'plugin' && WP_PLUGIN_DISPLAY_NAME_TO_SLUG[baseName]) {
    return {
      displayName: trimmed,
      slug: WP_PLUGIN_DISPLAY_NAME_TO_SLUG[baseName]
    };
  }

  const slug = baseName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return {
    displayName: trimmed,
    slug: slug || lower.replace(/\s+/g, '-')
  };
}

/**
 * Parses a single plugin or inactive theme line from WordPress Site Health Info.
 * Handles plugin names that themselves contain colons (e.g. "Akismet Anti-spam: Spam Protection: version: 5.3, author: ...")
 */
function parseComponentLine(line: string): {
  name: string;
  version: string;
  latestVersion?: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Match "<Label>: version: <ver>..., author: ..." OR "<Label>: author: ..., version: <ver>..."
  const verFirstMatch = trimmed.match(/^(.+?):\s*version:\s*([^,]+?)(?:,\s*author:\s*(.+))?$/i);
  if (verFirstMatch) {
    const label = verFirstMatch[1].trim();
    const { version, latestVersion } = cleanWpVersion(verFirstMatch[2]);
    return { name: label, version, latestVersion };
  }

  const authorFirstMatch = trimmed.match(/^(.+?):\s*author:\s*[^,]+,\s*version:\s*([^,]+?)(?:,.*)?$/i);
  if (authorFirstMatch) {
    const label = authorFirstMatch[1].trim();
    const { version, latestVersion } = cleanWpVersion(authorFirstMatch[2]);
    return { name: label, version, latestVersion };
  }

  return null;
}

/**
 * Parses WordPress Site Health Info clipboard text (`### wp-core ###` format) into Dependency objects
 */
export function parseWpSiteHealthText(rawText: string): ParsedWpSiteHealth {
  const cleanedText = String(rawText || '')
    .trim()
    .replace(/^`+|\s*`+$/g, '')
    .trim();

  const lines = cleanedText.split(/\r?\n/);
  const sections = new Map<string, string[]>();
  let currentSection = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = line.match(/^###\s*([a-z0-9_-]+)(?:\s*\(\d+\))?\s*###$/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, []);
      }
      continue;
    }

    if (currentSection) {
      sections.get(currentSection)!.push(line);
    }
  }

  const dependencies: Dependency[] = [];
  const addedKeys = new Set<string>();

  const addDep = (dep: Dependency) => {
    const key = `${dep.componentType || 'package'}:${dep.name.toLowerCase()}`;
    if (addedKeys.has(key)) return;
    addedKeys.add(key);
    dependencies.push(dep);
  };

  let wpVersion: string | undefined;
  let phpVersion: string | undefined;
  let activeTheme: string | undefined;
  let environmentType: string | undefined;

  // 1. Parse wp-server (PHP runtime)
  const serverLines = sections.get('wp-server') || [];
  for (const line of serverLines) {
    const kv = line.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === 'php_version') {
      const parsed = cleanWpVersion(val);
      if (parsed.version && parsed.version !== 'unknown') {
        phpVersion = parsed.version;
        addDep({
          name: 'php',
          displayName: 'PHP',
          version: parsed.version,
          ecosystem: 'wordpress',
          componentType: 'runtime',
          active: true,
          vulnerabilities: []
        });
      }
    }
  }

  // 2. Parse wp-core (WordPress Core)
  const coreLines = sections.get('wp-core') || [];
  for (const line of coreLines) {
    const kv = line.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === 'version') {
      const parsed = cleanWpVersion(val);
      if (parsed.version && parsed.version !== 'unknown') {
        wpVersion = parsed.version;
        addDep({
          name: 'wordpress',
          displayName: 'WordPress Core',
          version: parsed.version,
          latestVersion: parsed.latestVersion,
          ecosystem: 'wordpress',
          componentType: 'core',
          active: true,
          vulnerabilities: []
        });
      }
    } else if (key === 'environment_type') {
      environmentType = val;
    }
  }

  // 3. Parse wp-active-theme
  const activeThemeLines = sections.get('wp-active-theme') || [];
  let activeThemeRawName = '';
  let activeThemeVer = '';
  let activeThemeLatest: string | undefined;
  for (const line of activeThemeLines) {
    const kv = line.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === 'name') {
      activeThemeRawName = val;
    } else if (key === 'version') {
      const parsed = cleanWpVersion(val);
      activeThemeVer = parsed.version;
      activeThemeLatest = parsed.latestVersion;
    }
  }
  if (activeThemeRawName && activeThemeVer) {
    const { slug, displayName } = normalizeWpSlug(activeThemeRawName, 'theme');
    activeTheme = displayName;
    addDep({
      name: slug,
      displayName,
      version: activeThemeVer,
      latestVersion: activeThemeLatest,
      ecosystem: 'wordpress',
      componentType: 'theme',
      active: true,
      vulnerabilities: []
    });
  }

  // 4. Parse wp-parent-theme (when child theme is used)
  const parentThemeLines = sections.get('wp-parent-theme') || [];
  let parentThemeRawName = '';
  let parentThemeVer = '';
  let parentThemeLatest: string | undefined;
  for (const line of parentThemeLines) {
    const kv = line.match(/^([a-z0-9_]+):\s*(.+)$/i);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    const val = kv[2].trim();
    if (key === 'name') {
      parentThemeRawName = val;
    } else if (key === 'version') {
      const parsed = cleanWpVersion(val);
      parentThemeVer = parsed.version;
      parentThemeLatest = parsed.latestVersion;
    }
  }
  if (parentThemeRawName && parentThemeVer) {
    const { slug, displayName } = normalizeWpSlug(parentThemeRawName, 'theme');
    addDep({
      name: slug,
      displayName,
      version: parentThemeVer,
      latestVersion: parentThemeLatest,
      ecosystem: 'wordpress',
      componentType: 'theme',
      active: true,
      vulnerabilities: []
    });
  }

  // 5. Parse wp-plugins-active and wp-mu-plugins
  const activePluginLines = [
    ...(sections.get('wp-mu-plugins') || []),
    ...(sections.get('wp-plugins-active') || [])
  ];
  for (const line of activePluginLines) {
    const item = parseComponentLine(line);
    if (!item) continue;
    const { slug, displayName } = normalizeWpSlug(item.name, 'plugin');
    addDep({
      name: slug,
      displayName,
      needsSlugResolution: !isKnownWpDisplayName(item.name, 'plugin'),
      version: item.version,
      latestVersion: item.latestVersion,
      ecosystem: 'wordpress',
      componentType: 'plugin',
      active: true,
      vulnerabilities: []
    });
  }

  // 6. Parse wp-plugins-inactive
  const inactivePluginLines = sections.get('wp-plugins-inactive') || [];
  for (const line of inactivePluginLines) {
    const item = parseComponentLine(line);
    if (!item) continue;
    const { slug, displayName } = normalizeWpSlug(item.name, 'plugin');
    addDep({
      name: slug,
      displayName,
      needsSlugResolution: !isKnownWpDisplayName(item.name, 'plugin'),
      version: item.version,
      latestVersion: item.latestVersion,
      ecosystem: 'wordpress',
      componentType: 'plugin',
      active: false,
      vulnerabilities: []
    });
  }

  // 7. Parse wp-themes-inactive
  const inactiveThemeLines = sections.get('wp-themes-inactive') || [];
  for (const line of inactiveThemeLines) {
    const item = parseComponentLine(line);
    if (!item) continue;
    const { slug, displayName } = normalizeWpSlug(item.name, 'theme');
    addDep({
      name: slug,
      displayName,
      needsSlugResolution: !isKnownWpDisplayName(item.name, 'theme'),
      version: item.version,
      latestVersion: item.latestVersion,
      ecosystem: 'wordpress',
      componentType: 'theme',
      active: false,
      vulnerabilities: []
    });
  }

  return {
    dependencies,
    wpVersion,
    phpVersion,
    activeTheme,
    environmentType
  };
}

