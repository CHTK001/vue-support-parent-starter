<template>
    <div class="flex-1 skills-page skill-market-page">
        <!-- 顶部操作栏：搜索 + 管理 + 添加 -->
        <div class="market-topbar">
            <el-input v-model="marketKeyword" size="default" clearable class="market-topbar__search"
                :placeholder="t('plugins.skills.searchPlaceholder')"
                @keyup.enter="handleMarketSearch" @clear="handleMarketClear">
                <template #prefix>
                    <el-icon><SearchOutlined /></el-icon>
                </template>
            </el-input>
            <el-button size="default" @click="openManage">{{ t('plugins.skills.manage') }}</el-button>
            <el-popover :width="208" placement="bottom-end" trigger="click"
                popper-class="skill-add-popover" v-model:visible="addPopoverVisible">
                <template #reference>
                    <el-button size="default" type="primary">
                        <el-icon class="mr-1"><PlusOutlined /></el-icon>
                        {{ t('plugins.skills.add') }}
                    </el-button>
                </template>
                <div class="add-menu">
                    <button type="button" class="add-menu__item" @click="triggerUploadZip">
                        <el-icon><UploadOutlined /></el-icon>
                        <span>{{ t('plugins.skills.uploadSkill') }}</span>
                    </button>
                    <button type="button" class="add-menu__item" @click="openSearchInstall">
                        <el-icon><SearchOutlined /></el-icon>
                        <span>{{ t('plugins.skills.searchInstall') }}</span>
                    </button>
                </div>
            </el-popover>
        </div>
        <input ref="zipInputRef" type="file" accept=".zip,application/zip" class="hidden-file-input"
            @change="onZipPicked" />

        <!-- Skills 列表（已合并到下方市场，保留占位避免布局抖动） -->
        <div class="space-y-4" v-if="false">
            <!-- 技能卡片列表 -->
            <div class="grid gap-y-4 gap-x-3" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                <div v-for="skill in skills" :key="skill.id"
                    class="plugin-card re-surface re-surface--dense flex flex-col overflow-hidden cursor-pointer"
                    :style="skill.enabled === false ? { opacity: 0.6 } : {}"
                    @click="handleViewDocumentation(skill.id)">
                    <div class="flex items-center gap-2.5 mb-3">
                        <PluginIcon :icon="skill.manifest.icon" :name="skill.manifest.name || skill.id" />
                        <h3 class="font-semibold text-gray-900 dark:text-[var(--el-text-color-primary)] truncate flex-1 min-w-0" style="font-size: var(--size-text-sm);">
                            {{ skill.manifest.name || skill.id }}
                        </h3>
                        <el-tag v-if="skill.source === 'system'" type="success" effect="light">{{ t('plugins.skills.sourceBuiltin') }}</el-tag>
                        <el-tag v-else-if="skill.source === 'agents'" type="warning" effect="light">{{ t('plugins.skills.sourceShared') }}</el-tag>
                        <el-tag v-if="skill.manifest.version" type="info" effect="plain">v{{ skill.manifest.version }}</el-tag>
                    </div>

                    <p class="text-gray-400 dark:text-[var(--el-text-color-secondary)] line-clamp-2 h-[2.5rem]" style="font-size: calc(var(--size-text-base) - 2px);">
                    {{ skill.manifest.description || t('plugins.skills.noDescription') }}
                    </p>

                    <div class="flex items-center justify-end gap-2 mt-3">
                        <el-button link @click.stop="handleReloadSkill(skill.id)"
                            :loading="reloadingSkills.has(skill.id)">
                            {{ t('plugins.skills.reload') }}
                        </el-button>
                        <el-button v-if="skill.source !== 'system' && skill.source !== 'agents'" link type="danger"
                            @click.stop="handleUninstallSkill(skill.id)"
                            :loading="uninstallingSkills.has(skill.id)">
                            {{ t('plugins.skills.uninstall') }}
                        </el-button>
                        <LTooltip v-else-if="skill.source === 'agents'" :content="t('plugins.skills.sharedTooltip')" placement="top">
                            <el-button link type="danger" disabled>
                                {{ t('plugins.skills.uninstall') }}
                            </el-button>
                        </LTooltip>
                        <el-switch
                            :model-value="skill.enabled !== false"
                            :loading="updatingSkills.has(skill.id)"
                            @update:model-value="(val: string | number | boolean) => handleToggleSkill(skill.id, !!val)"
                            @click.stop

                            inline-prompt
                            :active-text="t('common.enable')"
                            :inactive-text="t('common.disable')"
                        />
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && skills.length === 0"
                class="re-surface overflow-hidden">
                <div class="p-12 text-center">
                    <el-icon size="64" class="mb-4 opacity-50 text-gray-400">
                        <InboxOutlined />
                    </el-icon>
                    <div class="text-xl font-medium text-gray-600 dark:text-[var(--el-text-color-primary)] mb-2">
                        {{ t('plugins.skills.empty') }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-[var(--el-text-color-secondary)] mb-4">
                        {{ t('plugins.skills.emptyHint') }}
                    </div>
                    <el-button type="primary" @click="handleShowInstallDialog">
                        <template #icon>
                            <UploadOutlined />
                        </template>
                        {{ t('plugins.skills.install') }}
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 技能市场（整页：分类标签 + 分组 + 紧凑条目） -->
        <div class="skill-market">
            <!-- 错误提示 -->
            <div v-if="marketError"
                class="market-error re-surface p-6 text-center">
                <el-icon size="32" class="mb-2 opacity-50 text-gray-400">
                    <InboxOutlined />
                </el-icon>
                <div class="text-sm text-gray-500 dark:text-[var(--el-text-color-secondary)]">
                    {{ marketError }}
                </div>
            </div>

            <template v-else>
                <!-- 骨架屏：后端在线/离线 Provider SPI 聚合期间 -->
                <div v-if="loadingMarket" class="market-skeleton" aria-hidden="true">
                    <div class="market-skeleton__tabs">
                        <div v-for="n in 7" :key="'st-'+n" class="skel skel--tab"></div>
                    </div>
                    <div v-for="g in 3" :key="'sg-'+g" class="market-skeleton__group">
                        <div class="skel skel--grouphead"></div>
                        <div class="market-skeleton__grid">
                            <div v-for="c in 4" :key="'sc-'+g+'-'+c" class="market-skeleton__cell">
                                <div class="skel skel--circle"></div>
                                <div class="market-skeleton__lines">
                                    <div class="skel skel--title"></div>
                                    <div class="skel skel--desc"></div>
                                </div>
                                <div class="skel skel--btn"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <template v-else>
                 <!-- 默认浏览：未发起顶部搜索 -->
                 <template v-if="!marketHasSearch">
                    <!-- 分类标签栏 -->
                    <div class="market-tabs" role="tablist">
                        <div v-for="tab in marketTabs" :key="tab" role="tab"
                            class="market-tab" :class="{ active: marketTab === tab }"
                            @click="marketTab = tab">
                            {{ tab }}
                        </div>
                    </div>

                    <!-- 分组列表 -->
                    <div v-for="g in marketGroups" :key="g.cat" class="market-group">
                        <div class="market-group-head" @click="toggleGroup(g.cat)">
                            <span class="market-group-title">{{ g.cat }}</span>
                            <span class="market-group-arrow" :class="{ collapsed: collapsedGroups.has(g.cat) }">›</span>
                        </div>
                        <div v-show="!collapsedGroups.has(g.cat)" class="market-grid">
                            <div v-for="skill in g.items" :key="skill.id" class="market-cell market-cell--clickable"
                                @click="openSkillDetail(skill)">
                                <PluginIcon :icon="skill.icon" :name="skill.name" class="market-cell-icon" />
                                <div class="market-cell-body">
                                    <div class="market-cell-title">{{ skill.name }}</div>
                                    <div class="market-cell-desc">
                                        {{ skill.description || t('plugins.skills.noDescription') }}
                                    </div>
                                </div>
                                <el-button class="market-cell-btn" plain
                                    :type="skill.localStatus === 'installed' ? 'success'
                                        : skill.localStatus === 'updatable' ? 'warning' : ''"
                                    :disabled="skill.localStatus === 'installed'"
                                    :loading="installingFromMarket.has(skill.id)"
                                    @click.stop="handleInstallFromMarketUrl(skill)">
                                    {{ getMarketButtonLabel(skill) }}
                                </el-button>
                            </div>
                        </div>
                    </div>

                    <!-- 搜索无结果空态 -->
                    <div v-if="marketGroups.length === 0" class="market-empty">
                        <svg class="market-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <div class="market-empty__title">{{ t('plugins.skills.searchNoResult') }}</div>
                        <div class="market-empty__hint">&ldquo;{{ marketKeyword }}&rdquo;</div>
                    </div>
                 </template>

                 <!-- 顶部搜索结果：后台「本地 + 在线」Provider SPI 实时检索 -->
                 <template v-else>
                    <div v-if="marketSearching" class="market-skeleton" aria-hidden="true">
                        <div class="market-skeleton__group">
                            <div class="skel skel--grouphead"></div>
                            <div class="market-skeleton__grid">
                                <div v-for="c in 4" :key="'mss-'+c" class="market-skeleton__cell">
                                    <div class="skel skel--circle"></div>
                                    <div class="market-skeleton__lines">
                                        <div class="skel skel--title"></div>
                                        <div class="skel skel--desc"></div>
                                    </div>
                                    <div class="skel skel--btn"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <template v-else>
                        <div v-if="marketSearchResults.length > 0" class="market-group">
                            <div class="market-group-head market-group-head--static">
                                <span class="market-group-title">搜索结果（{{ marketSearchResults.length }}）</span>
                            </div>
                            <div class="market-grid">
                                <div v-for="skill in marketSearchResults" :key="'msr-'+skill.id"
                                    class="market-cell market-cell--clickable" @click="openSkillDetail(skill)">
                                    <PluginIcon :icon="skill.icon" :name="skill.name" class="market-cell-icon" />
                                    <div class="market-cell-body">
                                        <div class="market-cell-title">{{ skill.name }}</div>
                                        <div class="market-cell-desc">
                                            {{ skill.description || t('plugins.skills.noDescription') }}
                                        </div>
                                    </div>
                                    <el-button class="market-cell-btn" plain
                                        :type="skill.localStatus === 'installed' ? 'success'
                                            : skill.localStatus === 'updatable' ? 'warning' : ''"
                                        :disabled="skill.localStatus === 'installed'"
                                        :loading="!!marketSearchLocalMap[skill.id]
                                            ? installingCatalog === skill.id
                                            : installingFromMarket.has(skill.id)"
                                        @click.stop="handleSearchResultInstall(skill)">
                                        {{ getMarketButtonLabel(skill) }}
                                    </el-button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="market-empty">
                            <svg class="market-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <div class="market-empty__title">{{ t('plugins.skills.searchNoResult') }}</div>
                            <div class="market-empty__hint">&ldquo;{{ marketKeyword }}&rdquo;</div>
                        </div>
                    </template>
                 </template>
                </template>
            </template>
        </div>

        <!-- 查看文档对话框 -->
        <LDialog v-model="showDocDialog" :title="currentSkillName + ' - SKILL.md'" width="800px"
            align-center destroy-on-close>

            <div v-if="loadingDoc" class="flex justify-center items-center py-12">
                <el-icon class="is-loading" size="32">
                    <Loading />
                </el-icon>
            </div>
            <div v-else-if="docError" class="py-12 text-center text-red-500">
                {{ docError }}
            </div>
            <div v-else>
                <!-- 元信息表格 -->
                <div v-if="parsedMeta.length > 0" class="skill-meta-table mb-6">
                    <table>
                        <tbody>
                            <tr v-for="item in parsedMeta" :key="item.key">
                                <td class="meta-key">{{ item.key }}</td>
                                <td class="meta-value">{{ item.value }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- 正文内容 -->
                <div class="markdown-doc prose dark:prose-invert max-w-none" v-html="parsedDocumentation">
                </div>
            </div>
            <template #footer>
                <el-button @click="showDocDialog = false">{{ t('common.close') }}</el-button>
            </template>
        </LDialog>

        <!-- 安装 Skill 对话框 -->
        <LDialog v-model="showInstallDialog" :title="t('plugins.skills.installTitle')" width="760px" align-center destroy-on-close>
            <div class="install-dialog-body">
                <el-radio-group v-model="installMode" class="install-mode-group mb-4">
                    <el-radio-button label="upload">
                        <el-icon class="mr-1"><UploadOutlined /></el-icon>{{ t('plugins.skills.modeUpload') }}
                    </el-radio-button>
                    <el-radio-button label="search">
                        <el-icon class="mr-1"><SearchOutlined /></el-icon>{{ t('plugins.skills.modeSearch') }}
                    </el-radio-button>
                </el-radio-group>

                <!-- 上传 ZIP -->
                <div v-if="installMode === 'upload'">
                    <div class="text-sm text-gray-600 dark:text-[var(--el-text-color-secondary)] mb-4">
                        {{ t('plugins.skills.installDesc') }}
                    </div>

                    <el-upload ref="uploadRef" class="upload-demo" drag :auto-upload="false" :show-file-list="false" :on-change="handleFileChange"
                        :limit="1" accept=".zip">
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">
                            {{ t('plugins.skills.uploadText') }} <em>{{ t('plugins.skills.uploadClick') }}</em>
                        </div>
                        <template #tip>
                            <div class="el-upload__tip text-xs text-gray-500 mt-2">
                                {{ t('plugins.skills.uploadTip') }}
                            </div>
                        </template>
                    </el-upload>

                    <div v-if="selectedFile" class="mt-4 p-3 rounded-lg bg-(--color-surface-hover)">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <el-icon>
                                    <Document />
                                </el-icon>
                                <span class="text-sm">{{ selectedFile.name }}</span>
                            </div>
                            <el-button link type="danger" @click="clearSelectedFile">
                                <el-icon>
                                    <Close />
                                </el-icon>
                            </el-button>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ t('plugins.skills.fileSize', { size: formatFileSize(selectedFile.size) }) }}
                        </div>
                    </div>
                </div>

                <!-- 检索安装（同时检索本地与在线，匹配结果直接显示） -->
                <div v-else class="install-search">
                    <el-input v-model="searchKeyword" class="mb-3" clearable
                        :placeholder="t('plugins.skills.searchPlaceholder')" @keyup.enter="handleSearch"
                        @clear="handleSearch">
                        <template #append>
                            <el-button @click="handleSearch">
                                <el-icon><SearchOutlined /></el-icon>
                            </el-button>
                        </template>
                    </el-input>

                    <div class="catalog-results">
                        <!-- 加载中：骨架屏 -->
                        <div v-if="loadingCatalog || loadingMarket" class="market-skeleton" aria-hidden="true">
                            <div class="market-skeleton__grid">
                                <div v-for="c in 6" :key="'dc-'+c" class="market-skeleton__cell">
                                    <div class="skel skel--circle"></div>
                                    <div class="market-skeleton__lines">
                                        <div class="skel skel--title"></div>
                                        <div class="skel skel--desc"></div>
                                    </div>
                                    <div class="skel skel--btn"></div>
                                </div>
                            </div>
                        </div>

                        <template v-else-if="hasSearched">
                            <!-- 本地匹配结果 -->
                            <div v-if="localCatalog.length > 0" class="catalog-result-block">
                                <div class="catalog-result-label">{{ t('plugins.skills.sourceLocal') }}</div>
                                <div class="catalog-list">
                                    <div v-for="item in localCatalog" :key="'l-'+item.name" class="catalog-item">
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm font-medium truncate">{{ item.name }}</span>
                                                <el-tag v-if="item.installed" type="success" effect="plain">
                                                    {{ t('plugins.skills.marketInstalled') }}
                                                </el-tag>
                                            </div>
                                            <p class="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                {{ item.description || t('plugins.skills.noDescription') }}
                                            </p>
                                            <div class="flex flex-wrap gap-1 mt-1">
                                                <el-tag v-for="src in item.sources" :key="src" effect="light">{{ src }}</el-tag>
                                            </div>
                                        </div>
                                        <el-button type="primary" plain
                                            :loading="installingCatalog === item.name"
                                            @click="handleInstallLocal(item)">
                                            {{ t('plugins.skills.install') }}
                                        </el-button>
                                    </div>
                                </div>
                            </div>

                            <!-- 在线匹配结果 -->
                            <div v-if="filteredMarketCatalog.length > 0" class="catalog-result-block">
                                <div v-if="localCatalog.length > 0" class="catalog-result-label">{{ t('plugins.skills.sourceOnline') }}</div>
                                <div class="market-grid dialog-market-grid">
                                    <div v-for="skill in filteredMarketCatalog" :key="'o-'+skill.id"
                                        class="market-cell market-cell--clickable" @click="openSkillDetail(skill)">
                                        <PluginIcon :icon="skill.icon" :name="skill.name" class="market-cell-icon" />
                                        <div class="market-cell-body">
                                            <div class="market-cell-title">{{ skill.name }}</div>
                                            <div class="market-cell-desc">
                                                {{ skill.description || t('plugins.skills.noDescription') }}
                                            </div>
                                        </div>
                                        <el-button class="market-cell-btn" plain
                                            :type="skill.localStatus === 'installed' ? 'success'
                                                : skill.localStatus === 'updatable' ? 'warning' : 'primary'"
                                            :disabled="skill.localStatus === 'installed'"
                                            :loading="installingFromMarket.has(skill.id)"
                                            @click.stop="handleInstallFromMarketUrl(skill)">
                                            {{ getMarketButtonLabel(skill) }}
                                        </el-button>
                                    </div>
                                </div>
                            </div>

                            <!-- 本地与在线均无匹配 -->
                            <div v-if="searchNoResult" class="py-8 text-center text-sm text-gray-500">
                                {{ t('plugins.skills.searchNoResult') }}
                            </div>
                        </template>

                        <!-- 尚未检索 -->
                        <div v-else class="py-8 text-center text-sm text-gray-500">
                            {{ t('plugins.skills.searchHint') }}
                        </div>
                    </div>
                </div>

                <!-- 强制覆盖（对上传与检索安装均生效） -->
                <div class="mt-4">
                    <el-checkbox v-model="forceOverwrite">
                        <span class="text-sm">{{ t('plugins.skills.forceOverwrite') }}</span>
                    </el-checkbox>
                    <div class="text-xs text-gray-500 dark:text-[var(--el-text-color-secondary)] mt-1 ml-6">
                        {{ t('plugins.skills.forceOverwriteHint') }}
                    </div>
                </div>
            </div>

            <template #footer>
                <el-button @click="showInstallDialog = false">{{ t('common.cancel') }}</el-button>
                <el-button v-if="installMode === 'upload'" type="primary" @click="handleInstallSkill"
                    :loading="installing" :disabled="!selectedFile">
                    {{ t('plugins.skills.installBtn') }}
                </el-button>
            </template>
        </LDialog>

        <!-- 市场技能安装对话框 -->
        <LDialog v-model="showMarketInstallDialog" :title="t('plugins.skills.marketInstallTitle')" width="420px" align-center destroy-on-close>
            <div v-if="selectedMarketSkill" class="py-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-[var(--el-text-color-primary)] mb-2">
                    {{ selectedMarketSkill.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-[var(--el-text-color-secondary)] mb-3">
                    {{ selectedMarketSkill.description || t('plugins.skills.noDescription') }}
                </p>
                <div v-if="selectedMarketSkill.labels && selectedMarketSkill.labels.length > 0" class="flex flex-wrap gap-1.5 mb-4">
                    <el-tag v-for="label in selectedMarketSkill.labels" :key="label" effect="light">
                        {{ label }}
                    </el-tag>
                </div>
                <div class="flex flex-col gap-3 market-install-actions">
                    <!-- 直接安装（ZIP） -->
                    <el-button v-if="getInstallUrl(selectedMarketSkill, 'zip')" type="primary" size="large"
                        :loading="installingFromMarket.has(selectedMarketSkill.id)"
                        @click="handleInstallFromMarketUrl(selectedMarketSkill)">
                        <template #icon>
                            <ArrowDownload16Regular />
                        </template>
                        {{ getMarketButtonLabel(selectedMarketSkill) }}
                    </el-button>
                    <!-- 访问仓库（Git） -->
                    <el-button v-if="getInstallUrl(selectedMarketSkill, 'git')" size="large"
                        @click="handleViewSourceCode(selectedMarketSkill)">
                        {{ t('plugins.skills.marketViewSource') }}
                    </el-button>
                    <!-- 查看详情 -->
                    <el-button v-if="selectedMarketSkill.detailUrl" size="large"
                        @click="handleOpenDetailUrl(selectedMarketSkill)">
                        {{ t('plugins.skills.marketViewDetail') }}
                    </el-button>
                </div>
            </div>
            <template #footer>
                <el-button @click="showMarketInstallDialog = false">{{ t('common.cancel') }}</el-button>
            </template>
        </LDialog>

        <!-- 技能详情弹窗：安装前查看 SKILL.md 正文 -->
        <!-- 技能详情弹窗：复用统一组件（已安装读本地 SKILL.md，未安装 ZIP 预览） -->
        <SkillDetailDialog
            v-model="showDetailDialog"
            :skill="detailTarget"
            :installing="detailInstalling"
            @install="handleDetailAdd"
        />
    </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElButton, ElTag, ElIcon, ElUpload, ElMessageBox } from 'element-plus';
import { RefreshOutlined, InboxOutlined, DescriptionOutlined, UploadOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from '@vicons/material'
import { RefreshRight, Loading, UploadFilled, Document, Close } from '@element-plus/icons-vue'
import { ArrowDownload16Regular, ArrowClockwise16Regular } from '@vicons/fluent'
import { apiService } from '@/services/ApiService'
import { type MarketSkillWithStatus } from '@/services/SkillMarketService'
import { useMarkdown } from '@/composables/useMarkdown'
import { openInExternalBrowser } from '@/utils/browserUtils'
import PluginIcon from '@/components/ui/PluginIcon.vue'
import LTooltip from '@/components/ui/LTooltip.vue'
import LDialog from '@/components/ui/LDialog.vue'
import SkillDetailDialog from './SkillDetailDialog.vue'

interface SkillManifest {
    name: string
    description?: string
    version?: string
    author?: string
    icon?: string
    tags?: string[]
}

type SkillSource = 'global' | 'system' | 'agents'

interface Skill {
    id: string
    basePath: string
    manifest: SkillManifest
    contentHash: string
    source?: SkillSource
    enabled?: boolean
}

const loading = ref(false)
const scanning = ref(false)
const reloadingSkills = ref<Set<string>>(new Set())
const skills = ref<Skill[]>([])
const { t } = useI18n()

// 文档查看相关状态
const showDocDialog = ref(false)
const loadingDoc = ref(false)
const docError = ref<string | null>(null)
const documentation = ref('')
const currentSkillName = ref('')
const currentSkillId = ref('')

// Markdown 解析
const { parseMarkdown } = useMarkdown()

// 解析 YAML frontmatter
interface SkillMeta {
    key: string
    value: string
}

const parsedMeta = computed((): SkillMeta[] => {
    const content = documentation.value
    if (!content) return []

    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
    if (!match) return []

    const yamlContent = match[1]
    const lines = yamlContent.split('\n')
    const result: SkillMeta[] = []

    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) {
            i++
            continue
        }

        const colonIndex = trimmed.indexOf(':')
        if (colonIndex === -1) {
            i++
            continue
        }

        const key = trimmed.substring(0, colonIndex).trim()
        let value = trimmed.substring(colonIndex + 1).trim()

        // 处理多行字符串：> 或 | 折叠符
        if (value === '>' || value === '|' || value === '>-' || value === '|-') {
            const multilineValues: string[] = []
            i++
            // 收集缩进行
            while (i < lines.length) {
                const nextLine = lines[i]
                if (nextLine.match(/^\s+/)) {
                    multilineValues.push(nextLine.trim())
                    i++
                } else if (nextLine.trim() === '') {
                    // 空行：多行字符串中的空行保留一个标记
                    multilineValues.push('')
                    i++
                } else {
                    break
                }
            }
            if (multilineValues.length > 0) {
                // 过滤尾部空行
                while (multilineValues.length > 0 && multilineValues[multilineValues.length - 1] === '') {
                    multilineValues.pop()
                }
                result.push({ key, value: multilineValues.join(' ') })
            }
            continue
        }

        // 处理数组格式：tags 等
        if (value === '' && trimmed.endsWith(':')) {
            const arrayItems: string[] = []
            i++
            while (i < lines.length) {
                const nextLine = lines[i]
                if (nextLine.match(/^\s+-\s+/)) {
                    const item = nextLine.replace(/^\s+-\s*/, '').trim()
                    if (item) arrayItems.push(item)
                    i++
                } else if (nextLine.trim() && !nextLine.match(/^\s+/)) {
                    break
                } else {
                    i++
                }
            }
            if (arrayItems.length > 0) {
                result.push({ key, value: arrayItems.join(', ') })
            }
            continue
        }

        // 去除引号
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }

        if (key && value) {
            result.push({ key, value })
        }
        i++
    }

    return result
})

