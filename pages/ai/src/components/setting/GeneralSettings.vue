<template>
  <div class="flex-1">
    <!-- 语言设置 -->
    <SettingsCard :title="t('common.language')">
      <SettingsRow :label="t('settings.general.language')" :description="t('settings.general.languageDesc')" control-width="208px">
        <el-select v-model="selectedLanguage" @change="handleLanguageChange">
          <el-option label="简体中文" value="zh-CN" />
          <el-option label="English" value="en-US" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 登录设置 -->
    <SettingsCard :title="t('settings.general.login')">
      <SettingsRow :label="t('settings.general.autoLoginMode')" :description="t('settings.general.autoLoginDesc')">
        <el-switch v-model="settingsForm.autoLoginEnabled" />
      </SettingsRow>
    </SettingsCard>

    <!-- 工作目录 -->
    <SettingsCard :title="t('settings.general.workspace')">
      <SettingsRow :label="t('settings.general.workspaceBaseDir')" :description="t('settings.general.workspaceBaseDirDesc')" control-flex>
        <div class="flex gap-2 w-full">
          <el-input v-model="settingsForm.workspaceBaseDir" :placeholder="t('settings.general.workspaceBaseDirPlaceholder')" clearable />
          <el-button @click="selectFolder" type="primary" plain>
            {{ t('settings.general.selectFolder') }}
          </el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- Agent 设置 -->
    <SettingsCard :title="t('settings.general.agent')">
      <SettingsRow :label="t('settings.general.maxToolIterations')" :description="t('settings.general.maxToolIterationsDesc')" control-width="128px">
        <el-select v-model="settingsForm.maxToolIterations">
          <el-option label="10" :value="10" />
          <el-option label="50" :value="50" />
          <el-option label="100" :value="100" />
          <el-option label="200" :value="200" />
          <el-option label="500" :value="500" />
        </el-select>
      </SettingsRow>
      <SettingsRow :label="t('settings.general.llmRequestTimeout')" :description="t('settings.general.llmRequestTimeoutDesc')" control-width="144px">
        <el-select v-model="settingsForm.llmRequestTimeoutMs">
          <el-option label="30 秒" :value="30" />
          <el-option label="60 秒" :value="60" />
          <el-option label="120 秒" :value="120" />
          <el-option label="300 秒" :value="300" />
          <el-option label="600 秒" :value="600" />
        </el-select>
      </SettingsRow>
      <SettingsRow :label="t('settings.general.llmIdleTimeout')" :description="t('settings.general.llmIdleTimeoutDesc')" control-width="144px">
        <el-select v-model="settingsForm.llmIdleTimeoutMs">
          <el-option label="10 秒" :value="10" />
          <el-option label="30 秒" :value="30" />
          <el-option label="60 秒" :value="60" />
          <el-option label="120 秒" :value="120" />
          <el-option label="300 秒" :value="300" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 对话上下文 -->
    <SettingsCard title="对话上下文">
      <SettingsRow label="压缩触发类型" description="选择何时触发上下文压缩" control-width="208px">
        <el-select v-model="settingsForm.chatCompressType">
          <el-option label="按轮数触发" value="rounds" />
          <el-option label="按上下文阈值触发" value="tokens" />
          <el-option label="两者都触发" value="both" />
        </el-select>
      </SettingsRow>
      <SettingsRow v-if="settingsForm.chatCompressType === 'rounds' || settingsForm.chatCompressType === 'both'"
        label="压缩触发轮数" description="会话累计达到该轮数后自动压缩（默认 100 轮）" control-width="128px">
        <el-select v-model="settingsForm.chatCompressTriggerRounds">
          <el-option label="10 轮" :value="10" />
          <el-option label="20 轮" :value="20" />
          <el-option label="50 轮" :value="50" />
          <el-option label="100 轮" :value="100" />
          <el-option label="200 轮" :value="200" />
        </el-select>
      </SettingsRow>
      <SettingsRow v-if="settingsForm.chatCompressType === 'tokens' || settingsForm.chatCompressType === 'both'"
        label="上下文阈值" description="当上下文占用模型窗口的百分比超过此值时触发压缩（默认 80%）" control-width="128px">
        <el-select v-model="settingsForm.chatCompressTokenThreshold">
          <el-option label="50%" :value="50" />
          <el-option label="60%" :value="60" />
          <el-option label="70%" :value="70" />
          <el-option label="80%" :value="80" />
          <el-option label="90%" :value="90" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="压缩保留轮数" description="压缩后保留最近 N 轮原始对话（默认 6 轮）" control-width="128px">
        <el-select v-model="settingsForm.chatCompressRetainRounds">
          <el-option label="2 轮" :value="2" />
          <el-option label="4 轮" :value="4" />
          <el-option label="6 轮" :value="6" />
          <el-option label="8 轮" :value="8" />
          <el-option label="10 轮" :value="10" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 对话过程 -->
    <SettingsCard title="对话过程">
      <SettingsRow label="折叠回复过程" description="回复成功完成后，将最终正文前的过程文本、思考和工具调用收进活动详情。">
        <el-switch v-model="settingsForm.collapseReplyProcess" />
      </SettingsRow>
      <SettingsRow label="耗时显示格式" description="控制会话流和回复结果里的执行耗时精度。" control-width="128px">
        <el-select v-model="settingsForm.durationDisplayFormat">
          <el-option label="整数秒" value="seconds" />
          <el-option label="精确到毫秒" value="milliseconds" />
          <el-option label="分秒格式" value="mmss" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="思考状态 Loader" description="选择思考状态文案左侧的加载动效。" control-width="160px">
        <el-select v-model="settingsForm.thinkingLoaderStyle">
          <el-option label="Matrix（默认）" value="matrix" />
          <el-option label="Music" value="music" />
          <el-option label="Bird" value="bird" />
          <el-option label="Fish" value="fish" />
          <el-option label="ASCII" value="ascii" />
          <el-option label="Dots" value="dots" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="思考状态文案" description="同时自定义思考期间轮换显示的中文和英文文案。">
        <el-button @click="openThinkingTextDialog">编辑文案</el-button>
      </SettingsRow>
    </SettingsCard>

    <!-- 菜单显示控制 -->
    <SettingsCard title="菜单显示控制">
      <SettingsRow label="显示角色管理" description="在左侧菜单显示角色管理入口">
        <el-switch v-model="settingsForm.showCharactersMenu" />
      </SettingsRow>
      <SettingsRow label="显示机器人管理" description="在左侧菜单显示机器人管理入口">
        <el-switch v-model="settingsForm.showBotsMenu" />
      </SettingsRow>
      <SettingsRow label="显示知识库" description="在左侧菜单显示知识库入口">
        <el-switch v-model="settingsForm.showKnowledgeBaseMenu" />
      </SettingsRow>
      <SettingsRow label="显示插件市场" description="在左侧菜单显示插件市场入口">
        <el-switch v-model="settingsForm.showPluginsMenu" />
      </SettingsRow>
      <SettingsRow label="显示模型管理" description="在左侧菜单显示模型管理入口">
        <el-switch v-model="settingsForm.showModelsMenu" />
      </SettingsRow>
      <SettingsRow label="显示用量管理" description="在左侧菜单显示用量管理入口">
        <el-switch v-model="settingsForm.showUsageMenu" />
      </SettingsRow>
      <SettingsRow label="显示定时任务" description="在左侧菜单显示定时任务入口">
        <el-switch v-model="settingsForm.showSchedulerMenu" />
      </SettingsRow>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus';
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import { useAuthStore } from '@/stores/auth'
import { useLanguage } from '@/composables/useLanguage'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

