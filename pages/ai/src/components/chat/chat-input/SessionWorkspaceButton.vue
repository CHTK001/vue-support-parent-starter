<!--
  会话页的「工作目录」入口。

  <p>新建会话时工作目录在 ChatInputToolbar 的上方工具条里选；会话一旦建好，
  那条工具条就不再出现，于是「项目」只能在建会话那一刻选一次，之后再也改不了。
  这个按钮把同一份能力补进已有会话：左组里一枚图标按钮，点开复用同一个
  WorkspaceSelectorPopover（含「添加项目」），选中后由父级持久化到会话。</p>

  <p>只做入口，不持有会话状态：当前路径由父级以 props 传入，选中结果以 change 事件上抛，
  避免组件自己再存一份 workspacePath 与父级分叉。</p>
-->
<template>
  <!-- 底栏变体（用户需求 2026-11-12）：输入卡最底部常驻一行，
       左边目录名，中间完整路径，右边「本地 / 远端」徽标。
       它是「这一整个会话的落点」，不是本轮输入的一部分，所以不占工具条位置。 -->
  <button v-if="variant === 'bar'" ref="buttonRef" class="swb-bar" :class="{ 'is-active': !!currentPath }"
    :aria-label="tooltip" :aria-expanded="visible" @click.stop="visible = !visible">
    <el-icon size="14" class="swb-bar__icon">
      <FolderOpen24Regular />
    </el-icon>
    <span class="swb-bar__label">{{ displayName }}</span>
    <span v-if="currentPath" class="swb-bar__path" :title="currentPath">{{ currentPath }}</span>
    <span v-if="currentPath" class="swb-badge" :class="isRemote ? 'is-remote' : 'is-local'">{{ locationLabel }}</span>
    <el-icon size="12" class="swb-bar__chev">
      <ChevronDown16Regular />
    </el-icon>
  </button>

  <LTooltip v-else :content="tooltip" placement="top">
    <button ref="buttonRef" class="swb-btn" :class="{ 'is-active': !!currentPath }" :aria-label="tooltip"
      @click.stop="visible = !visible">
      <el-icon size="16">
        <FolderOpen24Regular />
      </el-icon>
    </button>
  </LTooltip>

  <WorkspaceSelectorPopover v-model:visible="visible" :anchor-el="buttonRef" :current-workspace-path="currentPath"
    :public-path="publicPath" @select="handleSelect" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen24Regular, ChevronDown16Regular } from '@vicons/fluent'
import LTooltip from '../../ui/LTooltip.vue'
import WorkspaceSelectorPopover from './WorkspaceSelectorPopover.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { isRemoteWorkspacePath } from '@/utils/workspacePath'

const props = defineProps<{
  /** 会话当前的执行目录；未设置时为 null（回落到账号 agent 目录） */
  workspacePath?: string | null
  /**
   * 形态：
   * - {@code icon}（默认）工具条里的一枚图标按钮
   * - {@code bar} 输入卡最底部的一整行，带路径与本地/远端徽标
   */
  variant?: 'icon' | 'bar'
}>()

const emit = defineEmits<{
  /** 用户选了新的工作目录；null 表示回到「自动创建」 */
  change: [workspacePath: string | null]
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

const visible = ref(false)
const buttonRef = ref<HTMLElement | null>(null)

onMounted(() => {
  // 与 ChatInputToolbar 同口径：公共目录要能算出来，弹层里的固定入口才对得上
  workspaceStore.ensureBaseDir()
})

const currentPath = computed(() => props.workspacePath || null)
const publicPath = computed(() => workspaceStore.getPublicPath())

/** 这条路径是不是远端：只按形态认（ssh:// / user@host: / UNC），认不出按本地 */
const isRemote = computed(() => isRemoteWorkspacePath(currentPath.value))

/** 徽标文案：未设置时不渲染徽标，设置了就明确写本地 / 远端 */
const locationLabel = computed(() => (isRemote.value ? t('chat.toolbar.remote') : t('chat.toolbar.local')))

/**
 * 按钮提示里的目录名。
 *
 * <p>口径与 ChatInputToolbar.displayWorkspacePath 一致：未设置显示「自动创建」，
 * 公共目录显示「公共目录」，其余只显示最后一级目录名——完整路径太长，
 * 提示里已有「工作目录：」前缀，再塞一整条会把提示撑成两行。</p>
 */
const displayName = computed(() => {
  const fullPath = currentPath.value
  if (!fullPath) return t('chat.toolbar.autoCreate')
  if (publicPath.value && fullPath === publicPath.value) return t('chat.toolbar.publicDir')
  const segments = fullPath.replace(/\\/g, '/').split('/').filter(Boolean)
  return segments[segments.length - 1] || fullPath
})

const tooltip = computed(() => t('chat.toolbar.workspace', { path: displayName.value }))

/**
 * 选中后的口径与创建页一致：记录「上次选择」与最近列表，再交给父级落库。
 *
 * <p>最近列表与上次模式是跨会话共享的用户偏好，放在 workspaceStore；
 * 会话自己的路径由父级写到会话上（服务端托管），组件不再持有一份。</p>
 */
function handleSelect(workspacePath: string | null) {
  if (workspacePath === null) {
    workspaceStore.setLastChoice('auto', null)
  } else if (publicPath.value && workspacePath === publicPath.value) {
    workspaceStore.setLastChoice('public', workspacePath)
  } else {
    workspaceStore.setLastChoice('custom', workspacePath)
  }
  if (workspacePath) workspaceStore.addRecent(workspacePath)
  emit('change', workspacePath)
}
</script>

<style scoped>
/* 与 ChatInput 左组工具按钮同规格：28×28、无底色、悬停才浮出极淡的底。
   ChatInput 的 .tool-btn 是 scoped 的，这里不能复用，只能照同一组数值写一遍。 */
.swb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--text-tertiary, var(--color-text-gray));
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
  outline: none;
}

.swb-btn:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
  color: var(--color-text);
}

.swb-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 已设置项目：图标走主色，说明「这一轮的执行目录不是默认的 agent 目录」 */
.swb-btn.is-active {
  color: var(--el-color-primary);
}

/* ── 底栏一行 ──
   与输入工具条同一套字号（11.5px）与灰阶：它是元信息，不与输入内容抢注意力。
   整行可点，右侧 chevron 说明「点了会展开一个选择器」。 */
.swb-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text-tertiary, var(--color-text-gray));
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.swb-bar:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
  color: var(--text-secondary, var(--color-text));
}

.swb-bar:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.swb-bar.is-active .swb-bar__icon {
  color: var(--el-color-primary);
}

.swb-bar__icon {
  flex: none;
  color: inherit;
}

/* 目录名是这一行的主标识：给足宽度，但不许把路径挤没 */
.swb-bar__label {
  flex: none;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, var(--color-text));
}

/* 完整路径：占满剩余空间，从尾部截断（尾部才是「当前在哪一级」） */
.swb-bar__path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 10.5px;
  color: var(--text-tertiary, var(--color-text-gray));
}

/* 本地 / 远端徽标：本地中性灰，远端用信息色，扫一眼就能分辨 */
.swb-badge {
  flex: none;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 999px);
  font-size: 10px;
  line-height: 15px;
  white-space: nowrap;
}

.swb-badge.is-local {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.swb-badge.is-remote {
  background: var(--el-color-info-light-9, var(--el-fill-color));
  color: var(--el-color-info, var(--el-text-color-secondary));
}

.swb-bar__chev {
  flex: none;
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
  .swb-bar {
    transition: none;
  }
}
</style>
