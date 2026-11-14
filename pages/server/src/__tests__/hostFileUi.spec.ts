/**
 * 主机文件页（发布管理 → 主机文件）纯逻辑单测。
 *
 * <p>这些函数错起来都是「不报错只是说错话」：面包屑拼错会点进隔壁目录、
 * 大小换算错会把 5MB 显示成 5KB、类型判定错会把 jar 当压缩包。所以单独钉住。</p>
 */
import { describe, expect, it } from 'vitest'
import {
  KIND_OPTIONS,
  absoluteOf,
  badgeOf,
  breadcrumbOf,
  formatDateTime,
  formatSize,
  kindIcon,
  kindLabel,
  kindTone,
  parentKey,
  relativeTime,
  sizePercent,
} from '../utils/hostFileUi'

describe('breadcrumbOf', () => {
  it('根目录只有一段', () => {
    expect(breadcrumbOf('')).toEqual([{ label: '存储根', key: '' }])
  })

  it('多级目录每段都可点，key 是累积路径', () => {
    expect(breadcrumbOf('uploads/release/4.0.0.62')).toEqual([
      { label: '存储根', key: '' },
      { label: 'uploads', key: 'uploads' },
      { label: 'release', key: 'uploads/release' },
      { label: '4.0.0.62', key: 'uploads/release/4.0.0.62' },
    ])
  })

  it('忽略首尾多余分隔符', () => {
    expect(breadcrumbOf('/a/b/').map(it => it.key)).toEqual(['', 'a', 'a/b'])
  })
})

describe('parentKey', () => {
  it('顶层条目的父亲是根', () => {
    expect(parentKey('app.jar')).toBe('')
  })

  it('多级目录去掉最后一段', () => {
    expect(parentKey('uploads/release/app.jar')).toBe('uploads/release')
  })

  it('容忍结尾分隔符（目录搬走后残留）', () => {
    expect(parentKey('uploads/release/')).toBe('uploads')
  })
})

describe('formatSize', () => {
  it('零与空值都是 0 B', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(undefined)).toBe('0 B')
    expect(formatSize(null)).toBe('0 B')
  })

  it('按 1024 进制换算', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(2048)).toBe('2.0 KB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('非法数值不产出 NaN', () => {
    expect(formatSize(Number.NaN)).toBe('0 B')
  })
})

describe('badgeOf', () => {
  it('目录恒为 DIR', () => {
    expect(badgeOf({ directory: true, ext: 'jar', name: 'lib' })).toBe('DIR')
  })

  it('文件取大写扩展名', () => {
    expect(badgeOf({ directory: false, ext: 'tar', name: 'a.tar' })).toBe('TAR')
  })

  it('过长的扩展名截到 4 位', () => {
    expect(badgeOf({ directory: false, ext: 'properties', name: 'a.properties' })).toBe('PROP')
  })

  it('无扩展名回退 FILE', () => {
    expect(badgeOf({ directory: false, ext: '', name: 'README' })).toBe('FILE')
  })
})

describe('类型映射', () => {
  it('每个类型都有中文名、图标、CSS 后缀', () => {
    for (const kind of KIND_OPTIONS) {
      expect(kindLabel(kind.value)).toBe(kind.label)
      expect(kindIcon(kind.value)).toBe(kind.icon)
      expect(kindTone(kind.value)).toBe(kind.value)
    }
  })

  it('未知类型收敛到「文件 / Document / other」，不返回 undefined', () => {
    expect(kindLabel('weird')).toBe('文件')
    expect(kindIcon('weird')).toBe('Document')
    expect(kindTone('weird')).toBe('other')
  })
})

describe('absoluteOf', () => {
  it('拼接存储根与 key', () => {
    expect(absoluteOf('/data/storage', 'uploads/app.jar')).toBe('/data/storage/uploads/app.jar')
  })

  it('根带尾部分隔符不产生双斜杠', () => {
    expect(absoluteOf('/data/storage/', 'a.jar')).toBe('/data/storage/a.jar')
  })

  it('Windows 根沿用反斜杠', () => {
    expect(absoluteOf('D:\\storage', 'a/b.jar')).toBe('D:\\storage\\a\\b.jar')
  })

  it('根为空时退回 key（非本地存储）', () => {
    expect(absoluteOf('', 'a/b.jar')).toBe('a/b.jar')
  })
})

describe('sizePercent', () => {
  it('按目录内最大值归一', () => {
    expect(sizePercent(50, 100)).toBe(50)
    expect(sizePercent(100, 100)).toBe(100)
  })

  it('非零文件至少 2%，否则进度条看起来是空的', () => {
    expect(sizePercent(1, 1000)).toBe(2)
  })

  it('零与大值都收敛到边界', () => {
    expect(sizePercent(0, 100)).toBe(0)
    expect(sizePercent(500, 0)).toBe(0)
    expect(sizePercent(200, 100)).toBe(100)
  })
})

describe('时间展示', () => {
  const base = new Date('2026-11-13T10:20:00').getTime()

  it('formatDateTime 补零', () => {
    expect(formatDateTime(new Date('2026-01-02T03:04:00').getTime())).toBe('2026-01-02 03:04')
  })

  it('formatDateTime 无值给破折号', () => {
    expect(formatDateTime(0)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('relativeTime 一小时以内说分钟', () => {
    expect(relativeTime(base - 5 * 60 * 1000, base)).toBe('5 分钟前')
  })

  it('relativeTime 一天以内说小时', () => {
    expect(relativeTime(base - 3 * 3600 * 1000, base)).toBe('3 小时前')
  })

  it('relativeTime 超过一天退回具体时间', () => {
    expect(relativeTime(base - 3 * 24 * 3600 * 1000, base)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('未来时间不出现负数（时钟漂移）', () => {
    expect(relativeTime(base + 60 * 1000, base)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
