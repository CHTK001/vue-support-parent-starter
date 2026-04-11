<script setup lang="ts">
import type { Feedback } from "@/api/manage/feedback";
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
  data?: Feedback | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [boolean];
}>();

const typeMap: Record<string, { label: string; tag: string }> = {
  SUGGESTION: { label: "功能建议", tag: "primary" },
  BUG: { label: "BUG 反馈", tag: "danger" },
  OTHER: { label: "其他问题", tag: "info" },
};

const feedback = computed<Feedback | null>(() => props.data ?? null);

const imageList = computed(() =>
  String(feedback.value?.sysFeedbackImages || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);

const recoverImageList = computed(() =>
  String(feedback.value?.sysFeedbackRecoverImages || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);

const typeConfig = computed(() => {
  const type = String(feedback.value?.sysFeedbackType || "").toUpperCase();
  return typeMap[type] || { label: type || "未知", tag: "info" };
});

const close = () => emit("update:modelValue", false);
</script>

<template>
  <ScDialog
    :model-value="modelValue"
    width="760px"
    title="反馈详情"
    destroy-on-close
    class="feedback-detail-dialog"
    @close="close"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="feedback-detail">
      <section class="detail-card">
        <header class="detail-card__header">
          <div>
            <p class="detail-card__eyebrow">基础信息</p>
            <h3>反馈内容与来源</h3>
          </div>
          <ScTag :type="typeConfig.tag as any" effect="light">
            {{ typeConfig.label }}
          </ScTag>
        </header>

        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="状态">
            <ScTag
              :type="feedback?.sysFeedbackStatus === 1 ? 'success' : 'warning'"
              effect="light"
            >
              {{ feedback?.sysFeedbackStatus === 1 ? "已处理" : "待处理" }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈人">
            {{ feedback?.createBy || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈时间">
            {{ feedback?.createTime || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈 ID">
            {{ feedback?.sysFeedbackId || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈内容" :span="2">
            <div class="detail-text">{{ feedback?.sysFeedbackContent || "-" }}</div>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈图片" :span="2">
            <div v-if="imageList.length" class="detail-images">
              <ScImage
                v-for="item in imageList"
                :key="item"
                :src="item"
                :preview-src-list="imageList"
                fit="cover"
                preview-teleported
                class="detail-image"
              />
            </div>
            <span v-else>-</span>
          </ScDescriptionsItem>
        </ScDescriptions>
      </section>

      <section v-if="feedback?.sysFeedbackStatus === 1" class="detail-card">
        <header class="detail-card__header">
          <div>
            <p class="detail-card__eyebrow">处理信息</p>
            <h3>回复与闭环记录</h3>
          </div>
          <ScTag type="success" effect="light">已处理</ScTag>
        </header>

        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="处理人">
            {{ feedback?.sysFeedbackDealName || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="处理时间">
            {{ feedback?.sysFeedbackRecoverTime || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="回复内容" :span="2">
            <div class="detail-text">
              {{ feedback?.sysFeedbackRecoverContent || "-" }}
            </div>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="回复图片" :span="2">
            <div v-if="recoverImageList.length" class="detail-images">
              <ScImage
                v-for="item in recoverImageList"
                :key="item"
                :src="item"
                :preview-src-list="recoverImageList"
                fit="cover"
                preview-teleported
                class="detail-image"
              />
            </div>
            <span v-else>-</span>
          </ScDescriptionsItem>
        </ScDescriptions>
      </section>
    </div>

    <template #footer>
      <ScButton @click="close">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<style scoped lang="scss">
.feedback-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-card {
  padding: 18px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.82), rgb(255 255 255 / 0.96)),
    var(--app-bg-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.detail-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 4px 0 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.detail-card__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
}

.detail-text {
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-image {
  width: 84px;
  height: 84px;
  border-radius: 12px;
}

:deep(.el-descriptions__label) {
  min-width: 96px;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding-top: 12px;
}

:root[data-theme="dark"] {
  .detail-card {
    background:
      linear-gradient(180deg, rgb(22 27 34 / 0.88), rgb(15 23 42 / 0.94)),
      var(--app-bg-overlay, var(--el-bg-color-overlay));
    border-color: rgb(148 163 184 / 0.16);
  }
}
</style>
