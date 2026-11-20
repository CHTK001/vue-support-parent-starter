<template>
  <div class="character-market">
    <!-- 本周精选横幅：取内置目录第一个角色（真实数据；pm-* 为市场壳共享样式） -->
    <div v-if="featuredItem" class="pm-banner">
      <div class="pm-banner-body">
        <div class="pm-banner-kicker">{{ t('plugins.market.featuredKicker') }}</div>
        <div class="pm-banner-title">{{ featuredItem.title }}</div>
        <div class="pm-banner-desc">{{ featuredItem.description }}</div>
      </div>
      <el-button class="pm-banner-cta" type="primary" plain @click="openDetail(featuredItem)">{{ t('plugins.market.featuredCta') }}</el-button>
    </div>

    <!-- 计数 + 排序工具条 -->
    <MarketToolbar v-if="!loading && visibleItems.length" market="characters"
      :total="visibleItems.length" :filtered="filteredItems.length" />

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
    <MarketEmpty v-else-if="filteredItems.length === 0" market="characters"
      :title="t('plugins.characters.empty')" clearable />

    <!-- 卡片网格 -->
    <div v-else class="market-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="market-card"
        :class="{ 'market-card--custom': item.custom }"
        role="button"
        tabindex="0"
        @click="item.custom ? formRef?.openEdit(item) : openDetail(item)"
        @keydown.enter.self.prevent="item.custom ? formRef?.openEdit(item) : openDetail(item)"
        @keydown.space.self.prevent="item.custom ? formRef?.openEdit(item) : openDetail(item)"
      >
        <MarketFavButton market="characters" :id="item.id" />
        <!-- 内置角色：渐变封面带（与自建卡形成瀑布高低差）；自建卡无封面 -->
        <div v-if="!item.custom" class="market-card-cover">
          <CardAvatar
            :src="item.avatar"
            :name="item.title"
            size="md"
            class="market-card-avatar"
          />
        </div>
        <CardAvatar
          v-else
          :src="item.avatar"
          :name="item.title"
          size="md"
          class="market-card-avatar"
        />
        <div class="market-card-main">
          <div class="market-card-title"><template v-for="(seg, i) in splitHighlight(item.title, keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
          <div class="market-card-desc"><template v-for="(seg, i) in splitHighlight(item.description || '', keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
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
            {{ item.added ? t('plugins.characters.summoned') : t('plugins.characters.summon') }}
          </el-button>
          <!-- 自建角色：删除 + 去对话 -->
          <div v-else class="market-custom-actions">
            <el-button circle class="market-del" @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
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
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus';
import { Delete } from '@element-plus/icons-vue'
import {isAdmin, message} from '@repo/core'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import CharacterDetailDialog from './CharacterDetailDialog.vue'
import CharacterFormDialog from './CharacterFormDialog.vue'
import MarketEmpty from './MarketEmpty.vue'
import MarketToolbar from './MarketToolbar.vue'
import { apiService } from '@/services/ApiService'
import { useSelectedCharacter } from '@/composables/useSelectedCharacter'
import { usePrefillInput } from '@/composables/usePrefillInput'
import { pluginsMarket, syncMarketSlice, splitHighlight, sortMarketList } from './plugins-market'
import MarketFavButton from './MarketFavButton.vue'
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

const { t } = useI18n()
const router = useRouter()
const { setSelectedCharacter } = useSelectedCharacter()
const { setPrefill } = usePrefillInput()

const admin = isAdmin()
/** 仅管理员可见模板：非管理员隐藏市场卡片（后端目录已兜底，这里做第二层保险） */
const showAdminOnlyTemplates = admin
const formRef = ref<InstanceType<typeof CharacterFormDialog> | null>(null)

const loading = ref(false)
const items = ref<DisplayItem[]>([])
/** 搜索关键词上提到市场壳共享状态（页头搜索框双向绑定） */
const keyword = computed({
  get: () => pluginsMarket.characters.keyword,
  set: (v: string) => { pluginsMarket.characters.keyword = v },
})
/** 类目筛选上提到市场壳共享状态（左栏索引）；store 里 '' = 全部 */
const activeCategory = computed({
  get: () => pluginsMarket.characters.category,
  set: (v: string) => { pluginsMarket.characters.category = v },
})

const quickLoadingId = ref('')
const addingId = ref('')
const detailVisible = ref(false)
const detailTarget = ref<CharacterCatalogItem | null>(null)

/** 本周精选位：取内置目录第一个角色（真实数据） */
const featuredItem = computed(() => items.value.find(i => !i.custom) || null)

/** 当前用户可见的角色（非管理员隐藏管理员模板 / 审计角色） */
const visibleItems = computed(() => items.value.filter(item => {
  if (!showAdminOnlyTemplates) {
    if ((item as any).adminOnly) return false
    if (item.custom && (item as any).code === 'prompt-auditor') return false
  }
  return true
}))

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const st = pluginsMarket.characters.status
  const list = visibleItems.value.filter(item => {
    const matchCat = !activeCategory.value || item.category === activeCategory.value
    const matchKw = !kw
      || item.title.toLowerCase().includes(kw)
      || item.description.toLowerCase().includes(kw)
      || item.id.toLowerCase().includes(kw)
    // 状态筛选：可召唤 = 未召唤的内置角色；已召唤 = 已加入的内置 / 自建角色
    const matchStatus = !st
      || (st === 'available' ? !item.custom && !item.added : !!(item.custom || item.added))
    return matchCat && matchKw && matchStatus
  })
  // 排序：default = 目录原序；name = 名称字典序；pinned = 收藏优先（四市场共享实现）
  return sortMarketList('characters', list, pluginsMarket.characters.sort, (i) => i.id, (i) => i.title)
})

