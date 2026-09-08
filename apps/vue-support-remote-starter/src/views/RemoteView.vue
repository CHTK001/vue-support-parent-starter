<template>
  <div class="remote-view">
    <aside class="remote-left">
      <div class="form-title">连接信息</div>
      <div class="remote-form">
        <div class="form-field">
          <label class="form-label">网关地址</label>
          <ReInput v-model="form.gatewayUrl" placeholder="tcp://host:port" clearable data-testid="input-gateway" />
        </div>
        <div class="form-field">
          <label class="form-label">接入令牌</label>
          <ReInput v-model="form.accessToken" placeholder="控制端接入令牌" clearable data-testid="input-token" />
        </div>
        <div class="form-field">
          <label class="form-label">目标被控端</label>
          <ReInput v-model="form.targetAgentId" placeholder="被控端 id" clearable data-testid="input-agent" />
        </div>
        <div class="form-field">
          <label class="form-label">验证码</label>
          <ReInput v-model="form.verifyCode" placeholder="被控端验证码" show-password clearable data-testid="input-verify" />
        </div>
        <div class="form-field">
          <label class="form-label">画面源地址（WS）</label>
          <ReInput v-model="form.wsUrl" placeholder="ws://host:port" clearable data-testid="input-ws" />
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
          <ReButton @click="saveConfig" data-testid="btn-save">保存配置</ReButton>
        </div>
        <div v-if="configSaved" class="save-tip" data-testid="save-tip">配置已保存</div>
      </div>
    </aside>

    <section class="remote-right">
      <div class="screen-header">
        <span class="screen-title">远控画面</span>
        <el-tag :type="statusTag.type" size="small" data-testid="ws-status">{{ statusTag.text }}</el-tag>
      </div>
      <div class="screen-body">
        <div v-if="form.connMethod === 'ssh'" class="ssh-area">
          <div
            ref="terminalRef"
            class="terminal-container"
            tabindex="0"
            data-testid="terminal"
            @keydown="onTerminalKeydown"
          />
          <div v-if="!connected" class="terminal-overlay" data-testid="terminal-overlay">
            <ReEmpty description="未连接——左侧填写连接信息后点击连接" :image-size="60" />
          </div>
        </div>
        <template v-else>
          <canvas ref="screenRef" class="screen-canvas" data-testid="screen-canvas" />
          <div v-if="h264Mode" class="h264-tip">H264 流（WebCodecs/MSE 播放——待接入）</div>
          <div v-if="!connected && !h264Mode" class="screen-overlay" data-testid="screen-overlay">
            <ReEmpty description="未连接——左侧填写连接信息后点击连接" :image-size="60" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, nextTick } from "vue";
import { ElMessage } from "element-plus";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";


const form = reactive({
  gatewayUrl: "",
  accessToken: "",
  targetAgentId: "",
  verifyCode: "",
  wsUrl: "",
  connMethod: "ssh",
  reverseTunnel: false,
});

const connMethodOptions = [
  { label: "SSH (WebSocket)", value: "ssh" },
  { label: "远程桌面 (WebRTC)", value: "rdp" },
];

const connected = ref(false);
const h264Mode = ref(false);
const configSaved = ref(false);
const screenRef = ref<HTMLCanvasElement | null>(null);
const terminalRef = ref<HTMLDivElement | null>(null);
let ws: WebSocket | null = null;
let sshSessionId: string | null = null;

const statusTag = computed(() => {
  if (connected.value) return { type: "success" as const, text: "已连接" };
  if (h264Mode.value) return { type: "warning" as const, text: "H264 流" };
  return { type: "info" as const, text: "未连接" };
});


const connect = () => {
  if (!form.wsUrl) {
    ElMessage.warning("请填写画面源地址（WS）");
    return;
  }
  try {
    ws = new WebSocket(form.wsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      connected.value = true;
      ElMessage.success("已连接");
      if (form.connMethod === "ssh") {
        startSSHSession();
        nextTick(() => terminalRef.value?.focus());
      }
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        try {
          handleTextMessage(JSON.parse(ev.data));
        } catch {
          handleFrame(ev.data);
        }
      } else {
        handleFrame(ev.data as ArrayBuffer);
      }
    };
    ws.onclose = () => { connected.value = false; sshSessionId = null; };
    ws.onerror = () => { connected.value = false; ElMessage.error("连接失败"); };
  } catch {
    ElMessage.error("连接失败");
  }
};