// 提取正文（去掉 frontmatter）
const bodyContent = computed(() => {
    const content = documentation.value
    if (!content) return ''

    const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/)
    return match ? match[1].trim() : content.trim()
})

const parsedDocumentation = computed(() => {
    return parseMarkdown(bodyContent.value)
})

// 安装相关状态
const showInstallDialog = ref(false)
const installing = ref(false)
const selectedFile = ref<File | null>(null)
const uploadRef = ref()
const forceOverwrite = ref(false)

// 安装弹窗：模式与检索
type InstallMode = 'upload' | 'search'
const installMode = ref<InstallMode>('upload')
const searchKeyword = ref('')
const hasSearched = ref(false)
const activeCategory = ref('')

// 本地检索结果
interface LocalCatalogItem {
    name: string
    description: string
    sources: string[]
    localPath?: string
    installed: boolean
}
const localCatalog = ref<LocalCatalogItem[]>([])
const loadingCatalog = ref(false)
const installingCatalog = ref('')

// 在线市场分类与筛选
const marketCategories = computed<string[]>(() => {
    const set = new Set<string>()
    marketSkills.value.forEach(s => (s.labels || []).forEach(l => set.add(l)))
    return Array.from(set)
})

const filteredMarketCatalog = computed<MarketSkillWithStatus[]>(() => {
    let list = marketSkills.value
    if (activeCategory.value) {
        list = list.filter(s => (s.labels || []).includes(activeCategory.value))
    }
    const kw = searchKeyword.value.trim().toLowerCase()
    if (kw) {
        list = list.filter(s =>
            s.name.toLowerCase().includes(kw) || (s.description || '').toLowerCase().includes(kw))
    }
    return list
})

