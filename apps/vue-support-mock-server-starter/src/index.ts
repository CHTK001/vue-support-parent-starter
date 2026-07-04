import express from "express";
import cors from "cors";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const DB_FILE = resolve(DATA_DIR, "db.json");

const DEFAULT_PORT = 3100;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

// ============ Data Store (JSON file) ============

interface ClientConfig {
  id: string;
  name: string;
  mcpJson: string;
  skillsJson: string;
  createdAt: string;
  updatedAt: string;
}

interface ModelProvider {
  id: string;
  name: string;
  apiBase: string;
  apiKey?: string;
  models: string[];
  isActive: boolean;
  protocol?: string;
}

interface Store {
  clientConfigs: Record<string, ClientConfig>;
  providers: ModelProvider[];
  settings: Record<string, any>;
}

function initStore(): Store {
  return { clientConfigs: {}, providers: [], settings: {} };
}

function loadStore(): Store {
  try {
    if (existsSync(DB_FILE)) {
      return JSON.parse(readFileSync(DB_FILE, "utf-8"));
    }
  } catch {}
  return initStore();
}

function saveStore(store: Store): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
}

let store = loadStore();

// ============ Express App ============

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ Client Config API ============

app.get("/api/clients", (_req, res) => {
  const clients = Object.values(store.clientConfigs);
  res.json(clients);
});

app.get("/api/clients/:id/config", (req, res) => {
  const config = store.clientConfigs[req.params.id];
  if (!config) return res.status(404).json({ error: "Not found" });
  res.json(config);
});

app.put("/api/clients/:id/config", (req, res) => {
  const id = req.params.id;
  const now = new Date().toISOString();
  const existing = store.clientConfigs[id];
  store.clientConfigs[id] = {
    ...req.body,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  saveStore(store);
  res.json(store.clientConfigs[id]);
});

app.delete("/api/clients/:id/config", (req, res) => {
  delete store.clientConfigs[req.params.id];
  saveStore(store);
  res.json({ success: true });
});

// ============ Provider API ============

app.get("/api/providers", (_req, res) => {
  res.json(store.providers);
});

app.post("/api/providers", (req, res) => {
  const provider = req.body;
  const idx = store.providers.findIndex((p) => p.id === provider.id);
  if (idx >= 0) {
    store.providers[idx] = { ...store.providers[idx], ...provider };
  } else {
    store.providers.push({ ...provider, isActive: provider.isActive ?? true });
  }
  saveStore(store);
  res.json(provider);
});

app.put("/api/providers/:id", (req, res) => {
  const idx = store.providers.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  store.providers[idx] = { ...store.providers[idx], ...req.body, id: req.params.id };
  saveStore(store);
  res.json(store.providers[idx]);
});

app.delete("/api/providers/:id", (req, res) => {
  store.providers = store.providers.filter((p) => p.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// ============ Settings API ============

app.get("/api/settings", (_req, res) => {
  res.json(store.settings);
});

app.put("/api/settings", (req, res) => {
  store.settings = { ...store.settings, ...req.body };
  saveStore(store);
  res.json(store.settings);
});

// ============ System API ============

import { execSync, spawnSync } from "child_process";

app.get("/api/system/processes", (_req, res) => {
  try {
    const platform = process.platform;
    let output: string;
    if (platform === "win32") {
      output = execSync("tasklist /FO CSV /NH", { encoding: "utf-8", timeout: 5000 });
      const processes = output.trim().split("\n").map((line) => {
        const parts = line.replace(/"/g, "").split(",");
        return { pid: parseInt(parts[1] || "0"), name: parts[0] || "", status: parts[parts.length - 1] || "Running" };
      });
      return res.json(processes);
    } else {
      output = execSync("ps aux", { encoding: "utf-8", timeout: 5000 });
      const lines = output.trim().split("\n").slice(1);
      const processes = lines.map((line) => {
        const parts = line.trim().split(/\s+/);
        return { pid: parseInt(parts[1] || "0"), name: parts[parts.length - 1] || "", status: "Running" };
      });
      return res.json(processes);
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed to list processes" });
  }
});

app.post("/api/system/processes/:pid/kill", (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { timeout: 3000 });
    } else {
      process.kill(pid, "SIGKILL");
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to kill process" });
  }
});

app.get("/api/system/env", (_req, res) => {
  const envVars = Object.entries(process.env).map(([name, value]) => ({ name, value: value || "" }));
  res.json(envVars);
});

app.post("/api/system/env", (req, res) => {
  const { name, value } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  process.env[name] = value || "";
  res.json({ success: true, name, value: process.env[name] });
});

app.get("/api/system/services", (_req, res) => {
  try {
    let output: string;
    if (process.platform === "win32") {
      output = execSync("sc query state= all", { encoding: "utf-8", timeout: 8000 });
      const services: any[] = [];
      const blocks = output.split(/\n\s*\n/);
      for (const block of blocks) {
        const nameMatch = block.match(/SERVICE_NAME:\s+(.+)/);
        const displayMatch = block.match(/DISPLAY_NAME:\s+(.+)/);
        const stateMatch = block.match(/STATE\s+:\s+\d+\s+(.+)/);
        if (nameMatch) {
          services.push({
            name: nameMatch[1].trim(),
            displayName: displayMatch?.[1]?.trim() || nameMatch[1].trim(),
            status: stateMatch?.[1]?.trim() === "RUNNING" ? "RUNNING" : "STOPPED",
          });
        }
      }
      return res.json(services);
    } else {
      output = execSync("systemctl list-units --type=service --no-pager --no-legend", { encoding: "utf-8", timeout: 8000 });
      const services = output.trim().split("\n").filter(Boolean).map((line) => {
        const parts = line.trim().split(/\s+/);
        return { name: parts[0] || "", displayName: parts[0] || "", status: parts[3] === "running" ? "RUNNING" : "STOPPED" };
      });
      return res.json(services);
    }
  } catch {
    return res.json([]);
  }
});

app.post("/api/system/services/:name/start", (req, res) => {
  try {
    const { name } = req.params;
    if (process.platform === "win32") {
      execSync(`sc start "${name}"`, { timeout: 5000 });
    } else {
      execSync(`systemctl start "${name}"`, { timeout: 5000 });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to start service" });
  }
});

app.post("/api/system/services/:name/stop", (req, res) => {
  try {
    const { name } = req.params;
    if (process.platform === "win32") {
      execSync(`sc stop "${name}"`, { timeout: 5000 });
    } else {
      execSync(`systemctl stop "${name}"`, { timeout: 5000 });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to stop service" });
  }
});

app.get("/api/system/registry", (req, res) => {
  try {
    if (process.platform !== "win32") {
      return res.json([]);
    }
    const hive = (req.query.hive as string) || "HKEY_CURRENT_USER";
    const path = (req.query.path as string) || "Software";
    const output = execSync(`reg query "${hive}\\${path}"`, { encoding: "utf-8", timeout: 5000 });
    const entries = output.trim().split("\n").filter(Boolean).slice(1).map((line) => {
      const parts = line.trim().split(/\s{4,}/);
      return {
        name: parts[0] || "",
        value: parts[2] || "",
        valueType: parts[1] || "REG_SZ",
      };
    });
    res.json(entries);
  } catch {
    res.json([]);
  }
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`\n[backend] Real API Server started`);
  console.log(`[backend] URL: http://localhost:${PORT}`);
  console.log(`[backend] Health: http://localhost:${PORT}/health`);
  console.log(`[backend] Providers: ${store.providers.length} saved`);
  console.log(`[backend] Client configs: ${Object.keys(store.clientConfigs).length} saved\n`);
});