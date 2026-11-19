<template>
  <div class="flex-1 overflow-hidden">
    <div v-if="!admin" class="lt-forbidden">
      <el-icon size="40" class="mb-3 opacity-40"><LockOutlined /></el-icon>
      <div class="text-sm" style="color: var(--el-text-color-secondary)">{{ t('plugins.localTools.adminOnly') }}</div>
    </div>
    <template v-else>
    <!-- 本周精选横幅：取第一个本地工具（真实数据；pm-* 为市场壳共享样式） -->
    <div v-if="featuredTool" class="pm-banner">
      <div class="pm-banner-body">
        <div class="pm-banner-kicker">{{ t('plugins.market.featuredKicker') }}</div>
        <div class="pm-banner-title">{{ featuredTool.displayName }}</div>
        <div class="pm-banner-desc">{{ featuredTool.description }}</div>
      </div>
      <el-button class="pm-banner-cta" type="primary" plain @click="showDetail(featuredTool)">{{ t('plugins.market.featuredCta') }}</el-button>
    </div>

    <!-- 次要操作：添加工具（搜索 / 筛选在市场壳页头与左栏；页头「添加」经 defineExpose 打开弹窗） -->
    <div class="pm-toolbar">
      <el-button
        v-if="loading"
        :loading="true"
      >
        {{ t('common.loading') }}
      </el-button>
      <el-button
        v-else
        type="primary"
        size="default"
        @click="addDialog?.open()"
      >
        <el-icon class="lt-add-ico"><PlusOutlined /></el-icon>{{ t('plugins.localTools.addTool') }}
      </el-button>
    </div>

    <!-- 计数 + 排序工具条 -->
    <MarketToolbar v-if="!loading && globalTools.length" market="local-tools"
      :total="globalTools.length" :filtered="filteredTools.length" />

    <div class="space-y-4">
      <!-- 骨架屏 -->
      <div v-if="loading" class="lt-skeleton-grid">
        <div v-for="n in 6" :key="'lts-' + n" class="lt-skeleton-card">
          <div class="lt-skel lt-skel--circle"></div>
          <div class="lt-skeleton-lines">
            <div class="lt-skel lt-skel--title"></div>
            <div class="lt-skel lt-skel--desc"></div>
          </div>
        </div>
      </div>

      <div v-else class="lt-grid">
        <div
          v-for="tool in filteredTools"
          :key="tool.pluginId"
          class="lt-card"
          :class="{ 'lt-card--off': !tool.enabled }"
          role="button"
          tabindex="0"
          @click="showDetail(tool)"
          @keydown.enter.self.prevent="showDetail(tool)"
          @keydown.space.self.prevent="showDetail(tool)"
        >
          <MarketFavButton market="local-tools" :id="tool.pluginId" />
          <!-- 顶部：图标 + 来源标签 -->
          <div class="lt-card__top">
            <PluginIcon
              :icon="tool.icon ? `/api/v1/plugins/${tool.pluginId}/icon` : null"
              :name="tool.displayName"
              size="md"
              class="lt-card__icon"
            />
            <el-tag v-if="tool.source === 'dev'" type="warning" effect="light" class="lt-card__tag">{{ t('plugins.localTools.sourceDev') }}</el-tag>
            <el-tag v-else-if="tool.source === 'user'" type="success" effect="light" class="lt-card__tag">{{ t('plugins.localTools.sourceUser') }}</el-tag>
          </div>

          <!-- 名称 -->
          <div class="lt-card__name"><template v-for="(seg, i) in splitHighlight(tool.displayName, pluginsMarket['local-tools'].keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>

          <!-- 描述（最多两行） -->
          <p class="lt-card__desc"><template v-for="(seg, i) in splitHighlight(tool.description, pluginsMarket['local-tools'].keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></p>

          <!-- 底部：卸载 + 启用开关 -->
          <div class="lt-card__footer">
            <el-button
              v-if="tool.source === 'dev' || tool.source === 'user'"
              link

              type="danger"
              @click.stop="handleUninstall(tool.pluginId)"
            >
              {{ t('plugins.localTools.uninstall') }}
            </el-button>
            <el-switch
              :model-value="tool.enabled"
              :loading="updatingTools.has(tool.pluginId)"
              @update:model-value="(val: string | number | boolean) => handleToggleTool(tool.pluginId, !!val)"
              @click.stop
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <MarketEmpty v-if="!loading && filteredTools.length === 0" market="local-tools"
        :title="t('plugins.localTools.empty')" :clearable="globalTools.length > 0" />
    </div>

    <!-- Detail Dialog -->
    <ReDialog :close-on-click-modal="true" v-model="detailVisible" width="560px" align-center destroy-on-close>
      <template #header>
        <div class="flex items-center gap-3">
          <CardAvatar :src="currentTool?.icon ? `/api/v1/plugins/${currentTool?.pluginId}/icon` : null" :name="currentTool?.displayName" size="md" />
          <div class="flex items-center gap-2">
            <span class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ currentTool?.displayName }}</span>
            <el-tag v-if="currentTool?.source === 'dev'" type="warning" effect="dark">{{ t('plugins.localTools.sourceDev') }}</el-tag>
            <el-tag v-else-if="currentTool?.source === 'user'" type="success" effect="plain">{{ t('plugins.localTools.sourceUser') }}</el-tag>
          </div>
        </div>
      </template>

      <div v-if="currentTool" class="space-y-4">
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('plugins.localTools.descLabel') }}</div>
          <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{{ currentTool.description }}</p>
        </div>

        <div v-if="currentTool.tools && currentTool.tools.length > 0">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ t('plugins.localTools.toolsLabel', { count: currentTool.tools.length }) }}</div>
          <div class="space-y-1.5">
            <div v-for="sub in currentTool.tools" :key="sub.name"
              class="flex items-start gap-2 py-1.5 px-3 rounded-[var(--size-surface-radius)]"
              :style="{ background: 'var(--el-fill-color-light)' }">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-700 dark:text-gray-200 font-medium">{{ sub.name }}</div>
                <div v-if="sub.description" class="text-xs text-gray-400 mt-0.5">{{ sub.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReDialog>

    <!-- 添加本地工具弹窗 -->
    <CustomToolDialog ref="addDialog" @saved="loadGlobalTools" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus';
import { LockOutlined, PlusOutlined } from '@vicons/material'
import {isAdmin, message} from '@repo/core'
import { apiService } from '@/services/ApiService'
import { getLocale } from '@/locales'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import PluginIcon from '@/components/ui/PluginIcon.vue'
import ReDialog from '@repo/ui/re-dialog'
import CustomToolDialog from './CustomToolDialog.vue'
import { pluginsMarket, syncMarketSlice, splitHighlight, sortMarketList } from './plugins-market'
import MarketFavButton from './MarketFavButton.vue'
import MarketEmpty from './MarketEmpty.vue'
import MarketToolbar from './MarketToolbar.vue'

const { t } = useI18n()
const admin = ref(isAdmin())

interface ToolMetadata {
  pluginId: string
  name: string
  displayName: string
  description: string
  enabled: boolean
  isMcp: boolean
  icon?: string
  source?: 'builtin' | 'dev' | 'user'
  tools?: any[]
}

const loading = ref(false)
const error = ref<string | null>(null)
const updatingTools = ref<Set<string>>(new Set())

const globalTools = ref<ToolMetadata[]>([])

// Detail dialog
const detailVisible = ref(false)
const currentTool = ref<ToolMetadata | null>(null)

// Add custom tool dialog
const addDialog = ref<InstanceType<typeof CustomToolDialog> | null>(null)

function showDetail(tool: ToolMetadata) {
  currentTool.value = tool
  detailVisible.value = true
}

/** 将后端 /plugins/query 返回的插件对象归一化为页面所需的 ToolMetadata */
function normalizePlugins(list: any[] | undefined | null): ToolMetadata[] {
  if (!Array.isArray(list)) return []
  return list.map((p: any) => {
    const origin: string = p.origin || 'local'
    const source: ToolMetadata['source'] =
      p.source === 'dev' ? 'dev' : p.source === 'user' ? 'user' : origin === 'dev' ? 'dev' : origin === 'user' ? 'user' : 'builtin'
    const description: string =
      p.description ||
      (p.providerName ? `${p.providerName}（${p.source || origin}）` : t('plugins.localTools.fallbackName'))
    return {
      pluginId: p.pluginId || p.id,
      name: p.name,
      displayName: p.displayName || p.name,
      description,
      enabled: !!p.enabled,
      isMcp: !!p.isMcp,
      icon: p.icon,
      source,
      tools: Array.isArray(p.tools) ? p.tools : [],
    }
  })
}

async function loadGlobalTools() {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiService.queryPlugins(undefined, getLocale())
    globalTools.value = normalizePlugins(response.plugins)
  } catch (err: any) {
    console.error('加载全局工具失败:', err)
    const errorMsg = err.message || t('plugins.localTools.loadFailed')
    error.value = errorMsg
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

async function updateGlobalToolStatus(pluginId: string, enabled: boolean) {
  try {
    const response = await apiService.updateGlobalToolStatus(pluginId, enabled)
    if (response.success) {
      const tool = globalTools.value.find(t => t.pluginId === pluginId)
      if (tool) {
        tool.enabled = enabled
      }
    }
  } catch (err: any) {
    console.error('更新全局工具状态失败:', err)
    message.error(err.message || t('plugins.localTools.updateFailed'))
  }
}

function handleToggleTool(pluginId: string, enabled: boolean) {
  const tool = globalTools.value.find(t => t.pluginId === pluginId)
  if (!tool) return
  
  const previousState = tool.enabled
  
  try {
    updatingTools.value.add(pluginId)
    updateGlobalToolStatus(pluginId, enabled)
  } catch (err: any) {
    console.error('更新工具状态失败:', err)
    tool.enabled = previousState
    message.error(err.message || t('plugins.localTools.toggleFailed'))
  } finally {
    updatingTools.value.delete(pluginId)
  }
}

async function handleUninstall(pluginId: string) {
  try {
    await ElMessageBox.confirm(t('plugins.localTools.uninstallConfirm'), t('plugins.localTools.uninstallTitle'), {
      confirmButtonText: t('plugins.localTools.uninstallBtn'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    const response = await apiService._request('/plugins/custom', {
      method: 'DELETE',
      data: { pluginId },
    })
    if (response.success) {
      message.success(t('plugins.localTools.uninstallSuccess'))
      await loadGlobalTools()
    } else {
      message.error(response.message || t('plugins.localTools.uninstallFailed'))
    }
  } catch (err: any) {
    if (err !== 'cancel' && err?.message !== 'cancel') {
      message.error(err.message || t('plugins.localTools.uninstallFailed'))
    }
  }
}

/** 本周精选位：取第一个本地工具（真实数据） */
const featuredTool = computed(() => globalTools.value[0] || null)

/** 来源类目（左栏索引口径：内置 / 开发 / 用户，真实计数） */
const SOURCE_CATS: { label: string; source: ToolMetadata['source'] }[] = [
  { label: t('plugins.localTools.sourceBuiltin'), source: 'builtin' },
  { label: t('plugins.localTools.sourceDev'), source: 'dev' },
  { label: t('plugins.localTools.sourceUser'), source: 'user' },
]

/** 搜索 / 类目 / 状态过滤全部读市场壳共享状态（页头搜索框 + 左栏索引驱动） */
const filteredTools = computed(() => {
  const slice = pluginsMarket['local-tools']
  const kw = slice.keyword.trim().toLowerCase()
  const catSource = SOURCE_CATS.find(c => c.label === slice.category)?.source
  const list = globalTools.value.filter(tool => {
    const matchCat = !catSource || tool.source === catSource
    const matchKw = !kw
      || tool.displayName.toLowerCase().includes(kw)
      || tool.name.toLowerCase().includes(kw)
      || tool.description.toLowerCase().includes(kw)
    const matchStatus = !slice.status
      || (slice.status === 'enabled' ? tool.enabled : !tool.enabled)
    return matchCat && matchKw && matchStatus
  })
  // 排序：default = 后端返回原序；name = 显示名字典序；pinned = 收藏优先（四市场共享实现）
  return sortMarketList('local-tools', list, slice.sort, (t) => t.pluginId, (t) => t.displayName)
})

// 回填市场壳：类目 / 状态分桶 / 总数（真实计数，Bento 卡与左栏索引展示用）
watchEffect(() => {
  const list = globalTools.value
  const counts: Record<string, number> = {}
  SOURCE_CATS.forEach(({ label, source }) => {
    const n = list.filter(t => t.source === source).length
    if (n > 0) counts[label] = n
  })
  syncMarketSlice('local-tools', {
    total: list.length,
    categories: Object.keys(counts),
    categoryCounts: counts,
    statuses: [
      { key: 'enabled', label: t('plugins.localTools.bucketEnabled'), count: list.filter(t => t.enabled).length, tone: 'success' },
      { key: 'disabled', label: t('plugins.localTools.bucketDisabled'), count: list.filter(t => !t.enabled).length, tone: 'warning' },
    ],
  })
})

defineExpose({
  /** 市场壳页头「添加工具」入口：打开自定义工具弹窗 */
  openAdd: () => { addDialog.value?.open() },
})

onMounted(() => {
  if (!admin.value) return
  loadGlobalTools()
})
</script>

<style scoped>
.lt-forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
}

/* ===== 工具卡片（与 Skills/MCP 市场竖向卡片一致） ===== */
/* 瀑布流（方案 10 · Masonry Digest）：双列多列布局，卡片 break-inside:avoid
   防截断；窄屏退化为单列。原 grid(auto-fill, minmax(210px,1fr)) → 多列瀑布。 */
.lt-grid {
  column-count: 2;
  column-gap: 12px;
}
@media (max-width: 640px) {
  .lt-grid {
    column-count: 1;
  }
}
.lt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--border-subtle, #eef2f8);
  /* 原值 var(--mp-radius-lg, 14px)：--mp-* 来自未引入的 modern-polish.css，是空令牌，
     收敛到 12px 档（14px 距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--radius-lg, var(--el-radius-lg, 12px));
  background: var(--bg-container, #ffffff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  min-width: 0;
  cursor: pointer;
  break-inside: avoid;
  margin-bottom: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
/* 文摘卡：静止态浅投影；悬浮浮起升一档 + 品牌描边 */
.lt-card:hover {
  border-color: color-mix(in srgb, var(--brand-500, #3b82f6) 45%, transparent);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
}
.lt-card--off { opacity: 0.6; }
.lt-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.lt-card__icon { flex: none; }
.lt-card__tag {
  flex: none;
  margin-top: 1px;
}
.lt-card__name {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.lt-card__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lt-card__footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 32px;
}
.lt-card__footer > .el-button {
  margin-right: auto;
}

/* 骨架屏 */
.lt-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.lt-skeleton-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  /* 原值 var(--size-surface-radius, 10px)：令牌恒为 20px，兜底是死代码，
     收敛到 xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
}
.lt-skeleton-lines { flex: 1; min-width: 0; }
.lt-skel {
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: linear-gradient(90deg,
    var(--el-fill-color) 25%, var(--el-fill-color-light) 37%, var(--el-fill-color) 63%);
  background-size: 400% 100%;
  animation: lt-shimmer 1.4s ease infinite;
}
.lt-skel--circle { width: 36px; height: 36px; border-radius: 50%; }
.lt-skel--title { height: 13px; width: 60%; }
.lt-skel--desc { height: 11px; width: 90%; margin-top: 8px; }
@keyframes lt-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .lt-skel { animation: none; }
}

/* 键盘焦点可见性：工具卡片是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 卡底色是令牌化的 --el-bg-color，一档主色描边足够可见。
   注：上面那条 .lt-skel 的 reduced-motion 规则是本文件既有的，本次未改动；
   .lt-card 自带的 transition 也不在本次 A 段清单内，故未降级。 */
.lt-card {
  outline: none;
}

.lt-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
