<script setup lang="ts">
/**
 * 复制表「任务坞」。
 *
 * <p><b>为什么不是弹窗</b>：复制一张表要跑几秒到几十秒，用户这时会去点别的库、看别的表。
 * 弹窗把整页挡住、且不可关闭，等于逼人盯着；关掉又再也看不到结果。这里改成右下角常驻的坞：
 * 最小化后只剩一条 30px 高的胶囊，进度、结果、失败原因都留在里面，随时能展开。</p>
 *
 * <p><b>为什么带「最近任务」</b>：后端本来就有 {@code /ms/monitor/db/copy/tasks}，任务结束后
 * 结论只活在一个 2 秒的 toast 里。坞里列最近 5 条，失败的那条能直接重试，不用重走
 * 「右键 → 复制 → 找目标库 → 粘贴」。</p>
 *
 * <p><b>数据仍然是快照</b>：组件只读 {@code snapshot}，不请求、不改写；取消/重试/定位
 * 都以事件抛给业务侧，避免这里出现第二套任务状态。</p>
 */
import { computed, ref, watch } from "vue";
import type { ProgressSnapshot, ProgressStep } from "@repo/ui/re-progress-dialog";
import type { CopyHistoryItem } from "./copyDockTypes";

/** 最近任务（后端快照里坞里用得到的字段） */

const props = withDefaults(
  defineProps<{
    /** 坞是否展开 */
    open: boolean;
    /** 当前任务快照 */
    snapshot?: ProgressSnapshot | null;
    /** 首帧到达前先铺出来的步骤 */
    steps?: ProgressStep[];
    /** 是否允许取消 */
    cancellable?: boolean;
    /** 取消请求进行中 */
    cancelling?: boolean;
    /** 坞标题 */
    title?: string;
    /** 副标题（源 → 目标） */
    subtitle?: string;
    /** 最近任务 */
    history?: CopyHistoryItem[];
  }>(),
  {
    snapshot: null,
    steps: () => [],
    cancellable: false,
    cancelling: false,
    title: "复制表",
    subtitle: "",
    history: () => [],
  },
);

const emit = defineEmits<{
  /** 取消当前任务 */
  (e: "cancel"): void;
  /** 收起（不丢状态，只留胶囊） */
  (e: "hide"): void;
  /** 从胶囊展开 */
  (e: "reopen"): void;
  /** 重试最近一次提交 */
  (e: "retry"): void;
  /** 定位到目标表 */
  (e: "locate"): void;
}>();

/** 折叠状态（只影响坞本体，不影响胶囊） */
const collapsed = ref(false);

/** 展开时回到展开态：用户点了胶囊就是想看内容 */
watch(
  () => props.open,
  visible => {
    if (visible) collapsed.value = false;
  },
);

/** 快照状态（首帧前按进行中处理） */
const status = computed(() => props.snapshot?.status || "RUNNING");

/** 是否已结束 */
const finished = computed(() => props.snapshot?.finished === true || status.value !== "RUNNING");

/** 百分比：夹到 0-100 并取整，避免后端算出 101 让进度条溢出 */
const percentage = computed(() => {
  const raw = props.snapshot?.percentage;
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
});

/** el-progress 的状态色：成功绿 / 失败红 / 取消黄 / 进行中主色 */
const progressStatus = computed<"" | "success" | "warning" | "exception">(() => {
  switch (status.value) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "exception";
    case "CANCELLED":
    case "UNKNOWN":
      return "warning";
    default:
      return "";
  }
});

/** 状态中文标签 */
const statusLabel = computed(() => statusText(status.value));

/** 生效步骤：优先快照（带状态），否则用静态定义先铺出来 */
const effectiveSteps = computed<ProgressStep[]>(() => {
  const fromSnapshot = props.snapshot?.steps;
  return fromSnapshot && fromSnapshot.length ? fromSnapshot : props.steps;
});

