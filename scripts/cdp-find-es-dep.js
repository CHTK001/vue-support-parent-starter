/**
 * 定位 es-*.js 到底是哪个依赖，并把它对应到源码里的调用点。
 *
 * 只看 trace 里的行号不够，直接去 dev server 上把这个模块下载下来，
 * 取 10566 / 10719 / 10763 三行附近的源码，就能看出是哪个库。
 */
const TARGET = process.env.TARGET_URL || "http://localhost:8848";

(async () => {
  // 1. 从首页 HTML 里拿到 es-xxx.js 的真实地址（带 ?v= 哈希）
  const html = await (await fetch(`${TARGET}/`)).text();
  const files = [...new Set([...html.matchAll(/\/@fs\/[^"']*?es-[A-Za-z0-9_-]+\.js[^"']*/g)].map((m) => m[0]))];
  console.log("首页引用到的 es-*.js：");
  files.slice(0, 10).forEach((f) => console.log("  " + f));

  // 2. 再从 deps 目录的 metadata 里找包名
  const metaUrl = `${TARGET}/@fs/D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/node_modules/.vite-cache-8848/deps/_metadata.json`;
  const meta = await (await fetch(metaUrl)).text();
  console.log("\n_metadata.json 长度:", meta.length);
  const hit = [...meta.matchAll(/"([^"]*es-[A-Za-z0-9_-]+\.js)":\s*\{[^}]*"src":\s*"([^"]+)"/g)];
  hit.slice(0, 20).forEach(([, out, src]) => console.log(`  ${out}  <-  ${src}`));
  if (!hit.length) {
    console.log("原始片段:", meta.slice(0, 800));
  }
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
