<template>
    <div class="capability-panel h-full flex flex-col min-h-0">
        <!-- 头部：标题 + 刷新 -->
        <div class="capability-panel__head shrink-0">
            <div class="capability-panel__title">
                <el-icon :size="15">
                    <Cpu />
                </el-icon>
                <span>{{ t('chat.workspace.capability.title') }}</span>
            </div>
            <el-button link size="small" :disabled="loadingServer" @click="loadServerInfo">
                <el-icon :size="14" :class="{ 'is-spinning': loadingServer }">
                    <Refresh />
                </el-icon>
            </el-button>
        </div>

        <div class="capability-panel__scroll flex-1 min-h-0">
            <!-- ── 服务器信息（OSHI 只读采样） ── -->
            <section class="cap-section">
                <div class="cap-section__head">{{ t('chat.workspace.capability.serverInfo') }}</div>
                <template v-if="serverInfo">
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.os') }}</span>
                        <span class="cap-kv__value">{{ serverInfo.osName || '-' }} · {{ serverInfo.osArch || '-' }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.ip') }}</span>
                        <span class="cap-kv__value">{{ serverInfo.computerIp || '-' }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.cpu') }}</span>
                        <span class="cap-kv__value">
                            {{ t('chat.workspace.capability.cpuCores', { n: serverInfo.cpu?.cores ?? '-' }) }}
                            · {{ serverInfo.cpu?.usedPercent ?? '-' }}%
                        </span>
                    </div>
                    <div class="cap-bar">
                        <div class="cap-bar__fill" :style="{ width: `${clampPercent(serverInfo.cpu?.usedPercent)}%` }" />
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.memory') }}</span>
                        <span class="cap-kv__value">
                            {{ serverInfo.memory?.usedMb ?? '-' }} / {{ serverInfo.memory?.totalMb ?? '-' }} MB
                            · {{ serverInfo.memory?.usagePercent ?? '-' }}%
                        </span>
                    </div>
                    <div class="cap-bar">
                        <div class="cap-bar__fill" :style="{ width: `${clampPercent(serverInfo.memory?.usagePercent)}%` }" />
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.javaVersion') }}</span>
                        <span class="cap-kv__value">{{ serverInfo.javaVersion || '-' }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.serverTime') }}</span>
                        <span class="cap-kv__value">{{ formatTime(serverInfo.serverTime) }}</span>
                    </div>
                </template>
                <div v-else-if="serverError" class="cap-empty">{{ serverError }}</div>
                <div v-else class="cap-empty">{{ t('chat.workspace.capability.loading') }}</div>
            </section>

            <!-- ── 权限自测（5.1 测试权限：只读分级，不执行工具） ── -->
            <section class="cap-section">
                <div class="cap-section__head">{{ t('chat.workspace.capability.permissionTitle') }}</div>
                <el-input v-model="permAction" size="small" :placeholder="t('chat.workspace.capability.actionPlaceholder')" />
                <el-input v-model="permResources" size="small" type="textarea" :rows="2"
                    :placeholder="t('chat.workspace.capability.resourcesPlaceholder')" class="cap-gap" />
                <div class="cap-row cap-gap">
                    <el-button size="small" type="primary" :disabled="!permAction.trim() || permLoading"
                        :loading="permLoading" @click="runPermissionTest">
                        {{ t('chat.workspace.capability.runTest') }}
                    </el-button>
                    <span v-if="permResult" class="cap-risk" :class="`cap-risk--${permResult.riskLevel}`">
                        {{ riskLabel(permResult.riskLevel) }}
                    </span>
                </div>
                <template v-if="permResult">
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.allowed') }}</span>
                        <span class="cap-kv__value">{{ yesNo(permResult.allowed) }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.confirmRequired') }}</span>
                        <span class="cap-kv__value">{{ yesNo(permResult.confirmationRequired) }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.strongConfirm') }}</span>
                        <span class="cap-kv__value">{{ yesNo(permResult.strongConfirm) }}</span>
                    </div>
                    <div class="cap-kv">
                        <span class="cap-kv__label">{{ t('chat.workspace.capability.reason') }}</span>
                        <span class="cap-kv__value">{{ permResult.reason }}</span>
                    </div>
                </template>
            </section>

            <!-- ── 角色子代理调用 ── -->
            <section class="cap-section">
                <div class="cap-section__head">
                    {{ t('chat.workspace.capability.subAgents') }}
                    <span class="cap-section__count">{{ subAgents.length }}</span>
                </div>
                <div v-if="subAgentsError" class="cap-empty cap-empty--error">
                    <span>{{ subAgentsError }}</span>
                    <el-button link size="small" :loading="loadingSubAgents" @click="loadSubAgents">
                        {{ t('chat.workspace.capability.retry') }}
                    </el-button>
                </div>
                <div v-else-if="!subAgents.length" class="cap-empty">{{ t('chat.workspace.capability.noSubAgents') }}</div>
                <template v-else>
                    <div class="cap-agent-list">
                        <button v-for="agent in subAgents" :key="agent.agentId" type="button" class="cap-agent"
                            :class="{ active: agent.agentId === selectedAgentId }"
                            :title="agent.description || agent.name" @click="selectedAgentId = agent.agentId">
                            <span class="cap-agent__name">{{ agent.name }}</span>
                            <span class="cap-agent__meta">{{ agent.model || agent.role || agent.masterName || '' }}</span>
                        </button>
                    </div>
                    <el-input v-model="invokeInput" type="textarea" :rows="3"
                        :placeholder="t('chat.workspace.capability.inputPlaceholder')" class="cap-gap" />
                    <div class="cap-row cap-gap">
                        <el-button size="small" type="primary"
                            :disabled="!selectedAgentId || !invokeInput.trim() || invoking" :loading="invoking"
                            @click="invokeAgent">
                            {{ invoking ? t('chat.workspace.capability.invoking') : t('chat.workspace.capability.invoke') }}
                        </el-button>
                        <span v-if="selectedAgent" class="cap-agent__meta">
                            {{ t('chat.workspace.capability.master') }}: {{ selectedAgent.masterName || '-' }}
                        </span>
                    </div>
                    <div v-if="invokeResult" class="cap-invoke-result">
                        <div class="cap-invoke-result__head">
                            {{ invokeResult.name || invokeResult.agentId }} · {{ t('chat.workspace.capability.output') }}
                        </div>
                        <pre class="cap-invoke-result__body">{{ invokeResult.error || invokeResult.output || '' }}</pre>
                    </div>
                </template>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Cpu, Refresh } from '@element-plus/icons-vue';
import { apiService } from '@/services/ApiService';
import type {
    PermissionTestResult,
    SessionServerInfo,
    SubAgentInvokeResult,
    SubAgentItem,
} from '@/services/modules/sessionCapability.api';

const props = defineProps<{
    sessionId: string | null;
}>();

const { t } = useI18n();

// ── 服务器信息 ──
const loadingServer = ref(false);
const serverInfo = ref<SessionServerInfo | null>(null);
const serverError = ref('');

async function loadServerInfo(): Promise<void> {
    if (!props.sessionId || loadingServer.value) return;
    loadingServer.value = true;
    serverError.value = '';
    try {
        serverInfo.value = await apiService.getServerInfo(props.sessionId);
    } catch (error: any) {
        serverInfo.value = null;
        serverError.value = error?.message || t('chat.workspace.capability.loadFailed');
    } finally {
        loadingServer.value = false;
    }
}

// ── 权限自测（只读） ──
const permAction = ref('');
const permResources = ref('');
const permLoading = ref(false);
const permResult = ref<PermissionTestResult | null>(null);

async function runPermissionTest(): Promise<void> {
    if (!props.sessionId || !permAction.value.trim() || permLoading.value) return;
    permLoading.value = true;
    try {
        permResult.value = await apiService.testPermission(
            props.sessionId,
            permAction.value.trim(),
            permResources.value.trim(),
        );
    } catch (error: any) {
        permResult.value = null;
        pushError(error?.message || t('chat.workspace.capability.testFailed'));
    } finally {
        permLoading.value = false;
    }
}

// ── 角色子代理 ──
const subAgents = ref<SubAgentItem[]>([]);
const selectedAgentId = ref('');
const invokeInput = ref('');
const invoking = ref(false);
const invokeResult = ref<SubAgentInvokeResult | null>(null);
const loadingSubAgents = ref(false);
const subAgentsError = ref('');

const selectedAgent = computed(() =>
    subAgents.value.find((agent) => agent.agentId === selectedAgentId.value) || null,
);

async function loadSubAgents(): Promise<void> {
    subAgents.value = [];
    selectedAgentId.value = '';
    invokeResult.value = null;
    if (!props.sessionId || loadingSubAgents.value) return;
    loadingSubAgents.value = true;
    subAgentsError.value = '';
    try {
        const res = await apiService.listSubAgents(props.sessionId);
        subAgents.value = res?.items || [];
    } catch (error: any) {
        // 失败不再静默：展示错误态并提供重试入口
        subAgentsError.value = error?.message || t('chat.workspace.capability.subAgentLoadFailed');
    } finally {
        loadingSubAgents.value = false;
    }
}

async function invokeAgent(): Promise<void> {
    if (!props.sessionId || !selectedAgentId.value || !invokeInput.value.trim() || invoking.value) return;
    invoking.value = true;
    invokeResult.value = null;
    try {
        invokeResult.value = await apiService.invokeSubAgent(
            props.sessionId,
            selectedAgentId.value,
            invokeInput.value.trim(),
        );
    } catch (error: any) {
        pushError(error?.message || t('chat.workspace.capability.invokeFailed'));
    } finally {
        invoking.value = false;
    }
}

// ── 展示辅助 ──
function clampPercent(value?: number): number {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num));
}

function formatTime(ts?: number): string {
    if (!ts) return '-';
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return '-';
    }
}

function riskLabel(level: string): string {
    const key = `chat.workspace.capability.risk.${level}`;
    const text = t(key);
    return text === key ? level : text;
}

function yesNo(value: boolean): string {
    return value ? t('chat.workspace.capability.yes') : t('chat.workspace.capability.no');
}

/** 轻量错误浮层（与 GitPanel 的操作失败提示同风格） */
function pushError(message: string): void {
    import('element-plus').then(({ ElMessage }) => {
        ElMessage.error(message);
    });
}

// 会话切换时全部重载
watch(
    () => props.sessionId,
    () => {
        serverInfo.value = null;
        serverError.value = '';
        permAction.value = '';
        permResources.value = '';
        permResult.value = null;
        invokeInput.value = '';
        subAgentsError.value = '';
        loadServerInfo();
        loadSubAgents();
    },
    { immediate: true },
);
</script>

<style scoped>
.capability-panel {
    background: var(--el-bg-color);
}

.capability-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.capability-panel__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.capability-panel__scroll {
    overflow-y: auto;
    padding: 10px 12px 16px;
}

.cap-section {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
}

.cap-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.cap-section__head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
}

