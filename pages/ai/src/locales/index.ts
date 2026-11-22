import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
// 框架通用文案（菜单 / 登录页 / 消息提示）。登录页已复用框架的 ReLoginForm，
// 它使用 menu.login.*、msg.* 等框架键；这里把框架文案作为底稿合并进来，
// AI 自己的业务键覆盖同名项，避免登录页出现 "menu.login.form.loginName" 这类原样 key。
import zhFramework from '@repo/languages/modules/zh'
import enFramework from '@repo/languages/modules/en'
// 框架 i18n 实例（@repo/languages 默认导出）：@repo/core 的 httpCrypto 等框架层
// 用它翻译兜底文案（如 msg.requestFailed）。该实例懒装载（messages: {}），
// monitor 等应用由 createVueApp 在挂载前 ensureLocaleMessages 装载；本应用
// mountAiApp 自装配绕过了那一步，必须自行同步（见 syncFrameworkLocale）。
import frameworkI18n, { ensureLocaleMessages as ensureFrameworkMessages } from '@repo/languages'

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
  // mergeMessages 深合并出的消息树类型展开过深（TS2589），断言成宽松签名调用
  return (i18n.global as any).t(key, named as any)
}

/**
 * 切换语言
 */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.setAttribute('lang', locale)
  // 框架实例（httpCrypto 兜底文案等）同步切换，避免切语言后框架层文案仍是旧语言
  void syncFrameworkLocale(locale)
}

/**
 * AI 侧 locale（zh-CN / en-US）映射到框架实例的语言键（zh / en）。
 */
function frameworkLocaleKey(locale: AppLocale): 'zh' | 'en' {
  return locale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/**
 * 同步框架 i18n 实例：装载对应语言包并对齐 locale。
 *
 * httpCrypto（请求失败兜底文案）等框架层代码用的是 @repo/languages 的实例，
 * 不是本应用的 i18n；不同步它，失败弹窗会把 "msg.requestFailed" 原样吐给用户。
 */
export async function syncFrameworkLocale(locale: AppLocale = getLocale()): Promise<void> {
  const key = frameworkLocaleKey(locale)
  await ensureFrameworkMessages(key)
  frameworkI18n.global.locale.value = key
}

/**
 * 获取当前语言
 */
export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}
