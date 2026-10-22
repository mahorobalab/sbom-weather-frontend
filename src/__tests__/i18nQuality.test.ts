import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Unicode regex matching Hiragana, Katakana, CJK Unified Ideographs, and Fullwidth Forms
const JAPANESE_CHAR_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/;

/**
 * Recursively find all source files in a directory.
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files: string[] = fs.readdirSync(dirPath);

  files.forEach((file: string) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Extract all nested keys in dot notation.
 */
function getNestedKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n Quality and Cleanliness Assurance', () => {
  it('should not contain any direct Japanese characters or comments in source files outside ja.json', () => {
    const srcDir = path.resolve(__dirname, '..');
    const allFiles = getAllFiles(srcDir);

    const violations: { file: string; line: number; content: string }[] = [];

    allFiles.forEach((filePath: string) => {
      // Allow Japanese in locale dictionary file ja.json only
      const normalized = filePath.replace(/\\/g, '/');
      if (normalized.endsWith('/locales/ja.json')) {
        return;
      }

      // Check only source code files
      if (!/\.(ts|tsx|js|jsx|css|html)$/.test(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines: string[] = content.split('\n');

      lines.forEach((line: string, index: number) => {
        if (JAPANESE_CHAR_REGEX.test(line)) {
          violations.push({
            file: path.relative(srcDir, filePath),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });

    const errorMessage = violations
      .map((v) => `[${v.file}:${v.line}] -> ${v.content}`)
      .join('\n');

    expect(
      violations,
      `Hardcoded Japanese characters or comments detected in source code!\nAll texts must be extracted to i18n locales, and code comments must be in English:\n${errorMessage}`
    ).toHaveLength(0);
  });

  it('should ensure translation keys in en.json and ja.json are strictly symmetrical', () => {
    const localesDir = path.resolve(__dirname, '../i18n/locales');
    const enContent = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
    const jaContent = JSON.parse(fs.readFileSync(path.join(localesDir, 'ja.json'), 'utf-8'));

    const enKeys = getNestedKeys(enContent).sort();
    const jaKeys = getNestedKeys(jaContent).sort();

    const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));
    const missingInEn = jaKeys.filter((k) => !enKeys.includes(k));

    expect(
      missingInJa,
      `Keys present in en.json but missing in ja.json: ${missingInJa.join(', ')}`
    ).toEqual([]);

    expect(
      missingInEn,
      `Keys present in ja.json but missing in en.json: ${missingInEn.join(', ')}`
    ).toEqual([]);
  });
});
