<template>
  <div class="plan-approval" :class="toneClass" role="group">
    <!-- 头部 -->
    <div
      class="plan-approval__header"
      :class="`plan-approval__header--${status}`"
    >
      <el-icon size="16" class="plan-approval__header-icon">
        <Check v-if="status === 'approved'" />
        <Close v-else-if="status === 'rejected'" />
        <component :is="pendingIcon" v-else />
      </el-icon>
      <span class="plan-approval__title">{{ headerText }}</span>
      <!-- 风险徽标：仅当后端给出风险等级时显示（计划确认无风险信息则不显示） -->
      <span v-if="maxRisk" class="plan-approval__risk-badge" :class="`plan-approval__risk-badge--${maxRisk}`">
        {{ riskBadgeText }}
      </span>
    </div>

    <!-- 内容摘要 -->
    <div class="plan-approval__body">
      <template v-for="(item, i) in planItems" :key="i">
        <div class="plan-approval__item-head">
          <span v-if="riskOf(item)" class="plan-approval__risk-dot" :class="`plan-approval__risk-dot--${riskOf(item)}`" />
          <div v-if="item.title" class="plan-approval__item-title">{{ item.title }}</div>
        </div>
        <div v-if="item.description" class="plan-approval__item-desc">
          {{ item.description }}
        </div>
      </template>
      <div v-if="!planItems.length" class="plan-approval__empty">
        模型已完成规划，确认后将进入执行阶段。
      </div>
    </div>

    <!-- 操作按钮（仅待确认时显示） -->
    <div v-if="status === 'pending'" class="plan-approval__footer">
      <!-- 修改意见输入态 -->
      <div v-if="showFeedback" class="plan-approval__feedback">
        <el-input
          v-model="feedbackText"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="请描述需要如何修改计划，模型将据此重新规划…"
        />
        <div class="plan-approval__feedback-actions">
          <el-button
            type="primary"

            :disabled="decided"
            :loading="decided && !confirmed"
            @click="submitFeedback"
          >
            提交修改
          </el-button>
          <el-button :disabled="decided" @click="cancelFeedback">
            取消
          </el-button>
        </div>
      </div>

      <!-- 常规操作 -->
      <template v-else>
        <!-- 危险操作强确认提示条：第一次点击批准按钮后出现，要求再点一次 -->
        <div v-if="armed" class="plan-approval__arm-warning">
          <el-icon size="14"><WarningFilled /></el-icon>
          <span>破坏性操作：请再次点击确认后才会执行。</span>
          <el-button link size="small" @click="disarm">取消</el-button>
        </div>
        <div class="plan-approval__actions">
          <el-button
            :type="armed ? 'danger' : 'primary'"

            :disabled="decided"
            :loading="decided && confirmed"
            @click="approve('once')"
          >
            <el-icon v-if="!(decided && confirmed)" class="plan-approval__btn-icon">
              <Check />
            </el-icon>
            <span>{{ armed ? '再次点击确认执行' : '批准并执行' }}</span>
          </el-button>
          <el-button

            :type="armed ? 'danger' : 'default'"
            :disabled="decided"
            :title="alwaysTip"
            @click="approve('always')"
          >
            <el-icon v-if="!decided" class="plan-approval__btn-icon">
              <Select />
            </el-icon>
            <span>{{ armed ? '再次点击并记住选择' : '全部同意' }}</span>
          </el-button>
          <el-button

            :disabled="decided"
            @click="startFeedback"
          >
            <el-icon class="plan-approval__btn-icon">
              <Edit />
            </el-icon>
            <span>需要修改</span>
          </el-button>
        </div>
      </template>
    </div>

    <!-- 已决态提示 -->
    <div v-else class="plan-approval__footer plan-approval__footer--resolved">
      <span>{{
        status === "approved" ? "已批准，正在执行计划…" : "已拒绝，请继续修订计划"
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElIcon, ElInput } from "element-plus";
import { Document, Check, Edit, Close, WarningFilled, InfoFilled, CircleCheckFilled, Select } from "@element-plus/icons-vue";

interface PlanItem {
  toolCallId: string;
  toolName?: string;
  title?: string;
  description?: string;
  /** 风险等级（low/medium/high/dangerous）：由后端 ToolRiskPolicy 分级，旧事件可能缺失 */
  riskLevel?: string;
}

const props = defineProps<{
  request: {
    replyId: string;
    items: PlanItem[];
    status?: "pending" | "approved" | "rejected";
  };
}>();

const emit = defineEmits<{
  (
    e: "decision",
    payload: { replyId: string; confirmed: boolean; mode?: "once" | "always"; feedback?: string }
  ): void;
}>();

const decided = ref(false);
const confirmed = ref(false);
const showFeedback = ref(false);
const feedbackText = ref("");
/** 危险操作强确认：第一次点击只「武装」，再次点击才真正批准 */
const armed = ref(false);

const planItems = computed<PlanItem[]>(() => props.request.items || []);

// ── 风险分级 ──
const RISK_ORDER = ["low", "medium", "high", "dangerous"] as const;

/** 取单项风险等级（未知/缺失返回 null，按无风险信息处理） */
function riskOf(item: PlanItem | undefined): string | null {
  const level = item?.riskLevel;
  return level && (RISK_ORDER as readonly string[]).includes(level) ? level : null;
}

/** 卡片整体风险 = 各项中最高一级；全部缺失（如纯计划确认）返回 null */
const maxRisk = computed<string | null>(() => {
  let best: string | null = null;
  for (const item of planItems.value) {
    const level = riskOf(item);
    if (level && (!best || RISK_ORDER.indexOf(level as any) > RISK_ORDER.indexOf(best as any))) {
      best = level;
    }
  }
  return best;
});

/** 是否危险级（需要强确认） */
const isDangerous = computed(() => maxRisk.value === "dangerous");

/** 主题类：无风险信息走原计划卡样式，有风险按最高风险着色 */
const toneClass = computed(() =>
  maxRisk.value ? `plan-approval--${maxRisk.value}` : "plan-approval--plan",
);

/** 待确认态头部图标：按风险换图标 */
const pendingIcon = computed(() => {
  switch (maxRisk.value) {
    case "low":
      return CircleCheckFilled;
    case "high":
    case "dangerous":
      return WarningFilled;
    case "medium":
      return InfoFilled;
    default:
      return Document;
  }
});

const RISK_BADGE_TEXT: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  dangerous: "危险操作",
};

