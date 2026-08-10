<!--
  RustDeskViewer —— RustDesk 协议 Viewer
  RustDesk 用 ID + 临时密码连接 hbbs 服务器，无 WS 帧模式。
  现阶段显示连接信息 + 跳转提示。
-->
<template>
  <div class="rustdesk-viewer">
    <div class="info-card">
      <div class="icon-row">
        <el-icon :size="56"><Monitor /></el-icon>
      </div>
      <h3>RustDesk 远控</h3>
      <p class="desc">
        RustDesk 使用 ID + 临时密码模式，由 hbbs 中继服务器建立 P2P 会话，
        浏览器侧无标准 WebSocket 帧协议。
      </p>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">目标 ID</span>
          <span class="value">{{ deviceId }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务器</span>
          <span class="value">{{ hbbsHost }}</span>
        </div>
        <div class="info-item">
          <span class="label">状态</span>
          <span class="value">{{ status }}</span>
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
      <div class="actions">
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

/**
 * Server 返回的 WebSocket URL（暂未使用）
 */
const props = defineProps<{
  wsUrl: string;
}>();

/**
 * RustDesk 设备 ID（从 wsUrl path 推断 / 后续由 gateway authenticate 返回）
 */
const deviceId = computed<string>(() => {
  try {
    const u = new URL(props.wsUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  } catch {
    return "unknown";
  }
});

/**
 * hbbs 服务器（从 wsUrl host 推断）
 */
const hbbsHost = computed<string>(() => {
  try {
    return new URL(props.wsUrl).host;
  } catch {
    return "127.0.0.1:21116";
  }
});

/**
 * 状态
 */
const status = "待连接（Phase F 完善）";

/**
 * 提示
 */
const hintTitle = "请在被控端输入临时密码";
const hintDesc = "在被控主机 RustDesk 客户端输入你的 [临时密码] 即可建立会话；或使用 rustdesk-web 客户端。";

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

<style scoped lang="scss">
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
  padding: 32px 28px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .icon-row {
    color: var(--el-color-primary);
  }

  h3 {
    margin: 0;
    font-size: 20px;
    color: var(--el-text-color-primary);
  }

  .desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    width: 100%;
    margin-top: 8px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      background: var(--el-fill-color-light);
      border-radius: 8px;

      .label {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .value {
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-size: 13px;
        color: var(--el-text-color-primary);
        word-break: break-all;
      }
    }
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>