/** 当前在做什么（进度条下面那一行） */
const currentLine = computed(() => {
  const text = props.snapshot?.currentDescription || props.snapshot?.currentTitle || "";
  if (text) return text;
  return finished.value ? "" : "正在启动…";
});

/** 已完成的步骤数，用于「2 / 3」 */
const doneSteps = computed(
  () => effectiveSteps.value.filter(s => s.status === "SUCCESS" || s.status === "SKIPPED").length,
);

/** 是否可取消：后端声明 + 仍在跑 */
const canCancel = computed(
  () => props.cancellable && props.snapshot?.cancellable !== false && !finished.value,
);

/** 最近任务里挑掉当前这一条，避免同一任务在坞里出现两次 */
const recent = computed(() =>
  (props.history ?? []).filter(item => item.taskId !== props.snapshot?.taskId).slice(0, 5),
);

/** 胶囊上是否显示（有任务或有历史才出现） */
const pillVisible = computed(() => !props.open && (Boolean(props.snapshot) || (props.history?.length ?? 0) > 0));

/** 状态文案 */
function statusText(value: string): string {
  switch (value) {
    case "SUCCESS":
      return "成功";
    case "FAILED":
      return "失败";
    case "CANCELLED":
      return "已取消";
    case "UNKNOWN":
      return "状态未知";
    default:
      return "进行中";
  }
}

/** 状态色调（tag / 圆点共用） */
function toneOf(value: string): "ok" | "bad" | "warn" | "run" {
  switch (value) {
    case "SUCCESS":
      return "ok";
    case "FAILED":
      return "bad";
    case "CANCELLED":
    case "UNKNOWN":
      return "warn";
    default:
      return "run";
  }
}

/** 步骤圆点字符：用字符而不是图标，宿主没注册对应 icon 时也不会空白 */
function stepMark(stepStatus?: string): string {
  switch (stepStatus) {
    case "SUCCESS":
      return "✓";
    case "SKIPPED":
      return "⤼";
    case "ERROR":
    case "FAILED":
      return "✕";
    case "CANCELLED":
      return "⊘";
    case "RUNNING":
      return "◌";
    default:
      return "·";
  }
}

/** 步骤状态中文标签（后端没给 statusLabel 时的兜底） */
function stepStateLabel(value?: string): string {
  switch (value) {
    case "SUCCESS":
      return "已完成";
    case "SKIPPED":
      return "已跳过";
    case "ERROR":
    case "FAILED":
      return "失败";
    case "CANCELLED":
      return "已取消";
    case "RUNNING":
      return "进行中";
    default:
      return "待执行";
  }
}

/** 点取消 */
function onCancel(): void {
  if (!canCancel.value || props.cancelling) return;
  emit("cancel");
}
</script>

