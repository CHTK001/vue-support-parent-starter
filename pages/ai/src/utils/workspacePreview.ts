/**
 * 工作区预览统一入口
 *
 * 职责：
 * 1. 链接打开方式管理（用户偏好：内置浏览器 / 外部浏览器 / 每次询问）
 * 2. 文件预览（通过 tabStore 直接操作）
 * 3. URL 预览（在内置浏览器中打开）
 *
 * 所有预览操作都会自动确保工作区侧边栏可见 + 进入预览模式。
 */

import { ElMessageBox } from 'element-plus'
import { nextTick } from 'vue'
import { useBrowserWebviewStore } from '@/stores/browserWebview'
import { useSessionStore } from '@/stores/session'
import { useLayoutStore } from '@/stores/layout'
import { useTabStore } from '@/stores/tab'
import { openInExternalBrowser } from '@/utils/browserUtils'
import { t } from '@/locales'
import { buildPelicanBikeUrl } from './pelicanBikePreview'

export { buildPelicanBikeUrl }

// ── 链接打开方式偏好管理 ──

export type LinkOpenMode = 'internal' | 'external' | 'ask'

const STORAGE_KEY = 'linkOpenMode'
const AUTO_SHOW_SIDEBAR_KEY = 'autoShowSidebar'
const SETTINGS_GROUP = 'browser'

let cachedMode: LinkOpenMode | null = null

/** autoShowSidebar 缓存（默认 false：不自动展开侧边栏） */
let cachedAutoShowSidebar: boolean | null = null

/** 从 localStorage 同步读取（首次调用时初始化） */
function getCachedMode(): LinkOpenMode {
    if (cachedMode === null) {
        const stored = typeof localStorage !== 'undefined'
            ? localStorage.getItem(STORAGE_KEY)
            : null
        cachedMode = (stored as LinkOpenMode) || 'ask'
    }
    return cachedMode
}

/** 更新缓存（供设置页面调用） */
export function setLinkOpenMode(mode: LinkOpenMode): void {
    cachedMode = mode
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, mode)
    }
}

/** 获取当前链接打开方式 */
export function getLinkOpenMode(): LinkOpenMode {
    return getCachedMode()
}

/** 从后端加载设置（应用启动时调用一次即可） */
export async function loadLinkOpenMode(): Promise<void> {
    try {
        // 令牌未就绪时不打后端：分组设置受鉴权保护，未登录请求会返回 403 并在控制台
        // 刷出一串 "API 请求失败: settings/browser 403"。功能不受影响（下面本来
        // 就 catch 掉并降级到 localStorage），但噪音会淹没真正的报错。
        const { waitForAuthReady } = await import('./authReady')
        if (!(await waitForAuthReady())) {
            return
        }
        const { apiService } = await import('@/services/ApiService')
        const response = await apiService.fetchGroupSettings(SETTINGS_GROUP)
        const mode = response.linkOpenMode as LinkOpenMode | undefined
        if (mode && ['internal', 'external', 'ask'].includes(mode)) {
            setLinkOpenMode(mode)
        }
        if (typeof response.autoShowSidebar === 'boolean') {
            setAutoShowSidebar(response.autoShowSidebar)
        }
    } catch {
        // 后端不可用时降级使用 localStorage 缓存
    }
}

// ── AI 浏览器侧边栏自动展开管理 ──

/** 同步读取 autoShowSidebar 缓存（首次调用时从 localStorage 初始化） */
export function getAutoShowSidebar(): boolean {
    if (cachedAutoShowSidebar === null) {
        const stored = typeof localStorage !== 'undefined'
            ? localStorage.getItem(AUTO_SHOW_SIDEBAR_KEY)
            : null
        cachedAutoShowSidebar = stored === 'true'
    }
    return cachedAutoShowSidebar
}

/** 更新 autoShowSidebar 缓存（供设置页面调用） */
export function setAutoShowSidebar(val: boolean): void {
    cachedAutoShowSidebar = val
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTO_SHOW_SIDEBAR_KEY, String(val))
    }
}

// ── 内部工具 ──

/** 判断是否为安全链接（仅允许 http/https） */
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/** 弹窗询问用户选择打开方式 */
async function showLinkChoiceDialog(url: string): Promise<void> {
    try {
        await ElMessageBox.confirm(
            url,
            t('session.workspace.selectLinkMode'),
            {
                confirmButtonText: t('session.workspace.internalBrowser'),
                cancelButtonText: t('session.workspace.externalBrowser'),
                distinguishCancelAndClose: true,
                type: 'info',
                customClass: 'link-choice-dialog',
            },
        )
        await previewUrl(url)
    } catch (action: any) {
        if (action === 'cancel') {
            openInExternalBrowser(url)
        }
    }
}

// ── 预览 API（统一入口） ──

/**
 * 预览工作区文件（打开文件预览标签）
 *
 * 直接通过 tabStore 操作：添加标签 + 选中 + 进入预览模式。
 * WorkspaceSidebar 的 watch 会自动加载文件内容。
 */
