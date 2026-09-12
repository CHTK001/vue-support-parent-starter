/**
 * copy-fileviewer-assets — copy @file-viewer/react-full static assets to public.
 * Dev-only: ensures assets resolve at runtime in Tauri/WebUI.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(__dirname, '../node_modules/@file-viewer/react-full/dist');
const outDir = resolve(__dirname, '../public/file-viewer-assets');

if (!existsSync(srcDir)) {
  // eslint-disable-next-line no-console
  console.warn('[copy-fileviewer-assets] source not found:', srcDir);
  process.exit(0);
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function copyDir(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    if (entry.isDirectory()) {
      if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(srcDir, outDir);
// eslint-disable-next-line no-console
console.log('[copy-fileviewer-assets] copied to', outDir);
