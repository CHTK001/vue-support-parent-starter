<!--
  RemoteControl —— 远控主页面（左侧配置 + 右侧画面）
  布局：UnoCSS 类名；颜色：Element Plus CSS 变量
  风格：极简、低饱和度、Vercel/Linear
-->
<template>
  <div class="min-h-screen" style="background: var(--el-bg-color-page)">
    <div class="mx-auto flex min-h-screen max-w-[1440px] gap-5 p-6">
      <!-- 左侧配置面板 -->
      <aside class="flex w-[380px] shrink-0 flex-col gap-3">
        <ReConnectionForm
          @authenticate="onAuthenticate"
          :loading="authenticating"
        />

        <!-- 连接状态（已连接时显示） -->
        <div
          v-if="connected"
          class="rounded-xl border border-solid p-4"
          style="background: var(--el-bg-color); border-color: var(--el-border-color-light)"
        >
          <div class="mb-2 flex items-center justify-between">
            <el-tag :type="tagType" size="small" effect="dark">
              {{ protocol.toUpperCase() }}
            </el-tag>
            <el-button text size="small" type="danger" @click="onDisconnect">
              断开
            </el-button>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-mono text-[13px]" style="color: var(--el-text-color-primary)">
              {{ host }}:{{ port }}
            </span>
            <span class="font-mono text-[11px]" style="color: var(--el-text-color-placeholder)">
              {{ tunnelId }}
            </span>
          </div>
        </div>

        <!-- 错误提示 -->
        <el-alert
          v-if="errorMsg"
          type="error"
          :title="errorMsg"
          show-icon
          closable
          @close="errorMsg = ''"
          class="rounded-[10px]"
        />
      </aside>

      <!-- 右侧画面区域 -->
      <main
        class="flex min-h-[500px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-solid"
        style="background: var(--el-bg-color); border-color: var(--el-border-color-light)"
      >
        <!-- 未连接：空状态 -->
        <div v-if="!connected" class="px-10 py-16 text-center">
          <div class="mb-5 flex justify-center" style="color: var(--el-text-color-placeholder)">
            <el-icon :size="48"><Connection /></el-icon>
          </div>
          <h3 class="mb-2 text-[18px] font-semibold" style="color: var(--el-text-color-primary)">
            远程控制
          </h3>
          <p
            class="mx-auto mb-5 max-w-[360px] text-[13px] leading-relaxed"
            style="color: var(--el-text-color-secondary)"
          >
            在左侧选择协议并填入认证信息，点击"连接"开始远程控制
          </p>
          <div class="flex items-center justify-center gap-2 text-[12px]" style="color: var(--el-text-color-placeholder)">
            <span>SSH 终端</span>
            <span style="color: var(--el-border-color)">·</span>
            <span>VNC 桌面</span>
            <span style="color: var(--el-border-color)">·</span>
            <span>RDP 远程桌面</span>
          </div>
        </div>

        <!-- 已连接：渲染 Viewer -->
        <ReVncViewer v-else-if="protocol === 'vnc'" :ws-url="wsUrl" />
        <ReSshViewer v-else-if="protocol === 'ssh'" :ws-url="wsUrl" />
        <ReRdpViewer v-else-if="protocol === 'rdp'" :ws-url="wsUrl" />
        <ReRustDeskViewer v-else-if="protocol === 'rustdesk'" :ws-url="wsUrl" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Connection } from "@element-plus/icons-vue";
import ReConnectionForm from "../components/ReConnectionForm.vue";
import ReVncViewer from "../components/ReVncViewer.vue";
import ReSshViewer from "../components/ReSshViewer.vue";
import ReRdpViewer from "../components/ReRdpViewer.vue";
import ReRustDeskViewer from "../components/ReRustDeskViewer.vue";
import { authenticate, disconnect } from "../api/gatewayApi";

const protocol = ref<string>("");
const host = ref<string>("");
const port = ref<number>(0);
const tunnelId = ref<string>("");
const wsUrl = ref<string>("");
const connected = ref<boolean>(false);
const authenticating = ref<boolean>(false);
const errorMsg = ref<string>("");

const tagType = computed<"success" | "warning" | "info" | "danger">(() => {
  switch (protocol.value) {
    case "vnc": return "success";
    case "ssh": return "warning";
    case "rdp": return "info";
    case "rustdesk": return "danger";
    default: return "info";
  }
});

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

function onDisconnect(): void {
  const tid = tunnelId.value;
  connected.value = false;
  protocol.value = "";
  host.value = "";
  port.value = 0;
  tunnelId.value = "";
  wsUrl.value = "";
  ElMessage.info("已断开");
  // 通知后端清理隧道
  if (tid) disconnect(tid);
}
</script>

<style scoped>
/* 覆盖 ReConnectionForm 的居中样式，适应左侧面板 */
:deep(.connection-form) {
  max-width: none !important;
  margin: 0 !important;
}
</style>