// 检索后本地与在线均无匹配
const searchNoResult = computed(() =>
    hasSearched.value
    && !loadingCatalog.value
    && !loadingMarket.value
    && localCatalog.value.length === 0
    && filteredMarketCatalog.value.length === 0
)

// 卸载相关状态
const uninstallingSkills = ref<Set<string>>(new Set())
const updatingSkills = ref<Set<string>>(new Set())

// 市场推荐相关状态
const marketSkills = ref<MarketSkillWithStatus[]>([])
const loadingMarket = ref(false)
const marketError = ref<string | null>(null)

// 主页面市场：搜索 / 分类标签 / 分组
const MARKET_FEATURED = '精选'
const marketTab = ref<string>(MARKET_FEATURED)
const marketKeyword = ref('')
const collapsedGroups = ref<Set<string>>(new Set())

const marketLabels = computed<string[]>(() => {
    const order: string[] = []
    const seen = new Set<string>()
    marketSkills.value.forEach(s => (s.labels || []).forEach(l => {
        if (!seen.has(l)) { seen.add(l); order.push(l) }
    }))
    return order
})

/** 顶部快捷分类上限（含「精选」）；「精选」已按全部标签分组展示，超出的分类无需再占标签位，避免出现横向滚动条 */
const MAX_MARKET_TABS = 7
const marketTabs = computed<string[]>(() => [MARKET_FEATURED, ...marketLabels.value].slice(0, MAX_MARKET_TABS))

