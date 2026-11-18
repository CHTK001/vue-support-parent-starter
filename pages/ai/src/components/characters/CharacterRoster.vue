<template>
  <aside class="roster">
    <!-- 名录标题 -->
    <div class="roster__head">
      <span class="roster__cap">{{ t('characters.wb.rosterTitle') }}</span>
      <span class="ax-pill ax-pill--soft">{{ characters.length }}</span>
    </div>

    <!-- 分组筛选：点选切换；右键重命名；× 删除 -->
    <div class="roster__groups ax-scroll">
      <button type="button" class="ax-grp" :class="{ 'is-on': currentGroupId === null }"
        @click="emit('select-group', null)">
        {{ t('characters.list.all') }}
      </button>
      <button v-for="group in groups" :key="group.id" type="button" class="ax-grp"
        :class="{ 'is-on': currentGroupId === group.id }" :title="t('characters.wb.groupRenameHint')"
        @click="emit('select-group', group.id)" @contextmenu.prevent="emit('rename-group', group)">
        {{ group.name }}
        <span class="roster__grp-del" :title="t('characters.page.deleteGroupTitle')"
          :aria-label="t('characters.page.deleteGroupTitle')" @click.stop="emit('delete-group', group)">×</span>
      </button>
      <button type="button" class="ax-grp roster__grp-new" @click="emit('create-group')">
        + {{ t('characters.list.newGroup') }}
      </button>
    </div>

    <!-- 名录列表 -->
    <div class="roster__list ax-scroll" v-loading="loading">
      <button v-for="c in characters" :key="c.id" type="button" class="roster__item"
        :class="{ 'is-on': String(c.id) === selectedId }" @click="emit('select', c)">
        <Avatar class="roster__av" :src="c.avatarUrl" :name="c.title" type="assistant" />
        <span class="roster__text">
          <span class="roster__name">
            <span class="roster__name-text">{{ c.title }}</span>
            <span v-if="isGenericAssistant(c)" class="ax-pill"
              :title="t('characters.list.genericProtectedHint')">{{ t('characters.wb.builtin') }}</span>
            <span class="ax-pill ax-pill--soft">{{ c.isPublic ? t('characters.list.sharedTemplate') : t('characters.list.myTemplate') }}</span>
          </span>
          <span class="roster__desc">{{ c.description || t('characters.list.noDescription') }}</span>
        </span>
      </button>

      <div v-if="!loading && characters.length === 0" class="ax-empty">
        <span>{{ t('characters.list.empty') }}</span>
        <span class="roster__empty-hint">{{ t('characters.wb.rosterEmptyHint') }}</span>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="roster__tools">
      <button type="button" class="ax-btn ax-btn--primary" @click="emit('create')">
        ＋ {{ t('characters.list.create') }}
      </button>
      <div class="roster__tools-row">
        <button type="button" class="ax-btn ax-btn--sm" @click="triggerImport">
          {{ t('characters.list.import') }}
        </button>
        <button type="button" class="ax-btn ax-btn--sm ax-btn--ghost" @click="emit('market')">
          {{ t('characters.list.market') }} ↗
        </button>
      </div>
      <button type="button" class="ax-btn ax-btn--sm ax-btn--ghost roster__docs" @click="emit('docs')">
        {{ t('characters.list.docs') }}
      </button>
      <input ref="fileInputRef" type="file" accept=".json,.md,.markdown" multiple class="roster__file"
        @change="handleFileSelect" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from '@repo/core'
import { Avatar } from '../ui'
import { apiService } from '../../services/ApiService'
import type { CharacterGroup } from '@/types/character'

defineProps<{
  characters: any[]
  groups: CharacterGroup[]
  currentGroupId: string | null
  loading: boolean
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [character: any]
  create: []
  market: []
  docs: []
  imported: []
  'select-group': [groupId: string | null]
  'create-group': []
  'rename-group': [group: CharacterGroup]
  'delete-group': [group: CharacterGroup]
}>()

const { t } = useI18n()

const fileInputRef = ref<HTMLInputElement>()

const triggerImport = () => {
  fileInputRef.value?.click()
}

