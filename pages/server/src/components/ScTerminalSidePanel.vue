<script setup lang="ts">
/**
 * 终端右侧小列面板：文件管理 / 命令片段
 *
 * <p>终端显示区右侧的一根小列（`300px`，内部滚动）：文件管理只看「路径 / 名称 / 大小 / 类型」
 * 四个维度（不铺 ReTable）；片段只看命令正文。双击片段即可把命令文本下发到
 * 当前管控的终端，等价在终端里输完按回车。</p>
 *
 * <p>不收在抽屉里，是因为终端操作时要随时取用；更重的上传/下载走「文件管理」页。</p>
 *
 * 交互约定：
 * - 双击片段（不是文件名/文件）：把命令文本下发给终端执行。
 * - 双击目录：进入；不双击文件。
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import ReInput from '@repo/ui/re-input'
import ReIcon from '@repo/ui/re-icon'
import { getSnippets, sftpList } from '../api'
import type { SnippetView } from '../views/snippet/snippetView'
import { filterSnippets, toSnippetViews } from '../views/snippet/snippetView'

const props = withDefaults(
  defineProps<{
    /** 当前终端所在主机（文件管理的目标主机；null 时文件管理待连接） */
    hostId: number | null
    /** 当前终端所在主机名（展示用） */
    hostName: string
    /** 双击片段时回填到终端的命令（由外层下发到 iframe 终端） */
    onCommand?: (command: string) => void
    /** 面板展开态（由外层工具条图标控制开关） */
    visible: boolean
    /** 终端 pwd 回传的当前目录（非空时文件页签自动定位过去） */
    path?: string
    /** 目录回传序号：同一路径重复 pwd 也要重新定位 */
    pathSeq?: number
    /**
     * 是否提供「文件」页签。
     *
     * <p>文件页签走的是 SFTP（`/ms/server/sftp/{hostId}`，本质是 SSH 通道）。
     * 只有 SSH / Telnet 会话才存在这条通道；VNC / RDP 会话没有 SSH 时强行调用，
     * 只会把「SSH 连接失败: xxx:22，远程计算机拒绝网络连接」这种底层报错抛给用户。
     * 所以由外层按会话协议决定开关，默认 true 兼容老调用方。</p>
     */
    fileEnabled?: boolean
  }>(),
  { hostId: null, hostName: '', onCommand: undefined, visible: true, path: '', pathSeq: 0, fileEnabled: true },
)

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'close'): void
}>()

/** 页签：文件管理 / 片段 */
const tab = ref<'files' | 'snippets'>('snippets')

/* ==================== 片段管理 ==================== */

/** 片段搜索关键字 */
const keyword = ref('')
/** 片段列表 */
const snippets = ref<SnippetView[]>([])
const snippetLoading = ref(false)
const snippetError = ref('')

onMounted(loadSnippets)

async function loadSnippets(): Promise<void> {
  snippetLoading.value = true
  snippetError.value = ''
  try {
    snippets.value = toSnippetViews(await getSnippets())
  } catch (e) {
    snippetError.value = String((e as Error)?.message ?? e)
  } finally {
    snippetLoading.value = false
  }
}

/** 搜索结果 */
const search = computed(() => filterSnippets(snippets.value, keyword.value))

/** 双击片段 → 下发到终端执行 */
function onExecute(v: SnippetView): void {
  if (v.empty) {
    message.warning(`片段「${v.name}」没有正文`)
    return
  }
  const c = props.onCommand
  if (!c) {
    message.warning('双击片段不执行：未注册终端下发通道')
    return
  }
  c(v.content)
}

function countLabel(n: number): string {
  return n === 1 ? '1 行' : `${n} 行`
}

/* ==================== 文件管理（小列版） ==================== */

/** 文件条目：只铺列表需要的维度，比 ScSftpPanel 的 ReTable 更窄 */
interface FileEntry {
  name: string
  /** 后端返回 directory 标记（可选） */
  directory?: boolean
  size?: number
  /** 当前文件的路径（目录跳转时拼接） */
  path?: string
}

const fileDir = ref('/')
const entries = ref<FileEntry[]>([])
const fileLoading = ref(false)

