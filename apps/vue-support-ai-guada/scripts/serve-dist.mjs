/**
 * 生产构建产物（`pnpm build` 的 dist）验收运行器：零依赖静态服务 + API 反向代理 + WS upgrade
 *
 * 为什么需要它（2026-10-06 补齐项）：
 *   本目录的浏览器验收（run-all-against-dist.mjs）**默认跑 dev 形态**，而
 *   README 原先写着「生产构建产物」形态**没有可用运行器**（`.run/deploy/serve-dist.mjs`
 *   已随 `.run/` 目录一起消失），于是 dist 形态只能"未跑即不宣称"。
 *   没有运行器 ≠ 没有问题：产物里少了拷贝、路由走 SPA 兜底这类缺陷只在静态形态暴露
 *   （见验收报告 §7.1「dist/app.yaml」），所以必须能把 dist 原样起起来验。
 *
 * 为什么不用 vite preview：vite.config.ts 只配了 server.proxy，preview 段没有 proxy，
 * `/v2/**`、`/api/**`、`/static/**` 会 404；而且 preview 不做反代 rewrite，无法复刻
 * `/api/v1/**` → `/v2` 这条线上的路径前缀差异。
 *
 * 为什么不用 dev server：dev 走 vite HMR，同仓库别的 agent 一改文件就整页 reload，
 * 验收稳不住；dist 是静态产物，没有 HMR，期间不会被别人打断。
 *
 * 用法（工作目录不限，路径都按本文件自解析）：
 *   node scripts/serve-dist.mjs [端口=15690] [后端=http://192.168.50.198:8787]
 *
 * 与 vite.config.ts 的对齐点（改那边必须同步改这边）：
 *   1. AI_API_TARGET 默认值必须是**远端**后端（本机不跑后台，仓库根 README 同款约定）；
 *   2. 代理前缀与 EXACT_ASSETS 白名单照抄 vite.config.ts，顺序有意义：
 *      `/api/v1` 必须**先于** `/api` 判定（前者要 rewrite 成 `/v2`，后者原样转发）。
 *
 * 与 dev 形态的行为差异（仅此一处，且只多不少）：
 *   `/app.yaml` —— 若 dist 根下没有该文件，回退到 `dist/apps/{APP}/app.yaml`。
 *   这是对验收报告 §7.1 的**运行器侧垫片**，不是打包侧修复：打包仍照原样输出，
 *   报告 §7.1 的定位（拷贝逻辑放哪一级）保持"待定位"，不因垫片而改口。
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const DIST = path.join(APP_DIR, "dist");
const WORKSPACE_ROOT = path.resolve(APP_DIR, "../..");

const PORT = Number(process.argv[2] || 15690);
const BACKEND = process.argv[3] || process.env.AI_API_TARGET || "http://192.168.50.198:8787";
const BACKEND_URL = new URL(BACKEND);
const APP_NAME = path.basename(APP_DIR);

/** 直连后端的路径前缀。**顺序即判定顺序**：`/api/v1` 必须排在 `/api` 之前。 */
const PROXY = [
  { prefix: "/api/v1", rewrite: "/v2" }, // 线上前缀，落到后端的 /v2
  { prefix: "/v2", rewrite: null },
  { prefix: "/api", rewrite: null },
  { prefix: "/static", rewrite: null },
  { prefix: "/ws/chat", rewrite: null },
];
/** WebSocket 前缀（upgrade 单独走一条路，HTTP 转发语义不同） */
const WS_PREFIXES = ["/ws"];

/**
 * 只读的共享资源：构建期会拷进 dist（vite.config.ts closeBundle），
 * 这里作为兜底，保证「产物没拷」时 dev/dist 两种形态行为一致。
 */
