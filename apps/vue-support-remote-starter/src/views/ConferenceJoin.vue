<template>
  <div class="conference-join-page">
    <div v-if="loading" class="join-loading">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else-if="error && !conferenceReady" class="join-error">
      <el-icon :size="48" color="var(--el-color-danger)"><WarningFilled /></el-icon>
      <h2>无法加入会议</h2>
      <p>{{ error }}</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>

    <ConferenceRoom
      v-else-if="conferenceReady"
      ref="conferenceRoomRef"
      :session-id="sessionId"
      :connection-state="connectionState"
      :invite-mode="inviteMode"
      :layout-mode="layoutMode"
      @disconnect-request="handleDisconnect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { WarningFilled } from "@element-plus/icons-vue";
import ConferenceRoom from "@pages/remote/components/ConferenceRoom.vue";
import useRemoteControl from "@pages/remote";

const router = useRouter();

const loading = ref(true);
const loadingMessage = ref("正在解析邀请链接...");
const error = ref("");
const sessionId = ref("");
const connectionState = ref("disconnected");
const inviteMode = ref<"host" | "guest">("guest");
const layoutMode = ref<"official" | "fixed-host">("official");
const conferenceReady = ref(false);
const conferenceRoomRef = ref<InstanceType<typeof ConferenceRoom>>();
const pendingConferenceSignal = ref<{ sid: string; payload: unknown } | null>(null);

type ConferenceInvitePayload = {
  roomId?: string;
  gateway?: string;
  targetId?: string;
  mode?: "host" | "guest";
  token?: string;
  verifyCode?: string;
  maxParticipants?: number;
  layoutMode?: "official" | "fixed-host";
};

function decodeConferencePayload(value: string): ConferenceInvitePayload | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, "=");
    const json = decodeURIComponent(Array.from(atob(padded), (ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
    return JSON.parse(json) as ConferenceInvitePayload;
  } catch {
    return null;
  }
}

function getParticipantId(roomId: string, mode: "host" | "guest") {
  const key = `conference-participant:${roomId}:${mode}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return cached;
  const value = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, value);
  return value;
}

async function forwardConferenceSignal(sid: string, payload: unknown) {
  await nextTick();
  if (conferenceRoomRef.value) {
    conferenceRoomRef.value.handleWebRTCSignal(sid, payload);
    return;
  }
  pendingConferenceSignal.value = { sid, payload };
}

async function flushPendingConferenceSignal() {
  if (!pendingConferenceSignal.value) return;
  await nextTick();
  const pending = pendingConferenceSignal.value;
  pendingConferenceSignal.value = null;
  conferenceRoomRef.value?.handleWebRTCSignal(pending.sid, pending.payload);
}

const {
  connectToTarget,
  disconnectSession,
  sessions,
} = useRemoteControl({
  onConnected(sid: string) {
    console.log("[conference-join] connected:", sid);
  },
  onTerminalOutput(sid: string, data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "livekit_info" || parsed.type === "room_joined") {
        forwardConferenceSignal(sid, parsed);
      }
    } catch {}
  },
  onDisconnected(sid: string) {
    if (sessionId.value && sid !== sessionId.value) return;
    loadingMessage.value = "已离开会议";
    setTimeout(() => goHome(), 1500);
  },
  onError(sid: string, msg: string) {
    if (conferenceReady.value || (sessionId.value && sid && sid !== sessionId.value)) {
      console.warn("[conference-join] ignored error:", msg);
      return;
    }
    error.value = msg;
    loading.value = false;
  },
});

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const payload = params.get("p") ? decodeConferencePayload(params.get("p") as string) : null;

  const roomId = payload?.roomId || params.get("roomId");
  const gateway = payload?.gateway || params.get("gateway");
  const gatewayUrl = gateway ? `ws://${gateway}` : undefined;
  const token = payload?.token || params.get("token") || undefined;
  const verifyCode = payload?.verifyCode || params.get("verifyCode") || undefined;
  const mode = payload?.mode || "guest";
  inviteMode.value = mode;
  layoutMode.value = payload?.layoutMode || "official";

  if (!roomId) {
    error.value = "邀请链接无效，缺少房间 ID";
    loading.value = false;
    return;
  }

  loadingMessage.value = "正在连接会议室...";

  const settings = {
    gatewayUrl: gatewayUrl || "ws://127.0.0.1:18082",
    targetId: payload?.targetId || roomId,
    verifyCode,
    protocol: "CONFERENCE" as const,
    conference: {
      roomId,
      mode,
      maxParticipants: payload?.maxParticipants,
      participantId: getParticipantId(roomId, mode),
    },
    token,
  };

  const result = await connectToTarget(settings);

  if (!result.ok) {
    error.value = result.error || "连接失败";
    loading.value = false;
    return;
  }

  // 找到新创建的 session id
  sessions.forEach((s, sid) => {
    if (!sessionId.value) {
      sessionId.value = sid;
      connectionState.value = "connected";
    }
  });

  conferenceReady.value = true;
  loading.value = false;
  await flushPendingConferenceSignal();
});

function handleDisconnect(sid: string) {
  disconnectSession(sid);
}

function goHome() {
  router.push("/remote/control");
}
</script>

<style scoped>
.conference-join-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color);
}

.join-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.join-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  padding: 32px;
}

.join-error h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.join-error p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  max-width: 360px;
}
</style>