function firstLabel(s: MarketSkillWithStatus): string {
    return (s.labels && s.labels.length > 0) ? s.labels[0] : '其它'
}

function marketKeywordMatch(s: MarketSkillWithStatus): boolean {
    const k = marketKeyword.value.trim().toLowerCase()
    if (!k) return true
    return s.name.toLowerCase().includes(k) || (s.description || '').toLowerCase().includes(k)
}

const marketGroups = computed<{ cat: string; items: MarketSkillWithStatus[] }[]>(() => {
    if (marketTab.value === MARKET_FEATURED) {
        return marketLabels.value
            .map(l => ({ cat: l, items: marketSkills.value.filter(s => firstLabel(s) === l && marketKeywordMatch(s)) }))
            .filter(g => g.items.length > 0)
    }
    const l = marketTab.value
    return [{ cat: l, items: marketSkills.value.filter(s => (s.labels || []).includes(l) && marketKeywordMatch(s)) }]
})

function toggleGroup(cat: string) {
    if (collapsedGroups.value.has(cat)) {
        collapsedGroups.value.delete(cat)
    } else {
        collapsedGroups.value.add(cat)
    }
}

// ===== 市场顶部搜索：调用后台「本地 + 在线」Provider SPI，而非前端过滤内置 =====
const marketSearching = ref(false)
const marketSearchResults = ref<MarketSkillWithStatus[]>([])
const marketSearchLocalMap = ref<Record<string, LocalCatalogItem>>({})
const marketHasSearch = computed(() => marketKeyword.value.trim() !== '')

function mapLocalCatalogSearchEntry(it: any): MarketSkillWithStatus {
    return {
        id: String(it.name ?? ''),
        name: String(it.name ?? ''),
        description: String(it.description ?? ''),
        icon: it.icon ?? null,
        labels: ['本地'],
        installUrls: [],
        localStatus: it.installed ? 'installed' as const : 'not_installed' as const,
    }
}

async function handleMarketSearch() {
    const kw = marketKeyword.value.trim()
    if (!kw) { handleMarketClear(); return }
    marketSearching.value = true
    const localTask = apiService.fetchLocalCatalog(kw)
        .then((items: any) => (Array.isArray(items) ? items : []))
        .catch((e: any) => { console.error('市场本地搜索失败:', e); return [] as any[] })
    const onlineTask = apiService.fetchMarketCatalog(kw)
        .then((items: any) => (Array.isArray(items) ? items : []))
        .catch((e: any) => { console.error('市场在线搜索失败:', e); return [] as any[] })
    const res = await Promise.all([localTask, onlineTask])
    const localItems = res[0] as any[]
    const onlineItems = res[1] as any[]
    const localMap: Record<string, LocalCatalogItem> = {}
    const localMapped = localItems.map((it) => {
        const li: LocalCatalogItem = {
            name: String(it.name ?? ''),
            description: String(it.description ?? ''),
            sources: Array.isArray(it.sources) ? it.sources : [],
            localPath: it.localPath,
            installed: !!it.installed,
        }
        localMap[li.name] = li
        return mapLocalCatalogSearchEntry(it)
    })
    const localIds = new Set(localMapped.map(s => s.id.toLowerCase()))
    const onlineMapped = onlineItems.map(mapMarketEntry)
        .filter(s => !localIds.has(s.id.toLowerCase()))
    marketSearchLocalMap.value = localMap
    marketSearchResults.value = [...localMapped, ...onlineMapped]
    marketSearching.value = false
}

function handleMarketClear() {
    marketKeyword.value = ''
    marketSearchResults.value = []
    marketSearchLocalMap.value = {}
    marketSearching.value = false
}