const riskBadgeText = computed(() => (maxRisk.value && RISK_BADGE_TEXT[maxRisk.value]) || "");

const alwaysTip = "记住该工具的选择，后续同类操作不再询问";

const headerText = computed(() => {
  if (status.value === "approved") {
    return maxRisk.value ? "权限已批准" : "计划已批准";
  }
  if (status.value === "rejected") {
    return maxRisk.value ? "权限已拒绝" : "计划已拒绝";
  }
  return maxRisk.value ? "工具执行等待确认" : "计划已就绪，等待确认";
});

/** 终态优先取持久化 status（reload 后），否则取本地点击态 */
const status = computed<"pending" | "approved" | "rejected">(() => {
  if (props.request.status === "approved" || props.request.status === "rejected") {
    return props.request.status;
  }
  if (decided.value) {
    return confirmed.value ? "approved" : "rejected";
  }
  return "pending";
});

/**
 * 批准（once=单次放行 / always=记住该工具）。
 *
 * 危险操作走强确认：第一次点击只进入「武装」态（按钮变红、出现警示条），
 * 再次点击才真正发出批准决策；普通风险一次点击即批准。
 */
function approve(mode: "once" | "always") {
  if (decided.value) return;
  if (isDangerous.value && !armed.value) {
    armed.value = true;
    return;
  }
  decided.value = true;
  confirmed.value = true;
  emit("decision", {
    replyId: props.request.replyId,
    confirmed: true,
    mode,
  });
}

/** 解除强确认武装（点击「取消」或转向修改意见时） */
function disarm() {
  armed.value = false;
}

function startFeedback() {
  if (decided.value) return;
  armed.value = false;
  showFeedback.value = true;
}

function cancelFeedback() {
  if (decided.value) return;
  showFeedback.value = false;
  feedbackText.value = "";
}