const authStore = useAuthStore()
const { notify } = usePopup()
const { t } = useI18n()
const { locale: currentLocale, setLanguage } = useLanguage()
const selectedLanguage = ref(currentLocale.value)

function handleLanguageChange(val: string) {
  setLanguage(val as 'zh-CN' | 'en-US')
}

// 表单数据
const settingsForm = reactive({
  autoLoginEnabled: false,
  workspaceBaseDir: '',
  maxToolIterations: 100,
  llmRequestTimeoutMs: 600,   // 秒（后端存储为毫秒）
  llmIdleTimeoutMs: 120,     // 秒
  chatCompressType: 'rounds',      // 压缩触发类型：rounds / tokens / both
  chatCompressTriggerRounds: 100,  // 压缩触发轮数
  chatCompressTokenThreshold: 80,  // 上下文阈值（百分比）
  chatCompressRetainRounds: 6,     // 压缩保留轮数
  showCharactersMenu: true,         // 显示角色管理
  showBotsMenu: true,               // 显示机器人管理
  showKnowledgeBaseMenu: true,      // 显示知识库
  showPluginsMenu: true,            // 显示插件市场
  showModelsMenu: true,             // 显示模型管理
  showUsageMenu: true,              // 显示用量管理
  showConnectorsMenu: true,         // 显示连接器
  showSchedulerMenu: true,          // 显示定时任务
  collapseReplyProcess: true,        // 折叠回复过程
  durationDisplayFormat: 'seconds',  // 耗时显示格式
  thinkingLoaderStyle: 'matrix',     // 思考状态 Loader
  thinkingTextCN: '思考中',          // 思考状态中文文案
  thinkingTextEN: 'Thinking',        // 思考状态英文文案
})

