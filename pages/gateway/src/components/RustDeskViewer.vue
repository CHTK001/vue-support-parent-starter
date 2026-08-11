<!--
  RustDeskViewer —— RustDesk 协议 Viewer（占位 · 保留旧实现以做兼容）
  RustDesk 用 ID + 临时密码连接 hbbs 服务器，无 WS 帧模式。
  现阶段显示连接信息 + 跳转提示。
  设计风格：Vercel / Linear · 低饱和度 · 卡片化布局
-->
<template>
  <div class="rustdesk-viewer">
    <div
      class="info-card rounded-xl border border-solid p-8"
      style="background: var(--el-bg-color); border-color: var(--el-border-color-light)"
    >
      <div class="icon-row" style="color: var(--el-color-primary)">
        <el-icon :size="56"><Monitor /></el-icon>
      </div>
      <h3 class="m-0 text-[20px] font-semibold" style="color: var(--el-text-color-primary)">RustDesk 远控</h3>
      <p class="desc m-0 max-w-[420px] text-center text-[13px] leading-relaxed" style="color: var(--el-text-color-secondary)">
        RustDesk 使用 ID + 临时密码模式，由 hbbs 中继服务器建立 P2P 会话，浏览器侧无标准 WebSocket 帧协议。
      </p>
      <div class="info-grid">
        <div
          v-for="item in infoItems"
          :key="item.label"
          class="info-item flex flex-col gap-1 rounded-lg p-2.5"
          style="background: var(--el-fill-color-light)"
        >
          <span
            class="label text-[11px] font-semibold uppercase tracking-wider"
            style="color: var(--el-text-color-secondary)"
          >
            {{ item.label }}
          </span>
          <span class="value break-all font-mono text-[13px]" style="color: var(--el-text-color-primary)">
            {{ item.value }}
          </span>
        </div>
      </div>
      <el-alert
        type="info"
        :title="hintTitle"
        :description="hintDesc"
        show-icon
        :closable="false"
        class="mt-4"
      />
      <div class="actions mt-3 flex flex-wrap justify-center gap-2">
        <el-button type="primary" size="large" @click="copyDeviceId">
          <el-icon><CopyDocument /></el-icon>
          复制设备 ID
        </el-button>
        <el-button type="default" size="large" @click="openRustdeskWeb">
          <el-icon><Link /></el-icon>
          打开 rustdesk-web 客户端
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CopyDocument, Link, Monitor } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const props = defineProps<{
  wsUrl: string;
}>();

const deviceId = computed<string>(() => {
  try {
    const u = new URL(props.wsUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  } catch {
    return "unknown";
  }
});

const hbbsHost = computed<string>(() => {
  try {
    return new URL(props.wsUrl).host;
  } catch {
    return "127.0.0.1:21116";
  }
});

const status = "待连接（Phase F 完善）";

const hintTitle = "请在被控端输入临时密码";
const hintDesc = "在被控主机 RustDesk 客户端输入你的 [临时密码] 即可建立会话；或使用 rustdesk-web 客户端。";

const infoItems = computed(() => [
  { label: "目标 ID", value: deviceId.value },
  { label: "服务器", value: hbbsHost.value },
  { label: "状态", value: status },
]);

async function copyDeviceId(): Promise<void> {
  try {
    await navigator.clipboard.writeText(deviceId.value);
    ElMessage.success(`已复制设备 ID: ${deviceId.value}`);
  } catch {
    ElMessage.warning("剪贴板不可用，请手动复制: " + deviceId.value);
  }
}

function openRustdeskWeb(): void {
  const url = `https://rustdesk.com/web/?id=${encodeURIComponent(deviceId.value)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
</script>

<style scoped>
.rustdesk-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 70vh;
  min-height: 480px;
  padding: 24px;
}

.info-card {
  max-width: 560px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.icon-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.desc {
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
</style>
