<template>
    <div class="h-full overflow-hidden flex flex-col" data-page="plugins">
        <div class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 overflow-auto pb-4" style="scrollbar-gutter: stable both-edges;">
                <!-- 内容区：跟随「设置 → 显示」窄屏/满屏，满屏时 MainLayout 注入 --content-max-width: none 撑满 -->
                <div class="py-3 px-4 w-full mx-auto" :style="{ maxWidth: 'var(--content-max-width, 65rem)' }">
                    <!-- 刊头：kicker + 渐变大标题 + 副标题 + 搜索 / 主操作（V1+V2 融合稿） -->
                    <header class="pm-masthead">
                        <div>
                            <div class="pm-kicker">{{ t('plugins.market.kicker') }}</div>
                            <h1 class="pm-title">{{ t('plugins.market.title') }}</h1>
                            <p class="pm-subtitle">{{ t('plugins.market.subtitle') }}</p>
                        </div>
                        <div class="pm-masthead-actions">
                            <el-input v-model="activeSlice.keyword" class="pm-search" size="default" clearable
                                :placeholder="activeSearchPlaceholder" :aria-label="t('plugins.market.searchLabel')"
                                @keyup.enter="handleSearchEnter" @clear="handleSearchClear">
                                <template #prefix>
                                    <el-icon><Search /></el-icon>
                                </template>
                            </el-input>
                            <el-button v-if="activeCta" type="primary" size="default" @click="handlePrimaryAction">
                                {{ activeCta }}
                            </el-button>
                        </div>
                    </header>

                    <!-- Bento 市场导航：四卡 = 四市场，真实计数，点选切换（路由同步逻辑不变） -->
                    <nav class="pm-bento" role="tablist" :aria-label="t('plugins.page.title')">
                        <button v-for="card in bentoCards" :key="card.key" type="button" role="tab"
                            class="pm-bento-card"
                            :class="[`pm-bento-card--${card.key}`, { 'is-active': currentTabValue === card.key }]"
                            :aria-selected="currentTabValue === card.key"
                            @click="handleTabChange(card.key)">
                            <span class="pm-bento-top">
                                <span class="pm-bento-ico"><component :is="card.icon" /></span>
                                <span class="pm-bento-count">{{ card.count }}</span>
                            </span>
                            <span class="pm-bento-name">{{ card.label }}</span>
                            <span class="pm-bento-desc">{{ card.desc }}</span>
                        </button>
                    </nav>

                    <!-- 主体：左栏类目/状态索引 + 右侧市场（v-show 全挂载，保证真实计数） -->
                    <div class="pm-body">
                        <aside v-show="!activeSlice.railHidden" class="pm-rail">
                            <div class="pm-rail-section">
                                <div class="pm-rail-title">{{ t('plugins.market.categories') }}</div>
                                <button type="button" class="pm-rail-item"
                                    :class="{ 'is-active': activeSlice.category === '' }"
                                    @click="activeSlice.category = ''">
                                    <span class="pm-rail-label">{{ t('plugins.market.allCategories') }}</span>
                                    <span class="pm-rail-num">{{ activeSlice.total }}</span>
                                </button>
                                <button v-for="cat in activeSlice.categories" :key="cat" type="button"
                                    class="pm-rail-item" :class="{ 'is-active': activeSlice.category === cat }"
                                    @click="activeSlice.category = cat">
                                    <span class="pm-rail-label">{{ cat }}</span>
                                    <span class="pm-rail-num">{{ activeSlice.categoryCounts[cat] || 0 }}</span>
                                </button>
                            </div>
                            <div class="pm-rail-divider"></div>
                            <div class="pm-rail-section">
                                <div class="pm-rail-title">{{ t('plugins.market.status') }}</div>
                                <button type="button" class="pm-rail-item"
                                    :class="{ 'is-active': activeSlice.status === '' }"
                                    @click="activeSlice.status = ''">
                                    <span class="pm-rail-label">{{ t('plugins.market.allStatus') }}</span>
                                </button>
                                <button v-for="st in activeSlice.statuses" :key="st.key" type="button"
                                    class="pm-rail-item" :class="{ 'is-active': activeSlice.status === st.key }"
                                    @click="activeSlice.status = st.key">
                                    <span class="pm-dot" :class="`pm-dot--${st.tone}`"></span>
                                    <span class="pm-rail-label">{{ st.label }}</span>
                                    <span class="pm-rail-num">{{ st.count }}</span>
                                </button>
                            </div>
                            <div class="pm-rail-tip">{{ t('plugins.market.railTip') }}</div>
                        </aside>

                        <section class="pm-main">
                            <CharacterMarket v-show="currentTabValue === 'characters'" ref="charactersRef" />
                            <Skills v-show="currentTabValue === 'skills'" ref="skillsRef" />
                            <MCPServers v-show="currentTabValue === 'mcp'" ref="mcpRef" />
                            <LocalTools v-show="currentTabValue === 'local-tools'" ref="localToolsRef" />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isAdmin } from '@repo/core'
import { Search } from '@element-plus/icons-vue'
import MCPServers from './MCPServers.vue'
import LocalTools from './LocalTools.vue'
import Skills from './Skills.vue'
import CharacterMarket from './CharacterMarket.vue'
import { pluginsMarket, type MarketKey } from './plugins-market'

