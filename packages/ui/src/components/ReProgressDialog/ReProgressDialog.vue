<script setup lang="ts">
/**
 * ReProgressDialog —— 「安装向导」式的长任务进度弹窗
 *
 * <p><b>为什么单独做一个组件</b>：现有的 {@code ReProcessTask} 是右下角浮层（可最小化、
 * 可拖拽），{@code ReProgressPanel} 是内嵌面板；两者都不适合「点一下新建租户，
 * 必须盯着它跑完」的场景 —— 那个场景要的是一块挡住页面的遮罩、
 * 一条大进度条、进度条下面那句「现在正在干什么」，以及能展开看全部步骤的详情。</p>
 *
 * <p><b>交互约定（按需求固定，不要在业务侧绕过）</b>：</p>
 * <ul>
 *   <li><b>不可关闭</b>：没有右上角关闭、点遮罩不关、Esc 不关。任务跑到一半消失，
 *       用户既不知道结果也没法重来；要退出只能走「取消」。</li>
 *   <li><b>取消按钮由接口决定</b>：{@code cancellable} 为假（后端没提供取消接口）时
 *       根本不渲染按钮 —— 点了没反应的按钮比没有按钮更糟。</li>
 *   <li><b>结束后才出现「关闭」</b>：跑完了总要能关掉，否则弹窗永远留在屏幕上。</li>
 * </ul>
 *
 * <p><b>数据是快照不是命令</b>：组件只读 {@code snapshot}（套接字推送的最新一份或
 * 轮询拿到的快照），自己不请求、不改写。{@code steps} 用于「第一条推送还没到」时
 * 先把步骤清单铺出来，让人一眼看到总共要做几件事。</p>
 *
 * @example
 * <ReProgressDialog
 *   v-model="visible"
 *   :snapshot="snapshot"
 *   :steps="stepDefs"
 *   :cancellable="cancellable"
 *   :cancel-loading="cancelling"
 *   @cancel="onCancel"
 *   @close="onClose"
 * />
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, ref, watch } from "vue";
import type { ProgressSnapshot, ProgressStep } from "./types";

/**
 * 单步骤 / 任务快照的字段定义见 ./types.ts
 */

const props = withDefaults(
  defineProps<{
    /** 是否显示（由业务侧控制，组件不会自己关） */
    modelValue: boolean;
    /** 标题 */
    title?: string;
    /** 副标题（例如「租户 yunwei / 账号 yunwei」） */
    subtitle?: string;
    /** 最新快照 */
    snapshot?: ProgressSnapshot | null;
    /** 步骤清单（快照里还没有 steps 时用它先铺出来） */
    steps?: ProgressStep[];
    /** 是否允许取消（必须由接口声明，默认不允许） */
    cancellable?: boolean;
    /** 取消请求进行中 */
    cancelLoading?: boolean;
    /** 启动失败/请求异常时的提示（此时没有任何进度可展示） */
    errorMessage?: string;
    /** 取消按钮文案（不同长任务叫法不同：取消创建 / 取消复制 / 取消迁移） */
    cancelText?: string;
    /** 关闭按钮文案 */
    closeText?: string;
  }>(),
  {
    title: "正在执行",
    subtitle: "",
    snapshot: null,
    steps: () => [],
    cancellable: false,
    cancelLoading: false,
    errorMessage: "",
    cancelText: "取消创建",
    closeText: "关闭",
  },
);

const emit = defineEmits<{
  /** 用户点「取消」 */
  (e: "cancel"): void;
  /** 用户点「关闭」（仅结束后可用） */
  (e: "close"): void;
  /** 显隐同步（永远只会收到 false，且只在结束后） */
  (e: "update:modelValue", value: boolean): void;
}>();

/** 详情是否展开（默认收起，避免一上来就是一屏日志） */
const detailsExpanded = ref(false);

/** 弹窗关闭后复位展开状态，下次打开回到收起 */
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      detailsExpanded.value = false;
    }
  },
);

/** 生效的步骤清单：优先快照里的（带状态），否则用外部给的静态定义 */
const effectiveSteps = computed<ProgressStep[]>(() => {
  const fromSnapshot = props.snapshot?.steps;
  if (fromSnapshot && fromSnapshot.length > 0) {
    return fromSnapshot;
  }
  return props.steps ?? [];
});

/** 生效的百分比：取整并夹到 0-100，避免后端算出 101 让进度条溢出 */
const percentage = computed(() => {
  const raw = props.snapshot?.percentage;
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(raw)));
});

/** 任务状态（RUNNING 为兜底：还没收到第一条推送时就是「进行中」） */
const taskStatus = computed(() => props.snapshot?.status || "RUNNING");

/** 是否已结束 */
const finished = computed(
  () => props.snapshot?.finished === true || taskStatus.value !== "RUNNING",
);