function handleSearchResultInstall(skill: MarketSkillWithStatus) {
    const local = marketSearchLocalMap.value[skill.id]
    if (local) return handleInstallLocal(local)
    return handleInstallFromMarketUrl(skill)
}

// 市场安装弹窗相关状态
const showMarketInstallDialog = ref(false)
const selectedMarketSkill = ref<MarketSkillWithStatus | null>(null)
const installingFromMarket = ref<Set<string>>(new Set())

// 顶部「添加 / 管理」相关
const router = useRouter()
const addPopoverVisible = ref(false)
const zipInputRef = ref<HTMLInputElement | null>(null)
const uploadingZip = ref(false)

/** 管理：新标签打开 Skills 管理页 */
function openManage() {
    const href = router.resolve({ name: 'Skills' }).href
    window.open(href, '_blank', 'noopener')
}

/** 添加 → 上传技能：弹出文件选择 */
function triggerUploadZip() {
    addPopoverVisible.value = false
    zipInputRef.value?.click()
}

/** 选择 ZIP 后直接上传安装 */
async function onZipPicked(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files && input.files[0]
    if (!file) return
    uploadingZip.value = true
    try {
        const res = await apiService.installSkill(file, false)
        if (res.success) {
            message.success(res.message || t('common.createSuccess'))
            await loadSkills()
            await loadMarketSkills()
        } else {
            message.error(res.message || t('plugins.skills.installFailed'))
        }
    } catch (err: any) {
        console.error('上传技能失败:', err)
        message.error(err.message || t('plugins.skills.installFailed'))
    } finally {
        uploadingZip.value = false
        input.value = ''
    }
}

/** 添加 → 检索安装：打开安装弹窗并切到检索模式 */
function openSearchInstall() {
    addPopoverVisible.value = false
    handleShowInstallDialog()
    installMode.value = 'search'
}

/**
 * 获取指定类型的安装 URL
 */
function getInstallUrl(skill: MarketSkillWithStatus, type: 'zip' | 'git'): string | undefined {
    return skill.installUrls?.find(u => u.type === type)?.url
}

/**
 * 显示市场技能安装弹窗
 */
function handleShowMarketInstallDialog(marketSkill: MarketSkillWithStatus) {
    selectedMarketSkill.value = marketSkill
    showMarketInstallDialog.value = true
}

// ───── 技能详情弹窗（安装前可查看 SKILL.md 正文） ─────
const showDetailDialog = ref(false)
/** 详情目标：归一化后交给 SkillDetailDialog 渲染 */
const detailTarget = ref<{
    id: string
    name: string
    description?: string
    installed: boolean
    zipUrl?: string
} | null>(null)
/** 打开详情时保留的原始市场技能对象（供详情内「添加」复用安装逻辑） */
const detailSourceSkill = ref<MarketSkillWithStatus | null>(null)
/** 详情内「添加」按钮 loading：跟随市场安装队列 */
const detailInstalling = computed(() =>
    detailTarget.value ? installingFromMarket.value.has(detailTarget.value.id) : false,
)

/** 打开技能详情：归一化目标，由统一组件决定读本地文档还是 ZIP 预览 */
function openSkillDetail(skill: MarketSkillWithStatus) {
    detailSourceSkill.value = skill
    detailTarget.value = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        installed: skill.localStatus === 'installed',
        zipUrl: getInstallUrl(skill, 'zip') || undefined,
    }
    showDetailDialog.value = true
}

/** 详情弹窗「添加」：安装成功后关闭弹窗 */
async function handleDetailAdd() {
    if (!detailSourceSkill.value) return
    const ok = await handleInstallFromMarketUrl(detailSourceSkill.value)
    if (ok) showDetailDialog.value = false
}

/**
 * 从市场安装技能（ZIP 方式）
 */
async function handleInstallFromMarketUrl(marketSkill: MarketSkillWithStatus): Promise<boolean> {
    const zipUrl = getInstallUrl(marketSkill, 'zip')
    if (!zipUrl) {
        message.warning(t('plugins.skills.marketNoZip'))
        return false
    }

    installingFromMarket.value.add(marketSkill.id)

    try {
        const response = await apiService.installSkillFromUrl(zipUrl)
        if (response.success) {
            message.success(response.message || t('common.createSuccess'))
            showMarketInstallDialog.value = false
            selectedMarketSkill.value = null
            // 刷新本地技能列表
            await loadSkills()
            return true
        }
        message.error(response.message || '安装失败')
        return false
    } catch (err: any) {
        console.error('从市场安装技能失败:', err)
        message.error(err.message || t('plugins.skills.installFailed'))
        return false
    } finally {
        installingFromMarket.value.delete(marketSkill.id)
    }
}

/**
 * 访问仓库（Git）
 */
function handleViewSourceCode(marketSkill: MarketSkillWithStatus) {
    const gitUrl = getInstallUrl(marketSkill, 'git')
    if (!gitUrl) {
        message.warning(t('plugins.skills.marketNoGit'))
        return
    }
    openInExternalBrowser(gitUrl)
}

/**
 * 更新所有市场技能的状态（与本地已安装技能做名字匹配）
 */
function refreshMarketSkillStatus() {
    const localSkills = skills.value
    marketSkills.value = marketSkills.value.map(marketSkill => {
        const match = localSkills.find(
            local => local.id?.toLowerCase() === marketSkill.id?.toLowerCase()
                || local.manifest.name?.toLowerCase() === marketSkill.id?.toLowerCase()
        )
        if (!match) {
            return { ...marketSkill, localStatus: 'not_installed' as const }
        }

        // 名字匹配成功，比较版本
        const localVer = match.manifest.version
        const marketVer = marketSkill.version
        if (marketVer && localVer && marketVer !== localVer) {
            return { ...marketSkill, localStatus: 'updatable' as const, localVersion: localVer }
        }
        return { ...marketSkill, localStatus: 'installed' as const, localVersion: localVer }
    })
}

/**
 * 获取市场技能按钮文案
 */
    function getMarketButtonLabel(skill: MarketSkillWithStatus): string {
    switch (skill.localStatus) {
        case 'updatable': return t('plugins.skills.marketUpgradeBtn')
        case 'installed': return t('plugins.skills.installedBtn')
        default: return t('plugins.skills.marketInstallBtn')
    }
}

/**
 * 加载 Skills 列表
 */
async function loadSkills() {
    loading.value = true

    try {
        const response = await apiService.fetchSkills()
        skills.value = Array.isArray(response?.items) ? response.items : []
        // 加载后刷新市场技能状态
        refreshMarketSkillStatus()
    } catch (err: any) {
        console.error('加载 Skills 失败:', err)
        const errorMsg = err.message || t('plugins.skills.loadFailed')
        message.error(errorMsg)
        skills.value = []
    } finally {
        loading.value = false
    }
}

/**
 * 触发手动扫描
 */
async function handleToggleSkill(skillId: string, enabled: boolean) {
    const skill = skills.value.find(s => s.id === skillId)
    if (!skill) return

    const previousState = skill.enabled
    // 乐观更新
    skill.enabled = enabled
    updatingSkills.value.add(skillId)

    try {
        if (enabled) {
            await apiService.enableSkill(skillId)
        } else {
            await apiService.disableSkill(skillId)
        }
    } catch (err: any) {
        // 失败回滚
        skill.enabled = previousState
        console.error('切换技能状态失败:', err)
        message.error(err.message || t('plugins.skills.toggleFailed'))
    } finally {
        updatingSkills.value.delete(skillId)
    }
}

/**
 * 重载指定 Skill
 */
async function handleReloadSkill(skillId: string) {
    const previousState = reloadingSkills.value.has(skillId)

    try {
        reloadingSkills.value.add(skillId)
        await apiService.reloadSkill(skillId)
        message.success(t('plugins.skills.reloadSuccess'))
        // 重载后重新加载列表
        await loadSkills()
    } catch (err: any) {
        console.error('重载 Skill 失败:', err)
        const errorMsg = err.message || t('plugins.skills.reloadFailed')
        message.error(errorMsg)
    } finally {
        reloadingSkills.value.delete(skillId)
    }
}

