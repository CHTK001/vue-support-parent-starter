<script setup lang="ts">
/**
 * 软件实例面板（指标监控 / 软件实例页共用）。
 *
 * <p>这一块原本长在 {@code HostDetailView} 里，是「指标监控」页的一张卡片；
 * 工作区里的「软件实例」页签需要同一套版式，所以整块抽成组件：
 * 头部（标题 + 计数 + 显示设置）、按类型聚合的分组卡、实例明细弹窗、
 * 显示设置弹窗全部在这里，两个入口只负责准备 {@code instances}。</p>
 *
 * <p>组件只做「渲染 + 交互」，不自己拉主机数据：数据从哪来（sockET 推送、
 * 台账快照）由调用方决定，避免同一个页面出现两套采集口径。</p>
 *
 * @author CH
 * @since 4.0.0.55
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { SoftwareInstance } from "@pages/monitor/src/api";
import { getAllConfig, saveConfig } from "@pages/monitor/src/api";
import { message } from "@repo/core";

const props = withDefaults(defineProps<{
  /** 软件实例列表（调用方保证已解析成数组） */
  instances: SoftwareInstance[];
  /** 面板标题 */
  title?: string;
  /** 主机名，显示在标题右侧 */
  hostName?: string;
  /** 数据加载中（只影响刷新按钮与空态文案） */
  loading?: boolean;
  /** 数据加载失败信息 */
  error?: string;
  /** 是否显示「显示设置」按钮 */
  showSettings?: boolean;
  /** 是否在头部提供刷新按钮 */
  refreshable?: boolean;
  /** 空态说明 */
  emptyHint?: string;
}>(), {
  title: "软件实例",
  hostName: "",
  loading: false,
  error: "",
  showSettings: true,
  refreshable: false,
  emptyHint: "软件实例来自主机采集（Agent / SSH / 本机 OSHI）的进程识别结果，确认采集通道正常后再刷新。",
});

const emit = defineEmits<{
  /** 请求调用方重新拉数据 */
  (e: "refresh"): void;
  /** 可见统计变化（按显示设置过滤后），供调用方页头复用同一口径 */
  (e: "counts", payload: { instanceCount: number; typeCount: number }): void;
}>();

/** 软件显示设置在 ms_monitor_config 中的 key；值为逗号分隔可见类型，空串=全部显示 */
const SW_VISIBLE_KEY = "monitor.host.software.visible.types";

/** 已知软件类型（与后端 SoftwareCatalog 对齐）的中文标签 */
const SOFTWARE_LABELS: Record<string, string> = {
  java: "Java 进程",
  mysql: "MySQL",
  mariadb: "MariaDB",
  postgres: "PostgreSQL",
  redis: "Redis",
  "redis-sentinel": "Redis Sentinel",
  mongodb: "MongoDB",
  nginx: "Nginx",
  node: "Node.js",
  docker: "Docker",
  containerd: "containerd",
  elasticsearch: "Elasticsearch",
  kafka: "Kafka",
  zookeeper: "ZooKeeper",
  rabbitmq: "RabbitMQ",
  tomcat: "Tomcat",
  arthas: "Arthas",
  skywalking: "SkyWalking",
  memcached: "Memcached",
  etcd: "etcd",
  minio: "MinIO",
  "node-exporter": "Node Exporter",
  "redis-exporter": "Redis Exporter",
};

/**
 * 类型中文名。
 *
 * @param t 类型
 */
function swLabel(t: string): string {
  return SOFTWARE_LABELS[t] || t;
}

/**
 * 数值兜底：null / 非数字都当 0。
 *
 * @param v 原值
 */
function numOr0(v: unknown): number {
  const n = Number(v);
  return v == null || Number.isNaN(n) ? 0 : n;
}

/**
 * 运行时长：2d 3h / 4h 12m / 30m。
 *
 * @param sec 秒
 */
