<template>
  <div class="remote-view">
    <aside class="remote-left">
      <div class="session-list" data-testid="session-list">
        <div class="form-title">会话</div>
        <div v-for="(s, i) in sessions" :key="i" class="session-item" @click="loadSession(s)" data-testid="session-item">
          <span class="session-name">{{ s.name }}</span>
        </div>
        <div v-if="sessions.length === 0" class="session-empty">暂无会话——填写后点"保存会话"</div>
      </div>
      <div class="form-title">连接信息</div>
      <div class="remote-form">
        <div class="form-field">
          <label class="form-label">接入令牌</label>
          <ReInput v-model="form.accessToken" placeholder="控制端接入令牌" clearable data-testid="input-token" />
        </div>
        <div class="form-field">
          <label class="form-label">目标被控端</label>
          <ReInput v-model="form.targetAgentId" placeholder="被控端 id" clearable data-testid="input-agent" @input="onAgentIdChange" />
        </div>
        <div class="form-field">
          <label class="form-label">验证码</label>
          <ReInput v-model="form.verifyCode" placeholder="被控端验证码" show-password clearable data-testid="input-verify" />
        </div>
        <div class="form-field">
          <label class="form-label">连接方式</label>
          <ReSelect v-model="form.connMethod" :data="connMethodOptions" data-testid="select-method" />
        </div>
        <div class="form-field form-field--switch">
          <label class="form-label">反向隧道</label>
          <ReSwitch v-model="form.reverseTunnel" data-testid="switch-tunnel" />
        </div>
        <div class="remote-actions">
          <ReButton type="primary" :disabled="connected" @click="connect" data-testid="btn-connect">连接</ReButton>
          <ReButton :disabled="!connected" @click="disconnect" data-testid="btn-disconnect">断开</ReButton>
          <ReButton @click="saveSession" data-testid="btn-save-session">保存会话</ReButton>
        </div>
      </div>
    </aside>

    <section class="remote-right">
      <div class="screen-header">
        <span class="screen-title">远控画面</span>
        <el-tag :type="statusTag.type" size="small" data-testid="ws-status">{{ statusTag.text }}</el-tag>
      </div>
      <div class="screen-body">
        <div v-if="form.connMethod === 'ssh'" class="ssh-area">
          <ReInput v-model="form.sshHost" placeholder="SSH 目标主机（默认 local）" clearable data-testid="input-sshhost" />
          <div
            ref="terminalRef"
            class="terminal-container"
            data-testid="terminal"
          />
          <div v-if="!connected" class="terminal-overlay" data-testid="terminal-overlay">
            <ReEmpty description="未连接——填写连接信息后点击连接" :image-size="60" />
          </div>
        </div>
        <template v-else>
          <canvas
            ref="screenRef"
            class="screen-canvas"
            data-testid="screen-canvas"
            tabindex="0"
            @mousedown="onCanvasMouseDown"
            @mouseup="onCanvasMouseUp"
            @mousemove="onCanvasMouseMove"
            @wheel="onCanvasWheel"
            @contextmenu.prevent
          />
          <div v-if="!connected" class="screen-overlay" data-testid="screen-overlay">
            <ReEmpty description="未连接——填写连接信息后点击连接" :image-size="60" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReTag from "@repo/ui/re-tag";

const route = useRoute();

const form = reactive({
  accessToken: "",
  targetAgentId: "",
  verifyCode: "",
  sshHost: "local",
  connMethod: "ssh",
  reverseTunnel: false,
});

const CONFIG_API = "/api/remote/config";

/** 服务端持久化配置（网关/WS地址从这里取） */
const serverConfig = reactive({ httpUrl: "", gatewayUrl: "", wsUrl: "" });

/** agent 能力信息（从 /api/remote/agents 获取） */
interface AgentInfo {
  id: string;
  agentType: string;
  platform: string;
  desktopSupported: boolean;
  status: string;
}

const currentAgent = ref<AgentInfo | null>(null);

