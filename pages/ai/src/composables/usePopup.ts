// src/composables/usePopup.ts
import { message } from "@repo/core";
import { ref, h, type VNode } from 'vue'
import { ElMessageBox, ElNotification, ElButton, type ElMessageBoxOptions } from 'element-plus';
import { t } from '@/locales'

/**
 * 确认对话框配置选项
 */
export interface ConfirmOptions {
    type?: 'success' | 'info' | 'warning' | 'error'
    confirmText?: string
    cancelText?: string
}

/**
 * 输入弹窗配置选项
 */
export interface PromptOptions {
    defaultValue?: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    required?: boolean
    validation?: (value: string) => boolean
}

/**
 * 多行文本编辑配置
 */
export interface EditTextOptions {
    title?: string
    defaultValue?: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    required?: boolean
    rows?: number
}

/**
 * Toast 消息接口
 */
export interface ToastApi {
    success: (content: string, duration?: number) => void
    error: (content: string, duration?: number) => void
    warning: (content: string, duration?: number) => void
    info: (content: string, duration?: number) => void
    loading: (content: string, duration?: number) => any
}

/**
 * 通知消息接口
 */
export interface NotifyApi {
    success: (title: string, content: string, options?: any) => void
    error: (title: string, content: string, options?: any) => void
    warning: (title: string, content: string, options?: any) => void
    info: (title: string, content: string, options?: any) => void
}

/**
 * 加载状态接口
 */
export interface LoadingApi {
    start: (text?: string) => any
    wrap: <T>(promiseFn: Promise<T>, loadingText?: string) => Promise<T>
}

/**
 * usePopup 返回值类型
 */
export interface UsePopupReturn {
    confirm: (title: string, content: string, options?: ConfirmOptions) => Promise<boolean>
    confirmSuccess: (title: string, content: string, options?: ConfirmOptions) => Promise<boolean>
    confirmError: (title: string, content: string, options?: ConfirmOptions) => Promise<boolean>
    prompt: (title: string, options?: PromptOptions) => Promise<string | null>
    editText: (options?: EditTextOptions) => Promise<string | null>
    dialog: (options: { title: string; content: VNode | string; confirmText?: string; cancelText?: string }) => Promise<boolean>
    toast: ToastApi
    notify: NotifyApi
    loading: LoadingApi
    closeAll: () => void
}

/**
 * 常用弹窗 Hook
 * 在 Vue 组件上下文中使用，确保主题和配置一致性
 */
