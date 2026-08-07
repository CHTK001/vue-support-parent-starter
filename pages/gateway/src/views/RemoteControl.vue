<!--
  RemoteControl —— 远控主页面（3 步流程）
  步骤 1：用户在 ConnectionForm 填表（key 模式或 custom 模式）
  步骤 2：点击连接 → POST /api/connections/authenticate → 拿到 tunnelId + wsUrl
  步骤 3：根据 protocol 渲染对应 Viewer，传入 wsUrl 自动连
-->
<template>
  <div class="remote-control">
    <!-- 步骤 1: 表单（未连接时显示） -->
    <ConnectionForm
      v-if="!connected"
      @authenticate="onAuthenticate"
      :loading="authenticating"
    />

    <!-- 步骤 3: 已连接 - 渲染 Viewer -->
    <div v-else class="connected-view">
      <div class="session-bar">
        <el-tag :type="tagType" effect="dark">
          {{ protocol.toUpperCase() }}
        </el-tag>
        <span class="host-text">{{ host }}:{{ port }}</span>
        <span class="tunnel-text">tunnel: {{ tunnelId }}</span>
        <el-button size="small" type="danger" plain @click="onDisconnect">
          <el-icon><Close /></el-icon>
          <span>断开</span>
        </el-button>
      </div>

      <VncViewer v-if="protocol === 'vnc'" :ws-url="wsUrl" />
      <SshViewer v-else-if="protocol === 'ssh'" :ws-url="wsUrl" />
      <RdpViewer v-else-if="protocol === 'rdp'" :ws-url="wsUrl" />
      <RustDeskViewer v-else-if="protocol === 'rustdesk'" :ws-url="wsUrl" />
      <div v-else class="unknown-proto">
        不支持的协议: {{ protocol }}
      </div>
    </div>

    <div v-if="errorMsg" class="error-bar">
      {{ errorMsg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Close } from "@element-plus/icons-vue";
import ConnectionForm from "../components/ConnectionForm.vue";
import VncViewer from "../components/VncViewer.vue";
import SshViewer from "../components/SshViewer.vue";
import RdpViewer from "../components/RdpViewer.vue";
import RustDeskViewer from "../components/RustDeskViewer.vue";
import { authenticate } from "../api/gatewayApi";

/**
 * 当前协议
 */
const protocol = ref<string>("");

/**
 * 远端主机
 */
const host = ref<string>("");

/**
 * 远端端口
 */
const port = ref<number>(0);

/**
 * 隧道 ID
 */
const tunnelId = ref<string>("");

/**
 * WebSocket URL（相对路径，前端拼 host:port）
 */
const wsUrl = ref<string>("");

/**
 * 已连接标志
 */
const connected = ref<boolean>(false);

/**
 * 鉴权中标志
 */
const authenticating = ref<boolean>(false);

/**
 * 错误消息
 */
const errorMsg = ref<string>("");

/**
 * 协议对应 ElementPlus tag 颜色
 */
const tagType = computed<"success" | "warning" | "info" | "danger">(() => {
  switch (protocol.value) {
    case "vnc":
      return "success";
    case "ssh":
      return "warning";
    case "rdp":
      return "info";
    case "rustdesk":
      return "danger";
    default:
      return "info";
  }
});

/**
 * 处理表单提交：调用 server authenticate 端点
 */
async function onAuthenticate(payload: {
  mode: "key" | "custom";
  key?: string;
  protocol?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
}): Promise<void> {
  authenticating.value = true;
  errorMsg.value = "";
  try {
    const resp = await authenticate(payload);
    protocol.value = resp.protocol;
    host.value = resp.host;
    port.value = resp.port;
    tunnelId.value = resp.tunnelId;
    // 拼接 wsUrl 为绝对路径（基于 location.host，避免 vite proxy 失效）
    const wsBase = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsUrl.value = `${wsBase}//${window.location.host}${resp.wsUrl}`;
    connected.value = true;
    ElMessage.success(`已连接 ${resp.protocol}://${resp.host}:${resp.port}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "鉴权失败";
    errorMsg.value = msg;
    ElMessage.error(msg);
  } finally {
    authenticating.value = false;
  }
}

/**
 * 断开连接（仅清前端状态，后端 Tunnel 由 server 端 GC）
 */
function onDisconnect(): void {
  connected.value = false;
  protocol.value = "";
  host.value = "";
  port.value = 0;
  tunnelId.value = "";
  wsUrl.value = "";
  ElMessage.info("已断开");
}
</script>

<style scoped lang="scss">
.remote-control {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.connected-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.host-text {
  font-family: monospace;
  color: var(--el-text-color-regular);
}

.tunnel-text {
  font-family: monospace;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.error-bar {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.unknown-proto {
  padding: 40px;
  text-align: center;
  color: var(--el-color-danger);
}
</style>