async function load() {
  loading.value = true
  try {
    const catalog = await apiService.fetchBuiltinCharacterCatalog()
    const merged: DisplayItem[] = [...catalog]

    // 拉取当前用户全部角色，内置目录之外的 = 自建角色，归入「我的角色」
    const rolesResp = await apiService.fetchCharacters()
    const builtinIds = new Set(catalog.map(c => c.id))
    let customRoles = (rolesResp.items as any[]).filter(r => !builtinIds.has(r.code))
    // 非管理员：自建角色里命中审计编码的也隐藏（后端 /roles 已兜底，双保险）
    if (!admin) {
      customRoles = customRoles.filter(r => r.code !== 'prompt-auditor')
    }
    customRoles.forEach((r) => {
      merged.push({
        id: `custom-${r.id}`,
        roleId: String(r.id),
        name: r.name,
        title: r.title || r.name,
        description: r.description || '',
        category: t('plugins.characters.myCharacters'),
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
    message.error(t('plugins.characters.loadFailed'))
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
    await ElMessageBox.confirm(t('plugins.characters.deleteConfirm', { name: item.title }), t('plugins.characters.deleteTitle'), {
      confirmButtonText: t('plugins.characters.deleteBtn'),
      cancelButtonText: t('plugins.characters.cancel'),
      type: 'warning',
    })
    await apiService.deleteCharacter(item.roleId)
    message.success(t('plugins.characters.deleted'))
    await load()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      message.error(e?.message || t('plugins.characters.deleteFailed'))
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
    if (!res.success) throw new Error(res.message || t('plugins.characters.addFailed'))
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
    message.error(e?.message || t('plugins.characters.summonFailed'))
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
    message.error(e?.message || t('plugins.characters.summonFailed'))
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
    message.error(e?.message || t('plugins.characters.summonFailed'))
  } finally {
    addingId.value = ''
  }
}

// 回填市场壳：类目 / 状态分桶 / 总数（真实计数，Bento 卡与左栏索引展示用）
watchEffect(() => {
  const visible = visibleItems.value
  const counts: Record<string, number> = {}
  visible.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1 })
  syncMarketSlice('characters', {
    total: visible.length,
    categories: Object.keys(counts),
    categoryCounts: counts,
    statuses: [
      { key: 'available', label: t('plugins.characters.statusAvailable'), count: visible.filter(i => !i.custom && !i.added).length, tone: 'info' },
      { key: 'summoned', label: t('plugins.characters.statusSummoned'), count: visible.filter(i => i.custom || i.added).length, tone: 'success' },
    ],
  })
})

/** 市场壳页头「新建角色」入口（仅管理员） */
function openAdd() {
  if (admin) formRef.value?.openAdd()
}
defineExpose({ openAdd })

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
   3. 卡片静止态浅投影（--shadow-sm），hover 浮起升一档（--shadow-md）并转品牌描边。 */
.character-market {
  display: flex;
  flex-direction: column;
}
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
/* 等高网格：同行卡片自动拉伸对齐（旧「方案 10」双列瀑布流已撤，卡片高度参差） */
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
/* 卡片：div + @click，补键盘焦点环 */
.market-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  /* 原值 var(--mp-radius-lg, 14px)：--mp-radius-lg 是空令牌，实为 14px；
     按 radius-vars 档位语义（lg=卡片、xl=浮层）收敛到 lg(12px) 档，与 Skills/MCP/本地工具市场卡片同档 */
  border-radius: var(--radius-lg, var(--el-radius-lg, 12px));
  border: 1px solid var(--border-subtle, #eef2f8);
  /* 文摘卡：容器底色 + 静止态浅投影（--bg-container 亮色未定义，落白底兜底） */
  background: var(--bg-container, #ffffff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  cursor: pointer;
  outline: none;
  /* 封面带负边距贴边，靠 overflow 裁出上圆角 */
  overflow: hidden;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.market-card:focus-visible {
  box-shadow: var(--focus-ring);
}

/* 悬浮浮起：投影升一档，描边转品牌色（明暗下都不会糊成黑块）。 */
.market-card:hover {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
  border-color: color-mix(in srgb, var(--brand-500, #3b82f6) 45%, transparent);
}
/* 内置角色封面带：负边距抵消卡片内边距贴边；品牌色 14% → 透明渐变衬 --bg-fill */
.market-card-cover {
  height: 62px;
  margin: -14px -14px 0;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(120deg,
      color-mix(in srgb, var(--brand-500, #3b82f6) 14%, transparent),
      transparent 65%),
    var(--bg-fill, #f1f5fb);
}
.market-card-cover .market-card-avatar {
  align-self: center;
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
/* 尊重系统「减少动态效果」偏好：卡片浮起立即生效 */
@media (prefers-reduced-motion: reduce) {
  .market-card {
    transition: none;
  }
}
</style>
