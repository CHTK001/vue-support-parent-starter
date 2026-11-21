/**
 * 模型配置状态工具：从「全局默认 + 本人覆盖」合并视图里判定字段是否真配置。
 *
 * <p>口径（与后端一致）：origin === 'SYSTEM_DEFAULT' 一律视为未配置，
 * 即使 value 是种子默认值（如 scrfd-face-detector / arc-face）。fail-closed。</p>
 */

/** 合并视图单条字段（后端 /settings/{group}/merged 返回的 items） */
export interface MergedSettingItem {
  field: string
  value: string
  defaultValue: string
  overridden: boolean
  origin: string
  valueType: string
  description: string
  sort: number
  configuredBy: string | null
  /**
   * 模型字段的存在性状态（后端 ModelCatalogChecker 校验）。
   * false = 配置值指向的模型已不在目录中（被删/停用/改名），仅为展示保留。
   */
  modelExists?: boolean
}

/** 合并视图容器：Map 或普通对象（store 暴露的是对象，页面按字段取用） */
export type MergedMapLike = Map<string, MergedSettingItem> | Record<string, MergedSettingItem>

export function getItem(map: MergedMapLike | null | undefined, field: string): MergedSettingItem | undefined {
  if (!map) return undefined
  if (map instanceof Map) return map.get(field)
  return (map as Record<string, MergedSettingItem>)[field]
}

/** 合并视图数组 → field → item 的 Map，供 store 内部按字段取真实配置值 */
export function toMergedMap(items: MergedSettingItem[] | null | undefined): Map<string, MergedSettingItem> {
  const map = new Map<string, MergedSettingItem>()
  for (const it of items || []) {
    if (it && typeof it.field === 'string') map.set(it.field, it)
  }
  return map
}

/** 该字段是否被当前用户真实配置（origin 非 SYSTEM_DEFAULT 且 value 非空且模型仍存在） */
export function isFieldConfigured(map: MergedMapLike | null | undefined, field: string): boolean {
  const it = getItem(map, field)
  if (!it) return false
  if (String(it.origin) === 'SYSTEM_DEFAULT') return false
  if (String(it.value ?? '').length === 0) return false
  // 指向的模型已不存在（被删/停用/改名）不算配置：门禁 fail-closed，页面加删除线提示
  if (it.modelExists === false) return false
  return true
}

/** 取已配置值；未配置返回空串（页面显示「未配置」而不是种子模型名） */
export function configuredValue(map: MergedMapLike | null | undefined, field: string): string {
  return isFieldConfigured(map, field) ? String(getItem(map, field)!.value) : ''
}
