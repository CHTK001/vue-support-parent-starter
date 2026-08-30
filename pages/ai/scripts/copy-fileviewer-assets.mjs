/**
 * Copy file-viewer assets to public/file-viewer/ for offline use.
 * Run: npm run copy-fileviewer-assets
 */
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// Walk up to find the workspace root's node_modules/.pnpm
const CANDIDATE_DIRS = [
  resolve(ROOT, 'node_modules', '.pnpm'),
  resolve(ROOT, '..', 'node_modules', '.pnpm'),
  resolve(ROOT, '..', '..', 'node_modules', '.pnpm'),
];
let PNODE = null;
for (const d of CANDIDATE_DIRS) {
  if (existsSync(d)) { PNODE = d; break; }
}
if (!PNODE) {
  console.error('[copy-fileviewer-assets] Could not find pnpm store. Searched:', CANDIDATE_DIRS.join('\n  '));
  process.exit(1);
}
const PUB_DIR = resolve(ROOT, 'public', 'file-viewer');

function findViewerViewerDir() {
  try {
    const entries = readdirSync(PNODE);
    for (const entry of entries) {
      if (entry.startsWith('file-viewer-copy-assets@')) {
        const candidate = resolve(PNODE, entry, 'node_modules', 'file-viewer-copy-assets', 'viewer');
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function copyDirRecursive(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const viewerDir = findViewerViewerDir();
if (!viewerDir) {
  console.error('[copy-fileviewer-assets] Could not find file-viewer viewer assets in pnpm store.');
  console.error('  pnpm store root:', PNODE);
  process.exit(1);
}

console.log(`[copy-fileviewer-assets] Copying ${viewerDir} -> ${PUB_DIR}`);
copyDirRecursive(viewerDir, PUB_DIR);
console.log('[copy-fileviewer-assets] Done.');
