<template>
  <div v-if="isElectron" class="session-window-list">
    <!-- 头部 -->
    <div class="shrink-0 flex items-center justify-between px-2">
      <h3 class="text-sm font-normal text-gray-500 dark:text-gray-400 whitespace-nowrap mx-2">
        {{ t('chat.workspace.browserWindow') }}
      </h3>
      <el-button text class="window-add-btn" @click.stop="emit('create')" :disabled="!sessionId">
        <el-icon size="16">
          <Plus />
        </el-icon>
      </el-button>
    </div>

    <!-- 窗口列表 -->
    <div v-if="store.sessionWebviews.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-400 text-xs">
      {{ t('chat.workspace.noBrowserWindow') }}
    </div>
    <div v-else class="overflow-y-auto py-2 px-1 space-y-0.5" style="max-height: 160px;">
      <div v-for="win in store.sessionWebviews" :key="win.windowId"
        class="mx-1 px-2 py-1 flex items-center gap-1 cursor-pointer transition-all duration-200 rounded" :class="{
          'bg-gray-100 dark:bg-gray-800': isActive(win.windowId),
          'hover:bg-gray-100 dark:hover:bg-[#2a2c30]': !isActive(win.windowId)
        }" @click="emit('activate', win.windowId)">
        <!-- 网页 favicon -->
        <img v-if="win.favicon" :src="win.favicon" class="w-4 h-4 rounded-sm shrink-0 object-contain" alt=""
          @error="(e: Event) => onFaviconImageError(e, win.windowId)" />
        <span v-else class="w-4 h-4 shrink-0 flex items-center justify-center text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path
              d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>

        <!-- 窗口标题 -->
        <span class="text-xs text-gray-600 dark:text-gray-400 truncate flex-1" :title="win.title || t('chat.workspace.unnamedWindow')">
          {{ truncateTitle(win.title || t('chat.workspace.unnamedWindow')) }}
        </span>

        <!-- 关闭按钮 -->
        <el-icon size="12" class="text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
          @click.stop="emit('close', win.windowId)">
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useBrowserWebviewStore } from '@/stores/browserWebview'
import { useTabStore } from '@/stores/tab'

const { t } = useI18n()

const props = defineProps<{
  sessionId: string | null
}>()

const emit = defineEmits<{
  activate: [windowId: string]
  close: [windowId: string]
  create: []
}>()

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined
const store = useBrowserWebviewStore()
const tabStore = useTabStore()

function truncateTitle(title: string, maxLength: number = 20): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength) + '...'
}

function onFaviconImageError(event: Event, windowId: string): void {
  console.warn('[Favicon] window list image failed', { windowId })
  store.updateWebview(windowId, { favicon: undefined })
  ;(event.target as HTMLImageElement).style.display = 'none'
}

/** 判断窗口是否激活（直接从 tabStore 读取，消除 prop 依赖） */
function isActive(windowId: string): boolean {
  return tabStore.activeTabKey === `browser:${windowId}`
}

// 监听会话 ID 变化
watch(() => props.sessionId, () => {
  store.setCurrentSession(props.sessionId)
}, { immediate: true })

onMounted(() => {
  store.setCurrentSession(props.sessionId)
})

onUnmounted(() => {
  store.setPreviewRect(null)
})
</script>

<style scoped>
/* 令牌口径：原 var(--color-text-secondary, #9ca3af) / var(--color-primary, #3b82f6)
   / var(--color-hover-bg, #f3f4f6) 里的 --color-text-secondary 与 --color-hover-bg
   在 refactor.css 里都不存在，一直是靠写死的 hex 在渲染，换肤必然对不上。 */
.window-add-btn {
  padding: 4px;
  margin-right: 8px;
  /* 原值 var(--color-text-secondary, #9ca3af) → 次级文字色令牌 */
  color: var(--el-text-color-secondary);
  transition: color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.window-add-btn:hover {
  /* 原值 var(--color-primary, #3b82f6) → 主色令牌 */
  color: var(--el-color-primary);
  /* 原值 var(--color-hover-bg, #f3f4f6) → 悬停底色令牌 */
  background: var(--el-fill-color-light);
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
}

/* 动效降级：系统开启「减少动态效果」时，hover 的颜色渐变直接到位。
   这里只关 .window-add-btn 自己的 transition，不写通配 *，
   否则会把 el-button 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .window-add-btn {
    transition: none;
  }
}

/* 键盘焦点可见性：窗口行是带 @click 的 div（不是 button），浏览器不给默认焦点环。
   清单给出的选择器 mx-1 就是这一行身上的 Tailwind 工具类，
   scoped 编译后会自动带上本组件的 data-v 标记，因此只命中这一行、不会外溢。
   指针样式沿用模板里已有的 cursor-pointer，不重复声明。 */
.mx-1 {
  outline: none;
}

.mx-1:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