export async function previewFile(filePath: string): Promise<void> {
    const sessionStore = useSessionStore()
    if (!sessionStore.activeSessionId) return

    const layoutStore = useLayoutStore()
    const wasVisible = layoutStore.workspaceVisible
    layoutStore.workspaceVisible = true

    // 侧边栏从隐藏→可见时，WorkspaceSidebar 需要一个 tick 完成挂载并注册 watch
    if (!wasVisible) {
        await nextTick()
    }

    const tabStore = useTabStore()
    const name = filePath.replace(/\\/g, '/').split('/').pop() || filePath
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')).toLowerCase() : ''
    const tabKey = `file:${filePath}`

    tabStore.addTab({
        type: 'file',
        key: tabKey,
        name,
        path: filePath,
        extension: ext,
        size: 0,
        isPreview: true,
    })
    tabStore.enterPreviewMode()
    tabStore.selectTab(tabKey)
}

/**
 * Web 形态的内置浏览器：不依赖 Electron webview，把 URL 放入系统内嵌 iframe。
 */
async function previewUrlInWeb(url: string): Promise<void> {
    const browserStore = useBrowserWebviewStore()
    const sessionStore = useSessionStore()
    const layoutStore = useLayoutStore()
    const tabStore = useTabStore()
    const sessionId = sessionStore.activeSessionId || undefined
    const windowId = `web-${Date.now()}`
    browserStore.addWebview({
      windowId,
      url,
      title: '内置浏览器',
      partition: 'persist:web',
      preloadUrl: '',
      isVisible: false,
      metadata: { sessionId },
    })
    layoutStore.workspaceVisible = true
    await nextTick()
    tabStore.enterPreviewMode()
    tabStore.selectTab(`browser:${windowId}`)
}

/**
 * 预览 URL（在内置浏览器中打开）
 *
 * 创建浏览器窗口，setActive 后 tabStore 的 watch 自动同步标签。
 */
export async function previewUrl(url: string): Promise<void> {
    const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined
    if (!isElectron || !window.electronAPI?.createBrowserWindow) {
        await previewUrlInWeb(url)
        return
    }

    try {
        let sessionId: string | undefined
        try {
            const sessionStore = useSessionStore()
            sessionId = sessionStore.activeSessionId || undefined
        } catch {
            // store 未初始化时忽略
        }

        const result = await window.electronAPI!.createBrowserWindow(url, {
            sessionId,
            createdBy: sessionId,
        })

        if (result.success && result.window?.windowId) {
            const layoutStore = useLayoutStore()
            const wasVisible = layoutStore.workspaceVisible
            layoutStore.workspaceVisible = true

            // 侧边栏从隐藏→可见时，WorkspaceSidebar 需要一个 tick 完成挂载
            if (!wasVisible) {
                await nextTick()
            }

            const tabStore = useTabStore()
            tabStore.enterPreviewMode()
            tabStore.selectTab(`browser:${result.window.windowId}`)
        }
    } catch (error) {
        console.error('[workspacePreview] Failed to open URL:', error)
        window.electronAPI?.openExternal?.(url)
    }
}

/**
 * 内置浏览器默认页：一个自包含的代码渲染示例。
 *
 * 用 data URL 而非外链/本地路由，保证任何会话、任何工作目录都能打开；
 * 页面内不依赖网络，打开即可看到代码高亮效果。
 */
export function buildCodeRenderUrl(): string {
  const code = [
    'function buildRoute(providerId, model) {',
    '  const provider = resolveDbProviderByModel(model, providerId);',
    '  return { provider, model };',
    '}',
    '',
    'const route = buildRoute("sensenova", "deepseek-v4-flash");',
    'streamChat(route);',
  ].join('\n');
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>代码渲染预览</title>
<style>
  body { margin: 0; background: #f7f8fa; color: #1f2329; font: 14px/1.7 ui-monospace, SFMono-Regular, Consolas, monospace; }
  .wrap { max-width: 860px; margin: 32px auto; padding: 0 20px; }
  .head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .badge { padding: 2px 10px; border-radius: 999px; background: #e7f3ff; color: #1677ff; font-size: 12px; font-weight: 600; }
  pre { margin: 0; padding: 18px 20px; border: 1px solid #e5e6eb; border-radius: 10px; background: #fff; overflow: auto; }
  code { display: block; font: inherit; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><span class="badge">内置浏览器</span><span>默认代码渲染预览</span></div>
  <pre><code>${escaped}</code></pre>
</div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

/**
 * 打开链接（根据用户偏好自动选择方式）
 *
 * - internal: 内置浏览器预览
 * - external: 外部浏览器
 * - ask: 每次询问
 *
 * 非 http/https 链接始终通过外部浏览器打开。
 */
export async function openLink(url: string): Promise<void> {
    if (!url) return

    if (!isSafeUrl(url)) {
        openInExternalBrowser(url)
        return
    }

    const mode = getCachedMode()
    switch (mode) {
        case 'internal':
            await previewUrl(url)
            break
        case 'external':
            openInExternalBrowser(url)
            break
        case 'ask':
        default:
            await showLinkChoiceDialog(url)
            break
    }
}

/**
 * 智能预览：自动判断是文件路径还是 URL
 * - http(s):// → 内置浏览器
 * - 其他 → 工作区文件预览
 */
export function preview(target: string): void {
    if (/^https?:\/\//i.test(target)) {
        void previewUrl(target)
    } else {
        void previewFile(target)
    }
}