function fmtUptime(sec?: number): string {
  if (sec == null || sec < 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** 可见类型集合：null=全部显示（默认），Set=仅显示其中类型 */
const visibleTypes = ref<Set<string> | null>(null);
/** 显示设置弹窗 */
const swSettingVisible = ref(false);
const swSettingSaving = ref(false);

/**
 * 打开显示设置。
 */
function openSwSetting(): void {
  swSettingVisible.value = true;
}

/** 设置弹窗候选类型（已知类型 ∪ 当前检测类型），按标签排序 */
const swSettingTypes = computed<string[]>(() => {
  const set = new Set<string>(Object.keys(SOFTWARE_LABELS));
  for (const s of props.instances) set.add(s.type);
  return [...set].sort((a, b) => swLabel(a).localeCompare(swLabel(b), "zh"));
});

/**
 * 某类型当前是否勾选。
 *
 * @param t 类型
 */
function swSettingChecked(t: string): boolean {
  return visibleTypes.value ? visibleTypes.value.has(t) : true;
}

/**
 * 勾选 / 取消某个类型。
 *
 * @param t 类型
 */
function swSettingToggle(t: string): void {
  // 首次切换时把当前“全选”物化成 Set
  if (!visibleTypes.value) visibleTypes.value = new Set(swSettingTypes.value);
  if (visibleTypes.value.has(t)) visibleTypes.value.delete(t);
  else visibleTypes.value.add(t);
}

/**
 * 全选 / 全不选。
 *
 * @param on 是否全选
 */
function swSettingAll(on: boolean): void {
  visibleTypes.value = on ? new Set(swSettingTypes.value) : new Set();
}

/**
 * 读取显示设置（同一部署内对所有主机生效）。
 */
async function loadSwSetting(): Promise<void> {
  try {
    const all = await getAllConfig();
    const raw = all?.[SW_VISIBLE_KEY];
    if (raw == null || String(raw).trim() === "") {
      visibleTypes.value = null;
    } else {
      visibleTypes.value = new Set(
        String(raw).split(",").map(s => s.trim()).filter(Boolean));
    }
  } catch {
    visibleTypes.value = null;
  }
}

/**
 * 保存显示设置。
 */
async function saveSwSetting(): Promise<void> {
  swSettingSaving.value = true;
  try {
    // 全选（或候选为空）→ 存空串表示全部；否则存逗号列表
    const allOn = !visibleTypes.value
      || visibleTypes.value.size === swSettingTypes.value.length;
    const value = allOn ? "" : [...(visibleTypes.value ?? [])].join(",");
    await saveConfig([{
      monitorConfigKey: SW_VISIBLE_KEY,
      monitorConfigValue: value,
      monitorConfigDesc: "主机软件实例可见类型(逗号分隔,空=全部)",
    }]);
    visibleTypes.value = value ? new Set(value.split(",")) : null;
    swSettingVisible.value = false;
    message.success("显示设置已保存");
  } finally {
    swSettingSaving.value = false;
  }
}

/** 按类型聚合后的分组 */
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

/** 按可见设置过滤后的软件实例 */
const visible = computed<SoftwareInstance[]>(() => {
  if (!visibleTypes.value) return props.instances;
  return props.instances.filter(s => visibleTypes.value!.has(s.type));
});

/** 按类型聚合的软件分组，按总 CPU 降序 */
const groups = computed<SoftwareGroup[]>(() => {
  const map = new Map<string, SoftwareInstance[]>();
  for (const s of visible.value) {
    if (!map.has(s.type)) map.set(s.type, []);
    map.get(s.type)!.push(s);
  }
  const list: SoftwareGroup[] = [];
  for (const [type, instances] of map) {
    const ins = [...instances].sort((a, b) => numOr0(b.cpu) - numOr0(a.cpu));
    list.push({
      type,
      label: swLabel(type),
      instances: ins,
      count: ins.length,
      totalCpu: ins.reduce((acc, x) => acc + numOr0(x.cpu), 0),
      totalMem: ins.reduce((acc, x) => acc + numOr0(x.memMb), 0),
      pids: ins.map(x => numOr0(x.pid)),
      ports: ins.map(x => numOr0(x.port)).filter(Boolean),
      maxUptime: Math.max(0, ...ins.map(x => numOr0(x.uptimeSec))),
    });
  }
  return list.sort((a, b) => b.totalCpu - a.totalCpu);
});

/** 可见类型数 */
const typeCount = computed(() => groups.value.length);
/** 可见实例总数 */
const instanceCount = computed(() => visible.value.length);

// 统计回传：页头「软件 X 类」与面板计数必须同一口径（都受显示设置过滤）
watch(
  [instanceCount, typeCount],
  ([ic, tc]) => emit("counts", { instanceCount: ic, typeCount: tc }),
  { immediate: true },
);

/**
 * 分组徽章首字母。
 *
 * @param g 分组
 */
function swMonogram(g: SoftwareGroup): string {
  return (g.label || g.type || "?").trim().charAt(0).toUpperCase();
}

/**
 * 卡片上展示的 PID（最多 3 个，超出显示 +N）。
 *
 * @param g 分组
 */
function swCardPids(g: SoftwareGroup): { pids: number[]; rest: number } {
  return { pids: g.pids.slice(0, 3), rest: Math.max(0, g.pids.length - 3) };
}

/**
 * 内联迷你条：某实例 CPU 相对组内最大值的宽度百分比。
 *
 * @param g 分组
 * @param v 该实例 CPU
 */
function swBarWidth(g: SoftwareGroup, v: number): number {
  const max = Math.max(1, ...g.instances.map(x => numOr0(x.cpu)));
  return Math.max(4, Math.round((numOr0(v) / max) * 100));
}

/** 分组配色角色（循环取 el 主题色，全部走 CSS 变量） */
const SW_COLOR_ROLES = ["primary", "success", "warning", "danger", "info"];

/**
 * 第 i 个分组的配色角色。
 *
 * @param i 序号
 */
function swColorRole(i: number): string {
  return SW_COLOR_ROLES[i % SW_COLOR_ROLES.length];
}

// ---------------- 分组明细弹窗（实例表 + CPU 占比图） ----------------
const swDetailVisible = ref(false);
const swDetailGroup = ref<SoftwareGroup | null>(null);
const swDetailChartRef = ref<HTMLDivElement>();
/** echarts 实例（懒加载，避免软件实例页把 echarts 拖进首屏分包） */
let swDetailChart: import("echarts").ECharts | null = null;
/** 异步初始化令牌：弹窗在 init 完成前被关掉时不留下野实例 */
let chartToken = 0;

/**
 * 打开某分组的实例明细。
 *
 * @param g 分组
 */
function openSwDetail(g: SoftwareGroup): void {
  swDetailGroup.value = g;
  swDetailVisible.value = true;
}

/**
 * 渲染 CPU 占比环形图。
 */
async function renderSwDetailChart(): Promise<void> {
  const g = swDetailGroup.value;
  if (!swDetailChartRef.value || !g) return;
  if (!swDetailChart) {
    const token = ++chartToken;
    const echarts = await import("echarts");
    // 等待模块期间弹窗已关闭 / 组件已卸载：直接放弃
    if (token !== chartToken || !swDetailVisible.value || !swDetailChartRef.value) return;
    swDetailChart = echarts.init(swDetailChartRef.value);
  }
  swDetailChart.setOption({
    tooltip: { trigger: "item", valueFormatter: (v: unknown) => `${v}%` },
    legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie",
      radius: ["42%", "68%"],
      center: ["50%", "44%"],
      avoidLabelOverlap: true,
      itemStyle: { borderWidth: 2 },
      label: { show: true, formatter: "{b}\n{d}%", fontSize: 10 },
      data: g.instances.map(x => ({
        name: `PID ${numOr0(x.pid)}`,
        value: Number(numOr0(x.cpu).toFixed(2)),
      })),
    }],
  }, true);
  swDetailChart.resize();
}