const SHARED_ASSETS = new Map([
  ["/app.example.yaml", path.join(WORKSPACE_ROOT, "app.example.yaml")],
  [`/apps/${APP_NAME}/app.yaml`, path.join(APP_DIR, "app.yaml")],
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".wasm": "application/wasm",
};

const PROXY_HEADERS = ["accept", "accept-encoding", "accept-language", "authorization",
  "content-type", "cookie", "if-none-match", "origin", "referer", "user-agent",
  "x-oauth-token", "x-requested-with"];

function mimeOf(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

/** 反向代理命中判定。返回 null = 交给静态/SPA 处理。 */
function proxyTarget(pathname) {
  for (const p of PROXY) {
    if (pathname === p.prefix || pathname.startsWith(p.prefix + "/") || pathname.startsWith(p.prefix + "?")) {
      return p.rewrite ? p.rewrite + pathname.slice(p.prefix.length) : pathname;
    }
  }
  return null;
}

/**
 * 解析静态文件路径。
 * 防穿越：`path.join` 会把 `..` 归一化出去，之后用带分隔符的前缀再比一次，
 * 杜绝 `dist2` 这种「前缀相同但不是子目录」的绕过。
 */
function resolveStatic(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  const cand = path.join(DIST, rel);
  const inside = cand === DIST || cand.startsWith(DIST + path.sep);
  if (inside && fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;

  // 共享资源兜底（与 dev 中间件同源）
  const shared = SHARED_ASSETS.get(pathname);
  if (shared && fs.existsSync(shared) && fs.statSync(shared).isFile()) return shared;

  // /wasm/*：dist 没拷到时回退共享 public
  if (pathname.startsWith("/wasm/")) {
    const w = path.join(WORKSPACE_ROOT, "public", "wasm", path.basename(pathname));
    if (fs.existsSync(w)) return w;
  }

  // /app.yaml 垫片（§7.1）：框架按「dist 根/app.yaml」取，打包放到了 apps/{APP}/ 下
  if (pathname === "/app.yaml" || pathname === "/app.yml") {
    const deep = path.join(DIST, "apps", APP_NAME, path.basename(pathname));
    if (fs.existsSync(deep)) return deep;
  }
  return null;
}

/**
 * SPA 兜底：未命中的页面路由与**可选配置探针**回 index.html；其余静态资源 404 保持 404（不伪装）。
 *
 * 为什么 `.yaml` 也要兜底（2026-10-06 dist 实测）：
 *   loader 的环境级配置 `app.{env}.yaml` 是**每次启动必发的可选探针**（名单变量
 *   `env.VITE_APP_ENV_CONFIGS` 是属性访问，define 替换不到 → 构建产物里恒为 undefined
 *   → 必然请求）。dev 下 vite 返回 200 index.html，生产 nginx.conf 是
 *   `try_files $uri $uri/ /index.html` 同样返回 200 index.html —— loader 注释也写明
 *   「含非 yaml 响应，如 SPA fallback 返回 HTML 时返回 undefined」。
 *   只有我的运行器曾经对此 404，凭空造出「业务失败请求」差异（dist 套件 4 项 FAIL 根因）。
 *   故 .yaml/.yml 与页面路由同权兜底；**js/css/图片等资源扩展名仍严格 404**，缺资产缺陷不许被掩盖。
 */
function spaFallback(pathname) {
  if (proxyTarget(pathname)) return null;
  const ext = path.extname(pathname);
  if (ext && ext !== ".html" && ext !== ".yaml" && ext !== ".yml") return null; // 资源 404 就是 404
  return path.join(DIST, "index.html");
}

function sendFile(req, res, file, extraHeaders = {}) {
  const stat = fs.statSync(file);
  const headers = {
    "content-type": mimeOf(file),
    "content-length": stat.size,
    "cache-control": "no-cache", // 验收期间不许吃到旧缓存
    ...extraHeaders,
  };
  if (req.method === "HEAD") { res.writeHead(200, headers); res.end(); return; }
  res.writeHead(200, headers); // GET 也必须显式写出：pipe 不会带出 content-type，模块脚本会被浏览器严格 MIME 检查拒掉
  const stream = fs.createReadStream(file);
  stream.on("error", () => { if (!res.headersSent) res.writeHead(500); res.end("read error"); });
  stream.pipe(res);
}

function proxy(req, res, targetPath) {
  const headers = {};
  for (const h of PROXY_HEADERS) if (req.headers[h] !== undefined) headers[h] = req.headers[h];
  headers.host = BACKEND_URL.host; // changeOrigin：否则后端按 vhost 校验会挂
  // Origin 也必须改写成后端自己的源（等价 changeOrigin）：生产里 dist 与 API 同源，
  // 浏览器发来的 `Origin: http://localhost:15690` 若原样转给后端，Host 已被改写，
  // 后端判定为跨域请求，而安全加固后的白名单只含 dev 端口（实测
  // `[cors] 跨域来源白名单: [http://localhost:15689]`）→ POST /v2/user/login 403
  // 「Invalid CORS request」，整站登录被 403 打断（2026-10-06 dist 形态实测）。
  if (headers.origin !== undefined) headers.origin = `http://${BACKEND_URL.host}`;

  const upstream = http.request(
    { hostname: BACKEND_URL.hostname, port: BACKEND_URL.port || 80, path: targetPath,
      method: req.method, headers, timeout: 120000 },
    (ur) => {
      res.writeHead(ur.statusCode || 502, ur.headers);
      ur.pipe(res);
    },
  );
  upstream.on("timeout", () => upstream.destroy(new Error("upstream timeout")));
  upstream.on("error", (e) => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end(`proxy error: ${e.message} (target=${BACKEND})`);
    } else res.end();
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  let pathname;
  let search = "";
  try {
    const u = new URL(req.url, "http://x");
    pathname = decodeURIComponent(u.pathname);
    search = u.search; // 查询串必须原样透传：丢掉它 `?type=video` 会被后端忽略，返回全部/默认类型（2026-10-06 dist 实测 `/v2/ai/generate/models?type=video` 返回图像模型）
  }
  catch { res.writeHead(400); res.end("bad request"); return; }

  const hit = proxyTarget(pathname);
  if (hit) { proxy(req, res, hit + search); return; }

  const file = resolveStatic(pathname) || spaFallback(pathname);
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`404 ${pathname}`);
    return;
  }
  sendFile(req, res, file);
});

