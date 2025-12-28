<template>
  <div>
    <sc-dialog 
      v-model="visible" 
      :title="title" 
      draggable 
      width="500px"
      class="upload-dialog"
      @close="onClose"
    >
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <el-icon class="header-icon" :size="22">
            <component :is="useRenderIcon('ep:upload-filled')" />
          </el-icon>
          <span :id="titleId" :class="titleClass">{{ title }}</span>
        </div>
      </template>

      <div class="upload-container">
        <el-upload 
          class="upload-area" 
          drag 
          action="#" 
          accept=".vue" 
          :auto-upload="false" 
          :show-file-list="false"
          :loading="uploading"
          @change="handleChange"
        >
          <div class="upload-content">
            <el-icon class="upload-icon" :class="{ uploading }">
              <component :is="useRenderIcon(uploading ? 'ri:loader-4-line' : 'ri:upload-cloud-2-line')" />
            </el-icon>
            <div class="upload-text">
              <p class="primary-text">{{ uploading ? '上传中...' : '将文件拖到此处' }}</p>
              <p class="secondary-text">或 <em>点击选择文件</em></p>
            </div>
          </div>
        </el-upload>

        <div class="upload-tips">
          <div class="tip-item">
            <el-icon><component :is="useRenderIcon('ri:file-code-line')" /></el-icon>
            <span>支持 <strong>.vue</strong> 格式文件</span>
          </div>
          <div class="tip-item">
            <el-icon><component :is="useRenderIcon('ri:hard-drive-2-line')" /></el-icon>
            <span>文件大小不超过 <strong>500KB</strong></span>
          </div>
          <div class="tip-item">
            <el-icon><component :is="useRenderIcon('ri:information-line')" /></el-icon>
            <span>上传后将替换现有组件文件</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="onClose">
          <el-icon class="mr-1"><component :is="useRenderIcon('ep:close')" /></el-icon>
          关闭
        </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup>
import { fetchUploadSfc } from "@repo/core";
import { ref, defineExpose, reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks.ts";
import { message } from "@repo/utils";

const emit = defineEmits(["close", "success"]);
const title = ref("");
const visible = ref(false);
const uploading = ref(false);
const dataReact = reactive({
  data: {},
});

const handleChange = async (uploadFile) => {
  if (!uploadFile.raw) return;
  
  // 检查文件大小
  if (uploadFile.raw.size > 500 * 1024) {
    message("文件大小不能超过500KB", { type: "warning" });
    return;
  }

  uploading.value = true;
  try {
    const res = await fetchUploadSfc(uploadFile.raw, dataReact.data);
    if (res?.code === "00000") {
      message("上传成功", { type: "success" });
      emit("success");
      onClose();
    } else {
      message(res?.message || "上传失败", { type: "error" });
    }
  } catch (error) {
    message("上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
};

const onClose = async () => {
  emit("close");
  visible.value = false;
  uploading.value = false;
};

const setData = async (data) => {
  Object.assign(dataReact.data, data);
  title.value = `上传组件 - ${dataReact.data.sysSfcChineseName || dataReact.data.sysSfcName}`;
};

const open = async () => {
  visible.value = true;
};

defineExpose({
  setData,
  open,
});
</script>

<style lang="scss" scoped>
.upload-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-bg-color) 100%);
  }

  :deep(.el-dialog__body) {
    padding: 24px;
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
    color: var(--el-color-success);
  }
}

.upload-container {
  .upload-area {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 40px 20px;
      border-radius: 12px;
      border: 2px dashed var(--el-border-color);
      background: var(--el-fill-color-lighter);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      .upload-icon {
        font-size: 64px;
        color: var(--el-color-primary);
        transition: all 0.3s ease;

        &.uploading {
          animation: spin 1s linear infinite;
        }
      }

      .upload-text {
        text-align: center;

        .primary-text {
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .secondary-text {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin: 0;

          em {
            color: var(--el-color-primary);
            font-style: normal;
            cursor: pointer;
          }
        }
      }
    }
  }

  .upload-tips {
    margin-top: 20px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    .tip-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      padding: 6px 0;

      .el-icon {
        font-size: 16px;
        color: var(--el-color-info);
      }

      strong {
        color: var(--el-text-color-primary);
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .upload-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
    }
  }

  .upload-area :deep(.el-upload-dragger) {
    background: var(--el-fill-color);
  }

  .upload-tips {
    background: var(--el-fill-color);
  }
}
</style>
