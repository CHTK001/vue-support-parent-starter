<template>
  <CustomPopover :show="visible" @update:show="$emit('update:visible', $event)" :width="340" :anchor-el="anchorEl"
    :max-height="480">
    <div class="flex flex-col gap-0.5">
      <!-- 最近选择 -->
      <template v-if="recentList.length > 0">
        <div class="text-[11px] font-medium text-(--color-text-gray) px-2 py-1 select-none">{{ t('chat.input.recent') }}</div>
        <div v-for="path in filteredRecentList" :key="path"
          class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150"
          :class="path === currentWorkspacePath
            ? 'bg-(--color-sidebar-bg-active) hover:bg-(--color-sidebar-bg-active) text-(--color-sidebar-text-active)'
            : 'hover:bg-(--color-sidebar-bg-hover)'"
          @click="handleSelect(path)">
          <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
            <Folder20Regular />
          </el-icon>
          <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
            <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap shrink-0 max-w-30 overflow-hidden text-ellipsis">{{ getFolderName(path) }}</span>
            <span class="text-xs text-(--color-text-gray) whitespace-nowrap overflow-hidden text-ellipsis">{{ path }}</span>
          </div>
          <el-icon v-if="path === currentWorkspacePath" size="14" class="shrink-0 text-(--el-color-primary)">
            <Checkmark16Filled />
          </el-icon>
        </div>
        <div class="h-px bg-(--el-border-color-lighter) mx-2 my-1.5"></div>
      </template>

      <!-- 使用公共目录 -->
      <div v-if="publicPath"
        class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150"
        :class="publicPath === currentWorkspacePath
          ? 'bg-(--color-sidebar-bg-active) hover:bg-(--color-sidebar-bg-active)'
          : 'hover:bg-(--color-sidebar-bg-hover)'"
        @click="handleSelect(publicPath)">
        <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
          <PeopleCommunity16Regular />
        </el-icon>
        <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
          <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap shrink-0">{{ t('chat.input.usePublicDir') }}</span>
          <span class="text-xs text-(--color-text-gray) whitespace-nowrap overflow-hidden text-ellipsis">{{ publicPath }}</span>
        </div>
        <el-icon v-if="publicPath === currentWorkspacePath" size="14" class="shrink-0 text-(--el-color-primary)">
          <Checkmark16Filled />
        </el-icon>
      </div>

      <!-- 自动创建 -->
      <div class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150"
        :class="!currentWorkspacePath
          ? 'bg-(--color-sidebar-bg-active) hover:bg-(--color-sidebar-bg-active)'
          : 'hover:bg-(--color-sidebar-bg-hover)'"
        @click="handleSelect(null)">
        <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
          <Sparkle24Regular />
        </el-icon>
        <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
          <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap shrink-0 max-w-30 overflow-hidden text-ellipsis">{{ t('chat.input.autoCreate') }}</span>
          <span class="text-xs text-(--color-text-gray) whitespace-nowrap overflow-hidden text-ellipsis">{{ t('chat.input.autoCreateDesc') }}</span>
        </div>
        <el-icon v-if="!currentWorkspacePath" size="14" class="shrink-0 text-(--el-color-primary)">
          <Checkmark16Filled />
        </el-icon>
      </div>

      <div class="h-px bg-(--el-border-color-lighter) mx-2 my-1.5"></div>

      <div class="text-[11px] font-medium text-(--color-text-gray) px-2 py-1 select-none">{{ t('chat.input.projects') }}</div>

      <!-- 添加项目：在账号工作目录的 agent 目录下新建子目录 -->
      <div v-if="!createMode"
        class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 hover:bg-(--color-sidebar-bg-hover)"
        @click="startCreate">
        <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
          <FolderAdd20Regular />
        </el-icon>
        <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
          <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap shrink-0">{{ t('chat.input.addProject') }}</span>
          <span class="text-xs text-(--color-text-gray) whitespace-nowrap overflow-hidden text-ellipsis">{{ t('chat.input.addProjectDesc') }}</span>
        </div>
      </div>
      <div v-else class="px-2 py-1">
        <el-input ref="projectInputRef" v-model="projectName" size="small" maxlength="64" clearable
          :placeholder="t('chat.input.addProjectPlaceholder')"
          @keydown.enter.stop.prevent="submitCreate" @keydown.esc.stop.prevent="cancelCreate" />
        <div v-if="createError" class="mt-1 text-xs leading-4 text-(--el-color-danger)">{{ createError }}</div>
        <div class="mt-1.5 flex justify-end gap-1">
          <el-button size="small" text @click="cancelCreate">{{ t('chat.input.addProjectCancel') }}</el-button>
          <el-button size="small" type="primary" :loading="createLoading" @click="submitCreate">
            {{ t('chat.input.addProjectConfirm') }}
          </el-button>
        </div>
      </div>

      <!-- 从 GitHub 导入（用户需求 2026-11-12「工作间支持 github 项目创建」）：
           与「添加项目」并列，一条 URL 就够；名字留空时后端取仓库名。
           克隆在服务端做（浅克隆），成功后直接选中这个目录，会话就落在仓库里。 -->
      <div v-if="!cloneMode"
        class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 hover:bg-(--color-sidebar-bg-hover)"
        @click="startClone">
        <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
          <CloudArrowDown20Regular />
        </el-icon>
        <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
          <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap shrink-0">{{ t('chat.input.cloneFromGithub') }}</span>
          <span class="text-xs text-(--color-text-gray) whitespace-nowrap overflow-hidden text-ellipsis">{{ t('chat.input.cloneFromGithubDesc') }}</span>
        </div>
      </div>
      <div v-else class="px-2 py-1">
        <el-input ref="cloneUrlInputRef" v-model="cloneUrl" size="small" clearable
          :placeholder="t('chat.input.cloneUrlPlaceholder')"
          @keydown.enter.stop.prevent="submitClone" @keydown.esc.stop.prevent="cancelClone" />
        <el-input v-model="cloneName" size="small" maxlength="64" clearable class="mt-1.5"
          :placeholder="t('chat.input.cloneNamePlaceholder')"
          @keydown.enter.stop.prevent="submitClone" @keydown.esc.stop.prevent="cancelClone" />
        <div v-if="cloneError" class="mt-1 text-xs leading-4 text-(--el-color-danger)">{{ cloneError }}</div>
        <div class="mt-1.5 flex justify-end gap-1">
          <el-button size="small" text :disabled="cloneLoading" @click="cancelClone">
            {{ t('chat.input.addProjectCancel') }}
          </el-button>
          <el-button size="small" type="primary" :loading="cloneLoading" @click="submitClone">
            {{ cloneLoading ? t('chat.input.cloneLoading') : t('chat.input.cloneConfirm') }}
          </el-button>
        </div>
      </div>

      <!-- 打开文件夹（仅 Electron） -->
      <template v-if="isElectron">
        <div class="flex items-center gap-1.25 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 hover:bg-(--color-sidebar-bg-hover)"
          @click="handleOpenFolder">
          <el-icon size="18" class="shrink-0 text-(--color-text-gray) dark:text-(--color-text-disabled)">
            <Desktop16Regular />
          </el-icon>
          <div class="flex-1 flex items-baseline gap-1.5 min-w-0">
            <span class="text-sm font-medium text-(--color-text) dark:text-gray-100 whitespace-nowrap">{{ t('chat.input.selectLocalFolder') }}</span>
          </div>
        </div>
      </template>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElIcon, ElInput } from 'element-plus';
