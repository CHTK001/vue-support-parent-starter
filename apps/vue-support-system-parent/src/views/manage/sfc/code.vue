<template>
  <div>
    <sc-dialog v-model="visible" draggable title="编码" width="70vw" top="10px" @close="handleClose" class="code-dialog">
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <el-icon class="header-icon" :size="22">
            <component :is="useRenderIcon('ri:code-s-slash-line')" />
          </el-icon>
          <span :id="titleId" :class="titleClass">编码编辑</span>
        </div>
      </template>
      <div class="code-container">
        <ScCodeEditor v-model="form.sysSfcContent" style="width: 100%; height: 70vh" :options="options" mode="vue" @updateValue="handleUpdateValue" />
      </div>
    </sc-dialog>
  </div>
</template>

<script setup>
import "codemirror/mode/vue/vue";
import { reactive, defineAsyncComponent, defineExpose, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"));
const form = reactive({ sysSfcContent: "" });
const visible = ref(false);
const emits = defineEmits(["update:modelValue"]);
const options = {
  col: 300,
  height: 2000,
  hintOptions: {
    // 自定义提示选项
    completeSingle: false,
  },
};

const setData = async (item) => {
  Object.assign(form, item);
  return this;
};

const handleUpdateValue = async (value) => {
  emits("updateValue", value);
};
const handleClose = async () => {
  visible.value = false;
};

const open = async () => {
  visible.value = true;
};

defineExpose({ setData, open });
</script>

<style lang="scss" scoped>
.code-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-color-warning-light-9) 0%, var(--el-bg-color) 100%);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .header-icon {
    color: var(--el-color-warning);
  }
}

.code-container {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 0 0 var(--el-border-radius-base) var(--el-border-radius-base);
}

// 暗色主题适配
:root[data-theme='dark'] {
  .code-dialog {
    :deep(.el-dialog__header) {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.15) 0%, var(--el-bg-color-overlay) 100%);
    }
  }

  .code-container {
    background: var(--el-fill-color);
  }
}
</style>
