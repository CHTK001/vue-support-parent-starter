<template>
  <el-dialog
    v-model="dialogVisible"
    :width="width"
    :top="top"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="false"
    :before-close="handleBeforeClose"
    :draggable="draggable"
    :center="center"
    :destroy-on-close="destroyOnClose"
    class="sc-dialog sc-dialog--headless"
    @open="$emit('open')"
    @opened="$emit('opened')"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <!-- 内容区域 -->
    <div class="sc-dialog__body">
      <!-- 关闭按钮 -->
      <button v-if="showClose" class="sc-dialog__close-btn" @click="onClose" type="button">
        <IconifyIconOnline icon="ri:close-line" />
      </button>
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
  showIcon: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
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
    default: ''
  },
  confirmIcon: {
    type: String,
    default: ''
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
 * 关闭对话框
 */
const onClose = () => {
  dialogVisible.value = false;
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
.sc-dialog--headless {
  // 无头部模式样式
  border-radius: 8px;
  
  .el-dialog__header {
    display: none; // 完全隐藏头部
  }
  
  .el-dialog__body {
    padding: 0; // 移除内部边距，由内容自己控制
  }
  
  .sc-dialog__body {
    position: relative;
    padding: 24px;
  }
  
  .sc-dialog__close-btn {
    position: absolute;
    top: -15px;
    right: -15px;
    z-index: 10;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    font-size: 18px;
    transition: all 0.3s;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--el-color-primary);
      transform: rotate(90deg);
    }
    
    &:focus {
      outline: none;
    }
  }
  
  .sc-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style> 