/** WebSocket upgrade：只把 WS_PREFIXES 交给后端，其余保持 425（不是本运行器提供的能力）。 */
server.on("upgrade", (req, socket, head) => {
  let pathname = "/";
  let search = "";
  try { const u = new URL(req.url, "http://x"); pathname = decodeURIComponent(u.pathname); search = u.search; } catch { /* keep */ }
  if (!WS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    socket.destroy();
    return;
  }
  const headers = { host: BACKEND_URL.host, connection: "upgrade", upgrade: req.headers.upgrade || "websocket",
    "sec-websocket-key": req.headers["sec-websocket-key"] || "",
    "sec-websocket-version": req.headers["sec-websocket-version"] || "13",
    ...(req.headers["sec-websocket-protocol"] ? { "sec-websocket-protocol": req.headers["sec-websocket-protocol"] } : {}),
    ...(req.headers["sec-websocket-extensions"] ? { "sec-websocket-extensions": req.headers["sec-websocket-extensions"] } : {}) };
  const up = http.request({ hostname: BACKEND_URL.hostname, port: BACKEND_URL.port || 80,
    path: (proxyTarget(pathname) || pathname) + search, method: "GET", headers });
  up.on("upgrade", (ures, uresSocket, uhead) => {
    const lines = [`HTTP/1.1 101 Switching Protocols`, ...Object.entries(ures.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`), "", ""];
    socket.write(lines.join("\r\n"));
    if (uhead && uhead.length) socket.write(uhead);
    if (head && head.length) uresSocket.write(head);
    uresSocket.pipe(socket).pipe(uresSocket);
  });
  up.on("response", (ures) => { // 后端拒绝 upgrade：把响应透传给客户端
    socket.write(`HTTP/1.1 ${ures.statusCode} ${ures.statusMessage || "Proxy Rejected"}\r\n`);
    ures.pipe(socket);
  });
  up.on("error", () => socket.destroy());
  up.end();
});

server.listen(PORT, () => {
  console.log(`[serve-dist] dist   = ${DIST}`);
  console.log(`[serve-dist] static = http://localhost:${PORT}`);
  console.log(`[serve-dist] api    = ${BACKEND}${PROXY.map((p) => `${p.prefix}${p.rewrite ? "→" + p.rewrite : ""}`).join(" ")}`);
  console.log(`[serve-dist] ws     = ${WS_PREFIXES.join(" ")} → ${BACKEND}`);
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error(`[serve-dist] !! dist/index.html 不存在，先跑 pnpm build`);
  }
});
