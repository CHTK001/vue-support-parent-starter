import { defineConfig, devices } from '@playwright/test';

/**
 * 交付验收专用 Playwright 配置（放在 app 根，与 {@code playwright.config.ts} 同级，
 * 这样 testDir / globalSetup / storageState 的相对路径全部沿用原样，不引入偏差）。
 *
 * <p>与 {@code playwright.config.ts} 的差别只有两点：</p>
 * <ol>
 *   <li><b>不托管 dev server</b>：原配置的 webServer 会去起 vite，而 vite 是
 *       {@code strictPort: 8848} —— 8848 正被别的会话占着，起了必失败。这里
 *       改跑 8851，由外部预先起好，{@code webServer} 直接关掉。</li>
 *   <li><b>API 目标显式指向 198:8112</b>：那是数据齐全的那一份（4 台主机、
 *       {@code ms_host_metric_history} 有 18 万行）。本机 8081 连的是 report 库、
 *       主机表是空的，拿它验收等于对着空页面点按钮。</li>
 * </ol>
 *
 * <p>用法：</p>
 * <pre>
 *   $env:MS_API_TARGET = "http://192.168.50.198:8112"
 *   node ../../node_modules/vite/bin/vite.js --config scripts/accept-vite.config.mts --port 8851 --strictPort
 *   $env:MS_E2E_BASE_URL = "http://127.0.0.1:8851"
 *   npx playwright test --config playwright.accept.config.ts zz-app-census
 * </pre>
 *
 * <p>dev server 必须用 {@code scripts/accept-vite.config.mts}：那份配置把 scss 切成
 * 纯 JS sass、并剔掉 file-viewer 两个插件。不剔的话，file-viewer 在启动期要把 27MB
 * 渲染器资产拷进<b>共享的</b> {@code public/vendor}，Windows 上删除被占用句柄拖住，
 * 新 vite 就卡在启动期 —— 零输出、不监听、进程还活着（实测过一次，pid 28524）。</p>
 */
const BASE_URL = process.env.MS_E2E_BASE_URL ?? 'http://127.0.0.1:8851';

/**
 * 浏览器通道。
 *
 * <p>默认用 Playwright 自带的 chromium，<b>不再钉死 {@code channel:'msedge'}</b>：
 * 本机（以及很多 CI）根本没装 Edge，Playwright 会报
 * {@code Chromium distribution 'msedge' is not found}，global-setup 直接起不来浏览器，
 * 整套用例会在浏览器启动阶段整片红掉 —— 那是环境问题，不是被测页面的问题。
 * 需要真机 Edge 时用 {@code MS_E2E_BROWSER_CHANNEL=msedge} 覆盖即可。</p>
 */
const BROWSER_CHANNEL = process.env.MS_E2E_BROWSER_CHANNEL?.trim() || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  /**
   * 单页超时。一页要点几十颗，每颗至少 200ms 静默 + 弹层判定 + Escape 后的
   * 200ms，加上 clickReal 的 actionability 等待，富控件页很容易吃到 2~4 分钟。
   * 默认 120s 会在「还没测完」的时候把用例掐掉 —— 那不是被测页面的错，是配置的错。
   */
  timeout: 600_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  /**
   * 报告与产物目录必须放在<b>仓库外</b>。
   *
   * <p>踩过的坑： Playwright 的 html 报告 / trace 若写在 app 目录内，vite 的
   * 文件监听会去 watch 这些频繁改写的产物，Windows 上直接
   * {@code EBUSY: resource busy or locked, watch '.../trace/xxx.css'} 把 dev
   * server 整个带崩（Node 进程退出码 1，之后所有页面打不开）。
   * 所以这里钉到 {@code D:/ch/project/.tmp} 下，与源码树隔离。</p>
   */
  outputDir: 'D:/ch/project/.tmp/accept-artifacts',
  reporter: [['list'], ['json', { outputFile: 'D:/ch/project/.tmp/accept-report/report.json' }]],
  use: {
    baseURL: BASE_URL,
    storageState: './tests/e2e/.auth/user.json',
    headless: true,
    viewport: { width: 1500, height: 950 },
    locale: 'zh-CN',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
    ...devices['Desktop Edge'],
    // 放在 devices 之后，才能覆盖掉 devices['Desktop Edge'] 自带的 channel:'msedge'
    channel: BROWSER_CHANNEL,
  },
  projects: [
    {
      name: BROWSER_CHANNEL ?? 'chromium',
      use: { channel: BROWSER_CHANNEL, viewport: { width: 1500, height: 950 } },
    },
  ],
});