/** 是否允许取消：后端声明 + 任务仍在跑 + 不是「启动就失败」的兜底态 */
const canCancel = computed(
  () => props.cancellable && props.snapshot?.cancellable !== false && !finished.value,
);

/** 进度条配色：失败红、取消灰、成功绿、进行中主色 */
const progressStatus = computed<"" | "success" | "warning" | "exception">(() => {
  switch (taskStatus.value) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "exception";
    case "CANCELLED":
      return "warning";
    case "UNKNOWN":
      return "warning";
    default:
      return "";
  }
});

/** 任务状态中文标签 */
const statusLabel = computed(() => {
  switch (taskStatus.value) {
    case "SUCCESS":
      return "已完成";
    case "FAILED":
      return "失败";
    case "CANCELLED":
      return "已取消";
    case "UNKNOWN":
      return "状态未知";
    default:
      return "进行中";
  }
});

/** 副标题：优先外部传入，其次用快照里的租户名/账号拼 */
const effectiveSubtitle = computed(() => {
  if (props.subtitle) {
    return props.subtitle;
  }
  const name = props.snapshot?.tenantName;
  const username = props.snapshot?.tenantUsername;
  if (name && username) {
    return `租户「${name}」· 账号 ${username}`;
  }
  return name ? `租户「${name}」` : "";
});

/** 进度条下方那一行「现在正在干什么」 */
const currentLine = computed(() => {
  const description = props.snapshot?.currentDescription;
  if (description) {
    return description;
  }
  const title = props.snapshot?.currentTitle;
  if (title) {
    return title;
  }
  return props.errorMessage ? "尚未开始" : "正在启动…";
});

/** 全部描述流水（展开详情时逐行显示） */
const detailLines = computed<string[]>(() => props.snapshot?.details ?? []);

