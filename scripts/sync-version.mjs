#!/usr/bin/env node
/**
 * package.json の version を manifest.json と src/shared/version.ts に同期する
 *
 * 使い方:
 *   node scripts/sync-version.mjs
 *   npm run sync-version
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;

// manifest.json
const manifestPath = resolve(root, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// src/shared/version.ts
const versionTs = `/** このファイルは scripts/sync-version.mjs により自動生成されます */\nexport const APP_VERSION = '${version}';\n`;
writeFileSync(resolve(root, 'src/shared/version.ts'), versionTs);

console.log(`Version synced: ${version}`);
