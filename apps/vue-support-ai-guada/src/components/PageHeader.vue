<template>
  <div class="flex items-center justify-between gap-2 h-11 drag-region">
    <!-- 左侧：侧边栏切换按钮 -->
    <div class="flex items-center justify-start no-drag ml-3">
      <LTooltip v-if="!hideSidebarToggle" :content="layoutStore.sidebarVisible ? t('common.sidebar.collapse') : t('common.sidebar.expand')" placement="bottom">
        <!-- 纯图标按钮必须自带可访问名：LTooltip 只是鼠标悬浮提示，
             不构成 accessible name，屏幕阅读器只会念出「按钮」。 -->
        <div class="header-icon-btn" role="button" tabindex="0"
          :aria-label="layoutStore.sidebarVisible ? t('common.sidebar.collapse') : t('common.sidebar.expand')"
          :aria-pressed="layoutStore.sidebarVisible"
          @click="layoutStore.toggleSidebar()"
          @keydown.enter.prevent="layoutStore.toggleSidebar()"
          @keydown.space.prevent="layoutStore.toggleSidebar()">
          <LeftBarIcon class="w-5 h-5" />
        </div>
      </LTooltip>
    </div>

    <!-- 中间：标题区域 -->
    <div v-if="title || $slots.title" class="flex items-center flex-1 min-w-0">
      <slot name="title">
        <span class="text-sm font-semibold text-gray-800 dark:text-[#e8e9ed] m-0 truncate">{{ title }}</span>
      </slot>
    </div>

    <!-- 右侧：操作按钮组 -->
    <div class="flex items-center justify-end min-w-10 gap-2 no-drag mr-3">
      <!-- 顶栏环境信息（天气 / 活跃台风，开关关闭时组件内不渲染） -->
      <TopEnvironment />
      <slot name="actions" />
    </div>

    <!-- Electron 窗口控制按钮 -->
    <WindowControls v-if="isElectron && !hideWindowControls" />
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'
import { useI18n } from 'vue-i18n'
import LeftBarIcon from './icons/LeftBarIcon.vue'
import WindowControls from '@/components/WindowControls.vue'
import LTooltip from '@/components/ui/LTooltip.vue'
import TopEnvironment from '@/components/TopEnvironment.vue'

const { t } = useI18n()

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

/**
 * 页面通用标题栏组件
 * 提供侧边栏切换、标题展示和操作按钮插槽
 */
const layoutStore = useLayoutStore()

defineProps<{
  title?: string
  hideWindowControls?: boolean
  hideSidebarToggle?: boolean
}>()
</script>

<style scoped>
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>

<style>
.header-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    /* 原值 8px → md 档 */
    border-radius: var(--el-radius-md, 8px);
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.header-icon-btn:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.header-icon-btn.active {
    background: var(--color-sidebar-bg-hover);
    color: var(--color-text);
}

/* 动效降级：系统开启「减少动态效果」时，图标按钮的底色/文字直接到位。
   只关 .header-icon-btn 自己的 transition，不写通配 *，
   否则会把 el-tooltip / el-dropdown 内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
    .header-icon-btn {
        transition: none;
    }
}

/* 键盘焦点可见性：图标按钮是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环，这里补一个与按钮体系一致的主色环。
   指针样式原有 cursor: pointer 已在上面声明，这里不重复写。
   outline 与 :focus-visible 环必须成对出现：只写 outline: none 是净损害。 */
.header-icon-btn {
    outline: none;
}

.header-icon-btn:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