.cap-section__count {
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 999px;
    padding: 1px 7px;
}

.cap-kv {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    line-height: 1.9;
}

.cap-kv__label {
    flex-shrink: 0;
    width: 76px;
    color: var(--el-text-color-secondary);
}

.cap-kv__value {
    min-width: 0;
    color: var(--el-text-color-primary);
    word-break: break-all;
}

.cap-bar {
    height: 5px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    overflow: hidden;
    margin: 3px 0 6px 84px;
}

.cap-bar__fill {
    height: 100%;
    border-radius: 999px;
    background: var(--el-color-primary);
    transition: width 0.4s ease;
}

.cap-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.cap-gap {
    margin-top: 8px;
}

.cap-empty {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    padding: 4px 0;
}

.cap-empty--error {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-color-danger);
}

/* 风险徽标（与 PlanApprovalCard 同一套配色语义） */
.cap-risk {
    font-size: 11px;
    line-height: 1;
    padding: 3px 8px;
    border-radius: 999px;
    font-weight: 600;
}

.cap-risk--low {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.cap-risk--medium {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.cap-risk--high {
    color: var(--el-color-warning);
    background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}

.cap-risk--dangerous {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.cap-agent-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.cap-agent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-md, 8px);
    background: var(--el-fill-color-blank);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.cap-agent:hover {
    border-color: var(--el-color-primary-light-5);
}

.cap-agent.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
}

.cap-agent__name {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cap-agent__meta {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.cap-invoke-result {
    margin-top: 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-md, 8px);
    overflow: hidden;
}

.cap-invoke-result__head {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    padding: 6px 10px;
    background: var(--el-fill-color-light);
}

.cap-invoke-result__body {
    margin: 0;
    padding: 10px;
    max-height: 220px;
    overflow-y: auto;
    font-family: 'Cascadia Mono', 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--el-text-color-primary);
}

.is-spinning {
    animation: cap-spin 1s linear infinite;
}

@keyframes cap-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
