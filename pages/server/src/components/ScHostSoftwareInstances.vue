<script setup lang="ts">
/**
 * 主机软件实例（运行中的进程级实例）。
 *
 * <p>与指标监控页「软件实例」同一份数据、同一套版式：数据仍然来自主机台账的
 * {@code serverHostSoftware}（采集通道识别出的实例 JSON），实时值由 socket
 * {@code monitor:host-metrics} 的 {@code software} 字段刷新；渲染整块交给
 * {@link ScSoftwarePanel}，工作区页签与指标监控页不再各画一套卡片。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useSocketService } from "@repo/core";
import { getHost } from "../api";
import type { SoftwareInstance } from "@pages/monitor/src/api";
import ScSoftwarePanel from "./ScSoftwarePanel.vue";

const props = withDefaults(defineProps<{
  /** 主机台账标识（由工作区页签传入） */
  hostId: number;
  /** 主机名 */
  hostName?: string;
}>(), { hostName: "" });

const instances = ref<SoftwareInstance[]>([]);
const loading = ref(false);
const error = ref("");

/**
 * 解析后端可能给出的字符串或数组。
 *
 * @param raw 原始值
 */
function parseSoftware(raw: unknown): SoftwareInstance[] {
  if (!raw) return [];
  let arr: any = raw;
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  return Array.isArray(arr) ? arr : [];
}

/**
 * 拉取主机台账里的软件实例。
 */
async function load(): Promise<void> {
  if (!props.hostId) return;
  loading.value = true;
  error.value = "";
  try {
    const h: any = await getHost(props.hostId);
    instances.value = parseSoftware(h?.serverHostSoftware);
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
    instances.value = [];
  } finally {
    loading.value = false;
  }
}

/** socket 实时刷新 + 卸载释放 */
let unsub: (() => void) | undefined;

onMounted(() => {
  void load();
  const socket = useSocketService();
  unsub = socket?.subscribe("monitor", "host-metrics", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; software?: unknown };
      if (d?.hostId !== props.hostId || !d.software) return;
      const list = parseSoftware(d.software);
      if (list.length) instances.value = list;
    } catch { /* 静默 */ }
  });
});

onBeforeUnmount(() => unsub?.());
</script>

<template>
  <div class="swi">
    <ScSoftwarePanel
      :instances="instances"
      :host-name="hostName"
      :loading="loading"
      :error="error"
      refreshable
      @refresh="load"
    />
  </div>
</template>

<style scoped>
.swi {
  height: 100%;
  min-height: 0;
  padding: 12px 14px;
  overflow-y: auto;
}
</style>