/** 可用连接方式——根据 agent 能力动态生成 */
const connMethodOptions = computed(() => {
  const agent = currentAgent.value;
  if (!agent) return [{ label: "SSH", value: "ssh" }];
  const methods: Array<{ label: string; value: string }> = [];
  const isDesktop = agent.desktopSupported || agent.platform?.toLowerCase().includes("windows");
  const isLinux = agent.platform?.toLowerCase().includes("linux");

  switch (agent.agentType) {
    case "SHELL":
      methods.push({ label: "SSH", value: "ssh" });
      if (isDesktop) methods.push({ label: "远程桌面 (VNC)", value: "vnc" });
      if (isDesktop) methods.push({ label: "远程桌面 (RDP)", value: "rdp" });
      break;
    case "PUSH":
      if (isDesktop) methods.push({ label: "远程桌面 (VNC)", value: "vnc" });
      if (isDesktop && !isLinux) methods.push({ label: "远程桌面 (RDP)", value: "rdp" });
      break;
    case "FORWARD":
      methods.push({ label: "SSH", value: "ssh" });
      if (isDesktop) methods.push({ label: "远程桌面 (VNC)", value: "vnc" });
      if (isDesktop && !isLinux) methods.push({ label: "远程桌面 (RDP)", value: "rdp" });
      break;
    default:
      methods.push({ label: "SSH", value: "ssh" });
  }
  return methods;
});

const connected = ref(false);
const h264Mode = ref(false);
const screenRef = ref<HTMLCanvasElement | null>(null);
const terminalRef = ref<HTMLDivElement | null>(null);
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;
let sshSessionId: string | null = null;
let vncSessionId: string | null = null;

const statusTag = computed(() => {
  if (connected.value) return { type: "success" as const, text: "已连接" };
  if (h264Mode.value) return { type: "warning" as const, text: "H264 流" };
  return { type: "info" as const, text: "未连接" };
});

/** 输入 agentId 时，查 /api/remote/agents 获取能力，联动连接方式 */
let agentSearchTimer: ReturnType<typeof setTimeout> | null = null;
const onAgentIdChange = () => {
  if (agentSearchTimer) clearTimeout(agentSearchTimer);
  agentSearchTimer = setTimeout(fetchAgentCapabilities, 300);
};

const fetchAgentCapabilities = async () => {
  if (!form.targetAgentId) { currentAgent.value = null; return; }
  try {
    const resp = await fetch("/api/remote/agents");
    if (!resp.ok) return;
    const list: AgentInfo[] = await resp.json();
    currentAgent.value = list.find(a => a.id === form.targetAgentId) ?? null;
    if (currentAgent.value && !connMethodOptions.value.some(m => m.value === form.connMethod)) {
      form.connMethod = connMethodOptions.value[0]?.value ?? "ssh";
    }
  } catch { /* ignore */ }
};