import {
    Dumbbell16Regular,
    WrenchScrewdriver24Regular,
    Code24Regular,
    ContactCard20Regular
} from '@vicons/fluent'

import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// MCP / 本地工具仅对 v-admin 开放
const admin = ref(isAdmin())
const ADMIN_ONLY = new Set(['local-tools', 'mcp'])

// 插件设置 Tab 菜单
const sidebarItems = computed(() => [
    {
        label: t('plugins.page.tabCharacters'),
        path: 'characters',
        icon: ContactCard20Regular,
    },
    {
        label: t('plugins.page.tabLocalTools'),
        path: 'local-tools',
        icon: WrenchScrewdriver24Regular,
    },
    {
        label: t('plugins.page.tabSkills'),
        path: 'skills',
        icon: Code24Regular,
    },
    {
        label: t('plugins.page.tabMcp'),
        path: 'mcp',
        icon: Dumbbell16Regular,
    },
].filter((item) => admin.value || !ADMIN_ONLY.has(item.path)))

// Tab 数据（用于模板渲染）
const tabItems = computed(() => sidebarItems.value)

// 获取默认标签页
const getDefaultTabPath = () => {
    return sidebarItems.value[0]?.path || 'mcp'
}

const currentTabValue = ref(getDefaultTabPath())

// Tab 切换处理
const handleTabChange = (tabName: string | number) => {
    const tabPath = typeof tabName === 'string' ? tabName : String(tabName)
    router.replace({ name: 'Plugins', params: { tab: tabPath } })
}

// 监听路由参数变化
watch(() => route.params.tab, (newPath) => {
    // 确保 newPath 是字符串类型
    let tabPath = Array.isArray(newPath) ? newPath[0] : (newPath as string)
    // 非管理员访问受限 tab：回退到默认
    if (tabPath && ADMIN_ONLY.has(tabPath) && !admin.value) {
        tabPath = getDefaultTabPath()
    }
    if (tabPath && tabPath !== currentTabValue.value) {
        currentTabValue.value = tabPath
    }
})

onMounted(() => {
    // 如果没有路由参数，则跳转到默认标签页
    if (!route.params.tab) {
        const defaultTab = getDefaultTabPath()
        router.replace({ name: 'Plugins', params: { tab: defaultTab } })
    } else {
        // 确保 route.params.tab 是字符串类型
        let tabParam = Array.isArray(route.params.tab) ? route.params.tab[0] : (route.params.tab as string)
        // 非管理员直接访问受限 tab：重定向到默认
        if (ADMIN_ONLY.has(tabParam) && !admin.value) {
            tabParam = getDefaultTabPath()
            router.replace({ name: 'Plugins', params: { tab: tabParam } })
        }
        currentTabValue.value = tabParam
    }
})

// ── 融合稿：共享市场状态（筛选与真实计数由各市场组件回填） ──
const charactersRef = ref<InstanceType<typeof CharacterMarket> | null>(null)
const skillsRef = ref<InstanceType<typeof Skills> | null>(null)
const mcpRef = ref<InstanceType<typeof MCPServers> | null>(null)
const localToolsRef = ref<InstanceType<typeof LocalTools> | null>(null)

/** 当前市场的共享切片（keyword / category / status / counts） */
const activeSlice = computed(() => pluginsMarket[currentTabValue.value as MarketKey])

const activeSearchPlaceholder = computed(() => {
    const key = currentTabValue.value
    if (key === 'characters') return t('plugins.market.search.characters')
    if (key === 'skills') return t('plugins.market.search.skills')
    if (key === 'mcp') return t('plugins.market.search.mcp')
    if (key === 'local-tools') return t('plugins.market.search.localTools')
    return ''
})

/** Bento 四卡：市场名 + 真实计数 + 一句话说明 */
const bentoCards = computed(() => tabItems.value.map((item) => ({
    key: item.path,
    label: item.label,
    icon: item.icon,
    count: pluginsMarket[item.path as MarketKey]?.total ?? 0,
    desc: t(`plugins.market.bentoDesc.${item.path}`),
})))

/** 页头主操作文案（各市场的「添加 / 安装」入口） */
const activeCta = computed(() => {
    const key = currentTabValue.value
    if (key === 'characters') return t('plugins.market.cta.characters')
    if (key === 'skills') return t('plugins.market.cta.skills')
    if (key === 'mcp') return t('plugins.market.cta.mcp')
    if (key === 'local-tools') return t('plugins.market.cta.localTools')
    return ''
})

function handlePrimaryAction() {
    if (currentTabValue.value === 'characters') charactersRef.value?.openAdd()
    else if (currentTabValue.value === 'skills') skillsRef.value?.openAdd()
    else if (currentTabValue.value === 'mcp') mcpRef.value?.openAdd()
    else if (currentTabValue.value === 'local-tools') localToolsRef.value?.openAdd()
}

/** 回车触发 SPI 检索（仅 Skills / MCP 走后端检索，其余市场关键词即时过滤） */
function handleSearchEnter() {
    if (currentTabValue.value === 'skills') skillsRef.value?.runSearch()
    else if (currentTabValue.value === 'mcp') mcpRef.value?.runSearch()
}

function handleSearchClear() {
    if (currentTabValue.value === 'skills') skillsRef.value?.clearSearch()
    else if (currentTabValue.value === 'mcp') mcpRef.value?.clearSearch()
}
</script>

<style src="./plugins-market.css"></style>
