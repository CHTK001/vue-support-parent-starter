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
                                <!-- 管理员专属项加标记：与 filteredSidebarItems 的 adminOnly 同一个来源 -->
                                <span v-if="item.adminOnly"
                                    class="ml-auto shrink-0 rounded border px-1.5 py-0.5 text-xs leading-none text-(--el-color-primary) border-(--el-color-primary-light-5)">
                                    管理员
                                </span>
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
            <div class="flex-1 overflow-hidden flex flex-col w-full" :style="contentMaxWidthStyle">
                <div class="flex-1 overflow-hidden py-3 min-w-0">
                    <ScrollContainer class="h-full p-4">
                        <!--
                          管理员专属 tab 的统一守卫。
                          为什么要有：侧边栏只把 adminOnly 项**隐藏**了，而路由
                          /setting/:tab 任何登录用户都能直达 —— 不拦的话，
                          普通用户手敲 URL 会渲染出一个空的管理面板
                          （数据拿不到，接口 403，但页壳与按钮都在）。
                          这里按 sidebarItems 里声明的 adminOnly 统一判定，
                          新增 tab 只要标了 adminOnly 就自动被拦住，不会漏。
                          用函数而非 computed：isAdmin() 读的是非响应式的角色缓存，
                          computed 会把首次求值结果永久缓存，权限后到就再也刷不对。
                        -->
                        <div v-if="isCurrentTabAdminOnly() && !isAdmin()" class="admin-only-denied">
                            <el-empty description="仅管理员可访问">
                                <template #description>
                                    <p class="admin-only-title">仅管理员可访问</p>
                                    <p class="admin-only-desc">当前账号无管理员权限，请用管理员账号登录后查看。</p>
                                </template>
                            </el-empty>
                        </div>
                        <template v-else>
                        <template v-if="currentTabValue === 'general'">
                            <GeneralSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'default-models'">
                            <DefaultModelSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'face-config'">
                            <DefaultModelSettings :groups="['face']" />
                        </template>
                        <template v-else-if="currentTabValue === 'image-search-config'">
                            <DefaultModelSettings :groups="['image_search']" />
                        </template>
                        <template v-else-if="currentTabValue === 'layout-config'">
                            <DefaultModelSettings :groups="['layout']" />
                        </template>
                        <template v-else-if="currentTabValue === 'rag-config'">
                            <DefaultModelSettings :groups="['rag']" />
                        </template>
                        <template v-else-if="currentTabValue === 'ocr-config'">
                            <DefaultModelSettings :groups="['ocr']" />
                        </template>
                        <template v-else-if="currentTabValue === 'bot-connector-config'">
                            <DefaultModelSettings :groups="['bot']" />
                        </template>
                        <template v-else-if="currentTabValue === 'language-config'">
                            <DefaultModelSettings :groups="['language']" />
                        </template>
                        <template v-else-if="currentTabValue === 'colorize-config'">
                            <DefaultModelSettings :groups="['image']" />
                        </template>

                        <template v-else-if="currentTabValue === 'appearance'">
                            <AppearanceSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'display'">
                            <DisplaySettings />
                        </template>
                        <template v-else-if="currentTabValue === 'search'">
                            <SearchSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'browser'">
                            <BrowserSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'providers'">
                            <ModelsProviderList
                                :items="providerItems"
                                :templates="providerTemplates"
                                @item-click="gotoModels"
                                @item-edit="gotoModels"
                                @item-delete="gotoModels"
                                @template-click="gotoModels" />
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
                        <!--
                          会话配置：单独给会话的**行为开关**（是否让 AI 联想下一个任务、
                          最多联想几条）。与「默认模型」同口径按用户隔离 —— 每个用户管
                          自己的默认值；服务端已把 session 分组列入整组可用户自管的白名单
                          （组内只有布尔/整数开关，无凭据/地址/路径）。
                        -->
                        <template v-else-if="currentTabValue === 'session-config'">
                            <SessionConfigSettings />
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
                        <!--
                          人脸底库：只做**管理**（查看/登记/删除），识别与检索在外侧「人脸识别」页。
                          与「以图搜图（外侧） + 图像底库（设置内）」同一分工 ——
                          两个同类功能的入口位置一致，也不会让改底库混在识别流程里。
                        -->
                        <template v-else-if="currentTabValue === 'face-library'">
                            <FaceLibraryPanel />
                        </template>
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
// 人脸底库**管理**面板（识别仍在外侧「人脸识别」页，这里只管底库）
import FaceLibraryPanel from './FaceLibraryPanel.vue'