/**
 * 把导入文件内容归一成后端能解析的 JSON 字符串。
 *
 * <p>后端 `POST /v2/roles/import` 只认 JSON；`.md/.markdown` 取首个一级标题
 * 作为角色名（没有就用文件名去扩展名），整篇正文作为 systemPrompt。</p>
 */
const markdownToRoleJson = (raw: string, name: string): string => {
  const text = (raw ?? '').trim()
  if (!text) return text
  // 已是 JSON（对象 / 数组 / {characters:[...]}）就原样交给后端
  if (text.startsWith('{') || text.startsWith('[')) return text
  const heading = text.match(/^#{1,6}\s+(.+)$/m)
  const roleName = (heading?.[1] || name.replace(/\.(md|markdown|json)$/i, '') || '导入角色').trim()
  return JSON.stringify({ name: roleName, systemPrompt: text })
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files: { content: string; filename: string }[] = []
  for (const file of Array.from(input.files)) {
    const raw = await file.text()
    files.push({ content: markdownToRoleJson(raw, file.name), filename: file.name })
  }

  try {
    const results = await apiService.importCharacters(files)
    const okCount = results.filter(r => r.status === 'ok').length
    const failCount = results.filter(r => r.status !== 'ok').length
    if (okCount > 0) {
      message.success(t('characters.list.importSuccess', { count: okCount }))
    }
    if (failCount > 0) {
      message.warning(t('characters.list.importPartial', { count: failCount }))
    }
    emit('imported')
  } catch (err: any) {
    message.error(err.message || t('characters.list.importFailed'))
  }

  // 重置 input 以便重复选择同一文件
  input.value = ''
}

/**
 * 通用助手判定：code=general-assistant 系统内置，不可删除。
 *
 * 只认 code，不认主键：种子角色（如三国角色库）自增主键同样会占用小 id，
 * 按 id 判定会把普通角色误标成「通用」。
 */
function isGenericAssistant(character: any): boolean {
  if (!character) return false
  return character.code === 'general-assistant' || character.sysAiRoleCode === 'general-assistant'
}
</script>

<style scoped>
.roster {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 14px 10px 10px;
  background: var(--ax-surface);
}

.roster__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 6px 10px;
}

.roster__cap {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ax-text-3);
}

/* 分组芯片 */
.roster__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 0 2px 8px;
  max-height: 84px;
  flex-shrink: 0;
}

.roster__grp-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: -4px;
  border-radius: 50%;
  font-size: 13px;
  line-height: 1;
  color: var(--ax-text-3);
  opacity: 0;
  transition: opacity 0.15s var(--ax-ease), color 0.15s var(--ax-ease);
}

.ax-grp:hover .roster__grp-del,
.ax-grp.is-on .roster__grp-del {
  opacity: 0.7;
}

.roster__grp-del:hover {
  opacity: 1;
  color: var(--ax-err);
}

.roster__grp-new {
  border: 1px dashed var(--ax-line);
}

/* 名录列表 */
.roster__list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px;
}

.roster__item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: var(--ax-r-md);
  background: transparent;
  color: var(--ax-text);
  font-family: var(--ax-font);
  text-align: left;
  cursor: pointer;
  transition: background 0.16s var(--ax-ease), border-color 0.16s var(--ax-ease), box-shadow 0.16s var(--ax-ease);
}

.roster__item:hover {
  background: var(--ax-fill);
}

.roster__item.is-on {
  background: var(--ax-surface);
  border-color: color-mix(in srgb, var(--ax-brand) 34%, transparent);
  box-shadow: var(--ax-sh-sm);
}

.roster__av {
  width: 34px;
  height: 34px;
  flex: none;
}

.roster__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.roster__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ax-text);
}

.roster__name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.roster__desc {
  font-size: 11px;
  line-height: 1.5;
  color: var(--ax-text-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.roster__empty-hint {
  font-size: 11px;
  opacity: 0.8;
}

/* 底部操作 */
.roster__tools {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid var(--ax-line-soft);
  flex-shrink: 0;
}

.roster__tools-row {
  display: flex;
  gap: 6px;
}

.roster__tools-row .ax-btn {
  flex: 1;
}

.roster__docs {
  width: 100%;
}

.roster__file {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .roster__grp-del {
    transition: none;
  }
}
</style>