// 原始设置备份，用于对比是否有改动
const originalSettings = ref<any>(null)

// 计算是否有改动
const hasChanges = computed(() => {
  if (!originalSettings.value) return false
  return JSON.stringify(settingsForm) !== JSON.stringify(originalSettings.value)
})

// 自动保存（防抖 300ms）
const debouncedSave = useDebounceFn(async () => {
  if (!hasChanges.value) return
  await handleSave()
}, 300)

// 监听设置变化自动保存
watch(() => ({
  autoLoginEnabled: settingsForm.autoLoginEnabled,
  workspaceBaseDir: settingsForm.workspaceBaseDir,
  maxToolIterations: settingsForm.maxToolIterations,
  llmRequestTimeoutMs: settingsForm.llmRequestTimeoutMs,
  llmIdleTimeoutMs: settingsForm.llmIdleTimeoutMs,
  chatCompressType: settingsForm.chatCompressType,
  chatCompressTriggerRounds: settingsForm.chatCompressTriggerRounds,
  chatCompressTokenThreshold: settingsForm.chatCompressTokenThreshold,
  chatCompressRetainRounds: settingsForm.chatCompressRetainRounds,
  showCharactersMenu: settingsForm.showCharactersMenu,
  showBotsMenu: settingsForm.showBotsMenu,
  showKnowledgeBaseMenu: settingsForm.showKnowledgeBaseMenu,
  showPluginsMenu: settingsForm.showPluginsMenu,
  showModelsMenu: settingsForm.showModelsMenu,
  showUsageMenu: settingsForm.showUsageMenu,
  showConnectorsMenu: settingsForm.showConnectorsMenu,
  showSchedulerMenu: settingsForm.showSchedulerMenu,
  collapseReplyProcess: settingsForm.collapseReplyProcess,
  durationDisplayFormat: settingsForm.durationDisplayFormat,
  thinkingLoaderStyle: settingsForm.thinkingLoaderStyle,
  thinkingTextCN: settingsForm.thinkingTextCN,
  thinkingTextEN: settingsForm.thinkingTextEN
}), () => {
  debouncedSave()
}, { deep: true })

// 加载 system 分组设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('system')
    // 后端返回两层data嵌套：{ success: true, data: {...} }
    const data = response?.data || response

    // 填充表单
    settingsForm.autoLoginEnabled = data.autoLoginEnabled === true || data.autoLoginEnabled === 'true'
    settingsForm.workspaceBaseDir = data.workspaceBaseDir || ''
    settingsForm.maxToolIterations = Number(data.maxToolIterations) || 100
    settingsForm.llmRequestTimeoutMs = Math.round(Number(data.llmRequestTimeoutMs) / 1000) || 600
    settingsForm.llmIdleTimeoutMs = Math.round(Number(data.llmIdleTimeoutMs) / 1000) || 120
    settingsForm.chatCompressType = data.chatCompressType || 'rounds'
    settingsForm.chatCompressTriggerRounds = Number(data.chatCompressTriggerRounds) || 100
    settingsForm.chatCompressTokenThreshold = Number(data.chatCompressTokenThreshold) || 80
    settingsForm.chatCompressRetainRounds = Number(data.chatCompressRetainRounds) || 6

    // 从 localStorage 加载菜单显示配置
    const menuSettings = JSON.parse(localStorage.getItem('menuDisplaySettings') || '{}')
    settingsForm.showCharactersMenu = menuSettings.showCharactersMenu !== false
    settingsForm.showBotsMenu = menuSettings.showBotsMenu !== false
    settingsForm.showKnowledgeBaseMenu = menuSettings.showKnowledgeBaseMenu !== false
    settingsForm.showPluginsMenu = menuSettings.showPluginsMenu !== false
    settingsForm.showModelsMenu = menuSettings.showModelsMenu !== false
    settingsForm.showUsageMenu = menuSettings.showUsageMenu !== false
    settingsForm.showConnectorsMenu = menuSettings.showConnectorsMenu !== false
    settingsForm.showSchedulerMenu = menuSettings.showSchedulerMenu !== false
    settingsForm.collapseReplyProcess = data.collapseReplyProcess !== false
    settingsForm.durationDisplayFormat = data.durationDisplayFormat || 'seconds'
    settingsForm.thinkingLoaderStyle = data.thinkingLoaderStyle || 'matrix'
    settingsForm.thinkingTextCN = data.thinkingTextCN || '思考中'
    settingsForm.thinkingTextEN = data.thinkingTextEN || 'Thinking'
    // 备份原始数据
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))
  } catch (error: any) {
    console.error('获取通用设置失败:', error)
    notify.error(t('settings.general.loadFailed'), error.message || t('common.error.unknown'))
  }
}