/**
 * 加载当前目录。
 *
 * @param quiet 静默刷新（终端 pwd 回传时用）：不显示「加载中…」占位，
 *              目录内容原地替换，避免敲一个 pwd 就让右侧面板闪一下。
 */
async function loadFiles(quiet = false): Promise<void> {
  if (!props.fileEnabled) {
    entries.value = []
    return
  }
  if (!props.hostId) {
    entries.value = []
    return
  }
  if (!quiet) fileLoading.value = true
  try {
    const raw = await sftpList(props.hostId, fileDir.value)
    entries.value = (raw ?? []).map(e => ({
      name: String(e.name ?? ''),
      directory: e.directory ?? !!e.directories,
      size: e.size,
      path: e.path ?? e.name,
    }))
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    if (!quiet) fileLoading.value = false
  }
}

/** 进入目录 */
function enter(entry: FileEntry): void {
  if (!entry.directory) return
  fileDir.value = (fileDir.value.endsWith('/') ? fileDir.value : `${fileDir.value}/`) + entry.name
  loadFiles()
}

/** 回到上级 */
function up(): void {
  if (fileDir.value === '/') return
  fileDir.value = fileDir.value.replace(/\/[^/]+\/?$/, '') || '/'
  loadFiles()
}

/** 刷新当前目录 */
function refresh(): void {
  loadFiles()
}