<template>
  <!-- 收起态：只留一条胶囊，点一下回来 -->
  <div
    v-if="pillVisible"
    class="dbm-dock-pill"
    data-role="copy-dock-pill"
    :data-status="status"
    @click="emit('reopen')"
  >
    <span class="dbm-dock-pill__dot" :data-tone="toneOf(status)" />
    <span class="dbm-dock-pill__text">{{ finished ? "复制任务" : "正在复制" }}</span>
    <span class="dbm-dock-pill__tag" :data-tone="toneOf(status)">{{ statusLabel }}</span>
    <span class="dbm-dock-pill__pct" v-if="!finished">{{ percentage }}%</span>
    <span class="dbm-dock-pill__caret">▴</span>
  </div>

  <!-- 展开态 -->
  <section
    v-else-if="open"
    class="dbm-dock"
    data-role="copy-dock"
    :data-status="status"
    :data-percent="percentage"
    :data-finished="finished ? '1' : '0'"
  >
    <header class="dbm-dock__head" @click="collapsed = !collapsed">
      <span class="dbm-dock__icon" :data-tone="toneOf(status)" />
      <span class="dbm-dock__title">{{ title }}</span>
      <span class="dbm-dock__tag" :data-tone="toneOf(status)">{{ statusLabel }}</span>
      <span class="dbm-dock__spacer" />
      <span class="dbm-dock__caret">{{ collapsed ? "▾" : "▴" }}</span>
      <button
        type="button"
        class="dbm-dock__x"
        title="收起（任务继续跑）"
        data-role="copy-dock-hide"
        @click.stop="emit('hide')"
      >
        ✕
      </button>
    </header>

    <div v-show="!collapsed" class="dbm-dock__body">
      <div v-if="subtitle" class="dbm-dock__sub mono" :title="subtitle">{{ subtitle }}</div>

      <el-progress
        :percentage="percentage"
        :status="progressStatus || undefined"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="dbm-dock__meta">
        <span class="dbm-dock__current">{{ currentLine }}</span>
        <span class="dbm-dock__count" v-if="effectiveSteps.length">
          {{ doneSteps }} / {{ effectiveSteps.length }}
        </span>
      </div>

      <ol v-if="effectiveSteps.length" class="dbm-dock__steps">
        <li
          v-for="step in effectiveSteps"
          :key="step.key"
          class="dbm-dock__step"
          :data-step-key="step.key"
          :data-step-status="step.status || 'WAIT'"
        >
          <span class="dbm-dock__dot" :data-state="step.status || 'WAIT'">{{ stepMark(step.status) }}</span>
          <span class="dbm-dock__step-title">{{ step.title }}</span>
          <span class="dbm-dock__step-state">{{ step.statusLabel || stepStateLabel(step.status) }}</span>
          <span v-if="step.detail" class="dbm-dock__step-detail">{{ step.detail }}</span>
        </li>
      </ol>

      <div v-if="snapshot?.message" class="dbm-dock__message" :data-tone="toneOf(status)">
        {{ snapshot.message }}
      </div>

      <div class="dbm-dock__actions">
        <el-button
          v-if="canCancel"
          type="danger"
          plain
          size="small"
          data-action="copy-dock-cancel"
          :loading="cancelling"
          @click="onCancel"
        >
          取消复制
        </el-button>
        <el-button
          v-if="finished && status === 'SUCCESS'"
          type="primary"
          size="small"
          plain
          data-action="copy-dock-locate"
          @click="emit('locate')"
        >
          定位目标表
        </el-button>
        <el-button
          v-if="finished && status !== 'SUCCESS'"
          type="primary"
          size="small"
          data-action="copy-dock-retry"
          @click="emit('retry')"
        >
          重试
        </el-button>
      </div>

      <div v-if="recent.length" class="dbm-dock__hist">
        <div class="dbm-dock__hist-title">最近任务</div>
        <div
          v-for="item in recent"
          :key="item.taskId"
          class="dbm-dock__hist-row"
          :data-tone="toneOf(item.status)"
        >
          <span class="dbm-dock__tag" :data-tone="toneOf(item.status)">{{ statusText(item.status) }}</span>
          <span class="dbm-dock__hist-text mono" :title="item.subtitle || item.message || item.taskId">
            {{ item.subtitle || item.message || item.taskId }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}

/* ---- 坞本体 ---- */
.dbm-dock {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2100;
  width: 340px;
  max-width: calc(100vw - 36px);
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(15, 17, 23, 0.14);
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
}

.dbm-dock__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  user-select: none;
}

.dbm-dock__icon {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
  background: var(--el-color-primary);

  &[data-tone="ok"] {
    background: var(--el-color-success);
  }

  &[data-tone="bad"] {
    background: var(--el-color-danger);
  }

  &[data-tone="warn"] {
    background: var(--el-color-warning);
  }

  &[data-tone="run"] {
    animation: dbm-dock-pulse 1.2s ease-in-out infinite;
  }
}

