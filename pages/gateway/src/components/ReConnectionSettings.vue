<!--
  ReConnectionSettings —— 远程控制连接设置
  设计风格：Vercel / Linear · 低饱和度 · 卡片分组 · 紧凑栅格
  样式约定：UnoCSS 主题别名 → Element Plus CSS 变量
-->
<template>
  <ReCard class="connection-settings">
    <div class="cs-head">
      <div class="cs-head__title text-el-text-primary">连接设置</div>
      <div class="cs-head__desc text-el-text-secondary">配置 Gateway 与目标端点</div>
    </div>

    <el-form label-position="top" size="default">
      <el-form-item label="Gateway 地址">
        <el-input v-model="localSettings.gatewayUrl" placeholder="ws://127.0.0.1:8082">
          <template #prefix><el-icon><Link /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-form-item label="目标 ID">
        <el-input v-model="localSettings.targetId" placeholder="被控端点 ID（如 ssh-target）">
          <template #prefix><el-icon><Monitor /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-form-item label="或验证码">
        <el-input v-model="localSettings.verifyCode" placeholder="被控端验证码（与 targetId 二选一）">
          <template #prefix><el-icon><Key /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="协议">
            <el-select v-model="localSettings.protocol" style="width: 100%">
              <el-option label="SSH 终端" value="SSH" />
              <el-option label="桌面远程" value="DESKTOP" />
              <el-option label="视频会议" value="CONFERENCE" />
              <el-option label="自动探测" value="AUTO" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="传输协议">
            <el-select v-model="localSettings.transport" style="width: 100%" clearable placeholder="自动(TCP)">
              <el-option label="TCP" value="TCP" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="编码器">
            <el-select v-model="localSettings.codec" style="width: 100%" clearable placeholder="自动">
              <el-option label="H264" value="H264" />
              <el-option label="H265" value="H265" />
              <el-option label="JPEG" value="JPEG" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="令牌（可选）">
            <el-input v-model="localSettings.token" placeholder="网关令牌" show-password />
          </el-form-item>
        </el-col>
      </el-row>

      <div
        v-if="localSettings.protocol === 'SSH'"
        class="cs-section"
        style="border-color: var(--el-border-color-lighter)"
      >
        <div class="cs-section__title text-el-text-secondary">SSH 认证</div>
        <el-form-item label="主机">
          <el-input v-model="localAuth.host" placeholder="localhost" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="端口">
              <el-input-number v-model="localAuth.port" :min="1" :max="65535" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="用户名">
              <el-input v-model="localAuth.username" placeholder="root" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="密码">
              <el-input v-model="localAuth.password" type="password" show-password placeholder="密码" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div
        v-if="localSettings.protocol === 'CONFERENCE'"
        class="cs-section"
        style="border-color: var(--el-border-color-lighter)"
      >
        <div class="cs-section__title text-el-text-secondary">会议配置</div>
        <el-form-item label="会议室 ID">
          <el-input v-model="localConference.roomId" placeholder="如 test-room" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="localConference.mode">
            <el-radio value="host">主持人</el-radio>
            <el-radio value="guest">参与者</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="会议模式">
          <el-select v-model="localConference.layoutMode" style="width: 100%">
            <el-option label="自由会议（LiveKit 官方）" value="official" />
            <el-option label="固定主持人" value="fixed-host" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大参与人数">
          <el-input-number v-model="localConference.maxParticipants" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
      </div>

      <div class="cs-actions">
        <el-button
          type="primary"
          size="large"
          :loading="connecting"
          :disabled="connecting"
          class="cs-actions__btn"
          @click="handleConnect"
        >
          <el-icon v-if="!connecting"><Connection /></el-icon>
          {{ connecting ? "连接中..." : "建立连接" }}
        </el-button>
      </div>

      <div v-if="connectionStatus" class="cs-status flex justify-center">
        <ReTag :type="connectionStatusType" size="small">{{ connectionStatusText }}</ReTag>
      </div>
    </el-form>
  </ReCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Link, Monitor, Key, Connection } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import type {
  RemoteConnectionSettings,
  ConnectionState,
  RemoteControlInstance,
} from "../composables/useRemoteControl";

const props = defineProps<{
  remote: RemoteControlInstance;
  defaults?: Partial<RemoteConnectionSettings>;
  onConnected?: (sessionId: string) => void;
}>();

const localSettings = reactive<RemoteConnectionSettings>({
  gatewayUrl: props.defaults?.gatewayUrl || localStorage.getItem("rc-gateway-url") || "ws://127.0.0.1:8082",
  targetId: props.defaults?.targetId || "",
  verifyCode: props.defaults?.verifyCode || "",
  protocol: props.defaults?.protocol || "SSH",
  transport: props.defaults?.transport || "TCP",
  codec: props.defaults?.codec,
  token: props.defaults?.token,
  conference: props.defaults?.conference,
});

const localAuth = reactive({
  host: "",
  port: 22,
  username: "root",
  password: "",
});

const localConference = reactive({
  roomId: "",
  mode: "host" as "host" | "guest",
  layoutMode: "official" as "official" | "fixed-host",
  maxParticipants: 5,
});

const connecting = ref(false);

const connectionStatus = computed<ConnectionState>(() => props.remote.connectionState.value);

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case "disconnected":
      return "未连接";
    case "connecting":
      return "连接中";
    case "connected":
      return "已连接";
    case "error":
      return "连接错误";
    default:
      return "未知";
  }
});

const connectionStatusType = computed<"info" | "warning" | "success" | "danger">(() => {
  switch (connectionStatus.value) {
    case "disconnected":
      return "info";
    case "connecting":
      return "warning";
    case "connected":
      return "success";
    case "error":
      return "danger";
    default:
      return "info";
  }
});

async function handleConnect() {
  if (!localSettings.gatewayUrl) {
    message.warning("请填写 Gateway 地址");
    return;
  }

  localStorage.setItem("rc-gateway-url", localSettings.gatewayUrl);

  const settings: RemoteConnectionSettings = {
    ...localSettings,
    auth:
      localSettings.protocol === "SSH"
        ? { ...localAuth, password: localAuth.password || undefined }
        : undefined,
    conference:
      localSettings.protocol === "CONFERENCE"
        ? {
            roomId: localConference.roomId || `room-${Date.now()}`,
            mode: localConference.mode,
            layoutMode: localConference.layoutMode,
            maxParticipants: localConference.maxParticipants,
          }
        : undefined,
  };

  connecting.value = true;
  try {
    const res = await props.remote.connectToTarget(settings);
    if (res.ok) {
      message.success("连接成功");
      props.onConnected?.(props.remote.activeSessionId.value || "");
    } else {
      message.error(res.error || "连接失败");
    }
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "网络异常");
  } finally {
    connecting.value = false;
  }
}
</script>

<style scoped>
.connection-settings {
  padding: 16px;
}

.cs-head {
  margin-bottom: 16px;
}

.cs-head__title {
  font-size: 14px;
  font-weight: 600;
}

.cs-head__desc {
  font-size: 12px;
  margin-top: 2px;
}

.cs-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed;
}

.cs-section__title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.cs-actions {
  margin-top: 16px;
}

.cs-actions__btn {
  width: 100%;
}

.cs-status {
  margin-top: 12px;
}
</style>
