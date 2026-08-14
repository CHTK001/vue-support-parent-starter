#!/usr/bin/env node
/**
 * inspect-remote.mjs — 用 Playwright 打开远程 KOI-ADMIN 站点并绕过其反调试
 *
 * 反调试实况（经产物逆向确认）：
 *   - 不是框架自带的 security.baiduJs 机制，而是打包进 index chunk 的
 *     disable-devtool 插件（UMD 导出全局 DisableDevtool），配置：
 *     { ddtk, interval:500, stopIntervalTime:5e3, disableMenu:!0,
 *       detectors:[1,3,4,5,6,7], clearLog:!0, ... }
 *     —— 触发时打印 "You don't have permission to use DEVTOOL!【type = 6】"
 *        并把页面导航到 about:blank
 *   - 部署 fork（KOI-ADMIN）全部 33 个启动 chunk 中不存在 "openAuth" 字符串：
 *     无 openAuth 开关可改；登录守卫疑似始终要求 token（/system/menu → /login）
 *
 * 绕过策略（五层）：
 *   L1 chunk 改写：拦截 index chunk 响应，把 `detectors:[1,3,4,5,6,7]`
 *      改写为 `detectors:[]` —— 所有探测器永久关闭（外科手术式）
 *   L2 运行时禁用：DisableDevtool 全局出现后立即调 .disable()（兜底）
 *   L3 导航守卫：addInitScript 吞掉惩罚跳转（about:blank / / / origin 的
 *      replace / assign / href / window.location / window.open('_self')）
 *   L4 CDP 自动恢复：debugger 暂停立即 resume，抵消计时类检测（兜底）
 *   L5 配置兜底：任何运行时配置响应（JSON/YAML 含 openAuth/baiduJs）改写关闭
 *   第二轮尝试：预置假 token（多个候选 key）再导航，试图绕过登录守卫直达菜单页
 *
 * 用法：
 *   node inspect-remote.mjs                 # headless
 *   HEADED=1 node inspect-remote.mjs        # 有头模式
 *   INSPECT_URL=http://.../xxx node inspect-remote.mjs
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { load as parseYaml, dump as stringifyYaml } from "js-yaml";

const TARGET = process.env.INSPECT_URL || "http://39.107.143.109/system/menu";
const HEADED = process.env.HEADED === "1";

const logs = [];
const requests = [];
const apiResponses = [];

/** 模拟登录态：伪造用户信息 */
const MOCK_USER = {
  userId: 1,
  userName: "admin",
  nickName: "admin",
  avatar: "",
  roles: ["admin"],
  perms: ["*:*:*"],
};

/** 模拟登录态：伪造菜单树（含 /system/menu 菜单管理页） */
const MOCK_MENU = [
  {
    id: 1,
    parentId: 0,
    name: "系统管理",
    path: "/system",
    icon: "Setting",
    type: 1,
    sort: 1,
    children: [
      {
        id: 11,
        parentId: 1,
        name: "菜单管理",
        path: "/system/menu",
        icon: "Menu",
        component: "/system/menu",
        type: 2,
        sort: 1,
        perms: ["system:menu:list"],
      },
      {
        id: 12,
        parentId: 1,
        name: "用户管理",
        path: "/system/user",
        icon: "User",
        component: "/system/user",
        type: 2,
        sort: 2,
        perms: ["system:user:list"],
      },
    ],
  },
];

const jsonOk = (data) =>
  JSON.stringify({ code: "00000", msg: "ok", data });

