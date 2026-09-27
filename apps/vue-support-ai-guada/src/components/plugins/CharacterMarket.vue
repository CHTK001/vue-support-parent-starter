<template>
  <div class="character-market">
    <!-- 搜索框 + 新建角色 -->
    <div class="market-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索角色..."
        clearable
        class="market-search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        v-if="admin"
        type="primary"
        class="market-create"
        @click="formRef?.openAdd()"
      >
        <el-icon class="market-create-ico"><Plus /></el-icon>新建角色
      </el-button>
    </div>

    <!-- 分类筛选（自动换行，不出滚动条） -->
    <div class="market-categories">
      <span
        v-for="cat in categories"
        :key="cat"
        class="market-cat"
        :class="activeCategory === cat ? 'is-active' : ''"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </span>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading" class="market-grid">
      <div v-for="i in 8" :key="i" class="market-card skeleton-card">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-main">
          <div class="skeleton-title"></div>
          <div class="skeleton-desc"></div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredItems.length === 0" class="market-empty">
      <el-empty description="没有找到匹配的角色" />
    </div>

    <!-- 卡片网格 -->
    <div v-else class="market-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="market-card"
        @click="item.custom ? formRef?.openEdit(item) : openDetail(item)"
      >
        <CardAvatar
          :src="item.avatar"
          :name="item.title"
          size="md"
          class="market-card-avatar"
        />
        <div class="market-card-main">
          <div class="market-card-title">{{ item.title }}</div>
          <div class="market-card-desc">{{ item.description }}</div>
          <div class="market-card-tags">
            <span class="market-tag">{{ item.category }}</span>
          </div>
        </div>
        <div class="market-card-action" @click.stop>
          <!-- 内置角色：召唤 -->
          <el-button
            v-if="!item.custom"
            :type="item.added ? 'success' : 'primary'"
            size="small"
            :loading="quickLoadingId === item.id"
            @click="quickSummon(item)"
          >
            {{ item.added ? '已召唤' : '召唤' }}
          </el-button>
          <!-- 自建角色：删除 + 去对话 -->
          <div v-else class="market-custom-actions">
            <el-button size="small" circle class="market-del" @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
            <el-button size="small" type="primary" class="market-go" @click="goCustom(item)">去对话</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑角色弹窗 -->
    <CharacterFormDialog ref="formRef" @saved="load" />

    <!-- 详情弹窗 -->
    <CharacterDetailDialog
      v-model="detailVisible"
      :item="detailTarget"
      :adding="!!addingId"
      @summon="handleSummon"
      @use-prompt="handleUsePrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { isAdmin } from '@repo/core'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import CharacterDetailDialog from './CharacterDetailDialog.vue'
import CharacterFormDialog from './CharacterFormDialog.vue'
import { apiService } from '@/services/ApiService'
import { useSelectedCharacter } from '@/composables/useSelectedCharacter'
import { usePrefillInput } from '@/composables/usePrefillInput'
import type {
  CharacterCatalogItem,
  CharacterCatalogDetail,
} from '@/services/modules/character.api'

/** 统一展示项：内置目录 + 自建角色 */
type DisplayItem = CharacterCatalogItem & {
  custom?: boolean
  roleId?: string
  systemPrompt?: string
  temperature?: number
  avatarUrl?: string
  /** 自建角色用它做去重与跳转（builtinIds 也按 code 比对） */
  code?: string | null
  /** 自建角色绑定的模型 */
  modelId?: string | null
}

const router = useRouter()
const { setSelectedCharacter } = useSelectedCharacter()
const { setPrefill } = usePrefillInput()

const admin = isAdmin()
const formRef = ref<InstanceType<typeof CharacterFormDialog> | null>(null)

const loading = ref(false)
const items = ref<DisplayItem[]>([])
const keyword = ref('')
const activeCategory = ref('全部')

const quickLoadingId = ref('')
const addingId = ref('')
const detailVisible = ref(false)
const detailTarget = ref<CharacterCatalogItem | null>(null)

const categories = computed(() => {
  const set = new Set(items.value.map(i => i.category))
  return ['全部', ...Array.from(set)]
})

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return items.value.filter(item => {
    const matchCat = activeCategory.value === '全部' || item.category === activeCategory.value
    const matchKw = !kw
      || item.title.toLowerCase().includes(kw)
      || item.description.toLowerCase().includes(kw)
      || item.id.toLowerCase().includes(kw)
    return matchCat && matchKw
  })
})

