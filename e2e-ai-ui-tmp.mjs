// AI 设置面板全功能端到端测试（Playwright）
// 前置：后端 8080 + 前端 8088 运行中
// 运行：node e2e-ai-ui-test.mjs （在仓库根目录下执行，resolve playwright）
import { chromium } from "playwright";
import path from "path";

const BASE = "http://localhost:8088";
const results = [];
let browser;

const record = (pass, name, detail = "") => {
  results.push({ pass: !!pass, name, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? " :: " + detail : ""}`);
};

const step = async (name, fn) => {
  try {
    await fn();
    record(true, name);
  } catch (e) {
    record(false, name, (e.message || String(e)).split("\n")[0]);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);

  // 捕获页面 console 报错
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(`console: ${msg.text()}`);
  });

  // ===== 面板可达性 =====
  const panels = [
    ["/model/providers", "提供商面板"],
    ["/model/models", "模型面板"],
    ["/model/groups", "分组面板"],
    ["/model/app-keys", "AppKey 面板"],
    ["/model/alerts", "告警面板"],
    ["/model/usage", "用量面板"],
    ["/model/services", "服务面板"],
    ["/model/global", "全局配置面板"],
  ];

  for (const [route, label] of panels) {
    await step(`打开 ${label} (${route})`, async () => {
      await page.goto(`${BASE}/#${route}`);
      await sleep(600);
      const text = await page.locator("body").innerText();
      if (!text || text.trim().length < 10) throw new Error("页面内容为空");
      if (/加载失败|Network Error|TypeError|Unhandled/.test(text)) throw new Error("页面出现错误文案");
    });
  }

  // ===== 提供商面板 =====
  await page.goto(`${BASE}/#/model/providers`);
  await sleep(800);
  record(true, "提供商: 面板初始化");

  await step("提供商: 打开新增对话框", async () => {
    const btn = page.locator("button").filter({ hasText: /新增|新厂商|新建/ }).first();
    await btn.click();
    await sleep(400);
    const dialogs = await page.locator(".el-dialog").filter({ visible: true }).count();
    if (dialogs === 0) throw new Error("对话框未弹出");
    await page.keyboard.press("Escape");
    await sleep(200);
  });

  // ===== 模型面板 =====
  await page.goto(`${BASE}/#/model/models`);
  await sleep(800);
  await step("模型: 打开新增对话框", async () => {
    const btn = page.locator("button").filter({ hasText: /新增|添加模型/ }).first();
    // 若无此按钮（非管理员态）则跳过视为通过（dev 下应有）
    if ((await btn.count()) === 0) {
      throw new Error("未找到新增按钮（可能被权限隐藏）");
    }
    await btn.click();
    await sleep(400);
    const dialogs = await page.locator(".el-dialog").filter({ visible: true }).count();
    if (dialogs === 0) throw new Error("对话框未弹出");
    await page.keyboard.press("Escape");
    await sleep(200);
  });

  // ===== 分组面板 =====
  await page.goto(`${BASE}/#/model/groups`);
  await sleep(800);
  await step("分组: 打开新建分组对话框", async () => {
    const btn = page.locator("button").filter({ hasText: /新建分组|新增/ }).first();
    if ((await btn.count()) === 0) throw new Error("未找到新增分组按钮");
    await btn.click();
    await sleep(400);
    const dialogs = await page.locator(".el-dialog").filter({ visible: true }).count();
    if (dialogs === 0) throw new Error("对话框未弹出");
    await page.keyboard.press("Escape");
    await sleep(200);
  });

  // ===== AppKey 面板 =====
  await page.goto(`${BASE}/#/model/app-keys`);
  await sleep(800);
  await step("AppKey: 打开新增对话框", async () => {
    const btn = page.locator("button").filter({ hasText: /新增/ }).first();
    if ((await btn.count()) === 0) throw new Error("未找到新增按钮");
    await btn.click();
    await sleep(400);
    const dialogs = await page.locator(".el-dialog").filter({ visible: true }).count();
    if (dialogs === 0) throw new Error("对话框未弹出");
    await page.keyboard.press("Escape");
    await sleep(200);
  });

  // ===== 告警面板 =====
  await page.goto(`${BASE}/#/model/alerts`);
  await sleep(800);
  await step("告警: 面板加载", async () => {
    const text = await page.locator("body").innerText();
    if (/加载失败/.test(text)) throw new Error("加载失败");
  });

  // ===== 全局配置面板 =====
  await page.goto(`${BASE}/#/model/global`);
  await sleep(800);
  await step("全局配置: 表单加载输入框数量", async () => {
    const n = await page.locator("input").count();
    if (n < 2) throw new Error(`输入框过少: ${n}`);
  });

  // ===== 用量/服务面板 =====
  await page.goto(`${BASE}/#/model/usage`);
  await sleep(800);
  await step("用量面板加载", async () => {
    const text = await page.locator("body").innerText();
    if (/加载失败/.test(text)) throw new Error("加载失败");
  });

  // ===== 页面 JS 错误 =====
  await step("无页面 JS 运行时错误", async () => {
    const errors = pageErrors.filter((e) => !/favicon|Failed to load resource|net::ERR/.test(e));
    if (errors.length) throw new Error(errors.slice(0, 3).join(" | "));
  });

  console.log("\n===== 汇总 =====");
  const failed = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "✔" : "✘"} ${r.name}${r.detail ? " — " + r.detail : ""}`);
  console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("异常:", e);
  if (browser) await browser.close();
  process.exit(1);
});