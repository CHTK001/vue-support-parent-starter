<template>
    <div class="terminal-panel h-full flex flex-col min-h-0">
        <!-- 头部：标题 + 连接状态 + 工具栏 -->
        <div class="terminal-panel__head shrink-0">
            <div class="terminal-panel__title">
                <el-icon :size="15">
                    <Monitor />
                </el-icon>
                <span>{{ t('chat.workspace.terminal.title') }}</span>
                <span class="terminal-panel__status" :class="statusClass">{{ statusText }}</span>
            </div>
            <div class="flex items-center gap-0.5 shrink-0">
                <LTooltip :content="t('chat.workspace.terminal.clear')" placement="bottom">
                    <button class="terminal-icon-btn" @click="clearScreen">
                        <el-icon :size="15">
                            <Delete />
                        </el-icon>
                    </button>
                </LTooltip>
                <LTooltip :content="t('chat.workspace.terminal.stop')" placement="bottom">
                    <button class="terminal-icon-btn" :disabled="!canStop" @click="stopTerminal">
                        <el-icon :size="15">
                            <VideoPause />
                        </el-icon>
                    </button>
                </LTooltip>
                <LTooltip :content="t('chat.workspace.terminal.restart')" placement="bottom">
                    <button class="terminal-icon-btn" :disabled="connecting" @click="restart">
                        <el-icon :size="15" :class="{ 'is-spinning': connecting }">
                            <Refresh />
                        </el-icon>
                    </button>
                </LTooltip>
            </div>
        </div>

        <!-- xterm 容器：真实 PTY 原始输出由 xterm.js 渲染 -->
        <div class="terminal-stage flex-1 min-h-0">
            <div ref="hostRef" class="terminal-host" :aria-label="t('chat.workspace.terminal.title')" @click="focusTerminal"></div>
            <div v-if="overlayText" class="terminal-overlay">
                <span>{{ overlayText }}</span>
            </div>
        </div>

        <!-- 底部元信息 -->
        <div class="terminal-meta shrink-0">
            <span class="terminal-meta__item" :title="cwd || ''">
                {{ t('chat.workspace.terminal.cwd') }}: {{ cwd || '-' }}
            </span>
            <span v-if="shell" class="terminal-meta__item">{{ t('chat.workspace.terminal.shell') }}: {{ shell }}</span>
            <span class="terminal-meta__item terminal-meta__size">{{ cols }}×{{ rows }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Delete, Monitor, Refresh, VideoPause } from '@element-plus/icons-vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { ITheme } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import {
  terminalSocketManager,
  type TerminalErrorEvent,
  type TerminalExitEvent,
  type TerminalOutputEvent,
  type TerminalReadyEvent,
} from '@/services/modules/TerminalSocketManager';
import LTooltip from '@/components/ui/LTooltip.vue';
import { useTheme } from '@/composables/useTheme';

const props = defineProps<{
    sessionId: string | null;
}>();

const { t } = useI18n();
const { isDark } = useTheme();

/**
 * 终端连接状态。
 *
 * <p>{@code exited}/{@code stopped} 表示 PTY 进程已结束，需要点击重启才能继续输入。</p>
 */
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'exited' | 'stopped' | 'error';

/** 终端滚动缓冲行数 */
const SCROLLBACK = 8000;

/** 终端字体 */
const FONT_FAMILY = "'Cascadia Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace";

/** 亮色主题 */
const LIGHT_THEME: ITheme = {
    background: '#ffffff',
    foreground: '#1f1f1f',
    cursor: '#1f1f1f',
    cursorAccent: '#ffffff',
    selectionBackground: '#add6ff',
    black: '#000000',
    red: '#cd3131',
    green: '#00bc00',
    yellow: '#949800',
    blue: '#0451a5',
    magenta: '#bc05bc',
    cyan: '#0598bc',
    white: '#555555',
    brightBlack: '#666666',
    brightRed: '#cd3131',
    brightGreen: '#14ce14',
    brightYellow: '#b5ba00',
    brightBlue: '#0451a5',
    brightMagenta: '#bc05bc',
    brightCyan: '#0598bc',
    brightWhite: '#a5a5a5',
};

