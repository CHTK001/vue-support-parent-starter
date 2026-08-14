#!/usr/bin/env node
/**
 * inspect-remote.mjs — 用 Playwright 打开远程 KOI-ADMIN 站点并绕过 baiduJs 反调试
 *
 * 反调试机制（与本地仓库 packages/core/src/security/antiDebug.ts 同源）：
 *   1. 内置监听：禁右键 / F12 / Ctrl+Shift+I/J/C / Ctrl+U → punish()
 *   2. devtools-detector@2.0.25：多检查器（debugger 计时、控制台 formatter、
 *      element-id、worker 计时等）判定 DevTools 是否打开
 *   3. 外部反爬脚本：security.baiduJs.url 动态注入 <script>
 *
 * 绕过策略：
 *   - headless 下 DevTools 未打开，devtools-detector 各检查器天然判「关闭」
 *     （debugger 语句无 Debugger 域挂载不会暂停，计时差为 0）
 *   - --disable-blink-features=AutomationControlled 抹掉 navigator.webdriver，
 *     防止外部反爬脚本识别自动化
 *   - 初始化脚本守护 Location.prototype.replace：吞掉 clear 模式的
 *     about:blank 惩罚跳转；Node 侧监听导航，被踢走后自动恢复
 *   - 采集 console / pageerror / 导航 / 反调试是否实际启用 等诊断信息
 *
 * 用法：
 *   node inspect-remote.mjs                 # headless + 输出 JSON 与截图
 *   HEADED=1 node inspect-remote.mjs        # 有头模式（真机窗口）
 *   INSPECT_URL=http://.../system/menu node inspect-remote.mjs
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const TARGET = process.env.INSPECT_URL || "http://39.107.143.109/system/menu";
const HEADED = process.env.HEADED === "1";

const browser = await chromium.launch({
  headless: !HEADED,
  args: [
    // 移除 navigator.webdriver，规避自动化指纹检测
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  locale: "zh-CN",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
});

// —— 反调试绕过：在页面任何脚本执行前注入 ——
await context.addInitScript(() => {
  // ① 抹掉自动化指纹（外部反爬脚本常探测 webdriver / chrome 对象差异）
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });

  // ② 吞掉框架 punish() 的 clear 模式跳转（location.replace("about:blank")）
  //    其它导航一律放行，避免影响 SPA 正常路由
  const origReplace = Location.prototype.replace;
  Location.prototype.replace = function (url) {
    if (String(url) === "about:blank") {
      console.warn("[bypass] punished about:blank 跳转已被吞掉");
      return;
    }
    return origReplace.apply(this, arguments);
  };

  // ③ redirect 模式 punish() 会 location.href = jumpUrl（未配置时 = "/"）。
  //    仅当目标为主页根路径时吞掉（真实业务跳首页基本走 router.push 而非 href 赋值）
  try {
    const desc = Object.getOwnPropertyDescriptor(Location.prototype, "href");
    if (desc && desc.set) {
      Object.defineProperty(Location.prototype, "href", {
        ...desc,
        set(v) {
          const target = String(v);
          const origin = window.location.origin;
          if (target === "/" || target === origin + "/" || target === origin) {
            console.warn("[bypass] punished href=/ 跳转已被吞掉");
            return;
          }
          return desc.set.call(this, v);
        },
      });
    }
  } catch (e) {
    /* 环境不支持时忽略 */
  }
});

const page = await context.newPage();

// —— 诊断采集 ——
const logs = [];
page.on("console", (msg) => {
  const t = msg.type();
  if (t === "error" || t === "warning" || t === "debug") {
    logs.push(`[console.${t}] ${msg.text().slice(0, 300)}`);
  }
});
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message.slice(0, 300)}`));
page.on("framenavigated", (frame) => {
  if (frame === page.mainFrame()) {
    logs.push(`[navigated] ${frame.url()}`);
  }
});

// 打开页面（反调试惩罚跳转一次可容忍，超过一次直接放弃）
let navigations = 0;
for (let attempt = 1; attempt <= 2; attempt++) {
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(attempt === 1 ? 9000 : 6000);
  const url = page.url();
  navigations++;
  const punished =
    url.startsWith("about:") || url === new URL(TARGET).origin + "/";
  if (!punished || attempt === 2) break;
  logs.push(`[bypass] 第 ${attempt} 次被反调试踢走（${url}），重新打开`);
}

// —— 页面内诊断 ——
const info = await page.evaluate(() => {
  const blocked = () => {
    const ev = new MouseEvent("contextmenu", { cancelable: true, bubbles: true });
    document.dispatchEvent(ev);
    return ev.defaultPrevented;
  };
  const f12Blocked = () => {
    const ev = new KeyboardEvent("keydown", {
      key: "F12",
      cancelable: true,
      bubbles: true,
    });
    document.dispatchEvent(ev);
    return ev.defaultPrevented;
  };
  return {
    url: location.href,
    title: document.title,
    antiDebugContextmenuBlocked: blocked(),
    antiDebugF12Blocked: f12Blocked(),
    hasLoginForm: !!document.querySelector(
      "input[type=password], .login-form, .el-form--login",
    ),
    isErrorPage:
      !!document.querySelector(".error-page, .not-found, .error-container") ||
      /404|403|500/.test(document.body?.innerText?.slice(0, 200) || ""),
    menus: Array.from(
      document.querySelectorAll(".el-menu-item, .el-sub-menu__title, .el-menu--vertical .el-menu-item"),
    )
      .map((n) => n.textContent.trim())
      .filter(Boolean)
      .slice(0, 40),
    tableHeaders: Array.from(
      document.querySelectorAll(".el-table__header th .cell"),
    )
      .map((n) => n.textContent.trim())
      .filter(Boolean)
      .slice(0, 30),
    storageKeys: Object.keys(localStorage).slice(0, 20),
    bodyText: (document.body?.innerText || "").slice(0, 2500),
  };
});

// —— 网络诊断：看看应用启动时拉了什么配置 / 接口 ——
const resources = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .map((r) => r.name)
    .filter((n) => /yaml|api|setting|login|menu/i.test(n))
    .slice(0, 25),
);

// —— 输出 ——
await page.screenshot({ path: "remote-inspect-full.png", fullPage: true });
await page.screenshot({ path: "remote-inspect-viewport.png" });

const report = {
  target: TARGET,
  finalUrl: page.url(),
  navigations,
  info,
  resources,
  logs,
};
writeFileSync("remote-inspect.json", JSON.stringify(report, null, 2), "utf-8");
console.log(JSON.stringify(report, null, 2));

await browser.close();
