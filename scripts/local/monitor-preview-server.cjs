const http = require("http");
const fs = require("fs");
const path = require("path");

const distDir = path.resolve(
  __dirname,
  "../../apps/vue-support-monitor-starter/dist",
);
const port = Number(process.env.MONITOR_PREVIEW_PORT || 18081);
const apiOrigin = process.env.MONITOR_PREVIEW_API || "http://172.16.0.40:19170";
const socketOrigin =
  process.env.MONITOR_PREVIEW_SOCKET || "http://172.16.0.40:29181";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body || "");
}

async function proxy(req, res, targetBase) {
  const targetUrl = new URL(req.url || "/", targetBase).toString();
  const headers = { ...req.headers };
  delete headers.host;

  const init = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    init.body = req;
    init.duplex = "half";
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (["content-encoding", "content-length"].includes(key.toLowerCase())) {
      return;
    }
    responseHeaders[key] = value;
  });
  res.writeHead(upstream.status, responseHeaders);

  if (!upstream.body) {
    res.end();
    return;
  }

  const reader = upstream.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    res.write(Buffer.from(chunk.value));
  }
  res.end();
}

function resolveFilePath(urlPath) {
  let relativePath = urlPath.replace(/^\/monitor\/?/, "");
  if (!relativePath || relativePath.endsWith("/")) {
    relativePath = path.join(relativePath, "index.html");
  }
  return path.join(distDir, relativePath);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname.startsWith("/monitor/api/")) {
      await proxy(req, res, apiOrigin);
      return;
    }

    if (url.pathname.startsWith("/socket.io/")) {
      await proxy(req, res, socketOrigin);
      return;
    }

    if (!url.pathname.startsWith("/monitor")) {
      res.writeHead(302, { Location: "/monitor/" });
      res.end();
      return;
    }

    let filePath = resolveFilePath(url.pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath)
      .on("error", (error) => {
        send(res, 500, String(error), {
          "Content-Type": "text/plain; charset=utf-8",
        });
      })
      .pipe(res);
  } catch (error) {
    send(res, 500, String(error), {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(
    `monitor preview server listening on http://127.0.0.1:${port}/monitor/`,
  );
});