import {
    Grid16Regular,
    Settings16Regular,
    ScanText24Regular,
    Info24Regular,
    Image24Regular,
    Desktop24Regular,
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
    Person20Regular,
} from '@vicons/fluent'

import { ArrowBackIosNewTwotone, VerifiedUserOutlined } from '@vicons/material'

import SessionConfigSettings from './SessionConfigSettings.vue'
import DisplaySettings from './DisplaySettings.vue'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isAdmin } from '@repo/core'
import { adminApi } from '@/framework/context'
import { mapProvider } from '@/components/models/model.utils'
import { PROVIDER_TEMPLATES } from '@/components/models/model.constants'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 设置项分组映射
const groupMap = computed<Record<string, string>>(() => ({
    general: t('settings.system.groups.general'),
    'default-models': t('settings.system.groups.general'),
    'face-config': t('settings.system.groups.general'),
    'image-search-config': t('settings.system.groups.general'),
    'layout-config': t('settings.system.groups.general'),
    'rag-config': t('settings.system.groups.general'),
    'ocr-config': t('settings.system.groups.general'),
    'bot-connector-config': t('settings.system.groups.general'),
    'language-config': t('settings.system.groups.general'),
    'colorize-config': t('settings.system.groups.general'),
    ocr: t('settings.system.groups.general'),
    browser: t('settings.system.groups.general'),
    connections: t('settings.system.groups.general'),
    appearance: t('settings.system.groups.personalization'),
    // 显示配置归「常规」：与「会话配置」同属个人行为偏好（纯布局，无凭据/路径），
    // 所有登录用户可改自己的值，故不进 personalization 也不设 adminOnly。
    display: t('settings.system.groups.general'),
    search: t('settings.system.groups.personalization'),
    about: t('settings.system.groups.system'),
    community: t('settings.system.groups.system'),
    'session-groups': t('settings.system.groups.dataManagement'),
    'session-archived': t('settings.system.groups.dataManagement'),
    // 会话配置按用户隔离（个人行为偏好），与「默认模型」同组
    'session-config': t('settings.system.groups.general'),
    'model-metrics': t('settings.system.groups.dataManagement'),
    'skills-source': t('settings.system.groups.dataManagement'),
    usage: t('settings.system.groups.dataManagement'),
    security: t('settings.system.groups.account'),
    services: t('settings.system.groups.system'),
    'service-tokens': t('settings.system.groups.system'),
    'file-storage': t('settings.system.groups.system'),
    // 底库：图像底库与人脸底库归到同一个分组。
    // 原先图像底库挂在「系统」组、人脸库挂在外侧主导航，两个同类功能分处两地；
    // 收进同一个「底库」分组后，入口位置与语义一致。
    'image-library': t('settings.system.groups.library'),
    'face-library': t('settings.system.groups.library'),
}))