/** 暗色主题 */
const DARK_THEME: ITheme = {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    cursorAccent: '#1e1e1e',
    selectionBackground: '#264f78',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
};

/** xterm 容器 */
const hostRef = ref<HTMLElement | null>(null);
/** 当前工作目录 */
const cwd = ref('');
/** 工作区根目录 */
const workspace = ref('');
/** shell 标识 */
const shell = ref('');
/** 终端列数 */
const cols = ref(120);
/** 终端行数 */
const rows = ref(32);
/** 连接状态 */
const connectionState = ref<ConnectionState>('idle');

/** xterm 实例 */
let terminalInstance: Terminal | null = null;
/** 自适应 addon */
let fitAddon: FitAddon | null = null;
/** 尺寸监听 */
let resizeObserver: ResizeObserver | null = null;
/** 按帧节流的尺寸同步句柄 */
let resizeFrame = 0;
/** 是否已卸载（卸载后忽略迟到的连接事件） */
let disposed = false;
/** 是否主动断开（主动断开不提示“连接已断开”） */
let intentionalDisconnect = false;
/** 取消监听函数集合 */
const unsubscribeList: Array<() => void> = [];

/** 连接中 */
const connecting = computed(() => connectionState.value === 'connecting');
/** 是否可终止进程 */
const canStop = computed(() => connectionState.value === 'connected');

/** 状态文案 */
const statusText = computed(() => {
    switch (connectionState.value) {
        case 'connecting':
            return t('chat.workspace.terminal.connecting');
        case 'connected':
            return t('chat.workspace.terminal.connected');
        case 'disconnected':
            return t('chat.workspace.terminal.disconnected');
        case 'exited':
            return t('chat.workspace.terminal.exited');
        case 'stopped':
            return t('chat.workspace.terminal.stoppedState');
        case 'error':
            return t('chat.workspace.terminal.connectFailedShort');
        default:
            return t('chat.workspace.terminal.idle');
    }
});

/** 状态样式 */
const statusClass = computed(() => `terminal-panel__status--${connectionState.value}`);

/** 非连接态时在终端上方的提示文案 */
const overlayText = computed(() => {
    switch (connectionState.value) {
        case 'connecting':
            return t('chat.workspace.terminal.connecting');
        case 'disconnected':
            return t('chat.workspace.terminal.connectionLost');
        case 'exited':
        case 'stopped':
        case 'error':
            return t('chat.workspace.terminal.restartToContinue');
        default:
            return '';
    }
});

/** 当前主题 */
function buildTheme(): ITheme {
    return isDark.value ? DARK_THEME : LIGHT_THEME;
}

/** 创建 xterm 实例 */
function createTerminal(): void {
    if (terminalInstance || !hostRef.value) {
        return;
    }
    terminalInstance = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        lineHeight: 1.2,
        letterSpacing: 0,
        scrollback: SCROLLBACK,
        allowTransparency: false,
        convertEol: false,
        theme: buildTheme(),
    });
    fitAddon = new FitAddon();
    terminalInstance.loadAddon(fitAddon);
    terminalInstance.open(hostRef.value);

    // 原始按键直接写入 PTY：Ctrl+C、方向键、vim 的 ESC/:wq 等都由 xterm 生成对应控制序列
    terminalInstance.onData((data) => {
        if (connectionState.value !== 'connected') {
            return;
        }
        try {
            terminalSocketManager.sendInput(data);
        } catch (error: any) {
            pushNotice(error?.message || t('chat.workspace.terminal.notConnected'), '31');
        }
    });

    observeSize();
    fitTerminal();
    void document.fonts?.ready.then(() => fitTerminal());
}

