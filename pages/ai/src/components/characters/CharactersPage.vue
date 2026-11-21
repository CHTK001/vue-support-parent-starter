<template>
  <div class="h-full w-full flex flex-col min-h-0 cwb-scope" data-page="characters">
    <PageHeader :title="t('characters.page.title')" />
    <!-- A · 工作台：左栏名录 + 中栏编辑 + 右栏能力清单（后两栏由面板内部布局） -->
    <div class="cwb-host">
      <CharacterRoster class="cwb-host__roster" :characters="characters" :groups="groups"
        :currentGroupId="currentGroupId" :loading="loading" :selectedId="selectedId" @select="selectCharacter"
        @create="createCharacter" @select-group="selectGroup" @create-group="showCreateGroupDialog"
        @rename-group="handleRenameGroup" @delete-group="handleDeleteGroup" @docs="openDocs"
        @imported="handleImported" @market="openMarket" />

      <section class="cwb-host__editor">
        <CharacterSettingPanel v-if="hasSelection" ref="settingPanelRef" :data="current" :is-new="isNew"
          :saving="saving" @save="handleSave" @use="startNewChat(current)" @remove="handleRemoveCurrent" />
        <div v-else class="cwb-host__empty">
          <el-icon size="40"><InfoCircleOutlined /></el-icon>
          <p class="cwb-host__empty-title">{{ t('characters.wb.editorEmptyTitle') }}</p>
          <p class="cwb-host__empty-desc">{{ t('characters.wb.editorEmptyDesc') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { InfoCircleOutlined } from '@vicons/antd'

import PageHeader from '@/components/PageHeader.vue'
import CharacterRoster from './CharacterRoster.vue'
import CharacterSettingPanel from './CharacterSettingPanel.vue'
// 令牌桥：为页面宿主（名录卡片 / 空态）提供 --ax-* 变量
import './workbench.css'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import { openInExternalBrowser } from '@/utils/browserUtils'
import type { CharacterGroup } from '@/types/character'
import { useSelectedCharacter } from '@/composables/useSelectedCharacter'

const { confirm, toast } = usePopup()
const { t } = useI18n()
const router = useRouter()
const { setSelectedCharacter } = useSelectedCharacter()

// ========== 名录数据 ==========
const characters = ref<any[]>([])
const groups = ref<CharacterGroup[]>([])
const currentGroupId = ref<string | null>(null)
const loading = ref(false)

// ========== 工作台选中态 ==========
const settingPanelRef = ref<InstanceType<typeof CharacterSettingPanel> | null>(null)
const current = ref<any>({})
const selectedId = ref<string | null>(null)
const isNew = ref(false)
const saving = ref(false)

const hasSelection = computed(() => isNew.value || !!current.value?.id)

/** 面板存在未保存修改时，离开前确认（点其它角色 / 新建时触发） */
const confirmDiscardIfDirty = async (): Promise<boolean> => {
  if (!settingPanelRef.value?.hasChanges) return true
  const ok = await confirm(t('characters.wb.switchDirtyTitle'), t('characters.wb.switchDirtyConfirm'))
  return !!ok
}

const loadGroups = async (): Promise<void> => {
  try {
    groups.value = await apiService.fetchCharacterGroups()
  } catch (error: any) {
    console.error('获取分组列表失败:', error)
  }
}

const loadCharacters = async (groupId?: string): Promise<void> => {
  loading.value = true
  try {
    const data = await apiService.fetchCharacters(groupId)
    characters.value = data.items
  } catch (error: any) {
    console.error('获取助手列表失败:', error)
    toast.error(t('characters.page.loadFailed'))
  } finally {
    loading.value = false
  }
}

// ========== 选择与编辑 ==========

/**
 * 选中名录中的助手：先乐观渲染名录数据，再回读完整详情。
 * 列表接口不一定返回完整 settings，回读保证编辑区拿到全量数据。
 */
const selectCharacter = async (character: any): Promise<void> => {
  if (!character?.id) return
  if (!isNew.value && String(character.id) === selectedId.value) return
  if (!(await confirmDiscardIfDirty())) return

  isNew.value = false
  selectedId.value = String(character.id)
  current.value = character
  try {
    const fresh = await apiService.fetchCharacter(character.id)
    if (fresh) current.value = fresh
  } catch (error: any) {
    console.error('获取助手详情失败:', error)
  }
}

/** 新建：进入空白编辑态（isNew 驱动面板按新建口径加载） */
const createCharacter = async (): Promise<void> => {
  if (isNew.value) return
  if (!(await confirmDiscardIfDirty())) return
  isNew.value = true
  selectedId.value = null
  current.value = {}
}

/**
 * 保存：复刻原 CharacterModal 的保存链路——
 * 校验 → 取表单数据 → 更新/创建 → 传头像 → 落分形态提示词 → 刷新名录并回读。
 */
const handleSave = async (): Promise<void> => {
  const panel = settingPanelRef.value
  if (!panel) return
  const isValid = await panel.validate()
  if (!isValid) return

  saving.value = true
  try {
    const data = panel.getFormData()
    let character: any = null
    let characterId: any = current.value?.id ?? null
    const { avatarFile, avatarUrl: _avatarUrl, ...characterData } = data

    if (characterId) {
      // 更新接口返回 boolean（非实体），不能依赖其返回 id
      await apiService.updateCharacter(characterId, characterData)
      character = { ...current.value, ...characterData, id: characterId }
    } else {
      character = await apiService.createCharacter(characterData)
      characterId = character?.id ?? null
    }

    if (avatarFile && characterId) {
      const response = await apiService.uploadAvatar(characterId, avatarFile)
      character.avatarUrl = response.url
      panel.clearAvatarFile()
    }

    // 非 build 形态的提示词走独立接口，必须等角色拿到 id 才能写。
    // 失败不阻断角色保存（主体已落库），只提示——否则会出现「角色没存上」的误导。
    const formPromptFailed = characterId
      ? await panel.flushFormPrompt(characterId)
      : false

    if (character) current.value = character

    if (formPromptFailed) {
      toast.error(t('characters.modal.savePromptFailed'))
    } else {
      toast.success(t('characters.modal.saveSuccess'))
    }

    // 刷新名录（新建后列表多一条；改名后标题同步），并把选中项对齐到刚保存的角色
    await Promise.all([loadGroups(), loadCharacters(currentGroupId.value || undefined)])
    if (characterId) {
      isNew.value = false
      selectedId.value = String(characterId)
      try {
        const fresh = await apiService.fetchCharacter(characterId)
        if (fresh) current.value = fresh
      } catch (error: any) {
        console.error('回读助手详情失败:', error)
      }
    }
  } catch (error: any) {
    console.error('角色保存失败:', error)
    toast.error(t('characters.modal.saveFailed'))
  } finally {
    saving.value = false
  }
}

/** 删除当前选中的助手（通用助手在面板里不出现删除按钮，天然挡住内置角色） */
const handleRemoveCurrent = async (): Promise<void> => {
  const character = current.value
  if (!character?.id) return
  try {
    const result = await confirm(
      t('characters.page.deleteCharacterTitle'),
      t('characters.page.deleteCharacterConfirm', { name: character.title })
    )
    if (!result) return
    await apiService.deleteCharacter(character.id)
    toast.success(t('characters.page.characterDeleteSuccess'))
    if (String(character.id) === selectedId.value) {
      selectedId.value = null
      current.value = {}
      isNew.value = false
    }
    await loadCharacters(currentGroupId.value || undefined)
  } catch (error: any) {
    toast.error(t('characters.page.deleteFailed'))
    console.error('删除助手失败:', error)
  }
}

const startNewChat = (character: any): void => {
  if (!character?.id) return
  setSelectedCharacter(character.id)
  router.push({ name: 'Chat', params: { sessionId: 'new-session' } })
}

// ========== 分组 ==========
const selectGroup = (groupId: string | null): void => {
  currentGroupId.value = groupId
  loadCharacters(groupId || undefined)
}

const handleRenameGroup = async (group: CharacterGroup): Promise<void> => {
  try {
    const { value } = await ElMessageBox.prompt(t('characters.page.renameGroupPlaceholder'), t('characters.page.renameGroupTitle'), {
      inputValue: group.name,
      inputPattern: /\S+/,
      inputErrorMessage: t('characters.page.groupNameEmpty'),
      confirmButtonText: t('common.ok'),
      cancelButtonText: t('common.cancel')
    })
    await apiService.updateCharacterGroup(group.id, { name: value })
    await loadGroups()
    toast.success(t('characters.page.renameSuccess'))
  } catch (e) {
    // 取消操作
  }
}

const handleDeleteGroup = async (group: CharacterGroup): Promise<void> => {
  try {
    const result = await confirm(t('characters.page.deleteGroupTitle'), t('characters.page.deleteGroupConfirm', { name: group.name }))
    if (result) {
      await apiService.deleteCharacterGroup(group.id)
      if (currentGroupId.value === group.id) {
        currentGroupId.value = null
      }
      await loadGroups()
      await loadCharacters(currentGroupId.value || undefined)
      toast.success(t('characters.page.groupDeleteSuccess'))
    }
  } catch (error: any) {
    console.error('删除分组失败:', error)
    toast.error(error.message || t('characters.page.groupDeleteFailed'))
  }
}

const showCreateGroupDialog = async (): Promise<void> => {
  try {
    const { value } = await ElMessageBox.prompt(t('characters.page.createGroupPlaceholder'), t('characters.page.createGroupTitle'), {
      inputPattern: /\S+/,
      inputErrorMessage: t('characters.page.groupNameEmpty'),
      confirmButtonText: t('common.ok'),
      cancelButtonText: t('common.cancel')
    })
    await apiService.createCharacterGroup({ name: value })
    await loadGroups()
    toast.success(t('characters.page.groupCreateSuccess'))
  } catch (e) {
    // 取消操作
  }
}

// ========== 其它入口 ==========
const openDocs = (): void => {
  openInExternalBrowser('https://ai.dingd.cn/docs/assistant')
}

const handleImported = async (): Promise<void> => {
  await loadCharacters(currentGroupId.value || undefined)
}

const openMarket = (): void => {
  router.push({ name: 'Plugins', params: { tab: 'characters' } })
}

// ========== 生命周期 ==========
onMounted(async (): Promise<void> => {
  await loadGroups()
  await loadCharacters()
  // 默认选中第一个助手，工作台一进来就有内容（避免空编辑区）
  if (!selectedId.value && !isNew.value && characters.value.length > 0) {
    await selectCharacter(characters.value[0])
  }
})
</script>

<style scoped>
/* 工作台宿主：左栏名录 + 编辑面板；令牌来自 workbench.css 的 --ax-* 桥 */
.cwb-host {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  /* 栏间距定版 4px（2026-11-21）：名录 / 编辑 / 能力清单三栏统一窄缝 */
  gap: 4px;
  padding: 0 14px 14px;
}

.cwb-host__roster {
  min-height: 0;
  border: 1px solid var(--ax-line);
  border-radius: var(--ax-r-lg);
  background: var(--ax-surface);
  box-shadow: var(--ax-sh-sm);
  overflow: hidden;
}

.cwb-host__editor {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cwb-host__editor > * {
  flex: 1;
  min-height: 0;
}

/* 空态：未选择任何助手 */
.cwb-host__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed var(--ax-line);
  border-radius: var(--ax-r-lg);
  color: var(--ax-text-3);
}

.cwb-host__empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ax-text-2);
}

.cwb-host__empty-desc {
  font-size: 12px;
}

/* 窄屏：名录退到上方横条，编辑区占满剩余高度 */
@media (max-width: 900px) {
  .cwb-host {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .cwb-host__roster {
    max-height: 38vh;
  }
}
</style>
