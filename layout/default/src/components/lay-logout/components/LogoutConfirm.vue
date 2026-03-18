<script setup lang="ts">
/**
 * 退出登录确认对话框组件
 * 用于确认用户退出登录操作，支持记住选择
 * @author CH
 * @version 1.0.0
 * @since 2024-12-04
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStoreHook } from '@/store/modules/user'
import { useGlobal } from '@pureadmin/utils'

interface LogoutConfirmProps {
  visible?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  showRemember?: boolean
}

const props = withDefaults(defineProps<LogoutConfirmProps>(), {
  visible: false,
  title: '退出登录',
  message: '确定要退出登录吗？',
  confirmText: '退出',
  cancelText: '取消',
  showRemember: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

const router = useRouter()
const userStore = useUserStoreHook()
const { $storage } = useGlobal<GlobalPropertiesApi>()

const loading = ref(false)
const rememberChoice = ref(false)

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 处理确认退出
const handleConfirm = async () => {
  loading.value = true
  
  try {
    // 如果勾选了记住选择，保存到本地存储
    if (rememberChoice.value) {
      $storage.configure = {
        ...$storage.configure,
        skipLogoutConfirm: true
      }
    }
    
    // 执行退出登录
    await userStore.logOut()
    
    // 关闭对话框
    dialogVisible.value = false
    
    // 触发确认事件
    emit('confirm')
    
    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !loading.value) {
    handleConfirm()
  } else if (e.key === 'Escape') {
    handleCancel()
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    class="logout-confirm-dialog"
    @keydown="handleKeydown"
  >
    <!-- 图标 + 消息 -->
    <div class="dialog-content">
      <div class="content-icon">
        <IconifyIconOnline icon="ri:logout-circle-line" />
      </div>
      <div class="content-message">
        <p class="message-text">{{ message }}</p>
        <p class="message-hint">退出后需要重新登录才能访问系统</p>
      </div>
    </div>

    <!-- 记住选择 -->
    <div v-if="showRemember" class="dialog-remember">
      <el-checkbox v-model="rememberChoice" size="small">
        <span class="remember-text">不再提示，直接退出</span>
      </el-checkbox>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <ScButton
          round
          size="default"
          @click="handleCancel"
          :disabled="loading"
        >
          <IconifyIconOnline icon="ri:close-line" class="btn-icon" />
          {{ cancelText }}
        </ScButton>
        <ScButton
          round
          type="danger"
          size="default"
          @click="handleConfirm"
          :loading="loading"
        >
          <IconifyIconOnline v-if="!loading" icon="ri:logout-box-line" class="btn-icon" />
          {{ loading ? '退出中...' : confirmText }}
        </ScButton>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px 0;

  .content-icon {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--stitch-radius-lg, 12px);
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-danger-rgb), 0.1) 0%,
      rgba(var(--el-color-danger-rgb), 0.05) 100%
    );
    color: var(--el-color-danger);
    font-size: 32px;
    animation: iconPulse 2s ease-in-out infinite;
  }

  .content-message {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .message-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin: 0;
      line-height: 1.5;
    }

    .message-hint {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.dialog-remember {
  padding: 16px 0 8px;
  border-top: 1px solid var(--el-border-color-lighter);

  .remember-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  :deep(.el-checkbox) {
    .el-checkbox__label {
      font-size: 13px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .btn-icon {
    font-size: 16px;
    margin-right: 4px;
  }
}

// 深色模式适配
html.dark {
  .content-icon {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-danger-rgb), 0.2) 0%,
      rgba(var(--el-color-danger-rgb), 0.1) 100%
    );
  }
}
</style>

<style lang="scss">
.logout-confirm-dialog {
  .el-dialog__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 0 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  // 圆角优化
  .el-dialog {
    border-radius: var(--stitch-radius-xl, 16px);
    overflow: hidden;
  }

  // 关闭按钮样式
  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border-radius: var(--stitch-radius-md, 8px);
    transition: all var(--stitch-transition-base, 0.3s) ease;

    &:hover {
      background: var(--el-fill-color-light);

      .el-dialog__close {
        color: var(--el-color-danger);
      }
    }

    .el-dialog__close {
      font-size: 18px;
      transition: color var(--stitch-transition-base, 0.3s);
    }
  }
}
</style>
