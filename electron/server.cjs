const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

const PROXY_PREFIXES = ["/api/", "/monitor/api/", "/v1/", "/socket.io/"];

function shouldProxy(pathname) {
  return PROXY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function proxyRequest(req, res, backendBaseUrl) {
  const url = new URL(req.url || "/", backendBaseUrl);
  const bodyBuffer = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

  const requestHeaders = { ...req.headers };
  delete requestHeaders.host;
  delete requestHeaders.connection;

  const response = await fetch(url, {
    method: req.method || "GET",
    headers: requestHeaders,
    body:
      ["GET", "HEAD"].includes((req.method || "GET").toUpperCase()) || bodyBuffer.length === 0
        ? undefined
        : bodyBuffer,
    duplex: "half",
  });

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const resultBuffer = Buffer.from(await response.arrayBuffer());
  res.end(resultBuffer);
}

async function serveStatic(req, res, rendererDir) {
  const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }

  let filePath = path.join(rendererDir, pathname);
  if (!filePath.startsWith(path.resolve(rendererDir))) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    res.end(content);
  } catch {
    const fallback = await readFile(path.join(rendererDir, "index.html"));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fallback);
  }
}

async function createRendererServer({ rendererDir, backendBaseUrl, port }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
      try {
        if (shouldProxy(pathname)) {
          await proxyRequest(req, res, backendBaseUrl);
          return;
        }
        await serveStatic(req, res, rendererDir);
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            message: "Renderer proxy server error",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

module.exports = {
  createRendererServer,
};
