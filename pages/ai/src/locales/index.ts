import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
// 框架通用文案（菜单 / 登录页 / 消息提示）。登录页已复用框架的 ReLoginForm，
// 它使用 menu.login.*、msg.* 等框架键；这里把框架文案作为底稿合并进来，
// AI 自己的业务键覆盖同名项，避免登录页出现 "menu.login.form.loginName" 这类原样 key。
import zhFramework from '@repo/languages/modules/zh'
import enFramework from '@repo/languages/modules/en'

export type AppLocale = 'zh-CN' | 'en-US'

const STORAGE_KEY = 'app-language'

/**
 * 深合并两份 message 树：对象逐层合并，数组与标量由 override 覆盖。
 */
function mergeMessages(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const merged: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const previous = merged[key]
    merged[key] =
      previous &&
      typeof previous === 'object' &&
      !Array.isArray(previous) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
        ? mergeMessages(previous, value)
        : value
  }
  return merged
}

function detectInitialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': mergeMessages(zhFramework as Record<string, any>, zhCN as Record<string, any>),
    'en-US': mergeMessages(enFramework as Record<string, any>, enUS as Record<string, any>),
  },
  missingWarn: false,
  fallbackWarn: false,
})

export { i18n, STORAGE_KEY }

/**
 * 在非组件上下文中使用翻译（stores / composables / utils）
 */
export function t(key: string, named?: Record<string, unknown>): string {
  return i18n.global.t(key, named as any)
}

/**
 * 切换语言
 */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.setAttribute('lang', locale)
}

/**
 * 获取当前语言
 */
export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}
