#!/usr/bin/env node
/**
 * inspect-remote.mjs — 用 Playwright 打开远程 KOI-ADMIN 站点并绕过 baiduJs 反调试
 *
 * 反调试机制（与本地 packages/core/src/security/antiDebug.ts 同源）：
 *   1. 内置监听：禁右键 / F12 / Ctrl+Shift+I/J/C / Ctrl+U → punish()
 *   2. devtools-detector@2.0.25：debugger 计时 / 控制台 formatter / element-id 等检查器
 *   3. 外部反爬脚本 security.baiduJs.url（本站实测：打印
 *      "You don't have permission to use DEVTOOL!【type = 6】" 的经典 debugger 计时脚本）
 *
 * 关键发现：
 *   - CDP 连接下 `debugger` 语句会短暂暂停，计时差 > 100ms → 误判 DevTools 打开 → 惩罚
 *   - 站点 openAuth=true：/system/menu 被路由守卫重定向到 /login（guard.ts 第 89 行：
 *     openAuth=false 直接放行）
 *
 * 绕过策略（四层）：
 *   L1 配置改写：路由层拦截 setting/config/yaml 响应，强制 app.openAuth=false 且
 *      security.baiduJs.enable=false / url=""（等效"改成 openAuth=false"，并让
 *      installAntiDebug() 直接空转，外部脚本不再注入）
 *   L2 CDP 自动恢复：启用 Debugger 域，debugger 暂停事件立刻 resume，
 *      使 debugger 计时差 < 100ms，抵消内置 devtools-detector 与外部脚本的计时检测
 *   L3 导航守卫：addInitScript 吞掉惩罚跳转（about:blank / 根路径的 replace/assign/href），
 *      其余导航放行，不破坏 SPA 路由
 *   L4 指纹拦截：若外部反爬脚本仍被注入，按其响应指纹（DEVTOOL / type = 6）拦截 204
 *
 * 用法：
 *   node inspect-remote.mjs                 # headless
 *   HEADED=1 node inspect-remote.mjs        # 有头模式
 *   OPEN_AUTH=0 node inspect-remote.mjs     # 不强制改写 openAuth（默认强制 =1）
 *   INSPECT_URL=http://.../xxx node inspect-remote.mjs
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { load as parseYaml, dump as stringifyYaml } from "js-yaml";

const TARGET = process.env.INSPECT_URL || "http://39.107.143.109/system/menu";
const HEADED = process.env.HEADED === "1";
const FORCE_OPEN_AUTH = process.env.OPEN_AUTH !== "0";

const logs = [];
const requests = [];

/** 改写配置响应：强制 openAuth=false、关闭 baiduJs。支持 JSON 数组/对象与 YAML */
function patchConfig(text) {
  const body = String(text || "");
  if (!/openAuth|baiduJs|sysSettingName|security/i.test(body)) {
    return { changed: false };
  }
  const patchObject = (obj) => {
    let changed = false;
    // 扁平设置列表格式：[{sysSettingName:"app.openAuth", sysSettingValue:"true"}]
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const name = String(item?.sysSettingName ?? item?.name ?? "");
        if (name === "app.openAuth" && String(item.sysSettingValue) !== "false") {
          item.sysSettingValue = "false";
          changed = true;
        } else if (
          name === "security.baiduJs.enable" &&
          String(item.sysSettingValue) !== "false"
        ) {
          item.sysSettingValue = "false";
          changed = true;
        } else if (name === "security.baiduJs.url" && item.sysSettingValue) {
          item.sysSettingValue = "";
          changed = true;
        }
      }
      return changed;
    }
    // 嵌套对象格式：{ app: { openAuth: true }, security: { baiduJs: {...} } }
    const app = obj?.app ?? obj?.appConfig;
    if (app && typeof app === "object" && app.openAuth !== false) {
      app.openAuth = false;
      changed = true;
    }
    const sec = obj?.security ?? obj?.securityConfig;
    if (sec?.baiduJs && typeof sec.baiduJs === "object") {
      if (sec.baiduJs.enable !== false) {
        sec.baiduJs.enable = false;
        changed = true;
      }
      if (sec.baiduJs.url) {
        sec.baiduJs.url = "";
        changed = true;
      }
    }
    return changed;
  };

  // JSON
  try {
    const parsed = JSON.parse(body);
    // 兼容 { code, data: [...] } 包装
    if (parsed?.data && typeof parsed.data === "object") {
      const changed = patchObject(parsed.data);
      return changed
        ? { changed: true, body: JSON.stringify(parsed) }
        : { changed: false };
    }
    const changed = patchObject(parsed);
    return changed
      ? { changed: true, body: JSON.stringify(parsed) }
      : { changed: false };
  } catch {
    /* 不是 JSON，尝试 YAML */
  }
  // YAML（app.yaml / app.example.yaml）
  try {
    if (/:\s*/.test(body) && body.includes(":")) {
      const parsed = parseYaml(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const changed = patchObject(parsed);
        return changed
          ? { changed: true, body: stringifyYaml(parsed) }
          : { changed: false };
      }
    }
  } catch {
    /* 忽略 */
  }
  return { changed: false };
}

