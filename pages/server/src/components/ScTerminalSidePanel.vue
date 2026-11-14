<script setup lang="ts">
/**
 * 终端右侧小列面板：文件管理 / 命令片段 —— 「索引簿」形制
 *
 * <p>终端显示区右侧的一根小列（默认 300px，可拖宽并记忆），内部滚动：文件管理看
 * 「名称 / 大小 / 是否目录」，片段看「名称 / 首行 / 备注 / 体量」。双击或回车把片段
 * 下发到当前终端；双击目录进入。</p>
 *
 * <p><b>索引簿（Index Book）</b>：面板像一本通讯录 —— 片段按名称首字分节
 * （重启 nginx → 重、tail 命令 → T），文件按类型分节（目录 / 脚本 / 配置 / 归档 /
 * 日志 / 其他）。右缘一根字母索引条，点字即滚到该节，找东西从「滚动」变成「翻页」。
 * 分组判定全部在 {@link ./terminalPanelGroups} 纯函数层，可单独跑单测。</p>
 *
 * <p>视觉定位：<b>属于终端，而不是属于浏览器</b>。整块用终端的暗面与字符语言 ——
 * 等宽字体、1px 发丝分隔、文本页签 + 下划线指示、裸字形按钮（↑ ⟳ × ↵）、
 * 空态写成注释行（{@code # 暂无片段}）、加载态是一条扫描线 + 闪烁光标。
 * 刻意不用圆角卡片、不用投影、不用 Element 的表单控件：那三样会立刻把面板拉回
 * 「网页浮层」。配色优先取 {@code --term-*}（若外层把终端主题发布到页面根，面板自动跟随）。</p>
 *
 * <p><b>键盘与触屏</b>：列表容器可获得焦点，↑/↓ 移动、Enter 执行、Esc 取消选中；
 * 每行在 hover 与触屏（{@code hover: none}）时都露出一个 {@code ↵} 动作按钮，
 * 所以不依赖"双击"这一个手势。</p>
 *
 * 交互约定：
 * - 单击 = 选中；双击 / Enter / 行尾 ↵ = 执行（片段）或进入（目录）。
 * - 页面级快捷键由外层负责，本组件只处理列表内键盘。
 *
 * @author CH
 * @since 4.0.0.58
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { getSnippets, sftpList } from '../api'
import { getTerminalTheme, type TerminalTheme } from '../api/terminalTheme'
import type { SnippetView } from '../views/snippet/snippetView'
import { filterSnippets, toSnippetViews } from '../views/snippet/snippetView'
import {
  FILE_TYPE_TONE,
  groupFileEntries,
  groupSnippetViews,
  snippetGroupKeys,
  type PanelFileEntry,
  type PanelGroup,
} from './terminalPanelGroups'

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

/* ==================== 宽度与配色 ==================== */

/** 宽度记忆键（平台级只有一处，按浏览器本地存即可） */
const WIDTH_KEY = 'sc.term.sidepanel.width'

/** 允许的最小宽度 */
const MIN_WIDTH = 240

/** 允许的最大宽度（再宽会吃掉终端可视区） */
const MAX_WIDTH = 520

/** 当前宽度 */
const width = ref(300)

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY))
    if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) width.value = saved
  } catch {
    // 隐私模式 / 禁用 storage：忽略，用默认宽度
  }
})

/**
 * 记住宽度。
 */
function persistWidth(): void {
  try {
    localStorage.setItem(WIDTH_KEY, String(Math.round(width.value)))
  } catch {
    // 同上：存不了就算了，不影响本次会话
  }
}

/**
 * 拖左边缘调宽。
 *
 * @param ev 鼠标按下事件
 */
function startResize(ev: MouseEvent): void {
  ev.preventDefault()
  const startX = ev.clientX
  const startWidth = width.value
  const onMove = (e: MouseEvent): void => {
    // 面板贴在右侧：鼠标往左（x 变小）应变更宽
    const next = startWidth + (startX - e.clientX)
    width.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next))
  }
  const onUp = (): void => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    persistWidth()
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

/**
 * 键盘调宽（把手可聚焦，左右箭头各 20px）。
 *
 * @param e 键盘事件
 */
function onGripKey(e: KeyboardEvent): void {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  const delta = e.key === 'ArrowLeft' ? 20 : -20
  width.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width.value + delta))
  persistWidth()
}

/* ==================== 配色：跟随终端主题 ==================== */

/**
 * 终端当前配色。
 *
 * <p>为什么自己拉一次：{@code --term-*} 只设在 **iframe 自己的 documentElement** 上，
 * 父页面拿不到；侧栏又是 iframe 的兄弟节点，CSS 继承不成立。于是终端改成浅色时，
 * 侧栏会仍是深色 —— 看起来像两块不同的界面。这里按平台配置自己取一次，
 * 把三个变量绑到面板根上，终端与侧栏就是同一套颜色。</p>
 *
 * <p>只在面板打开时取（一次小请求），失败就退回默认深色，不影响任何功能。</p>
 */
const termTheme = ref<TerminalTheme | null>(null)

