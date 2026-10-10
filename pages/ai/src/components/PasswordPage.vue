<template>
  <div class="flex flex-col h-full">
    <CustomTitlebar />
    <div class="flex-1 min-h-0 flex items-center justify-center bg-gradient-to-br from-[color-mix(in_srgb,var(--el-color-primary)_8%,var(--el-bg-color))] to-[color-mix(in_srgb,var(--el-color-primary)_18%,var(--el-bg-color))] p-4">
        <!-- 卡片：koi 规约不加装饰投影，边界由 border 承载（浅色下卡片与页面底色同源，
             靠这条边框 + rounded-2xl 切出层次；深色下 bg 变深、边框同样跟随主题） -->
        <div class="flex flex-col md:flex-row bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)] rounded-2xl overflow-hidden max-w-4xl w-full">
            <!-- 左侧说明区域 -->
            <div
                class="hidden md:flex md:w-1/2 bg-gradient-to-br from-[var(--el-color-primary)] to-[var(--el-color-primary-dark-2)] items-center justify-center p-8">
                <div class="text-center text-[var(--el-color-white)]">
                    <h1 class="text-3xl font-bold mb-4">{{ t('ui.password.securityTitle') }}</h1>
                    <p class="text-[color-mix(in_srgb,var(--el-color-white)_85%,transparent)] mb-6">{{ t('ui.password.securityDesc') }}</p>
                    <div class="space-y-4 text-left">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 leading-none">
                                <svg class="h-5 w-5 text-[color-mix(in_srgb,var(--el-color-success)_45%,var(--el-color-white))]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <p class="ml-3 text-[color-mix(in_srgb,var(--el-color-white)_85%,transparent)] text-sm">{{ t('ui.password.tip1') }}</p>
                        </div>

                        <div class="flex items-center">
                            <div class="flex-shrink-0 leading-none">
                                <svg class="h-5 w-5 text-[color-mix(in_srgb,var(--el-color-success)_45%,var(--el-color-white))]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <p class="ml-3 text-[color-mix(in_srgb,var(--el-color-white)_85%,transparent)] text-sm">{{ t('ui.password.tip2') }}</p>
                        </div>

                        <div class="flex items-center">
                            <div class="flex-shrink-0 leading-none">
                                <svg class="h-5 w-5 text-[color-mix(in_srgb,var(--el-color-success)_45%,var(--el-color-white))]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <p class="ml-3 text-[color-mix(in_srgb,var(--el-color-white)_85%,transparent)] text-sm">{{ t('ui.password.tip3') }}</p>
                        </div>

                        <div class="flex items-center">
                            <div class="flex-shrink-0 leading-none">
                                <svg class="h-5 w-5 text-[color-mix(in_srgb,var(--el-color-success)_45%,var(--el-color-white))]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <p class="ml-3 text-[color-mix(in_srgb,var(--el-color-white)_85%,transparent)] text-sm">{{ t('ui.password.tip4') }}</p>
                        </div>
                    </div>
                </div>

            </div>

            <!-- 右侧表单区域 -->
            <div class="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-[var(--el-text-color-primary)] mb-2">{{ t('ui.password.title') }}</h2>
                    <p class="text-[var(--el-text-color-secondary)]" v-if="canReset">{{ t('ui.password.firstLoginDesc') }}</p>
                    <p class="text-[var(--el-text-color-secondary)]" v-else>{{ t('ui.password.noPermission') }}</p>
                </div>

                <!-- 用户名表单 -->
                <div v-if="canReset">
                    <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="mt-4">
                        <el-form-item prop="username" class="mb-4">
                            <el-input v-model="form.username" :placeholder="t('ui.password.inputUsername')" size="large">
                                <template #prefix>
                                    <el-icon class="text-[var(--el-text-color-placeholder)]">
                                        <UserIcon />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>

                        <el-form-item :label="t('ui.password.password')" prop="password" class="mb-4">
                            <el-input v-model="form.password" type="password" show-password :placeholder="t('ui.password.inputPassword')"
                                size="large">
                                <template #prefix>
                                    <el-icon class="text-[var(--el-text-color-placeholder)]">
                                        <LockIcon />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>

                        <el-form-item :label="t('ui.password.confirmPassword')" prop="confirmPassword" class="mb-6">
                            <el-input v-model="form.confirmPassword" type="password" show-password :placeholder="t('ui.password.inputPasswordAgain')"
                                size="large">
                                <template #prefix>
                                    <el-icon class="text-[var(--el-text-color-placeholder)]">
                                        <LockIcon />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-form>
                </div>

                <div v-else class="w-full text-center py-8">
                    <div class="mt-6 bg-[var(--el-color-danger-light-9)] border border-[var(--el-color-danger-light-5)] rounded-xl p-5 text-left">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-6 w-6 text-[var(--el-color-danger)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-medium text-[var(--el-color-danger)]">{{ t('ui.password.permissionTitle') }}</h3>
                                <div class="mt-3 text-sm text-[var(--el-color-danger)]">
                                    <p class="mb-2">{{ t('ui.password.permissionDesc') }}</p>
                                    <ol class="list-decimal pl-5 space-y-1">
                                        <li>{{ t('ui.password.step1') }}</li>
                                        <li>{{ t('ui.password.step2') }} <code
                                                class="bg-[color-mix(in_srgb,var(--el-color-danger)_20%,transparent)] px-1.5 py-0.5 rounded text-[var(--el-color-danger)] font-mono">password_is_set.txt</code>
                                            文件</li>
                                        <li>{{ t('ui.password.step3') }}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 设置按钮 -->
                <el-button v-if="canReset" type="primary" round size="large" :loading="loading" @click="handleLogin"
                    class="mb-6 py-3 font-medium rounded-lg w-full">
                    <template #icon>
                        <LoginIcon />
                    </template>
                    {{ loading ? t('ui.password.setting') : t('ui.password.setupNow') }}
                </el-button>

                <!-- 移动端安全提醒 -->
                <div class="md:hidden space-y-4 mb-6" v-if="canReset">
                    <div class="bg-[var(--el-color-info-light-9)] border-l-4 border-l-[var(--el-color-info)] p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-[var(--el-color-info)]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-[var(--el-color-info)]">
                                    <strong>{{ t('ui.password.securityTip') }}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[var(--el-color-warning-light-9)] border-l-4 border-l-[var(--el-color-warning)] p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-[var(--el-color-warning)]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-[var(--el-color-warning)]">
                                    <strong>{{ t('ui.password.resetTip') }}</strong>
                                        <code class="bg-[var(--el-fill-color)] px-1 rounded">password_is_set.txt</code> 文件并刷新本页面。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="md:hidden">
                    <div class="bg-[var(--el-color-danger-light-9)] border-l-4 border-l-[var(--el-color-danger)] p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-[var(--el-color-danger)]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-[var(--el-color-danger)]">
                                    {{ t('ui.password.noPermissionContact') }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<!-- @ts-ignore - Element Plus 组件类型缺失 -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    PersonOutlined as UserIcon,
    LockOutlined as LockIcon,
    LogInOutlined as LoginIcon
} from '@vicons/material'

import { useRouter } from 'vue-router'

// @ts-ignore - ApiService 尚未迁移到 TypeScript
import { apiService } from '../services/ApiService'
import { usePopup } from '../composables/usePopup'
import { useStorage } from '@vueuse/core'
import CustomTitlebar from './CustomTitlebar.vue'

// Element Plus 组件导入
import {
    ElForm,
    ElFormItem,
    ElInput,
    ElSegmented,
    ElIcon,
    ElButton,
    ElResult
} from 'element-plus'

// 消息提示
const { toast, confirmSuccess } = usePopup()
const { t } = useI18n()

const router = useRouter()

// 登录方式切换 - 类型化
const loginType = useStorage<string>('login-type', 'phone')

// 登录选项 - 类型化
const loginTypeOptions = [
    {
        label: '手机账户',
        value: 'phone'
    },
    {
        label: '邮箱账户',
        value: 'email'
    }
]

const canReset = ref(false)

// 表单数据 - 类型化
interface PasswordForm {
    username: string;
    password: string;
    confirmPassword: string;
}

const form = reactive<PasswordForm>({
    username: '',
    password: '',
    confirmPassword: ''
})

// 加载状态 - 类型化
const loading = ref(false)

// 表单验证规则 - 类型化
const rules = reactive({
    username: {
        required: true,
        trigger: ['input', 'blur'],
        validator: (rule: any, value: string, callback: any) => {
            if (!value) {
                callback(new Error(t('ui.password.inputUsername')))
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
        message: t('ui.password.inputPassword')
    },
    confirmPassword: {
        required: true,
        trigger: ['input', 'blur'],
        validator: (rule: any, value: string, callback: any) => {
            if (!value) {
                callback(new Error(t('ui.password.inputPasswordAgain')))
                return
            }
            if (value !== form.password) {
                callback(new Error(t('ui.password.passwordMismatch')))
                return
            }
            callback()
        }
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
                // 构建重置参数
                const resetData = {
                    username: form.username,
                    password: form.password,
                }
                
                await apiService.resetPrimayPassword(resetData);
                await confirmSuccess(t('ui.password.setupSuccessTitle'), t('ui.password.setupSuccessDesc'));
                router.replace('/')

            } catch (error: any) {
                console.error(error)
                toast.error(error.message || error.toString())
            } finally {
                loading.value = false
            }
        } else {
            toast.error(t('ui.login.checkInput'))
        }
    })
}

onMounted(async (): Promise<void> => {
    try {
        await apiService.checkResetPassword()
        canReset.value = true
    } catch (error) {
        console.error(error)
        canReset.value = false
    }
})

</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 本文件原先把一整套靛蓝色（#4f46e5 / #4338ca / #3730a3）硬覆盖到
      .el-button--primary 上，等于把「设置密码」这个主按钮钉死在单一配色，
      9 套主题（涂鸦本 / 蒸汽朋克 / 赛博朋克 …）下都不会跟随。
      改为 --el-color-primary 及其 dark-2 派生档后，这段覆盖退化成对
      Element Plus 默认取值的复述：既跟随主题，又不改变任何行为。
   2. 输入框聚焦描边同样写死 #4f46e5，改为 --el-color-primary。
      保留这条覆盖（而不是删掉交给 EP 默认）是为了不改动现有聚焦观感。
   3. 卡片 / 容器不加投影；圆角与过渡统一取令牌。
   ============================================================================ */

.custom-segmented .el-segmented {
    --el-segmented-item-selected-color: var(--el-text-color-primary);
    --el-segmented-item-selected-bg-color: var(--el-bg-color);
    --el-border-radius-base: var(--el-radius-lg, 12px);
    padding: 8px 8px;
}

.custom-segmented .el-segmented__item {
    /* 原值 12px → lg 档 */
    border-radius: var(--el-radius-lg, 12px);
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
    padding: 5px 30px;
    margin-left: 10px;

}

.custom-segmented .el-segmented__item:first-child {
    margin-left: 0;
}

/* 选中项是从凹槽里「抬起来」的那一块，投影在这里是功能必需的（不是卡片投影）：
   去掉就分不清选中的是哪一项 */
.custom-segmented .el-segmented__item.is-selected {
    /* 原值 12px → lg 档 */
    border-radius: var(--el-radius-lg, 12px);
    box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
}

:deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

:deep(.el-input.is-focus .el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-button--primary) {
    --el-button-bg-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
    --el-button-hover-bg-color: var(--el-color-primary-dark-2);
    --el-button-hover-border-color: var(--el-color-primary-dark-2);
    --el-button-active-bg-color: var(--el-color-primary-dark-2);
    --el-button-active-border-color: var(--el-color-primary-dark-2);
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
    .custom-segmented .el-segmented__item {
        transition: none;
    }
}
</style>
