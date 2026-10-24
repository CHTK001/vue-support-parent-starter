/**
 * RePageKit —— 页面方向（页面壳的五个排法）
 *
 * <p>导出三样东西：方向元数据与纯逻辑（{@link variant}）、响应式状态
 * （{@link usePageVariant}）、浮动切换器（{@link RePageVariantDock}）。
 * 共享样式 `re-page-kit.css` 由 Dock 引入，页面只要用了 Dock 就带上了整套
 * `.pk-*` 词汇表。</p>
 *
 * <p>典型用法（页面里）：</p>
 * <pre>
 * const { variant, items, dockVisible, setVariant } = usePageVariant({
 *   pageKey: 'server.session-audit',
 * })
 * </pre>
 * <pre>
 * &lt;RePageVariantDock
 *   v-if="dockVisible"
 *   :items="items"
 *   :model-value="variant"
 *   page-label="会话审计"
 *   @update:model-value="setVariant"
 * /&gt;
 * </pre>
 */
export {
  PAGE_VARIANTS,
  DEFAULT_PAGE_VARIANT,
  PAGE_VARIANT_STORAGE_PREFIX,
  PAGE_VARIANT_DOCK_PARAM,
  variantStorageKey,
  defaultVariantFor,
  normalizeVariant,
  readVariant,
  writeVariant,
  variantItems,
  shouldShowDock,
} from './variant'

export type {
  PageVariantId,
  PageVariantMeta,
  VariantReadStorage,
  VariantWriteStorage,
} from './variant'

export { usePageVariant } from './usePageVariant'
export type { UsePageVariantOptions, UsePageVariantResult } from './usePageVariant'

export { default as RePageVariantDock } from './RePageVariantDock.vue'