async function loadTermTheme(): Promise<void> {
  try {
    termTheme.value = await getTerminalTheme()
  } catch {
    termTheme.value = null
  }
}

onMounted(() => {
  void loadTermTheme()
})

watch(
  () => props.visible,
  v => {
    // 每次展开都重取：另一台机器改过配色后，重新打开就同步
    if (v) void loadTermTheme()
  },
)

/** 面板根的内联样式：宽度 + 终端配色变量（有才写，没有就走 CSS 里的深色兜底） */
const rootStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = { width: `${width.value}px` }
  const t = termTheme.value
  if (t) {
    style['--term-bg'] = t.background
    style['--term-fg'] = t.foreground
    style['--term-accent'] = t.cursor || t.foreground
  }
  return style
})

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

/** 索引簿：片段按名称首字分节（组内保持传入顺序，键盘导航顺序跟着组走） */
const snippetGroups = computed<PanelGroup<SnippetView>[]>(() => groupSnippetViews(search.value))

/** 片段页索引条上的字（按组顺序） */
const snippetGroupKeysList = computed<string[]>(() => snippetGroupKeys(snippetGroups.value))

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
  markRecent(v.id)
  c(v.content)
}

/** 最近下发过的片段（本地记忆，跨会话保留；只影响一个标记，不改变排序） */
const RECENT_KEY = 'sc.term.sidepanel.recent'

/** 最近下发的片段 id，最新的在前 */
const recentIds = ref<number[]>([])

onMounted(() => {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) recentIds.value = parsed.filter(x => typeof x === 'number').slice(0, 20)
  } catch {
    // 存不了/读不了都不影响功能
  }
})

/**
 * 记一次下发（最多留 20 条）。
 *
 * @param id 片段 id
 */
function markRecent(id: number): void {
  recentIds.value = [id, ...recentIds.value.filter(x => x !== id)].slice(0, 20)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds.value))
  } catch {
    // 同上
  }
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

/** 文件页签是否已经加载过一次（决定页签上的计数显示 `—` 还是数字） */
const filesLoaded = ref(false)

/** 文件页签的本地过滤：只过滤已加载的当前目录，不发请求（敲一个字就发一次 SFTP 会卡） */
const fileKeyword = ref('')

/**
 * 排序与过滤后的条目。
 *
 * <p>目录优先、再按名称（中文按拼音序）。后端返回的顺序取决于 SFTP 实现，
 * 不同服务端不一致；在客户端统一排一次，同一台机器每次打开看到的顺序才稳定。
 * 索引簿的分组在这一层之上：先排好序，再按类型分节。</p>
 */
const sortedEntries = computed<FileEntry[]>(() => {
  const kw = fileKeyword.value.trim().toLowerCase()
  const rows = kw
    ? entries.value.filter(e => e.name.toLowerCase().includes(kw))
    : [...entries.value]
  return rows.sort((a, b) => {
    const byDir = (b.directory ? 1 : 0) - (a.directory ? 1 : 0)
    if (byDir !== 0) return byDir
    return a.name.localeCompare(b.name, 'zh')
  })
})

/** 索引簿：文件按类型分节（目录 / 脚本 / 配置 / 归档 / 日志 / 其他） */
const fileGroups = computed<PanelGroup<FileEntry>[]>(() =>
  groupFileEntries(sortedEntries.value as PanelFileEntry[]),
)

/**
 * 加载当前目录。
 *
 * @param quiet 静默刷新（终端 pwd 回传时用）：不显示「读取中」占位，
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
    filesLoaded.value = true
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

/**
 * 回到上级。
 *
 * <p>以前用正则删最后一段：`/[^/]+\/?$/`。遇到 `//`、结尾多斜杠或空段时容易少删/多删一段。
 * 改成按段重建，任何形态的路径都只上升一层。</p>
 */
function up(): void {
  const dir = fileDir.value
  if (dir === '/') return
  const parts = dir.split('/').filter(Boolean)
  parts.pop()
  fileDir.value = parts.length ? `/${parts.join('/')}` : '/'
  selectedKey.value = ''
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

/**
 * 人性化字节数展示。
 *
 * <p>以前只到 MB：一个 4.4GB 的 jar 会显示成「4505.6 MB」，读起来没有量级概念。
 * 这里补齐 GB / TB，并把 MB 以上保留一位小数。</p>
 *
 * @param bytes 字节数
 * @returns 展示文本
 */
function formatSize(bytes?: number): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  if (gb < 1024) return `${gb.toFixed(1)} GB`
  return `${(gb / 1024).toFixed(2)} TB`
}

/** 切页签 */
function onTab(next: 'files' | 'snippets'): void {
  if (next === 'files' && !props.fileEnabled) return
  tab.value = next
  selectedKey.value = ''
  if (next === 'files') loadFiles()
}

/** 会话协议换到不支持文件通道时，页签从「文件」退回「片段」 */
watch(() => props.fileEnabled, (enabled) => {
  if (!enabled && tab.value === 'files') tab.value = 'snippets'
})