watch(swDetailVisible, (v) => {
  if (v) nextTick(() => void renderSwDetailChart());
  else if (swDetailChart) {
    chartToken += 1;
    swDetailChart.dispose();
    swDetailChart = null;
  }
});

onMounted(() => {
  void loadSwSetting();
});

onBeforeUnmount(() => {
  chartToken += 1;
  if (swDetailChart) {
    swDetailChart.dispose();
    swDetailChart = null;
  }
});
</script>

<template>
  <section class="ssp">
    <div class="sp-head">
      <span class="sp-title">{{ title }}</span>
      <div class="sp-actions">
        <span v-if="hostName" class="sp-host">{{ hostName }}</span>
        <span class="sp-count mono">{{ instanceCount }} INSTANCE · {{ typeCount }} TYPE</span>
        <ReButton v-if="refreshable" icon="Refresh" :loading="loading" @click="emit('refresh')">刷新</ReButton>
        <ReButton v-if="showSettings" icon="Setting" @click="openSwSetting">显示设置</ReButton>
      </div>
    </div>

    <div v-if="error" class="ssp-state is-error">
      <ReIcon name="WarningFilled" :size="22" />
      <span>读取软件实例失败：{{ error }}</span>
      <ReButton v-if="refreshable" icon="Refresh" type="primary" @click="emit('refresh')">重试</ReButton>
    </div>

    <div v-else-if="!groups.length" class="ssp-state">
      <ReIcon name="Box" :size="24" />
      <b>{{ instances.length ? "当前筛选下没有软件实例" : "未识别到软件实例" }}</b>
      <p>{{ emptyHint }}</p>
    </div>

    <div v-else class="sw-grid">
      <div
        v-for="(g, gi) in groups" :key="g.type"
        class="sw-card" :class="`is-${swColorRole(gi)}`"
      >
        <div class="sw-top">
          <div class="sw-badge">{{ swMonogram(g) }}</div>
          <div class="sw-head">
            <div class="sw-name-line">
              <span class="sw-dn">{{ g.label }}</span>
              <span v-if="g.count > 1" class="sw-chip mono">×{{ g.count }}</span>
            </div>
            <div class="sw-pidchips">
              <span v-for="p in swCardPids(g).pids" :key="p" class="sw-pid mono">PID {{ p }}</span>
              <span v-if="swCardPids(g).rest" class="sw-pid sw-pid-more mono">+{{ swCardPids(g).rest }}</span>
            </div>
          </div>
          <ReButton class="sw-detail-btn" icon="View" @click="openSwDetail(g)">详情</ReButton>
        </div>

        <div class="sw-stats mono">
          <div class="sw-stat"><span class="sw-k">CPU</span><span class="sw-v">{{ g.totalCpu.toFixed(1) }}%</span></div>
          <div class="sw-stat"><span class="sw-k">MEM</span><span class="sw-v">{{ g.totalMem.toFixed(0) }}M</span></div>
          <div class="sw-stat"><span class="sw-k">UP</span><span class="sw-v">{{ fmtUptime(g.maxUptime) }}</span></div>
        </div>

        <!-- 多实例：内联迷你条形（按 PID 的 CPU 分布）；单实例：端口 + 命令行 -->
        <div v-if="g.count > 1" class="sw-bars">
          <div v-for="x in g.instances.slice(0, 5)" :key="x.pid" class="sw-bar-row">
            <span class="sw-bar-label mono">{{ x.pid }}</span>
            <span class="sw-bar-track"><span class="sw-bar-fill" :style="{ width: swBarWidth(g, x.cpu) + '%' }" /></span>
            <span class="sw-bar-val mono">{{ numOr0(x.cpu).toFixed(1) }}</span>
          </div>
          <div v-if="g.instances.length > 5" class="sw-bars-more mono">其余 {{ g.instances.length - 5 }} 个实例见详情</div>
        </div>
        <div v-else class="sw-single">
          <span v-if="g.ports.length" class="sw-port mono">端口 :{{ g.ports.join(' / :') }}</span>
          <span class="sw-cmd mono" :title="g.instances[0].cmd">{{ g.instances[0].cmd }}</span>
        </div>
      </div>
    </div>

    <!-- 显示设置（持久化到 ms_monitor_config，对所有主机生效） -->
    <ReDialog v-model="swSettingVisible" title="软件实例显示设置" width="580px">
      <div class="swset-bar">
        <ReButton @click="swSettingAll(true)">全选</ReButton>
        <ReButton @click="swSettingAll(false)">全不选</ReButton>
        <span class="swset-hint">仅勾选的软件类型会展示，对所有主机生效并持久化。</span>
      </div>
      <div class="swset-list">
        <label v-for="t in swSettingTypes" :key="t" class="swset-item">
          <el-checkbox :model-value="swSettingChecked(t)" @change="swSettingToggle(t)" />
          <span class="swset-label">{{ swLabel(t) }}</span>
          <span class="swset-type mono">{{ t }}</span>
        </label>
      </div>
      <template #footer>
        <ReButton @click="swSettingVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="swSettingSaving" @click="saveSwSetting">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 分组实例明细（合并占比图 + 实例表） -->
    <ReDialog v-model="swDetailVisible" :title="`${swDetailGroup?.label ?? ''} · 实例明细`" width="800px">
      <div v-if="swDetailGroup" class="swdet">
        <div ref="swDetailChartRef" class="swdet-chart" />
        <table class="swdet-table">
          <thead>
            <tr><th>PID</th><th>端口</th><th>CPU %</th><th>内存 M</th><th>运行时长</th><th>命令行</th></tr>
          </thead>
          <tbody>
            <tr v-for="x in swDetailGroup.instances" :key="x.pid">
              <td class="mono">{{ x.pid }}</td>
              <td class="mono">{{ x.port || "—" }}</td>
              <td class="mono">{{ numOr0(x.cpu).toFixed(1) }}</td>
              <td class="mono">{{ numOr0(x.memMb).toFixed(0) }}</td>
              <td class="mono">{{ fmtUptime(x.uptimeSec) }}</td>
              <td class="swdet-cmd mono" :title="x.cmd">{{ x.cmd }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ReDialog>
  </section>
</template>

<style scoped>
/* 与「指标监控」页同一套浅色遥测面板口径：外层 .hd 里是 --p-card / --p-line-2，
   组件被单独挂在页签里时没有那层继承，所以这里给出同值兜底。 */
.ssp {
  --ssp-card: var(--p-card, #ffffff);
  --ssp-line: var(--p-line-2, rgba(148, 163, 184, 0.1));
  --ssp-text-3: var(--p-text-3, #94a3b8);
  --ssp-mono: var(--p-mono, "JetBrains Mono", "SFMono-Regular", ui-monospace, Consolas, "Liberation Mono", monospace);
  position: relative;
  z-index: 1;
  background: var(--ssp-card);
  border: 1px solid var(--ssp-line);
  border-radius: 12px;
  overflow: hidden;
}

.mono {
  font-family: var(--ssp-mono);
}

.sp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 11px 14px;
  border-bottom: 1px solid var(--ssp-line);
}

.sp-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--el-text-color-primary);
}

