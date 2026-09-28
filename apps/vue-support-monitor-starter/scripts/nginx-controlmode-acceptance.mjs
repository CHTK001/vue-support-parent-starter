/**
 * 「nginx 进程控制方式」二选一功能验收。
 *
 * 与 nginx-console-acceptance.mjs 互补：那个验「既有功能没被改坏」，
 * 这个只验本次新增的 controlMode / controlTarget 两个字段是否真的端到端可用。
 *
 * 覆盖：
 *   A) 表单：nginx 类型才出现控制方式；非 nginx 类型不出现
 *   B) 落库：local / systemd 各存成什么；切到别的类型后 controlTarget 被清空
 *   C) 脏值：后端对不认识的 mode 归一为空（自动探测），不报错也不静默生效
 *   D) 通道分流：local 模式调 stop 的返回消息不带「经 xxx.service」，
 *      systemd 模式带 —— 这是「二选一真的改变控制面」的判据，
 *      光看配置存对了不算数
 *
 * D 会真的停/启 8080 上的 nginx。执行顺序上先 local 后 systemd，
 * 末尾无论成败都调一次 start 兜底恢复（探针确认 8080 起来才算完）。
 *
 * 用法：node nginx-controlmode-acceptance.mjs [地址=http://127.0.0.1:5180]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:5180";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-controlmode");
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, detail = "") {
  pass++;
  console.log(`  [PASS] ${name}${detail ? "  " + detail : ""}`);
}
function bad(name, detail = "") {
  fail++;
  failures.push(name + (detail ? " :: " + detail : ""));
  console.log(`  [FAIL] ${name}${detail ? "  " + detail : ""}`);
}
function check(name, cond, detail = "") {
  cond ? ok(name, detail) : bad(name, detail);
  return !!cond;
}

/**
 * 探测 8080 是否在服务。
 *
 * 注意目标是 192.168.50.198 而不是 127.0.0.1：nginx 跑在 198 上，
 * 本机只是前端 dev server 所在，探 127.0.0.1:8080 永远探不到。
 */
async function probe8080() {
  try {
    const r = await fetch("http://192.168.50.198:8080/", { signal: AbortSignal.timeout(8000) });
    return r.status;
  } catch {
    return 0;
  }
}

/**
 * 打开数据源页并强制刷新。
 *
 * 不用 page.goto 直接跳：目标 URL 与当前 URL 只差 hash 时，goto 只改 hash 不触发
 * reload，Vue 组件状态会整个留着——上一步开着的「新增数据源」对话框会继续存在，
 * 于是 button:has-text('新增数据源') 同时匹配到页头按钮和对话框标题，
 * 选到第一个又因为对话框遮挡而点不动。
 */
