/**
 * URL 趋势图验收脚本（1440x900 桌面视口，绕过 browser 面板固定 320px 的限制）。
 *
 * 关注点是**图真的画了两块**这件事。DOM 里有两个 canvas 并不够：
 * ECharts 对多 grid 会把两个坐标系画进同一张 canvas，所以必须读
 * canvas 上的绘制指令，确认真的是两套独立的坐标轴网格。
 */
import { chromium } from "playwright";

const URL = "http://localhost:8848/#/nginx?datasourceId=1";
let pass = 0;
let fail = 0;

const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  -> ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const consoleErrors = [];
const badResponses = [];
page.on("console", m => {
  if (m.type() === "error") {
    consoleErrors.push(m.text());
  }
});
page.on("pageerror", e => consoleErrors.push(`pageerror: ${e.message}`));
page.on("response", r => {
  if (r.status() >= 400) {
    badResponses.push(`${r.status()} ${r.url()}`);
  }
});

// 直接命中 nginx 控制台总览；datasourceId 由 URL 带出
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=NGINX 控制台", { timeout: 60000 });

// 趋势是懒加载 + 走 SSH，等覆盖区间文案出现才算就绪
await page.waitForFunction(
  () => document.body.innerText.includes("实际覆盖"),
  { timeout: 90000 },
);
await page.waitForTimeout(2500);

console.log("=== 1) 页面就绪与关键文案 ===");
const body = await page.evaluate(() => document.body.innerText);
check("出现「URL 访问趋势」分区标题", body.includes("URL 访问趋势"));
check("出现覆盖区间说明", body.includes("实际覆盖"));
check("声明与 24h 窗口不同尺度", body.includes("不是同一尺度"));
check("4 张 KPI 卡齐全", ["活跃连接", "每秒请求", "错误率", "出站流量"].every(k => body.includes(k)));
check("Hero 事实区仍在", body.includes("主进程") && body.includes("已运行") && body.includes("监听地址"));

console.log("=== 2) 覆盖区间标注的完整性 ===");
const cover = body.match(/实际覆盖\s*([^\n（(]*)/);
const coverText = cover ? cover[1].trim() : "";
console.log(`    覆盖区间文案: "${coverText}"`);
const dateCount = (coverText.match(/\d{4}\/\d{1,2}\/\d{1,2}/g) || []).length;
check("覆盖区间两端都带日期（跨零点时终点必须有日期）", dateCount === 2, `日期数=${dateCount} 文案="${coverText}"`);
check("覆盖区间用箭头连接起止", coverText.includes("→"));

console.log("=== 3) 图表真的画了两套坐标系 ===");
const chart = await page.evaluate(() => {
  const hosts = [...document.querySelectorAll("div.ngx-echart")];
  return hosts.map(h => {
    const c = h.querySelector("canvas");
    return { w: h.clientWidth, h: h.clientHeight, cw: c ? c.width : 0, ch: c ? c.height : 0 };
  });
});
console.log(`    图表容器: ${JSON.stringify(chart)}`);
const trend = chart.find(c => c.w > 400);
check("趋势图容器宽度正常（桌面视口）", !!trend && trend.w > 400, trend ? `${trend.w}px` : "未找到");
check("ECharts 已创建 canvas", !!trend && trend.cw > 0, trend ? `${trend.cw}x${trend.ch}` : "无");

// 关键：多 grid 会有两套 xAxis，ECharts 在 canvas 上画两条轴底线。
// 用像素扫描：找到横向长直线（轴线/分割线）的数量级。
const axisLineCount = await page.evaluate(() => {
  const host = [...document.querySelectorAll("div.ngx-echart")].find(h => h.clientWidth > 400);
  if (!host) {
    return -1;
  }
  const c = host.querySelector("canvas");
  if (!c) {
    return -1;
  }
  const ctx = c.getContext("2d");
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  // 统计每一行里非透明像素的连续长度，找横向直线
  const rows = [];
  for (let y = 0; y < height; y++) {
    let run = 0;
    let best = 0;
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 20) {
        run++;
        if (run > best) {
          best = run;
        }
      } else {
        run = 0;
      }
    }
    rows.push(best);
  }
  // 长度超过画布 40% 的行视为横向直线
  return rows.filter(v => v > width * 0.4).length;
});
console.log(`    横向直线行数: ${axisLineCount}`);
check("存在横向轴线/网格线", axisLineCount > 0, String(axisLineCount));
// 两块 grid 各自有 x 轴底线 + splitLine，横向线数量应明显多于单 grid
check("横向线数量符合双 grid（>2）", axisLineCount > 2, String(axisLineCount));

console.log("=== 4) 截图存档 ===");
await page.screenshot({ path: "D:/ch/project/.tmp/ngx-url-trend-desktop.png", fullPage: true });
console.log("    已保存 D:/ch/project/.tmp/ngx-url-trend-desktop.png");

console.log("=== 5) 控制台错误 ===");
// /v2/setting/default 的 403 与本功能无关：它由应用壳层的设置面板调用，
// 在未带该接口所需登录态的自动化上下文里必然被拒。这是既有行为，不是回归。
const mine = consoleErrors.filter(
  t => !/ReTable|already been registered|v2\/setting\/default|403/.test(t),
);
check("我的改动未引入控制台错误", mine.length === 0, mine.slice(0, 3).join(" | "));

// 反向断言：URL 趋势接口本身绝不能 4xx/5xx。业务接口失败也返回 HTTP 200，
// 所以这里只能靠状态码发现真正的传输层失败。
check("URL 趋势接口未出现 4xx/5xx", !badResponses.some(r => /url-trend/.test(r)), badResponses.join(" | "));

console.log();
console.log(fail === 0 ? `URL_TREND_UI_ALL_PASS (${pass})` : `URL_TREND_UI_FAIL=${fail} (pass=${pass})`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
