<template>
    <div class="h-full flex">
        <Teleport v-if="portalReady" to="#settings-sidebar-portal">
            <!-- 设置侧边栏：Teleport 到全局侧边栏位置以获得毛玻璃效果 -->
            <div
                class="h-full sidebar-transparent-bg global-sidebar flex flex-col overflow-hidden">
                <!-- 返回应用 -->
                <div class="px-3 pt-3 pb-2">
                    <div @click="goBack"
                        class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:bg-(--color-sidebar-bg-hover) hover:text-(--color-sidebar-text-hover) transition-all duration-200">
                        <ArrowBackIosNewTwotone class="w-4 h-4" />
                        <span>{{ t('settings.system.backToApp') }}</span>
                    </div>
                </div>
                <!-- 分组列表 -->
                <ScrollContainer class="flex-1 py-3">
                    <div v-for="group in groupedSidebarItems" :key="group.label" class="mb-2">
                        <div
                            class="px-4 pt-2 pb-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                            {{ group.label }}
                        </div>
                        <div class="px-2 space-y-1">
                            <div v-for="item in group.items" :key="item.path" @click="handleItemClick(item.path)"
                                class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                                :class="currentTabValue === item.path
                                    ? 'bg-(--color-sidebar-bg-active) text-(--color-sidebar-text-active)'
                                    : 'text-(--color-text) hover:bg-(--color-sidebar-bg-hover) hover:text-(--color-sidebar-text-hover)'">
                                <component :is="item.icon" class="w-4.5 h-4.5 shrink-0" />
                                <span class="text-sm font-medium">{{ item.label }}</span>
                            </div>
                        </div>
                    </div>
                </ScrollContainer>
            </div>
        </Teleport>

        <!-- 内容区 -->
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <PageHeader>
                <template #title>
                    <span class="text-sm text-gray-400 dark:text-gray-500">{{ t('settings.system.title') }}</span>
                    <span class="text-sm text-gray-300 dark:text-gray-600 mx-1.5">·</span>
                    <span class="text-sm font-semibold text-gray-800 dark:text-[#e8e9ed]">{{ currentTabLabel }}</span>
                </template>
            </PageHeader>
            <div class="flex-1 overflow-hidden flex flex-col w-full" :class="contentMaxWidthClass">
                <div class="flex-1 overflow-hidden py-3 min-w-0">
                    <ScrollContainer class="h-full p-4">
                        <template v-if="currentTabValue === 'general'">
                            <GeneralSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'default-models'">
                            <DefaultModelSettings />
                        </template>

                        <template v-else-if="currentTabValue === 'appearance'">
                            <AppearanceSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'search'">
                            <SearchSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'browser'">
                            <BrowserSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'providers'">
                            <ModelsProviderList />
                        </template>
                        <template v-else-if="currentTabValue === 'about'">
                            <AboutPanel />
                        </template>
                        <template v-else-if="currentTabValue === 'community'">
                            <CommunityPanel />
                        </template>
                        <template v-else-if="currentTabValue === 'session-groups'">
                            <SessionGroupManage />
                        </template>
                        <template v-else-if="currentTabValue === 'session-archived'">
                            <ArchivedSessions />
                        </template>
                        <template v-else-if="currentTabValue === 'security'">
                            <UserSecurity />
                        </template>
                        <template v-else-if="currentTabValue === 'connections'">
                            <ConnectionSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'usage'">
                            <UsageConfigSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'model-metrics'">
                            <ModelMetricsSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'skills-source'">
                            <SkillsSourceSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'services'">
                            <ServiceManagementPage />
                        </template>
                        <template v-else-if="currentTabValue === 'service-tokens'">
                            <ServiceTokensPage />
                        </template>
                        <!--
                          文件存储：直接复用 @repo/filesystem 的 FileStorageManage。
                          该页原本对接独立文件服务器（默认 127.0.0.1:18080），
                          这里作为「系统配置」的一个只读查看入口，
                          便于排查生成任务的参考图/产物是否真的落盘。
                        -->
                        <template v-else-if="currentTabValue === 'file-storage'">
                            <FileStorageManage class="h-full" />
                        </template>
                        <!--
                          图像底库：以图搜图底库的独立管理页。
                          从「默认模型」页底部提上来 —— 底库需要日常增删，
                          藏在 13 个分组的折叠面板最下方等于没有入口。
                        -->
                        <template v-else-if="currentTabValue === 'image-library'">
                            <!-- 面板自带页头与副标题，此处不再重复一段说明文字 -->
                            <ImageLibraryPanel />
                        </template>
                    </ScrollContainer>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import DefaultModelSettings from './DefaultModelSettings.vue'