/** 规范化终端回传目录：去引号、反斜杠转正斜杠、去尾斜杠（根保留） */
function normalizeDir(raw: string): string {
  let dir = raw.trim().replace(/^['"]|['"]$/g, '')
  if (!dir) return ''
  dir = dir.replace(/\\/g, '/')
  if (dir.length > 1) dir = dir.replace(/\/+$/, '')
  return dir || '/'
}

/**
 * 把文件页签定位到终端当前目录（终端执行 pwd 后回传）。
 * @param raw 终端输出的绝对路径
 */
function gotoDir(raw: string): void {
  if (!props.fileEnabled) return
  const dir = normalizeDir(raw)
  if (!dir) return
  tab.value = 'files'
  fileDir.value = dir
  loadFiles(true)
}

/* 首次展开：按已回传的目录初始化；后续 pwd 靠序号触发（同一路径也要重新定位） */
watch(() => props.pathSeq, () => { if (props.path) gotoDir(props.path) })
onMounted(() => { if (props.path) gotoDir(props.path) })

/** 人性化字节数展示 */
function formatSize(bytes?: number): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/** 切页签 */
function onTab(next: 'files' | 'snippets'): void {
  if (next === 'files' && !props.fileEnabled) return
  tab.value = next
  if (next === 'files') loadFiles()
}

/** 会话协议换到不支持文件通道时，页签从「文件」退回「片段」 */
watch(() => props.fileEnabled, (enabled) => {
  if (!enabled && tab.value === 'files') tab.value = 'snippets'
})
</script>

<template>
  <div class="stp">
    <div class="stp__head">
      <div class="lb-seg">
        <button type="button" class="lb-seg__btn" :class="{ 'is-active': tab === 'snippets' }" @click="onTab('snippets')">
          <ReIcon name="Document" :size="11" />片段
        </button>
        <button type="button" class="lb-seg__btn" :class="{ 'is-active': tab === 'files' }" @click="onTab('files')" v-if="fileEnabled">
          <ReIcon name="Folder" :size="11" />文件
        </button>
      </div>
      <span class="stp__title">{{ hostName || '未连接' }}</span>
      <button type="button" class="stp__close" title="收起面板" @click="emit('update:visible', false)">
        <ReIcon name="Close" :size="11" />
      </button>
    </div>

    <!-- 片段面板 -->
    <div v-if="tab === 'snippets'" class="stp__body stp-body">
      <ReInput
        v-model="keyword"
        placeholder="搜索片段名 / 正文 / 备注"
        clearable
        class="stp-search"
      />
      <div v-if="snippetLoading" class="stp-empty">加载中…</div>
      <div v-else-if="snippetError" class="stp-empty stp-empty--bad">{{ snippetError }}</div>
      <div v-else-if="!search.length" class="stp-empty">暂无片段</div>
      <div v-else class="stp-list">
        <div
          v-for="v in search"
          :key="v.id"
          class="stp-item"
          :title="`${v.name}（双击执行）`"
          @dblclick="onExecute(v)"
        >
          <div class="stp-item__name">{{ v.name }}</div>
          <div class="stp-item__first">{{ v.firstLine }}</div>
          <div class="stp-item__meta">{{ countLabel(v.lines) }} · {{ v.chars }} 字符</div>
        </div>
      </div>
    </div>

    <!-- 文件面板（仅 SSH / Telnet 会话：SFTP 通道依赖 SSH） -->
    <div v-else-if="fileEnabled" class="stp__body stp-body--file">
      <div class="stp-path">
        <button type="button" :disabled="fileDir === '/'" @click="up">↑ 上级</button>
        <span class="mono">{{ fileDir }}</span>
        <button type="button" :disabled="fileLoading" @click="refresh">⟲ 刷新</button>
      </div>
      <div v-if="!props.hostId" class="stp-empty">未选择主机</div>
      <div v-else>
        <div v-if="fileLoading" class="stp-empty">加载中…</div>
        <div v-else-if="!entries.length" class="stp-empty">目录为空</div>
        <div v-else class="stp-list stp-list--file">
          <div
            v-for="e in entries"
            :key="e.path ?? e.name"
            class="stp-item stp-item--file"
            @dblclick="enter(e)"
            :title="(e.name ?? '') + ' · ' + (e.directory ? '目录' : formatSize(e.size))"
          >
            <ReIcon :name="e.directory ? 'Folder' : 'Document'" :size="11" />
            <span>{{ e.name }}</span>
            <span class="stp-item__meta">{{ e.directory ? '目录' : formatSize(e.size) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../components/lab/_lab-kit.scss";

/* 面板根：终端显示区的右侧小列 */
.stp {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  background: var(--bg-container, #fff);
  border-left: 1px solid var(--border-subtle, rgba(0, 0, 0, .06));
  box-shadow: -2px 0 8px rgba(0, 0, 0, .08);
  transition: width .2s ease;
}

.stp__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, .06));
  background: var(--bg-hover, #f9fafb);
}

.stp__title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stp__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: var(--text-secondary, #5c6270);
  cursor: pointer;
  transition: background .14s, color .14s;
  &:hover { background: var(--border-subtle, rgba(0, 0, 0, .04)); color: var(--text-primary); }
}

.stp__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 12px;
  /* 滚动条：6px 细条，默认全透明，鼠标进入面板才显形（与终端 / ReTable 同款），
     避免 Windows 原生 15px 常驻条把 300px 小列挤窄 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  &:hover {
    scrollbar-color: color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent) transparent;
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 4px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent);
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: color-mix(in srgb, var(--el-text-color-secondary) 50%, transparent);
  }
}

/* 搜索框：给 ReInput 撑满小列宽度 */
.stp-search {
  width: 100% !important;
}

/* 空态 */
.stp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  font-size: 12px;
  color: var(--text-tertiary, #909399);
  text-align: center;
}
.stp-empty--bad { color: var(--pulse-alarm, #d94d4d); }

/* 列表：片段行 / 文件行 */
.stp-list { display: flex; flex-direction: column; gap: 3px; }
.stp-item {
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all .15s ease;
  &:hover { background: var(--brand-50, #f5f3ff); }
  &__name {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__first {
    font-size: 11.5px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__meta {
    font-size: 10.5px;
    color: var(--text-tertiary);
    margin-top: 4px;
  }
  // 文件管理行：左图标 + 名字 + 状态
  &--file {
    display: flex;
    align-items: center;
    gap: 8px;
    & > span:not(.stp-item__meta) { flex: 1; min-width: 0; }
  }
}

/* 文件管理路径条 */
.stp-path {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 2px 10px;
  font-size: 11px;
  user-select: none;
  & button {
    padding: 2px 8px;
    height: 24px;
    font-size: 11px;
    color: var(--text-secondary, #5c6270);
    background: var(--bg-hover, #eef1f5);
    border: 1px solid var(--border-subtle, rgba(0, 0, 0, .06));
    border-radius: 6px;
    cursor: pointer;
    transition: background .14s;
    &:hover { background: var(--background-hover, #e7ebf1); }
    &:disabled { opacity: .5; cursor: not-allowed; }
  }
  & .mono {
    font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
    color: var(--text-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
