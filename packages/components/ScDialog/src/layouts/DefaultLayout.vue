<template>
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
      'sc-dialog--default',
      `sc-dialog--${type}`,
      { 'sc-dialog--with-icon': showIcon }
    ]"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
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
          <el-button @click="onCancel" v-if="showCancelButton">
            <IconifyIconOnline :icon="cancelIcon" v-if="cancelIcon" />
            {{ cancelText }}
          </el-button>
          <el-button 
            :type="confirmButtonType" 
            @click="onConfirm" 
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { PropType } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '500px'
  },
  top: {
    type: String,
    default: '15vh'
  },
  modal: {
    type: Boolean,
    default: true
  },
  appendToBody: {
    type: Boolean,
    default: false
  },
  lockScroll: {
    type: Boolean,
    default: true
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  beforeClose: {
    type: Function
  },
  draggable: {
    type: Boolean,
    default: true
  },
  center: {
    type: Boolean,
    default: false
  },
  destroyOnClose: {
    type: Boolean,
    default: false
  },
  
  // 扩展属性
  type: {
    type: String,
    default: 'default'
  },
  icon: {
    type: String,
    default: 'ep:info-filled'
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  isForm: {
    type: Boolean,
    default: false
  },
  
  // 底部按钮属性
  showFooter: {
    type: Boolean,
    default: true
  },
  showCancelButton: {
    type: Boolean,
    default: true
  },
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelIcon: {
    type: String,
    default: 'ep:close'
  },
  confirmIcon: {
    type: String,
    default: 'ep:check'
  },
  confirmButtonType: {
    type: String as PropType<'primary' | 'success' | 'warning' | 'danger' | 'info'>,
    default: 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'open', 'opened', 'close', 'closed', 'cancel', 'confirm']);

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
const onCancel = () => {
  emit('cancel');
};

/**
 * 处理确认按钮点击事件
 */
const onConfirm = () => {
  emit('confirm');
};
</script>

<style lang="scss">
.sc-dialog--default {
  border-top: 4px solid var(--el-color-primary);
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
  &.sc-dialog--primary {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-8) 100%);
    }
  }

  &.sc-dialog--success {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-success-light-7) 0%, var(--el-color-success-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-success);
    }
  }

  &.sc-dialog--warning {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-warning-light-7) 0%, var(--el-color-warning-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-warning);
    }
  }

  &.sc-dialog--danger {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-danger-light-7) 0%, var(--el-color-danger-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-danger);
    }
  }

  &.sc-dialog--info {
    .el-dialog__header {
      background: linear-gradient(135deg, var(--el-color-info-light-7) 0%, var(--el-color-info-light-8) 100%);
    }
    .el-dialog__title {
      color: var(--el-color-info);
    }
  }

  // 带图标的对话框样式
  &.sc-dialog--with-icon {
    .el-dialog__body {
      padding-top: 40px;
    }
  }

  // 对话框图标
  .sc-dialog__icon {
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
  .sc-dialog__body {
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
  .sc-dialog__footer {
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