/** 监听容器尺寸变化 */
function observeSize(): void {
    if (!hostRef.value || typeof ResizeObserver === 'undefined') {
        return;
    }
    resizeObserver = new ResizeObserver(() => {
        if (resizeFrame) {
            cancelAnimationFrame(resizeFrame);
        }
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            syncSize();
        });
    });
    resizeObserver.observe(hostRef.value);
}

/** 自适应容器尺寸，返回最新行列数 */
function fitTerminal(): { cols: number; rows: number } | null {
    if (!terminalInstance || !fitAddon || !hostRef.value) {
        return null;
    }
    const rect = hostRef.value.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) {
        return null;
    }
    try {
        fitAddon.fit();
    } catch {
        return null;
    }
    cols.value = terminalInstance.cols;
    rows.value = terminalInstance.rows;
    return { cols: terminalInstance.cols, rows: terminalInstance.rows };
}

/** 自适应并同步 PTY 尺寸 */
function syncSize(): void {
    const size = fitTerminal();
    if (!size) {
        return;
    }
    terminalSocketManager.sendResize(size.cols, size.rows);
}

/** 聚焦终端 */
function focusTerminal(): void {
    terminalInstance?.focus();
}

/** 向终端写入本地提示（不经过 PTY） */
function pushNotice(text: string, color = '90'): void {
    if (!terminalInstance || !text) {
        return;
    }
    terminalInstance.write(`\r\n\x1b[${color}m${text}\x1b[0m\r\n`);
}

/** 清屏（保留滚动历史） */
function clearScreen(): void {
    terminalInstance?.clear();
    focusTerminal();
}

/** 处理 terminal.ready */
function onReady(payload: TerminalReadyEvent): void {
    intentionalDisconnect = false;
    connectionState.value = 'connected';
    cwd.value = payload?.cwd || '';
    workspace.value = payload?.workspace || '';
    shell.value = payload?.shell || '';
    if (payload?.cols) {
        cols.value = payload.cols;
    }
    if (payload?.rows) {
        rows.value = payload.rows;
    }
    focusTerminal();
}

/** 处理 terminal.output：原样写入，交给 xterm 解析 ANSI */
function onOutput(payload: TerminalOutputEvent): void {
    if (!payload?.data) {
        return;
    }
    terminalInstance?.write(payload.data);
}

/** 处理 terminal.exit */
function onExit(payload: TerminalExitEvent): void {
    connectionState.value = 'exited';
    pushNotice(t('chat.workspace.terminal.exitNotice', { code: payload?.code ?? -1 }), '33');
    pushNotice(t('chat.workspace.terminal.restartToContinue'), '90');
}

/** 处理 terminal.error */
function onError(payload: TerminalErrorEvent): void {
    pushNotice(payload?.message || t('chat.workspace.terminal.commandFailed'), '31');
}

/** 处理 terminal.stopped（主动终止） */
function onStopped(): void {
    connectionState.value = 'stopped';
    pushNotice(t('chat.workspace.terminal.stoppedNotice'), '90');
}

/** 处理连接状态变化 */
function onConnectionStatus(connected: boolean): void {
    if (disposed) {
        return;
    }
    if (connected) {
        // 等待服务端 terminal.ready 后再允许输入
        if (connectionState.value === 'disconnected' || connectionState.value === 'error') {
            connectionState.value = 'connecting';
        }
        return;
    }
    if (intentionalDisconnect) {
        return;
    }
    connectionState.value = 'disconnected';
    pushNotice(t('chat.workspace.terminal.connectionLost'), '90');
}

/** 注册事件监听 */
function bindEvents(): void {
    if (unsubscribeList.length > 0) {
        return;
    }
    unsubscribeList.push(
        terminalSocketManager.on('ready', onReady),
        terminalSocketManager.on('output', onOutput),
        terminalSocketManager.on('exit', onExit),
        terminalSocketManager.on('error', onError),
        terminalSocketManager.on('stopped', onStopped),
        terminalSocketManager.onStatusChange(onConnectionStatus),
    );
}

/** 取消事件监听 */
function unbindEvents(): void {
    while (unsubscribeList.length) {
        unsubscribeList.pop()?.();
    }
}

