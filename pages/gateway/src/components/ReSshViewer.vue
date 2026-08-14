<!--
  ReSshViewer —— SSH 远控 Viewer（统一走 guacamole-common-js + guacd ssh 协议）
  与 RDP/VNC 共用 ReRdpViewer 的底层 @guacamole/client 实现，
  后端 GuacamoleBridge.writeSelectInstruction() 会根据 connection.protocol() 发 select ssh ...
-->
<template>
  <div class="ssh-viewer flex w-full flex-col gap-2">
    <div ref="displayContainerRef" class="ssh-display"></div>
    <div v-if="status" class="ssh-viewer__status text-[12px] text-el-text-secondary">
      {{ status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
// @ts-expect-error - guacamole-client-js 没有官方类型
import Guacamole from "guacamole-common-js";

const props = defineProps<{
  wsUrl: string;
}>();

const status = ref<string>("");
const displayContainerRef = ref<HTMLDivElement | null>(null);

let client: Guacamole.Client | null = null;

onMounted(() => {
  const container = displayContainerRef.value;
  if (!container) {
    status.value = "容器未挂载";
    return;
  }
  try {
    // WebSocketTunnel 期望相对路径（内部拼到当前 origin），由 vite proxy 转发到 gateway。
    const tunnel = new Guacamole.WebSocketTunnel(props.wsUrl);
    // V19 诊断：直接用裸 WebSocket 监听同一 URL，看浏览器侧是否真的收到帧
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const rawWs = new WebSocket(`${proto}//${window.location.host}${props.wsUrl}`, "guacamole");
      rawWs.binaryType = "arraybuffer";
      rawWs.onopen = () => console.log("[guac-debug-raw] ws OPEN");
      rawWs.onerror = (e) => console.log(`[guac-debug-raw] ws ERROR`);
      rawWs.onclose = (e) => console.log(`[guac-debug-raw] ws CLOSE code=${e.code} reason=${e.reason}`);
      rawWs.onmessage = (e) => {
        const data = typeof e.data === "string" ? e.data : `[binary ${e.data.byteLength}B]`;
        console.log(`[guac-debug-raw] msg type=${typeof e.data} len=${data.length} head=${data.slice(0, 120)}`);
      };
    } catch (e) {
      console.log(`[guac-debug-raw] ws create failed: ${e}`);
    }
    client = new Guacamole.Client(tunnel);
    // 调试：拦截 tunnel.oninstruction 打印所有收到的 opcode（V19 诊断）
    const origOnInstruction = (tunnel as { oninstruction?: (op: string, args: string[]) => void }).oninstruction;
    (tunnel as unknown as { oninstruction: (op: string, args: string[]) => void }).oninstruction = (op: string, args: string[]) => {
      console.log(`[guac-debug] opcode=${op} args=${JSON.stringify(args).slice(0, 200)}`);
      if (origOnInstruction) origOnInstruction(op, args);
    };
    const display = client.getDisplay();
    container.appendChild(display.getElement());
    client.onstatechange = (state: number) => {
      const states = ["idle", "connecting", "waiting", "connected", "disconnected", "error"];
      console.log(`[guac-debug] state=${states[state] ?? state}`);
      status.value = `SSH Guacamole: ${states[state] ?? state}`;
    };
    client.onerror = (error: { message?: string }) => {
      console.log(`[guac-debug] error=${error?.message}`);
      status.value = `错误: ${error?.message ?? "未知"}`;
    };
    // 必须显式 connect()：guacamole-common-js 只有调用 connect() 才会
    // 发送 select/size/connect 握手指令，guacd 才会返回 args 并建立 SSH 会话。
    client.connect();
  } catch (e) {
    status.value = `初始化失败: ${e instanceof Error ? e.message : String(e)}`;
  }
});

onUnmounted(() => {
  if (client) {
    client.disconnect();
    client = null;
  }
});
</script>

<style scoped>
.ssh-display {
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: #000;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}
.ssh-display :deep(> div) {
  width: 100%;
  height: 100%;
}
</style>
