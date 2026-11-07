<script setup lang="ts">
/**
 * 主机工作区底部状态条（Deck 布局）
 *
 * <p>固定贴在工作区底部，把「这台主机现在怎么样」压成一行常驻信息：
 * CPU / 内存 / 磁盘 三条占用率 + 在线状态 + 延迟 + 协议 + Agent 版本。</p>
 *
 * <p>鼠标经过左侧的概要区时浮出 popover，展示原先画像页左侧那套「概要信息」
 * （主机名 / 系统 / 架构 / 内存 / 磁盘 / IP / 运行时长 …）。
 * 这些字段是低频查阅、但需要时又必须一眼看到，放在常驻条里会把状态条撑成一张表；
 * 挂进 hover 浮层既不占版面，又不用为它单开一个页签。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ReIcon from "@repo/ui/re-icon";
import type { MetricRow } from "./ScHostMetricsBar.types";

interface Props {
  /** 主机名 */
  hostName?: string;
  /** 地址:端口 */
  address?: string;
  /** 是否在线（1 在线 / 0 离线） */
  online?: number;
  /** 延迟毫秒，null 未知，负数不可达 */
  delayMs?: number | null;
  /** 远控协议（SSH / RDP / VNC） */
  protocol?: string;
  /** Agent 版本，空串表示未就绪 */
  agentVersion?: string;
  /** CPU 使用率 % */
  cpu?: number;
  /** 内存使用率 % */
  mem?: number;
  /** 磁盘使用率 % */
  disk?: number;
  /** 内存总量 MB（环形图里展示「已用 / 共」），0 表示未知 */
  memTotalMb?: number;
  /** 磁盘总量 GB（环形图里展示「已用 / 共」），0 表示未知 */
  diskTotalGb?: number;
  /** 磁盘读取速率 KB/s */
  diskReadKbs?: number;
  /** 磁盘写入速率 KB/s */
  diskWriteKbs?: number;
  /** 网络接收速率 KB/s */
  netRxKbs?: number;
  /** 网络发送速率 KB/s */
  netTxKbs?: number;
  /** 是否已有 IO 数据（false 时显示「—」而不是 0） */
  hasIo?: boolean;
  /** 是否已有指标数据（false 时显示「等待采集」而不是 0%） */
  hasMetrics?: boolean;
  /** 系统句柄数（-1 表示取不到） */
  handleCount?: number;
  /** 根文件系统 inode 使用率（-1 表示取不到 / 平台不支持） */
  inodePercent?: number;
  /** 已用 inode 数 */
  inodeUsed?: number;
  /** 总 inode 数 */
  inodeTotal?: number;
  /** inode 统计所在的挂载点 */
  inodeMount?: string;
  /** 概要浮层内容 */
  rows?: MetricRow[];
}

const props = withDefaults(defineProps<Props>(), {
  hostName: "",
  address: "",
  online: 0,
  delayMs: null,
  protocol: "",
  agentVersion: "",
  cpu: 0,
  mem: 0,
  disk: 0,
  memTotalMb: 0,
  diskTotalGb: 0,
  diskReadKbs: 0,
  diskWriteKbs: 0,
  netRxKbs: 0,
  netTxKbs: 0,
  hasIo: false,
  hasMetrics: false,
  handleCount: -1,
  inodePercent: -1,
  inodeUsed: -1,
  inodeTotal: -1,
  inodeMount: "",
  rows: () => [],
});

/** 指标被点击：交给外层打开「历史数据」（复用指标监控那套历史弹窗） */
const emit = defineEmits<{
  (e: "metric-click", kind: "cpu" | "mem" | "disk" | "diskio" | "net"): void;
}>();

/** 概要在浮层里的位置：向上展开，避免遮住状态条本身 */
const popVisible = ref(false);
const rootRef = ref<HTMLElement | null>(null);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showPop(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  popVisible.value = true;
}

/** 延迟收起：鼠标从概要区移到浮层之间有一小段空隙，立刻收起会闪 */
function hidePop(): void {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    popVisible.value = false;
  }, 160);
}

function onDocDown(e: MouseEvent): void {
  if (!popVisible.value) return;
  const el = rootRef.value;
  if (el && !el.contains(e.target as Node)) popVisible.value = false;
}

