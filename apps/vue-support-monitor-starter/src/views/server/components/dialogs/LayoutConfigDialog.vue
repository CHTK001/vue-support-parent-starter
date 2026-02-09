<template>
  <sc-dialog
    v-model="visible"
    title="布局配置"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    class="layout-config-dialog"
  >
    <div class="layout-content">
      <el-alert
        title="布局配置功能开发中"
        type="info"
        description="此功能正在开发中，敬请期待..."
        show-icon
        :closable="false"
      />
      
      <div class="layout-placeholder">
        <el-empty description="布局配置功能开发中..." />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" disabled>
          应用布局
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 定义事件
const emit = defineEmits<{
  apply: [template: any];
}>();

// 响应式状态
const visible = ref(false);

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.layout-config-dialog {
  :deep(.el-dialog) {
    border-radius: $radius-lg;
    @include glass-effect(0.95, 20px);
    box-shadow: $shadow-xl;
    border: 1px solid $border-light;
    overflow: hidden;

    .el-dialog__header {
      padding: $spacing-lg $spacing-xl;
      background: $gradient-bg-1;
      border-bottom: 1px solid $border-light;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: $gradient-line-top;
      }

      .el-dialog__title {
        font-weight: $font-weight-semibold;
        font-size: $font-lg;
        color: var(--el-text-color-primary);
      }
    }

    .el-dialog__body {
      padding: $spacing-xl;
      background: rgba(255, 255, 255, 0.5);
    }

    .el-dialog__footer {
      padding: $spacing-lg $spacing-xl;
      background: rgba(255, 255, 255, 0.6);
      border-top: 1px solid $border-light;
    }
  }
}

.layout-content {
  padding: $spacing-xl 0;

  :deep(.el-alert) {
    border-radius: $radius-md;
    @include glass-effect(0.9, 16px);
    border: 1px solid $border-light;
    box-shadow: $shadow-sm;
    margin-bottom: $spacing-xl;
  }

  .layout-placeholder {
    margin-top: $spacing-xl;
    text-align: center;
    padding: $spacing-3xl 0;

    :deep(.el-empty) {
      .el-empty__description {
        color: var(--el-text-color-placeholder);
        font-size: $font-md;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;

  .el-button {
    border-radius: $radius-sm;
    padding: $button-padding-md;
    transition: all $duration-fast $ease-standard;
    font-weight: $font-weight-medium;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
}

// 响应式设计
@include respond-to(lg) {
  .layout-config-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
      margin: 5vh auto;

      .el-dialog__body {
        padding: $spacing-lg;
      }
    }
  }
}

@include respond-to(sm) {
  .layout-config-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 2vh auto;

      .el-dialog__header,
      .el-dialog__body,
      .el-dialog__footer {
        padding: $spacing-md;
      }
    }
  }

  .dialog-footer {
    flex-direction: column-reverse;
    width: 100%;

    .el-button {
      width: 100%;
    }
  }
}
</style>
