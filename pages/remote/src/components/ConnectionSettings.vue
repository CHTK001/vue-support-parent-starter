<template>
  <div class="connection-settings">
    <h3 class="section-title">连接设置</h3>

    <el-form label-position="top" size="default">
      <el-form-item label="Gateway 地址">
        <el-input v-model="localSettings.gatewayUrl" placeholder="ws://127.0.0.1:8082">
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="目标 ID">
        <el-input v-model="localSettings.targetId" placeholder="e.g. ssh-target">
          <template #prefix>
            <el-icon><Monitor /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="协议">
            <el-select v-model="localSettings.protocol" style="width: 100%">
              <el-option label="SSH 终端" value="SSH" />
              <el-option label="桌面远程" value="DESKTOP" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="解码器">
            <el-select
              v-model="localSettings.codec"
              style="width: 100%"
              :disabled="localSettings.protocol !== 'DESKTOP'"
            >
              <el-option label="H.264" value="H264" />
              <el-option label="JPEG" value="JPEG" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="center">认证信息（SSH 可选）</el-divider>

      <el-form-item label="SSH 主机">
        <el-input v-model="localAuth.host" placeholder="目标主机地址（默认 localhost）" />
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

      <el-button
        type="primary"
        size="large"
        :loading="connecting"
        :disabled="!canConnect"
        style="width: 100%; margin-top: 8px"
        @click="handleConnect"
      >
        {{ connecting ? "连接中..." : "连接" }}
      </el-button>

      <el-button
        v-if="connected"
        type="danger"
        size="large"
        plain
        style="width: 100%; margin-top: 8px"
        @click="handleDisconnect"
      >
        断开连接
      </el-button>
    </el-form>

    <el-divider content-position="center">连接列表</el-divider>

    <div v-if="sessionsList.length === 0" class="empty-hint">
      暂无连接
    </div>
    <div v-else class="session-list">
      <div
        v-for="s in sessionsList"
        :key="s.sessionId"
        class="session-item"
        :class="{ active: s.sessionId === activeSessionId }"
        @click="$emit('selectSession', s.sessionId)"
      >
        <el-tag :type="s.state === 'connected' ? 'success' : 'danger'" size="small" effect="dark">
          {{ s.protocol }}
        </el-tag>
        <span class="session-id">{{ s.sessionId.slice(0, 12) }}...</span>
        <el-button
          text
          size="small"
          type="danger"
          @click.stop="$emit('disconnectSession', s.sessionId)"
        >
          断开
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { Link, Monitor } from "@element-plus/icons-vue";
import type { ConnectionSettings, RemoteProtocol, RemoteCodec } from "../composables/useRemoteControl";

const emit = defineEmits<{
  connect: [settings: ConnectionSettings];
  disconnect: [];
  selectSession: [sessionId: string];
  disconnectSession: [sessionId: string];
}>();

const props = withDefaults(defineProps<{
  connectionState?: string;
  sessionsList?: Array<{ sessionId: string; protocol: string; state: string }>;
  activeSessionId?: string | null;
}>(), {
  connectionState: "disconnected",
  sessionsList: () => [],
  activeSessionId: null,
});

const localSettings = reactive({
  gatewayUrl: "ws://127.0.0.1:8082",
  targetId: "",
  protocol: "SSH" as RemoteProtocol,
  codec: "H264" as RemoteCodec,
});

const localAuth = reactive({
  host: "127.0.0.1",
  port: 22,
  username: "root",
  password: "",
});

const connecting = computed(() => props.connectionState === "connecting");
const connected = computed(() => props.connectionState === "connected");
const canConnect = computed(() => localSettings.gatewayUrl && localSettings.targetId);

function handleConnect() {
  const settings: ConnectionSettings = {
    gatewayUrl: localSettings.gatewayUrl,
    targetId: localSettings.targetId,
    protocol: localSettings.protocol,
    codec: localSettings.codec,
  };
  if (localSettings.protocol === "SSH") {
    settings.auth = {
      host: localAuth.host || "127.0.0.1",
      port: localAuth.port || 22,
      username: localAuth.username || "root",
      password: localAuth.password,
    };
  }
  emit("connect", settings);
}

function handleDisconnect() {
  emit("disconnect");
}
</script>

<style scoped>
.connection-settings {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.empty-hint {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 16px 0;
  font-size: 13px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition: background 0.2s;
}

.session-item:hover {
  background: var(--el-fill-color);
}

.session-item.active {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
}

.session-id {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
