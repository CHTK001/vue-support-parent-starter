/**
 * 片段管理展示层单测。
 *
 * <p>重点覆盖「正文可见」这件事的算法口径：行数怎么数、首行取哪一行、
 * 空内容怎么判定、搜索是否真的搜到正文。这些值直接决定四个方向里用户看到什么，
 * 算错了界面不会报错，只会安静地说错话。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  countLines,
  filterSnippets,
  firstLineOf,
  lineBuckets,
  snippetStats,
  splitLines,
  toSnippetView,
  toSnippetViews,
  type SnippetRow,
} from '../views/snippet/snippetView'

/**
 * 造一行后端数据
 *
 * @param patch 覆盖字段
 */
function row(patch: Partial<SnippetRow> = {}): SnippetRow {
  return {
    id: 1,
    msTerminalSnippetName: '重启 Nginx',
    msTerminalSnippetContent: 'systemctl restart nginx',
    msTerminalSnippetRemark: '发版后用',
    ...patch,
  }
}

describe('splitLines', () => {
  it('三种换行都能切开', () => {
    expect(splitLines('a\r\nb\nc\rd')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('为空或空串时给空数组', () => {
    expect(splitLines('')).toEqual([])
    expect(splitLines(null)).toEqual([])
    expect(splitLines(undefined)).toEqual([])
  })

  it('切完不残留 \\r（否则 firstLine 会带一个不可见字符）', () => {
    expect(firstLineOf('echo hi\r\nls')).toBe('echo hi')
  })
})

describe('countLines', () => {
  it('只数非空行，尾部空行不算', () => {
    expect(countLines('a\nb\n\n')).toBe(2)
  })

  it('只有空白的行也不算', () => {
    expect(countLines('a\n   \n\t\nb')).toBe(2)
  })

  it('单行命令算 1 行', () => {
    expect(countLines('systemctl restart nginx')).toBe(1)
  })

  it('空内容算 0 行', () => {
    expect(countLines('')).toBe(0)
    expect(countLines(undefined)).toBe(0)
  })
})

describe('firstLineOf', () => {
  it('跳过开头的空行', () => {
    expect(firstLineOf('\n\n  ls -la  \nfoo')).toBe('ls -la')
  })

  it('去掉首行两侧空白', () => {
    expect(firstLineOf('   echo hi   ')).toBe('echo hi')
  })

  it('全空白时给空串', () => {
    expect(firstLineOf('   \n\n')).toBe('')
  })
})

describe('toSnippetView', () => {
  it('把正文的派生形状一次算齐', () => {
    const view = toSnippetView(row({ msTerminalSnippetContent: 'a\nb\nc' }))
    expect(view.lines).toBe(3)
    expect(view.chars).toBe(5)
    expect(view.firstLine).toBe('a')
    expect(view.empty).toBe(false)
  })

  it('没有名称时给「未命名片段」而不是空标题（否则卡片头会是空白一条）', () => {
    expect(toSnippetView(row({ msTerminalSnippetName: undefined })).name).toBe('未命名片段')
    expect(toSnippetView(row({ msTerminalSnippetName: '   ' })).name).toBe('未命名片段')
  })

  it('没有正文时 empty 为真', () => {
    const view = toSnippetView(row({ msTerminalSnippetContent: '' }))
    expect(view.empty).toBe(true)
    expect(view.lines).toBe(0)
    expect(view.firstLine).toBe('')
  })

  it('备注去两侧空白；缺省为空串（画布不必判 null）', () => {
    expect(toSnippetView(row({ msTerminalSnippetRemark: '  发版后  ' })).remark).toBe('发版后')
    expect(toSnippetView(row({ msTerminalSnippetRemark: undefined })).remark).toBe('')
  })

  it('null / undefined 集合给空数组', () => {
    expect(toSnippetViews(null)).toEqual([])
    expect(toSnippetViews(undefined)).toEqual([])
  })
})

describe('filterSnippets', () => {
  const views = toSnippetViews([
    row({ id: 1, msTerminalSnippetName: '重启 Nginx', msTerminalSnippetContent: 'systemctl restart nginx', msTerminalSnippetRemark: '发版后' }),
    row({ id: 2, msTerminalSnippetName: '看磁盘', msTerminalSnippetContent: 'df -h', msTerminalSnippetRemark: '' }),
    row({ id: 3, msTerminalSnippetName: '清理日志', msTerminalSnippetContent: 'truncate -s 0 /var/log/syslog', msTerminalSnippetRemark: '每周' }),
  ])

  it('空关键字不筛（返回全量副本）', () => {
    expect(filterSnippets(views, '')).toHaveLength(3)
    expect(filterSnippets(views, '   ')).toHaveLength(3)
  })

  it('能只靠正文搜到 —— 用户常常不记得自己起的名字', () => {
    expect(filterSnippets(views, 'systemctl').map(v => v.id)).toEqual([1])
    expect(filterSnippets(views, 'truncate').map(v => v.id)).toEqual([3])
  })

  it('名称与备注也参与匹配', () => {
    expect(filterSnippets(views, '磁盘').map(v => v.id)).toEqual([2])
    expect(filterSnippets(views, '每周').map(v => v.id)).toEqual([3])
  })

  it('大小写不敏感', () => {
    expect(filterSnippets(views, 'NGINX').map(v => v.id)).toEqual([1])
  })

  it('无命中给空数组', () => {
    expect(filterSnippets(views, '不存在的东西')).toEqual([])
  })
})

describe('snippetStats', () => {
  it('总数 / 有正文 / 无正文', () => {
    const stats = snippetStats(
      toSnippetViews([row({ id: 1 }), row({ id: 2, msTerminalSnippetContent: '' }), row({ id: 3 })]),
    )
    expect(stats.total).toBe(3)
    expect(stats.withContent).toBe(2)
    expect(stats.empty).toBe(1)
  })

  it('平均行数保留一位小数', () => {
    const stats = snippetStats(
      toSnippetViews([
        row({ id: 1, msTerminalSnippetContent: 'a' }),
        row({ id: 2, msTerminalSnippetContent: 'a\nb' }),
      ]),
    )
    expect(stats.avgLines).toBe(1.5)
  })

  it('最长片段', () => {
    const stats = snippetStats(
      toSnippetViews([
        row({ id: 1, msTerminalSnippetContent: 'a' }),
        row({ id: 2, msTerminalSnippetContent: 'a\nb\nc\nd' }),
      ]),
    )
    expect(stats.maxLines).toBe(4)
  })

  it('空集合全为 0（不让画布除以 NaN）', () => {
    expect(snippetStats([])).toEqual({ total: 0, withContent: 0, empty: 0, avgLines: 0, maxLines: 0 })
  })
})

describe('lineBuckets', () => {
  it('按 1 / 2–3 / 4–10 / >10 分档', () => {
    const buckets = lineBuckets(
      toSnippetViews([
        row({ id: 1, msTerminalSnippetContent: 'a' }),
        row({ id: 2, msTerminalSnippetContent: 'a' }),
        row({ id: 3, msTerminalSnippetContent: 'a\nb' }),
        row({ id: 4, msTerminalSnippetContent: 'a\nb\nc' }),
        row({ id: 5, msTerminalSnippetContent: 'a\nb\nc\nd' }),
        row({ id: 6, msTerminalSnippetContent: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10' }),
        row({ id: 7, msTerminalSnippetContent: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11' }),
      ]),
    )
    expect(buckets.map(b => b.count)).toEqual([2, 2, 2, 1])
  })

  it('边界：3 行仍在第二档，4 行进第三档', () => {
    expect(lineBuckets(toSnippetViews([row({ msTerminalSnippetContent: 'a\nb\nc' })]))[1]!.count).toBe(1)
    expect(lineBuckets(toSnippetViews([row({ msTerminalSnippetContent: 'a\nb\nc\nd' })]))[2]!.count).toBe(1)
  })

  it('空内容的片段不进任何档（否则「1 行」档会把空片段也算成一行命令）', () => {
    const buckets = lineBuckets(toSnippetViews([row({ msTerminalSnippetContent: '' })]))
    expect(buckets.reduce((n, b) => n + b.count, 0)).toBe(0)
  })

  it('桶标签固定四项，空集合也给得出坐标轴', () => {
    expect(lineBuckets([])).toHaveLength(4)
  })
})
