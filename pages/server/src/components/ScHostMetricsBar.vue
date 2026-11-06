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
  hasMetrics: false,
  handleCount: -1,
  inodePercent: -1,
  inodeUsed: -1,
  inodeTotal: -1,
  inodeMount: "",
  rows: () => [],
});

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

/** 三条指标的定义，避免模板里重复三份结构 */
const bars = computed(() => [
  { key: "cpu", label: "CPU", value: props.cpu },
  { key: "mem", label: "内存", value: props.mem },
  { key: "disk", label: "磁盘", value: props.disk },
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
            <div v-for="r in rows" :key="r.label" class="hmb__pop-row">
              <span class="hmb__pop-label">{{ r.label }}</span>
              <span class="hmb__pop-val" :class="{ 'is-multiline': r.value.includes('\n'), 'is-mono': r.mono, 'is-dim': r.value === '—' }">{{ r.value }}</span>
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
                  <p v-for="it in r.tip.split(',')">
                    {{it}}
                  </p>
                </div>
              </el-popover>
            </div>
          </div>
          <div v-else class="hmb__pop-empty">暂无概要数据（等待采集通道返回）</div>
        </div>
      </transition>
    </div>

    <div class="hmb__spacer" />

    <!-- 常驻指标：CPU / 内存 / 磁盘 -->
    <div class="hmb__metrics">
      <div v-for="b in bars" :key="b.key" class="hmb__metric" :title="`${b.label} 使用率`">
        <span class="hmb__metric-label">{{ b.label }}</span>
        <span class="hmb__track">
          <i :style="{ width: Math.max(0, Math.min(100, b.value)) + '%', background: barColor(b.value) }" />
        </span>
        <span class="hmb__metric-val" :class="{ 'is-dim': !hasMetrics }">
          {{ hasMetrics ? pctText(b.value) : '—' }}
        </span>
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

/* ===== 窄容器降级 =====
   底部条宽度跟着工作区走，窄屏（或右侧快捷栏展开）时放不下全部项。
   满配（主机名 + 地址 + 三条指标 + 四个胶囊）实测要 830px 以上，
   所以按「重要性」从后往前撤：先撤磁盘、再撤内存，然后按从"次要"到"主要"
   的顺序撤胶囊，最后才撤地址。留下的是「这台主机是谁、在不在线」。
   阈值取实测临界值再留 20px 余量，避免刚好卡在边界上抖动。 */
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
