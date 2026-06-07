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
              <el-option label="会议" value="CONFERENCE" />
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

      <!-- 会议配置（CONFERENCE 协议） -->
      <template v-if="localSettings.protocol === 'CONFERENCE'">
        <el-divider content-position="center">会议配置</el-divider>
        <el-form-item label="会议室 ID">
          <el-input v-model="localConference.roomId" placeholder="输入会议室名称（如 test-room）" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="localConference.mode">
            <el-radio value="host">主持人</el-radio>
            <el-radio value="guest">参与者</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最大参与人数">
          <el-input-number v-model="localConference.maxParticipants" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          style="width: 100%"
          @click="handleCreateConference"
        >
          创建会议
        </el-button>
        <el-button
          type="default"
          size="large"
          :disabled="!localConference.roomId"
          style="width: 100%; margin-top: 8px"
          @click="handleCopyInviteLink"
        >
          复制邀请链接
        </el-button>
      </template>

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

    <!-- 在线控制端列表 -->
    <el-divider content-position="center">在线控制端</el-divider>
    <div v-if="controllers.length === 0" class="empty-hint">
      暂无在线控制端
    </div>
    <div v-else class="session-list">
      <div
        v-for="c in controllers"
        :key="c.id"
        class="session-item"
      >
        <el-tag :type="c.type === 'web' ? 'primary' : 'info'" size="small" effect="plain">
          {{ c.type }}
        </el-tag>
        <span class="session-id" :title="c.ipAddress">{{ c.ipAddress }}</span>
        <el-button
          text
          size="small"
          type="warning"
          @click.stop="handleKickController(c.id)"
        >
          踢出
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
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
  verifyCode: "",
  protocol: "SSH" as RemoteProtocol,
  codec: "H264" as RemoteCodec,
  transport: undefined as string | undefined,
});

const localAuth = reactive({
  host: "127.0.0.1",
  port: 22,
  username: "root",
  password: "",
});

const localConference = reactive({
  roomId: "",
  mode: "host" as "host" | "guest",
  maxParticipants: 3,
});

const connecting = computed(() => props.connectionState === "connecting");
const connected = computed(() => props.connectionState === "connected");
const canConnect = computed(() => {
  if (localSettings.protocol === "CONFERENCE") {
    return localSettings.gatewayUrl && localConference.roomId;
  }
  return localSettings.gatewayUrl && (localSettings.targetId || localSettings.verifyCode);
});

function handleConnect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("accessCode") || params.get("token") || "";
  const settings: ConnectionSettings = {
    gatewayUrl: localSettings.gatewayUrl,
    targetId: localSettings.targetId,
    verifyCode: localSettings.verifyCode,
    protocol: localSettings.protocol,
    codec: localSettings.codec,
    transport: localSettings.transport || undefined,
    token: token || undefined,
  };
  if (localSettings.protocol === "SSH") {
    settings.auth = {
      host: localAuth.host || "127.0.0.1",
      port: localAuth.port || 22,
      username: localAuth.username || "root",
      password: localAuth.password,
    };
  }
  if (localSettings.protocol === "CONFERENCE") {
    settings.conference = {
      roomId: localConference.roomId,
      mode: localConference.mode,
      maxParticipants: localConference.maxParticipants,
    };
  }
  emit("connect", settings);
}

function handleDisconnect() {
  emit("disconnect");
}

function encodeConferencePayload(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getGatewayHost() {
  try {
    const url = new URL(localSettings.gatewayUrl);
    return `${url.hostname}:${url.port || (url.protocol === "wss:" ? "443" : "80")}`;
  } catch {
    return "127.0.0.1:8082";
  }
}

function buildConferenceJoinUrl(mode: "host" | "guest") {
  const url = new URL("/conference/join", window.location.origin);
  url.searchParams.set("p", encodeConferencePayload({
    roomId: localConference.roomId,
    gateway: getGatewayHost(),
    targetId: localSettings.targetId || localConference.roomId,
    verifyCode: localSettings.verifyCode,
    mode,
    maxParticipants: localConference.maxParticipants,
  }));
  return url.toString();
}

function handleCreateConference() {
  if (!localConference.roomId) {
    ElMessage.warning("请先填写会议室 ID");
    return;
  }
  const joinUrl = buildConferenceJoinUrl(localConference.mode);
  const newTab = window.open(joinUrl, "_blank");
  if (newTab) {
    ElMessage.success("已在新窗口打开会议");
  } else {
    ElMessage.warning("请允许弹出窗口以打开会议");
  }
}

function handleCopyInviteLink() {
  if (!localConference.roomId) {
    ElMessage.warning("请先填写会议室 ID");
    return;
  }
  const inviteUrl = buildConferenceJoinUrl("guest");
  navigator.clipboard.writeText(inviteUrl).then(() => {
    ElMessage.success("邀请链接已复制到剪贴板");
  }).catch(() => {
    ElMessage.error("复制失败，请手动复制");
  });
}

// 在线控制端列表
interface ControllerInfo {
  id: string;
  ipAddress: string;
  connectedAt: string;
  active: boolean;
  type: string;
}
const controllers = ref<ControllerInfo[]>([]);
let ctrlTimer: ReturnType<typeof setInterval> | null = null;

function getAdminBaseUrl(): string {
  // 从 gatewayUrl 推导管理 API 基础 URL
  // gatewayUrl 格式: ws://127.0.0.1:8082 → http://127.0.0.1:3000
  try {
    const url = new URL(localSettings.gatewayUrl);
    return `${url.protocol === "wss:" ? "https:" : "http:"}//${url.hostname}:3000`;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
}

async function fetchControllers() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessCode") || params.get("token") || "";
    const resp = await fetch(`${getAdminBaseUrl()}/admin/api/controllers?token=${token}`);
    if (resp.ok) {
      const data = await resp.json();
      controllers.value = data.controllers || [];
    }
  } catch {
    // 静默失败
  }
}

async function handleKickController(id: string) {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessCode") || params.get("token") || "";
    const resp = await fetch(`${getAdminBaseUrl()}/admin/api/controllers/${id}?token=${token}`, { method: "DELETE" });
    if (resp.ok) {
      const data = await resp.json();
      if (data.kicked) {
        ElMessage.success("已踢出控制端");
        fetchControllers();
      }
    }
  } catch {
    ElMessage.error("踢出失败");
  }
}

onMounted(() => {
  fetchControllers();
  ctrlTimer = setInterval(fetchControllers, 5000);
});

onUnmounted(() => {
  if (ctrlTimer) clearInterval(ctrlTimer);
});
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
