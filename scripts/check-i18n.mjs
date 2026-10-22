#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

const JAPANESE_CHAR_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/;

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
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

function getNestedKeys(obj, prefix = '') {
  let keys = [];
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

console.log('🔍 [SBOM Weather] Checking source code for hardcoded Japanese & i18n parity...\n');

let hasError = false;

// 1. Scan source files for hardcoded Japanese characters
const allFiles = getAllFiles(srcDir);
const violations = [];

allFiles.forEach((filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.endsWith('/locales/ja.json')) {
    return;
  }

  if (!/\.(ts|tsx|js|jsx|css|html)$/.test(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (JAPANESE_CHAR_REGEX.test(line)) {
      violations.push({
        file: path.relative(rootDir, filePath),
        line: index + 1,
        content: line.trim()
      });
    }
  });
});

if (violations.length > 0) {
  hasError = true;
  console.error('❌ Found hardcoded Japanese text or comments in source files:');
  violations.forEach((v) => {
    console.error(`   - ${v.file}:${v.line} -> ${v.content}`);
  });
  console.error('\n   Please externalize all UI text to src/i18n/locales/ and keep source comments in English.\n');
} else {
  console.log('✅ Cleanliness check passed: No Japanese characters found in source code (only in ja.json).');
}

// 2. Validate translation key symmetry between en.json and ja.json
const localesDir = path.join(srcDir, 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const jaPath = path.join(localesDir, 'ja.json');

if (fs.existsSync(enPath) && fs.existsSync(jaPath)) {
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const jaContent = JSON.parse(fs.readFileSync(jaPath, 'utf-8'));

  const enKeys = getNestedKeys(enContent).sort();
  const jaKeys = getNestedKeys(jaContent).sort();

  const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));
  const missingInEn = jaKeys.filter((k) => !enKeys.includes(k));

  if (missingInJa.length > 0 || missingInEn.length > 0) {
    hasError = true;
    console.error('❌ Translation key mismatch between en.json and ja.json:');
    if (missingInJa.length > 0) {
      console.error(`   Missing in ja.json: ${missingInJa.join(', ')}`);
    }
    if (missingInEn.length > 0) {
      console.error(`   Missing in en.json: ${missingInEn.join(', ')}`);
    }
    console.error();
  } else {
    console.log(`✅ Parity check passed: ${enKeys.length} translation keys match between en.json and ja.json.`);
  }
}

if (hasError) {
  console.error('\n❌ i18n check failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All i18n enforcement checks passed successfully!\n');
}
