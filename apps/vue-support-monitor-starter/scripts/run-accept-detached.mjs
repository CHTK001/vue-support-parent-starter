/**
 * Playwright 全量验收测试启动器（脱离进程版）。
 *
 * 问题：PowerShell 120 秒超时杀死后台 shell，即使 playwright --timeout 0 也不行。
 * 解决：Node.js spawn detached=true，子进程由 PID 1/会话持有，shell 退出不影响。
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendFileSync, unlinkSync } from 'node:fs';

const HERE = resolve(fileURLToPath(import.meta.url), '..');
const LOG = 'D:\\ch\\project\\.tmp\\pw-accept.log';
const BASE_URL = process.env.MS_E2E_BASE_URL || 'http://127.0.0.1:8851';
const API_TARGET = process.env.MS_API_TARGET || 'http://192.168.50.198:8112';

try { unlinkSync(LOG); } catch {}
const ts = () => new Date().toISOString().slice(11, 23);
const log = (msg) => {
  const line = `[${ts()}] ${msg}\n`;
  try { appendFileSync(LOG, line); } catch {}
  process.stderr.write(line);
};

log(`=== Playwright 验收启动 ===`);
log(`BASE_URL=${BASE_URL}`);
log(`API_TARGET=${API_TARGET}`);

const child = spawn(
  'node',
  [
    resolve(HERE, 'node_modules', '@playwright', 'test', 'cli.js'),
    'test',
    '--config', resolve(HERE, 'playwright.accept.config.ts'),
    '--timeout', '0',
    '--workers', '1',
  ],
  {
    cwd: HERE,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, MS_E2E_BASE_URL: BASE_URL, MS_API_TARGET: API_TARGET },
  },
);

// stdout/stderr 写到日志
child.stdout.on('data', (d) => {
  try { appendFileSync(LOG, d.toString()); } catch {}
});
child.stderr.on('data', (d) => {
  try { appendFileSync(LOG, d.toString()); } catch {}
});

// unref 后父进程可以退出，但子进程继续运行
child.unref();

log(`PID=${child.pid} 已脱离，父进程退出`);
process.exit(0);