/* ==================== 选中与键盘导航 ==================== */

/** 当前高亮的行键（`s:<id>` / `f:<path>`） */
const selectedKey = ref('')

/** 列表容器（滚动定位只在容器内找，避免多终端并存时滚错面板） */
const bodyEl = ref<HTMLElement | null>(null)

/**
 * 单击选中，并把焦点交给该行。
 *
 * <p>关键修复：行是 div，点了不会自动获得焦点，焦点还留在终端 iframe 上，
 * 于是紧接着按 ↑/↓ 毫无反应。选中时显式 {@code focus()}，键盘链才成立
 * （行是 {@code tabindex="-1"}，可编程聚焦但不进 Tab 序列）。</p>
 *
 * @param e   点击事件
 * @param key 行键
 */
function select(e: MouseEvent, key: string): void {
  selectedKey.value = key
  const el = e.currentTarget as HTMLElement | null
  el?.focus()
}

/** 片段行键 */
function snippetKey(v: SnippetView): string {
  return `s:${v.id}`
}

/** 文件行键 */
function fileKey(e: FileEntry): string {
  return `f:${e.path ?? e.name}`
}

/** 当前列表里可见的行键（键盘移动的依据；按索引簿分组顺序展开） */
const visibleKeys = computed<string[]>(() => {
  const keys: string[] = []
  if (tab.value === 'snippets') {
    for (const g of snippetGroups.value) for (const v of g.items) keys.push(snippetKey(v))
    return keys
  }
  // 「上一级」行参与键盘导航，否则从第一行按 ↑ 会卡住
  if (fileDir.value !== '/') keys.push('f:..')
  for (const g of fileGroups.value) for (const e of g.items) keys.push(fileKey(e))
  return keys
})

/**
 * 上下移动选中行（首尾循环）。
 *
 * @param delta +1 向下 / -1 向上
 */
