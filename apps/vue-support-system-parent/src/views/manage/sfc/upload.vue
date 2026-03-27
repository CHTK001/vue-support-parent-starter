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
          <ScIcon class="header-icon" :size="22">
            <component :is="useRenderIcon('ep:upload-filled')" />
          </ScIcon>
          <span :id="titleId" :class="titleClass">{{ title }}</span>
        </div>
      </template>

      <div class="upload-container">
        <ScUpload
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
            <ScIcon class="upload-icon" :class="{ uploading }">
              <component
                :is="
                  useRenderIcon(
                    uploading ? 'ri:loader-4-line' : 'ri:upload-cloud-2-line',
                  )
                "
              />
            </ScIcon>
            <div class="upload-text">
              <p class="primary-text">
                {{ uploading ? "上传中..." : "将文件拖到此处" }}
              </p>
              <p class="secondary-text">或 <em>点击选择文件</em></p>
            </div>
          </div>
        </ScUpload>

        <div class="upload-tips">
          <div class="tip-item">
            <ScIcon
              ><component :is="useRenderIcon('ri:file-code-line')"
            /></ScIcon>
            <span>支持 <strong>.vue</strong> 格式文件</span>
          </div>
          <div class="tip-item">
            <ScIcon
              ><component :is="useRenderIcon('ri:hard-drive-2-line')"
            /></ScIcon>
            <span>文件大小不超过 <strong>500KB</strong></span>
          </div>
          <div class="tip-item">
            <ScIcon
              ><component :is="useRenderIcon('ri:information-line')"
            /></ScIcon>
            <span>上传后将替换现有组件文件</span>
          </div>
        </div>
      </div>

      <template #footer>
        <ScButton @click="onClose">
          <ScIcon class="mr-1"
            ><component :is="useRenderIcon('ep:close')"
          /></ScIcon>
          关闭
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";
import { fetchUploadSfc } from "@repo/core";
import { ref, reactive } from "vue";
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
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.upload-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-success-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
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
  gap: 10px;
  align-items: center;

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
      background: var(--el-fill-color-lighter);
      border: 2px dashed var(--el-border-color);
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
      }
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;

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
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .secondary-text {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);

          em {
            font-style: normal;
            color: var(--el-color-primary);
            cursor: pointer;
          }
        }
      }
    }
  }

  .upload-tips {
    padding: 16px;
    margin-top: 20px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    .tip-item {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);

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

// 暗色主题适配
:root[data-theme="dark"] {
  .upload-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-success-rgb), 0.15) 0%,
        var(--el-bg-color-overlay) 100%
      );
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