// 设置项菜单
const sidebarItems = computed(() => [
    {
        // 通用/常规配置：系统级参数（缓存目录、工作目录、默认行为等），
        // 普通用户改了会影响整台实例，故限管理员。
        label: t('settings.system.tabs.general'),
        path: 'general',
        icon: Settings16Regular,
        roles: ['primary'],
        adminOnly: true,
    },
    {
        label: t('settings.system.tabs.defaultModels'),
        path: 'default-models',
        icon: Grid16Regular,
        roles: ['primary'],
        // 默认模型改为**按用户隔离**：每个用户管自己的默认模型，不再只让管理员改。
        //
        // 三道配套（缺一就会出现「页面能改、功能不认」的两处真相）：
        //   ① 本 tab 去掉 adminOnly，所有登录用户可见；
        //   ② 后端 SettingsController 按**字段名含 model** 放行用户覆盖
        //      （不整组放开 —— 同组的 *_api_key / *_base_url / provider_app_secret 仍是管理员专属，
        //        非管理员读到时服务端已掩码为 ***）；
        //   ③ 消费方按用户读：EffectiveChatModelResolver 已按 userId 取
        //      sys_ai_user_setting 里的 runtime.default_model。
        //
        // 仍保留管理员专属的字段（凭据、工作间基路径、user_tool_access 等）由
        // 服务端逐字段拦截，前端不重复维护一份清单。
    },
    {
        // 从默认模型页拆出的独立配置：人脸识别
        label: '人脸识别配置',
        path: 'face-config',
        icon: Person20Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：以图搜图
        label: '以图搜图配置',
        path: 'image-search-config',
        icon: Image24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：布局识别
        label: '布局配置',
        path: 'layout-config',
        icon: ScanText24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：RAG
        label: 'RAG 配置',
        path: 'rag-config',
        icon: DataHistogram24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：OCR
        label: 'OCR 配置',
        path: 'ocr-config',
        icon: ScanText24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：连接器(bot)
        label: '连接器配置',
        path: 'bot-connector-config',
        icon: Cloud24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：语言
        label: '语言配置',
        path: 'language-config',
        icon: Globe24Regular,
        roles: ['primary'],
    },
    {
        // 图像上色模型配置：从默认模型页拆出的独立菜单
        label: '图像上色配置',
        path: 'colorize-config',
        icon: Image24Regular,
        roles: ['primary'],
    },

    {
        label: t('settings.system.tabs.appearance'),
        path: 'appearance',
        icon: Image24Regular,
        roles: ['primary'],
    },
    {
        // 常规用户的通用配置：当前只有「右侧问答栏宽度」一项（知识库详情页）。
        // 不标 adminOnly —— 组内是纯布局偏好，普通用户管自己的值即可
        // （持久化走 appearance 分组按用户覆盖层，见 useKbDisplay.ts）。
        label: t('settings.system.tabs.display'),
        path: 'display',
        icon: Desktop24Regular,
        roles: ['primary'],
    },
    {
        label: t('settings.system.tabs.search'),
        path: 'search',
        icon: Search16Regular,
        roles: ['primary'],
        // search 分组里是搜索供应商的 API Key（bocha / tavily），系统级凭据。
        // 同理：接口已拒绝普通账号写入，页面同步收进管理员专属。
        adminOnly: true,
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
        // 会话配置：单独对会话的配置（是否启用 AI 联想下一个任务等）。
        //
        // 去掉 adminOnly，与「默认模型」同口径：**每个用户管自己的会话行为默认值**。
        // 服务端 `SettingsController.USER_WRITABLE_GROUPS` 已包含 session 分组，
        // 该组内只有布尔/整数开关，不含凭据/地址/路径。
        //
        // 「会话保留原始信息」：这里的值是**默认值**，真正生效的开关钉在每个会话
        // 自身的 settings.aiNextTask 上，之后改默认值不回溯改写已有会话。
        label: t('settings.system.tabs.sessionConfig'),
        path: 'session-config',
        icon: Chat24Regular,
        roles: ['primary'],
    },
    {
        // 用量配置：后端 /v2/usage/** 全部是 @Permission("admin")。
        // 此前没标 adminOnly，非管理员能看到入口、点进去直接报
        // 「加载用量配置失败：Request failed with status code 403」（实测确认）。
        label: '用量配置',
        path: 'usage',
        icon: DataUsage24Regular,
        roles: ['primary'],
        adminOnly: true,
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
        // 图像底库：以图搜图的检索底库。底库**按账号隔离**（<工作目录>/<账号>/imagesearch），
        // 每个账号只增删自己的库，因此不再需要管理员门槛 —— 原先「普通用户能改等于
        // 向量索引可被任意污染」的理由在隔离之后不成立。
        // 曾内嵌在「默认模型」页底部，用户反馈设置中心里看不到入口 —— 13 个分组的
        // 折叠面板把真正需要日常维护的功能埋在最下方，故提为独立 tab。
        label: t('settings.system.tabs.imageLibrary'),
        path: 'image-library',
        icon: Image24Regular,
        roles: ['primary'],
    },
    {
        // 人脸底库：从外侧主导航的「人脸识别」迁入。
        // 人脸库与图像底库是同类功能（都是「按账号隔离的本地底库」），
        // 分处主导航与设置中心两处会让入口位置失去一致性，故一并收进「底库」分组。
        // 同样按账号隔离，故不设 adminOnly。
        label: t('settings.system.tabs.faceLibrary'),
        path: 'face-library',
        icon: Person20Regular,
        roles: ['primary'],
    },
])

