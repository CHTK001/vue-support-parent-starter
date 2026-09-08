<template>
  <div class="remote-view">
    <aside class="remote-left">
      <el-form label-position="top" :model="form" class="remote-form">
        <div class="form-title">连接信息</div>
        <el-form-item label="网关地址">
          <el-input v-model="form.gatewayUrl" placeholder="tcp://host:port" clearable />
        </el-form-item>
        <el-form-item label="接入令牌">
          <el-input v-model="form.accessToken" placeholder="控制端接入令牌" clearable />
        </el-form-item>
        <el-form-item label="目标被控端">
          <el-input v-model="form.targetAgentId" placeholder="被控端 id" clearable />
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="form.verifyCode" placeholder="被控端验证码" clearable />
        </el-form-item>
        <el-form-item label="画面源地址（WS）">
          <el-input v-model="form.wsUrl" placeholder="ws://host:port" clearable />
        </el-form-item>
        <el-form-item label="连接方式">
          <el-select v-model="form.connMethod" style="width: 100%">
            <el-option label="SSH (WebSocket)" value="ssh" />
            <el-option label="远程桌面 (WebRTC)" value="rdp" />
          </el-select>
        </el-form-item>
        <el-form-item label="反向隧道">
          <el-switch v-model="form.reverseTunnel" />
        </el-form-item>
        <div class="remote-actions">
          <el-button type="primary" :disabled="connected" @click="connect" data-testid="btn-connect">连接</el-button>
          <el-button :disabled="!connected" @click="disconnect" data-testid="btn-disconnect">断开</el-button>
          <el-button @click="saveConfig">保存配置</el-button>
        </div>
        <el-alert v-if="configSaved" type="success" :closable="false" title="配置已保存" class="save-tip" />
      </el-form>
    </aside>

    <section class="remote-right">
      <div class="screen-header">
        <span class="screen-title">远控画面</span>
        <el-tag :type="statusTag.type" size="small" data-testid="ws-status">{{ statusTag.text }}</el-tag>
      </div>
      <div class="screen-body">
        <div v-if="form.connMethod === 'ssh'" class="ssh-area">
          <div ref="terminalRef" class="terminal-container" data-testid="terminal" />
          <div class="terminal-input">
            <el-input v-model="cmdInput" placeholder="输入命令..." @keydown.enter="sendCmd" :disabled="!connected" data-testid="input-cmd">
              <template #append>
                <el-button @click="sendCmd" :disabled="!connected" data-testid="btn-send">发送</el-button>
              </template>
            </el-input>
          </div>
        </div>
        <template v-else>
          <canvas ref="screenRef" class="screen-canvas" />
          <div v-if="h264Mode" class="h264-tip">H264 流（WebCodecs/MSE 播放——待接入）</div>
          <el-empty v-if="!connected && !h264Mode" description="未连接——左侧填写连接信息后点击连接" :image-size="80" />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";

const form = reactive({
  gatewayUrl: "",
  accessToken: "",
  targetAgentId: "",
  verifyCode: "",
  wsUrl: "",
  connMethod: "ssh",
  reverseTunnel: false,
});

const connected = ref(false);
const h264Mode = ref(false);
const configSaved = ref(false);
const screenRef = ref<HTMLCanvasElement | null>(null);
const terminalRef = ref<HTMLDivElement | null>(null);
const cmdInput = ref("");
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
      if (form.connMethod === "ssh") startSSHSession();
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        try {
          handleTextMessage(JSON.parse(ev.data));
        } catch {
          // 非 JSON 字符串（帧桥 base64）→ 按帧处理
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
};

const handleTextMessage = (msg: any) => {
  if (msg.type === "ssh") appendTerminalOutput(msg.data, msg.stream === "stderr");
};

const handleFrame = (data: unknown) => {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    // 帧桥文本模型：payload = "topic:base64" —— 剥离前缀 + base64 解码还原字节
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
  span.style.color = isError ? "#ff4757" : "#00ff41";
  span.textContent = text;
  terminalRef.value.appendChild(span);
  terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
};

const sendCmd = () => {
  if (!cmdInput.value || !ws || !sshSessionId) return;
  ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: sshSessionId, data: btoa(unescape(encodeURIComponent(cmdInput.value + "\n"))) }));
  appendTerminalOutput("$ " + cmdInput.value + "\n", false);
  cmdInput.value = "";
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
.remote-actions { display: flex; gap: 8px; margin-top: 4px; }
.save-tip { margin-top: 12px; }
.remote-right { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #fff; border-radius: 8px; border: 1px solid var(--el-border-color-lighter); overflow: hidden; }
.screen-header { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 16px; border-bottom: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
.screen-title { font-size: 14px; font-weight: 600; }
.screen-body { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; background: #0d1117; }
.screen-canvas { max-width: 100%; max-height: 100%; object-fit: contain; }
.h264-tip { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); padding: 6px 14px; font-size: 12px; color: #e6a23c; background: rgba(230, 162, 60, 0.12); border: 1px solid rgba(230, 162, 60, 0.4); border-radius: 6px; }
.ssh-area { flex: 1; display: flex; flex-direction: column; padding: 12px; }
.terminal-container { flex: 1; background: #0c0c0c; color: #00ff41; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 13px; padding: 12px; overflow-y: auto; white-space: pre-wrap; min-height: 300px; border-radius: 4px; }
.terminal-input { margin-top: 8px; }
</style>