async function load() {
  loading.value = true
  try {
    const catalog = await apiService.fetchBuiltinCharacterCatalog()
    const merged: DisplayItem[] = [...catalog]

    // 拉取当前用户全部角色，内置目录之外的 = 自建角色，归入「我的角色」
    const rolesResp = await apiService.fetchCharacters()
    const builtinIds = new Set(catalog.map(c => c.id))
    const customRoles = (rolesResp.items as any[]).filter(r => !builtinIds.has(r.code))
    customRoles.forEach((r) => {
      merged.push({
        id: `custom-${r.id}`,
        roleId: String(r.id),
        name: r.name,
        title: r.title || r.name,
        description: r.description || '',
        category: '我的角色',
        avatar: r.avatarUrl || r.avatar || '',
        added: true,
        custom: true,
        code: r.code,
        systemPrompt: r.systemPrompt,
        temperature: r.temperature,
        modelId: r.modelId,
      })
    })
    items.value = merged
  } catch (e) {
    console.error('加载角色市场失败:', e)
    ElMessage.error('加载角色市场失败')
  } finally {
    loading.value = false
  }
}

/** 自建角色：去对话 */
function goCustom(item: DisplayItem) {
  if (!item.roleId) return
  setSelectedCharacter(item.roleId)
  router.push({ name: 'Chat', params: { sessionId: 'new-session' } })
}

/** 自建角色：删除 */
async function handleDelete(item: DisplayItem) {
  if (!item.roleId) return
  try {
    await ElMessageBox.confirm(`确定删除角色「${item.title}」吗？`, '删除角色', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await apiService.deleteCharacter(item.roleId)
    ElMessage.success('已删除')
    await load()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}

function openDetail(item: CharacterCatalogItem) {
  detailTarget.value = item
  detailVisible.value = true
}

/** 确保角色已加入助手，返回角色记录 DB id */
async function ensureRoleId(code: string, alreadyAdded: boolean): Promise<string> {
  if (!alreadyAdded) {
    const res = await apiService.addBuiltinCharacterToRoles(code)
    if (!res.success) throw new Error(res.message || '添加失败')
    if (res.roleId) return String(res.roleId)
  }
  const data = await apiService.fetchCharacters()
  const role = (data.items as any[]).find(c => c.code === code)
  return role ? String(role.id) : ''
}

function go(roleId: string, prompt?: string) {
  if (roleId) setSelectedCharacter(roleId)
  if (prompt) setPrefill(prompt)
  detailVisible.value = false
  router.push({ name: 'Chat', params: { sessionId: 'new-session' } })
}

async function quickSummon(item: CharacterCatalogItem) {
  quickLoadingId.value = item.id
  try {
    const roleId = await ensureRoleId(item.id, item.added)
    item.added = true
    go(roleId)
  } catch (e: any) {
    ElMessage.error(e?.message || '召唤失败')
  } finally {
    quickLoadingId.value = ''
  }
}

async function handleSummon(detail: CharacterCatalogDetail) {
  addingId.value = detail.id
  try {
    const roleId = await ensureRoleId(detail.id, detail.added)
    go(roleId)
  } catch (e: any) {
    ElMessage.error(e?.message || '召唤失败')
  } finally {
    addingId.value = ''
  }
}

async function handleUsePrompt(detail: CharacterCatalogDetail, prompt: string) {
  addingId.value = detail.id
  try {
    const roleId = await ensureRoleId(detail.id, detail.added)
    go(roleId, prompt)
  } catch (e: any) {
    ElMessage.error(e?.message || '召唤失败')
  } finally {
    addingId.value = ''
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.character-market {
  display: flex;
  flex-direction: column;
}
.market-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.market-search {
  flex: 1;
  max-width: 360px;
}
.market-create {
  margin-left: auto;
  border-radius: 10px;
}
.market-create-ico { margin-right: 2px; }

/* 自建卡片操作区 */
.market-custom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.market-custom-actions .market-go { flex: 1; border-radius: 10px; }
.market-del {
  flex: none;
  border-radius: 10px;
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-5);
}
.market-del:hover {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}
.market-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.market-cat {
  font-size: 12.5px;
  line-height: 1;
  padding: 7px 12px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  transition: all 0.2s ease;
}
.market-cat:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.market-cat.is-active {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
.market-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  border-radius: var(--mp-radius-lg, 14px);
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  background: var(--color-surface, var(--el-fill-color-blank));
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.market-card:hover {
  box-shadow: 0 8px 22px -12px rgba(16, 24, 40, 0.28);
  border-color: var(--el-color-primary-light-5);
}
.market-card-avatar {
  flex: none;
  align-self: flex-start;
}
.market-card-main {
  flex: 1;
  min-width: 0;
}
.market-card-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  margin-bottom: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.market-card-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.market-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.market-tag {
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.market-card-action {
  flex: none;
}
.market-card-action .el-button {
  width: 100%;
  margin: 0;
}
.market-card-action .el-button--success,
.market-card-action .el-button--success:hover,
.market-card-action .el-button--success:focus {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border-color: transparent;
}
.market-card-action .el-button--success::before {
  content: "\2713";
  margin-right: 5px;
  font-weight: 700;
}
.skeleton-card {
  height: 96px;
}
.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--size-surface-radius, 10px);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.skeleton-main {
  flex: 1;
}
.skeleton-title {
  height: 14px;
  width: 55%;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  margin-bottom: 10px;
}
.skeleton-desc {
  height: 12px;
  width: 90%;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}
.market-empty {
  padding: 48px 0;
}
</style>