.sp-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-host {
  padding: 1px 8px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.sp-count {
  font-size: 10.5px;
  color: var(--ssp-text-3);
  letter-spacing: 0.12em;
}

.sw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 12px;
  padding: 14px;
}

.sw-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sw-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.sw-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.sw-badge {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  font-size: 16px;
  font-weight: 800;
}

.sw-head {
  flex: 1;
  min-width: 0;
}

.sw-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sw-dn {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.sw-chip {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.sw-pidchips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.sw-pid {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
}

.sw-pid-more {
  color: var(--el-text-color-secondary);
}

.sw-detail-btn {
  flex: none;
}

.sw-stats {
  display: flex;
  gap: 8px;
}

.sw-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-extra-light);
}

.sw-k {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.08em;
}

.sw-v {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.sw-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sw-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sw-bar-label {
  width: 48px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.sw-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 5px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.sw-bar-fill {
  display: block;
  height: 100%;
  border-radius: 5px;
  background: var(--el-color-primary);
  opacity: 0.85;
}

.sw-bar-val {
  width: 38px;
  text-align: right;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.sw-bars-more {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.sw-single {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sw-port {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.sw-cmd {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分组配色角色：徽章/条形全部走 el 变量，随主题切换 */
.sw-card.is-primary .sw-badge { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.sw-card.is-success .sw-badge { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.sw-card.is-warning .sw-badge { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.sw-card.is-danger  .sw-badge { background: var(--el-color-danger-light-9);  color: var(--el-color-danger); }
.sw-card.is-info    .sw-badge { background: var(--el-color-info-light-9);    color: var(--el-color-info); }
.sw-card.is-success .sw-bar-fill { background: var(--el-color-success); }
.sw-card.is-warning .sw-bar-fill { background: var(--el-color-warning); }
.sw-card.is-danger  .sw-bar-fill { background: var(--el-color-danger); }
.sw-card.is-info    .sw-bar-fill { background: var(--el-color-info); }

/* 空态 / 错误态（指标监控里整块被 v-if 隐藏，页签里要看得到原因） */
.ssp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 44px 20px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.ssp-state p {
  max-width: 460px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.ssp-state.is-error {
  color: var(--el-color-danger);
}

/* 显示设置弹窗 */
.swset-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.swset-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.swset-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 14px;
  max-height: 340px;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.swset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
}

.swset-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.swset-type {
  margin-left: auto;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

/* 实例明细弹窗 */
.swdet {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.swdet-chart {
  width: 100%;
  height: 200px;
}

.swdet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.swdet-table th,
.swdet-table td {
  padding: 7px 8px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.swdet-table th {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.swdet-table td {
  color: var(--el-text-color-regular);
}

.swdet-cmd {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
}
</style>