export function usePopup(): UsePopupReturn {
    // const loadingBar = useLoadingBar()

    /**
     * 确认对话框
     */
    const confirm = (title: string, content: string, options: ConfirmOptions = {}): Promise<boolean> => {
        const {
            type = 'warning',
            confirmText = t('common.confirm'),
            cancelText = t('common.cancel')
        } = options

        return new Promise((resolve) => {
            ElMessageBox({
                title,
                message: content,
                type,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                showCancelButton: true,
                distinguishCancelAndClose: true,
                dangerouslyUseHTMLString: true
            }).then(() => {
                resolve(true)
            }).catch(() => {
                resolve(false)
            })
        })
    }

    /**
     * 成功确认对话框
     */
    const confirmSuccess = (title: string, content: string, options: ConfirmOptions = {}): Promise<boolean> => {
        return confirm(title, content, { ...options, type: 'success' })
    }

    /**
     * 危险操作确认对话框
     */
    const confirmError = (title: string, content: string, options: ConfirmOptions = {}): Promise<boolean> => {
        return confirm(title, content, { ...options, type: 'error' })
    }

    /**
     * 单行输入弹窗
     */
    const prompt = (title: string, options: PromptOptions = {}): Promise<string | null> => {
        const {
            defaultValue = '',
            placeholder = t('session.popup.inputPlaceholder'),
            confirmText = t('common.confirm'),
            cancelText = t('common.cancel'),
            required = true,
            validation
        } = options

        return new Promise((resolve) => {
            ElMessageBox.prompt('', title, {
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                inputPlaceholder: placeholder,
                inputValue: defaultValue,
                dangerouslyUseHTMLString: true,
                distinguishCancelAndClose: true
            }).then(({ value }) => {
                const inputValue = value.trim()

                if (required && !inputValue) {
                    message.error(t('session.popup.contentRequired'))
                    return resolve(null)
                }

                if (validation && !validation(inputValue)) {
                    return resolve(null)
                }

                resolve(inputValue)
            }).catch(() => {
                resolve(null)
            })
        })
    }

    /**
     * 多行文本编辑弹窗
     */
    const editText = (options: EditTextOptions = {}): Promise<string | null> => {
        const {
            title = t('session.popup.editTitle'),
            defaultValue = '',
            placeholder = t('session.popup.inputPlaceholder'),
            confirmText = t('common.save'),
            cancelText = t('common.cancel'),
            required = true,
            rows = 6
        } = options

        // 使用 Element Plus 的 VNode 方式创建自定义内容
        const container: VNode = h('div', {
            style: {
                width: '100%',
                padding: '12px 0'
            }
        }, [
            h('textarea', {
                value: defaultValue,
                placeholder,
                style: {
                    width: '100%',
                    minHeight: `${rows * 24}px`,
                    padding: '12px',
                    border: '1px solid #dcdfe6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                },
                onInput: (e: Event) => {
                    // 注意：这里我们无法直接访问 textarea 元素
                    // 在 beforeClose 回调中仍然需要通过 DOM 查询获取值
                }
            })
        ])

        return new Promise((resolve) => {
            ElMessageBox({
                title,
                message: container,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                showCancelButton: true,
                distinguishCancelAndClose: true,
                customClass: 'w-full',
                beforeClose: (action, instance: any, done) => {
                    if (action === 'confirm') {
                        // 通过查询 DOM 获取 textarea 的值
                        const textarea = instance.message?.el?.querySelector('textarea')
                        const value = textarea ? textarea.value.trim() : ''

                        if (required && !value) {
                            message.error(t('session.popup.contentRequired'))
                            return
                        }

                        done()
                        resolve(value)
                    } else {
                        done()
                        resolve(null)
                    }
                }
            }).catch(() => {
                resolve(null)
            })
        })
    }

    /**
     * 通用自定义对话框
     */
    const dialog = (options: { title: string; content: VNode | string; confirmText?: string; cancelText?: string }): Promise<boolean> => {
        return new Promise((resolve) => {
            ElMessageBox({
                title: options.title,
                message: options.content,
                confirmButtonText: options.confirmText || t('common.confirm'),
                cancelButtonText: options.cancelText || t('common.cancel'),
                showCancelButton: true,
                distinguishCancelAndClose: true,
            }).then(() => {
                resolve(true)
            }).catch(() => {
                resolve(false)
            })
        })
    }

    /**
     * Toast 消息提示
     */
    /**
     * Toast 消息提示。
     *
     * <p>注意：@repo/core 的 message.success 签名是 (文案, options) —— **第一个参数是文案本身**，
     * options 只认 { plain / duration / parseHtml }。此前这里按 Element Plus 的写法传了
     * 单个对象 { message, duration, showClose }，于是对象被当成文案直接渲染，
     * 界面上出现 `{ "message": "已复制", "duration": 2000, "showClose": true }` 这样的裸 JSON。</p>
     */
    const toast: ToastApi = {
        success: (content: string, duration: number = 2000): void => {
            message.success(content, { duration })
        },

        error: (content: string, duration: number = 3000): void => {
            message.error(content, { duration })
        },

        warning: (content: string, duration: number = 2500): void => {
            message.warning(content, { duration })
        },

        info: (content: string, duration: number = 2000): void => {
            message.info(content, { duration })
        },

        loading: (content: string, duration: number = 0) => {
            // message.loading 不在 Element Plus 类型定义中，但运行时可用
            const messageFn = ElMessage as typeof ElMessage & {
                loading(opts: Record<string, unknown>): unknown
            };
            // 同上：ElMessage.loading 接受 { message, duration }，
            // 但为与 @repo/core 保持一致，这里走原生 ElMessage，文案仍是第一个参数。
            return messageFn.loading({
                message: content,
                duration
            })
        }
    }

    /**
     * 通知消息
     */
    const notify: NotifyApi = {
        success: (title: string, content: string, options: any = {}): void => {
            ElNotification.success({
                title,
                message: content,
                duration: 3000,
                ...options
            })
        },

        error: (title: string, content: string, options: any = {}): void => {
            ElNotification.error({
                title,
                message: content,
                duration: 5000,
                ...options
            })
        },

        warning: (title: string, content: string, options: any = {}): void => {
            ElNotification.warning({
                title,
                message: content,
                duration: 4000,
                ...options
            })
        },

        info: (title: string, content: string, options: any = {}): void => {
            ElNotification.info({
                title,
                message: content,
                duration: 3000,
                ...options
            })
        }
    }

    /**
     * 加载状态管理
     */
    const loading: LoadingApi = {
        start: (text?: string): any => {
            return toast.loading(text || t('session.popup.processing'))
        },

        wrap: async <T>(promiseFn: Promise<T>, loadingText: string = t('session.popup.processing')): Promise<T> => {
            const hide = loading.start(loadingText)
            try {
                const result = await promiseFn
                // loading.finish()
                if (hide && typeof hide === 'function') hide()
                return result
            } catch (error) {
                if (hide && typeof hide === 'function') hide()
                throw error
            }
        }
    }

    /**
     * 关闭所有消息和弹窗
     */
    const closeAll = (): void => {
        message.closeAll()
        // ElMessageBox 没有 closeAll 方法
    }

    return {
        // 确认对话框
        confirm,
        confirmSuccess,
        confirmError,

        // 输入弹窗
        prompt,
        editText,
        dialog,

        // 消息提示
        toast,

        // 通知
        notify,

        // 加载状态
        loading,

        // 工具方法
        closeAll,
    }
}

export default usePopup
