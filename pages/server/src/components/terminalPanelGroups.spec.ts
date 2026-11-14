/**
 * 终端侧栏「索引簿」分组逻辑单测。
 *
 * <p>分组判定全部在 {@link ./terminalPanelGroups} 纯函数层：片段按名称首字分节、
 * 文件按类型分节。组件只负责渲染与滚动，这里单独锁住分组规则——防止以后
 * 「加个字段顺手改了分节算法」这类回归。</p>
 *
 * <p>运行：pnpm --filter @pages/server test（vitest，jsdom）。</p>
 *
 * @author CH
 * @since 4.0.0.58
 */
import { describe, expect, it } from 'vitest'
import type { SnippetView } from '../views/snippet/snippetView'
import {
  FILE_TYPE_LABEL,
  FILE_TYPE_TONE,
  fileEntryType,
  groupFileEntries,
  groupSnippetViews,
  snippetGroupKey,
} from './terminalPanelGroups'

function makeSnippet(partial: Partial<SnippetView> & { id: number; name: string }): SnippetView {
  return {
    content: '',
    remark: '',
    lines: 0,
    chars: 0,
    firstLine: '',
    empty: true,
    ...partial,
  }
}

describe('snippetGroupKey（片段分组键）', () => {
  it('英文首字母大写归并', () => {
    expect(snippetGroupKey('restart.sh')).toBe('R')
    expect(snippetGroupKey('tail -f')).toBe('T')
  })

  it('中文保留原字', () => {
    expect(snippetGroupKey('重启 nginx')).toBe('重')
    expect(snippetGroupKey('备份数据库')).toBe('备')
  })

  it('空名 / 数字 / 符号统一落 #', () => {
    expect(snippetGroupKey('')).toBe('#')
    expect(snippetGroupKey('   ')).toBe('#')
    expect(snippetGroupKey('12345')).toBe('#')
    expect(snippetGroupKey('--force')).toBe('#')
  })
})

describe('groupSnippetViews（片段分节）', () => {
  it('按首字分组，组间按中文字典序（汉字组在前），组内保持传入顺序', () => {
    const views = [
      makeSnippet({ id: 1, name: 'tail 日志' }),
      makeSnippet({ id: 2, name: '重启 nginx' }),
      makeSnippet({ id: 3, name: '重试脚本' }),
      makeSnippet({ id: 4, name: 'build app' }),
    ]
    const groups = groupSnippetViews(views)
    // localeCompare('zh') 的真实顺序：汉字组在前，拉丁组大小写折叠按字母序（键已归一为大写）
    expect(groups.map(g => g.key)).toEqual(['重', 'B', 'T'])
    // 重 组内保持传入顺序：先「重启 nginx」后「重试脚本」
    expect(groups.find(g => g.key === '重')!.items.map(v => v.id)).toEqual([2, 3])
    expect(groups.find(g => g.key === '重')!.count).toBe(2)
    expect(groups.find(g => g.key === 'T')!.items.map(v => v.id)).toEqual([1])
  })

  it('空列表返回空组', () => {
    expect(groupSnippetViews([])).toEqual([])
  })

  it('组计数正确', () => {
    const groups = groupSnippetViews([
      makeSnippet({ id: 1, name: '备份数据库' }),
      makeSnippet({ id: 2, name: '备份快照' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.count).toBe(2)
  })
})

describe('fileEntryType（文件类型判定）', () => {
  it('目录优先', () => {
    expect(fileEntryType({ name: 'bin', directory: true })).toBe('dir')
  })

  it('脚本：sh/bash/bat/cmd/ps1', () => {
    expect(fileEntryType({ name: 'restart.sh' })).toBe('script')
    expect(fileEntryType({ name: 'deploy.bat' })).toBe('script')
    expect(fileEntryType({ name: 'run.ps1' })).toBe('script')
  })

  it('配置：yml/yaml/json/conf/properties/toml/ini/xml/cnf', () => {
    expect(fileEntryType({ name: 'application.yml' })).toBe('config')
    expect(fileEntryType({ name: 'nginx.conf' })).toBe('config')
    expect(fileEntryType({ name: 'log4j.properties' })).toBe('config')
  })

  it('归档：jar/war/zip/tar/gz/tgz/bz2/7z/rar', () => {
    expect(fileEntryType({ name: 'app.jar' })).toBe('archive')
    expect(fileEntryType({ name: 'backup.tar.gz' })).toBe('archive')
    expect(fileEntryType({ name: 'logs.7z' })).toBe('archive')
  })

  it('日志：.log', () => {
    expect(fileEntryType({ name: 'error.log' })).toBe('log')
  })

  it('其余归 other；扩展名大小写不敏感', () => {
    expect(fileEntryType({ name: 'README.md' })).toBe('other')
    expect(fileEntryType({ name: 'APP.JAR' })).toBe('archive')
    expect(fileEntryType({ name: 'Start.SH' })).toBe('script')
  })
})

describe('groupFileEntries（文件分节）', () => {
  it('按固定顺序：目录 → 脚本 → 配置 → 归档 → 日志 → 其他，空组不出现', () => {
    const groups = groupFileEntries([
      { name: 'app.jar' },
      { name: 'bin', directory: true },
      { name: 'env.sh' },
      { name: 'nginx.conf' },
      { name: 'error.log' },
      { name: 'README.md' },
    ])
    expect(groups.map(g => g.label)).toEqual([
      FILE_TYPE_LABEL.dir,
      FILE_TYPE_LABEL.script,
      FILE_TYPE_LABEL.config,
      FILE_TYPE_LABEL.archive,
      FILE_TYPE_LABEL.log,
      FILE_TYPE_LABEL.other,
    ])
    // 每组带 type 键，供色点/标题查表
    expect(groups.map(g => g.type)).toEqual([
      'dir', 'script', 'config', 'archive', 'log', 'other',
    ])
    expect(groups.find(g => g.type === 'script')!.items.map(x => x.name)).toEqual(['env.sh'])
  })

  it('全部同类型时只出一个组，count 正确', () => {
    const groups = groupFileEntries([
      { name: 'a.sh' },
      { name: 'b.sh', directory: false },
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.type).toBe('script')
    expect(groups[0]!.count).toBe(2)
  })

  it('空列表返回空组', () => {
    expect(groupFileEntries([])).toEqual([])
  })

  it('标题与色点表键一致（防显示文字被当键用）', () => {
    for (const g of groupFileEntries([
      { name: 'bin', directory: true },
      { name: 'x.sh' },
      { name: 'y.json' },
      { name: 'z.jar' },
      { name: 'w.log' },
      { name: 'v.txt' },
    ])) {
      expect(FILE_TYPE_LABEL[g.type!]).toBe(g.label)
      expect(FILE_TYPE_TONE[g.type!]).toBeTruthy()
    }
  })
})