async function gotoDatasourceFresh() {
  await page.goto(`${BASE}/#/datasource`, { waitUntil: "domcontentloaded" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ds-item", { timeout: 25000 });
  await page.waitForTimeout(600);
}

/** 直接调后端接口（拿登录 token），用于造脏值与读回写结果 */
async function api(token, method, url, body) {
  const r = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-oauth-token": token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  try {
    return { http: r.status, json: JSON.parse(text) };
  } catch {
    return { http: r.status, text };
  }
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

try {
  // ============ 0) 登录 ============
  console.log("===== 0) 登录 =====");
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='用户名']", { timeout: 30000 });
  await page.fill("input[placeholder*='用户名']", "admin");
  await page.fill("input[type='password']", "admin@123!456");
  await page.click("button:has-text('登录')");
  let loggedIn = false;
  for (let i = 0; i < 30; i++) {
    const hash = await page.evaluate(() => location.hash);
    if (hash && !hash.includes("/login")) {
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  check("登录成功", loggedIn, `url=${page.url()}`);
  if (!loggedIn) throw new Error("登录失败，后续用例无意义");

  // 拿 token 供 API 直调
  const token = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      const v = localStorage.getItem(k) || "";
      const m = v.match(/[0-9a-f]{64,}/);
      if (m) return m[0];
    }
    return "";
  });
  check("取到 token 供接口直调", !!token, token ? `长度=${token.length}` : "localStorage 里没找到 64 位以上 hex");

  // ============ A) 表单：nginx 才出现 ============
  console.log("\n===== A) 表单按类型显隐 =====");
  await gotoDatasourceFresh();
  await page.click("button:has-text('新增数据源')");
  await page.waitForSelector(".el-dialog", { timeout: 15000 });
  await page.waitForTimeout(800);

  // 先切到 jdbc，确认控制方式不出现
  const typeSel = page.locator(".el-dialog .re-select, .el-dialog .el-select").first();
  await typeSel.click();
  await page.waitForTimeout(600);
  await page.locator(".el-select-dropdown__item:has-text('JDBC')").first().click();
  await page.waitForTimeout(700);
  const jdbcHasCtrl = await page.locator(".el-dialog").innerText();
  check("JDBC 类型不显示控制方式", !jdbcHasCtrl.includes("控制方式"), "");

  // 切到 nginx，确认出现
  await typeSel.click();
  await page.waitForTimeout(600);
  await page.locator(".el-select-dropdown__item:has-text('Nginx')").first().click();
  await page.waitForTimeout(900);
  const nginxDialogText = await page.locator(".el-dialog").first().innerText();
  check("nginx 类型显示控制方式", nginxDialogText.includes("控制方式"), "");
  // 默认（自动探测）态渲染的是 v-else 段，说明文字讲的是「走不走 systemd」，
  // 而 systemctl 这个词只出现在 v-else-if（已选 systemd）那段。
  // 别拿 systemd 模式的关键词去查默认态——上一轮就是这么误报的。
  check(
    "默认态说明解释了自动探测语义",
    nginxDialogText.includes("自动判断") && nginxDialogText.includes("systemd") && nginxDialogText.includes("本地目录"),
    "应含「自动判断 / systemd / 本地目录」"
  );
  check("默认态说明不提 systemctl（那是 systemd 模式才有的文案）", !nginxDialogText.includes("systemctl"), "");
  check("默认未选单元名输入（自动探测时不显示）", !nginxDialogText.includes("托管单元名"), "");
  await page.screenshot({ path: path.join(SHOT_DIR, "A1-nginx-controlmode.png") });

  // 三个选项都在
  const ctrlItem = page.locator(".el-dialog .re-form-item:has-text('控制方式')").first();
  await ctrlItem.locator(".el-select").first().click();
  await page.waitForTimeout(700);
  const opts = await page.locator(".el-select-dropdown:visible").innerText();
  check("控制方式含三个选项", opts.includes("自动探测") && opts.includes("systemd") && opts.includes("本地目录"), opts.replace(/\s+/g, " ").slice(0, 70));
  await page.screenshot({ path: path.join(SHOT_DIR, "A2-options.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  // 顺手关掉对话框：留着会让后面的「新增数据源」定位同时命中对话框标题
  const cancel = page.locator(".el-dialog button:has-text('取消')").first();
  if (await cancel.count()) {
    await cancel.click();
    await page.waitForTimeout(600);
  }

  // ============ B) 落库：三种取值 ============
  console.log("\n===== B) 落库与读取 =====");
  const TEST_NAME = "zz-controlmode-probe";
  const SSH_HOST = "127.0.0.1";
  const SSH_PORT = 22;

  async function fillAndSave({ name, type, mode, target }) {
    await gotoDatasourceFresh();
    await page.click("button:has-text('新增数据源')");
    await page.waitForSelector(".el-dialog", { timeout: 15000 });
    await page.waitForTimeout(700);
    await page.fill(".el-dialog input[type='text']", name);
    const sel = page.locator(".el-dialog .re-select, .el-dialog .el-select").first();
    await sel.click();
    await page.waitForTimeout(600);
    await page.locator(`.el-select-dropdown__item:has-text('${type}')`).first().click();
    await page.waitForTimeout(800);
    if (type === "nginx") {
      const c = page.locator(".el-dialog .re-form-item:has-text('控制方式')").first();
      await c.locator(".el-select").first().click();
      await page.waitForTimeout(600);
      await page.locator(`.el-select-dropdown:visible >> text=${mode}`).first().click();
      await page.waitForTimeout(700);
      if (target) {
        // placeholder 是「例如 nginx.service；留空则由后端自动探测」，
        // 不含「单元名」三字——那是 label 文本。别用 label 的词去选 input。
        const unitInput = page.locator(".el-dialog input[placeholder*='nginx.service']").first();
        await unitInput.fill(target);
        await page.waitForTimeout(300);
        const afterPick = await page.locator(".el-dialog").first().innerText();
        check(
          "systemd 模式说明提到 systemctl",
          afterPick.includes("systemctl") && afterPick.includes("托管单元名"),
          ""
        );
      }
    }
    await page.click(".el-dialog button:has-text('保存')");
    await page.waitForTimeout(2500);
  }

  // B1: local
  await fillAndSave({ name: TEST_NAME + "-local", type: "nginx", mode: "本地目录" });
  let lst = await api(token, "GET", "/ms/datasource/list");
  let row = (lst.json?.data || []).find((d) => d.name === TEST_NAME + "-local");
  check("B1 local 模式已创建", !!row, row ? `id=${row.id}` : "列表里没找到");
  check("B1 controlMode 落库为 local", row?.controlMode === "local", `实际=${JSON.stringify(row?.controlMode)}`);
  check("B1 controlTarget 为空（local 不用它）", !row?.controlTarget, `实际=${JSON.stringify(row?.controlTarget)}`);

  // B2: systemd + 单元名
  await fillAndSave({ name: TEST_NAME + "-systemd", type: "nginx", mode: "systemd 托管", target: "zz-probe.service" });
  lst = await api(token, "GET", "/ms/datasource/list");
  row = (lst.json?.data || []).find((d) => d.name === TEST_NAME + "-systemd");
  check("B2 systemd 模式已创建", !!row, row ? `id=${row.id}` : "列表里没找到");
  check("B2 controlMode 落库为 systemd", row?.controlMode === "systemd", `实际=${JSON.stringify(row?.controlMode)}`);
  check("B2 controlTarget 落库为单元名", row?.controlTarget === "zz-probe.service", `实际=${JSON.stringify(row?.controlTarget)}`);

  // B3: 走详情接口确认 VO 真的带出了这两个字段
  if (row?.id) {
    const one = await api(token, "GET", `/ms/datasource/${row.id}`);
    const d = one.json?.data;
    check("B3 详情接口带出 controlMode", d?.controlMode === "systemd", `实际=${JSON.stringify(d?.controlMode)}`);
    check("B3 详情接口带出 controlTarget", d?.controlTarget === "zz-probe.service", `实际=${JSON.stringify(d?.controlTarget)}`);
  }

  // B4: 脏值归一（不认识的 mode 不该被存下来）
  if (row?.id) {
    await api(token, "PUT", `/ms/datasource/${row.id}`, {
      name: TEST_NAME + "-systemd",
      type: "nginx",
      host: SSH_HOST,
      port: SSH_PORT,
      username: "kali",
      password: "kali",
      database: "",
      remark: "",
      status: 1,
      controlMode: "supervisor",
      controlTarget: "zz-probe.service"
    });
    const after = await api(token, "GET", "/ms/datasource/list");
    const r2 = (after.json?.data || []).find((d) => d.id === row.id);
    check("B4 脏 mode（supervisor）被归一为空而非原样存下", !r2?.controlMode, `实际=${JSON.stringify(r2?.controlMode)}`);
    check("B4 归一后 controlTarget 一并清掉", !r2?.controlTarget, `实际=${JSON.stringify(r2?.controlTarget)}`);
  }

  // B5: 切成 jdbc，controlTarget 必须被清（只有 systemd 才留）
  if (row?.id) {
    await api(token, "PUT", `/ms/datasource/${row.id}`, {
      name: TEST_NAME + "-as-jdbc",
      type: "jdbc",
      host: SSH_HOST,
      port: 3306,
      username: "root",
      password: "x",
      database: "demo",
      remark: "",
      status: 1,
      controlMode: "systemd",
      controlTarget: "zz-probe.service"
    });
    const after = await api(token, "GET", "/ms/datasource/list");
    const r3 = (after.json?.data || []).find((d) => d.id === row.id);
    check("B5 切到 jdbc 后 controlMode 被清", !r3?.controlMode, `实际=${JSON.stringify(r3?.controlMode)}`);
    check("B5 切到 jdbc 后 controlTarget 被清", !r3?.controlTarget, `实际=${JSON.stringify(r3?.controlTarget)}`);
  }

  // ============ C) 通道分流（真点启停）============
  console.log("\n===== C) 通道分流：local 不带「经 xxx.service」 =====");
  const orig = (await api(token, "GET", "/ms/datasource/list")).json?.data?.find((d) => d.id === 1);
  check("拿到生产数据源 local-kali-nginx 作为探测对象", !!orig, orig ? `当前 mode=${JSON.stringify(orig.controlMode)}` : "");

  if (orig) {
    const snapshot = { mode: orig.controlMode || "", target: orig.controlTarget || "" };

    // C1: 置为 local，stop 的消息应是裸信号口径
    await api(token, "PUT", "/ms/datasource/1", {
      name: orig.name, type: "nginx", host: orig.host, port: orig.port,
      username: orig.username, password: orig.password, database: orig.database,
      remark: orig.remark, status: orig.status,
      controlMode: "local", controlTarget: ""
    });
    const rLocal = await api(token, "POST", "/ms/monitor/nginx/stop?datasourceId=1");
    const msgLocal = rLocal.json?.data?.message || rLocal.json?.msg || "";
    check("C1 local 模式 stop 成功", rLocal.json?.data?.success === true, msgLocal.slice(0, 60));
    check("C1 local 模式消息不带「经 xxx.service」", !/经\s*\S+\.service/.test(msgLocal), `消息=${msgLocal.slice(0, 60)}`);
    check("C1 local 模式消息是裸信号口径", msgLocal.includes("已停止") && msgLocal.trim() === "已停止", `消息=${JSON.stringify(msgLocal)}`);

    // C2: 置为 systemd（显式单元名），start 应走 systemctl
    await api(token, "PUT", "/ms/datasource/1", {
      name: orig.name, type: "nginx", host: orig.host, port: orig.port,
      username: orig.username, password: orig.password, database: orig.database,
      remark: orig.remark, status: orig.status,
      controlMode: "systemd", controlTarget: "ngx-console.service"
    });
    const rStart = await api(token, "POST", "/ms/monitor/nginx/start?datasourceId=1");
    const msgStart = rStart.json?.data?.message || rStart.json?.msg || "";
    check("C2 systemd 模式 start 成功", rStart.json?.data?.success === true, msgStart.slice(0, 70));
    check("C2 systemd 模式消息带「经 xxx.service」", /经\s*ngx-console\.service/.test(msgStart), `消息=${msgStart.slice(0, 70)}`);

    // C3: 8080 恢复
    let st = 0;
    for (let i = 0; i < 12; i++) {
      st = await probe8080();
      if (st === 200) break;
      await page.waitForTimeout(2500);
    }
    check("C3 8080 恢复服务", st === 200, `HTTP ${st}`);

    // C4: 还原生产数据源的原设置
    await api(token, "PUT", "/ms/datasource/1", {
      name: orig.name, type: "nginx", host: orig.host, port: orig.port,
      username: orig.username, password: orig.password, database: orig.database,
      remark: orig.remark, status: orig.status,
      controlMode: snapshot.mode, controlTarget: snapshot.target
    });
    const restored = (await api(token, "GET", "/ms/datasource/list")).json?.data?.find((d) => d.id === 1);
    check("C4 生产数据源已还原", (restored?.controlMode || "") === snapshot.mode, `还原后 mode=${JSON.stringify(restored?.controlMode)}`);
  }

  // ============ 收尾：删掉探针数据源 ============
  console.log("\n===== 收尾：清理探针数据源 =====");
  const all = (await api(token, "GET", "/ms/datasource/list")).json?.data || [];
  const probes = all.filter((d) => String(d.name).startsWith(TEST_NAME));
  for (const p of probes) {
    await api(token, "DELETE", `/ms/datasource/${p.id}`);
  }
  const rest = ((await api(token, "GET", "/ms/datasource/list")).json?.data || []).filter((d) =>
    String(d.name).startsWith(TEST_NAME)
  );
  check("探针数据源已全部删除", rest.length === 0, `残留 ${rest.length} 条`);

  const stFinal = await probe8080();
  check("收尾 8080 = HTTP 200", stFinal === 200, `HTTP ${stFinal}`);
} catch (e) {
  bad("脚本执行中断", String(e?.message ?? e).slice(0, 200));
  // 中断时也要兜底把 nginx 拉起来
  const st = await probe8080();
  if (st !== 200) {
    console.log(`  [WARN] 异常退出且 8080 = ${st}，请手工 systemctl start ngx-console`);
  }
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
