import { ref, watch } from 'vue'
import { i18n, setLocale, getLocale, STORAGE_KEY, type AppLocale } from '@/locales'
import { apiService } from '@/services/ApiService'

/**
 * 语言管理 Composable（单例模式，同 useTheme）
 *
 * 持久化策略：localStorage 即时生效 + 后端 appearance 设置同步
 */

const locale = ref<AppLocale>(getLocale())

// 初始化 lang 属性
document.documentElement.setAttribute('lang', locale.value)

// 监听语言变化，同步到后端
let backendSyncTimer: ReturnType<typeof setTimeout> | null = null
watch(locale, (val) => {
  setLocale(val)
  // 防抖同步到后端（避免快速切换时频繁请求）
  if (backendSyncTimer) clearTimeout(backendSyncTimer)
  backendSyncTimer = setTimeout(() => {
    apiService.updateGroupSettings('appearance', { language: val }).catch(() => {
      // 后端同步失败不影响前端使用
    })
  }, 500)
})

/**
 * 从后端初始化语言设置
 * 在应用启动时调用（localStorage 优先，后端为 fallback）
 */
async function initLanguage(): Promise<void> {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh-CN' || saved === 'en-US') {
    locale.value = saved
    return
  }
  // 从后端 appearance 设置获取。
  // 令牌未就绪时不打后端：分组设置受鉴权保护，未登录请求会返回 403 并在控制台
  // 刷出一串 "API 请求失败: settings/appearance 403"。下面本来就 catch 掉并用
  // 默认值，功能不受影响，但噪音会淹没真正的报错。
  try {
    const { waitForAuthReady } = await import('@/utils/authReady')
    if (!(await waitForAuthReady())) {
      return
    }
    const settings = await apiService.fetchGroupSettings('appearance')
    if (settings.language === 'zh-CN' || settings.language === 'en-US') {
      locale.value = settings.language
      setLocale(settings.language)
    }
  } catch {
    // 后端不可用时使用默认值
  }
}

export interface UseLanguageReturn {
  locale: typeof locale
  setLanguage: (lang: AppLocale) => void
  initLanguage: typeof initLanguage
}

export function useLanguage(): UseLanguageReturn {
  function setLanguage(lang: AppLocale): void {
    locale.value = lang
  }

  return { locale, setLanguage, initLanguage }
}