/**
 * 查看 Skill 文档
 */
async function handleViewDocumentation(skillId: string) {
    showDocDialog.value = true
    loadingDoc.value = true
    docError.value = null
    documentation.value = ''

    // 获取 skill 名称用于标题
    const skill = skills.value.find(s => s.id === skillId)
    currentSkillName.value = skill?.manifest.name || skillId
    currentSkillId.value = skillId

    try {
        const response = await apiService.fetchSkillDocumentation(skillId)
        documentation.value = response.content || t('plugins.skills.docNoContent')
    } catch (err: any) {
        console.error('获取 Skill 文档失败:', err)
        const errorMsg: string = err.message || t('plugins.skills.docLoadFailed')
        docError.value = errorMsg
        message.error(errorMsg)
    } finally {
        loadingDoc.value = false
    }
}

/**
 * 显示安装对话框
 */
function handleShowInstallDialog() {
    showInstallDialog.value = true
    selectedFile.value = null
    forceOverwrite.value = false
    installMode.value = 'upload'
    searchKeyword.value = ''
    hasSearched.value = false
    activeCategory.value = ''
    localCatalog.value = []
}

/**
 * 检索安装：同时检索本地（catalog/local）与在线（市场 SPI），
 * 无需切换来源，匹配结果合并显示在下方。
 */
async function handleSearch() {
    hasSearched.value = true
    const kw = searchKeyword.value.trim()

    // 本地检索
    loadingCatalog.value = true
    const localTask = apiService.fetchLocalCatalog(kw)
        .then((items: any) => {
            localCatalog.value = Array.isArray(items)
                ? items.map((it: any) => ({
                    name: String(it.name ?? ''),
                    description: String(it.description ?? ''),
                    sources: Array.isArray(it.sources) ? it.sources : [],
                    localPath: it.localPath,
                    installed: !!it.installed,
                }))
                : []
        })
        .catch((err: any) => {
            console.error('检索本地技能失败:', err)
            localCatalog.value = []
        })
        .finally(() => { loadingCatalog.value = false })

    // 在线：确保市场数据已加载，关键词筛选由 computed 完成
    const onlineTask = (marketSkills.value.length === 0
        ? loadMarketSkills()
        : Promise.resolve()).catch((err: any) => {
            console.error('检索在线技能失败:', err)
        })

    await Promise.allSettled([localTask, onlineTask])
}

/**
 * 安装本地工具技能（复制目录到 skills/user）。
 */
async function handleInstallLocal(item: LocalCatalogItem) {
    const tool = item.sources && item.sources.length > 0 ? item.sources[0] : ''
    if (!tool) {
        message.warning(t('plugins.skills.localEmpty'))
        return
    }
    installingCatalog.value = item.name
    try {
        const res = await apiService.installLocalSkill(tool, item.name, forceOverwrite.value)
        if (res.success) {
            message.success(res.message || t('common.createSuccess'))
            await loadSkills()
            item.installed = true
        } else {
            message.error(res.message || t('plugins.skills.installFailed'))
        }
    } catch (err: any) {
        console.error('安装本地技能失败:', err)
        message.error(err.message || t('plugins.skills.installFailed'))
    } finally {
        installingCatalog.value = ''
    }
}

/**
 * 处理文件选择
 */
function handleFileChange(file: any) {
    selectedFile.value = file.raw
}

/**
 * 清除选中的文件
 */
function clearSelectedFile() {
    selectedFile.value = null
    forceOverwrite.value = false
    if (uploadRef.value) {
        uploadRef.value.clearFiles()
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 安装 Skill
 */
async function handleInstallSkill() {
    if (!selectedFile.value) {
        message.warning(t('plugins.skills.installSelectWarning'))
        return
    }

    installing.value = true

    try {
        const response = await apiService.installSkill(selectedFile.value, forceOverwrite.value)

        if (response.success) {
            message.success(response.message || t('common.createSuccess'))
            showInstallDialog.value = false
            selectedFile.value = null
            forceOverwrite.value = false
            // 重新加载列表
            await loadSkills()
        } else {
            message.error(response.message || t('plugins.skills.installFailed'))
        }
    } catch (err: any) {
        console.error('安装 Skill 失败:', err)
        message.error(err.message || t('plugins.skills.installFailed'))
    } finally {
        installing.value = false
    }
}

/**
 * 卸载 Skill
 */
async function handleUninstallSkill(skillId: string) {
    try {
        // 确认卸载
        await new Promise<void>((resolve, reject) => {
            ElMessageBox.confirm(
                t('plugins.skills.uninstallConfirm', { id: skillId }),
                t('plugins.skills.uninstallTitle'),
                {
                    confirmButtonText: t('common.ok'),
                    cancelButtonText: t('common.cancel'),
                    type: 'warning',
                }
            ).then(() => resolve()).catch(() => reject())
        })

        uninstallingSkills.value.add(skillId)

        const response = await apiService.uninstallSkill(skillId)

        if (response.success) {
            message.success(response.message || t('plugins.skills.uninstallSuccess'))
            // 重新加载列表
            await loadSkills()
        } else {
            message.error(response.message || t('plugins.skills.uninstallFailed'))
        }
    } catch (err: any) {
        if (err !== 'cancel' && err !== 'close') {
            console.error('卸载 Skill 失败:', err)
            message.error(err.message || t('plugins.skills.uninstallFailed'))
        }
    } finally {
        uninstallingSkills.value.delete(skillId)
    }
}

/**
 * 将后端市场 SPI 返回的条目映射为 MarketSkillWithStatus。
 */
function mapMarketEntry(e: any): MarketSkillWithStatus {
    const installUrls: Array<{ type: 'zip' | 'git'; url: string }> = []
    if (e.zipUrl) {
        installUrls.push({ type: 'zip', url: String(e.zipUrl) })
    }
    if (e.gitUrl) {
        installUrls.push({ type: 'git', url: String(e.gitUrl) })
    }
    return {
        id: String(e.id ?? ''),
        name: String(e.name ?? e.id ?? ''),
        description: e.description ?? '',
        icon: e.icon ?? null,
        labels: Array.isArray(e.labels) ? e.labels.map(String) : [],
        installUrls,
        detailUrl: e.detailUrl ?? undefined,
        version: e.version ?? undefined,
        localStatus: 'not_installed',
    }
}

/**
 * 将内置技能条目映射为 MarketSkillWithStatus（默认已安装、不可卸载）。
 */
function mapBuiltinEntry(e: any): MarketSkillWithStatus {
    return {
        id: String(e.id ?? ''),
        name: String(e.name ?? e.id ?? ''),
        description: e.description ?? '',
        icon: e.icon ?? null,
        labels: Array.isArray(e.labels) ? e.labels.map(String) : [],
        installUrls: [],
        version: e.version ?? undefined,
        localStatus: 'installed',
    }
}

/**
 * 加载市场技能：内置技能（classpath 同步到 builtin）与官网市场 SPI 并行加载，
 * 数据均来自后端，前端不直连第三方站点。
 */
async function loadMarketSkills() {
    if (loadingMarket.value) return

    loadingMarket.value = true
    marketError.value = null

    try {
        const [builtinRes, remote] = await Promise.all([
            apiService.fetchBuiltinCatalog().catch((err: any) => {
                console.error('加载内置技能失败:', err)
                return []
            }),
            apiService.fetchMarketCatalog(),
        ])
        const builtin = Array.isArray(builtinRes) ? builtinRes.map(mapBuiltinEntry) : []
        const market = Array.isArray(remote) ? remote.map(mapMarketEntry) : []
        marketSkills.value = [...builtin, ...market]
        // 与本地技能做名字匹配，更新状态
        refreshMarketSkillStatus()
    } catch (err: any) {
        console.error('加载市场技能失败:', err)
        marketError.value = err.message || t('plugins.skills.marketError')
    } finally {
        loadingMarket.value = false
    }
}

/**
 * 打开技能详情页
 */
function handleOpenDetailUrl(marketSkill: MarketSkillWithStatus) {
    if (!marketSkill.detailUrl) {
        message.warning(t('plugins.skills.marketNoDetail'))
        return
    }
    openInExternalBrowser(marketSkill.detailUrl)
}

onMounted(async () => {
    await loadSkills()
    await loadMarketSkills()
})
</script>

<style scoped>
@import "@/assets/markdown.css";

/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 结构色由手写 hex + `.dark xxx {}` 双份覆盖收敛到 refactor.css 已映射好的
      --el-*（--el-fill-color-light / --el-border-color-lighter /
      --el-text-color-* / --el-bg-color），`.dark` 覆盖随之删除 ——
      它们既重复又漏（9 套主题换肤时完全不动）。
   2. 例外：`pre.hljs` / `code` 的底色**刻意保留为固定深/浅两套**。markdown.css
      与 highlight.js 的 foundation 主题是按「编辑器配色」设计的深浅色板，
      底色一旦跟随页面主题，代码高亮里的对比度就不再可控（浅底 + 浅色 token）。
      这里只把它交给 markdown.css 的既有规则，不自行换色。
   3. 卡片 / 容器不加投影。.market-cell:hover 与 .install-mode-group 选中项
      的投影属 koi 允许的第二类（悬浮反馈 / 抬起），只换色源。
   4. 圆角、过渡统一取 --el-radius-* / --el-transition-duration-fast 令牌。
   ============================================================================ */

/* 市场安装弹窗中按钮垂直排列，取消 Element Plus 默认水平按钮间距 */
.market-install-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}


/* 代码块容器 */
.markdown-doc :deep(.custom-code-block) {
    margin-bottom: 1em;
    /* 原值 8px → md 档 */
    border-radius: var(--el-radius-md, 8px);
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
}

/* 代码块头部 */
.markdown-doc :deep(.code-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 12px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 0.8em;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.markdown-doc :deep(.code-language) {
    font-weight: 600;
    text-transform: uppercase;
    color: var(--el-text-color-secondary);
}

/* 代码块内容
   highlight.js 的 foundation 主题自带一套深浅色板（含 .hljs 的背景），
   这里不再用 !important 覆写底色，改回 transparent 交给它渲染 ——
   强行塞页面主题底色会让语法 token 的对比度失控。 */
.markdown-doc :deep(pre.hljs) {
    margin: 0;
    border-radius: 0;
    background: transparent !important;
    padding: 16px;
    overflow-x: auto;
}

.markdown-doc :deep(code.hljs) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875em;
    background: transparent !important;
    display: block;
    overflow-x: auto;
}

/* 行内代码：#e83e8c（亮）/ #ff7b72（暗）是 GitHub 风格的代码强调色，
   属「代码」这一固定语义而非页面语义（同 highlight.js 的 token 配色），
   故保留这一对色值 —— 且**必须成对保留**：单独拿亮色值放到深色底上
   对比度会掉到 3.4:1，代码几乎读不出来。
   底色 / 圆角则改走令牌。 */
.markdown-doc :deep(:not(pre) > code) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875em;
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    /* 原值 4px → xs 档 */
    border-radius: var(--el-radius-xs, 4px);
    color: #e83e8c;
}