function moveSelection(delta: number): void {
  const keys = visibleKeys.value
  if (!keys.length) return
  const at = keys.indexOf(selectedKey.value)
  const next = at < 0 ? (delta > 0 ? 0 : keys.length - 1) : (at + delta + keys.length) % keys.length
  selectedKey.value = keys[next] ?? ''
  // 只滚列表容器，不把整页带走；查询限定在 bodyEl 内，多终端并存时不会滚错面板
  requestAnimationFrame(() => {
    const el = bodyEl.value?.querySelector<HTMLElement>(`[data-row="${CSS.escape(selectedKey.value)}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

/** 执行当前选中行（片段下发 / 目录进入 / 上一级） */
function activateSelected(): void {
  const key = selectedKey.value
  if (!key) return
  if (key.startsWith('s:')) {
    const hit = search.value.find(v => snippetKey(v) === key)
    if (hit) onExecute(hit)
    return
  }
  if (key === 'f:..') {
    up()
    return
  }
  const entry = sortedEntries.value.find(e => fileKey(e) === key)
  if (entry) enter(entry)
}

/**
 * 列表键盘事件（容器聚焦时生效）。
 *
 * @param e 键盘事件
 */
function onListKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveSelection(1)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveSelection(-1)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    activateSelected()
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    selectedKey.value = ''
  }
}

/* ==================== 路径面包屑 ==================== */

/** 路径分段（根在最前，末段是当前目录） */
const crumbs = computed<Array<{ name: string; path: string }>>(() => {
  const dir = fileDir.value
  const out = [{ name: '/', path: '/' }]
  if (dir === '/') return out
  let acc = ''
  for (const part of dir.split('/').filter(Boolean)) {
    acc += `/${part}`
    out.push({ name: part, path: acc })
  }
  return out
})

/** 是否因过长而折叠（只渲染末 3 段） */
const crumbsTruncated = computed(() => crumbs.value.length > 3)

/** 实际渲染的分段 */
const shownCrumbs = computed(() => (crumbsTruncated.value ? crumbs.value.slice(-3) : crumbs.value))

/**
 * 跳到面包屑上的某一段。
 *
 * @param path 目标目录
 */
function goToCrumb(path: string): void {
  if (path === fileDir.value) return
  fileDir.value = path
  selectedKey.value = ''
  loadFiles()
}

/* ==================== 索引条（Index Book 签名） ==================== */

/** 当前选中行所在分组的键（索引条高亮；未选中 / 上一级行为空） */
const activeGroupKey = computed<string>(() => {
  const k = selectedKey.value
  if (!k) return ''
  if (k.startsWith('s:')) {
    return snippetGroups.value.find(g => g.items.some(v => snippetKey(v) === k))?.key ?? ''
  }
  if (k === 'f:..') return ''
  return fileGroups.value.find(g => g.items.some(e => fileKey(e) === k))?.key ?? ''
})

/**
 * 点索引条上的字：滚到该分组的节首。
 *
 * <p>只滚列表容器内（bodyEl），与键盘移动同一个查询范围，多终端并存时不会滚错。</p>
 *
 * @param key 组键
 */
function scrollToGroup(key: string): void {
  requestAnimationFrame(() => {
    const el = bodyEl.value?.querySelector<HTMLElement>(`[data-group="${CSS.escape(key)}"]`)
    el?.scrollIntoView({ block: 'start' })
  })
}

/* ==================== 卸载清理 ==================== */

/** 拖动过程中遗留的监听由 startResize 的 mouseup 收尾；组件卸载时再兜一次 */
onBeforeUnmount(() => {
  persistWidth()
})
</script>

<template>
  <aside class="stp" :style="rootStyle" aria-label="文件与片段">
    <!-- 左边缘把手：拖动调宽，键盘左右各 20px -->
    <span
      class="stp-grip"
      role="separator"
      aria-orientation="vertical"
      :aria-valuenow="Math.round(width)"
      :aria-valuemin="MIN_WIDTH"
      :aria-valuemax="MAX_WIDTH"
      tabindex="0"
      title="拖动调整宽度（← → 也可）"
      @mousedown.prevent="startResize"
      @keydown="onGripKey"
    />

    <!-- 头：文本页签 + 下划线指示（tmux 状态行的读法），页签带条数 -->
    <div class="stp-head" role="tablist">
      <button
        type="button"
        class="stp-tab"
        :class="{ 'is-on': tab === 'snippets' }"
        role="tab"
        :aria-selected="tab === 'snippets'"
        @click="onTab('snippets')"
      >片段<i class="stp-tab__n">{{ snippetLoading ? '·' : search.length }}</i></button>
      <button
        v-if="fileEnabled"
        type="button"
        class="stp-tab"
        :class="{ 'is-on': tab === 'files' }"
        role="tab"
        :aria-selected="tab === 'files'"
        @click="onTab('files')"
      >文件<i class="stp-tab__n">{{ filesLoaded ? entries.length : '—' }}</i></button>
      <span class="stp-host" :title="hostName || '未连接'"><i>~</i>{{ hostName || '未连接' }}</span>
      <button type="button" class="stp-x" title="收起面板" aria-label="收起面板" @click="emit('update:visible', false)">×</button>
    </div>

    <!-- 文件：面包屑（可点回上级目录）+ 裸字形按钮 -->
    <div v-if="tab === 'files' && fileEnabled" class="stp-path">
      <button type="button" class="stp-key" :disabled="fileDir === '/'" title="上一级" @click="up">↑</button>
      <button type="button" class="stp-key" :disabled="fileLoading" title="刷新" @click="refresh">⟳</button>
      <span class="stp-crumbs" :title="fileDir">
        <button v-if="crumbsTruncated" type="button" class="stp-crumb is-more" title="上一级" @click="up">…</button>
        <template v-for="(c, i) in shownCrumbs" :key="c.path">
          <span v-if="i > 0" class="stp-crumb__sep">/</span>
          <button
            type="button"
            class="stp-crumb"
            :class="{ 'is-now': c.path === fileDir }"
            :disabled="c.path === fileDir"
            :title="c.path"
            @click="goToCrumb(c.path)"
          >{{ c.name }}</button>
        </template>
      </span>
    </div>

    <!-- 文件：本地过滤（只过滤已加载的这一层目录，不发 SFTP 请求） -->
    <div v-if="tab === 'files' && fileEnabled && entries.length" class="stp-find">
      <span class="stp-find__sig" aria-hidden="true">/</span>
      <input
        v-model="fileKeyword"
        class="stp-input"
        type="text"
        spellcheck="false"
        placeholder="过滤当前目录"
        aria-label="过滤当前目录的文件"
      />
      <button v-if="fileKeyword" type="button" class="stp-key" title="清空" @click="fileKeyword = ''">×</button>
    </div>

    <!-- 片段：搜索（只有一条下划线，没有输入框边框） -->
    <div v-if="tab === 'snippets'" class="stp-find">
      <span class="stp-find__sig" aria-hidden="true">/</span>
      <input
        v-model="keyword"
        class="stp-input"
        type="text"
        spellcheck="false"
        placeholder="搜索片段名 / 正文 / 备注"
        aria-label="搜索片段"
      />
      <button v-if="keyword" type="button" class="stp-key" title="清空" @click="keyword = ''">×</button>
    </div>

    <!-- 片段列表（索引簿：按名称首字分节，右缘字母索引条） -->
    <div
      v-if="tab === 'snippets'"
      ref="bodyEl"
      class="stp-body"
      tabindex="0"
      role="listbox"
      aria-label="命令片段列表（↑↓ 选择，Enter 下发）"
      @keydown="onListKey"
    >
      <div v-if="snippetLoading" class="stp-loading">
        <i class="stp-scan" aria-hidden="true" />
        <span class="stp-loading__txt">读取片段</span>
        <span class="stp-skel" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <template v-else-if="snippetError">
        <p class="stp-note is-bad">{{ snippetError }}</p>
        <button type="button" class="stp-retry" @click="loadSnippets">⟳ 重试</button>
      </template>
      <template v-else-if="!search.length">
        <p class="stp-note">{{ keyword ? '没有匹配的片段' : '暂无片段' }}</p>
        <button v-if="keyword" type="button" class="stp-retry" @click="keyword = ''">× 清除搜索</button>
      </template>
      <template v-else>
        <div class="stp-scroll">
          <p class="stp-group-cap" aria-hidden="true">按名称首字分节</p>
          <template v-for="g in snippetGroups" :key="g.key">
            <div class="stp-group-head" :data-group="g.key">
              <span class="stp-group-head__key">{{ g.key }}</span>
              <span class="stp-group-head__count">{{ g.count }}</span>
            </div>
            <div
              v-for="v in g.items"
              :key="v.id"
              class="stp-row"
              :class="{ 'is-sel': selectedKey === snippetKey(v) }"
              :data-row="snippetKey(v)"
              role="option"
              :aria-selected="selectedKey === snippetKey(v)"
              :title="`${v.name}（双击 / Enter 下发）`"
              tabindex="-1"
              @click="select($event, snippetKey(v))"
              @dblclick="onExecute(v)"
            >
              <i class="stp-row__g" aria-hidden="true">›</i>
              <div class="stp-row__main">
                <span class="stp-row__head">
                  <span class="stp-row__name">{{ v.name }}</span>
                  <span v-if="v.empty" class="stp-tag is-bad">空</span>
                  <span v-else-if="v.remark" class="stp-tag" :title="v.remark">{{ v.remark }}</span>
                  <span v-if="recentIds.includes(v.id)" class="stp-tag is-recent" title="最近下发过">↺</span>
                </span>
                <span class="stp-row__sub">{{ v.empty ? '（无正文）' : v.firstLine }}</span>
                <span class="stp-row__meta">{{ countLabel(v.lines) }} · {{ v.chars }} 字符</span>
              </div>
              <button
                type="button"
                class="stp-act"
                :disabled="v.empty"
                :title="v.empty ? '该片段没有正文' : '下发到终端（Enter）'"
                @click.stop="onExecute(v)"
              >↵</button>
            </div>
          </template>
        </div>
        <nav v-if="snippetGroupKeysList.length" class="stp-index" aria-label="按首字翻页">
          <button
            v-for="k in snippetGroupKeysList"
            :key="k"
            type="button"
            class="stp-index__key"
            :class="{ 'is-on': activeGroupKey === k }"
            :title="`分节 ${k}`"
            @click="scrollToGroup(k)"
          >{{ k }}</button>
        </nav>
      </template>
    </div>

    <!-- 文件列表（索引簿：按类型分节，右缘字母索引条；仅 SSH / Telnet 会话） -->
    <div
      v-else-if="fileEnabled"
      ref="bodyEl"
      class="stp-body"
      tabindex="0"
      role="listbox"
      aria-label="目录列表（↑↓ 选择，Enter 进入）"
      @keydown="onListKey"
    >
      <div v-if="fileLoading" class="stp-loading">
        <i class="stp-scan" aria-hidden="true" />
        <span class="stp-loading__txt">读取目录</span>
        <span class="stp-skel" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <template v-else-if="!props.hostId">
        <p class="stp-note">未选择主机</p>
      </template>
      <template v-else-if="!entries.length">
        <p class="stp-note">目录为空</p>
        <button type="button" class="stp-retry" @click="refresh">⟳ 重新读取</button>
      </template>
      <template v-else>
        <div class="stp-scroll">
          <p v-if="!sortedEntries.length && fileKeyword" class="stp-note">没有匹配的文件</p>
          <p v-else class="stp-group-cap" aria-hidden="true">按类型分节</p>
          <!-- 上一级：一直可点，比顶部的 ↑ 更符合「在列表里往上走」的直觉 -->
          <div
            v-if="fileDir !== '/'"
            class="stp-row stp-row--file stp-row--up"
            :class="{ 'is-sel': selectedKey === 'f:..' }"
            data-row="f:.."
            role="option"
            :aria-selected="selectedKey === 'f:..'"
            title="回到上一级（双击 / Enter）"
            tabindex="-1"
            @click="select($event, 'f:..')"
            @dblclick="up()"
          >
            <span class="stp-row__type is-dir" aria-hidden="true">↑</span>
            <span class="stp-row__name stp-row__name--file is-dir">上一级</span>
            <span class="stp-row__meta stp-row__meta--right">..</span>
            <button type="button" class="stp-act" title="回到上一级（Enter）" @click.stop="up()">↵</button>
          </div>
          <template v-for="g in fileGroups" :key="g.key">
            <div class="stp-group-head stp-group-head--file" :data-group="g.key">
              <span class="stp-group-head__key">{{ g.label }}</span>
              <span class="stp-group-head__count">{{ g.count }}</span>
            </div>
            <div
              v-for="e in g.items"
              :key="e.path ?? e.name"
              class="stp-row stp-row--file"
              :class="{ 'is-sel': selectedKey === fileKey(e) }"
              :data-row="fileKey(e)"
              role="option"
              :aria-selected="selectedKey === fileKey(e)"
              :title="(e.name ?? '') + ' · ' + (e.directory ? '目录（双击 / Enter 进入）' : formatSize(e.size))"
              tabindex="-1"
              @click="select($event, fileKey(e))"
              @dblclick="enter(e)"
            >
              <i class="stp-dot" :class="`is-${g.type ? FILE_TYPE_TONE[g.type] : 'faint'}`" aria-hidden="true" />
              <span class="stp-row__name stp-row__name--file" :class="{ 'is-dir': e.directory }">{{ e.name }}</span>
              <span class="stp-row__meta stp-row__meta--right">{{ e.directory ? 'DIR' : formatSize(e.size) }}</span>
              <button
                v-if="e.directory"
                type="button"
                class="stp-act"
                title="进入目录（Enter）"
                @click.stop="enter(e)"
              >↵</button>
            </div>
          </template>
        </div>
        <nav v-if="fileGroups.length" class="stp-index" aria-label="按类型翻页">
          <button
            v-for="g in fileGroups"
            :key="g.key"
            type="button"
            class="stp-index__key"
            :class="{ 'is-on': activeGroupKey === g.key }"
            :title="`${g.label} · ${g.count}`"
            @click="scrollToGroup(g.key)"
          >{{ g.key }}</button>
        </nav>
      </template>
    </div>
  </aside>
</template>

<style scoped lang="scss">
/*
 * 配色全部走 --term-*：外层若把终端主题发布到页面根，面板自动跟随；
 * 现在没有发布，就回落到终端默认深色，保证与终端的暗面一致。
 * 类型色点（脚本绿 / 配置蓝灰 / 归档琥珀…）是终端暗面里的数据语义色，
 * 不跟随主题强调色，与 xterm 的 ANSI 色同理。
 */
.stp {
  --stp-bg: var(--term-bg, #0b0e14);
  --stp-fg: var(--term-fg, #d7dbe0);
  --stp-dim: color-mix(in srgb, var(--stp-fg) 62%, transparent);
  --stp-faint: color-mix(in srgb, var(--stp-fg) 38%, transparent);
  --stp-line: color-mix(in srgb, var(--stp-fg) 14%, transparent);
  --stp-accent: var(--term-accent, #6aa1ff);
  --stp-bad: #ff7a7a;
  /* 文件类型色点（ANSI 语义色） */
  --stp-dot-script: #3ecf8e;
  --stp-dot-config: #8fa3bf;
  --stp-dot-archive: #e5a50a;
  --stp-dot-log: #6b7280;

  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 25;
  display: flex;
  flex-direction: column;
  background: var(--stp-bg);
  color: var(--stp-fg);
  border-left: 1px solid var(--stp-line);
  /* 内侧一圈极暗的渐变：像终端画面自己压暗了一列，而不是浮在页面上的一张卡片 */
  box-shadow: inset 12px 0 16px -14px rgba(0, 0, 0, .65);
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, "Courier New", monospace);
  font-size: 12px;
  line-height: 1.45;
  animation: stp-in .16s ease-out both;
}

/* 左边缘把手：只在 6px 内响应，视觉上仍是一条发丝线 */
.stp-grip {
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  z-index: 2;
  cursor: col-resize;
  background: transparent;
}
.stp-grip:hover,
.stp-grip:focus-visible {
  outline: none;
  background: color-mix(in srgb, var(--stp-accent) 45%, transparent);
}

/* ---------- 头：文本页签 ---------- */
.stp-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  height: 34px;
  padding: 0 10px;
  border-bottom: 1px solid var(--stp-line);
}
.stp-tab {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  height: 34px;
  padding: 0 1px;
  border: 0;
  background: none;
  color: var(--stp-dim);
  font: inherit;
  letter-spacing: .02em;
  cursor: pointer;
  transition: color .14s ease;
}
.stp-tab:hover:not(.is-on) { color: var(--stp-fg); }
.stp-tab:focus-visible { outline: 1px solid var(--stp-accent); outline-offset: 2px; }
.stp-tab.is-on { color: var(--stp-fg); }
.stp-tab.is-on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: var(--stp-accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--stp-accent) 70%, transparent);
}
/* 页签计数：比文字再小一号、更淡，读作"角标"而不是第二个词 */
.stp-tab__n {
  font-style: normal;
  font-size: 10px;
  color: var(--stp-faint);
  font-variant-numeric: tabular-nums;
}
.stp-host {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  margin-left: auto;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--stp-faint);
}
.stp-host i { font-style: normal; color: var(--stp-accent); opacity: .8; }
.stp-x {
  flex: none;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: none;
  color: var(--stp-faint);
  font: inherit;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: color .14s ease, background .14s ease;
}
.stp-x:hover { color: var(--stp-fg); background: color-mix(in srgb, var(--stp-fg) 12%, transparent); }

/* ---------- 路径条 ---------- */
.stp-path {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 5px 8px;
  border-bottom: 1px solid var(--stp-line);
}
.stp-key {
  flex: none;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: none;
  color: var(--stp-dim);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  transition: color .14s ease, background .14s ease;
}
.stp-key:hover:not(:disabled) { color: var(--stp-fg); background: color-mix(in srgb, var(--stp-fg) 10%, transparent); }
.stp-key:disabled { opacity: .3; cursor: not-allowed; }
.stp-key:focus-visible { outline: 1px solid var(--stp-accent); outline-offset: 1px; }

/* 面包屑：可点回任意上级；末段不可点 */
.stp-crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 11px;
}
.stp-crumb {
  padding: 1px 3px;
  border: 0;
  border-radius: 3px;
  background: none;
  color: var(--stp-dim);
  font: inherit;
  cursor: pointer;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stp-crumb:hover:not(:disabled) { color: var(--stp-fg); background: color-mix(in srgb, var(--stp-fg) 10%, transparent); }
.stp-crumb.is-now { color: var(--stp-fg); cursor: default; }
.stp-crumb.is-more { color: var(--stp-faint); }
.stp-crumb__sep { color: var(--stp-faint); }

/* ---------- 搜索：一条下划线 ---------- */
.stp-find {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 6px 10px;
  border-bottom: 1px solid var(--stp-line);
}
.stp-find__sig { color: var(--stp-accent); opacity: .7; }
.stp-input {
  flex: 1;
  min-width: 0;
  padding: 2px 0;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--stp-fg);
  font: inherit;
  outline: none;
  transition: border-color .14s ease;
}
.stp-input::placeholder { color: var(--stp-faint); }
.stp-input:focus { border-bottom-color: var(--stp-accent); }

/* ---------- 内容区：滚动列 + 右缘索引条 ---------- */
.stp-body {
  flex: 1;
  min-height: 0;
  display: flex;
  outline: none;
}
.stp-body:focus-visible { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--stp-accent) 45%, transparent); }
.stp-scroll {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  padding-bottom: 8px;
}
.stp-scroll:hover { scrollbar-color: color-mix(in srgb, var(--stp-fg) 28%, transparent) transparent; }
.stp-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.stp-scroll::-webkit-scrollbar-track { background: transparent; }
.stp-scroll::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 3px; }
.stp-scroll:hover::-webkit-scrollbar-thumb { background-color: color-mix(in srgb, var(--stp-fg) 28%, transparent); }
.stp-scroll::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, var(--stp-fg) 46%, transparent); }

/* 右缘索引条：通讯录翻页的字 */
.stp-index {
  flex: none;
  width: 17px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  border-left: 1px solid var(--stp-line);
  background: color-mix(in srgb, var(--stp-fg) 2.5%, transparent);
}
.stp-index__key {
  flex: none;
  width: 14px;
  height: 15px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: none;
  color: var(--stp-faint);
  font: inherit;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  transition: color .12s ease, background .12s ease;
}
.stp-index__key:hover { color: var(--stp-fg); background: color-mix(in srgb, var(--stp-fg) 9%, transparent); }
.stp-index__key.is-on { color: var(--stp-accent); background: color-mix(in srgb, var(--stp-accent) 14%, transparent); }
.stp-index__key:focus-visible { outline: 1px solid var(--stp-accent); outline-offset: 1px; }

/* 分节说明（一行小字，像书页的眉题） */
.stp-group-cap {
  margin: 0;
  padding: 6px 10px 2px;
  font-size: 10px;
  letter-spacing: .06em;
  color: var(--stp-faint);
}

/* ---------- 加载态：扫描线 + 闪烁光标 + 三行骨架 ---------- */
.stp-loading {
  position: relative;
  overflow: hidden;
  padding: 16px 12px 20px;
}
.stp-loading__txt { color: var(--stp-dim); font-size: 11.5px; letter-spacing: .04em; }
.stp-loading__txt::after {
  content: '_';
  color: var(--stp-accent);
  animation: stp-caret 1s steps(2, end) infinite;
}
.stp-scan {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--stp-accent) 75%, transparent), transparent);
  animation: stp-scan 1.15s ease-in-out infinite;
}
/* 骨架给出"马上会有几行"的结构，比一行文字少一次跳动 */
.stp-skel {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 12px;
}
.stp-skel i {
  height: 6px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--stp-fg) 10%, transparent);
  animation: stp-pulse 1.4s ease-in-out infinite;
}
.stp-skel i:nth-child(1) { width: 72%; }
.stp-skel i:nth-child(2) { width: 90%; animation-delay: .12s; }
.stp-skel i:nth-child(3) { width: 54%; animation-delay: .24s; }

/* ---------- 注释行：空态 / 错误 ---------- */
.stp-note {
  margin: 0;
  padding: 14px 12px 6px;
  display: flex;
  gap: 6px;
  font-size: 11.5px;
  color: var(--stp-dim);
  word-break: break-word;
}
.stp-note::before { content: '#'; flex: none; color: var(--stp-faint); }
.stp-note.is-bad { color: var(--stp-bad); }
.stp-retry {
  margin: 0 12px 12px;
  padding: 2px 8px;
  border: 1px solid var(--stp-line);
  border-radius: 3px;
  background: none;
  color: var(--stp-dim);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: color .14s ease, border-color .14s ease;
}
.stp-retry:hover { color: var(--stp-fg); border-color: color-mix(in srgb, var(--stp-accent) 50%, transparent); }

/* ---------- 分组头 ---------- */
.stp-group-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 10px 2px;
  font-size: 11px;
  color: var(--stp-accent);
}
.stp-group-head__key { letter-spacing: .08em; }
.stp-group-head__count {
  font-size: 9.5px;
  color: var(--stp-faint);
  font-variant-numeric: tabular-nums;
}
/* 连续两组之间的留白，比行距再松一口气 */
.stp-group-head + .stp-group-head { padding-top: 9px; }

/* ---------- 行 ---------- */
.stp-list { display: flex; flex-direction: column; animation: stp-fade .18s ease-out both; }
.stp-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 8px 5px 6px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease;
}
.stp-row:hover { background: color-mix(in srgb, var(--stp-fg) 7%, transparent); }
/* 行是编程聚焦的（单击后收焦点），焦点环交给 .is-sel 的强调边表达，别叠两层 */
.stp-row:focus { outline: none; }
/* 选中态与 hover 区分开：选中用左侧强调边 + 稍深的底，键盘操作才看得见"在哪一行" */
.stp-row.is-sel {
  background: color-mix(in srgb, var(--stp-fg) 10%, transparent);
  border-left-color: var(--stp-accent);
}
.stp-row__g {
  flex: none;
  width: 8px;
  color: var(--stp-accent);
  font-style: normal;
  opacity: 0;
  transition: opacity .12s ease;
}
.stp-row:hover .stp-row__g,
.stp-row.is-sel .stp-row__g { opacity: .95; }
.stp-row__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.stp-row__head { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.stp-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--stp-fg);
}
.stp-row__sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--stp-dim);
}
.stp-row__meta {
  margin-top: 1px;
  font-size: 10.5px;
  color: var(--stp-faint);
  font-variant-numeric: tabular-nums;
}

/* 备注 / 空正文：一个极小的描边标签，不抢名字的注意力 */
.stp-tag {
  flex: none;
  max-width: 92px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  border: 1px solid var(--stp-line);
  border-radius: 3px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--stp-faint);
}
.stp-tag.is-bad { color: var(--stp-bad); border-color: color-mix(in srgb, var(--stp-bad) 45%, transparent); }
/* 最近下发过：只做标记，不改变排序 —— 排序会让人找不到"刚才那条在哪" */
.stp-tag.is-recent { color: var(--stp-accent); border-color: color-mix(in srgb, var(--stp-accent) 45%, transparent); }

/* 上一级行：比普通目录行更淡，避免被当成一个真实目录 */
.stp-row--up .stp-row__name { color: var(--stp-dim); }
.stp-row--up .stp-row__type { color: var(--stp-dim); }

/* 行尾动作：hover / 选中 / 触屏时露出，作为"双击"的可发现替代 */
.stp-act {
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  color: var(--stp-faint);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity .12s ease, color .12s ease, border-color .12s ease;
}
.stp-row:hover .stp-act,
.stp-row.is-sel .stp-act { opacity: 1; }
.stp-act:hover:not(:disabled) { color: var(--stp-accent); border-color: color-mix(in srgb, var(--stp-accent) 45%, transparent); }
.stp-act:disabled { opacity: .25; cursor: not-allowed; }

/* 文件行：类型色点 + 名字 + 右侧大小，单行不折 */
.stp-row--file { align-items: center; padding-top: 4px; padding-bottom: 4px; }
.stp-row__type { flex: none; width: 10px; text-align: center; color: var(--stp-faint); }
.stp-row__type.is-dir { color: var(--stp-accent); }
.stp-row__name--file { flex: 1; min-width: 0; }
.stp-row__name.is-dir { color: var(--stp-accent); }
.stp-row__meta--right { margin-top: 0; flex: none; }
/* 类型色点：目录用强调色，脚本/配置/归档/日志各有 ANSI 语义色 */
.stp-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  font-style: normal;
  background: var(--stp-faint);
}
.stp-dot.is-accent { background: var(--stp-accent); }
.stp-dot.is-green { background: var(--stp-dot-script); }
.stp-dot.is-slate { background: var(--stp-dot-config); }
.stp-dot.is-amber { background: var(--stp-dot-archive); }
.stp-dot.is-gray { background: var(--stp-dot-log); }
.stp-dot.is-faint { background: var(--stp-faint); }

/* 触屏没有 hover：动作按钮常显，否则只能靠双击 */
@media (hover: none) {
  .stp-act { opacity: 1; }
  .stp-row__g { opacity: .8; }
}

/* ---------- 动效 ---------- */
@keyframes stp-in {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes stp-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes stp-caret {
  50% { opacity: 0; }
}
@keyframes stp-scan {
  0% { transform: translateY(0); opacity: .2; }
  55% { opacity: .9; }
  100% { transform: translateY(46px); opacity: .2; }
}
@keyframes stp-pulse {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .stp, .stp-list, .stp-loading__txt::after, .stp-scan, .stp-skel i {
    animation: none;
  }
  .stp-loading__txt::after { opacity: 1; }
}
</style>