const disconnect = () => {
  if (sshSessionId && ws) ws.send(JSON.stringify({ action: "ssh", sshAction: "stop", sessionId: sshSessionId }));
  ws?.close();
  ws = null;
  connected.value = false;
  h264Mode.value = false;
  sshSessionId = null;
};

const startSSHSession = () => {
  sshSessionId = "ssh-" + Date.now();
  ws!.send(JSON.stringify({ action: "ssh", sshAction: "start", sessionId: sshSessionId, cols: 80, rows: 24 }));
  appendTerminalOutput("SSH 会话已启动\n", false);
};

const handleTextMessage = (msg: any) => {
  if (msg.type === "ssh") appendTerminalOutput(msg.data, msg.stream === "stderr");
};

const handleFrame = (data: unknown) => {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    const idx = data.indexOf(":");
    const b64 = idx >= 0 ? data.slice(idx + 1) : data;
    try {
      const bin = atob(b64);
      bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    } catch {
      return;
    }
  } else {
    bytes = new Uint8Array(data as ArrayBuffer);
  }
  if (bytes.length < 3) return;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    h264Mode.value = false;
    renderJpeg(bytes);
  } else if (
    (bytes.length > 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0 && bytes[3] === 1) ||
    (bytes.length > 3 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1)
  ) {
    h264Mode.value = true;
  }
};

const renderJpeg = (bytes: Uint8Array) => {
  const blob = new Blob([bytes], { type: "image/jpeg" });
  createImageBitmap(blob).then((bitmap) => {
    const canvas = screenRef.value;
    if (!canvas) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
  }).catch(() => undefined);
};

const appendTerminalOutput = (text: string, isError: boolean) => {
  if (!terminalRef.value) return;
  const span = document.createElement("span");
  span.style.color = isError ? "#ff4757" : "#e6e6e6";
  span.textContent = text;
  terminalRef.value.appendChild(span);
  terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
};

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
  if (data) {
    ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: sshSessionId, data: btoa(unescape(encodeURIComponent(data))) }));
  }
};

const CONFIG_API = "/api/remote/config";

const saveConfig = async () => {
  const payload = JSON.stringify(form);
  try {
    const resp = await fetch(CONFIG_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    if (resp.ok) { configSaved.value = true; ElMessage.success("配置已保存到后台"); return; }
    throw new Error(`HTTP ${resp.status}`);
  } catch {
    try {
      localStorage.setItem("remote-config", payload);
      configSaved.value = true;
      ElMessage.success("后端不可达——配置已保存到本地");
    } catch { ElMessage.error("保存失败"); }
  }
};

const loadConfig = async () => {
  try {
    const resp = await fetch(CONFIG_API);
    if (resp.ok) { const data = await resp.json(); if (data) Object.assign(form, data); return; }
  } catch { /* ignore */ }
  try { const raw = localStorage.getItem("remote-config"); if (raw) Object.assign(form, JSON.parse(raw)); } catch { /* ignore */ }
};
loadConfig();

onBeforeUnmount(() => { ws?.close(); });
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
.save-tip { margin-top: 8px; padding: 8px 12px; font-size: 12px; color: #67c23a; background: #f0f9eb; border-radius: 4px; }
.remote-right { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--el-border-color-lighter); overflow: hidden; }
.screen-header { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; border-bottom: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
.screen-title { font-size: 14px; font-weight: 600; }
.screen-body { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; background: #0d1117; }
.screen-canvas { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; }
.screen-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(13, 17, 23, 0.85); }
.h264-tip { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); padding: 6px 14px; font-size: 12px; color: #e6a23c; background: rgba(230, 162, 60, 0.12); border: 1px solid rgba(230, 162, 60, 0.4); border-radius: 6px; }
.ssh-area { flex: 1; display: flex; flex-direction: column; position: relative; }
.terminal-container {
  flex: 1;
  background: #0c0c0c;
  color: #e6e6e6;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 0;
  outline: none;
  cursor: text;
  &:focus { box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.4); }
}
.terminal-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(12, 12, 12, 0.85); }
</style>
