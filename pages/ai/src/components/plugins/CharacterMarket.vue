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

            :loading="quickLoadingId === item.id"
            @click="quickSummon(item)"
          >
            {{ item.added ? '已召唤' : '召唤' }}
          </el-button>
          <!-- 自建角色：删除 + 去对话 -->
          <div v-else class="market-custom-actions">
            <el-button circle class="market-del" @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
            <el-button type="primary" class="market-go" @click="goCustom(item)">去对话</el-button>
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
import { ElMessageBox } from 'element-plus';
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import {isAdmin, message} from '@repo/core'
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
  /** 角色设定码（自建角色才有，内置目录为空） */
  code?: string
  systemPrompt?: string
  temperature?: number
  /** 自建角色绑定的模型 ID */
  modelId?: string
  avatarUrl?: string
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
    message.error('加载角色市场失败')
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
    message.success('已删除')
    await load()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      message.error(e?.message || '删除失败')
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
    message.error(e?.message || '召唤失败')
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
    message.error(e?.message || '召唤失败')
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
    message.error(e?.message || '召唤失败')
  } finally {
    addingId.value = ''
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
/* 令牌口径：
   1. --mp-radius-lg / --size-surface-radius 来自 src/styles/modern-polish.css，
      而 main.js 从未引入该文件 → 这两个 --mp-* 是取不到值的空令牌，
      实际一直靠兜底的 14px / 20px 在渲染。统一收敛到 --el-radius-* 六档。
   2. 10px 距 8/12 等距，按本仓口径统一取 lg(12px)，同行注释标出原值。
   3. 卡片静止态零投影，只有 hover 浮起才给投影（koi 允许的第二类 box-shadow）。 */
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
  /* 原值 10px（距 8/12 等距，本仓统一取 lg 档） */
  border-radius: var(--el-radius-lg, 12px);
}
.market-create-ico { margin-right: 2px; }

/* 自建卡片操作区 */
.market-custom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
/* 原值 10px（距 8/12 等距）→ lg 档 */
.market-custom-actions .market-go { flex: 1; border-radius: var(--el-radius-lg, 12px); }
.market-del {
  flex: none;
  /* 原值 10px（距 8/12 等距）→ lg 档 */
  border-radius: var(--el-radius-lg, 12px);
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
/* 分类是可点的 <span>：已有 cursor:pointer，再补键盘焦点环 */
.market-cat {
  font-size: 12.5px;
  line-height: 1;
  padding: 7px 12px;
  /* 原值 999px（胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  outline: none;
}

.market-cat:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.market-cat:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.market-cat.is-active {
  /* 原值 #fff → 白色令牌（主色按钮上的文字需恒为白，不随明暗变） */
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
/* 卡片：div + @click，补键盘焦点环 */
.market-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  /* 原值 var(--mp-radius-lg, 14px)：--mp-radius-lg 是空令牌，实为 14px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 var(--color-surface, var(--el-fill-color-blank)) → 卡片底色令牌 */
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  outline: none;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.market-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 悬浮浮起：koi 允许的第二类投影。阴影色跟着主文字色走，明暗下都不会糊成黑块。 */
.market-card:hover {
  box-shadow: 0 8px 22px -12px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
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
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
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
/* 「已召唤」按钮前的勾：原值 content:"\2713" 用的是 ✓ 字形。
   字形在不同系统字体下粗细/位置不一致，且无法跟随按钮文字色，
   故改为纯 CSS 画的勾（旋转 45° 的两段边框 + currentColor）。
   为什么不用 <ReIcon>：本应用没有全局注册 ReIcon，引入它必须改 <script setup>，
   而本次任务禁止触碰脚本块。 */
.market-card-action .el-button--success::before {
  content: "";
  display: inline-block;
  box-sizing: border-box;
  width: 0.32em;
  height: 0.6em;
  margin-right: 5px;
  vertical-align: middle;
  border: solid currentColor;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-1px);
}
.skeleton-card {
  height: 96px;
}
.skeleton-avatar {
  width: 40px;
  height: 40px;
  /* 原值 var(--size-surface-radius, 10px)，refactor.css 里实为 20px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.skeleton-main {
  flex: 1;
}
.skeleton-title {
  height: 14px;
  width: 55%;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-light);
  margin-bottom: 10px;
}
.skeleton-desc {
  height: 12px;
  width: 90%;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-light);
}
.market-empty {
  padding: 48px 0;
}

/* 尊重系统「减少动态效果」偏好：分类切换与卡片浮起立即生效。
   分类选中态靠底色 + 边框色区分，关掉过渡后仍然看得见。 */
@media (prefers-reduced-motion: reduce) {
  .market-cat,
  .market-card {
    transition: none;
  }
}
</style>
