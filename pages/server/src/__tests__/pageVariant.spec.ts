import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PAGE_VARIANT,
  PAGE_VARIANTS,
  PAGE_VARIANT_DOCK_PARAM,
  PAGE_VARIANT_STORAGE_PREFIX,
  defaultVariantFor,
  normalizeVariant,
  readVariant,
  shouldShowDock,
  variantItems,
  variantStorageKey,
  writeVariant,
  type PageVariantId,
  type VariantReadStorage,
  type VariantWriteStorage,
} from '@repo/ui/components/RePageKit/variant'

/**
 * 页面方向（PageVariant）纯逻辑单测。
 *
 * 重点不在「正常值能读出来」，而在三条必然发生的降级：
 *   ① localStorage 里存着上一个版本的值，而页面改版收窄了方向；
 *   ② 无痕模式下 getItem / setItem 直接抛；
 *   ③ 生产环境不该出现方向坞。
 * 这三条任何一条走错，用户会看到一个空页面或一个改不动的切换器。
 */

/** 造一个只实现 getItem 的假存储 */
function readStore(value: string | null): VariantReadStorage {
  return { getItem: () => value }
}

/** 造一个会抛异常的读存储（模拟无痕模式 / 安全策略） */
function throwingReadStore(): VariantReadStorage {
  return {
    getItem: () => {
      throw new DOMException('denied', 'SecurityError')
    },
  }
}

describe('variantStorageKey', () => {
  it('按页面标识拼前缀，不同页面互不干扰', () => {
    expect(variantStorageKey('server.session-audit')).toBe(`${PAGE_VARIANT_STORAGE_PREFIX}server.session-audit`)
    expect(variantStorageKey('monitor.tshark-capture')).not.toBe(variantStorageKey('server.session-audit'))
  })

  it('页面标识为空时也返回一个合法的键，不抛', () => {
    expect(variantStorageKey('')).toBe(PAGE_VARIANT_STORAGE_PREFIX)
  })
})

