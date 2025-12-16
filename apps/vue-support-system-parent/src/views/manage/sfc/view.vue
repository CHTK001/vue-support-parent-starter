<template>
  <div class="overflow-hidden">
    <el-dialog 
      v-model="visible" 
      class="preview-dialog" 
      top="5vh" 
      width="80vw"
      :title="title" 
      draggable 
      :close-on-click-modal="false" 
      @close="onClose"
    >
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <div class="header-left">
            <el-icon class="header-icon" :size="22">
              <component :is="useRenderIcon('ri:eye-line')" />
            </el-icon>
            <span :id="titleId" :class="titleClass">{{ title }}</span>
          </div>
          <div class="header-meta">
            <el-tag v-if="dataReact.data.sysSfcVersion" type="info" size="small">
              v{{ dataReact.data.sysSfcVersion }}
            </el-tag>
            <el-tag :type="getStatusType()" size="small">
              {{ dataReact.data.sysSfcStatus === 1 ? '已启用' : '已禁用' }}
            </el-tag>
          </div>
        </div>
      </template>

      <div class="preview-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="loading-icon">
            <component :is="useRenderIcon('ri:loader-4-line')" />
          </el-icon>
          <span>加载组件中...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <el-icon class="error-icon">
            <component :is="useRenderIcon('ri:error-warning-line')" />
          </el-icon>
          <span class="error-text">组件加载失败</span>
          <p class="error-desc">{{ error }}</p>
          <el-button type="primary" @click="reloadComponent">
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:refresh')" /></el-icon>
            重新加载
          </el-button>
        </div>

        <!-- 组件预览 -->
        <div v-else class="preview-content">
          <component
            :is="remote"
            v-if="remote"
            class="preview-component"
            :frameInfo="{
              fullPath: dataReact.data.sysSfcPath,
            }"
          />
          <div v-else class="empty-state">
            <el-icon class="empty-icon">
              <component :is="useRenderIcon('ri:file-unknow-line')" />
            </el-icon>
            <span>暂无可预览内容</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="footer-info">
            <span class="info-item">
              <el-icon><component :is="useRenderIcon('ri:code-s-slash-line')" /></el-icon>
              {{ dataReact.data.sysSfcName }}
            </span>
            <span v-if="dataReact.data.sysSfcType !== undefined" class="info-item">
              <el-icon><component :is="useRenderIcon('ri:folder-line')" /></el-icon>
              {{ getTypeName(dataReact.data.sysSfcType) }}
            </span>
          </div>
          <el-button @click="onClose">
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:close')" /></el-icon>
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineExpose, reactive } from "vue";
import { loadSfcModule } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const emit = defineEmits(["close"]);
const title = ref("");
const visible = ref(false);
const loading = ref(false);
const error = ref("");
const dataReact = reactive({
  data: {},
});
const remote = ref();

const typeMap = {
  0: '文件式',
  1: '代码式',
  2: '远程地址',
  3: '本地地址'
};

const getTypeName = (type) => typeMap[type] || '未知';
const getStatusType = () => dataReact.data.sysSfcStatus === 1 ? 'success' : 'info';

const onClose = async () => {
  emit("close");
  visible.value = false;
  remote.value = null;
  error.value = "";
};

const setData = async (data) => {
  Object.assign(dataReact.data, data);
  title.value = `组件预览 - ${dataReact.data.sysSfcChineseName || dataReact.data.sysSfcName}`;
};

const loadComponent = async () => {
  loading.value = true;
  error.value = "";
  remote.value = null;

  try {
    let modelCache;
    try {
      modelCache = JSON.parse(dataReact.data.sysSfcModelCache);
    } catch (e) {}
    
    remote.value = await loadSfcModule(
      dataReact.data.sysSfcName + ".vue", 
      dataReact.data.sysSfcId, 
      dataReact.data
    );
  } catch (e) {
    error.value = e?.message || '加载组件时发生错误';
  } finally {
    loading.value = false;
  }
};

const reloadComponent = () => {
  loadComponent();
};

const open = async () => {
  visible.value = true;
  await loadComponent();
};

defineExpose({
  setData,
  open,
});
</script>

<style lang="scss" scoped>
.preview-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
    flex-shrink: 0;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      color: var(--el-color-primary);
    }
  }

  .header-meta {
    display: flex;
    gap: 8px;
  }
}

.preview-container {
  height: 65vh;
  overflow: auto;
  background: var(--el-fill-color-lighter);

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    color: var(--el-text-color-secondary);
  }

  .loading-state {
    .loading-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      animation: spin 1s linear infinite;
    }
  }

  .error-state {
    .error-icon {
      font-size: 64px;
      color: var(--el-color-danger);
    }

    .error-text {
      font-size: 18px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .error-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      max-width: 400px;
      text-align: center;
      margin: 0;
    }
  }

  .empty-state {
    .empty-icon {
      font-size: 64px;
      color: var(--el-text-color-placeholder);
    }
  }

  .preview-content {
    height: 100%;
    padding: 16px;

    .preview-component {
      width: 100%;
      height: 100%;
      background: var(--el-bg-color);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      overflow: auto;
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .footer-info {
    display: flex;
    gap: 20px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .el-icon {
        font-size: 16px;
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
  .preview-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
    }
  }

  .preview-container {
    background: var(--el-fill-color);

    .preview-content .preview-component {
      background: var(--el-bg-color-overlay);
    }
  }
}
</style>
