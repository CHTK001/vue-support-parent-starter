/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/**
 * 本地轻量 logger：避免在 vite.config 加载阶段拉入 @repo/utils 整棵依赖图
 * （@repo/utils 内部通过 ESM 解析 packages/utils/src/storage 时会触发扩展名问题）。
 */
const log = {
  warn: (...args: unknown[]) => console.warn('[file-viewer-assets]', ...args),
  info: (...args: unknown[]) => console.info('[file-viewer-assets]', ...args),
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname);
const PNODE = resolve(ROOT, 'node_modules', '.pnpm');
// Walk up to find the workspace root's pnpm store
const CANDIDATE_DIRS = [
  resolve(ROOT, 'node_modules', '.pnpm'),
  resolve(ROOT, '..', 'node_modules', '.pnpm'),
  resolve(ROOT, '..', '..', 'node_modules', '.pnpm'),
];
let PNODE_RESOLVED: string | null = null;
for (const d of CANDIDATE_DIRS) {
  if (existsSync(d)) { PNODE_RESOLVED = d; break; }
}
const OUT_DIR = resolve(ROOT, 'dist', 'file-viewer');
const PUB_DIR = resolve(ROOT, 'public', 'file-viewer');

function findViewerViewerDir(basePnpmDir: string): string | null {
  try {
    const entries = readdirSync(basePnpmDir);
    for (const entry of entries) {
      if (entry.startsWith('file-viewer-copy-assets@')) {
        const candidate = resolve(basePnpmDir, entry, 'node_modules', 'file-viewer-copy-assets', 'viewer');
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function copyDirRecursive(src: string, dest: string) {
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

/**
 * 解析 file-viewer 静态资源根 —— pnpm store 内 file-viewer-copy-assets 包下的 viewer/ 目录。
 *
 * @param fromDir 调用方应用根目录（apps/vue-support-ai-starter 或 pages/ai）。
 *               pnpm store 可能在 fromDir/node_modules/.pnpm、fromDir/../node_modules/.pnpm
 *               或更上层（apps 与 pages 同级时回到仓库根）。
 */
function resolveViewerDir(fromDir: string): string | null {
  const candidates = [
    resolve(fromDir, 'node_modules', '.pnpm'),
    resolve(fromDir, '..', 'node_modules', '.pnpm'),
    resolve(fromDir, '..', '..', 'node_modules', '.pnpm'),
    resolve(fromDir, '..', '..', '..', 'node_modules', '.pnpm'),
  ];
  for (const d of candidates) {
    if (!existsSync(d)) continue;
    const v = findViewerViewerDir(d);
    if (v) return v;
  }
  return null;
}

/**
 * 显式指定 appRoot 的版本 —— apps/vue-support-ai-starter 等外部宿主使用。
 *
 * @param appRoot 调用方应用根目录
 * @param outRel  产物中 file-viewer 目录相对 appRoot 的路径（默认 'dist/file-viewer'）
 * @param pubRel  公共目录中 file-viewer 目录相对 appRoot 的路径（默认 'public/file-viewer'）
 */
export function fileViewerAssetsPluginFor(
  appRoot: string,
  outRel = 'dist/file-viewer',
  pubRel = 'public/file-viewer'
): Plugin {
  let viewerDir: string | null = null;
  const outDir = resolve(appRoot, outRel);
  const pubDir = resolve(appRoot, pubRel);

  return {
    name: 'file-viewer-assets',
    apply: 'build' as const,
    config() {
      viewerDir = resolveViewerDir(appRoot);
      if (!viewerDir) {
        log.warn(`[file-viewer-assets] Could not find viewer assets in pnpm store for`, appRoot);
      }
      return {};
    },
    buildStart() {
      if (!viewerDir) viewerDir = resolveViewerDir(appRoot);
    },
    closeBundle() {
      if (!viewerDir) return;
      copyDirRecursive(viewerDir, outDir);
      console.log(`[file-viewer-assets] Copied ${viewerDir} -> ${outDir}`);
    },
    configureServer(server) {
      if (!viewerDir) viewerDir = resolveViewerDir(appRoot);
      if (!viewerDir) return;
      server.middlewares.use('/file-viewer/', (req, res, next) => {
        const filePath = join(viewerDir!, req.url!);
        if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
          const ext = filePath.split('.').pop() || '';
          const types: Record<string, string> = {
            js: 'application/javascript', mjs: 'application/javascript',
            wasm: 'application/wasm', css: 'text/css',
            json: 'application/json', woff: 'font/woff',
            woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
            svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif',
            pdf: 'application/pdf', txt: 'text/plain',
          };
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const fs = require('node:fs');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
      try {
        if (!existsSync(pubDir)) {
          copyDirRecursive(viewerDir, pubDir);
        } else if (readdirSync(pubDir).length === 0) {
          copyDirRecursive(viewerDir, pubDir);
        }
      } catch {}
    },
  };
}

export function fileViewerAssetsPlugin(): Plugin {
  let viewerDir: string | null = null;

  return {
    name: 'file-viewer-assets',
    apply: 'build' as const,
    config() {
      if (!PNODE_RESOLVED) {
        log.warn(`[file-viewer-assets] Could not find pnpm store`);
        return;
      }
      viewerDir = findViewerViewerDir(PNODE_RESOLVED);
      if (!viewerDir) {
        log.warn(`[file-viewer-assets] Could not find viewer assets in pnpm store`);
      }
      return {};
    },
    buildStart() {
      if (!viewerDir && PNODE_RESOLVED) {
        viewerDir = findViewerViewerDir(PNODE_RESOLVED);
      }
    },
    closeBundle() {
      if (!viewerDir) return;
      copyDirRecursive(viewerDir, OUT_DIR);
      console.log(`[file-viewer-assets] Copied ${viewerDir} -> ${OUT_DIR}`);
    },
    configureServer(server) {
      if (!viewerDir && PNODE_RESOLVED) {
        viewerDir = findViewerViewerDir(PNODE_RESOLVED);
      }
      if (!viewerDir) return;
      server.middlewares.use('/file-viewer/', (req, res, next) => {
        const filePath = join(viewerDir!, req.url!);
        if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
          const ext = filePath.split('.').pop() || '';
          const types: Record<string, string> = {
            js: 'application/javascript', mjs: 'application/javascript',
            wasm: 'application/wasm', css: 'text/css',
            json: 'application/json', woff: 'font/woff',
            woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
            eot: 'application/vnd.ms-fontobject', svg: 'image/svg+xml',
            png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif',
            pdf: 'application/pdf', txt: 'text/plain',
          };
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const fs = require('node:fs');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
      // Copy to public dir for dev convenience
      try {
        if (!existsSync(PUB_DIR)) {
          copyDirRecursive(viewerDir, PUB_DIR);
        } else if (readdirSync(PUB_DIR).length === 0) {
          copyDirRecursive(viewerDir, PUB_DIR);
        }
      } catch {}
    },
  };
}
