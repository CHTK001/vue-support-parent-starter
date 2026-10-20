<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div v-if="visible" class="command-palette-overlay" @click.self="close">
        <div class="command-palette">
          <!-- 搜索框 -->
          <div class="palette-search">
            <el-icon size="16" class="palette-search-icon"><Search /></el-icon>
            <input
              ref="searchInputRef"
              v-model="query"
              class="palette-search-input"
              :placeholder="t('common.commandPalette.placeholder') || '输入命令或搜索...'"
              @keydown.escape="close"
              @keydown.enter="executeSelected"
              @keydown.up.prevent="moveUp"
              @keydown.down.prevent="moveDown"
            />
            <kbd class="palette-esc-hint">ESC</kbd>
          </div>

          <!-- 命令列表 -->
          <div class="palette-commands" ref="listRef">
            <div v-if="filteredCommands.length === 0" class="palette-empty">
              <span>未找到匹配命令</span>
            </div>
            <div
              v-for="(cmd, index) in filteredCommands"
              :key="cmd.id"
              class="palette-cmd"
              :class="{ 'palette-cmd--active': index === activeIndex }"
              @click="execute(cmd)"
              @mouseenter="activeIndex = index"
            >
              <el-icon size="16" class="palette-cmd-icon">
                <component :is="cmd.icon" />
              </el-icon>
              <div class="palette-cmd-text">
                <span class="palette-cmd-label" v-html="highlightCmd(cmd.label)"></span>
                <span v-if="cmd.desc" class="palette-cmd-desc">{{ cmd.desc }}</span>
              </div>
              <kbd v-if="cmd.shortcut" class="palette-cmd-shortcut">{{ cmd.shortcut }}</kbd>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="palette-footer">
            <span class="palette-footer-hint">
              <kbd>↑↓</kbd> 导航 &nbsp; <kbd>Enter</kbd> 执行 &nbsp; <kbd>ESC</kbd> 关闭
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Plus, Setting, Grid, User, FolderOpened, QuestionFilled, Moon, Sunny } from '@element-plus/icons-vue'
import {
  Chat32Regular, Code16Regular, Lightbulb16Regular, Document16Regular,
  ArrowEnterUp20Regular, Dismiss20Regular, Keyboard24Regular,
} from '@vicons/fluent'
import { highlightText } from '@/composables/useSearchHighlight'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  'update:visible': [v: boolean]
}>()

const router = useRouter()
const { t } = useI18n()
const query = ref('')
const activeIndex = ref(0)
const searchInputRef = ref<HTMLInputElement>()

interface Command {
  id: string
  label: string
  desc?: string
  icon: string
  shortcut?: string
  action: () => void
}

const commands: Command[] = [
  { id: 'new-chat', label: '新建会话', desc: '创建新的 AI 对话', icon: 'Plus', shortcut: 'Ctrl+N', action: () => { router.push('/chat'); close() } },
  { id: 'new-character', label: '新建角色', desc: '创建新的 AI 助手角色', icon: 'User', action: () => { router.push('/characters'); close() } },
  { id: 'models', label: '模型管理', desc: '管理 AI 模型和供应商', icon: 'Grid', action: () => { router.push('/models'); close() } },
  { id: 'settings', label: '系统设置', desc: '配置应用程序设置', icon: 'Setting', action: () => { router.push('/settings'); close() } },
  { id: 'roles', label: '角色管理', desc: '管理 AI 角色配置', icon: 'FolderOpened', action: () => { router.push('/management/roles'); close() } },
  { id: 'mcp', label: 'MCP 服务器', desc: '管理 MCP 工具服务器', icon: 'Code16Regular', action: () => { router.push('/mcp'); close() } },
  { id: 'knowledge-base', label: '知识库管理', desc: '管理向量知识库', icon: 'FolderOpened', action: () => { router.push('/knowledge-base'); close() } },
  { id: 'help', label: '帮助与文档', desc: '查看使用帮助和快捷键说明', icon: 'QuestionFilled', action: () => { router.push('/help'); close() } },
]

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands
  return commands.filter(c =>
    c.label.toLowerCase().includes(q) || (c.desc || '').toLowerCase().includes(q),
  )
})

watch(() => props.visible, async (v) => {
  if (v) {
    query.value = ''
    activeIndex.value = 0
    await nextTick()
    searchInputRef.value?.focus()
  }
})

watch(filteredCommands, () => { activeIndex.value = 0 })

function highlightCmd(label: string): string {
  return highlightText(label, query.value)
}

function moveUp() {
  activeIndex.value = Math.max(0, activeIndex.value - 1)
  scrollActiveIntoView()
}

function moveDown() {
  activeIndex.value = Math.min(filteredCommands.value.length - 1, activeIndex.value + 1)
  scrollActiveIntoView()
}

function scrollActiveIntoView() {
  nextTick(() => {
    const list = document.querySelector('.palette-commands')
    const active = list?.querySelector('.palette-cmd--active') as HTMLElement
    active?.scrollIntoView({ block: 'nearest' })
  })
}

function executeSelected() {
  const cmd = filteredCommands.value[activeIndex.value]
  if (cmd) execute(cmd)
}

function execute(cmd: Command) {
  cmd.action()
}

function close() {
  emit('update:visible', false)
}
</script>

<script lang="ts">
// 图标组件名注册（供动态 component :is 使用）
export default {}
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  backdrop-filter: blur(2px);
}

.command-palette {
  width: 560px;
  max-width: 90vw;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.3), 0 8px 20px -8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.palette-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.palette-search-icon {
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.palette-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: var(--el-text-color-primary);
  caret-color: var(--el-color-primary);
}

.palette-search-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.palette-esc-hint {
  padding: 2px 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}

.palette-commands {
  overflow-y: auto;
  flex: 1;
}

.palette-empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.palette-cmd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.palette-cmd:hover,
.palette-cmd--active {
  background: var(--el-fill-color-light);
}

.palette-cmd-icon {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.palette-cmd-text {
  flex: 1;
  min-width: 0;
}

.palette-cmd-label {
  display: block;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.palette-cmd-desc {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.palette-cmd-shortcut {
  padding: 2px 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  flex-shrink: 0;
}

.palette-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-lighter);
}

.palette-footer-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.palette-footer-hint kbd {
  padding: 1px 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  font-size: 10px;
  background: var(--el-fill-color-light);
}

/* 过渡动画 */
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: all 0.2s ease;
}
.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}
.palette-fade-enter-from .command-palette,
.palette-fade-leave-to .command-palette {
  transform: scale(0.96) translateY(-8px);
}
</style>
