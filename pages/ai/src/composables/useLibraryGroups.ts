import { computed, ref } from 'vue'

import { apiService } from '@/services/ApiService'

/**
 * 底库分组选择器状态（人脸底库 / 重识别库 / 以图搜图底库共用）。
 *
 * <p><b>为什么要有分组。</b>分组是**第一层隔离**：每个分组一套独立 vector，
 * 登记、检索、删除、取图都必须带上分组。不带分组时后端一律按 {@code default} 处理
 * （历史行 group 为 NULL，逻辑上归属 default），所以「没选分组」不等于「全部」，
 * 而是「default 那一组」—— 页面必须把当前分组显式亮出来，否则用户会以为看到的是全库。</p>
 *
 * <p><b>为什么抽成 composable。</b>六个入口（人脸识别页 / 人脸底库 / 重识别页 / 重识别库 /
 * 以图搜图页 / 图像底库面板）需要完全相同的三件事：默认 default、选项来自后端 groups 接口、
 * 用户新建的分组要立刻进选项。分散实现必然漂移（某处忘了补 default，或忘了合并
 * 用户刚输入的分组），故收敛到一处。</p>
 *
 * <p><b>单值 vs 多值。</b>两端分工固定：<b>范围/搜索</b>（人脸识别页、重识别页、
 * 以图搜图页）走 {@link groups}，多选组名，后端收逗号分隔；<b>定位/库操作</b>
 * （人脸底库 / 重识别库 / 图像底库面板）走 {@link group}，一次只按压一组。
 * 两处之间用 {@link setGroups} 同步。</p>
 */

/** 后端约定的默认分组名；历史数据（group 为 NULL）也归属它 */
export const DEFAULT_GROUP = 'default'

/**
 * 底库分组选择器。
 *
 * @param kind 底库类型：人脸（/face/groups）、重识别（/reid/groups）或以图搜图（/image-search/groups）
 * @returns 当前分组、去重后的选项、加载与合并方法
 */
export function useLibraryGroups(kind: 'face' | 'reid' | 'image') {
  /** 当前选中的分组（默认 default：与后端「不带分组」的语义一致） */
  const group = ref(DEFAULT_GROUP)
  /** 检索范围：选中的分组集合（后端收逗号分隔，空 = default） */
  const groups = ref<string[]>([DEFAULT_GROUP])
  /** 后端已知存在的分组（不含 default 兜底，展示时现拼） */
  const known = ref<string[]>([])

  /**
   * 下拉选项。
   *
   * <p>三路合并：default 恒在（否则把 default 里的数据"藏"起来了）、后端已有分组、
   * 当前选中值（用户手输的新分组在 loadGroups 回来之前也必须留在选项里，
   * 否则 el-select 会把 value 显示成裸字符串）。</p>
   */
  const groupOptions = computed<string[]>(() => {
    const set = new Set<string>([DEFAULT_GROUP, ...known.value])
    const current = String(group.value ?? '').trim()
    if (current) set.add(current)
    for (const g of groups.value) {
      const v = String(g ?? '').trim()
      if (v) set.add(v)
    }
    return [...set]
  })

  /**
   * 记住一批分组名（去重、去空）。
   *
   * @param names 分组名（可能含 null/空串）
   */
  function rememberGroups(names: Array<string | null | undefined>) {
    const merged = new Set(known.value)
    for (const n of names) {
      const v = String(n ?? '').trim()
      if (v) merged.add(v)
    }
    known.value = [...merged]
  }

  /**
   * 设置检索范围（多选状态）。
   *
   * <p>这是一个规范入口：多选组名的每次改动都走这里，避免各页各写各的。
   * 它同时维护 {@link group}，让单值口径（定位/登记）也有所适从 ——
   * 单组时两者一致，多选时 {@link group} 取第一组。</p>
   *
   * @param names 分组名（单值 / 列表 / 空；空串 / 纯空白一律归到 default）
   */
  function setGroups(names: string | Array<string | null | undefined> | null | undefined = DEFAULT_GROUP) {
    const list = Array.isArray(names)
      ? names
      : typeof names === 'string'
        ? [names]
        : []
    const merged = new Set<string>([DEFAULT_GROUP])
    for (const n of list) {
      const v = String(n ?? '').trim()
      if (v) merged.add(v)
    }
    const selected = [...merged]
    groups.value = selected as string[]
    // 单组时 group 与检索范围一致；多选时 group 记第一组（用于定位 / 单组操作）
    group.value = selected.length > 1 ? (selected.find((g) => g !== DEFAULT_GROUP) || DEFAULT_GROUP) : (selected[0] || DEFAULT_GROUP)
  }

  /**
   * 检索范围的多组归一化（逗号分隔）。
   *
   * <p>与后端 {@code AiLibraryGroups.parse(groups)} 同行：返回形如
   * {@code g1,g2} 的字符串；无有效组名时不传，后端按 default 兜底。绝不含
   * 「查全部」的语义。</p>
   *
   * @returns 逗号分隔的分组名；选中的仅 default 时返回空串（调用方不传参数）
   */
  function joinGroups() {
    const list = [...new Set(groups.value.map((g) => String(g ?? '').trim()).filter(Boolean))]
    return list.length === 1 && list[0] === DEFAULT_GROUP ? '' : list.join(',')
  }

  /**
   * 拉取后端已存在的分组名。
   *
   * <p>读失败**不阻断页面**：分组列表只影响下拉里能选到什么，
   * 至少还有 default 与当前值可用，不该因为一个辅助接口把整页卡死。</p>
   */
  async function loadGroups() {
    try {
      const list =
        kind === 'face' ? await apiService.listFaceGroups()
        : kind === 'reid' ? await apiService.listReidGroups()
        : await apiService.listImageGroups()
      rememberGroups(Array.isArray(list) ? list : [])
    } catch {
      /* 读不到就保持现有选项（default + 当前值） */
    }
  }

  return { group, groups, groupOptions, loadGroups, rememberGroups, setGroups, joinGroups }
}
