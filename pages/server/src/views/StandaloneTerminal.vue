<script setup lang="ts">
/**
 * 独立全屏终端 —— 由 TerminalView「弹出独立页面」window.open 打开。
 * 不携带应用外壳（侧栏/顶栏），远控渲染区独占整个浏览器可视范围。
 * 路由 meta.standalone = true，App.vue 据此只渲染 <router-view>。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getHost } from "../api";
import ScGuacViewer from "../components/ScGuacViewer.vue";
import ScSshDirectViewer from "../components/ScSshDirectViewer.vue";
import ScVncDirectViewer from "../components/ScVncDirectViewer.vue";

interface StandHost {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostRemoteProtocol?: string | null;
  serverHostRemotePort?: number | null;
  serverHostRemoteMode?: string | null;
}

const route = useRoute();
const router = useRouter();
const host = ref<StandHost | null>(null);
const loading = ref(true);
const error = ref("");
const disconnected = ref(false);

const hostId = computed(() => {
  const v = route.query.hostId;
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) ? n : null;
});
const protocol = computed(() => {
  const v = (route.query.protocol as string | string[] | undefined) ?? "";
  const p = (Array.isArray(v) ? v[0] : v).toLowerCase();
  return p === "ssh" || p === "rdp" || p === "vnc" ? p : "";
});
const identityId = computed(() => {
  const v = route.query.identityId;
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) ? n : null;
});

/** 远控端口：主机配置优先，SSH 回落到接入端口，RDP/VNC 用协议默认 */
function targetPortOf(h: StandHost, p: string): number | null {
  if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  if (p === "ssh") return h.serverHostPort || null;
  return p === "rdp" ? 3389 : 5900;
}

const connection = computed(() => {
  const h = host.value;
  if (!h || !protocol.value || disconnected.value) return null;
  const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
  return {
    hostId: h.id,
    hostName: `${h.serverHostName} (${h.serverHostAddress})`,
    address: h.serverHostAddress,
    protocol: protocol.value,
    identityId: identityId.value,
    targetPort: targetPortOf(h, protocol.value),
    mode: mode === "DIRECT" || mode === "NONE" ? mode : "GUACD",
  };
});

onMounted(async () => {
  if (hostId.value == null || !protocol.value) {
    error.value = "缺少 hostId / protocol 参数";
    loading.value = false;
    return;
  }
  try {
    const h = await getHost(hostId.value);
    if (!h) {
      error.value = "主机不存在";
    } else {
      host.value = {
        id: h.id,
        serverHostName: h.serverHostName,
        serverHostAddress: h.serverHostAddress,
        serverHostPort: h.serverHostPort,
        serverHostOsType: h.serverHostOsType,
        serverHostRemoteProtocol: h.serverHostRemoteProtocol,
        serverHostRemotePort: h.serverHostRemotePort,
        serverHostRemoteMode: h.serverHostRemoteMode,
      };
    }
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
});

function goBack(): void {
  router.replace("/terminal");
}
</script>

<template>
  <div class="stand-term">
    <div v-if="loading" class="st-mask">正在建立连接…</div>
    <div v-else-if="error" class="st-mask st-err-col">
      <span>{{ error }}</span>
      <button type="button" class="st-back" @click="goBack">返回远程控制</button>
    </div>
    <template v-else-if="connection">
      <ScSshDirectViewer
        v-if="connection.protocol === 'ssh'"
        :connection="connection"
        @close="disconnected = true"
      />
      <ScVncDirectViewer
        v-else-if="connection.protocol === 'vnc' && connection.mode === 'DIRECT'"
        :connection="connection"
        @close="disconnected = true"
      />
      <ScGuacViewer v-else :connection="connection" inline @close="disconnected = true" />
    </template>
    <div v-else class="st-mask">
      <span>连接已关闭 · 可关闭此窗口</span>
      <button type="button" class="st-back" @click="goBack">返回远程控制</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stand-term {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}
.st-mask {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  height: 100%;
  color: #d7dbe3;
  font-size: 14px;
  background: #111418;
}
.st-err {
  color: #f59c97;
}
.st-err-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #f59c97;
}
.st-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 36px;
  padding: 0 16px;
  color: #111418;
  font: inherit;
  line-height: 1;
  border: 0;
  border-radius: 4px;
  background: #d7dbe3;
  cursor: pointer;
}
.st-back:hover,
.st-back:focus-visible {
  background: #fff;
  outline: 2px solid #4c8dff;
  outline-offset: 2px;
}
</style>