// 根据用户角色过滤菜单项
const filteredSidebarItems = computed(() => {    const userRole = authStore.user?.role || 'primary'
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
        t('settings.system.groups.library'),
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
/**
 * 当前 tab 是否为「管理员专属」。
 *
 * <p>判据直接取自 sidebarItems 里声明的 {@code adminOnly}，而不是另写一份
 * tab 名单 —— 另写一份就会出现「侧边栏标了 adminOnly、模板忘了拦」这种漏。
 * 用普通函数而非 computed：{@code isAdmin()} 读的是模块级非响应式的角色缓存，
 * computed 会把首次求值结果永久缓存，登录态恢复晚于组件 setup 时管理员也会被误拦。
 *
 * @returns 当前 tab 仅管理员可见时为 true
 */
const isCurrentTabAdminOnly = () =>
    sidebarItems.value.some((item) => item.path === currentTabValue.value && item.adminOnly === true)

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

// providers tab 的数据：原实现把 <ModelsProviderList /> 当自取数组件用，但它其实
// 只吃 items/templates 两个 props，于是这个 tab 恒为空。这里按模型管理页同一接口
// （/api/providers + PROVIDER_TEMPLATES）取数，去掉已添加的模板，复用 mapProvider
// 保证与 /models 的字段口径一致（models[] / enabled 数量同源）。
const providerItems = ref<any[]>([])
const providerTemplates = ref<any[]>([])
const providerLoaded = ref(false)
let providerLoading = false

const loadProviderPanel = async () => {
    if (providerLoading) return
    providerLoading = true
    try {
        const body = await adminApi.get('/api/providers')
        const rawList = Array.isArray(body) ? body : body?.data || []
        const list = rawList.map(mapProvider)
        providerItems.value = list
        const added = new Set(list.map((p: any) => p.provider))
        providerTemplates.value = PROVIDER_TEMPLATES.filter((tpl: any) => !added.has(tpl.id))
        providerLoaded.value = true
    } catch (e) {
        console.warn('加载供应商面板失败:', e)
    } finally {
        providerLoading = false
    }
}

// 面板卡片的增删改/一键添加实际落在模型管理页，这里只做入口跳转
const gotoModels = () => router.push({ name: 'Models' })

// 右侧内容区宽度：宽表格类 tab（服务配置 / 令牌 / 供应商 / 模型指标）不吃满宽会挤成横向滚动条，
// 这些页签放开 max-w 限制；其余页签跟随「设置 → 显示」的窄屏/满屏设置
// （MainLayout 仅在满屏时注入 --content-max-width: none），窄屏保持原
// md:max-w-220（55rem）居中阅读列，满屏撑满剩余空间。
const WIDE_TABS = ['services', 'service-tokens', 'providers', 'model-metrics']
const contentMaxWidthStyle = computed(() =>
    WIDE_TABS.includes(currentTabValue.value)
        ? {}
        : { maxWidth: 'var(--content-max-width, 55rem)', marginLeft: 'auto', marginRight: 'auto' },
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

// 进入 providers tab 才拉供应商面板数据（该 tab 数据与设置主表无关，懒加载）
watch(currentTabValue, (v) => {
    if (v === 'providers') loadProviderPanel()
}, { immediate: true })

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

/* 管理员专属 tab 对非管理员展示的拒绝态：占满可用高度，居中说明 */
.admin-only-denied {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 320px;
}

.admin-only-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
}

.admin-only-desc {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
}
</style>