/** 建立连接并启动 PTY */
async function connect(reset: boolean): Promise<void> {
    if (!props.sessionId || !terminalInstance) {
        return;
    }
    const size = fitTerminal();
    connectionState.value = 'connecting';
    if (reset) {
        terminalInstance.reset();
    }
    try {
        await terminalSocketManager.connect(
            props.sessionId,
            size?.cols ?? cols.value,
            size?.rows ?? rows.value,
        );
    } catch (error: any) {
        console.error('[TerminalPanel] 连接失败:', error);
        connectionState.value = 'error';
        pushNotice(
            t('chat.workspace.terminal.connectFailed', {
                message: error?.message || String(error),
            }),
            '31',
        );
    }
}

/** 重启终端（会话内重建 PTY） */
async function restart(): Promise<void> {
    if (!props.sessionId) {
        return;
    }
    intentionalDisconnect = false;
    cwd.value = '';
    shell.value = '';
    await connect(true);
}

/** 终止当前 PTY 进程 */
function stopTerminal(): void {
    if (!terminalSocketManager.isConnected || !canStop.value) {
        return;
    }
    terminalSocketManager.stop();
}

/** 会话切换：重建终端并重新连接 */
watch(
    () => props.sessionId,
    async (sessionId, previous) => {
        if (sessionId === previous) {
            return;
        }
        cwd.value = '';
        workspace.value = '';
        shell.value = '';
        connectionState.value = 'idle';
        intentionalDisconnect = true;
        terminalSocketManager.disconnect();
        if (sessionId) {
            await connect(true);
        }
    },
);

/** 主题切换：同步 xterm 配色 */
watch(isDark, () => {
    if (terminalInstance) {
        terminalInstance.options.theme = buildTheme();
    }
});

onMounted(() => {
    createTerminal();
    bindEvents();
    if (props.sessionId) {
        void connect(true);
    }
});

onBeforeUnmount(() => {
    disposed = true;
    intentionalDisconnect = true;
    if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = 0;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    terminalSocketManager.disconnect();
    unbindEvents();
    terminalInstance?.dispose();
    terminalInstance = null;
    fitAddon = null;
});
</script>

<style scoped>
/* ============================================================================
   终端面板样式：xterm 渲染真实 PTY 输出，容器只负责尺寸与边框，
   结构色走 --el-* 令牌，状态徽标按连接状态着色。
   ============================================================================ */
.terminal-panel {
    color: var(--el-text-color-primary);
}

.terminal-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px 6px;
}

.terminal-panel__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    min-width: 0;
}

.terminal-panel__status {
    font-size: 10px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
}

.terminal-panel__status--connected {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.terminal-panel__status--connecting {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.terminal-panel__status--exited,
.terminal-panel__status--stopped,
.terminal-panel__status--error {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.terminal-icon-btn {
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

.terminal-icon-btn:hover:not(:disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.terminal-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.terminal-icon-btn:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.is-spinning {
    animation: terminal-spin 1s linear infinite;
}

@keyframes terminal-spin {
    to {
        transform: rotate(360deg);
    }
}

.terminal-stage {
    position: relative;
    display: flex;
    min-height: 0;
    margin: 0 8px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-sm, 6px);
    overflow: hidden;
    background: var(--el-fill-color-blank);
}

.terminal-host {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 6px 8px;
    cursor: text;
}

/* xterm 默认按容器解析尺寸，这里让它铺满宿主 */
.terminal-host .xterm {
    height: 100%;
}

.terminal-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    text-align: center;
    font-size: 11.5px;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-bg-color) 72%, transparent);
    pointer-events: none;
}

.terminal-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 8px;
    font-size: 10px;
    color: var(--el-text-color-secondary);
    min-width: 0;
}

.terminal-meta__item {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.terminal-meta__size {
    margin-left: auto;
    flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
    .terminal-icon-btn {
        transition: none;
    }

    .is-spinning {
        animation: none;
    }
}
</style>
