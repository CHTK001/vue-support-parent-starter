<script setup lang="ts">
/**
 * 主机软件实例（运行中的进程级实例）。
 *
 * <p>与指标监控页「软件实例」同一份数据：主机台账里的 {@code serverHostSoftware}
 * （采集通道识别出的实例 JSON），实时值由 socket {@code monitor:host-metrics}
 * 的 {@code software} 字段刷新。这里只做「按类型聚合 → 展开明细」，
 * 不引入第二套采集口径。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ReIcon from "@repo/ui/re-icon";
import { useSocketService } from "@repo/core";
import { getHost } from "../api";
import type { SoftwareInstance } from "@pages/monitor/src/api";

const props = withDefaults(defineProps<{
  /** 主机台账标识（由工作区页签传入） */
  hostId: number;
  /** 主机名 */
  hostName?: string;
}>(), { hostName: "" });

/** 已知软件类型的中文标签（与后端 SoftwareCatalog 对齐） */
const SOFTWARE_LABELS: Record<string, string> = {
  java: "Java 进程", mysql: "MySQL", mariadb: "MariaDB", postgres: "PostgreSQL",
  redis: "Redis", "redis-sentinel": "Redis Sentinel", mongodb: "MongoDB", nginx: "Nginx",
  node: "Node.js", docker: "Docker", containerd: "containerd", elasticsearch: "Elasticsearch",
  kafka: "Kafka", zookeeper: "ZooKeeper", rabbitmq: "RabbitMQ", tomcat: "Tomcat",
  arthas: "Arthas", skywalking: "SkyWalking", memcached: "Memcached", etcd: "etcd",
  minio: "MinIO", "node-exporter": "Node Exporter", "redis-exporter": "Redis Exporter",
};

/**
 * 类型中文名。
 *
 * @param t 类型
 */
function swLabel(t: string): string {
  return SOFTWARE_LABELS[t] || t;
}

const instances = ref<SoftwareInstance[]>([]);
const loading = ref(false);
const error = ref("");
const loadedAt = ref("");

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
    loadedAt.value = new Date().toLocaleTimeString();
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
    instances.value = [];
  } finally {
    loading.value = false;
  }
}

/** 按类型聚合，按总 CPU 降序 */
interface SoftwareGroup {
  type: string;
  label: string;
  instances: SoftwareInstance[];
  count: number;
  totalCpu: number;
  totalMem: number;
  pids: number[];
  ports: number[];
  maxUptime: number;
}

const groups = computed<SoftwareGroup[]>(() => {
  const map = new Map<string, SoftwareInstance[]>();
  for (const s of instances.value) {
    const list = map.get(s.type) ?? [];
    list.push(s);
    map.set(s.type, list);
  }
  return [...map.entries()]
    .map(([type, list]) => ({
      type,
      label: swLabel(type),
      instances: list.slice().sort((a, b) => (b.cpu || 0) - (a.cpu || 0)),
      count: list.length,
      totalCpu: list.reduce((a, x) => a + (Number(x.cpu) || 0), 0),
      totalMem: list.reduce((a, x) => a + (Number(x.memMb) || 0), 0),
      pids: list.map(x => x.pid).filter(Boolean),
      ports: list.map(x => Number(x.port)).filter(Boolean),
      maxUptime: Math.max(0, ...list.map(x => Number(x.uptimeSec) || 0)),
    }))
    .sort((a, b) => b.totalCpu - a.totalCpu || a.label.localeCompare(b.label, "zh"));
});

const instanceCount = computed(() => instances.value.length);
const typeCount = computed(() => groups.value.length);

/**
 * 运行时长：2d 3h / 4h 12m / 30m。
 *
 * @param sec 秒
 */