.dark .markdown-doc :deep(:not(pre) > code) {
    color: #ff7b72;
}

.markdown-doc :deep(p) {
    margin-bottom: 1em;
    line-height: 1.6;
}

.markdown-doc :deep(h1),
.markdown-doc :deep(h2),
.markdown-doc :deep(h3),
.markdown-doc :deep(h4) {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-weight: 600;
}

.markdown-doc :deep(ul),
.markdown-doc :deep(ol) {
    margin-bottom: 1em;
    padding-left: 1.5em;
}

.markdown-doc :deep(li) {
    margin-bottom: 0.25em;
}

.markdown-doc :deep(blockquote) {
    border-left: 4px solid var(--el-border-color);
    padding-left: 1em;
    color: var(--el-text-color-secondary);
    margin-bottom: 1em;
}

.markdown-doc :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
}

.markdown-doc :deep(th),
.markdown-doc :deep(td) {
    border: 1px solid var(--el-border-color-lighter);
    padding: 8px 12px;
    text-align: left;
}

.markdown-doc :deep(th) {
    background-color: var(--el-fill-color-light);
    font-weight: 600;
}

/* 元信息表格样式 */
.skill-meta-table {
    /* 原值 8px → md 档 */
    border-radius: var(--el-radius-md, 8px);
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
}

.skill-meta-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
}

.skill-meta-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.skill-meta-table tr:last-child td {
    border-bottom: none;
}

.skill-meta-table .meta-key {
    width: 100px;
    background-color: var(--el-fill-color-light);
    font-weight: 600;
    color: var(--el-text-color-regular);
    white-space: nowrap;
}

.skill-meta-table .meta-value {
    color: var(--el-text-color-primary);
    word-break: break-word;
}

/* All tags: flat gray style, no colored borders */
.skills-page :deep(.el-tag) {
    background-color: var(--el-fill-color-light);
    border: none;
    color: var(--el-text-color-secondary);
    font-size: calc(var(--size-text-base) - 3px);
}

/* ===== 安装弹窗：模式与检索结果 ===== */
.install-mode-group {
    width: 100%;
    display: flex;
    padding: 3px;
    /* 原值 11px：不属六档，11 距 sm(6px)/md(8px)/lg(12px) 中 lg 更近（差 1px） */
    border-radius: var(--el-radius-lg, 12px);
    background: var(--el-fill-color-light);
}
.install-mode-group :deep(.el-radio-button) {
    flex: 1;
}
.install-mode-group :deep(.el-radio-button__inner) {
    width: 100%;
    border: none;
    background: transparent;
    box-shadow: none !important;
    /* 原值 9px：不属六档，9 距 sm(6px)/md(8px) 中 md 更近（差 1px） */
    border-radius: var(--el-radius-md, 8px) !important;
    padding: 8px 0;
    font-weight: 600;
    transition:
        background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
}
/* 选中项从凹槽里「抬起」，投影在这里是功能必需的（不是卡片投影）：
   去掉就分不清选中的是哪个模式 */
.install-mode-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
}

.catalog-results {
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
}
.catalog-result-block + .catalog-result-block {
    margin-top: 14px;
}
.catalog-result-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
}

.catalog-category-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

/* 上传拖拽区 */
.upload-demo :deep(.el-upload-dragger) {
    width: 100%;
    /* 原值 12px → lg 档 */
    border-radius: var(--el-radius-lg, 12px);
    border: 1.5px dashed var(--el-border-color);
    background: var(--el-bg-color);
    padding: 26px 20px;
    transition:
        border-color var(--el-transition-duration-fast, 0.2s) ease,
        background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.upload-demo :deep(.el-upload-dragger:hover),
.upload-demo :deep(.el-upload-dragger.is-dragover) {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
}
.upload-demo :deep(.el-icon--upload) {
    color: var(--el-color-primary);
}
.upload-demo :deep(.el-upload__text) {
    color: var(--el-text-color-regular);
    font-size: 13px;
}
.upload-demo :deep(.el-upload__text em) {
    color: var(--el-color-primary);
}

/* 本地结果：行式列表 */
.catalog-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.catalog-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-lighter);
    /* 原值 11px：不属六档，11 距 sm(6px)/md(8px)/lg(12px) 中 lg 更近（差 1px） */
    border-radius: var(--el-radius-lg, 12px);
    background: var(--el-bg-color);
    transition:
        border-color var(--el-transition-duration-fast, 0.2s) ease,
        background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.catalog-item:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-light);
}

/* 在线结果：两列卡片网格 */
.catalog-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}
.catalog-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border: 1px solid var(--el-border-color-lighter);
    /* 原值 11px：不属六档，11 距 sm(6px)/md(8px)/lg(12px) 中 lg 更近（差 1px） */
    border-radius: var(--el-radius-lg, 12px);
    background: var(--el-bg-color);
    transition:
        border-color var(--el-transition-duration-fast, 0.2s) ease,
        background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.catalog-card:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-light);
}

