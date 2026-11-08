import { describe, it, expect } from 'vitest';
import {
  isWpSiteHealthText,
  cleanWpVersion,
  normalizeWpSlug,
  parseWpSiteHealthText
} from '../lib/wpSiteHealth';

const SAMPLE_SITE_HEALTH = `
### wp-core ###

version: 7.1.4
site_language: ja
user_language: ja
environment_type: local

### wp-active-theme ###

name: Twenty Twenty-Five (twentytwentyfive)
version: 1.5
parent_theme: none

### wp-themes-inactive (2) ###

Twenty Twenty-Four: version: 1.6, author: the WordPress team, Auto-updates disabled
Twenty Twenty-Three: version: 1.7, author: the WordPress team, Auto-updates disabled

### wp-plugins-active (2) ###

SBOM Weather Connector: version: 1.1.0, author: SBOM Weather Team, Auto-updates disabled
Akismet Anti-spam: Spam Protection: version: 5.3.1 (latest version: 5.3.5), author: Automattic, Auto-updates disabled

### wp-plugins-inactive (1) ###

Yoast SEO: version: 23.4, author: Team Yoast, Auto-updates disabled

### wp-server ###

server_architecture: Windows NT 10.0 AMD64
httpd_software: nginx/1.26.1
php_version: 8.2.29 64bit
php_sapi: cgi-fcgi
`;

describe('WordPress Site Health Info Parser (wpSiteHealth)', () => {
  it('detects WordPress Site Health Info text accurately', () => {
    expect(isWpSiteHealthText(SAMPLE_SITE_HEALTH)).toBe(true);
    expect(isWpSiteHealthText('{"packages": []}')).toBe(false);
  });

  it('cleans PHP 64bit suffix and latest version annotations', () => {
    expect(cleanWpVersion('8.2.29 64bit')).toEqual({ version: '8.2.29' });
    expect(cleanWpVersion('5.3.1 (latest version: 5.3.5)')).toEqual({
      version: '5.3.1',
      latestVersion: '5.3.5'
    });
  });

  it('normalizes display names of themes and plugins into WordPress slugs', () => {
    expect(normalizeWpSlug('Twenty Twenty-Five (twentytwentyfive)', 'theme')).toEqual({
      displayName: 'Twenty Twenty-Five',
      slug: 'twentytwentyfive'
    });
    expect(normalizeWpSlug('Twenty Twenty-Four', 'theme')).toEqual({
      displayName: 'Twenty Twenty-Four',
      slug: 'twentytwentyfour'
    });
    expect(normalizeWpSlug('SBOM Weather Connector', 'plugin')).toEqual({
      displayName: 'SBOM Weather Connector',
      slug: 'sbom-weather-connector'
    });
    expect(normalizeWpSlug('Yoast SEO', 'plugin')).toEqual({
      displayName: 'Yoast SEO',
      slug: 'wordpress-seo'
    });
  });

  it('parses Core, PHP, Active/Inactive Themes, and Active/Inactive Plugins from Site Health text', () => {
    const parsed = parseWpSiteHealthText(SAMPLE_SITE_HEALTH);
    expect(parsed.wpVersion).toBe('7.1.4');
    expect(parsed.phpVersion).toBe('8.2.29');
    expect(parsed.activeTheme).toBe('Twenty Twenty-Five');

    const byName = new Map(parsed.dependencies.map((d) => [d.name, d]));
    expect(byName.get('php')?.version).toBe('8.2.29');
    expect(byName.get('php')?.componentType).toBe('runtime');

    expect(byName.get('wordpress')?.version).toBe('7.1.4');
    expect(byName.get('wordpress')?.componentType).toBe('core');

    expect(byName.get('twentytwentyfive')?.version).toBe('1.5');
    expect(byName.get('twentytwentyfive')?.active).toBe(true);

    expect(byName.get('twentytwentyfour')?.version).toBe('1.6');
    expect(byName.get('twentytwentyfour')?.active).toBe(false);

    expect(byName.get('sbom-weather-connector')?.version).toBe('1.1.0');
    expect(byName.get('sbom-weather-connector')?.active).toBe(true);

    expect(byName.get('akismet')?.version).toBe('5.3.1');
    expect(byName.get('akismet')?.latestVersion).toBe('5.3.5');
    expect(byName.get('akismet')?.needsSlugResolution).toBe(false);

    expect(byName.get('wordpress-seo')?.version).toBe('23.4');
    expect(byName.get('wordpress-seo')?.active).toBe(false);
    expect(byName.get('wordpress-seo')?.needsSlugResolution).toBe(false);
  });

  it('flags unknown plugin display names with needsSlugResolution=true for backend D1/WP.org lookup', () => {
    const customSiteHealth = `
### wp-core ###
version: 6.7.2

### wp-plugins-active (1) ###
Custom Unknown Enterprise Plugin: version: 2.1.0, author: Acme Corp
`;
    const parsed = parseWpSiteHealthText(customSiteHealth);
    const customPlugin = parsed.dependencies.find((d) => d.componentType === 'plugin');
    expect(customPlugin).toBeDefined();
    expect(customPlugin?.displayName).toBe('Custom Unknown Enterprise Plugin');
    expect(customPlugin?.needsSlugResolution).toBe(true);
  });
});

