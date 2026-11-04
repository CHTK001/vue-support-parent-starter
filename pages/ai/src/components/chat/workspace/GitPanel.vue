<template>
    <div class="git-panel h-full flex flex-col min-h-0">
        <!-- 面板头部：标题 + 刷新 -->
        <div class="git-panel__head shrink-0">
            <div class="git-panel__title">
                <el-icon :size="15">
                    <Share />
                </el-icon>
                <span>{{ t('chat.workspace.git.title') }}</span>
                <span v-if="status?.branch" class="git-panel__branch">{{ status.branch }}</span>
            </div>
            <div class="flex items-center gap-0.5 shrink-0">
                <LTooltip :content="t('chat.workspace.git.refresh')" placement="bottom">
                    <button class="git-icon-btn" :disabled="loading" @click="refreshAll">
                        <el-icon :size="15" :class="{ 'is-spinning': loading }">
                            <Refresh />
                        </el-icon>
                    </button>
                </LTooltip>
            </div>
        </div>

        <!-- 分支选择（仅在仓库内显示） -->
        <div v-if="status?.repository" class="git-branch-row shrink-0">
            <el-select v-model="branchSelection" size="small" class="git-branch-select" :disabled="branchesLoading"
                @change="onBranchChange">
                <el-option-group v-if="branches.branches.length" :label="t('chat.workspace.git.localBranches')">
                    <el-option v-for="item in branches.branches" :key="item.name" :label="item.name"
                        :value="item.name" />
                </el-option-group>
                <el-option-group v-if="branches.remotes.length" :label="t('chat.workspace.git.remoteBranches')">
                    <el-option v-for="item in branches.remotes" :key="item.name" :label="item.name"
                        :value="item.name" />
                </el-option-group>
            </el-select>
            <LTooltip :content="t('chat.workspace.git.newBranch')" placement="bottom">
                <button class="git-icon-btn" @click="createBranch">
                    <el-icon :size="15">
                        <Plus />
                    </el-icon>
                </button>
            </LTooltip>
        </div>

        <!-- 同步状态 -->
        <div v-if="status?.repository" class="git-sync-row shrink-0">
            <span v-if="status.head" class="git-sync-row__head">{{ status.head }}</span>
            <span v-if="status.detached" class="git-sync-row__badge">{{ t('chat.workspace.git.detached') }}</span>
            <span v-if="status.ahead > 0" class="git-sync-row__ahead">
                ↑{{ status.ahead }}
            </span>
            <span v-if="status.behind > 0" class="git-sync-row__behind">
                ↓{{ status.behind }}
            </span>
        </div>

        <!-- 视图切换：变更 / 历史 -->
        <div v-if="status?.repository" class="git-tabs shrink-0">
            <button class="git-tab" :class="{ active: activeTab === 'changes' }" @click="activeTab = 'changes'">
                {{ t('chat.workspace.git.changes') }}
                <span v-if="status.files.length" class="git-tab__count">{{ status.files.length }}</span>
            </button>
            <button class="git-tab" :class="{ active: activeTab === 'history' }" @click="onShowHistory">
                {{ t('chat.workspace.git.history') }}
            </button>
        </div>

        <!-- 非仓库：初始化引导 -->
        <div v-if="!loading && !status?.repository" class="git-empty">
            <svg class="git-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="9" r="2.5" />
                <path d="M6 8.5v7" />
                <path d="M8.5 6h4.5a5 5 0 0 1 5 5v0" />
            </svg>
            <p class="git-empty__text">{{ t('chat.workspace.git.notRepo') }}</p>
            <button class="git-primary-btn" :disabled="initializing" @click="initRepository">
                {{ initializing ? t('chat.workspace.git.initializing') : t('chat.workspace.git.init') }}
            </button>
        </div>

        <!-- 变更视图 -->
        <div v-else-if="!loading && activeTab === 'changes'" class="git-body flex-1 overflow-auto min-h-0">
            <div v-if="status?.clean" class="git-clean">
                <el-icon :size="14">
                    <Select />
                </el-icon>
                <span>{{ t('chat.workspace.git.clean') }}</span>
            </div>

            <section v-for="group in groups" :key="group.key" v-show="group.files.length" class="git-group">
                <header class="git-group__head">
                    <span class="git-group__title">
                        {{ group.title }}
                        <span class="git-group__count">{{ group.files.length }}</span>
                    </span>
                    <button v-if="group.key !== 'conflicted'" class="git-link-btn" @click="group.action()">
                        {{ group.actionLabel }}
                    </button>
                </header>
                <ul class="git-file-list">
                    <li v-for="file in group.files" :key="`${group.key}:${file.path}`" class="git-file">
                        <button class="git-file__row" :class="{ 'is-open': isExpanded(group.staged, file.path) }"
                            @click="toggleDiff(group.staged, file.path)">
                            <span class="git-file__badge" :class="badgeClass(file, group.key)">
                                {{ badgeText(file, group.key) }}
                            </span>
                            <span class="git-file__path" :title="file.path">{{ file.path }}</span>
                            <span v-if="file.untracked" class="git-file__tag">{{ t('chat.workspace.git.untracked') }}</span>
                            <span v-if="file.conflicted" class="git-file__tag git-file__tag--danger">
                                {{ t('chat.workspace.git.conflictTag') }}
                            </span>
                        </button>

                        <div class="git-file__actions">
                            <LTooltip v-if="group.key === 'unstaged'" :content="t('chat.workspace.git.stage')"
                                placement="left">
                                <button class="git-mini-btn" :disabled="actionBusy"
                                    @click.stop="stageFiles([file.path])">
                                    <el-icon :size="13">
                                        <Plus />
                                    </el-icon>
                                </button>
                            </LTooltip>
                            <LTooltip v-if="group.key === 'staged'" :content="t('chat.workspace.git.unstage')"
                                placement="left">
                                <button class="git-mini-btn" :disabled="actionBusy"
                                    @click.stop="unstageFiles([file.path])">
                                    <el-icon :size="13">
                                        <Minus />
                                    </el-icon>
                                </button>
                            </LTooltip>
                            <LTooltip v-if="group.key === 'unstaged'" :content="t('chat.workspace.git.discard')"
                                placement="left">
                                <button class="git-mini-btn git-mini-btn--danger" :disabled="actionBusy"
                                    @click.stop="discardFiles([file.path])">
                                    <el-icon :size="13">
                                        <Delete />
                                    </el-icon>
                                </button>
                            </LTooltip>
                        </div>

                        <!-- 行内差异 -->
                        <div v-if="isExpanded(group.staged, file.path)" class="git-diff">
                            <div class="git-diff__meta">
                                <span v-if="diffLoading" class="git-diff__hint">{{ t('chat.workspace.git.loadingDiff') }}</span>
                                <template v-else-if="currentDiff">
                                    <span class="git-diff__add">+{{ currentDiff.additions }}</span>
                                    <span class="git-diff__del">−{{ currentDiff.deletions }}</span>
                                </template>
                            </div>
                            <div v-if="!diffLoading && currentDiff" class="git-diff__body">
                                <div v-for="(line, index) in diffLines" :key="index"
                                    :class="diffLineClass(line)">{{ line.text || ' ' }}</div>
                            </div>
                            <p v-else-if="!diffLoading" class="git-diff__hint">
                                {{ currentDiff?.binary ? t('chat.workspace.git.binaryDiff') : t('chat.workspace.git.emptyDiff') }}
                            </p>
                        </div>
                    </li>
                </ul>
            </section>
        </div>

        <!-- 历史视图 -->
        <div v-else-if="!loading" class="git-body flex-1 overflow-auto min-h-0">
            <div v-if="logLoading" class="git-diff__hint px-3 py-4">{{ t('chat.workspace.git.loadingHistory') }}</div>
            <ul v-else-if="logEntries.length" class="git-log-list">
                <li v-for="entry in logEntries" :key="entry.sha" class="git-log-item">
                    <div class="git-log-item__subject" :title="entry.message || entry.subject">
                        {{ entry.subject || entry.shortSha }}
                    </div>
                    <div class="git-log-item__meta">
                        <span class="git-log-item__sha">{{ entry.shortSha }}</span>
                        <span class="git-log-item__author">{{ entry.author }}</span>
                        <span class="git-log-item__time">{{ formatTime(entry.time) }}</span>
                    </div>
                </li>
            </ul>
            <p v-else class="git-diff__hint px-3 py-4">{{ t('chat.workspace.git.noHistory') }}</p>
        </div>

        <!-- 提交区 -->
        <div v-if="status?.repository && activeTab === 'changes'" class="git-commit shrink-0">
            <el-input v-model="commitMessage" type="textarea" :rows="2" resize="none" size="small"
                :placeholder="t('chat.workspace.git.commitPlaceholder')"
                @keydown.ctrl.enter.prevent="submitCommit" />
            <div class="git-commit__bar">
                <span class="git-commit__count">
                    {{ t('chat.workspace.git.stagedCount', { count: stagedFiles.length }) }}
                </span>
                <button class="git-primary-btn" :disabled="!canCommit || committing" @click="submitCommit">
                    {{ committing ? t('chat.workspace.git.committing') : t('chat.workspace.git.commit') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { message } from '@repo/core';
import { ElMessageBox } from 'element-plus';
import { Refresh, Plus, Minus, Delete, Select, Share } from '@element-plus/icons-vue';
import { apiService } from '@/services/ApiService';
import type { GitDiff, GitFileStatus, GitLogEntry, GitStatus } from '@/services/modules/git.api';
import LTooltip from '@/components/ui/LTooltip.vue';

const props = defineProps<{
    sessionId: string | null;
}>();

const { t } = useI18n();

/** 仓库状态 */
const status = ref<GitStatus | null>(null);
/** 分支列表 */
const branches = ref<{ branches: any[]; remotes: any[]; current: string }>({
    branches: [],
    remotes: [],
    current: '',
});
/** 当前下拉选中的分支名 */
const branchSelection = ref('');
/** 提交日志 */
const logEntries = ref<GitLogEntry[]>([]);
/** 主加载状态 */
const loading = ref(false);
/** 分支加载状态 */
const branchesLoading = ref(false);
/** 历史加载状态 */
const logLoading = ref(false);
/** 初始化仓库状态 */
const initializing = ref(false);
/** 暂存/取消暂存/丢弃操作状态 */
const actionBusy = ref(false);
/** 提交状态 */
const committing = ref(false);
/** 提交信息 */
const commitMessage = ref('');
/** 当前视图 */
const activeTab = ref<'changes' | 'history'>('changes');
/** 当前展开的差异键（staged:path） */
const expandedKey = ref<string | null>(null);
/** 当前差异内容 */
const currentDiff = ref<GitDiff | null>(null);
/** 差异加载状态 */
const diffLoading = ref(false);
/** 差异缓存（键 -> 差异） */
const diffCache = new Map<string, GitDiff>();

/** 差异键 */
function diffKey(staged: boolean, path: string): string {
    return `${staged ? 'staged' : 'work'}:${path}`;
}

/** 已暂存文件 */
const stagedFiles = computed<GitFileStatus[]>(() => {
    return (status.value?.files || []).filter((file) => !file.conflicted && file.staged);
});

/** 分组数据 */
const groups = computed(() => {
    const files = status.value?.files || [];
    return [
        {
            key: 'conflicted',
            title: t('chat.workspace.git.conflicted'),
            actionLabel: '',
            staged: false,
            files: files.filter((file) => file.conflicted),
            action: () => undefined,
        },
        {
            key: 'staged',
            title: t('chat.workspace.git.staged'),
            actionLabel: t('chat.workspace.git.unstageAll'),
            staged: true,
            files: stagedFiles.value,
            action: () => unstageFiles([]),
        },
        {
            key: 'unstaged',
            title: t('chat.workspace.git.unstaged'),
            actionLabel: t('chat.workspace.git.stageAll'),
            staged: false,
            files: files.filter(
                (file) => !file.conflicted && (file.untracked || file.workStatus.trim().length > 0),
            ),
            action: () => stageFiles([]),
        },
    ];
});

/** 是否可提交 */
const canCommit = computed(() => {
    return stagedFiles.value.length > 0 && commitMessage.value.trim().length > 0;
});

/** 差异行 */
const diffLines = computed(() => {
    const text = currentDiff.value?.text || '';
    return text.split('\n').map((line) => ({
        text: line,
        type: line.startsWith('+') && !line.startsWith('+++')
            ? 'add'
            : line.startsWith('-') && !line.startsWith('---')
                ? 'del'
                : line.startsWith('@@')
                    ? 'hunk'
                    : 'ctx',
    }));
});

/** 差异行样式 */
function diffLineClass(line: { type: string }): string {
    return `git-diff__line git-diff__line--${line.type}`;
}

/** 文件徽标文案 */
function badgeText(file: GitFileStatus, groupKey: string): string {
    if (groupKey === 'unstaged' && file.untracked) {
        return '?';
    }
    if (file.conflicted) {
        return 'U';
    }
    return groupKey === 'staged' ? file.indexStatus.trim() || 'M' : file.workStatus.trim() || 'M';
}

/** 文件徽标样式 */
function badgeClass(file: GitFileStatus, groupKey: string): string {
    const text = badgeText(file, groupKey);
    if (text === 'A' || text === '?') {
        return 'git-file__badge--add';
    }
    if (text === 'D') {
        return 'git-file__badge--del';
    }
    if (text === 'U') {
        return 'git-file__badge--conflict';
    }
    return 'git-file__badge--modify';
}

/** 时间格式化 */
function formatTime(value: string): string {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 加载仓库状态 */
async function loadStatus(): Promise<void> {
    if (!props.sessionId) {
        status.value = null;
        return;
    }
    loading.value = true;
    try {
        const result = await apiService.getGitStatus(props.sessionId);
        status.value = result;
        branchSelection.value = result.branch || '';
    } catch (error: any) {
        console.error('[GitPanel] 加载状态失败:', error);
        message.error(error?.message || t('chat.workspace.git.loadFailed'));
    } finally {
        loading.value = false;
    }
}

/** 加载分支列表 */
async function loadBranches(): Promise<void> {
    if (!props.sessionId || !status.value?.repository) {
        branches.value = { branches: [], remotes: [], current: '' };
        return;
    }
    branchesLoading.value = true;
    try {
        branches.value = await apiService.getGitBranches(props.sessionId);
        branchSelection.value = branches.value.current || status.value.branch || '';
    } catch (error: any) {
        console.error('[GitPanel] 加载分支失败:', error);
    } finally {
        branchesLoading.value = false;
    }
}

/** 加载提交历史 */
async function loadLog(): Promise<void> {
    if (!props.sessionId || !status.value?.repository) {
        logEntries.value = [];
        return;
    }
    logLoading.value = true;
    try {
        logEntries.value = await apiService.getGitLog(props.sessionId, 50);
    } catch (error: any) {
        console.error('[GitPanel] 加载历史失败:', error);
        logEntries.value = [];
    } finally {
        logLoading.value = false;
    }
}

/** 刷新状态 + 分支 + 历史 */
async function refreshAll(): Promise<void> {
    diffCache.clear();
    expandedKey.value = null;
    currentDiff.value = null;
    await loadStatus();
    await loadBranches();
    if (activeTab.value === 'history') {
        await loadLog();
    }
}

/** 初始化仓库 */
async function initRepository(): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    initializing.value = true;
    try {
        status.value = await apiService.initGitRepository(props.sessionId);
        branchSelection.value = status.value.branch || '';
        message.success(t('chat.workspace.git.initSuccess'));
        await loadBranches();
    } catch (error: any) {
        console.error('[GitPanel] 初始化仓库失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        initializing.value = false;
    }
}

/** 切换分支 */
async function onBranchChange(name: string): Promise<void> {
    if (!props.sessionId || !name || name === (status.value?.branch || '')) {
        return;
    }
    try {
        status.value = await apiService.checkoutGitBranch(props.sessionId, name);
        message.success(t('chat.workspace.git.checkoutSuccess', { name }));
        await refreshAll();
    } catch (error: any) {
        console.error('[GitPanel] 切换分支失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
        branchSelection.value = status.value?.branch || '';
    }
}

/** 新建分支并切换 */
async function createBranch(): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    try {
        const { value } = await ElMessageBox.prompt(
            t('chat.workspace.git.newBranchPlaceholder'),
            t('chat.workspace.git.newBranchTitle'),
            {
                confirmButtonText: t('common.ok'),
                cancelButtonText: t('common.cancel'),
                inputValidator: (input: string) => {
                    if (!input || !input.trim()) {
                        return t('chat.workspace.git.branchRequired');
                    }
                    return true;
                },
            },
        );
        const name = value.trim();
        status.value = await apiService.checkoutGitBranch(props.sessionId, name, true);
        message.success(t('chat.workspace.git.createSuccess', { name }));
        await refreshAll();
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') {
            return;
        }
        console.error('[GitPanel] 新建分支失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    }
}

/** 展开/收起差异 */
async function toggleDiff(staged: boolean, path: string): Promise<void> {
    const key = diffKey(staged, path);
    if (expandedKey.value === key) {
        expandedKey.value = null;
        currentDiff.value = null;
        return;
    }
    expandedKey.value = key;
    const cached = diffCache.get(key);
    if (cached) {
        currentDiff.value = cached;
        return;
    }
    if (!props.sessionId) {
        return;
    }
    diffLoading.value = true;
    currentDiff.value = null;
    try {
        const result = await apiService.getGitDiff(props.sessionId, path, staged);
        diffCache.set(key, result);
        if (expandedKey.value === key) {
            currentDiff.value = result;
        }
    } catch (error: any) {
        console.error('[GitPanel] 加载差异失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        diffLoading.value = false;
    }
}

/** 判断是否展开 */
function isExpanded(staged: boolean, path: string): boolean {
    return expandedKey.value === diffKey(staged, path);
}

/** 暂存文件 */
async function stageFiles(paths: string[]): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    actionBusy.value = true;
    try {
        status.value = await apiService.stageGitFiles(props.sessionId, paths);
        diffCache.clear();
        expandedKey.value = null;
        currentDiff.value = null;
    } catch (error: any) {
        console.error('[GitPanel] 暂存失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        actionBusy.value = false;
    }
}

/** 取消暂存 */
async function unstageFiles(paths: string[]): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    actionBusy.value = true;
    try {
        status.value = await apiService.unstageGitFiles(props.sessionId, paths);
        diffCache.clear();
        expandedKey.value = null;
        currentDiff.value = null;
    } catch (error: any) {
        console.error('[GitPanel] 取消暂存失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        actionBusy.value = false;
    }
}

/** 丢弃工作区变更（二次确认） */
async function discardFiles(paths: string[]): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    const label = paths.length === 1 ? paths[0] : t('chat.workspace.git.filesCount', { count: paths.length });
    try {
        await ElMessageBox.confirm(
            t('chat.workspace.git.discardConfirm', { path: label }),
            t('chat.workspace.git.discardConfirmTitle'),
            {
                confirmButtonText: t('chat.workspace.git.discard'),
                cancelButtonText: t('common.cancel'),
                type: 'warning',
                distinguishCancelAndClose: true,
            },
        );
    } catch (error) {
        return;
    }
    actionBusy.value = true;
    try {
        status.value = await apiService.discardGitFiles(props.sessionId, paths);
        diffCache.clear();
        expandedKey.value = null;
        currentDiff.value = null;
        message.success(t('chat.workspace.git.discarded'));
    } catch (error: any) {
        console.error('[GitPanel] 丢弃变更失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        actionBusy.value = false;
    }
}

/** 提交 */
async function submitCommit(): Promise<void> {
    if (!props.sessionId || committing.value) {
        return;
    }
    if (!commitMessage.value.trim()) {
        message.warning(t('chat.workspace.git.commitMessageRequired'));
        return;
    }
    if (stagedFiles.value.length === 0) {
        message.warning(t('chat.workspace.git.nothingStaged'));
        return;
    }
    committing.value = true;
    try {
        await apiService.commitGit(props.sessionId, commitMessage.value.trim());
        commitMessage.value = '';
        message.success(t('chat.workspace.git.commitSuccess'));
        await refreshAll();
    } catch (error: any) {
        console.error('[GitPanel] 提交失败:', error);
        message.error(error?.message || t('chat.workspace.git.operateFailed'));
    } finally {
        committing.value = false;
    }
}

/** 切换到历史视图时按需加载 */
async function onShowHistory(): Promise<void> {
    activeTab.value = 'history';
    await loadLog();
}

/** 会话切换时重置并重新加载 */
watch(
    () => props.sessionId,
    async (sessionId, previous) => {
        if (sessionId === previous) {
            return;
        }
        status.value = null;
        branches.value = { branches: [], remotes: [], current: '' };
        logEntries.value = [];
        commitMessage.value = '';
        expandedKey.value = null;
        currentDiff.value = null;
        diffCache.clear();
        activeTab.value = 'changes';
        if (sessionId) {
            await loadStatus();
            await loadBranches();
        }
    },
    { immediate: true },
);

defineExpose({
    refresh: refreshAll,
});
</script>

<style scoped>
/* ============================================================================
   Git 面板样式：结构色全部走 --el-* 令牌，随明暗主题切换；
   状态徽标用语义色（增=success、删=danger、改=warning、冲突=danger 描边）。
   ============================================================================ */
.git-panel {
    color: var(--el-text-color-primary);
}

.git-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px 6px;
}

.git-panel__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-text-color-primary);
    min-width: 0;
}

.git-panel__branch {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.git-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    border-radius: var(--el-radius-sm, 6px);
    cursor: pointer;
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
}

.git-icon-btn:hover:not(:disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.git-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.git-icon-btn:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.is-spinning {
    animation: git-spin 1s linear infinite;
}

@keyframes git-spin {
    to {
        transform: rotate(360deg);
    }
}

.git-branch-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px 6px;
}

.git-branch-select {
    flex: 1;
    min-width: 0;
}

.git-sync-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px 6px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.git-sync-row__head {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.git-sync-row__ahead {
    color: var(--el-color-success);
}

.git-sync-row__behind {
    color: var(--el-color-warning);
}

.git-sync-row__badge {
    padding: 0 4px;
    border-radius: var(--el-radius-xs, 4px);
    background: var(--el-fill-color);
}

.git-tabs {
    display: flex;
    gap: 2px;
    padding: 0 8px 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.git-tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    border-radius: var(--el-radius-sm, 6px);
    cursor: pointer;
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
}

.git-tab:hover {
    background: var(--el-fill-color-light);
}

.git-tab.active {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
}

.git-tab__count {
    font-size: 10px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

.git-body {
    padding: 4px 0 8px;
}

.git-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 10px;
    padding: 24px 16px;
    text-align: center;
}

.git-empty__icon {
    width: 36px;
    height: 36px;
    color: var(--el-text-color-placeholder);
}

.git-empty__text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
}

.git-primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-radius-md, 8px);
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-primary);
    font-size: 12px;
    cursor: pointer;
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
        border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.git-primary-btn:hover:not(:disabled) {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
}