function fmtUptime(sec: number): string {
  if (!sec || sec < 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * 内存用量。
 *
 * @param mb MB
 */
function fmtMem(mb: number): string {
  const v = Number(mb) || 0;
  return v >= 1024 ? `${(v / 1024).toFixed(1)}G` : `${v.toFixed(0)}M`;
}

/** 卡片首字母标识 */
function monogram(g: SoftwareGroup): string {
  const n = g.label.replace(/[^A-Za-z\u4e00-\u9fa5]/g, "");
  return (n[0] || "?").toUpperCase();
}

/** 卡片色相：按类型名散列，保证同一类型每次颜色一致 */
function hueOf(g: SoftwareGroup): number {
  let h = 0;
  for (let i = 0; i < g.type.length; i++) h = (h * 31 + g.type.charCodeAt(i)) % 360;
  return h;
}

/** 多实例时卡片上最多展示的 PID 数 */
function visiblePids(g: SoftwareGroup): number[] {
  return g.pids.slice(0, 3);
}

/** 实例明细弹窗 */
const detailVisible = ref(false);
const detailGroup = ref<SoftwareGroup | null>(null);

/**
 * 打开某类型的实例明细。
 *
 * @param g 分组
 */
function openDetail(g: SoftwareGroup): void {
  detailGroup.value = g;
  detailVisible.value = true;
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
    <div class="swi-head">
      <div class="swi-title">
        <ReIcon name="Cpu" :size="15" />
        <b>软件实例</b>
        <span class="swi-sub mono">{{ instanceCount }} INSTANCE · {{ typeCount }} TYPE</span>
        <span v-if="hostName" class="swi-host">{{ hostName }}</span>
      </div>
      <div class="swi-actions">
        <span v-if="loadedAt" class="swi-time mono">更新于 {{ loadedAt }}</span>
        <ReButton icon="Refresh" :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <div v-if="error" class="swi-empty is-error">
      <ReIcon name="WarningFilled" :size="22" />
      <span>读取软件实例失败：{{ error }}</span>
      <ReButton icon="Refresh" type="primary" @click="load">重试</ReButton>
    </div>

    <div v-else-if="!groups.length && !loading" class="swi-empty">
      <ReIcon name="Box" :size="24" />
      <b>未识别到软件实例</b>
      <p>软件实例来自主机采集（Agent / SSH / 本机 OSHI）的进程识别结果，确认采集通道正常后再刷新。</p>
    </div>

    <div v-else class="swi-grid">
      <div
        v-for="g in groups" :key="g.type"
        class="swi-card"
        :style="{ '--swi-hue': hueOf(g) }"
        @click="openDetail(g)"
      >
        <div class="swi-card__top">
          <span class="swi-badge">{{ monogram(g) }}</span>
          <div class="swi-card__name">
            <span class="swi-dn">{{ g.label }}</span>
            <span v-if="g.count > 1" class="swi-chip mono">×{{ g.count }}</span>
          </div>
          <ReIcon name="ArrowRight" :size="13" class="swi-go" />
        </div>

        <div class="swi-stats mono">
          <div class="swi-stat"><span class="swi-k">CPU</span><span class="swi-v">{{ g.totalCpu.toFixed(1) }}%</span></div>
          <div class="swi-stat"><span class="swi-k">MEM</span><span class="swi-v">{{ fmtMem(g.totalMem) }}</span></div>
          <div class="swi-stat"><span class="swi-k">UP</span><span class="swi-v">{{ fmtUptime(g.maxUptime) }}</span></div>
        </div>

        <div class="swi-pids">
          <span v-for="p in visiblePids(g)" :key="p" class="swi-pid mono">PID {{ p }}</span>
          <span v-if="g.pids.length > 3" class="swi-pid is-more mono">+{{ g.pids.length - 3 }}</span>
        </div>

        <div class="swi-foot mono" :title="g.instances[0]?.cmd">
          <span v-if="g.ports.length" class="swi-port">:{{ g.ports.join(" / :") }}</span>
          <span class="swi-cmd">{{ g.instances[0]?.cmd || "—" }}</span>
        </div>
      </div>
    </div>

    <ReDialog v-model="detailVisible" :title="`${detailGroup?.label ?? ''} · 实例明细`" width="880px">
      <div v-if="detailGroup" class="swi-detail">
        <div class="swi-detail__sum">
          <span>实例 <b>{{ detailGroup.count }}</b></span>
          <span>合计 CPU <b>{{ detailGroup.totalCpu.toFixed(1) }}%</b></span>
          <span>合计内存 <b>{{ fmtMem(detailGroup.totalMem) }}</b></span>
          <span v-if="detailGroup.ports.length">端口 <b>{{ detailGroup.ports.join(" / ") }}</b></span>
        </div>
        <div class="swi-table-wrap">
          <table class="swi-table">
            <thead>
              <tr>
                <th>PID</th><th>CPU</th><th>内存</th><th>运行时长</th><th>端口</th><th>命令行</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="x in detailGroup.instances" :key="x.pid">
                <td class="mono">{{ x.pid }}</td>
                <td class="mono">{{ (Number(x.cpu) || 0).toFixed(1) }}%</td>
                <td class="mono">{{ fmtMem(x.memMb) }}</td>
                <td class="mono">{{ fmtUptime(x.uptimeSec) }}</td>
                <td class="mono">{{ x.port || "—" }}</td>
                <td class="mono cmd" :title="x.cmd">{{ x.cmd }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
.swi {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 14px 16px 16px;
  overflow: auto;
}

.swi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.swi-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.swi-sub {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.swi-host {
  padding: 1px 8px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.swi-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.swi-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.swi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.swi-card {
  --swi-color: hsl(var(--swi-hue) 62% 52%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.swi-card:hover {
  border-color: var(--swi-color);
  box-shadow: 0 6px 18px hsl(var(--swi-hue) 62% 52% / 0.12);
  transform: translateY(-1px);
}

.swi-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.swi-badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--swi-color), hsl(var(--swi-hue) 62% 42%));
  border-radius: 9px;
}

.swi-card__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
}

.swi-dn {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swi-chip {
  flex: none;
  padding: 0 6px;
  font-size: 10.5px;
  color: var(--swi-color);
  background: hsl(var(--swi-hue) 62% 52% / 0.12);
  border-radius: 999px;
}

.swi-go {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.swi-stats {
  display: flex;
  gap: 14px;
}

.swi-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
}

.swi-k {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.swi-v {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.swi-pids {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.swi-pid {
  padding: 1px 6px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.swi-pid.is-more {
  color: var(--el-text-color-placeholder);
}

.swi-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 11px;
}

.swi-port {
  flex: none;
  color: var(--swi-color);
}

.swi-cmd {
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.swi-empty p {
  max-width: 460px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.swi-empty.is-error {
  color: var(--el-color-danger);
}

.swi-detail__sum {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.swi-detail__sum b {
  color: var(--el-text-color-primary);
}

.swi-table-wrap {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.swi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.swi-table th,
.swi-table td {
  padding: 7px 10px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.swi-table th {
  position: sticky;
  top: 0;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.swi-table td.cmd {
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-regular);
}
</style>
