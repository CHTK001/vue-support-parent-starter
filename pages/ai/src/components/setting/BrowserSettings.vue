<template>
  <div class="flex-1">
    <!-- 链接打开方式 -->
    <SettingsCard :title="t('settings.browser.linkOpenMode')">
      <SettingsRow
        :label="t('settings.browser.markdownLinkOpenMode')"
        :description="t('settings.browser.markdownLinkOpenModeDesc')"
        control-width="140px"
      >
        <el-select v-model="linkOpenMode" @change="onLinkOpenModeChange">
          <el-option :label="t('settings.browser.internalBrowser')" value="internal" />
          <el-option :label="t('settings.browser.externalBrowser')" value="external" />
          <el-option :label="t('settings.browser.askEveryTime')" value="ask" />
        </el-select>
      </SettingsRow>

      <SettingsRow
        :label="t('settings.browser.autoExpandSidebar')"
        :description="t('settings.browser.autoExpandSidebarDesc')"
      >
        <el-switch v-model="autoShowSidebar" @change="onAutoShowSidebarChange" />
      </SettingsRow>
    </SettingsCard>

    <!-- 数据管理 -->
    <SettingsCard :title="t('settings.browser.dataManagement')">
      <SettingsRow
        :label="t('settings.browser.automationData')"
        :description="t('settings.browser.automationDataDesc')"
      />
      <SettingsRow
        :label="t('settings.browser.clearAllData')"
        :description="t('settings.browser.clearAllDataDesc')"
      >
        <el-button type="danger" plain :loading="clearing" @click="handleClearData">
          {{ t('settings.browser.clearData') }}
        </el-button>
      </SettingsRow>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus';
import { apiService } from '@/services/ApiService'
import { setLinkOpenMode, setAutoShowSidebar, type LinkOpenMode } from '@/utils/workspacePreview'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined
const { t } = useI18n()
const clearing = ref(false)
const linkOpenMode = ref<LinkOpenMode>('ask')
const autoShowSidebar = ref(false)

// 加载浏览器设置
async function loadBrowserSettings(): Promise<void> {
  try {
    const response = await apiService.fetchGroupSettings('browser')
    const mode = response.linkOpenMode as LinkOpenMode | undefined
    if (mode && ['internal', 'external', 'ask'].includes(mode)) {
      linkOpenMode.value = mode
      setLinkOpenMode(mode)
    }
    if (typeof response.autoShowSidebar === 'boolean') {
      autoShowSidebar.value = response.autoShowSidebar
      setAutoShowSidebar(response.autoShowSidebar)
    }
  } catch {
    // 后端不可用时使用默认值
  }
}

// 保存链接打开方式设置
async function onLinkOpenModeChange(val: string | number | boolean | undefined): Promise<void> {
  const mode = val as LinkOpenMode
  setLinkOpenMode(mode)
  try {
    await apiService.updateGroupSettings('browser', { linkOpenMode: mode })
  } catch (error) {
    console.error('保存链接打开方式失败:', error)
    message.error(t('common.error.saveFailed'))
  }
}

// 保存侧边栏自动展开设置
async function onAutoShowSidebarChange(val: string | number | boolean | undefined): Promise<void> {
  const enabled = val as boolean
  setAutoShowSidebar(enabled)
  try {
    await apiService.updateGroupSettings('browser', { autoShowSidebar: enabled })
  } catch (error) {
    console.error('保存侧边栏设置失败:', error)
    message.error(t('common.error.saveFailed'))
  }
}

async function handleClearData(): Promise<void> {
  if (!isElectron || !window.electronAPI?.clearBrowserData) {
    message.warning(t('settings.browser.desktopOnly'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('settings.browser.clearConfirmMessage'),
      t('settings.browser.clearConfirmTitle'),
      {
        confirmButtonText: t('settings.browser.clearConfirmBtn'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      },
    )
  } catch {
    return
  }

  clearing.value = true
  try {
    const result = await window.electronAPI.clearBrowserData()
    if (result.success) {
      message.success(t('settings.browser.dataCleared'))
    } else {
      message.error(result.error || t('common.deleteFailed'))
    }
  } catch (error) {
    console.error('Failed to clear browser data:', error)
    message.error(t('common.deleteFailed'))
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  loadBrowserSettings()
})
</script>