import { Folder20Regular, Desktop16Regular, FolderAdd20Regular, Sparkle24Regular, Checkmark16Filled, PeopleCommunity16Regular, CloudArrowDown20Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { apiService } from '@/services/ApiService'

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  currentWorkspacePath?: string | null
  publicPath?: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [workspacePath: string | null]
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()
const recentList = computed(() => workspaceStore.recentList)

// 过滤掉公共目录，避免与固定入口重复
const filteredRecentList = computed(() => {
  if (!publicPath.value) return recentList.value
  return recentList.value.filter((p: string) => p !== publicPath.value)
})

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const publicPath = computed(() => props.publicPath || null)

function getFolderName(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  return segments[segments.length - 1] || path
}

function handleSelect(path: string | null) {
  emit('select', path)
  emit('update:visible', false)
}

async function handleOpenFolder() {
  if (!isElectron || !window.electronAPI?.selectFolder) return
  try {
    const selectedPath = await window.electronAPI.selectFolder()
    if (selectedPath) {
      emit('select', selectedPath)
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    message.error(t('chat.input.selectFolderFailed'))
  } finally {
    emit('update:visible', false)
  }
}

// ── 添加项目：在账号工作目录下新建目录 ──
// 与后端 MAX_NAME_LENGTH 同口径（按码点计）
const PROJECT_NAME_MAX_LENGTH = 64
const ILLEGAL_NAME_CHARS = /[\/\\:*?"<>|]/
// 控制字符（含 DEL），显式写成转义，避免被当成不可见字符
const CONTROL_NAME_CHARS = /[\u0000-\u001F\u007F]/
const DOTS_ONLY_NAME = /^\.+$/
const RESERVED_DEVICE_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i

const createMode = ref(false)
const createLoading = ref(false)
const projectName = ref('')
const createError = ref('')
const projectInputRef = ref<any>(null)
// 请求令牌：弹层关闭时递增，回来晚了的响应不再改当前选择
let createRequestId = 0

// 本地先按与后端一致的口径校验一遍。
// 后端仍会再校验（前端这层只负责就地提示，并保证提示文案跟随当前语言，
// 不把后端的中文文案直接抛到 en-US 界面上）。
function validateProjectName(name: string): string {
  if (!name) return t('chat.input.addProjectNameRequired')
  if (Array.from(name).length > PROJECT_NAME_MAX_LENGTH)
    return t('chat.input.addProjectNameTooLong', { max: PROJECT_NAME_MAX_LENGTH })
  if (ILLEGAL_NAME_CHARS.test(name) || CONTROL_NAME_CHARS.test(name))
    return t('chat.input.addProjectNameInvalid')
  if (DOTS_ONLY_NAME.test(name)) return t('chat.input.addProjectNameDotsOnly')
  // Windows 会静默去掉结尾的点，返回的路径和实际目录会对不上
  if (name.endsWith('.')) return t('chat.input.addProjectNameTrailingDot')
  if (RESERVED_DEVICE_NAME.test(name)) return t('chat.input.addProjectNameReserved')
  return ''
}

function startCreate() {
  createMode.value = true
  createError.value = ''
  nextTick(() => projectInputRef.value?.focus?.())
}

function cancelCreate() {
  createRequestId += 1
  createMode.value = false
  createLoading.value = false
  createError.value = ''
  projectName.value = ''
}

async function submitCreate() {
  if (createLoading.value) return
  const name = projectName.value.trim()
  const invalid = validateProjectName(name)
  if (invalid) {
    createError.value = invalid
    return
  }
  const requestId = ++createRequestId
  createLoading.value = true
  createError.value = ''
  try {
    // 后端只允许在 <基路径>/<账号>/agent 下建单级目录，越界名称直接 4xx
    const result = await apiService.createWorkspaceDirectory(name)
    // 弹层在请求途中被关掉（或被新一次提交顶掉）：目录已建成，但不再改当前选择
    if (requestId !== createRequestId) return
    projectName.value = ''
    createMode.value = false
    message.success(t('chat.input.addProjectCreated', { name: result.name }))
    // 选中新项目：会话执行目录会落在这个项目里（见后端 SessionWorkspaceResolver）
    handleSelect(result.path)
  } catch (error: any) {
    if (requestId !== createRequestId) return
    createError.value = error?.message || t('chat.input.addProjectFailed')
  } finally {
    if (requestId === createRequestId) createLoading.value = false
  }
}

// 用户一改名字就清掉旧错误，避免上一轮的红字一直挂着
watch(projectName, () => {
  if (createError.value) createError.value = ''
})

// ── 从 GitHub 导入：服务端浅克隆到账号工作目录 ──
// 只在前端做「看起来是不是 GitHub 地址」的即时提示，真正的白名单校验在后端
// （只放行 https://github.com/owner/repo），前端这层不做安全判断。
const cloneMode = ref(false)
const cloneLoading = ref(false)
const cloneUrl = ref('')
const cloneName = ref('')
const cloneError = ref('')
const cloneUrlInputRef = ref<any>(null)
let cloneRequestId = 0

function startClone() {
  cancelCreate()
  cloneMode.value = true
  cloneError.value = ''
  nextTick(() => cloneUrlInputRef.value?.focus?.())
}

function cancelClone() {
  cloneRequestId += 1
  cloneMode.value = false
  cloneLoading.value = false
  cloneError.value = ''
  cloneUrl.value = ''
  cloneName.value = ''
}

async function submitClone() {
  if (cloneLoading.value) return
  const url = cloneUrl.value.trim()
  if (!url) {
    cloneError.value = t('chat.input.cloneUrlRequired')
    return
  }
  if (!/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+/i.test(url)) {
    cloneError.value = t('chat.input.cloneUrlInvalid')
    return
  }
  const requestId = ++cloneRequestId
  cloneLoading.value = true
  cloneError.value = ''
  try {
    const result = await apiService.cloneWorkspaceFromGit(url, cloneName.value.trim() || undefined)
    if (requestId !== cloneRequestId) return
    message.success(t('chat.input.cloneSuccess', { name: result.name }))
    cancelClone()
    // 选中新目录：会话执行目录落到仓库根，Git 面板立刻可用
    handleSelect(result.path)
  } catch (error: any) {
    if (requestId !== cloneRequestId) return
    cloneError.value = error?.message || t('chat.input.cloneFailed')
  } finally {
    if (requestId === cloneRequestId) cloneLoading.value = false
  }
}

// 弹层关闭时退出输入态，避免下次打开停留在上一次的错误态
watch(() => props.visible, (visible) => {
  if (!visible) {
    cancelCreate()
    cancelClone()
  }
})
</script>
