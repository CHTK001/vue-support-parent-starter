<template>
  <div class="flex flex-col h-full">
    <CustomTitlebar />
    <div class="flex-1 flex items-center justify-center bg-surface p-5">
      <!-- 统一表面卡片（re-surface = 组件库 ReStatCard 规格：16px 圆角 / 无边框 / 双层柔光） -->
      <div class="w-full max-w-md re-surface">
        <div class="text-center mb-7">
          <div class="flex items-center justify-center gap-3 mb-3">
            <h1 class="text-3xl font-semibold text-(--color-text) m-0">{{ brandTitle }}</h1>
          </div>
          <p class="text-sm text-(--color-text-gray) m-0">{{ t('ui.login.welcome') }}</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="flex flex-col gap-4"
          @keyup.enter="handleLogin">
          <el-form-item prop="username" class="mb-0">
            <el-input v-model="form.username" :placeholder="t('ui.login.username')" size="large" clearable>
              <template #prefix>
                <el-icon class="text-(--color-text-gray)">
                  <UserIcon />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" class="mb-0">
            <el-input v-model="form.password" type="password" show-password :placeholder="t('ui.login.password')"
              size="large">
              <template #prefix>
                <el-icon class="text-(--color-text-gray)">
                  <LockIcon />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div class="flex justify-between items-center">
            <el-checkbox v-model="rememberMe">{{ t('ui.login.rememberMe') }}</el-checkbox>
          </div>

          <UiButton type="primary" size="large" block :disabled="loading" class="mt-1" @click="handleLogin">
            {{ loading ? t('ui.login.logging') : t('ui.login.submit') }}
          </UiButton>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    PersonOutlined as UserIcon,
    LockOutlined as LockIcon
} from '@vicons/material'

import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth'
import { usePopup } from '../composables/usePopup'
import CustomTitlebar from './CustomTitlebar.vue'
import UiButton from './ui/UiButton.vue'
import { resolveBrandTitle } from '@/utils/branding'

// Element Plus 组件导入
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElIcon,
  ElCheckbox
} from 'element-plus'

const authStore = useAuthStore()
// 消息提示
const { toast } = usePopup()
const { t } = useI18n()

const router = useRouter()

// 品牌名统一取自 app.yaml（app.title），与标题栏、浏览器标题同源，此处不再硬编码
const brandTitle = computed(() => resolveBrandTitle())

// 登录方式 - 固定为邮箱登录
const loginType = 'email'

// 表单数据 - 类型化
interface LoginForm {
  username: string;
  password: string;
}

const form = reactive<LoginForm>({
  username: '',
  password: ''
})

// 记住我 - 类型化
const rememberMe = ref(false)

// 加载状态 - 类型化
const loading = ref(false)

// 表单验证规则 - 类型化
const rules = reactive({
  username: {
    required: true,
    trigger: ['input', 'blur'],
    validator: (rule: any, value: string, callback: any) => {
      if (!value) {
        callback(new Error(t('ui.login.requireUsername')))
        return
      }
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (!usernameRegex.test(value)) {
        callback(new Error(t('ui.login.usernameFormat')))
        return
      }
      callback()
    }
  },
  password: {
    required: true,
    trigger: ['input', 'blur'],
    message: t('ui.login.requirePassword')
  }
})

// 表单引用 - 类型化
const formRef = ref<any>(null)

// 登录处理 - 类型化
const handleLogin = async (): Promise<void> => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        // 构建登录参数
        const loginData = {
          type: 'email' as const,
          username: form.username,
          password: form.password,
          rememberMe: rememberMe.value  // 传递记住我状态
        }

        await authStore.login(loginData)
        const redirect = router.currentRoute.value.query?.redirect
        // 只接受站内相对路径，避免开放重定向
        const target =
          typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
            ? redirect
            : '/'
        router.replace(target)
      } catch (error: any) {
        console.error('登录失败:', error)
        
        // 根据错误类型显示友好的提示信息
        let errorMessage = t('ui.login.failed')
        
        // 网络错误
        if (error.isNetworkError || error.message?.includes('无法连接到后端服务')) {
          errorMessage = t('ui.login.cannotConnect')
        }
        // 用户名或密码错误（401）
        else if (error.statusCode === 401 || error.message?.includes('用户名或密码错误')) {
          errorMessage = t('ui.login.invalidCredentials')
        }
        // 必填字段缺失（400）
        else if (error.statusCode === 400 || error.message?.includes('不能为空')) {
          errorMessage = t('ui.login.requireBoth')
        }
        // 其他已知错误
        else if (error.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage)
      } finally {
        loading.value = false
      }
    } else {
      toast.error(t('ui.login.checkInput'))
    }
  })
}
</script>

<style scoped>
/* Element Plus 控件外观统一到本应用的表面/边框变量（暗色模式自动跟随） */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  /* 原值 var(--size-surface-radius)（=20px）→ xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background-color: var(--el-bg-color);
  transition: all 0.2s ease;
  padding: 4px 12px;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 12px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
  color: var(--color-text-gray);
}

/* 动效降级：系统开启「减少动态效果」时，输入框的描边变化改为瞬间切换。
   输入框本体是 Element Plus 组件，必须用 :deep() 才够得到它的内部 DOM。
   特别说明：上面 .el-input.is-focus 那条 inset 主色描边是焦点指示本身，
   它是静态 box-shadow 声明 —— 关掉 transition 只会让光环瞬间出现，不会消失，
   键盘用户的焦点可见性完全不受影响。 */
@media (prefers-reduced-motion: reduce) {
  :deep(.el-input__wrapper) {
    transition: none;
  }
}
</style>