onMounted(() => document.addEventListener("mousedown", onDocDown));
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocDown);
  if (hideTimer) clearTimeout(hideTimer);
});

/**
 * 占用率条的颜色：与监控域语义色一致（<70 主色 / 70-85 警告 / ≥85 危险）
 *
 * @param pct 百分比
 */
function barColor(pct: number): string {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  if (v >= 85) return "var(--el-color-danger)";
  if (v >= 70) return "var(--el-color-warning)";
  return "var(--el-color-primary)";
}

function pctText(v: number): string {
  return `${(Math.round((Number(v) || 0) * 10) / 10).toFixed(1)}%`;
}

const delayText = computed(() => {
  const ms = props.delayMs;
  if (ms == null) return "—";
  if (ms < 0) return "不可达";
  return `${ms} ms`;
});

const delayBad = computed(() => {
  const ms = props.delayMs;
  return ms != null && (ms < 0 || ms > 200);
});

const onlineText = computed(() => (props.online === 1 ? "在线" : "离线"));

/** 句柄数：只在取得到时渲染，缺失时整项不出现（不写 0，也不占一个「—」） */
const handleText = computed(() => props.handleCount.toLocaleString());

/** inode 使用率：Windows 等平台没有 inode，取不到时整项不出现 */
const inodeText = computed(() => `${props.inodePercent.toFixed(1)}%`);

/** inode 明细（hover 看已用 / 总量 / 挂载点） */
const inodeTitle = computed(() => {
  const used = props.inodeUsed >= 0 ? props.inodeUsed.toLocaleString() : "—";
  const total = props.inodeTotal >= 0 ? props.inodeTotal.toLocaleString() : "—";
  return `iNode 使用率：${used} / ${total}（${props.inodeMount || "/"}）`;
});

const handleTitle = computed(() =>
  `系统句柄数：${props.handleCount.toLocaleString()}（POSIX 为打开的文件描述符数，Windows 为各进程 HandleCount 汇总）`);

/**
 * 端口明细按行拆分。
 *
 * <p>外层传进来的是「22/tcp ssh，80/tcp http」这种整串，中英文逗号都可能出现；
 * 之前只按半角逗号拆，遇到中文逗号就整串挤成一段。</p>
 *
 * @param tip 端口明细串
 */
function splitPortTip(tip: string): string[] {
  return String(tip || "")
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * 速率展示：KB/s 超过 1024 自动升到 MB/s。
 *
 * @param v KB/s
 */
function fmtKbs(v: number | undefined): string {
  if (!props.hasIo || v == null) return "—";
  const n = Number(v) || 0;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} MB/s`;
  return `${Math.round(n)} KB/s`;
}

/**
 * 环形图用量说明。
 *
 * @param key 指标
 */
function ringDetail(key: "cpu" | "mem" | "disk"): string {
  if (key === "mem" && props.memTotalMb > 0) {
    const total = props.memTotalMb;
    const used = (total * clampPct(props.mem)) / 100;
    return `${fmtSize(used, "MB")} / ${fmtSize(total, "MB")}`;
  }
  if (key === "disk" && props.diskTotalGb > 0) {
    const total = props.diskTotalGb;
    const used = (total * clampPct(props.disk)) / 100;
    return `${used.toFixed(1)} GB / ${total.toFixed(1)} GB`;
  }
  return key === "cpu" ? "整机平均使用率" : "";
}

/**
 * MB / GB 友好展示。
 *
 * @param v    数值
 * @param unit 原单位
 */
function fmtSize(v: number, unit: "MB" | "GB"): string {
  if (unit === "MB") {
    return v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v.toFixed(0)} MB`;
  }
  return `${v.toFixed(1)} GB`;
}

/**
 * 百分比收敛到 0-100。
 *
 * @param v 原值
 */
function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Number(v) || 0));
}

/** 三条指标的定义，避免模板里重复三份结构 */
const bars = computed(() => [
  { key: "cpu" as const, label: "CPU", value: props.cpu, detail: ringDetail("cpu") },
  { key: "mem" as const, label: "内存", value: props.mem, detail: ringDetail("mem") },
  { key: "disk" as const, label: "磁盘", value: props.disk, detail: ringDetail("disk") },
]);
</script>

