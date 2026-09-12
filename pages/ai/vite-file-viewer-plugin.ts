/**
 * fileViewerAssetsPlugin — 复制 file-viewer 静态资源到 build 输出。
 * 生产构建时原样拷贝；开发模式下透传。
 */
import type { Plugin } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC_DIR = resolve(__dirname, 'node_modules/@file-viewer/react-full/dist');
const OUT_DIR = 'file-viewer-assets';

export function fileViewerAssetsPlugin(): Plugin {
  return {
    name: 'nomifun-file-viewer-assets',
    apply: 'build',
    generateBundle() {
      if (!existsSync(SRC_DIR)) return;
      const outRoot = resolve(__dirname, 'dist', OUT_DIR);
      if (!existsSync(outRoot)) mkdirSync(outRoot, { recursive: true });
      copyDir(SRC_DIR, outRoot);
    },
  };
}

function copyDir(src: string, dest: string) {
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
