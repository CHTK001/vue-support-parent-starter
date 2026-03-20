<script setup>
import { ref, reactive } from "vue";
import { useRenderIcon } from "@repo/components";

const emit = defineEmits(["close"]);

// 弹窗可见性
const visible = ref(true);

// 反馈数据
const feedbackData = reactive({
  sysFeedbackId: null,
  sysFeedbackType: "",
  sysFeedbackContent: "",
  sysFeedbackImages: "",
  sysFeedbackStatus: null,
  sysFeedbackDealBy: null,
  sysFeedbackDealName: "",
  sysFeedbackRecoverContent: "",
  sysFeedbackRecoverTime: "",
  sysFeedbackRecoverImages: "",
  createTime: "",
  createBy: "",
});

// 反馈类型选项
const typeOptions = {
  SUGGESTION: { label: "功能建议", type: "primary" },
  BUG: { label: "BUG反馈", type: "danger" },
  OTHER: { label: "其他问题", type: "info" },
};

/**
 * 设置数据
 */
const setData = (data) => {
  Object.assign(feedbackData, data);
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
  visible.value = false;
  emit("close");
};

/**
 * 获取类型配置
 */
const getTypeConfig = (type) => {
  return typeOptions[type] || { label: type || "未知", type: "info" };
};

/**
 * 获取图片列表
 */
const getImageList = (images) => {
  if (!images) return [];
  return images.split(",").filter((img) => img.trim());
};

defineExpose({
  setData,
});
</script>

<template>
  <sc-dialog
    v-model="visible"
    title="反馈详情"
    width="700px"
    destroy-on-close
    class="feedback-detail-dialog"
    @close="handleClose"
  >
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <ScIcon class="header-icon" :size="22">
          <component :is="useRenderIcon('ri:feedback-line')" />
        </ScIcon>
        <span :id="titleId" :class="titleClass">反馈详情</span>
      </div>
    </template>
    <div class="detail-container">
      <!-- 基本信息 -->
      <div class="detail-card">
        <div class="card-header">
          <ScIcon class="card-icon"
            ><component :is="useRenderIcon('ri:information-line')"
          /></ScIcon>
          <span>基本信息</span>
        </div>
        <ScDescriptions :column="2" border class="detail-section">
          <ScDescriptionsItem label="反馈类型">
            <ScTag :type="getTypeConfig(feedbackData.sysFeedbackType).type">
              {{ getTypeConfig(feedbackData.sysFeedbackType).label }}
            </ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈状态">
            <ScTag v-if="feedbackData.sysFeedbackStatus === 1" type="success"
              >已处理</el-tag
            >
            <ScTag v-else type="warning">待处理</ScTag>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈人">
            {{ feedbackData.createBy || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈时间">
            {{ feedbackData.createTime || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈内容" :span="2">
            <div class="content-text">
              {{ feedbackData.sysFeedbackContent || "-" }}
            </div>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="反馈图片" :span="2">
            <div
              v-if="getImageList(feedbackData.sysFeedbackImages).length > 0"
              class="image-list"
            >
              <ScImage
                v-for="(img, index) in getImageList(
                  feedbackData.sysFeedbackImages,
                )"
                :key="index"
                :src="img"
                :preview-src-list="getImageList(feedbackData.sysFeedbackImages)"
                fit="cover"
                class="preview-image"
                preview-teleported
              />
            </div>
            <span v-else>-</span>
          </ScDescriptionsItem>
        </ScDescriptions>
      </div>

      <!-- 处理信息 -->
      <div
        v-if="feedbackData.sysFeedbackStatus === 1"
        class="detail-card reply-section"
      >
        <div class="card-header">
          <ScIcon class="card-icon"
            ><component :is="useRenderIcon('ri:check-double-line')"
          /></ScIcon>
          <span>处理信息</span>
        </div>
        <ScDescriptions :column="2" border>
          <ScDescriptionsItem label="处理人">
            {{ feedbackData.sysFeedbackDealName || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="处理时间">
            {{ feedbackData.sysFeedbackRecoverTime || "-" }}
          </ScDescriptionsItem>
          <ScDescriptionsItem label="回复内容" :span="2">
            <div class="content-text">
              {{ feedbackData.sysFeedbackRecoverContent || "-" }}
            </div>
          </ScDescriptionsItem>
          <ScDescriptionsItem label="回复图片" :span="2">
            <div
              v-if="
                getImageList(feedbackData.sysFeedbackRecoverImages).length > 0
              "
              class="image-list"
            >
              <ScImage
                v-for="(img, index) in getImageList(
                  feedbackData.sysFeedbackRecoverImages,
                )"
                :key="index"
                :src="img"
                :preview-src-list="
                  getImageList(feedbackData.sysFeedbackRecoverImages)
                "
                fit="cover"
                class="preview-image"
                preview-teleported
              />
            </div>
            <span v-else>-</span>
          </ScDescriptionsItem>
        </ScDescriptions>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">关闭</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<style scoped lang="scss">
.feedback-detail-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-info-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  gap: 10px;
  align-items: center;

  .header-icon {
    color: var(--el-color-info);
  }
}

.detail-container {
  padding: 0;
}

.detail-card {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  }

  .card-header {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-bottom: 12px;
    margin-bottom: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .card-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }
}

.detail-section {
  margin-bottom: 0;
}

.content-text {
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-image {
  width: 80px;
  height: 80px;
  cursor: pointer;
  border-radius: 4px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.reply-section {
  margin-top: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-descriptions__label) {
  width: 100px;
  font-weight: 600;
}

:deep(.el-descriptions__content) {
  min-width: 150px;
}

// 暗色主题适配
:root[data-theme="dark"] {
  .feedback-detail-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-info-rgb), 0.15) 0%,
        var(--el-bg-color-overlay) 100%
      );
    }
  }

  .detail-card {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);

    &:hover {
      box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
    }
  }
}
</style>