<template>
  <div ref="rootRef" class="hmb">
    <!-- 概要入口：hover 浮出原画像左侧的概要信息 -->
    <div class="hmb__summary" @mouseenter="showPop" @mouseleave="hidePop" @focusin="showPop" @focusout="hidePop">
      <span class="hmb__dot" :class="online === 1 ? 'is-on' : 'is-off'" />
      <b class="hmb__name">{{ hostName || '未选择主机' }}</b>
      <span v-if="address" class="hmb__addr">{{ address }}</span>
      <ReIcon name="InfoFilled" :size="12" class="hmb__info" />

      <transition name="hmb-pop">
        <div v-if="popVisible" class="hmb__pop" @mouseenter="showPop" @mouseleave="hidePop">
          <div class="hmb__pop-head">
            <span class="hmb__pop-title">概要信息</span>
            <span class="hmb__pop-sub">{{ hostName }}</span>
          </div>
          <div v-if="rows.length" class="hmb__pop-rows">
            <div v-for="r in rows" :key="r.label" class="hmb__pop-row" :class="{ 'is-barred': r.percent != null }">
              <span class="hmb__pop-label">{{ r.label }}</span>
              <span v-if="r.percent == null" class="hmb__pop-val" :class="{ 'is-multiline': r.value.includes('\n'), 'is-mono': r.mono, 'is-dim': r.value === '—' }">{{ r.value }}</span>
              <!-- 已扫描端口明细：hover 浮出端口列表（原 title 改为 popover，长列表可读） -->
              <el-popover
                v-if="r.tip"
                placement="top"
                :width="320"
                :show-after="250"
                trigger="hover"
                popper-class="hmb-port-pop"
              >
                <template #reference>
                  <ReIcon name="View" :size="12" class="hmb__tip-ico" />
                </template>
                <div class="hmb__port-list">
                  <b>已扫描端口明细</b>
                  <p v-for="(it, i) in splitPortTip(r.tip)" :key="i">{{ it }}</p>
                </div>
              </el-popover>
              <!-- 内存 / 磁盘：数值下方补一条「外壳 + 内条」占用率 -->
              <div v-if="r.percent != null" class="hmb__pop-bar">
                <span class="hmb__pop-bar-track">
                  <i :style="{ width: clampPct(r.percent) + '%', background: barColor(r.percent) }" />
                </span>
                <span class="hmb__pop-bar-text">{{ r.percentText || pctText(r.percent) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="hmb__pop-empty">暂无概要数据（等待采集通道返回）</div>
        </div>
      </transition>
    </div>

    <div class="hmb__spacer" />

    <!-- 常驻指标：CPU / 内存 / 磁盘（hover 环形图，点击看历史） -->
    <div class="hmb__metrics">
      <el-popover
        v-for="b in bars"
        :key="b.key"
        placement="top"
        :width="214"
        :show-after="140"
        trigger="hover"
        popper-class="hmb-metric-pop"
      >
        <template #reference>
          <div
            class="hmb__metric is-clickable"
            :class="{ 'is-dim': !hasMetrics }"
            :title="`${b.label} 使用率 · 点击查看历史`"
            @click="emit('metric-click', b.key)"
          >
            <span class="hmb__metric-label">{{ b.label }}</span>
            <span class="hmb__track">
              <i :style="{ width: clampPct(b.value) + '%', background: barColor(b.value) }" />
            </span>
            <span class="hmb__metric-val" :class="{ 'is-dim': !hasMetrics }">
              {{ hasMetrics ? pctText(b.value) : '—' }}
            </span>
          </div>
        </template>
        <div class="hmb__ring-card" @click="emit('metric-click', b.key)">
          <div class="hmb__ring-wrap">
            <svg class="hmb__ring" viewBox="0 0 44 44">
              <circle class="hmb__ring-bg" cx="22" cy="22" r="18" pathLength="100" />
              <circle
                class="hmb__ring-fg" cx="22" cy="22" r="18" pathLength="100"
                :style="{ stroke: barColor(b.value), strokeDasharray: `${hasMetrics ? clampPct(b.value) : 0} 100` }"
              />
            </svg>
            <span class="hmb__ring-val">{{ hasMetrics ? pctText(b.value) : '—' }}</span>
          </div>
          <b class="hmb__ring-title">{{ b.label }} 使用率</b>
          <span v-if="b.detail" class="hmb__ring-detail">{{ b.detail }}</span>
          <span class="hmb__ring-hint">点击查看历史曲线</span>
        </div>
      </el-popover>
    </div>

    <!-- 实时 IO：磁盘读写 / 网络收发，点击同样打开历史 -->
    <div v-if="hasIo" class="hmb__io">
      <div
        class="hmb__io-item"
        title="磁盘读写速率 · 点击查看历史"
        @click="emit('metric-click', 'diskio')"
      >
        <ReIcon name="Coin" :size="12" class="hmb__io-ico" />
        <span class="hmb__io-label">磁盘</span>
        <span class="hmb__io-val"><i>读</i>{{ fmtKbs(diskReadKbs) }}</span>
        <span class="hmb__io-val"><i>写</i>{{ fmtKbs(diskWriteKbs) }}</span>
      </div>
      <div
        class="hmb__io-item"
        title="网络收发速率 · 点击查看历史"
        @click="emit('metric-click', 'net')"
      >
        <ReIcon name="Share" :size="12" class="hmb__io-ico" />
        <span class="hmb__io-label">网络</span>
        <span class="hmb__io-val"><i>↓</i>{{ fmtKbs(netRxKbs) }}</span>
        <span class="hmb__io-val"><i>↑</i>{{ fmtKbs(netTxKbs) }}</span>
      </div>
    </div>

    <!-- 连接信息 -->
    <div class="hmb__meta">
      <span v-if="handleCount >= 0" class="hmb__pill is-res" :title="handleTitle">句柄 <b class="hmb__res pf-mono">{{ handleText }}</b></span>
      <span v-if="inodePercent >= 0" class="hmb__pill is-res" :title="inodeTitle">iNode <b class="hmb__res pf-mono">{{ inodeText }}</b></span>
      <span class="hmb__pill" :class="online === 1 ? 'is-ok' : 'is-bad'">{{ onlineText }}</span>
      <span class="hmb__pill" :class="{ 'is-warn': delayBad }">{{ delayText }}</span>
      <span v-if="protocol" class="hmb__pill is-proto">{{ protocol.toUpperCase() }}</span>
      <span v-if="agentVersion" class="hmb__pill is-agent">Agent v{{ agentVersion }}</span>
      <span v-else class="hmb__pill is-mute">Agent 未就绪</span>
    </div>
  </div>
</template>

<style scoped>
/* 常驻状态条：贴在工作区底部，视觉上是一条独立的信息带，不与内容抢空间 */
/* 强行一行显示：flex-wrap: nowrap 做容器级兜底，white-space: nowrap 向下继承，
   让所有后代文字都不换行。概要浮层（绝对定位不在当前流里）不在此列。 */
/* 宽度必须跟着父容器走（flex: 1 1 auto + min-width: 0）：早先是 flex: none，
   宽度由内容决定，主机地址一长整条就被撑到容器外，右侧几项直接被裁掉。
   分隔线由外层 .as-work__bottom 负责，这里不再画，否则线只跟到内容末尾。 */
.hmb {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 14px;
  flex-wrap: nowrap;
  white-space: nowrap;
  min-width: 0;
  min-height: 38px;
  padding: 0 14px;
  /* 不能用 overflow: hidden：概要浮层 .hmb__pop 是子元素，向上弹出会被整条裁掉
     （现象就是 hover 主机名没有任何反应）。横向溢出由各段自己的 ellipsis 收口，
     不依赖容器裁剪。 */
  overflow: visible;
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== 概要入口 ===== */
/* flex: 1 1 auto —— 概要区吃满指标与胶囊之外的全部宽度。
   它是这一行里唯一"可以被压缩"的部分，所以必须由它来承担伸缩，
   否则一旦空间不够，被压扁的会是主机名（只显示成一个点）。 */
.hmb__summary {
  position: relative;
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: default;
  transition: background-color 0.15s ease;
}

.hmb__summary:hover {
  background: var(--el-fill-color-light);
}

.hmb__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.hmb__dot.is-on {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}

.hmb__dot.is-off {
  background: var(--el-text-color-placeholder);
}

.hmb__name {
  min-width: 0;
  overflow: hidden;
  flex: 0 1 auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 地址是这一行里最长、也最不关键的一段：给它一个极高的收缩系数，
   空间不够时先压它，主机名尽量保持完整（名字是识别这台主机的唯一线索）。
   缺 min-width: 0 时 min-content 就是整条地址，会把概要区顶到容器外。 */
.hmb__addr {
  min-width: 0;
  overflow: hidden;
  flex: 0 100 auto;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hmb__info {
  flex: none;
  color: var(--el-text-color-placeholder);
}

/* ===== 概要浮层 ===== */
.hmb__pop {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 20;
  width: 340px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light);
  cursor: default;
}

.hmb__pop-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hmb__pop-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.hmb__pop-sub {
  overflow: hidden;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hmb__pop-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hmb__pop-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.hmb__pop-label {
  flex: none;
  width: 66px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}

.hmb__pop-val {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hmb__pop-val.is-mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
}

.hmb__pop-val.is-dim {
  color: var(--el-text-color-placeholder);
}

/* 多行文本（如多个内网 IP）一行一个，换行保留，过长浮层可滚动 */
.hmb__pop-val.is-multiline {
  white-space: pre-line;
  text-overflow: clip;
  max-height: 5.6em;
  line-height: 1.6;
}

/* 带占用率条的概要行（内存 / 磁盘）：标签 + 进度条 + 右侧用量同行显示，
   总量已包含在右侧「已用 / 总量」文案里，不再单独占一行 */
.hmb__pop-row.is-barred {
  flex-wrap: nowrap;
  align-items: center;
}

.hmb__pop-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

/* 外壳 + 内条：外壳负责边界，内条只负责填充 */
.hmb__pop-bar-track {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  height: 7px;
  padding: 1px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}

.hmb__pop-bar-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.hmb__pop-bar-text {
  flex: none;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

/* 概要行内的端口明细入口图标：纯 hover 提示，不占行高 */
.hmb__tip-ico {
  flex: none;
  cursor: help;
  color: var(--el-text-color-placeholder);
  transition: color 0.14s;
}
.hmb__tip-ico:hover {
  color: var(--el-color-primary, #409eff);
}

/* 已扫描端口明细 popover：浮层渲染在 body，需全局选择器 */
:global(.hmb-port-pop) {
  max-width: 340px;
}
:global(.hmb__port-list) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
  word-break: break-all;
}
:global(.hmb__port-list b) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hmb__pop-empty {
  padding: 10px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.hmb-pop-enter-active,
.hmb-pop-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.hmb-pop-enter-from,
.hmb-pop-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ===== 常驻指标 ===== */
/* 间距曾经靠 spacer 撑开，但 spacer 参与伸缩会和概要区抢宽度，
   结果主机名被挤成一个点。改成概要区自己吃满剩余宽度，
   spacer 退化成一根不会长大也不会缩没的固定缝。 */
.hmb__spacer {
  flex: 0 0 auto;
  min-width: 8px;
}

.hmb__metrics {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
}

.hmb__metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hmb__metric-label {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.hmb__track {
  position: relative;
  display: block;
  width: 56px;
  height: 5px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 999px;
}

.hmb__track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.hmb__metric-val {
  min-width: 42px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
  text-align: right;
}

.hmb__metric-val.is-dim {
  color: var(--el-text-color-placeholder);
}

/* 指标可点击：hover 出环形图，点击打开历史 */
.hmb__metric.is-clickable {
  padding: 2px 5px;
  margin: -2px -1px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.14s ease;
}

.hmb__metric.is-clickable:hover {
  background: var(--el-fill-color-light);
}

/* ===== 环形图（hover 浮层） ===== */
.hmb__ring-card {
  cursor: pointer;
  padding: 2px 0 0;
}

.hmb__ring-wrap {
  position: relative;
  width: 84px;
  height: 84px;
  margin: 0 auto 8px;
}

.hmb__ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.hmb__ring-bg {
  fill: none;
  stroke: var(--el-fill-color);
  stroke-width: 4;
}

.hmb__ring-fg {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.hmb__ring-val {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.hmb__ring-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
}

.hmb__ring-detail {
  display: block;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.hmb__ring-hint {
  display: block;
  margin-top: 7px;
  font-size: 11px;
  color: var(--el-color-primary);
  text-align: center;
}

/* ===== 实时 IO（磁盘读写 / 网络收发） ===== */
.hmb__io {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
}

.hmb__io-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11.5px;
  cursor: pointer;
  transition: background-color 0.14s ease;
}

.hmb__io-item:hover {
  background: var(--el-fill-color-light);
}

.hmb__io-ico {
  color: var(--el-text-color-placeholder);
}

.hmb__io-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.hmb__io-val {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.hmb__io-val i {
  margin-right: 2px;
  font-size: 10.5px;
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

/* ===== 窄容器降级 =====
   底部条宽度跟着工作区走，窄屏（或右侧快捷栏展开）时放不下全部项。
   满配（主机名 + 地址 + 三条指标 + 四个胶囊）实测要 830px 以上，
   所以按「重要性」从后往前撤：先撤磁盘、再撤内存，然后按从"次要"到"主要"
   的顺序撤胶囊，最后才撤地址。留下的是「这台主机是谁、在不在线」。
   阈值取实测临界值再留 20px 余量，避免刚好卡在边界上抖动。 */
/* 实时 IO 是补充信息：宽度不够时先撤它，把位置留给三条主指标 */
@container (max-width: 1060px) {
  .hmb__io {
    display: none;
  }
}

@container (max-width: 860px) {
  .hmb__metrics .hmb__metric:nth-child(3) {
    display: none;
  }
}

@container (max-width: 700px) {
  .hmb__metrics .hmb__metric:nth-child(2) {
    display: none;
  }
}

/* Agent 版本是最低频的信息，先撤 */
@container (max-width: 620px) {
  .hmb__meta .hmb__pill.is-agent,
  .hmb__meta .hmb__pill.is-mute {
    display: none;
  }
}

/* 协议与延迟都比"在线状态"次要，一起撤 */
@container (max-width: 560px) {
  .hmb__metrics {
    display: none;
  }

  .hmb__meta .hmb__pill.is-proto {
    display: none;
  }
}

@container (max-width: 420px) {
  .hmb__addr {
    display: none;
  }

  /* 地址撤掉后时间给主机名，别让名字继续被挤成一个点 */
  .hmb__name {
    flex: 1 1 auto;
  }
}

/* ===== 连接信息胶囊 ===== */
.hmb__meta {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  border-left: 1px solid var(--el-border-color-lighter);
}

.hmb__pill {
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.hmb__pill.is-ok {
  color: var(--el-color-success);
  border-color: color-mix(in srgb, var(--el-color-success) 35%, transparent);
}

/* 句柄 / iNode：常驻的容量类信息，用中性胶囊避免和在线状态抢颜色 */
.hmb__pill.is-res {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.hmb__res {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@container (max-width: 1000px) {
  .hmb__meta .hmb__pill.is-res {
    display: none;
  }
}

.hmb__pill.is-bad {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, transparent);
}

.hmb__pill.is-warn {
  color: var(--el-color-warning);
  border-color: color-mix(in srgb, var(--el-color-warning) 35%, transparent);
}

.hmb__pill.is-proto {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  background: var(--el-color-primary-light-9);
}

.hmb__pill.is-agent {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  background: var(--el-color-primary-light-9);
}

.hmb__pill.is-mute {
  color: var(--el-text-color-placeholder);
}

/* 窄屏：先隐藏协议与地址，保住指标与状态（它们才是常驻条的本职） */
@media (max-width: 1180px) {
  .hmb__addr,
  .hmb__pill.is-proto {
    display: none;
  }
}

@media (max-width: 980px) {
  .hmb__pill.is-agent,
  .hmb__pill.is-mute {
    display: none;
  }
}
</style>
