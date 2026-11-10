<template>
    <div class="h-full flex" data-page="system-settings">
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
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ currentTabLabel }}</span>
                </template>
            </PageHeader>
            <div class="flex-1 overflow-hidden flex flex-col w-full" :style="contentMaxWidthStyle">
                <div class="flex-1 overflow-hidden min-w-0" :class="isModelsTab ? '' : 'py-3'">
                    <!--
                      模型管理（配置中心入口）：与主页「模型管理」(/models) **渲染同一个组件**，
                      两个入口一份实现，杜绝「主页一套、设置里一套」各自漂移。

                      为什么不套 ScrollContainer：ModelsPage 是「左供应商栏 + 右模型工作区」的
                      双栏工作台，左右各自独立滚动，且靠 h-full 撑满高度。放进 ScrollContainer
                      后父级高度由内容决定，h-full 塌成内容高 —— 左栏滚不动、右侧模型表格的
                      表头也贴不住顶。所以这里直接拿整块高度，其余 tab 仍走 ScrollContainer。

                      不做管理员门槛：模型管理所有登录用户都可用（与主页 /models 一致）。
                      写接口的权限由服务端 @Permission("admin") 逐条把关，前端不再另判一次。
                    -->
                    <div v-if="currentTabValue === 'models'" class="models-tab-host">
                        <ModelsPage embedded />
                    </div>
                    <ScrollContainer v-else class="h-full p-4">
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
                        <template v-else-if="currentTabValue === 'reid-config'">
                            <!-- 人脸重识别：只渲染 ReID 专属的 7 项（分流阈值 / 低阈值检测 /
                                 同人判定 / 时间窗 / 轨迹容量 / 保留时长 / 默认摄像头）。
                                 检测模型、特征模型、活体、质量、超分、属性等属于「人脸识别配置」，
                                 那一页已有全量入口，这里再渲染一遍就是同一批字段两个入口。 -->
                            <DefaultModelSettings :groups="['face']" :fields="REID_FIELDS" />
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
                        <template v-else-if="currentTabValue === 'paper-config'">
                            <!-- 试卷配置 = paper（识别）+ marking（阅卷设置）+ compose（AI 组卷）三组，
                                 与 eduai「AI 配置中心」共用同一个组件，避免两处各有一套表单、各自保存互相打架 -->
                            <PaperConfigPanel :global-save="true" />
                        </template>
                        <template v-else-if="currentTabValue === 'bot-connector-config'">
                            <DefaultModelSettings :groups="['bot']" />
                        </template>
                        <template v-else-if="currentTabValue === 'audio-config'">
                            <!-- 音频配置同页管「识别」与「合成」两个分组：两者共享 provider/密钥/地址
                                 那套心智模型，分两页反而更难对应。 -->
                            <DefaultModelSettings :groups="['asr', 'tts']" />
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
                        <template v-else-if="currentTabValue === 'protocol-server'">
                            <!-- 聚合协议服务：只暴露后端真正读取的两个字段
                                 （runtime.protocol_server_enabled / _port）。
                                 原先的 protocol-server 分组是无人读取的重复定义，已从后端删除。 -->
                            <ProtocolServerSettings />
                        </template>
                        <template v-else-if="currentTabValue === 'service-tokens'">
                            <ServiceTokensPage />
                        </template>
                        <!--
                          渠道管理：账号类渠道（Cline / Qoder / Trae / Gemini）的账号绑定、
                          轮询、刷新、签到、模型拉取与单模型开关。
                          账号连接按 userId 隔离（sys_ai_provider_connection_user_id），
                          每个用户管理自己的绑定，与其它菜单口径一致；免费渠道另走管理员配置。
                        -->
                        <template v-else-if="currentTabValue === 'channels'">
                            <ChannelManagementPage />
                        </template>
                        <!--
                          菜单管理：把侧栏菜单全部列出，逐项「显示 / 隐藏」。
                          与侧栏同源清单（config/sidebarMenu.ts），改完立即生效。
                        -->
                        <template v-else-if="currentTabValue === 'menu-manage'">
                            <MenuDisplaySettings class="h-full" />
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
                        <!--
                          重识别库：只做**管理**（查看/删除观测），观测与轨迹在外侧「人脸重识别」页。
                          与「人脸识别（外侧） + 人脸底库（设置内）」同一分工。
                        -->
                        <template v-else-if="currentTabValue === 'reid-library'">
                            <ReidLibraryPanel />
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
import PaperConfigPanel from './PaperConfigPanel.vue'
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
import ChannelManagementPage from '@pages/channel/components/ChannelManagementPage.vue'
// 模型管理：直接复用主页 /models 的整页组件（双入口一份实现）
import ModelsPage from '../models/ModelsPage.vue'
import CommunityPanel from './CommunityPanel.vue'
import ScrollContainer from '../ui/ScrollContainer.vue'
// 菜单管理：与侧栏同源的清单 + 显示/隐藏开关（不嵌 sys_menu 的增删改）
import MenuDisplaySettings from './MenuDisplaySettings.vue'
// 以图搜图图像底库管理面板（同一份实现，被「图像底库」tab 复用）
import ImageLibraryPanel from './ImageLibraryPanel.vue'
// 人脸底库**管理**面板（识别仍在外侧「人脸识别」页，这里只管底库）
import FaceLibraryPanel from './FaceLibraryPanel.vue'
import ReidLibraryPanel from './ReidLibraryPanel.vue'

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
    PlugConnected24Regular,
    Person20Regular,
    DesktopSpeaker24Regular,
    DocumentText24Regular,
    AppsListDetail20Regular,
    Fingerprint24Regular,
    BrainCircuit20Regular,
} from '@vicons/fluent'