.git-primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.git-clean {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px;
    font-size: 12px;
    color: var(--el-color-success);
}

.git-group {
    margin-bottom: 4px;
}

.git-group__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px;
}

.git-group__title {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.git-group__count {
    margin-left: 4px;
    color: var(--el-text-color-placeholder);
}

.git-link-btn {
    border: none;
    background: transparent;
    font-size: 11px;
    color: var(--el-color-primary);
    cursor: pointer;
    padding: 0;
}

.git-link-btn:hover {
    text-decoration: underline;
}

.git-file-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.git-file {
    position: relative;
}

.git-file__row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 3px 10px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: var(--el-text-color-primary);
    transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.git-file__row:hover,
.git-file__row.is-open {
    background: var(--el-fill-color-light);
}

.git-file__badge {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.git-file__badge--add {
    color: var(--el-color-success);
}

.git-file__badge--del {
    color: var(--el-color-danger);
}

.git-file__badge--modify {
    color: var(--el-color-warning);
}

.git-file__badge--conflict {
    color: var(--el-color-danger);
}

.git-file__path {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.git-file__tag {
    flex-shrink: 0;
    font-size: 10px;
    padding: 0 4px;
    border-radius: var(--el-radius-xs, 4px);
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
}

.git-file__tag--danger {
    color: var(--el-color-danger);
}

.git-file__actions {
    position: absolute;
    top: 2px;
    right: 4px;
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.git-file:hover .git-file__actions,
.git-file:focus-within .git-file__actions {
    opacity: 1;
    pointer-events: auto;
}

.git-mini-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: var(--el-radius-xs, 4px);
    background: var(--el-bg-color);
    color: var(--el-text-color-secondary);
    cursor: pointer;
}

.git-mini-btn:hover:not(:disabled) {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
}

.git-mini-btn--danger:hover:not(:disabled) {
    color: var(--el-color-danger);
}

.git-mini-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.git-diff {
    margin: 2px 10px 6px 26px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-sm, 6px);
    overflow: hidden;
    background: var(--el-fill-color-blank);
}

.git-diff__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 8px;
    font-size: 11px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.git-diff__add {
    color: var(--el-color-success);
}

.git-diff__del {
    color: var(--el-color-danger);
}

.git-diff__hint {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.git-diff__body {
    margin: 0;
    padding: 4px 0;
    max-height: 320px;
    overflow: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.5;
    white-space: pre;
}

.git-diff__line {
    display: block;
    padding: 0 8px;
    min-height: 1.5em;
}

.git-diff__line--add {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}

.git-diff__line--del {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.git-diff__line--hunk {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
}

.git-diff__line--ctx {
    color: var(--el-text-color-regular);
}

.git-log-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.git-log-item {
    padding: 6px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.git-log-item__subject {
    font-size: 12px;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.git-log-item__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    font-size: 10px;
    color: var(--el-text-color-secondary);
}

.git-log-item__sha {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.git-commit {
    padding: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
}

.git-commit__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
}

.git-commit__count {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

@media (prefers-reduced-motion: reduce) {
    .git-icon-btn,
    .git-tab,
    .git-file__row,
    .git-file__actions,
    .git-primary-btn {
        transition: none;
    }

    .is-spinning {
        animation: none;
    }
}
</style>
