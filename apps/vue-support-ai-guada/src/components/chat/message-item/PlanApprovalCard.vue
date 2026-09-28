<template>
  <div class="plan-approval" role="group">
    <!-- 头部 -->
    <div
      class="plan-approval__header"
      :class="`plan-approval__header--${status}`"
    >
      <el-icon size="16" class="plan-approval__header-icon">
        <Check v-if="status === 'approved'" />
        <Close v-else-if="status === 'rejected'" />
        <Document v-else />
      </el-icon>
      <span class="plan-approval__title">{{ headerText }}</span>
    </div>

    <!-- 计划摘要 -->
    <div class="plan-approval__body">
      <template v-for="(item, i) in planItems" :key="i">
        <div v-if="item.title" class="plan-approval__item-title">
          {{ item.title }}
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
        <el-button
          type="primary"

          :disabled="decided"
          :loading="decided && confirmed"
          @click="handleDecision(true)"
        >
          <el-icon v-if="!(decided && confirmed)" class="plan-approval__btn-icon">
            <Check />
          </el-icon>
          <span>批准并执行</span>
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
import { Document, Check, Edit, Close } from "@element-plus/icons-vue";

interface PlanItem {
  toolCallId: string;
  toolName?: string;
  title?: string;
  description?: string;
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
    payload: { replyId: string; confirmed: boolean; feedback?: string }
  ): void;
}>();

const decided = ref(false);
const confirmed = ref(false);
const showFeedback = ref(false);
const feedbackText = ref("");

const planItems = computed<PlanItem[]>(() => props.request.items || []);

// 终态优先取持久化 status（reload 后），否则取本地点击态
const status = computed<"pending" | "approved" | "rejected">(() => {
  if (props.request.status === "approved" || props.request.status === "rejected") {
    return props.request.status;
  }
  if (decided.value) {
    return confirmed.value ? "approved" : "rejected";
  }
  return "pending";
});

const headerText = computed(() => {
  if (status.value === "approved") return "计划已批准";
  if (status.value === "rejected") return "计划已拒绝";
  return "计划已就绪，等待确认";
});

function handleDecision(isConfirmed: boolean) {
  if (decided.value) return;
  decided.value = true;
  confirmed.value = isConfirmed;
  emit("decision", {
    replyId: props.request.replyId,
    confirmed: isConfirmed,
  });
}

function startFeedback() {
  if (decided.value) return;
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
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.plan-approval__footer--resolved {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
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
}
</style>