const connect = async () => {
  if (!form.targetAgentId || !form.verifyCode) {
    ElMessage.warning("请填写被控端 id 和验证码");
    return;
  }
  if (!serverConfig.gatewayUrl) {
    ElMessage.warning('请先到"设置"页面配置网关地址');
    return;
  }
  try {
    // HTTP=9001（REST/验证），SSH/VNC/RDP 会话 WS=9003（分离端口）——从 settings 取
    const httpUrl = serverConfig.httpUrl || `http://${location.hostname || "localhost"}:9001`;
    const wsBase = serverConfig.wsUrl || `ws://${location.hostname || "localhost"}:9003`;
    const wsPath = form.connMethod === "vnc" ? "vnc" : form.connMethod === "rdp" ? "rdp" : "ssh";
    const wsUrl = `${wsBase.replace(/\/$/, "")}/ws/${wsPath}/${form.targetAgentId}`;

    const verifyResp = await fetch(`${httpUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: form.targetAgentId, verifyCode: form.verifyCode }),
    });
    if (verifyResp.ok) {
      const vd = await verifyResp.json();
      if (!vd.success) { ElMessage.error(vd.message || "验证失败"); return; }
    } else {
      const err = await verifyResp.json().catch(() => ({}));
      ElMessage.error(err.message || "验证码校验失败");
      return;
    }

    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      connected.value = true;
      ElMessage.success(`已连接 ${form.targetAgentId}`);
      if (form.connMethod === "ssh") { startSSHSession(); nextTick(() => terminalRef.value?.focus()); }
      else if (form.connMethod === "vnc" || form.connMethod === "rdp") { startVNCSession(); }
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        try { handleTextMessage(JSON.parse(ev.data)); } catch { handleFrame(ev.data); }
      } else { handleFrame(ev.data as ArrayBuffer); }
    };
    ws.onclose = () => { connected.value = false; sshSessionId = null; vncSessionId = null; };
    ws.onerror = () => { connected.value = false; ElMessage.error("WS连接失败"); };
  } catch (e: any) {
    ElMessage.error("连接失败: " + (e.message || "网络错误"));
  }
};

const disconnect = () => {
  if (sshSessionId && ws) ws.send(JSON.stringify({ action: "ssh", sshAction: "stop", sessionId: sshSessionId }));
  if (vncSessionId && ws) ws.send(JSON.stringify({ action: "vnc", vncAction: "stop", sessionId: vncSessionId }));
  ws?.close(); ws = null; connected.value = false; h264Mode.value = false;
  sshSessionId = null; vncSessionId = null;
};

const ensureTerminal = () => {
  if (term || !terminalRef.value) return;
  term = new Terminal({ cursorBlink: true, fontSize: 14, theme: { background: "#0f1115", foreground: "#e6e6e6" } });
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalRef.value);
  fitAddon.fit();
  term.onData((data) => {
    if (connected.value && ws && sshSessionId) {
      ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: sshSessionId, data: btoa(unescape(encodeURIComponent(data))) }));
    }
  });
};

const startSSHSession = () => {
  sshSessionId = "ssh-" + Date.now();
  ws!.send(JSON.stringify({ action: "ssh", sshAction: "start", sessionId: sshSessionId, host: form.sshHost || "local", cols: 80, rows: 24 }));
  appendTerminalOutput("SSH 会话已启动\n");
};

const startVNCSession = () => {
  vncSessionId = "vnc-" + Date.now();
  ws!.send(JSON.stringify({ action: "vnc", vncAction: "start", sessionId: vncSessionId }));
};

const handleTextMessage = (msg: any) => {
  if (msg.type === "ssh" && msg.data?.length) appendTerminalOutput(msg.data);
};

const handleFrame = (data: unknown) => {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    const idx = data.indexOf(":");
    const b64 = idx >= 0 ? data.slice(idx + 1) : data;
    try { const bin = atob(b64); bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); } catch { return; }
  } else { bytes = new Uint8Array(data as ArrayBuffer); }
  if (bytes.length < 3) return;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) { h264Mode.value = false; renderJpeg(bytes); }
  else if (bytes.length > 3 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0 && bytes[3] === 1) { h264Mode.value = true; }
  else if (bytes.length > 3 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1) { h264Mode.value = true; }
};

const renderJpeg = (bytes: Uint8Array) => {
  const blob = new Blob([bytes], { type: "image/jpeg" });
  createImageBitmap(blob).then(bitmap => {
    const canvas = screenRef.value;
    if (!canvas) return;
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();
  }).catch(() => {});
};

const appendTerminalOutput = (text: string) => {
  if (term) term.write(text);
};

const sendVncInput = (payload: any) => {
  if (!connected.value || !ws || !vncSessionId) return;
  ws.send(JSON.stringify({ action: "vnc", vncAction: "input", sessionId: vncSessionId, data: btoa(JSON.stringify(payload)) }));
};

const onCanvasMouseDown = (e: MouseEvent) => { const c = screenRef.value; if (!c) return; const r = c.getBoundingClientRect(); sendVncInput({ type: "mouse", x: e.clientX - r.left, y: e.clientY - r.top, button: e.button, pressed: true }); };
const onCanvasMouseUp = (e: MouseEvent) => { const c = screenRef.value; if (!c) return; const r = c.getBoundingClientRect(); sendVncInput({ type: "mouse", x: e.clientX - r.left, y: e.clientY - r.top, button: e.button, pressed: false }); };
const onCanvasMouseMove = (e: MouseEvent) => { const c = screenRef.value; if (!c) return; const r = c.getBoundingClientRect(); sendVncInput({ type: "mouse", x: e.clientX - r.left, y: e.clientY - r.top, button: 0, pressed: false }); };
const onCanvasWheel = (e: WheelEvent) => { sendVncInput({ type: "wheel", amount: e.deltaY > 0 ? -1 : 1 }); };

const onTerminalKeydown = (e: KeyboardEvent) => {
  if (!connected.value || !ws || !sshSessionId) return;
  e.preventDefault();
  let data = "";
  if (e.key === "Enter") data = "\r";
  else if (e.key === "Backspace") data = "\x7f";
  else if (e.key === "Tab") data = "\t";
  else if (e.key === "Escape") data = "\x1b";
  else if (e.ctrlKey && e.key >= "a" && e.key <= "z") data = String.fromCharCode(e.key.charCodeAt(0) - 96);
  else if (e.key.length === 1) data = e.key;
  if (data) ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: sshSessionId, data: btoa(unescape(encodeURIComponent(data))) }));
};

const loadSettings = async () => {
  try {
    const resp = await fetch(CONFIG_API);
    if (resp.ok) { const d = await resp.json(); if (d) { Object.assign(serverConfig, d); return; } }
  } catch {}
  const host = location.hostname || "localhost";
  Object.assign(serverConfig, { httpUrl: `http://${host}:9001`, gatewayUrl: `tcp://${host}:9000`, wsUrl: `ws://${host}:9003` });
};

const sessions = ref<Array<{ name: string; data: string }>>([]);
try { const raw = localStorage.getItem("remote-sessions"); if (raw) sessions.value = JSON.parse(raw); } catch {}
const saveSession = () => {
  const name = form.targetAgentId || ("会话-" + (sessions.value.length + 1));
  const data = JSON.stringify({ ...form, gateway: serverConfig.gatewayUrl, ws: serverConfig.wsUrl, http: serverConfig.httpUrl });
  const idx = sessions.value.findIndex(s => s.data.includes(form.targetAgentId));
  if (idx >= 0) { sessions.value[idx] = { name, data }; } else { sessions.value.push({ name, data }); }
  localStorage.setItem("remote-sessions", JSON.stringify(sessions.value));
  ElMessage.success("会话已保存: " + name);
};
const loadSession = (s: { data: string }) => {
  try {
    const d = JSON.parse(s.data);
    form.accessToken = d.accessToken || "";
    form.targetAgentId = d.targetAgentId || "";
    form.verifyCode = d.verifyCode || "";
    form.sshHost = d.sshHost || "local";
    form.connMethod = d.connMethod || "ssh";
    form.reverseTunnel = d.reverseTunnel || false;
    if (d.gateway) serverConfig.gatewayUrl = d.gateway;
    if (d.ws) serverConfig.wsUrl = d.ws;
    if (d.http) serverConfig.httpUrl = d.http;
    fetchAgentCapabilities();
    connect();
  } catch {}
};

onMounted(async () => {
  // 全字段默认预填：用户零输入，打开页面直接点"连接"（网关/WS 默认同 IP 由 loadSettings 兜底）
  if (!form.targetAgentId) form.targetAgentId = "local-ssh";
  if (!form.verifyCode) form.verifyCode = "0000";
  if (!form.accessToken) form.accessToken = "ctrl-token-1";
  await loadSettings();
  if (route.query.agentId) { form.targetAgentId = String(route.query.agentId); fetchAgentCapabilities(); }
  if (route.query.verifyCode) form.verifyCode = String(route.query.verifyCode);
});

onBeforeUnmount(() => { ws?.close(); if (agentSearchTimer) clearTimeout(agentSearchTimer); });
</script>

<style lang="scss" scoped>
.remote-view { display: flex; height: 100%; gap: 16px; padding: 16px; box-sizing: border-box; }
.remote-left { width: 320px; flex-shrink: 0; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid var(--el-border-color-lighter); overflow-y: auto; }
.form-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--el-text-color-primary); }
.remote-form { display: flex; flex-direction: column; gap: 12px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field--switch { flex-direction: row; align-items: center; justify-content: space-between; }
.form-label { font-size: 12px; font-weight: 500; color: var(--el-text-color-secondary); }
.remote-actions { display: flex; gap: 8px; margin-top: 4px; }
.remote-right { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--el-border-color-lighter); overflow: hidden; }
.screen-header { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; border-bottom: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
.screen-title { font-size: 14px; font-weight: 600; }
.screen-body { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; background: #0d1117; }
.screen-canvas { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; outline: none; cursor: crosshair; }
.screen-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(13, 17, 23, 0.85); }
.ssh-area { flex: 1; display: flex; flex-direction: column; position: relative; }
.terminal-container { flex: 1; background: #0c0c0c; color: #e6e6e6; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 13px; line-height: 1.5; padding: 12px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; min-height: 0; outline: none; cursor: text; &:focus { box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.4); } }
.terminal-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(12, 12, 12, 0.85); }
.session-list { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.session-item { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 13px; &:hover { background: #f5f7fa; } }
.session-name { color: var(--el-text-color-primary); }
.session-empty { font-size: 12px; color: var(--el-text-color-placeholder); padding: 8px 0; }
</style>