import { ArrowBackIosNewTwotone, VerifiedUserOutlined } from '@vicons/material'

import SessionConfigSettings from './SessionConfigSettings.vue'
import ProtocolServerSettings from './ProtocolServerSettings.vue'
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
    // 模型配置：默认模型 + 各能力的独立模型菜单，统一归到「模型配置」分组。
    // 原先它们全挤在「常规」里，与通用/浏览器/外观混在一起，找模型要翻很久。
    'default-models': t('settings.system.groups.modelConfig'),
    'face-config': t('settings.system.groups.modelConfig'),
    'reid-config': t('settings.system.groups.modelConfig'),
    'image-search-config': t('settings.system.groups.modelConfig'),
    'layout-config': t('settings.system.groups.modelConfig'),
    'rag-config': t('settings.system.groups.modelConfig'),
    'ocr-config': t('settings.system.groups.modelConfig'),
    'paper-config': t('settings.system.groups.modelConfig'),
    'bot-connector-config': t('settings.system.groups.modelConfig'),
    'audio-config': t('settings.system.groups.modelConfig'),
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
    // 聚合协议服务（OpenAI/Claude/Gemini 三协议统一入口）：
    // 原混在「默认模型」页里，但它是服务级参数（开关/端口/绑定地址），与模型选择无关；
    // 收进「系统」分组，与「服务配置」相邻。仅管理员可改（写的是全局层）。
    'protocol-server': t('settings.system.groups.system'),
    'service-tokens': t('settings.system.groups.system'),
    'menu-manage': t('settings.system.groups.system'),
    // 底库：图像底库与人脸底库归到同一个分组。
    // 原先图像底库挂在「系统」组、人脸库挂在外侧主导航，两个同类功能分处两地；
    // 收进同一个「底库」分组后，入口位置与语义一致。
    'image-library': t('settings.system.groups.library'),
    'face-library': t('settings.system.groups.library'),
    'reid-library': t('settings.system.groups.library'),
    // 渠道管理：账号类渠道（Cline / Qoder / Trae / Gemini）的账号绑定。
    // 账号连接按 userId 隔离（每个用户管理自己的绑定），与其它菜单口径一致；
    // 免费渠道的路由/全局 Key 另走管理员渠道管理配置。
    channels: t('settings.system.groups.channels'),
    // 模型管理：与主页「模型管理」(/models) 同一组件、同一接口、同一份数据，
    // 只是入口多了一处。归到「模型配置」组 —— 它改的就是这一组的实际内容，
    // 放在「渠道管理」组会让「供应商/模型在哪」这个问题更绕。
    models: t('settings.system.groups.modelConfig'),
}))

