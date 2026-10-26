/**
 * 运维台 —— 共用类型
 *
 * <p>会话审计 / 批量作业 / 片段管理 / 维护计划四页的数据形状不同，但**给界面看的
 * 那一层**是同一件事：一批条目，每条有标题、状态、时间、可展开的键值与操作。
 * 四页各自把后端行映射成 {@link OpsItem}，外壳只认这一种形状。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */

/** 语义色档：落到 CSS 的 --tone */
export type OpsTone = 'ok' | 'warn' | 'bad' | 'info' | 'brand' | 'mute';

/** 一个条目（外壳唯一的输入形状） */
export interface OpsItem {
  /** 唯一键 */
  id: number | string;
  /** 主标题（主机名 / 任务名 / 片段名 / 计划名） */
  title: string;
  /** 次要说明（列表第二行） */
  sub?: string;
  /** 状态色档 */
  tone?: OpsTone;
  /**
   * 泳道条块专用色档。
   *
   * <p>状态色表达「好 / 坏」，泳道色表达「这是哪一类」。会话审计里 89 条全是
   * 已结束，按状态上色整面墙都是灰的，读不出任何信息；按协议上色才看得出
   * 「哪台机器在用 RDP」。不填则退回 {@link tone}。</p>
   */
  blockTone?: OpsTone;
  /** 状态文案（胶囊） */
  statusText?: string;
  /** 行尾附加标签 */
  badge?: string;
  /** 看板列键；不填则进「其它」列 */
  column?: string;
  /** 泳道分组键（通常是主机名） */
  lane?: string;
  /** 区间起点（毫秒）；无区间为 null */
  startMs?: number | null;
  /** 区间终点（毫秒）；进行中可用 now */
  endMs?: number | null;
  /** 起点文本 */
  startText?: string;
  /** 终点文本 */
  endText?: string;
  /** 时长文本 */
  durationText?: string;
  /** 详情键值对 */
  meta?: Array<{ label: string; value: string }>;
  /** 详情里的代码块（命令 / 片段正文） */
  code?: string;
  /** 关键字检索用的原文（名称 + 正文 + 备注等拼接，页面负责拼） */
  searchText?: string;
}

/** 分面栏的一组筛选项 */
export interface OpsFacetGroup {
  /** 筛选项标识（对应页面筛选模型里的键） */
  key: string;
  /** 组标题 */
  label: string;
  /** 选项 */
  options: Array<{ value: string; label: string; count: number; tone?: OpsTone }>;
}

/** 布局档位 */
export type OpsMode = 'deck' | 'lanes' | 'matrix' | 'kanban';

/** 档位元数据 */
export interface OpsModeMeta {
  id: OpsMode;
  label: string;
  /** 一句话说明这个档位把页面当成什么 */
  thesis: string;
}

/** 控制栏里的一个筛选项 */
export interface OpsFilterField {
  /** 键（对应页面筛选模型） */
  key: string;
  /** 输入框或下拉 */
  kind: 'search' | 'select';
  /** 占位文案 */
  placeholder?: string;
  /** 宽度（px） */
  width?: number;
  /** 下拉选项（kind=select 时必填） */
  options?: Array<{ label: string; value: string }>;
}
