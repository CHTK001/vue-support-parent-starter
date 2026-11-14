/**
 * 终端侧栏面板「索引簿」分组逻辑（纯函数，无 Vue 依赖）
 *
 * <p>把面板当一本索引簿：片段按名称首字分节（备 / 构 / T / Y…），文件按类型分节
 * （目录 / 脚本 / 配置 / 归档 / 日志 / 其他）。所有判定都在这一层完成，
 * 组件只负责渲染与滚动，分组规则可以单独跑单测。</p>
 *
 * @author CH
 * @since 4.0.0.58
 */
import type { SnippetView } from '../views/snippet/snippetView'

/** 文件条目（与组件内 FileEntry 同构，仅供分组函数使用） */
export interface PanelFileEntry {
  name: string
  directory?: boolean
  size?: number
  path?: string
}

/** 文件类型分类 */
export type FileEntryType = 'dir' | 'script' | 'config' | 'archive' | 'log' | 'other'

/** 一个分组 */
export interface PanelGroup<T> {
  /** 组键（索引条上的字） */
  key: string
  /** 组标题文字（文件页用完整类型名） */
  label: string
  /** 条数 */
  count: number
  /** 组内条目（保持传入顺序） */
  items: T[]
  /**
   * 文件分组的类型键（tone/标题查表用）。
   *
   * <p>片段分组没有此字段。文件分组用「目录 / 脚本 / …」做标题，但查色点与
   * 完整标题时必须以类型键（dir/script/…）为准，不能用显示文字反查——文字是
   * 用户可读的，不是表键。</p>
   */
  type?: FileEntryType
}

/** 文件类型 → 标题文字 */
export const FILE_TYPE_LABEL: Record<FileEntryType, string> = {
  dir: '目录',
  script: '脚本',
  config: '配置',
  archive: '归档',
  log: '日志',
  other: '其他',
}

/** 文件类型 → 色点（终端暗面里的可辨识色，不跟随主题强调色） */
export const FILE_TYPE_TONE: Record<FileEntryType, string> = {
  dir: 'accent',
  script: 'green',
  config: 'slate',
  archive: 'amber',
  log: 'gray',
  other: 'faint',
}

/**
 * 片段分组键：名称首个可见字符。
 *
 * <p>英文大写归并（restart.sh → R），中文保留原字（重启 nginx → 重），
 * 空名 / 数字 / 符号统一落 `#`，保证索引条永远有有限几个锚点。</p>
 *
 * @param name 片段名
 */
export function snippetGroupKey(name: string): string {
  const n = String(name ?? '').trim()
  if (!n) return '#'
  const first = [...n][0]!
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase()
  return /[\u4e00-\u9fff]/.test(first) ? first : '#'
}

/**
 * 按名称首字分组（组间按拼音/字典序，组内保持传入顺序）。
 *
 * @param views 片段展示行
 */
export function groupSnippetViews(views: readonly SnippetView[]): PanelGroup<SnippetView>[] {
  const map = new Map<string, SnippetView[]>()
  for (const v of views) {
    const key = snippetGroupKey(v.name)
    const list = map.get(key)
    if (list) list.push(v)
    else map.set(key, [v])
  }
  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b, 'zh'))
  return keys.map(key => ({
    key,
    label: key,
    count: map.get(key)!.length,
    items: map.get(key)!,
  }))
}

/** 片段页索引条上的键（按组顺序） */
export function snippetGroupKeys(groups: readonly PanelGroup<SnippetView>[]): string[] {
  return groups.map(g => g.key)
}

/**
 * 文件类型判定。
 *
 * @param entry 文件条目
 */
export function fileEntryType(entry: PanelFileEntry): FileEntryType {
  if (entry.directory) return 'dir'
  const name = String(entry.name ?? '').toLowerCase()
  if (/\.(sh|bash|bat|cmd|ps1)$/.test(name)) return 'script'
  if (/\.(yml|yaml|json|conf|properties|toml|ini|xml|cnf)$/.test(name)) return 'config'
  if (/\.(jar|war|zip|tar|gz|tgz|bz2|7z|rar)$/.test(name)) return 'archive'
  if (/\.log$/.test(name)) return 'log'
  return 'other'
}

/**
 * 按类型分组（固定顺序：目录 → 脚本 → 配置 → 归档 → 日志 → 其他，空组不出现）。
 *
 * @param entries 文件条目
 */
export function groupFileEntries(entries: readonly PanelFileEntry[]): PanelGroup<PanelFileEntry>[] {
  const map = new Map<FileEntryType, PanelFileEntry[]>()
  for (const e of entries) {
    const t = fileEntryType(e)
    const list = map.get(t)
    if (list) list.push(e)
    else map.set(t, [e])
  }
  const order: FileEntryType[] = ['dir', 'script', 'config', 'archive', 'log', 'other']
  return order
    .filter(t => map.has(t))
    .map(t => ({
      key: FILE_TYPE_LABEL[t]!.charAt(0),
      label: FILE_TYPE_LABEL[t]!,
      count: map.get(t)!.length,
      items: map.get(t)!,
      type: t,
    }))
}