describe('PAGE_VARIANTS 声明完整性', () => {
  it('恰好五个方向，id 唯一', () => {
    expect(PAGE_VARIANTS).toHaveLength(5)
    const ids = PAGE_VARIANTS.map(v => v.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('每个方向都有短名与一句话判断，且短名不超过 4 字（切换器宽度约束）', () => {
    for (const v of PAGE_VARIANTS) {
      expect(v.label.length).toBeGreaterThan(0)
      expect(v.label.length).toBeLessThanOrEqual(4)
      expect(v.thesis.length).toBeGreaterThan(8)
    }
  })

  it('默认方向确实在声明表里', () => {
    expect(PAGE_VARIANTS.some(v => v.id === DEFAULT_PAGE_VARIANT)).toBe(true)
  })
})

describe('defaultVariantFor', () => {
  it('取允许集的第一项，而不是全局默认（页面有自己的首选方向）', () => {
    expect(defaultVariantFor(['wall', 'console'])).toBe('wall')
  })

  it('允许集为空或未传时回落到全局默认', () => {
    expect(defaultVariantFor([])).toBe(DEFAULT_PAGE_VARIANT)
    expect(defaultVariantFor(null)).toBe(DEFAULT_PAGE_VARIANT)
    expect(defaultVariantFor(undefined)).toBe(DEFAULT_PAGE_VARIANT)
  })
})

describe('normalizeVariant', () => {
  it('合法值原样返回', () => {
    expect(normalizeVariant('rhythm')).toBe('rhythm')
  })

  it('已知方向但该页未开放时兜底到该页首选 —— 页面收窄后不会渲染出空画布', () => {
    expect(normalizeVariant('rhythm', ['console', 'instrument'])).toBe('console')
  })

  it('未知字符串兜底', () => {
    expect(normalizeVariant('nope')).toBe(DEFAULT_PAGE_VARIANT)
  })

  it('缺失 / 空串 / 纯空白都兜底', () => {
    expect(normalizeVariant(undefined)).toBe(DEFAULT_PAGE_VARIANT)
    expect(normalizeVariant(null)).toBe(DEFAULT_PAGE_VARIANT)
    expect(normalizeVariant('')).toBe(DEFAULT_PAGE_VARIANT)
    expect(normalizeVariant('   ')).toBe(DEFAULT_PAGE_VARIANT)
  })

  it('非字符串来源（数字 / 对象 / 布尔）一律兜底，不做隐式 toString', () => {
    expect(normalizeVariant(1)).toBe(DEFAULT_PAGE_VARIANT)
    expect(normalizeVariant({ id: 'console' })).toBe(DEFAULT_PAGE_VARIANT)
    expect(normalizeVariant(true)).toBe(DEFAULT_PAGE_VARIANT)
  })

  it('前后空白被裁掉，仍能命中', () => {
    expect(normalizeVariant(' wall ')).toBe('wall')
  })

  it('大小写敏感：Console 不等于 console', () => {
    expect(normalizeVariant('Console')).toBe(DEFAULT_PAGE_VARIANT)
  })
})

describe('readVariant', () => {
  it('无存储时返回该页首选方向', () => {
    expect(readVariant('p', ['dossier', 'console'], null)).toBe('dossier')
  })

  it('读到合法值就用它', () => {
    expect(readVariant('p', undefined, readStore('wall'))).toBe('wall')
  })

  it('读到空（从未选过）时用该页首选', () => {
    expect(readVariant('p', ['instrument'], readStore(null))).toBe('instrument')
  })

  it('读到上一个版本遗留的、该页已不开放的值时兜底', () => {
    expect(readVariant('p', ['console', 'wall'], readStore('rhythm'))).toBe('console')
  })

  it('存储抛异常（无痕 / 安全策略）时不冒泡，返回首选', () => {
    expect(() => readVariant('p', ['wall'], throwingReadStore())).not.toThrow()
    expect(readVariant('p', ['wall'], throwingReadStore())).toBe('wall')
  })
})

describe('writeVariant', () => {
  it('写到该页自己的键上', () => {
    const setItem = vi.fn()
    const store: VariantWriteStorage = { setItem }
    writeVariant('server.acme', 'wall', store)
    expect(setItem).toHaveBeenCalledTimes(1)
    expect(setItem).toHaveBeenCalledWith(variantStorageKey('server.acme'), 'wall')
  })

  it('无存储时静默跳过', () => {
    expect(() => writeVariant('p', 'wall', null)).not.toThrow()
  })

  it('写入抛异常（配额超限）时不打断页面', () => {
    const store: VariantWriteStorage = {
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    }
    expect(() => writeVariant('p', 'wall', store)).not.toThrow()
  })
})

describe('读写往返', () => {
  it('写进去的方向能被读回来，且跨页面隔离', () => {
    const bag = new Map<string, string>()
    const store = {
      getItem: (k: string) => bag.get(k) ?? null,
      setItem: (k: string, v: string) => void bag.set(k, v),
    }

    writeVariant('server.session-audit', 'dossier', store)
    expect(readVariant('server.session-audit', undefined, store)).toBe('dossier')
    // 另一个页面没写过，应当拿自己的首选方向，而不是跟着别人
    expect(readVariant('server.maintenance', ['rhythm', 'console'], store)).toBe('rhythm')
  })
})

describe('variantItems', () => {
  it('不传允许集时给出全部五项，且保持声明顺序', () => {
    const items = variantItems()
    expect(items.map(v => v.id)).toEqual(PAGE_VARIANTS.map(v => v.id))
  })

  it('传允许集时按声明顺序过滤，不受传入顺序影响', () => {
    const items = variantItems(['wall', 'console'])
    expect(items.map(v => v.id)).toEqual(['console', 'wall'])
  })

  it('空数组按「全开」处理，避免页面传 [] 时切换器整个消失', () => {
    expect(variantItems([])).toHaveLength(5)
  })

  it('允许集里的未知项被忽略，不产生空项', () => {
    const items = variantItems(['console', 'nope' as PageVariantId])
    expect(items.map(v => v.id)).toEqual(['console'])
  })
})

describe('shouldShowDock', () => {
  it('开发环境无条件显示', () => {
    expect(shouldShowDock(true, '')).toBe(true)
    expect(shouldShowDock(true, '?ui=0')).toBe(true)
  })

  it('生产环境默认隐藏 —— 坞是探索工具，不是产品功能', () => {
    expect(shouldShowDock(false, '')).toBe(false)
    expect(shouldShowDock(false, '?foo=1')).toBe(false)
    expect(shouldShowDock(false, '?ui=0')).toBe(false)
  })

  it('生产环境带 ?ui=1 或 ?ui=true 时才显示', () => {
    expect(shouldShowDock(false, '?ui=1')).toBe(true)
    expect(shouldShowDock(false, '?ui=true')).toBe(true)
    expect(shouldShowDock(false, '?a=b&ui=1')).toBe(true)
    expect(shouldShowDock(false, `?${PAGE_VARIANT_DOCK_PARAM}=1`)).toBe(true)
  })

  it('query 传入时有没有前导 ? 都能解析', () => {
    expect(shouldShowDock(false, 'ui=1')).toBe(true)
  })

  it('query 为空串 / undefined 时不抛', () => {
    expect(shouldShowDock(false, '')).toBe(false)
    expect(shouldShowDock(false, undefined as unknown as string)).toBe(false)
  })
})
