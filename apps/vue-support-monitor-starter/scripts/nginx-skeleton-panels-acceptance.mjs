/**
 * 三个面板骨架屏的通用验收：分别慢速拦截各面板的首屏接口，
 * 确认骨架出现 → 真实内容渲染 → 不闪回。
 *
 * 为什么用「按面板独立拦截」而不是一次全拦：三个面板是 v-if 切换的，
 * 全拦会让切页签时的等待难以区分是骨架没出现还是数据没到。
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8848";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-skeleton-panels");
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];
const ok = (n, d = "") => { pass++; console.log(`  [PASS] ${n}${d ? "  " + d : ""}`); };
const bad = (n, d = "") => { fail++; failures.push(n + (d ? " :: " + d : "")); console.log(`  [FAIL] ${n}${d ? "  " + d : ""}`); };
const check = (n, c, d = "") => { c ? ok(n, d) : bad(n, d); return !!c; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 每个面板：页签名、接口通配、慢速拦截的路径、骨架 class、真实内容 class
const PANELS = [
  {
    name: "站点",
    tab: "站点",
    api: "**/ms/monitor/nginx/sites**",
    skel: ".ngs-skel",
    real: ".ngs-card",
    realMin: 1
  },
  {
    name: "日志",
    tab: "日志",
    api: "**/ms/monitor/nginx/log/**",
    skel: ".ngl-skel",
    real: ".ngl-log",
    realMin: 0
  },
  {
    name: "配置",
    tab: "配置",
    api: "**/ms/monitor/nginx/config/**",
    skel: ".ngc-skel",
    real: ".ngc-editor",
    realMin: 0,
    // 配置面板不会自动打开任何 .conf（currentPath 初始为空），
    // 所以「切页签」本身不触发 loading —— 必须先点左侧一个文件，
    // 否则断言的其实是「没有内容要加载时不该显示骨架」，那本来就该没有骨架。
    beforeCheck: async (page) => {
      // 必须等文件列表真的出来：.conf 列表走的也是 /config/**，
      // 而这个通配正被我们拖慢 4s。固定 sleep 会「列表还没到就去找条目」，
      // 于是报「左侧没有 .conf 可点」——那是时序问题，不是功能问题。
      for (let i = 0; i < 60; i++) {
        if ((await page.locator(".ngc-file").count()) > 0) break;
        await sleep(250);
      }
      const f = page.locator(".ngc-file").first();
      if ((await f.count()) > 0) {
        await f.click();
        await sleep(300);
        return "已点开左侧第一个 .conf";
      }
      return "左侧确实没有 .conf（远端未返回配置文件）";
    }
  }
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e?.message ?? e).slice(0, 160)));