/** 改写含 openAuth/baiduJs 的运行时配置响应（JSON 数组/对象/YAML） */
function patchConfig(text) {
  const body = String(text || "");
  if (!/openAuth|baiduJs|sysSettingName|security/i.test(body)) {
    return { changed: false };
  }
  const setVal = (item, v) => {
    const k = item && typeof item === "object" && "sysSettingValue" in item
      ? "sysSettingValue"
      : "value";
    if (String(item?.[k]) !== v) {
      if (item) item[k] = v;
      return true;
    }
    return false;
  };
  const patchObject = (obj) => {
    let changed = false;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (!item || typeof item !== "object") continue;
        const name = String(item.sysSettingName ?? item.name ?? "");
        if (name === "app.openAuth") changed = setVal(item, "false") || changed;
        else if (name === "security.baiduJs.enable")
          changed = setVal(item, "false") || changed;
        else if (name === "security.baiduJs.url")
          changed = setVal(item, "") || changed;
      }
      return changed;
    }
    if (!obj || typeof obj !== "object") return false;
    const app = obj.app ?? obj.appConfig;
    if (app && typeof app === "object" && app.openAuth !== false) {
      app.openAuth = false;
      changed = true;
    }
    const sec = obj.security ?? obj.securityConfig;
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

  try {
    const parsed = JSON.parse(body);
    const target = parsed?.data && typeof parsed.data === "object"
      ? parsed.data
      : parsed;
    const changed = patchObject(target);
    return changed
      ? { changed: true, body: JSON.stringify(parsed) }
      : { changed: false };
  } catch {
    /* 不是 JSON，尝试 YAML */
  }
  try {
    if (body.includes(":")) {
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

  // —— L3 导航守卫（覆盖 replace/assign/href/window.location/window.open）——
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    const swallow = (url) => {
      const u = String(url);
      if (u === "about:blank" || u === "/") return true;
      try {
        return u === location.origin || u === location.origin + "/";
      } catch {
        return false;
      }
    };
    const log = (v) => console.warn("[bypass] 吞掉惩罚跳转 " + v);
    // 诊断：记录非惩罚的 /login 跳转调用栈（定位重定向来源）
    const trace = (v) => {
      try {
        const s =
          (new Error().stack || "").split("\n").slice(2, 6).join(" | ") || "";
        console.warn("[nav] " + v + " → " + s);
      } catch {}
    };
    const nav = (method, url) => {
      const u = String(url);
      if (swallow(u)) {
        log(method + "(" + u + ")");
        return true;
      }
      if (u.includes("/login")) trace(method + "(" + u + ")");
      return false;
    };
    try {
      const origReplace = Location.prototype.replace;
      Location.prototype.replace = function (url) {
        if (nav("replace", url)) return;
        return origReplace.apply(this, arguments);
      };
      const origAssign = Location.prototype.assign;
      Location.prototype.assign = function (url) {
        if (nav("assign", url)) return;
        return origAssign.apply(this, arguments);
      };
      const hrefDesc = Object.getOwnPropertyDescriptor(Location.prototype, "href");
      if (hrefDesc && hrefDesc.set) {
        Object.defineProperty(Location.prototype, "href", {
          ...hrefDesc,
          set(v) {
            if (nav("href", v)) return;
            return hrefDesc.set.call(this, v);
          },
        });
      }
      // window.location = x / location = x（不走 Location.prototype.href setter）
      const locDesc = Object.getOwnPropertyDescriptor(Window.prototype, "location");
      if (locDesc && locDesc.set) {
        Object.defineProperty(Window.prototype, "location", {
          ...locDesc,
          set(v) {
            if (nav("window.location", v)) return;
            return locDesc.set.call(this, v);
          },
        });
      }
      // window.open(url, '_self')
      const origOpen = window.open;
      window.open = function (url, name, features) {
        if (
          swallow(url) &&
          (name === "_self" || name === "" || name === undefined)
        ) {
          log("window.open(" + url + ", " + name + ")");
          return null;
        }
        return origOpen.apply(this, arguments);
      };
    } catch (e) {
      /* 环境不支持时忽略 */
    }
  });

  page = await context.newPage();

  // —— L4 CDP 自动恢复 ——
  const cdp = await context.newCDPSession(page);
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
      if (requests.length > 100) requests.length = 100;
    }
  });

  // —— L1 chunk 改写 + L5 配置兜底 + 模拟登录态 ——
  let mockAuth = false; // 第二轮起开启
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    // 模拟登录态：伪造 user/menu/me/权限 接口（仅第二轮）
    if (mockAuth && url.includes("/prod-api/") && !/captcha/.test(url)) {
      const tail = url.split("/").slice(-2).join("/");
      if (/menu/i.test(url)) {
        logs.push(`[mock] ${tail} → 模拟菜单树`);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: jsonOk(MOCK_MENU),
        });
      }
      if (/\/me$|user\/me|user\/info|getUserInfo/i.test(url)) {
        logs.push(`[mock] ${tail} → 模拟用户信息`);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: jsonOk(MOCK_USER),
        });
      }
      if (/permission|role/i.test(url)) {
        logs.push(`[mock] ${tail} → 模拟角色权限`);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: jsonOk({ roles: ["admin"], perms: ["*:*:*"] }),
        });
      }
    }

    // 记录 /prod-api 响应体（诊断）+ 对配置类接口应用 L5 改写
    if (url.includes("/prod-api/")) {
      try {
        const res = await route.fetch();
        let body = await res.text();
        if (
          /setting|config/i.test(url) &&
          /openAuth|baiduJs|sysSettingName|security/i.test(body)
        ) {
          const p = patchConfig(body);
          if (p.changed) {
            body = p.body;
            logs.push(
              `[rewrite] ${url.split("/").pop()} → openAuth/baiduJs 改写`,
            );
            const ct = res.headers()["content-type"] || "application/json";
            return route.fulfill({
              response: res,
              body,
              headers: { ...res.headers(), "content-type": ct },
            });
          }
        }
        if (apiResponses.length < 30) {
          apiResponses.push({
            url: url.replace("http://39.107.143.109", ""),
            status: res.status(),
            preview: body.slice(0, 200),
          });
        }
        return route.fulfill({ response: res });
      } catch {
        return route.continue();
      }
    }

    const isJs = /\.js(\?|$)/i.test(url);
    const isConfigLike = /setting|config|\.ya?ml/i.test(url);
    if (!isJs && !isConfigLike) return route.continue();
    try {
      const res = await route.fetch();
      let body = await res.text();
      let changed = false;
      // disable-devtool：清空探测器（外科手术）
      if (body.includes("detectors:[1,3,4,5,6,7]")) {
        body = body.replaceAll("detectors:[1,3,4,5,6,7]", "detectors:[]");
        changed = true;
        logs.push(`[rewrite] ${url.split("/").pop()} → detectors:[]（disable-devtool 关闭）`);
      }
      // 运行时配置兜底（openAuth / baiduJs）
      if (!changed && /openAuth|baiduJs/i.test(body)) {
        const p = patchConfig(body);
        if (p.changed) {
          body = p.body;
          changed = true;
          logs.push(`[rewrite] ${url.split("/").pop()} → openAuth/baiduJs 改写`);
        }
      }
      if (changed) {
        const ct = res.headers()["content-type"] || "application/octet-stream";
        return route.fulfill({
          response: res,
          body,
          headers: { ...res.headers(), "content-type": ct },
        });
      }
      return route.fulfill({ response: res });
    } catch {
      return route.continue();
    }
  });

  // —— 打开页面（两轮：正常 → 假 token + 模拟登录态） ——
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt === 2) {
      mockAuth = true;
      logs.push("[attempt 2] 预置假 token + 模拟登录态（user/menu/me 接口伪造）");
      await page.addInitScript(() => {
        // 覆盖多种存储命名风格（部署 config chunk 显示前缀为 koi-pro- / koi-）
        const token = "fake-token-" + Date.now();
        const user = JSON.stringify({
          userId: 1,
          userName: "admin",
          nickName: "admin",
          roles: ["admin"],
          perms: ["*:*:*"],
        });
        const keys = [
          "accessToken",
          "refreshToken",
          "token",
          "userInfo",
          "koi-pro-accessToken",
          "koi-pro:accessToken",
          "koi-pro-refreshToken",
          "koi-pro-userInfo",
          "koi-accessToken",
          "koi-userInfo",
          "system:accessToken",
          "app:accessToken",
        ];
        keys.forEach((k) => {
          try {
            localStorage.setItem(k, k.includes("userInfo") ? user : token);
          } catch {}
        });
      });
    }

    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 30000 });

    // L2 运行时禁用 disable-devtool（chunk 改写失效时的兜底）
    try {
      await page.waitForFunction(
        () => window.DisableDevtool && typeof window.DisableDevtool.disable === "function",
        null,
        { timeout: 8000 },
      );
      await page.evaluate(() => {
        try {
          window.DisableDevtool.disable();
          window.DisableDevtool.config && (window.DisableDevtool.config.interval = 1e9);
        } catch {}
      });
      logs.push(`[bypass] 第 ${attempt} 轮 DisableDevtool.disable() 已执行`);
    } catch {
      logs.push(`[bypass] 第 ${attempt} 轮 DisableDevtool 全局未捕获（chunk 改写应已生效）`);
    }
    await page.waitForTimeout(9000);
    // 应用可能随后自行调用 DisableDevtool(config)，再禁一次
    try {
      await page.evaluate(() => {
        try { window.DisableDevtool && window.DisableDevtool.disable(); } catch {}
      });
    } catch {}

    const url = page.url();
    const punished = url.startsWith("about:") || url === new URL(TARGET).origin + "/";
    const onLogin = url.includes("/login");
    logs.push(`[attempt ${attempt}] final url: ${url}`);
    if (attempt === 1) {
      // 诊断：登录页实际使用的存储键（用于校准假 token key）
      try {
        const keys = await page.evaluate(() => Object.keys(localStorage));
        logs.push(`[attempt 1] localStorage keys: ${JSON.stringify(keys)}`);
      } catch {}
    }
    if (!punished && !onLogin) break; // 成功到达非登录页
  }

  // —— 页面诊断（storageKeys 先于 F12 检查） ——
  const info = await page.evaluate(() => {
    const ctxBlocked = () => {
      const ev = new MouseEvent("contextmenu", { cancelable: true, bubbles: true });
      document.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    const f12Blocked = () => {
      const ev = new KeyboardEvent("keydown", { key: "F12", cancelable: true, bubbles: true });
      document.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    const storageKeys = Object.keys(localStorage).slice(0, 25);
    const ctx = ctxBlocked();
    const f12 = f12Blocked();
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

  await page.screenshot({ path: "remote-inspect-full.png", fullPage: true });
  await page.screenshot({ path: "remote-inspect-viewport.png" });

  const report = {
    target: TARGET,
    finalUrl: page.url(),
    info,
    requests: requests.slice(0, 60),
    apiResponses,
    logs,
  };
  writeFileSync("remote-inspect.json", JSON.stringify(report, null, 2), "utf-8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
