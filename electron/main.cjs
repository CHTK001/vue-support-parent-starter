const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createRendererServer } = require("./server.cjs");

let backendProcess = null;
let rendererServer = null;

function resolveBackendJarPath() {
  if (process.env.MUSIC_BACKEND_JAR) {
    return process.env.MUSIC_BACKEND_JAR;
  }
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "music-server.jar");
  }
  return null;
}

function startBackendIfNeeded() {
  if (process.env.ELECTRON_BACKEND_URL) {
    return;
  }
  const jarPath = resolveBackendJarPath();
  if (!jarPath) {
    return;
  }
  backendProcess = spawn("java", ["-jar", jarPath], {
    cwd: path.dirname(jarPath),
    windowsHide: true,
    stdio: "ignore",
  });
}

async function startRendererServerIfNeeded() {
  if (process.env.ELECTRON_RENDERER_URL) {
    return null;
  }

  const rendererDir = app.isPackaged
    ? path.join(process.resourcesPath, "renderer")
    : path.join(__dirname, "build", "renderer");
  const backendBaseUrl = process.env.ELECTRON_BACKEND_URL || "http://127.0.0.1:19171";
  const port = Number(process.env.ELECTRON_RENDERER_PORT || 41888);
  rendererServer = await createRendererServer({
    rendererDir,
    backendBaseUrl,
    port,
  });
  return `http://127.0.0.1:${port}`;
}

async function createWindow() {
  startBackendIfNeeded();
  const localRendererUrl = await startRendererServerIfNeeded();
  const loadUrl = process.env.ELECTRON_RENDERER_URL || localRendererUrl;

  const win = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 1160,
    minHeight: 760,
    title: "Music Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  await win.loadURL(loadUrl);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (rendererServer) {
    rendererServer.close();
    rendererServer = null;
  }
  if (backendProcess) {
    backendProcess.kill("SIGTERM");
    backendProcess = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