try {
  console.log("===== 0) 登录 =====");
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='用户名']", { timeout: 30000 });
  await page.fill("input[placeholder*='用户名']", "admin");
  await page.fill("input[type='password']", "admin@123!456");
  await page.click("button:has-text('登录')");
  let loggedIn = false;
  for (let i = 0; i < 30; i++) {
    const h = await page.evaluate(() => location.hash);
    if (h && !h.includes("/login")) { loggedIn = true; break; }
    await sleep(500);
  }
  check("登录成功", loggedIn);
  if (!loggedIn) throw new Error("登录失败");

  check("无 vite 错误浮层（模板语法正确）", (await page.locator("vite-error-overlay").count()) === 0);

  for (const p of PANELS) {
    console.log(`\n===== ${p.name}面板 =====`);
    // 标志位控制拖慢，避免 unroute 的竞态
    let slow = true;
    await page.route(p.api, async (route) => {
      if (slow) {
        await sleep(4000);
      }
      await route.continue();
    });

    await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    // 必须限定在左侧导航 .ngm-nav 里按文本找。
    // 直接 page.locator("text=配置") 会子串匹配到页头的「校验配置」按钮——
    // 它在 DOM 里更靠前，.first() 就点它了，于是页面根本没切到配置页签，
    // 后面所有断言都在对着错误的页面判（实测卡在这）。
    const navItem = page.locator(".ngm-nav-item").filter({ hasText: p.tab }).first();
    const navN = await navItem.count();
    check(`${p.name}：找到左侧导航项`, navN > 0, `.ngm-nav-item 匹配=${navN}`);
    if (navN > 0) {
      await navItem.click();
    }
    await sleep(1500);
    if (p.beforeCheck) {
      const note = await p.beforeCheck(page);
      console.log(`  （${note}）`);
    }

    let skelShown = false;
    for (let i = 0; i < 40; i++) {
      if ((await page.locator(p.skel).count()) > 0) { skelShown = true; break; }
      await sleep(250);
    }
    check(`${p.name}：骨架屏出现`, skelShown, skelShown ? "" : `未找到 ${p.skel}`);
    if (skelShown) {
      await page.screenshot({ path: path.join(SHOT_DIR, `${p.name}-1-skeleton.png`) });
      const realN = await page.locator(p.real).count();
      // realMin=0 的面板（内容可能为空）不强制这条，避免把「本来就没数据」判成叠加
      if (p.realMin > 0) {
        check(`${p.name}：骨架期间真实内容不在 DOM`, realN === 0, `真实节点=${realN}`);
      }
      // el-skeleton 的 item 必须真的画得出来：只写 loading 不够，
      // 主题色过淡时元素在但看不见（第一版就栽在这）。
      //
      // 注意判可见性不能只看 backgroundColor：animated 模式是用
      // background-image: linear-gradient(...) 做 shimmer 的，backgroundColor
      // 本身是透明（rgba(0,0,0,0)）——只看它会把所有骨架都判成不可见。
      // 这里改成「有尺寸 + 非隐藏 + 背景色或背景图任一不是纯白」。
      const visible = await page.evaluate((sel) => {
        const root = document.querySelector(sel);
        if (!root) return { items: 0, visibleItems: 0, sample: "" };
        const items = root.querySelectorAll(".el-skeleton__item");
        let v = 0;
        let sample = "";
        items.forEach((i) => {
          const r = i.getBoundingClientRect();
          const cs = getComputedStyle(i);
          const bg = cs.backgroundColor;
          const img = cs.backgroundImage;
          if (!sample) sample = "bg=" + bg + " img=" + (img || "none").slice(0, 60);
          const bgOpaque = bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
          const hasImg = img && img !== "none";
          const shown = cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
          if (r.width > 2 && r.height > 2 && shown && (bgOpaque || hasImg)) v++;
        });
        return { items: items.length, visibleItems: v, sample };
      }, p.skel);
      check(`${p.name}：骨架 item 真的画得出来（有尺寸且非隐藏/非透明）`,
        visible.items > 0 && visible.visibleItems > 0,
        `item=${visible.items} 可见=${visible.visibleItems} ${visible.sample}`);
    }

    slow = false;
    // 轮询等骨架消失，不写死 sleep：接口被拖慢的时长 + 页面自身加载耗时
    // 并不固定，固定 sleep 会在慢的那一轮里把「只是还没到」判成「骨架不消失」。
    let gone = false;
    for (let i = 0; i < 60; i++) {
      if ((await page.locator(p.skel).count()) === 0) { gone = true; break; }
      await sleep(500);
    }
    check(`${p.name}：数据到齐后骨架消失`, skelShown && gone,
      skelShown ? (gone ? "" : "等了 30s 仍在") : "骨架从未出现，本条无从验证");
    await page.screenshot({ path: path.join(SHOT_DIR, `${p.name}-2-loaded.png`) });
  }

  console.log("\n===== 全局 =====");
  check("全程无 pageerror", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));
} catch (e) {
  bad("脚本中断", String(e?.message ?? e).slice(0, 220));
  await page.screenshot({ path: path.join(SHOT_DIR, "99-crash.png") }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n===== 汇总：通过 ${pass} / 失败 ${fail} =====`);
if (failures.length) {
  console.log("失败明细：");
  failures.forEach((f) => console.log("  - " + f));
}
console.log(`截图目录：${SHOT_DIR}`);
process.exit(fail === 0 ? 0 : 1);