/**
 * 人脸重识别的专属配置字段（face 分组尾部的 7 项）。
 *
 * <p>「人脸识别配置」页渲染 face 全量（检测/特征模型、活体、质量、超分、属性…）；
 * 「人脸重识别配置」只该包含 ReID 自己的东西：ReID 特征模型与维度、分流/检索阈值、
 * 轨迹归并参数、默认摄像头。两个页签渲染同一批 38 项，就是
 * 「重识别配置 = 人脸识别配置」，用户改哪边都分不清。</p>
 *
 * <p>字段名与后端 FaceGlobalSettingProvider 逐字一致；后端新增 ReID 字段时在这里补一项。
 * 检测模型仍复用 face.detector_model（重识别与人脸识别共用同一批检测框）。</p>
 */
const REID_FIELDS = [
    // 模型（参考人脸识别管线的「检测模型 / 特征模型 / 特征维度」）
    // 检测仍复用 face.detector_model，这里只暴露重识别自己的特征侧
    'reid_feature_model',
    'reid_feature_dimension',
    // 分流与检索
    'face_threshold',
    'reid_threshold',
    'reid_detector_threshold',
    'reid_match_threshold',
    // 轨迹归并
    'track_threshold',
    'track_gap_seconds',
    'track_max_tracks',
    'track_ttl_seconds',
    // 采集
    'default_camera_id',
]

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
        // 模型管理：主页「模型管理」(/models) 的第二个入口。
        //
        // 两个入口渲染**同一个组件**（ModelsPage，embedded 模式只省掉页头），
        // 接口、数据、交互全同 —— 不存在「主页改完这里看不到」。
        //
        // 不设 adminOnly：模型管理本身就是所有登录用户的功能（读供应商/模型、
        // 管自己的模型配置）。只有「增删改供应商」这类写接口由服务端
        // @Permission("admin") 逐条把关，页面不重复在前端做一份权限判断 ——
        // 前端藏入口只会让人以为功能不存在，而不是「你没权限」。
        label: t('settings.models.title'),
        path: 'models',
        icon: BrainCircuit20Regular,
        roles: ['primary'],
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
        // 检测/特征/活体/属性等模型字段原本混在默认模型页里，与文本对话模型放在一起
        // 很难找；拆出后与左侧导航的「人脸识别」能力页一一对应。
        label: '人脸识别配置',
        path: 'face-config',
        icon: Person20Regular,
        roles: ['primary'],
    },
    {
        // 人脸重识别（跨摄像头/跨帧追踪）的独立配置。
        //
        // 与「人脸识别配置」同口径：不设 adminOnly。重识别管线共享人脸组的
        // 模型/归并/向量库配置（后端 ReidClientManager 与 ReidStores 从 face 分组读），
        // 重识别的模型与归并参数按账号生效（后端 ReidStores 按账号构建实例），
        // 普通用户可以调自己的阈值/时间窗，管理员改的则作为全局默认。
        label: '人脸重识别配置',
        path: 'reid-config',
        icon: Fingerprint24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：以图搜图（图像特征模型 + 关键词提取）
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
        // 从默认模型页拆出的独立配置：RAG（嵌入/重排/分块/向量库）
        label: 'RAG 配置',
        path: 'rag-config',
        icon: DataHistogram24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：OCR（检测/识别/方向/矫正/超分）
        label: 'OCR 配置',
        path: 'ocr-config',
        icon: ScanText24Regular,
        roles: ['primary'],
    },
    {
        // 试卷识别：OCR / OCR+LLM 双管线，用于试卷扫描与阅卷结构化
        label: '试卷配置',
        path: 'paper-config',
        icon: DocumentText24Regular,
        roles: ['primary'],
        // paper 分组写的是**全局**配置（PaperClientManager 是共享管线，只读全局层），
        // 非管理员写入会被接口层拒绝（S0503 仅管理员可修改），因此入口只给管理员，
        // 避免普通用户点进去看到一堆注定失败的保存
        adminOnly: true,
    },
    {
        // 从默认模型页拆出的独立配置：连接器(bot)
        label: '连接器配置',
        path: 'bot-connector-config',
        icon: Cloud24Regular,
        roles: ['primary'],
    },
    {
        // 从默认模型页拆出的独立配置：语音识别（asr）
        // 字段为 provider / API Key / Base URL / 默认模型 / 语言，与左侧导航的
        // 「音频识别」能力页一一对应。注意这里**不再隐藏**凭据三项 ——
        // 独立页是 asr 的唯一入口，藏起来就没法配云端 ASR（见 DefaultModelSettings
        // 的 shouldShowField：isSplitGroupMode 下 asr 全字段显示）。
        label: '音频配置',
        path: 'audio-config',
        icon: DesktopSpeaker24Regular,
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
        // 协议服务：聚合协议服务（OpenAI / Claude / Gemini 三协议统一入口）的
        // 开关、端口与绑定地址。原在「默认模型」页里，与服务配置同类却分处两地；
        // 独立成页后归「系统」分组。写的是全局层，故仅管理员。
        label: '协议服务',
        path: 'protocol-server',
        icon: PlugConnected24Regular,
        roles: ['primary'],
        adminOnly: true,
    },
    {
        // 菜单管理：sys_menu 的增删改（侧栏菜单 + 按钮权限）。
        // 只给管理员：写的是全局菜单表，普通用户改会直接影响所有人。
        label: '菜单管理',
        path: 'menu-manage',
        icon: AppsListDetail20Regular,
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
    {
        // 重识别库：与人脸底库同组、同口径（按账号隔离，不设 adminOnly）。
        //
        // 它存的不是「已登记的人」，而是「观测过的人」——每次观测一行，
        // 跨帧轨迹由这些行按 trackId 汇聚而来。所以这里的列表就是轨迹的原始数据：
        // 删掉一行，等于把那次观测从轨迹里移除。
        label: '重识别库',
        path: 'reid-library',
        icon: Fingerprint24Regular,
        roles: ['primary'],
    },
    {
        // 渠道管理：账号类渠道（Cline / Qoder / Trae / Gemini）的账号绑定、
        // 轮询、刷新、签到、模型拉取与单模型开关。
        // 账号连接按 userId 隔离（sys_ai_provider_connection_user_id），
        // 每个用户管理自己的绑定，与其它菜单口径一致；免费渠道另走管理员配置。
        label: t('settings.system.tabs.channels'),
        path: 'channels',
        icon: Cloud24Regular,
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
        t('settings.system.groups.modelConfig'),
        t('settings.system.groups.personalization'),
        t('settings.system.groups.dataManagement'),
        t('settings.system.groups.library'),
        t('settings.system.groups.account'),
        t('settings.system.groups.system'),
        t('settings.system.groups.channels'),
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

/*
 * 右侧内容区宽度：宽表格类 tab（服务配置 / 令牌 / 供应商 / 模型指标）不吃满宽会挤成横向滚动条，
 * 这些页签放开 max-w 限制；其余页签跟随「设置 → 显示」的窄屏/满屏设置
 * （MainLayout 仅在满屏时注入 --content-max-width: none），窄屏保持原
 * md:max-w-220（55rem）居中阅读列，满屏撑满剩余空间。
 *
 * 宽屏支持：55rem 是笔记本上的舒适阅读宽度，但在 2K/4K 上会把整个设置项挤在中间一条，
 * 左侧文本列占满 560px 上限后右侧控件只剩很窄一点。所以默认值改成
 * `min(76rem, max(55rem, 62vw))` —— 窄屏仍是 55rem，宽屏按 62vw 跟着屏幕长，最多 76rem。
 * 注意这里必须用 var() 的 **回退值** 写法：满屏时 MainLayout 会把
 * --content-max-width 定义为 none，那时整条 max-width 失效 = 撑满，与原来一致。
 */
const WIDE_TABS = ['services', 'service-tokens', 'providers', 'model-metrics', 'channels', 'models']
const contentMaxWidthStyle = computed(() =>
    WIDE_TABS.includes(currentTabValue.value)
        ? {}
        : { maxWidth: 'var(--content-max-width, min(76rem, max(55rem, 62vw)))', marginLeft: 'auto', marginRight: 'auto' },
)

// Teleport 目标就绪标志：确保 #settings-sidebar-portal 已挂载到 DOM
const portalReady = ref(false)

// 模型管理 tab：内嵌块要自己撑满，外层不使用 ScrollContainer 的 py-3 留白
const isModelsTab = computed(() => currentTabValue.value === 'models')

// 当前标签标题
const currentTabLabel = computed(() => {
    if (currentTabValue.value === 'service-tokens') return 'Key 台账'
    if (currentTabValue.value === 'channels') return t('settings.system.tabs.channels')
    if (currentTabValue.value === 'models') return t('settings.models.title')
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

/* 模型管理 tab：ModelsPage 是双栏工作台，需要一整块确定高度才能让左右各自滚动 */
.models-tab-host {
    height: 100%;
    min-height: 0;
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

