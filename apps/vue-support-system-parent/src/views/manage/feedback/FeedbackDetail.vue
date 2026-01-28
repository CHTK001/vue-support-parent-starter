<script setup>
import { ref, reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

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
  createBy: ""
});

// 反馈类型选项
const typeOptions = {
  SUGGESTION: { label: "功能建议", type: "primary" },
  BUG: { label: "BUG反馈", type: "danger" },
  OTHER: { label: "其他问题", type: "info" }
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
  setData
});
</script>

<template>
  <sc-dialog
    v-model="visible"
    title="反馈详情"
    width="700px"
    destroy-on-close
    @close="handleClose"
    class="feedback-detail-dialog"
  >
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <el-icon class="header-icon" :size="22">
          <component :is="useRenderIcon('ri:feedback-line')" />
        </el-icon>
        <span :id="titleId" :class="titleClass">反馈详情</span>
      </div>
    </template>
    <div class="detail-container">
      <!-- 基本信息 -->
      <div class="detail-card">
        <div class="card-header">
          <el-icon class="card-icon"><component :is="useRenderIcon('ri:information-line')" /></el-icon>
          <span>基本信息</span>
        </div>
        <el-descriptions :column="2" border class="detail-section">
        <el-descriptions-item label="反馈类型">
          <el-tag :type="getTypeConfig(feedbackData.sysFeedbackType).type">
            {{ getTypeConfig(feedbackData.sysFeedbackType).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="反馈状态">
          <el-tag v-if="feedbackData.sysFeedbackStatus === 1" type="success">已处理</el-tag>
          <el-tag v-else type="warning">待处理</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="反馈人">
          {{ feedbackData.createBy || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="反馈时间">
          {{ feedbackData.createTime || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="反馈内容" :span="2">
          <div class="content-text">{{ feedbackData.sysFeedbackContent || "-" }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="反馈图片" :span="2">
          <div v-if="getImageList(feedbackData.sysFeedbackImages).length > 0" class="image-list">
            <el-image
              v-for="(img, index) in getImageList(feedbackData.sysFeedbackImages)"
              :key="index"
              :src="img"
              :preview-src-list="getImageList(feedbackData.sysFeedbackImages)"
              fit="cover"
              class="preview-image"
              preview-teleported
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      </div>

      <!-- 处理信息 -->
      <div v-if="feedbackData.sysFeedbackStatus === 1" class="detail-card reply-section">
        <div class="card-header">
          <el-icon class="card-icon"><component :is="useRenderIcon('ri:check-double-line')" /></el-icon>
          <span>处理信息</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="处理人">
            {{ feedbackData.sysFeedbackDealName || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ feedbackData.sysFeedbackRecoverTime || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="回复内容" :span="2">
            <div class="content-text">{{ feedbackData.sysFeedbackRecoverContent || "-" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="回复图片" :span="2">
            <div v-if="getImageList(feedbackData.sysFeedbackRecoverImages).length > 0" class="image-list">
              <el-image
                v-for="(img, index) in getImageList(feedbackData.sysFeedbackRecoverImages)"
                :key="index"
                :src="img"
                :preview-src-list="getImageList(feedbackData.sysFeedbackRecoverImages)"
                fit="cover"
                class="preview-image"
                preview-teleported
              />
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<style scoped lang="scss">
.feedback-detail-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-info-light-9) 0%, var(--el-bg-color) 100%);
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
  align-items: center;
  gap: 10px;

  .header-icon {
    color: var(--el-color-info);
  }
}

.detail-container {
  padding: 0;
}

.detail-card {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-weight: 600;
    color: var(--el-text-color-primary);

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
  white-space: pre-wrap;
  word-break: break-word;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
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
:root[data-theme='dark'] {
  .feedback-detail-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
    }
  }

  .detail-card {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