const browser = await chromium.launch({
  headless: !HEADED,
  args: [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});

let page;
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "zh-CN",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  // —— L3 导航守卫：吞掉反调试惩罚跳转，其余放行 ——
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    const swallow = (url) => {
      const u = String(url);
      if (u === "about:blank" || u === "/") return true;
      try {
        return (
          u === location.origin || u === location.origin + "/"
        );
      } catch {
        return false;
      }
    };
    try {
      const origReplace = Location.prototype.replace;
      Location.prototype.replace = function (url) {
        if (swallow(url)) {
          console.warn("[bypass] 吞掉惩罚跳转 replace(" + url + ")");
          return;
        }
        return origReplace.apply(this, arguments);
      };
      const origAssign = Location.prototype.assign;
      Location.prototype.assign = function (url) {
        if (swallow(url)) {
          console.warn("[bypass] 吞掉惩罚跳转 assign(" + url + ")");
          return;
        }
        return origAssign.apply(this, arguments);
      };
      const desc = Object.getOwnPropertyDescriptor(Location.prototype, "href");
      if (desc && desc.set) {
        Object.defineProperty(Location.prototype, "href", {
          ...desc,
          set(v) {
            if (swallow(v)) {
              console.warn("[bypass] 吞掉惩罚跳转 href=" + v);
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

  page = await context.newPage();

  // —— L2 CDP 自动恢复：debugger 暂停立即 resume，计时差保持 < 100ms ——
  const cdp = await page.createCDPSession();
  await cdp.send("Debugger.enable");
  cdp.on("Debugger.paused", () => {
    cdp.send("Debugger.resume").catch(() => {});
  });

  // —— 诊断采集 ——
  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning" || t === "debug") {
      logs.push(`[console.${t}] ${msg.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (err) =>
    logs.push(`[pageerror] ${err.message.slice(0, 300)}`),
  );
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) logs.push(`[navigated] ${frame.url()}`);
  });
  page.on("request", (req) => {
    const t = req.resourceType();
    if (["document", "xhr", "fetch", "script"].includes(t)) {
      requests.push({ type: t, url: req.url() });
      if (requests.length > 80) requests.length = 80;
    }
  });

  // —— L1 配置改写 + L4 反爬脚本指纹拦截 ——
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const isConfigLike = /setting|config|\.ya?ml/i.test(url);
    const isScript = req.resourceType() === "script";
    if (!isConfigLike && !isScript) return route.continue();
    try {
      const res = await route.fetch();
      const body = await res.text();
      const ct = res.headers()["content-type"] || "";
      if (isConfigLike) {
        const patched = patchConfig(body);
        if (patched.changed) {
          logs.push(
            `[rewrite] ${url} → openAuth=false / baiduJs 已关闭`,
          );
          return route.fulfill({
            response: res,
            body: patched.body,
            headers: { ...res.headers(), "content-type": ct },
          });
        }
        return route.fulfill({ response: res, body });
      }
      if (isScript && /DEVTOOL|don't have permission|type\s*=\s*6/i.test(body)) {
        logs.push(`[block] 反调试外部脚本已拦截: ${url}`);
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill({ response: res, body });
    } catch {
      return route.continue();
    }
  });

  // —— 打开页面（被惩罚踢走最多重试一次） ——
  let navigations = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(attempt === 1 ? 10000 : 7000);
    navigations++;
    const url = page.url();
    const punished = url.startsWith("about:") || url === new URL(TARGET).origin + "/";
    if (!punished || attempt === 2) break;
    logs.push(`[bypass] 第 ${attempt} 次被踢走（${url}），重试`);
  }

  // —— 页面诊断（storageKeys 先于 F12 检查，避免惩罚清空污染） ——
  const info = await page.evaluate(() => {
    const ctxBlocked = () => {
      const ev = new MouseEvent("contextmenu", {
        cancelable: true,
        bubbles: true,
      });
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
    const storageKeys = Object.keys(localStorage).slice(0, 20);
    const ctx = ctxBlocked();
    const f12 = f12Blocked(); // 若反调试仍在运行会触发 punish（导航已被吞，仅清 storage）
    return {
      url: location.href,
      title: document.title,
      antiDebugContextmenuBlocked: ctx,
      antiDebugF12Blocked: f12,
      hasLoginForm: !!document.querySelector(
        "input[type=password], .login-form, .el-form--login",
      ),
      isErrorPage:
        !!document.querySelector(".error-page, .not-found, .error-container") ||
        /404|403|500/.test(document.body?.innerText?.slice(0, 200) || ""),
      menus: Array.from(
        document.querySelectorAll(
          ".el-menu-item, .el-sub-menu__title, .el-menu--vertical .el-menu-item",
        ),
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
      storageKeys,
      bodyText: (document.body?.innerText || "").slice(0, 2500),
    };
  });

  // 配置来源诊断（setting/config/yaml 类请求）
  const configRequests = requests.filter((r) =>
    /setting|config|\.ya?ml/i.test(r.url),
  );

  await page.screenshot({ path: "remote-inspect-full.png", fullPage: true });
  await page.screenshot({ path: "remote-inspect-viewport.png" });

  const report = {
    target: TARGET,
    forcedOpenAuth: FORCE_OPEN_AUTH,
    finalUrl: page.url(),
    navigations,
    info,
    configRequests,
    requests: requests.slice(0, 40),
    logs,
  };
  writeFileSync(
    "remote-inspect.json",
    JSON.stringify(report, null, 2),
    "utf-8",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
