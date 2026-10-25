/**
 * 页面方向组合式函数 —— 把 {@link variant.ts} 的纯逻辑接到 Vue 上。
 *
 * <p>职责边界：本文件只做「响应式包装 + 读写时机 + 生命周期清理」，
 * 任何判定（收敛、兜底、过滤）都留在纯函数里，便于单测。</p>
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import {
  normalizeVariant,
  readVariant,
  shouldShowDock,
  variantItems,
  writeVariant,
  type PageVariantId,
  type PageVariantMeta,
} from './variant'

/** 组合式函数入参 */
export interface UsePageVariantOptions {
  /** 页面标识，用于区分各自的记忆（如 `server.session-audit`） */
  pageKey: string
  /** 该页开放的方向；不传表示五个全开 */
  allowed?: readonly PageVariantId[]
  /** 是否挂快捷键（[ / ] 前后切换）。默认挂 */
  hotkeys?: boolean
}

/** 组合式函数出参 */
export interface UsePageVariantResult {
  /** 当前方向（可写，写入即持久化） */
  variant: Ref<PageVariantId>
  /** 切换器要显示的项 */
  items: ComputedRef<PageVariantMeta[]>
  /** 是否显示方向坞 */
  dockVisible: Ref<boolean>
  /** 设置方向；非法值会被收敛，因此模板里不必再判 */
  setVariant: (next: unknown) => void
}

/**
 * 页面方向状态。
 *
 * @param options 入参
 */
export function usePageVariant(options: UsePageVariantOptions): UsePageVariantResult {
  const { pageKey, allowed, hotkeys = true } = options
  const storage = typeof window !== 'undefined' ? window.localStorage : null

  const variant = ref<PageVariantId>(readVariant(pageKey, allowed, storage))
  const items = computed(() => variantItems(allowed))
  const dockVisible = ref(false)

  /**
   * 写入口统一走 normalizeVariant：方向坞、快捷键、控制台调试三条路径
   * 都会把「不在开放集里的值」收敛掉，不会出现渲染了一个不存在的方向。
   */
  function setVariant(next: unknown): void {
    variant.value = normalizeVariant(next, allowed)
  }

  watch(variant, value => writeVariant(pageKey, value, storage))

  /**
   * 快捷键：[ / ] 前后切换。输入框内与带修饰键时不抢。
   *
   * <p>只在坞可见时生效——生产环境不给用户改不了的东西留后门。</p>
   */
  function onKeydown(e: KeyboardEvent): void {
    if (!dockVisible.value) return
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const list = items.value.map(v => v.id)
    if (list.length < 2) return
    const current = list.indexOf(variant.value)
    const step = e.key === '[' ? -1 : e.key === ']' ? 1 : 0
    if (!step) return
    e.preventDefault()
    const next = list[(current + step + list.length) % list.length]!
    setVariant(next)
  }

  onMounted(() => {
    dockVisible.value = shouldShowDock(
      Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV),
      typeof window !== 'undefined' ? window.location.search : '',
    )
    if (hotkeys) window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    if (hotkeys) window.removeEventListener('keydown', onKeydown)
  })

  return { variant, items, dockVisible, setVariant }
}