function submitFeedback() {
  if (decided.value) return;
  decided.value = true;
  confirmed.value = false;
  const feedback = feedbackText.value.trim();
  emit("decision", {
    replyId: props.request.replyId,
    confirmed: false,
    feedback: feedback || undefined,
  });
}
</script>

<style scoped>
.plan-approval {
  margin: 10px 0 4px;
  border: 1px solid var(--el-border-color);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-blank);
  overflow: hidden;
  animation: plan-card-in 0.3s ease;
}

@keyframes plan-card-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.plan-approval__header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-primary-light-9);
}

.plan-approval__header--approved {
  background: var(--el-color-success-light-9);
}

.plan-approval__header--approved .plan-approval__header-icon {
  color: var(--el-color-success);
}

.plan-approval__header--rejected {
  background: var(--el-fill-color-light);
}

.plan-approval__header--rejected .plan-approval__header-icon {
  color: var(--el-text-color-secondary);
}

.plan-approval__header-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.plan-approval__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ── 风险主题：按卡片最高风险给头部与边框着色（图标随 pendingIcon 切换） ── */
.plan-approval--low .plan-approval__header:not(.plan-approval__header--rejected) {
  background: var(--el-color-success-light-9);
}

.plan-approval--low .plan-approval__header:not(.plan-approval__header--rejected) .plan-approval__header-icon {
  color: var(--el-color-success);
}

.plan-approval--medium .plan-approval__header:not(.plan-approval__header--rejected) {
  background: var(--el-color-primary-light-9);
}

.plan-approval--high .plan-approval__header:not(.plan-approval__header--rejected) {
  background: var(--el-color-warning-light-9);
}

.plan-approval--high .plan-approval__header:not(.plan-approval__header--rejected) .plan-approval__header-icon {
  color: var(--el-color-warning);
}

.plan-approval--dangerous {
  border-color: color-mix(in srgb, var(--el-color-danger) 45%, var(--el-border-color));
}

.plan-approval--dangerous .plan-approval__header:not(.plan-approval__header--rejected) {
  background: var(--el-color-danger-light-9);
}

.plan-approval--dangerous .plan-approval__header:not(.plan-approval__header--rejected) .plan-approval__header-icon {
  color: var(--el-color-danger);
}

/* 风险徽标（头部标题旁） */
.plan-approval__risk-badge {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 10.5px;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.plan-approval__risk-badge--low {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.plan-approval__risk-badge--medium {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.plan-approval__risk-badge--high {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

.plan-approval__risk-badge--dangerous {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

/* 条目级风险点 */
.plan-approval__item-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.plan-approval__risk-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plan-approval__risk-dot--low {
  background: var(--el-color-success);
}

.plan-approval__risk-dot--medium {
  background: var(--el-color-primary);
}

.plan-approval__risk-dot--high {
  background: var(--el-color-warning);
}

.plan-approval__risk-dot--dangerous {
  background: var(--el-color-danger);
}

.plan-approval__body {
  padding: 10px 12px;
  max-height: 280px;
  overflow-y: auto;
}

.plan-approval__item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.plan-approval__item-desc {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
}

.plan-approval__empty {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.plan-approval__footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.plan-approval__footer--resolved {
  flex-direction: row;
  align-items: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.plan-approval__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 危险操作强确认警示条 */
.plan-approval__arm-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--el-radius-sm, 6px);
  font-size: 12px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
  animation: plan-arm-in 0.2s ease;
}

.plan-approval__arm-warning .el-button {
  margin-left: auto;
}

@keyframes plan-arm-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.plan-approval__btn-icon {
  margin-right: 4px;
}

.plan-approval__feedback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.plan-approval__feedback-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-approval :deep(.el-button) {
  cursor: pointer;
}

/* 动效降级：系统开启「减少动态效果」时，计划批准卡直接出现在终态（不再上移淡入）。
   本文件只有这一处 animation、且是一次性入场动画，不是加载反馈 ——
   卡片内容本身就是「待批准」的完整表达，停掉动画不会丢任何信息，
   所以不需要额外补静态态。 */
@media (prefers-reduced-motion: reduce) {
  .plan-approval {
    animation: none;
  }

  .plan-approval__arm-warning {
    animation: none;
  }
}
</style>
