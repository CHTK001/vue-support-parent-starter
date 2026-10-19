/**
 * 样式「压缩后仍保留」契约。
 *
 * <p>存在理由：交付要求在<b>构建产物</b>上验收，而构建产物与 dev 的唯一额外风险就是
 * CSS 压缩 —— 现代函数（{@code color-mix()}）或自定义属性被压掉，dev 上一切正常、
 * 产物上却静默失效。实测本仓经历过一次「构建被别的未完成文件挡住、无法在产物上验收」
 * 的局面，这一轴当时没有守门，只能临时手验。所以固化成常驻检查。</p>
 *
 * <p>做法：把被测样式块按**与构建同一条链路**处理（SCSS 先经 sass 编译，再经 Vite 的
 * CSS 压缩器），然后断言关键令牌与函数仍在。</p>
 *
 * <p>退出码 0 = 全过。</p>
 *
 * @author CH
 * @since 2026-10-16
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI = path.resolve(APP_ROOT, "..", "..", "packages", "ui", "src", "components");

const vite = require("vite");

/**
 * 解析 sass。
 *
 * <p>pnpm 的严格结构下 {@code require("sass")} 常常解析不到 —— sass 挂在仓库根 /
 * {@code node_modules/.pnpm}，并没有链进应用自己的 node_modules。
 * 所以按「先常规解析、再扫 .pnpm」两步来，而不是写死某个带版本号的路径
 * （写死版本号会在依赖升级后静默失效）。</p>
 */
function resolveSass() {
  try {
    return require("sass");
  } catch { /* 继续扫描 */ }
  const pnpm = path.resolve(APP_ROOT, "..", "..", "node_modules", ".pnpm");
  if (existsSync(pnpm)) {
    for (const d of readdirSync(pnpm)) {
      if (!/^sass@/.test(d)) continue;
      const p = path.join(pnpm, d, "node_modules", "sass");
      if (existsSync(path.join(p, "package.json"))) return require(p);
    }
  }
  throw new Error("找不到 sass（既不常规可解析，也不在 .pnpm 下）");
}

const sass = resolveSass();

let pass = 0;
const fails = [];
const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  -> ${detail}` : ""}`);
  ok ? pass++ : fails.push(`${name}${detail ? `  -> ${detail}` : ""}`);
};

/**
 * 压缩器：优先用 Vite 新版 `transformWithOxc`，回退旧的 `transformWithEsbuild`。
 *
 * <p>两者都不可用时**判 FAIL 而不是跳过** —— 跳过会让这一轴变成无声的空白，
 * 而「压不压掉」正是这个脚本唯一要回答的问题。</p>
 */
let usedMinifier = "";
async function minifyCss(css) {
  /* 先试 Oxc（Vite 8 的新压缩器），**抛错也要回退** ——
     只按「函数是否存在」回退是不够的：Oxc 的 CSS 解析器比 esbuild 严，
     实测在本仓的 re-kit.css 上报 PARSE_ERROR，此时必须落到 esbuild，
     否则这条检查会因压缩器自身解析失败而变成假红。 */
  if (typeof vite.transformWithOxc === "function") {
    try {
      const r = await vite.transformWithOxc(css, "x.css", { lang: "css", minify: true });
      usedMinifier = "oxc";
      return typeof r === "string" ? r : r.code;
    } catch { /* 回退 esbuild */ }
  }
  if (typeof vite.transformWithEsbuild === "function") {
    const r = await vite.transformWithEsbuild(css, "x.css", { loader: "css", minify: true });
    usedMinifier = usedMinifier || "esbuild";
    return r.code;
  }
  throw new Error("Vite 既无可用 transformWithOxc 也无 transformWithEsbuild，无法验证压缩安全性");
}

/** 取出 .vue 的 scss 样式块并编译成 CSS */
function compileVueScss(file) {
  const src = readFileSync(file, "utf8");
  const m = src.match(/<style[^>]*lang="scss"[^>]*>([\s\S]*?)<\/style>/);
  if (!m) throw new Error(`${file} 里找不到 <style lang="scss"> 块`);
  return sass.compileString(m[1]).css;
}

console.log("=== 样式压缩后保留契约 ===");

try {
  const reKit = readFileSync(path.join(UI, "ReKit", "re-kit.css"), "utf8");
  const square = compileVueScss(path.join(UI, "ReSelect", "layouts", "Square.vue"));

  const minReKit = (await minifyCss(reKit)).replace(/\s+/g, "");
  const minSquare = (await minifyCss(square)).replace(/\s+/g, "");

  console.log(`  [info] re-kit.css ${reKit.length} → ${minReKit.length} B`);
  console.log(`  [info] Square.vue ${square.length} → ${minSquare.length} B`);
  console.log(`  [info] 实际使用的 CSS 压缩器：${usedMinifier || "(未知)"}`);

  /* 按钮组选中态：压深主色的定义与实际引用都必须活下来 */
  check("按钮组：压缩后仍有 --re-radio-active-bg 定义（含 color-mix）",
    /--re-radio-active-bg:color-mix\(/.test(minReKit));
  check("按钮组：压缩后仍保留 72% 与 --el-color-black",
    /72%/.test(minReKit) && /--el-color-black/.test(minReKit));
  check("按钮组：压缩后选中态仍引用该变量（≥2 处）",
    (minReKit.match(/var\(--re-radio-active-bg\)/g) || []).length >= 2,
    `实得 ${(minReKit.match(/var\(--re-radio-active-bg\)/g) || []).length} 处`);
  check("按钮组：压缩后 color-mix 未被压掉",
    minReKit.includes("color-mix("), `实得 ${(minReKit.match(/color-mix\(/g) || []).length} 处`);

  /* ReSelect 对勾：同一口径 */
  check("ReSelect 对勾：压缩后仍保留 72% 与 --el-color-black",
    /72%/.test(minSquare) && /--el-color-black/.test(minSquare));

  /* 反向对照：证明这套判据不是「永远为真」。
     拿一段不含 color-mix 的样式压一遍，若断言照样通过，说明判据写松了。 */
  const control = (await minifyCss(".x{color:#123456}")).replace(/\s+/g, "");
  check("判别力：不含 color-mix 的样式不会误判为通过",
    !control.includes("color-mix(") && !/72%/.test(control),
    `对照样本 ${control}`);
} catch (e) {
  check("样式压缩契约可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 200));
}

console.log(`\nCSS_KEEP_PASS=${pass} FAIL=${fails.length}`);
if (fails.length) {
  console.log("失败明细：");
  for (const f of fails) console.log(`  - ${f}`);
}
console.log(fails.length === 0 ? "CSS_KEEP_ALL_PASS" : "CSS_KEEP_HAS_FAIL");
process.exitCode = fails.length === 0 ? 0 : 1;