/** 步骤图标：用字符而不是图标组件，避免宿主没注册对应 icon 时空白 */
function stepIcon(status?: string): string {
  switch (status) {
    case "SUCCESS":
      return "✓";
    case "SKIPPED":
      return "⤼";
    case "ERROR":
      return "✕";
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

/** 步骤状态中文标签（后端没给时兜底） */
function stepStatusLabel(status?: string): string {
  switch (status) {
    case "SUCCESS":
      return "已完成";
    case "SKIPPED":
      return "已跳过";
    case "ERROR":
      return "失败";
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

/** el-dialog 的显隐只单向受控：用户任何关闭动作都不emit，避免中途被关掉 */
function handleDialogVisible(): void {
  // 故意留空：不可关闭的弹窗不接受来自遮罩/ESC 的关闭请求
}

/** 点「取消」 */
function handleCancel(): void {
  if (!canCancel.value || props.cancelLoading) {
    return;
  }
  emit("cancel");
}

/** 点「关闭」（仅结束后） */
function handleClose(): void {
  if (!finished.value) {
    return;
  }
  emit("close");
  emit("update:modelValue", false);
}

/** 展开/收起详情 */
function toggleDetails(): void {
  detailsExpanded.value = !detailsExpanded.value;
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="640px"
    align-center
    class="re-progress-dialog"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :destroy-on-close="false"
    append-to-body
    @update:model-value="handleDialogVisible"
  >
    <div
      class="rpd"
      data-page="provision-progress"
      :data-status="taskStatus"
      :data-percent="percentage"
      :data-finished="finished ? '1' : '0'"
    >
      <!-- 副标题：这次到底在处理谁 -->
      <div v-if="effectiveSubtitle" class="rpd__subject" data-role="provision-subject">
        {{ effectiveSubtitle }}
      </div>

      <!-- 启动就失败（连任务都没起来）：只给原因，不假装有进度 -->
      <div v-if="errorMessage" class="rpd__error" data-role="provision-error">
        <span class="rpd__error-icon">!</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- 进度条：中间的大进度 -->
      <div class="rpd__progress">
        <el-progress
          :percentage="percentage"
          :status="progressStatus || undefined"
          :stroke-width="14"
          :text-inside="true"
        />
        <div class="rpd__progress-meta">
          <span class="rpd__status" :data-state="taskStatus">{{ statusLabel }}</span>
          <span class="rpd__counter">
            步骤 {{ effectiveSteps.filter((s) => s.status === "SUCCESS" || s.status === "SKIPPED").length }}
            / {{ effectiveSteps.length }}
          </span>
        </div>
      </div>

      <!-- 进度条下方：当前这一步在做什么 -->
      <div class="rpd__current" data-role="provision-current">
        <span class="rpd__current-title">{{ snapshot?.currentTitle || title }}</span>
        <span class="rpd__current-desc" data-role="provision-current-desc">{{ currentLine }}</span>
      </div>

      <!-- 结论（成功/失败/取消的原因） -->
      <div
        v-if="snapshot?.message"
        class="rpd__message"
        :data-tone="taskStatus"
        data-role="provision-message"
      >
        {{ snapshot.message }}
      </div>

      <!-- 步骤清单：安装向导式，一眼看到几步、走到第几步 -->
      <ol v-if="effectiveSteps.length" class="rpd__steps" data-role="provision-steps">
        <li
          v-for="step in effectiveSteps"
          :key="step.key"
          class="rpd__step"
          :data-step-key="step.key"
          :data-step-status="step.status || 'WAIT'"
        >
          <span class="rpd__step-dot" :data-state="step.status || 'WAIT'">
            {{ stepIcon(step.status) }}
          </span>
          <span class="rpd__step-body">
            <span class="rpd__step-title">{{ step.title }}</span>
            <span class="rpd__step-state">{{ step.statusLabel || stepStatusLabel(step.status) }}</span>
            <span v-if="step.detail" class="rpd__step-detail">{{ step.detail }}</span>
          </span>
        </li>
      </ol>

      <!-- 展开详情：全部描述（含每一步的说明与结果），按时间顺序 -->
      <div class="rpd__details-toggle">
        <button
          type="button"
          class="rpd__link"
          data-action="provision-toggle-details"
          :aria-expanded="detailsExpanded"
          @click="toggleDetails"
        >
          {{ detailsExpanded ? "收起详情" : "展开详情" }}
          <span class="rpd__link-count">({{ detailLines.length }})</span>
        </button>
      </div>

      <div
        v-if="detailsExpanded"
        class="rpd__details"
        data-role="provision-details"
      >
        <div v-if="!detailLines.length" class="rpd__details-empty">暂无描述</div>
        <div
          v-for="(line, index) in detailLines"
          :key="index"
          class="rpd__detail-line"
          data-role="provision-detail-line"
        >
          {{ line }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="rpd__footer">
        <el-button
          v-if="canCancel"
          type="danger"
          plain
          data-action="provision-cancel"
          :loading="cancelLoading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </el-button>
        <el-button
          v-if="finished"
          type="primary"
          data-action="provision-close"
          @click="handleClose"
        >
          {{ closeText }}
        </el-button>
        <span v-if="!canCancel && !finished" class="rpd__footer-hint">
          任务执行中，完成后可关闭
        </span>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.rpd {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rpd__subject {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.rpd__error {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.rpd__error-icon {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.rpd__progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rpd__status[data-state="SUCCESS"] {
  color: var(--el-color-success);
}

.rpd__status[data-state="FAILED"] {
  color: var(--el-color-danger);
}

.rpd__status[data-state="CANCELLED"] {
  color: var(--el-color-warning);
}

.rpd__current {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.rpd__current-title {
  font-size: 13px;
  font-weight: 600;
}

.rpd__current-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.rpd__message {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

.rpd__message[data-tone="SUCCESS"] {
  background: var(--el-color-success-light-9);
}

.rpd__message[data-tone="FAILED"] {
  background: var(--el-color-danger-light-9);
}

.rpd__message[data-tone="CANCELLED"] {
  background: var(--el-color-warning-light-9);
}

.rpd__steps {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
}

.rpd__step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 6px 4px;
  border-radius: 6px;
}

.rpd__step[data-step-status="RUNNING"] {
  background: var(--el-color-primary-light-9);
}

.rpd__step-dot {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.rpd__step-dot[data-state="SUCCESS"] {
  border-color: var(--el-color-success);
  background: var(--el-color-success);
  color: #fff;
}

.rpd__step-dot[data-state="SKIPPED"] {
  border-color: var(--el-color-info);
  background: var(--el-color-info-light-8);
  color: var(--el-color-info);
}

.rpd__step-dot[data-state="ERROR"],
.rpd__step-dot[data-state="FAILED"] {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger);
  color: #fff;
}

.rpd__step-dot[data-state="CANCELLED"] {
  border-color: var(--el-color-warning);
  color: var(--el-color-warning);
}

.rpd__step-dot[data-state="RUNNING"] {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  animation: rpd-pulse 1.2s ease-in-out infinite;
}

@keyframes rpd-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.rpd__step-body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.6;
}

.rpd__step-title {
  color: var(--el-text-color-primary);
}

.rpd__step-state {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rpd__step-detail {
  flex-basis: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.rpd__details-toggle {
  display: flex;
  justify-content: flex-start;
}

.rpd__link {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-color-primary);
}

.rpd__link-count {
  color: var(--el-text-color-secondary);
}

.rpd__details {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.rpd__detail-line {
  white-space: pre-wrap;
  word-break: break-word;
}

.rpd__details-empty {
  color: var(--el-text-color-placeholder);
}

.rpd__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.rpd__footer-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .rpd__step-dot[data-state="RUNNING"] {
    animation: none;
  }
}
</style>