import GeneralSettings from './GeneralSettings.vue'

import AppearanceSettings from './AppearanceSettings.vue'
import SearchSettings from './SearchSettings.vue'
import BrowserSettings from './BrowserSettings.vue'
import ModelsProviderList from './ModelsProviderList.vue'
import AboutPanel from '../plugins/AboutPanel.vue'
import SessionGroupManage from './SessionGroupManage.vue'
import ArchivedSessions from './ArchivedSessions.vue'
import UserSecurity from './UserSecurity.vue'
import ConnectionSettings from './ConnectionSettings.vue'
import ModelMetricsSettings from './ModelMetricsSettings.vue'
import UsageConfigSettings from './UsageConfigSettings.vue'
import SkillsSourceSettings from './SkillsSourceSettings.vue'
import ServiceManagementPage from '../management/ServiceManagementPage.vue'
import ServiceTokensPage from '../management/ServiceTokensPage.vue'
import CommunityPanel from './CommunityPanel.vue'
import ScrollContainer from '../ui/ScrollContainer.vue'
// 复用 pages/filesystem 的文件存储管理页（同一份实现，不复制）
import { FileStorageManage } from '@pages/filesystem'
// 以图搜图图像底库管理面板（同一份实现，被「图像底库」tab 复用）
import ImageLibraryPanel from './ImageLibraryPanel.vue'

import {
    Grid16Regular,
    Settings16Regular,
    ScanText24Regular,
    Info24Regular,
    Image24Regular,
    Search16Regular,
    Globe24Regular,
    Folder20Regular,
    Archive20Regular,
    Cloud24Regular,
    Chat24Regular,
    DataHistogram24Regular,
    DataUsage24Regular,
    PuzzlePiece24Regular,
    Server24Regular,
} from '@vicons/fluent'

import { ArrowBackIosNewTwotone, VerifiedUserOutlined } from '@vicons/material'

import { useAuthStore } from '../../stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAdmin } from '@repo/core'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 设置项分组映射
const groupMap = computed<Record<string, string>>(() => ({
    general: t('settings.system.groups.general'),
    'default-models': t('settings.system.groups.general'),
    ocr: t('settings.system.groups.general'),
    browser: t('settings.system.groups.general'),
    connections: t('settings.system.groups.general'),
    appearance: t('settings.system.groups.personalization'),
    search: t('settings.system.groups.personalization'),
    about: t('settings.system.groups.system'),
    community: t('settings.system.groups.system'),
    'session-groups': t('settings.system.groups.dataManagement'),
    'session-archived': t('settings.system.groups.dataManagement'),
    'model-metrics': t('settings.system.groups.dataManagement'),
    'skills-source': t('settings.system.groups.dataManagement'),
    usage: t('settings.system.groups.dataManagement'),
    security: t('settings.system.groups.account'),
    services: t('settings.system.groups.system'),
    'service-tokens': t('settings.system.groups.system'),
    'file-storage': t('settings.system.groups.system'),
    'image-library': t('settings.system.groups.system'),
}))

// 设置项菜单
const sidebarItems = computed(() => [
    {
        label: t('settings.system.tabs.general'),
        path: 'general',
        icon: Settings16Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.defaultModels'),
        path: 'default-models',
        icon: Grid16Regular,
        roles: ['primary'],
    },

    {
        label: t('settings.system.tabs.appearance'),
        path: 'appearance',
        icon: Image24Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.search'),
        path: 'search',
        icon: Search16Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.browser'),
        path: 'browser',
        icon: Globe24Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.connections'),
        path: 'connections',
        icon: Cloud24Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.sessionGroups'),
        path: 'session-groups',
        icon: Folder20Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.sessionArchived'),
        path: 'session-archived',
        icon: Archive20Regular,
        roles: ['primary'],
    },
    {
        label: '用量配置',
        path: 'usage',
        icon: DataUsage24Regular,
        roles: ['primary'],
    },
    {
        label: '模型指标采集',
        path: 'model-metrics',
        icon: DataHistogram24Regular,
        roles: ['primary'],
    },
    {
        label: 'Skills 配置',
        path: 'skills-source',
        icon: PuzzlePiece24Regular,
        roles: ['primary'],
    },
    {
        label: '账号安全',
        path: 'security',
        icon: VerifiedUserOutlined,
        roles: ['primary'],
    },
    {
        label: '服务配置',
        path: 'services',
        icon: Server24Regular,
        roles: ['primary'],
        adminOnly: true,
    },
    {
        // 文件存储：查看文件服务器上的对象，供排查生成任务的参考图/产物落盘情况
        label: '文件存储',
        path: 'file-storage',
        icon: Folder20Regular,
        roles: ['primary'],
        adminOnly: true,
    },
    {
        // 图像底库：以图搜图的检索底库。底库是全局共享资源且直接决定检索准确度，
        // 普通用户能改等于向量索引可被任意污染，故与「服务配置」同级、仅管理员可见。
        // 曾内嵌在「默认模型」页底部，用户反馈设置中心里看不到入口 —— 13 个分组的
        // 折叠面板把真正需要日常维护的功能埋在最下方，故提为独立 tab。
        label: '图像底库',
        path: 'image-library',
        icon: Image24Regular,
        roles: ['primary'],
        adminOnly: true,
    },
])