@keyframes dbm-dock-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.dbm-dock__title {
  font-size: 13px;
  font-weight: 600;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dbm-dock__spacer {
  flex: 1;
}

.dbm-dock__caret {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.dbm-dock__x {
  border: 0;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 2px 2px;

  &:hover {
    color: var(--el-text-color-regular);
  }
}

.dbm-dock__body {
  padding: 10px 12px 12px;
}

.dbm-dock__sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dbm-dock__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dbm-dock__current {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dbm-dock__count {
  flex: none;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
}

/* ---- 步骤 ---- */
.dbm-dock__steps {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 132px;
  overflow-y: auto;
}

.dbm-dock__step {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 3px 4px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);

  &[data-step-status="RUNNING"] {
    background: var(--el-color-primary-light-9);
  }
}

.dbm-dock__dot {
  flex: none;
  width: 15px;
  height: 15px;
  line-height: 13px;
  text-align: center;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-placeholder);
  font-size: 10px;

  &[data-state="SUCCESS"] {
    border-color: var(--el-color-success);
    background: var(--el-color-success);
    color: #fff;
  }

  &[data-state="ERROR"],
  &[data-state="FAILED"] {
    border-color: var(--el-color-danger);
    background: var(--el-color-danger);
    color: #fff;
  }

  &[data-state="CANCELLED"] {
    border-color: var(--el-color-warning);
    color: var(--el-color-warning);
  }

  &[data-state="RUNNING"] {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    animation: dbm-dock-pulse 1.2s ease-in-out infinite;
  }
}

.dbm-dock__step-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dbm-dock__step-state {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.dbm-dock__step-detail {
  flex-basis: 100%;
  padding-left: 21px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

/* ---- 结论与动作 ---- */
.dbm-dock__message {
  margin-top: 8px;
  padding: 7px 9px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.55;
  word-break: break-word;
  background: var(--el-color-primary-light-9);

  &[data-tone="ok"] {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success-dark-2, #4e9a2f);
  }

  &[data-tone="bad"] {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }

  &[data-tone="warn"] {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning-dark-2, #8a5a12);
  }
}

.dbm-dock__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;

  :deep(.el-button) {
    flex: 1;
    margin-left: 0;
  }
}

/* ---- 最近任务 ---- */
.dbm-dock__hist {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.dbm-dock__hist-title {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 4px;
}

.dbm-dock__hist-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 11px;
}

.dbm-dock__hist-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

/* ---- 状态标签 ---- */
.dbm-dock__tag,
.dbm-dock-pill__tag {
  flex: none;
  height: 17px;
  padding: 0 6px;
  border-radius: 9px;
  font-size: 10px;
  line-height: 17px;
  white-space: nowrap;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);

  &[data-tone="ok"] {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success-dark-2, #4e9a2f);
  }

  &[data-tone="bad"] {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }

  &[data-tone="warn"] {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning-dark-2, #8a5a12);
  }
}

/* ---- 胶囊（收起态） ---- */
.dbm-dock-pill {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2100;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 6px 18px rgba(15, 17, 23, 0.14);
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-primary);
  transition: box-shadow 0.16s ease-out, transform 0.16s ease-out;

  &:hover {
    box-shadow: 0 8px 22px rgba(15, 17, 23, 0.18);
    transform: translateY(-1px);
  }
}

.dbm-dock-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-primary);

  &[data-tone="ok"] {
    background: var(--el-color-success);
  }

  &[data-tone="bad"] {
    background: var(--el-color-danger);
  }

  &[data-tone="warn"] {
    background: var(--el-color-warning);
  }

  &[data-tone="run"] {
    animation: dbm-dock-pulse 1.2s ease-in-out infinite;
  }
}

.dbm-dock-pill__pct {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dbm-dock-pill__caret {
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .dbm-dock__icon[data-tone="run"],
  .dbm-dock__dot[data-state="RUNNING"],
  .dbm-dock-pill__dot[data-tone="run"] {
    animation: none;
  }

  .dbm-dock-pill {
    transition: none;
  }
}
</style>