/* ===== 主页面技能市场（参考市场版式） ===== */
.market-topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 2px 0 16px;
}
.market-topbar__search {
    width: 260px;
    max-width: 42%;
}
.market-topbar > .el-button--primary {
    margin-left: auto;
}
.hidden-file-input {
    display: none;
}

.market-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}
.market-toolbar-title {
    font-size: var(--size-text-lg, 16px);
    font-weight: 600;
}
.market-search {
    max-width: 260px;
    margin-left: auto;
}
.market-tabs {
    display: flex;
    align-items: center;
    gap: 16px;
    overflow-x: hidden;
    white-space: nowrap;
    padding: 2px 2px 10px;
    border-bottom: 1px solid var(--el-border-color);
    margin-bottom: 14px;
}
.market-tab {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    padding-bottom: 6px;
    border-bottom: 2px solid transparent;
    transition:
        color var(--el-transition-duration-fast, 0.2s) ease,
        border-color var(--el-transition-duration-fast, 0.2s) ease;
    flex: none;
    outline: none;
}
.market-tab:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.market-tab:hover {
    color: var(--el-text-color-primary);
}
.market-tab.active {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
    font-weight: 600;
}
.market-group {
    margin-bottom: 20px;
}
.market-group-head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 10px;
    cursor: pointer;
    user-select: none;
    outline: none;
    border-radius: var(--el-radius-xs, 4px);
    transition: color var(--el-transition-duration-fast, 0.2s) ease;
}
.market-group-head:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.market-group-title {
    font-size: 13px;
    font-weight: 600;
}
.market-group-arrow {
    color: var(--el-text-color-secondary);
    font-size: 16px;
    line-height: 1;
    transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}
.market-group-arrow.collapsed {
    transform: rotate(90deg);
}
.market-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
    gap: 12px;
}
.market-cell {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 9px;
    padding: 14px;
    border: 1px solid var(--el-border-color-lighter);
    /* 原值 var(--mp-radius-lg, 14px) —— --mp-radius-lg 只在未被引入的
       modern-polish.css 里定义，故此前一直取兜底 14px；14 距 lg(12px)/xl(16px)
       各 2px，技能卡片取 lg 档（与 ReCard 同档） */
    border-radius: var(--el-radius-lg, 12px);
    background: var(--el-bg-color);
    min-width: 0;
    transition:
        border-color var(--el-transition-duration-fast, 0.2s) ease,
        box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
/* hover 浮起：koi 允许的第二类投影。原值写死 rgba(16,24,40,.28)（纯黑投影，
   深色模式下会糊成脏块），改为从正文色派生 */
.market-cell:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 22px -12px color-mix(in srgb, var(--el-text-color-primary) 28%, transparent);
}
.market-cell-icon {
    flex: none;
    align-self: flex-start;
}
.market-cell-body {
    flex: 1;
    min-width: 0;
}
.market-cell-title {
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
.market-cell-desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    margin-top: 3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.market-cell-btn {
    width: 100%;
    margin: 0;
}
.market-cell-btn.el-button--success.is-disabled,
.market-cell-btn.el-button--success.is-disabled:hover,
.market-cell-btn.el-button--success.is-disabled:focus {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border-color: transparent;
}
.market-cell-btn.el-button--success.is-disabled::before {
    content: "\2713";
    margin-right: 5px;
    font-weight: 700;
}
.market-cell--clickable {
    cursor: pointer;
    outline: none;
}
.market-cell--clickable:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ───── 搜索无结果空态 ───── */
.market-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 16px;
    color: var(--el-text-color-secondary);
}
.market-empty__icon {
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
    opacity: 0.45;
}
.market-empty__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-regular);
}
.market-empty__hint {
    font-size: 12px;
    margin-top: 4px;
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ───── 骨架屏 ───── */
.skel {
    flex: none;
    /* 原值 6px → sm 档 */
    border-radius: var(--el-radius-sm, 6px);
    background: linear-gradient(90deg,
        var(--el-fill-color) 25%,
        var(--el-fill-color-light) 37%,
        var(--el-fill-color) 63%);
    background-size: 400% 100%;
    animation: skel-shimmer 1.4s ease infinite;
}
@keyframes skel-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
}
.market-skeleton__tabs {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 2px 2px 10px;
    border-bottom: 1px solid var(--el-border-color);
    margin-bottom: 14px;
}
.skel--tab { width: 56px; max-width: 12%; height: 15px; }
.market-skeleton__group { margin-bottom: 20px; }
.skel--grouphead { width: 120px; height: 13px; margin-bottom: 12px; }
.market-skeleton__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px 12px;
}
.market-skeleton__cell {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--el-border-color);
    /* 原值 10px：不属六档，10 到 md(8px) 与 lg(12px) 都是 2px，取 lg 档
       （骨架屏格子与真实 .catalog-card 的 11px→lg 档保持同档，
         否则「加载中 → 加载完」时格子圆角会跳一下） */
    border-radius: var(--el-radius-lg, 12px);
    background: var(--el-bg-color);
}
.skel--circle { width: 34px; height: 34px; border-radius: var(--el-radius-full, 9999px); }
.market-skeleton__lines { flex: 1; min-width: 0; }
.skel--title { height: 12px; width: 62%; }
.skel--desc { height: 10px; width: 92%; margin-top: 7px; }
.skel--btn { width: 52px; height: 26px; }
/* 骨架屏的微光扫过是「正在加载」的唯一视觉反馈，关掉后必须补静态态：
   下方 reduced-motion 分支把渐变固定在中间档（不再是循环动画），
   形状与明暗关系不变，读者仍能看出「这是占位块」 */

/* ───── 技能详情弹窗 ───── */
.detail-header-icon {
    display: inline-flex;
}
.detail-body {
    display: flex;
    flex-direction: column;
}
.detail-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
}
.detail-desc {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.detail-content-card {
    margin-top: 14px;
    border: 1px solid var(--el-border-color-lighter);
    /* 原值 var(--size-surface-radius, 10px) —— 该令牌在 refactor.css 里 = 20px，
       20px 超六档上限，取最近的 xl 档（16px） */
    border-radius: var(--el-radius-xl, 16px);
    padding: 14px 16px;
    background: var(--el-fill-color-blank);
    max-height: 46vh;
    overflow-y: auto;
}
.detail-content-card .markdown-doc {
    font-size: 13.5px;
    line-height: 1.65;
}
.detail-truncated {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    font-size: 12.5px;
    color: var(--el-text-color-secondary);
}
.market-footer {
    margin-top: 8px;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}
.market-link {
    color: var(--el-color-primary);
    cursor: pointer;
    margin: 0 2px;
    outline: none;
    border-radius: var(--el-radius-xs, 4px);
}
.market-link:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.market-link:hover {
    text-decoration: underline;
}

/* 尊重系统「减少动态效果」偏好。
   .skel 是「技能市场加载中」的唯一视觉反馈，故关掉动画的同时把渐变
   固定在中间档（background-position 停在 50%），占位块仍可见；
   其余过渡一律关掉 —— 它们都只影响观感，不承载任何信息。 */
@media (prefers-reduced-motion: reduce) {
    .install-mode-group :deep(.el-radio-button__inner),
    .upload-demo :deep(.el-upload-dragger),
    .catalog-item,
    .catalog-card,
    .market-tab,
    .market-group-head,
    .market-group-arrow,
    .market-cell {
        transition: none;
    }
    .skel {
        animation: none;
        background-position: 50% 50%;
    }
}
</style>

<style>
/* 添加技能 popover（teleport 到 body，需全局样式） */
.skill-add-popover .add-menu {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: -4px;
}
.skill-add-popover .add-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: none;
    background: transparent;
    /* 原值 8px → md 档 */
    border-radius: var(--el-radius-md, 8px);
    font-size: 13px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    text-align: left;
    width: 100%;
    outline: none;
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.skill-add-popover .add-menu__item:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.skill-add-popover .add-menu__item:hover {
    background: var(--el-fill-color-light);
}

/* 尊重系统「减少动态效果」偏好（非 scoped 块，popover teleport 到 body） */
@media (prefers-reduced-motion: reduce) {
    .skill-add-popover .add-menu__item {
        transition: none;
    }
}
</style>