// 根据用户角色过滤菜单项
const filteredSidebarItems = computed(() => {
    const userRole = authStore.user?.role || 'primary'
    return sidebarItems.value.filter(item => {
        if (item.adminOnly && !isAdmin()) return false
        return !item.roles || item.roles.includes(userRole)
    })
})

// 按分组组织侧边栏项
const groupedSidebarItems = computed(() => {
    const items = filteredSidebarItems.value
    const groupOrder = [
        t('settings.system.groups.general'),
        t('settings.system.groups.personalization'),
        t('settings.system.groups.dataManagement'),
        t('settings.system.groups.account'),
        t('settings.system.groups.system'),
    ]
    const groups: Record<string, typeof items> = {}
    for (const g of groupOrder) groups[g] = []
    for (const item of items) {
        const g = groupMap.value[item.path] || t('settings.system.groups.system')
        if (!groups[g]) groups[g] = []
        groups[g].push(item)
    }
    return groupOrder
        .filter(g => groups[g].length > 0)
        .map(g => ({ label: g, items: groups[g] }))
})

// 获取默认标签页
const getDefaultTabPath = () => {
    const userRole = authStore.user?.role || 'primary'
    const firstValidItem = filteredSidebarItems.value.find(item => {
        if (!item.roles || item.roles.includes(userRole)) {
            return item.path
        }
        return false
    })
    return firstValidItem?.path || 'general'
}

const currentTabValue = ref(getDefaultTabPath())

// 宽表格类 tab（服务配置 / 令牌 / 供应商 / 模型指标）不吃满宽会挤成横向滚动条，
// 这些页签放开 max-w 限制；其余窄内容页签保持居中定宽，避免长行难读。
const WIDE_TABS = ['services', 'service-tokens', 'providers', 'model-metrics']
const contentMaxWidthClass = computed(() =>
    WIDE_TABS.includes(currentTabValue.value) ? '' : 'md:max-w-220 md:mx-auto',
)

// Teleport 目标就绪标志：确保 #settings-sidebar-portal 已挂载到 DOM
const portalReady = ref(false)

// 当前标签标题
const currentTabLabel = computed(() => {
    if (currentTabValue.value === 'service-tokens') return '访问令牌'
    const item = filteredSidebarItems.value.find(i => i.path === currentTabValue.value)
    return item?.label || t('settings.system.settings')
})

// 点击侧边栏项
const handleItemClick = (path: string) => {
    // 如果是外部路由（以/开头），直接跳转
    if (path.startsWith('/')) {
        router.push(path)
        return
    }
    currentTabValue.value = path
    router.replace({ name: 'SystemSettings', params: { tab: path } })
}

// 返回应用
const goBack = () => {
    router.replace({ name: 'Chat', params: { sessionId: 'new-session' } })
}

// 监听路由参数变化
watch(() => route.params.tab, (newPath) => {
    const tabPath = Array.isArray(newPath) ? newPath[0] : (newPath as string)
    if (tabPath && tabPath !== currentTabValue.value) {
        currentTabValue.value = tabPath
    }
})

onMounted(() => {
    if (!route.params.tab) {
        const defaultTab = getDefaultTabPath()
        router.replace({ name: 'SystemSettings', params: { tab: defaultTab } })
    } else {
        const tabParam = Array.isArray(route.params.tab) ? route.params.tab[0] : (route.params.tab as string)
        currentTabValue.value = tabParam
    }
    // 等待 DOM 提交完成后再启用 Teleport，避免刷新时目标尚未插入 document
    nextTick(() => {
        portalReady.value = !!document.getElementById('settings-sidebar-portal')
    })
})
</script>

<style scoped>
/* 图像底库 tab 的外层容器：ScrollContainer 已给 p-4，这里只补上下留白与提示文字 */
.image-library-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 24px;
}

.image-library-hint {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary, #6b7280);
}
</style>

