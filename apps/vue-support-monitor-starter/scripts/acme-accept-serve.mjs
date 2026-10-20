/**
 * ACME 浏览器验收专用静态服务：托管 dist，并按前缀分流代理。
 *
 * - /monitor/api/** -> ACME 后端（默认 101.200.205.64:19170）
 * - /v2、/ms、/api/device -> 监控后端（默认 192.168.50.198:8081）
 * - /socket.io -> 监控后端 socket（默认 192.168.50.198:29612）
 *
 * 代理前剥离 Origin（与项目 vite dev 的 dropProxyOrigin 同口径），避免后端 CORS 白名单 403。
 *
 * 用法：node scripts/acme-accept-serve.mjs [port]
 */
import { createServer, request as httpRequest } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(APP_DIR, "dist");
const PORT = Number(process.argv[2] || process.env.PORT || 8899);

const ACME_TARGET = process.env.ACME_API_TARGET || "http://101.200.205.64:19170";
const MS_TARGET = process.env.MS_API_TARGET || "http://192.168.50.198:8081";
const SOCKET_TARGET = process.env.MS_SOCKET_TARGET || "http://192.168.50.198:29612";

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
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
};

const PROXIES = [
  { prefix: "/monitor/api", target: ACME_TARGET },
  { prefix: "/v2", target: MS_TARGET },
  { prefix: "/ms", target: MS_TARGET },
  { prefix: "/api/device", target: MS_TARGET },
  { prefix: "/socket.io", target: SOCKET_TARGET },
];

function pickTarget(pathname) {
  for (const p of PROXIES) {
    if (pathname === p.prefix || pathname.startsWith(p.prefix + "/")) return p.target;
  }
  return null;
}

function proxy(req, res, target) {
  const u = new URL(target);
  const headers = { ...req.headers, host: u.host };
  // 与 vite 的 dropProxyOrigin 同口径：API 请求剥离 Origin，避免后端 CORS 403
  delete headers.origin;
  delete headers.referer;
  const upstream = httpRequest(
    { protocol: u.protocol, hostname: u.hostname, port: u.port || 80, method: req.method, path: req.url, headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", (e) => {
    res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ code: "502", msg: `proxy error: ${target} ${String(e.message || e)}` }));
  });
  req.pipe(upstream);
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname.replace(/^\/+/, ""));
  let file = normalize(join(DIST, rel));
  if (!file.startsWith(DIST)) file = join(DIST, "index.html");
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  const pathname = (req.url || "/").split("?")[0];
  const target = pickTarget(pathname);
  if (target) return proxy(req, res, target);
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, pathname);
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[acme-accept-serve] http://127.0.0.1:${PORT}`);
  console.log(`[acme-accept-serve] dist=${DIST}`);
  console.log(`[acme-accept-serve] /monitor/api -> ${ACME_TARGET}`);
  console.log(`[acme-accept-serve] /v2,/ms,/api/device -> ${MS_TARGET}`);
  console.log(`[acme-accept-serve] /socket.io -> ${SOCKET_TARGET}`);
});