// 选择文件夹
const selectFolder = async () => {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI
  if (isElectron && window.electronAPI?.selectFolder) {
    try {
      const selectedPath = await window.electronAPI.selectFolder()
      if (selectedPath) {
        settingsForm.workspaceBaseDir = selectedPath
        message.success(t('settings.general.folderSelected'))
      }
    } catch (error) {
      message.error(t('settings.general.selectFolderFailed'))
    }
  } else {
    message.warning(t('settings.general.folderSelectNotSupported'))
  }
}

// 保存设置
const handleSave = async () => {
  try {
    // 保存菜单显示配置到 localStorage
    const menuSettings = {
      showCharactersMenu: settingsForm.showCharactersMenu,
      showBotsMenu: settingsForm.showBotsMenu,
      showKnowledgeBaseMenu: settingsForm.showKnowledgeBaseMenu,
      showPluginsMenu: settingsForm.showPluginsMenu,
      showModelsMenu: settingsForm.showModelsMenu,
      showUsageMenu: settingsForm.showUsageMenu,
      showConnectorsMenu: settingsForm.showConnectorsMenu,
      showSchedulerMenu: settingsForm.showSchedulerMenu,
    }
    localStorage.setItem('menuDisplaySettings', JSON.stringify(menuSettings))

    // 验证工作目录基路径
    const path = settingsForm.workspaceBaseDir.trim()
    if (path) {
      const isAbsolute = /^[a-zA-Z]:\\/.test(path) || path.startsWith('/')
      if (!isAbsolute) {
        message.error(t('settings.general.pathMustBeAbsolute'))
        return
      }
    }

    // 构造保存数据
    const dataToSave = {
      autoLoginEnabled: settingsForm.autoLoginEnabled,
      workspaceBaseDir: path || null,
      maxToolIterations: settingsForm.maxToolIterations,
      llmRequestTimeoutMs: settingsForm.llmRequestTimeoutMs * 1000,
      llmIdleTimeoutMs: settingsForm.llmIdleTimeoutMs * 1000,
      chatCompressType: settingsForm.chatCompressType,
      chatCompressTriggerRounds: settingsForm.chatCompressTriggerRounds,
      chatCompressTokenThreshold: settingsForm.chatCompressTokenThreshold,
      chatCompressRetainRounds: settingsForm.chatCompressRetainRounds,
    }

    // 使用分组设置接口更新 system 分组
    await apiService.updateGroupSettings('system', dataToSave)

    // 保存成功后更新原始数据备份
    originalSettings.value = JSON.parse(JSON.stringify(settingsForm))

    // 同步更新 authStore 中的免登录状态
    authStore.autoLoginEnabled = settingsForm.autoLoginEnabled

    notify.success(t('common.saveSuccess'), t('settings.general.updated'))
  } catch (error: any) {
    console.error('保存设置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

// 打开思考文案编辑弹窗
const openThinkingTextDialog = () => {
  ElMessageBox.prompt('请输入思考状态中文文案（多个用逗号分隔）', '编辑思考状态文案', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: settingsForm.thinkingTextCN,
  }).then(({ value }) => {
    settingsForm.thinkingTextCN = value
    message.success('思考状态文案已更新')
  }).catch(() => {})
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>
