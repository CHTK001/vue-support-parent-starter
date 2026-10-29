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
                  <span>{{ r.tip }}</span>
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
.hmb {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
  min-height: 38px;
  padding: 0 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== 概要入口 ===== */
.hmb__summary {
  position: relative;
  display: inline-flex;
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
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hmb__addr {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
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
.hmb__spacer {
  flex: 1 1 auto;
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
