<!--
  RemoteControl —— 远控主页面（左侧配置 + 右侧画面）
  设计风格：Vercel / Linear · 低饱和度 · 大量留白 · 极简卡片
  样式约定：
    - 布局/间距：UnoCSS 工具类
    - 颜色：UnoCSS 主题别名（bg-el-bg / text-el-text-primary 等）已映射到 Element Plus CSS 变量
-->
<template>
  <div class="rc-root min-h-screen w-full bg-el-bg-page">
    <div class="mx-auto flex min-h-screen w-full max-w-[1440px] gap-5 px-6 py-6">
      <!-- 左侧配置面板 -->
      <aside
        class="rc-aside flex w-[380px] shrink-0 flex-col gap-3"
        aria-label="远程连接配置"
      >
        <ReConnectionForm
          compact
          :loading="authenticating"
          @authenticate="onAuthenticate"
        />

        <!-- 连接状态（已连接时显示） -->
        <div
          v-if="connected"
          class="rc-status card-modern flex flex-col gap-2 p-4 transition-colors"
          aria-live="polite"
        >
          <div class="mb-1 flex items-center justify-between">
            <el-tag :type="tagType" size="small" effect="dark">
              {{ protocol.toUpperCase() }}
            </el-tag>
            <el-button text size="small" type="danger" @click="onDisconnect">
              断开
            </el-button>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-mono text-[13px] text-el-text-primary">{{ host }}:{{ port }}</span>
            <span class="font-mono text-[11px] text-el-text-placeholder">{{ tunnelId }}</span>
          </div>
        </div>

        <!-- 错误提示 -->
        <el-alert
          v-if="errorMsg"
          type="error"
          :title="errorMsg"
          show-icon
          closable
          class="rc-alert rounded-[10px]"
          @close="errorMsg = ''"
        />
      </aside>

      <!-- 右侧画面区域 -->
      <main
        class="rc-stage card-modern flex min-h-[500px] flex-1 items-center justify-center overflow-hidden"
        aria-label="远程画面区域"
      >
        <!-- 未连接：空状态 -->
        <ReEmptyState
          v-if="!connected"
          :title="'远程控制'"
          :description="'在左侧选择协议并填入认证信息，点击「连接」开始远程控制'"
          :icon="Connection"
          size="large"
        >
          <template #icon>
            <el-icon :size="48"><Connection /></el-icon>
          </template>
          <div class="flex items-center justify-center gap-2 text-[12px] text-el-text-placeholder">
            <span>SSH 终端</span>
            <span class="text-el-border">·</span>
            <span>VNC 桌面</span>
            <span class="text-el-border">·</span>
            <span>RDP 远程桌面</span>
          </div>
        </ReEmptyState>

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
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { Connection } from "@element-plus/icons-vue";
import ReConnectionForm from "../components/ReConnectionForm.vue";
import ReVncViewer from "../components/ReVncViewer.vue";
import ReSshViewer from "../components/ReSshViewer.vue";
import ReRdpViewer from "../components/ReRdpViewer.vue";
import ReRustDeskViewer from "../components/ReRustDeskViewer.vue";
import ReEmptyState from "@repo/ui/re-empty-state";
import { authenticate, disconnect } from "../api/gatewayApi";
import type { AuthPayload, AuthResponse } from "../api/types";

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

async function onAuthenticate(payload: AuthPayload): Promise<void> {
  authenticating.value = true;
  errorMsg.value = "";
  try {
    const resp: AuthResponse = await authenticate(payload);
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
  if (tid) disconnect(tid);
}
</script>

<style scoped>
/* card-modern 已定义在 app.scss：bg-el-bg-color-overlay + 边框 + 圆角 + 阴影 */
</style>