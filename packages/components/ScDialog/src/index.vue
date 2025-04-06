<template>
  <div class="sc-dialog-container">
    <!-- 使用el-dialog作为基础组件 -->
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      :width="width"
      :top="top"
      :modal="modal"
      :append-to-body="appendToBody"
      :lock-scroll="lockScroll"
      :close-on-click-modal="closeOnClickModal"
      :close-on-press-escape="closeOnPressEscape"
      :show-close="showClose"
      :before-close="handleBeforeClose"
      :draggable="draggable"
      :center="center"
      :destroy-on-close="destroyOnClose"
      :class="[
        'sc-dialog',
        `sc-dialog--${type}`,
        { 'sc-dialog--with-icon': showIcon }
      ]"
      @open="onOpen"
      @opened="onOpened"
      @close="onClose"
      @closed="onClosed"
    >
      <!-- 对话框图标 -->
      <div v-if="showIcon" class="sc-dialog__icon">
        <IconifyIconOnline :icon="icon" />
      </div>

      <!-- 自定义标题插槽 -->
      <template #header v-if="$slots.header">
        <slot name="header"></slot>
      </template>

      <!-- 内容区域 -->
      <div class="sc-dialog__body" :class="{ 'sc-dialog__body--with-form': isForm }">
        <slot></slot>
      </div>

      <!-- 底部按钮区域 -->
      <template #footer v-if="$slots.footer || showFooter">
        <div class="sc-dialog__footer">
          <slot name="footer">
            <el-button @click="handleCancel" v-if="showCancelButton">
              <IconifyIconOnline :icon="cancelIcon" v-if="cancelIcon" />
              {{ cancelText }}
            </el-button>
            <el-button 
              :type="confirmButtonType" 
              @click="handleConfirm" 
              v-if="showConfirmButton"
              :loading="loading"
            >
              <IconifyIconOnline :icon="confirmIcon" v-if="confirmIcon && !loading" />
              {{ confirmText }}
            </el-button>
          </slot>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { ScDialogProps, ScDialogEmits } from './types';

/**
 * 定义组件属性
 */
const props = withDefaults(defineProps<ScDialogProps>(), {
  // 对话框基本属性
  modelValue: false,
  title: '',
  width: '500px',
  top: '15vh',
  modal: true,
  appendToBody: false,
  lockScroll: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  draggable: true,
  center: false,
  destroyOnClose: false,
  
  // 扩展属性
  type: 'default',
  icon: 'ep:info-filled',
  showIcon: true,
  isForm: false,
  
  // 底部按钮属性
  showFooter: true,
  showCancelButton: true,
  showConfirmButton: true,
  cancelText: '取消',
  confirmText: '确定',
  cancelIcon: 'ep:close',
  confirmIcon: 'ep:check',
  confirmButtonType: 'primary',
  loading: false
});

/**
 * 定义组件事件
 */
const emit = defineEmits<ScDialogEmits>();

/**
 * 获取插槽
 */
const slots = useSlots();

/**
 * 对话框可见状态
 */
const dialogVisible = ref(props.modelValue);

/**
 * 监听modelValue变化，同步到dialogVisible
 */
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
});

/**
 * 监听dialogVisible变化，同步到modelValue
 */
watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val);
});

/**
 * 处理对话框关闭前的回调
 * @param {Function} done - 关闭对话框的函数
 */
const handleBeforeClose = (done: () => void) => {
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

/**
 * 处理取消按钮点击事件
 */
const handleCancel = () => {
  emit('cancel');
  dialogVisible.value = false;
};

/**
 * 处理确认按钮点击事件
 */
const handleConfirm = () => {
  emit('confirm');
};

/**
 * 对话框打开事件
 */
const onOpen = () => {
  emit('open');
};

/**
 * 对话框打开动画结束事件
 */
const onOpened = () => {
  emit('opened');
};

/**
 * 对话框关闭事件
 */
const onClose = () => {
  emit('close');
};

/**
 * 对话框关闭动画结束事件
 */
const onClosed = () => {
  emit('closed');
};

/**
 * 手动打开对话框
 */
const open = () => {
  dialogVisible.value = true;
};

/**
 * 手动关闭对话框
 */
const close = () => {
  dialogVisible.value = false;
};

/**
 * 暴露方法给父组件
 */
defineExpose({
  open,
  close
});
</script>

<style lang="scss">
.sc-dialog-container {
  // 对话框容器样式
}

.sc-dialog {
  border-top: 4px solid var(--el-color-primary);
  // 基础对话框样式
  border-radius: 16px;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  .el-dialog__header {
    padding: 20px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-light);

    .el-dialog__title {
      font-weight: 600;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .el-dialog__body {
    padding: 30px 20px 20px;
    max-height: 70vh;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(50, 50, 50, 0.2);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(50, 50, 50, 0.4);
    }
    
    &::-webkit-scrollbar-track {
      background-color: rgba(50, 50, 50, 0.05);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-track:hover {
      background-color: rgba(50, 50, 50, 0.1);
    }
  }

  .el-dialog__footer {
    padding: 15px 20px;
    border-top: 1px solid var(--el-border-color-light);
  }

  // 对话框类型样式
  &--primary {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-8) 100%);
    }
  }

  &--success {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-success-light-7) 0%, var(--el-color-success-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-success);
    }
  }

  &--warning {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-warning-light-7) 0%, var(--el-color-warning-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-warning);
    }
  }

  &--danger {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-danger-light-7) 0%, var(--el-color-danger-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-danger);
    }
  }

  &--info {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-info-light-7) 0%, var(--el-color-info-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-info);
    }
  }

  // 带图标的对话框样式
  &--with-icon {
    .el-dialog__body {
      padding-top: 40px;
    }
  }

  // 对话框图标
  &__icon {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
    animation: sc-dialog-bounce 1s ease-out;
    
    svg {
      font-size: 24px;
      color: white;
    }
  }

  // 对话框内容区域
  &__body {
    &--with-form {
      .el-form-item {
        margin-bottom: 25px;
        transition: all 0.3s;
        animation: sc-dialog-slide-in 0.4s ease-out both;

        &:nth-child(1) { animation-delay: 0.1s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.3s; }
        &:nth-child(4) { animation-delay: 0.4s; }
        &:nth-child(5) { animation-delay: 0.5s; }
        &:nth-child(6) { animation-delay: 0.6s; }

        &:hover {
          transform: translateY(-2px);
        }
      }
    }
  }

  // 对话框底部
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    
    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

/* 动画效果 */
@keyframes sc-dialog-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-20px);
  }
  60% {
    transform: translateX(-50%) translateY(-10px);
  }
}

@keyframes sc-dialog-slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sc-dialog-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 