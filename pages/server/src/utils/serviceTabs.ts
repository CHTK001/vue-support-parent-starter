/**
 * 服务页页签与搜索区的配置映射。
 *
 * <p>抽成纯函数的原因：页签计数和「点进去的行数」必须一致。这类一致性错误
 * 靠肉眼看界面看不出（计数显示 3，点开只有 1 行，用户只会以为列表有 bug），
 * 但用函数钉死就能在单测里直接覆盖。</p>
 */

import type { ReTabItem } from '@repo/ui/components/ReTab/index';
import type { NodeStats } from './nodeList';
// ServerNodeView 的真实声明在 api/serviceManage.ts，nodeList.ts 只是转引进来做内部类型标注，
// 并未再导出；从 nodeList 取它会让 tsc 报 TS2459。这里直接依赖真正的声明处。
import type { ServerNodeView } from '../api/serviceManage';
import { matchStatusSlot } from './nodeList';

/** 状态页签档位：空串代表「全部」 */
export type StatusSlot = '' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN';

/** 搜索区字段 key */
export const SEARCH_KEYWORD = 'keyword';
/** 搜索区协议字段 key */
export const SEARCH_PROTOCOL = 'protocol';

/** 搜索区绑定值 */
export interface ServiceSearchModel {
  keyword: string;
  protocol: string;
}

/** 搜索区空值：重置时回填它，而不是留一堆 undefined 让 v-model 变半受控 */
export function emptySearchModel(): ServiceSearchModel {
  return { keyword: '', protocol: '' };
}

/**
 * 统计某个状态档的节点数。
 *
 * @param nodes 全量节点
 * @param slot  状态档
 * @return 命中数量
 */
export function countBySlot(
  nodes: readonly ServerNodeView[] | null | undefined,
  slot: StatusSlot,
): number {
  if (!Array.isArray(nodes)) return 0;
  if (!slot) return nodes.length;
  return nodes.filter(n => matchStatusSlot(n, slot)).length;
}

/**
 * 构造状态页签。
 *
 * <p>「未知」档只在真的有未知状态节点时才出现：常态下它是 0，
 * 摆一个恒为 0 的页签只会让人以为有东西坏了。</p>
 *
 * @param nodes 全量节点
 * @param stats 统计结果（与页签计数共用，保证口径一致）
 * @return ReTab 的 tabs 配置
 */
export function buildStatusTabs(
  nodes: readonly ServerNodeView[] | null | undefined,
  stats: NodeStats,
): ReTabItem[] {
  const all = Array.isArray(nodes) ? nodes.length : 0;
  const tabs: ReTabItem[] = [
    { name: '', label: '全部', icon: 'Grid', badge: all || null },
    { name: 'RUNNING', label: '运行中', icon: 'CircleCheck', badge: stats.running || null },
    { name: 'STOPPED', label: '已停止', icon: 'VideoPause', badge: stats.stopped || null },
    { name: 'ERROR', label: '异常', icon: 'Warning', badge: stats.error || null },
  ];
  if (stats.unknown > 0) {
    tabs.push({ name: 'UNKNOWN', label: '未知', icon: 'QuestionFilled', badge: stats.unknown });
  }
  return tabs;
}

/**
 * 判断搜索条件是否生效。
 *
 * <p>空状态引导只在「列表真空」时展示；用户带着条件筛出 0 行是另一回事，
 * 此时铺一个「暂无服务」并引导去新建，等于告诉用户数据没了。</p>
 *
 * @param model 搜索区绑定值
 * @return 是否带了条件
 */
export function hasSearchCondition(model: ServiceSearchModel | null | undefined): boolean {
  if (!model) return false;
  return Boolean((model.keyword ?? '').trim() || (model.protocol ?? '').trim());
}

/** 搜索区字段配置（与 ReSearch 的 SearchFilter 子集对齐） */
export interface ServiceSearchField {
  key: string;
  label: string;
  type: 'input' | 'select';
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
}

/**
 * 构造 ReSearch 的 filters 配置。
 *
 * <p>协议下拉的选项由调用方传入：它来自后端元数据 + SPI 动态发现，
 * 这里不重复实现，避免元数据加载失败时选项来源分叉。</p>
 *
 * @param protocolOptions 协议选项
 * @return 搜索区字段配置
 */
export function buildSearchFields(
  protocolOptions: ReadonlyArray<{ label: string; value: string }>,
): ServiceSearchField[] {
  return [
    {
      key: SEARCH_KEYWORD,
      label: '关键字',
      type: 'input',
      placeholder: '名称 / 协议 / 监听地址',
    },
    {
      key: SEARCH_PROTOCOL,
      label: '协议',
      type: 'select',
      placeholder: '全部协议',
      options: protocolOptions.map(o => ({ label: o.label, value: o.value })),
    },
  ];
}
