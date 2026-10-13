<template>
  <!-- 全屏模式下悬浮对话面板（必须在 SidebarLayout 之前确保 #floating-chat 先于 Teleport 挂载） -->
  <FloatingChatPanel />

  <SidebarLayout :sidebarVisible="effectiveSidebarVisible" @update:sidebarVisible="handleSidebarUpdate"
    :sidebarWidth="285" :showToggleButton="false" sidebarPosition="left" :z-index="20" class="flex-1">
    <template #sidebar>
      <GlobalSidebar v-if="!isSettingsRoute" />
      <div v-else id="settings-sidebar-portal" class="h-full"></div>
    </template>
    <template #content>
      <div
        class="relative h-full flex-1 min-w-0 overflow-hidden content-clear-wallpaper border-l border-gray-200 dark:border-[#2f2f2f]"
        :style="contentMaxWidthVar">
        <RouterView />
      </div>
    </template>
  </SidebarLayout>

  <!-- 浏览器 Webview 浮层（跨会话持久，fixed 定位覆盖在预览占位区域上方） -->
  <BrowserWebviewLayer />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { apiService } from '@/services/ApiService'
import { getLocale } from '@/locales'
import { useSessionEvents } from '@/composables/useSessionEvents'
import { initKbDisplay, useKbDisplay } from '@/composables/useKbDisplay'
import { setPluginToolDisplays } from '@/utils/toolDisplay'
import SidebarLayout from './ui/SidebarLayout.vue'
import GlobalSidebar from './GlobalSidebar.vue'
import BrowserWebviewLayer from './BrowserWebviewLayer.vue'
import FloatingChatPanel from './chat/FloatingChatPanel.vue'

const layoutStore = useLayoutStore()
const route = useRoute()
const router = useRouter()

const { init: initSessionEvents, cleanup: cleanupSessionEvents } = useSessionEvents()

const isSettingsRoute = computed(() => route.name === 'SystemSettings')

// 右侧内容区显示宽度（窄屏 = 舒适阅读宽度居中 / 满屏 = 撑满剩余空间）。
// 走 CSS 自定义属性继承：挂在 RouterView 的外壳上，会话页消息流/输入框列、
// 设置中心卡片列、知识库问答栏都能通过 var(--content-max-width) 拿到同一宽度，
// 不必每个页面各自读设置。值只在此处定义一次。
const { askWidth } = useKbDisplay()
const contentMaxWidthVar = computed(() => ({
  '--content-max-width': askWidth.value === 'full' ? 'none' : '820px',
}))

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

const effectiveSidebarVisible = computed(() => layoutStore.sidebarVisible)

const handleSidebarUpdate = (val: boolean) => {
  layoutStore.setSidebarVisible(val)
}

// 加载工具展示文案注册表（按当前语言解析 %key% 引用）
function loadToolDisplays() {
  apiService.fetchToolDisplays(getLocale()).then((displays) => {
    setPluginToolDisplays(displays)
  }).catch((e) => {
    console.warn('加载工具文案失败，使用默认文案', e)
  })
}

// 全局快捷键：新建会话。Electron 用 Ctrl/Cmd+N；Web 下 Ctrl+N 是浏览器保留快捷键无法拦截，改用 Ctrl+Alt+N
const handleGlobalShortcut = (e: KeyboardEvent) => {
  if (e.isComposing || e.shiftKey || e.code !== 'KeyN') return
  if (!e.ctrlKey && !e.metaKey) return
  const matched = isElectron ? !e.altKey : e.altKey
  if (!matched) return
  e.preventDefault()
  router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
}

// 启动 SSE 连接 + 全局事件监听
onMounted(() => {
  console.log('[MainLayout] 启动 SSE 连接')
  apiService.connectSessionEvents()
  initSessionEvents()
  // 组件挂载后再加载外观设置，确保 content-clear-wallpaper 元素已存在
  layoutStore.loadAppearanceSettings()
  // 读取右侧内容区宽度偏好（幂等，知识库页重复调用无副作用），
  // 拿不到值时回落本地存储，再回落默认 narrow（820px）
  void initKbDisplay()

  loadToolDisplays()

  window.addEventListener('keydown', handleGlobalShortcut)
})

// 语言切换时重新拉取工具展示文案（后端按 lang 解析 %key% 引用）
watch(getLocale, () => {
  loadToolDisplays()
})

// 组件卸载时断开 SSE 连接，清理监听
onUnmounted(() => {
  console.log('[MainLayout] 断开 SSE 连接')
  cleanupSessionEvents()
  apiService.disconnectSessionEvents()
  window.removeEventListener('keydown', handleGlobalShortcut)
})
</script>

<style scoped>
/* 布局样式由 Tailwind 处理 */
</style>
