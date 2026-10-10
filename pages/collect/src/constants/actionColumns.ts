/**
 * 采集管理「操作列」全局配置（唯一来源）。
 *
 * 背景：函数库 / 变量管理 / 执行通知 / 运行记录 / 采集结果 / 采集流程六个列表的操作列
 * 此前各自在模板里硬编码图标、语义色与提示语，同一个动作在三处写法不一致，
 * 改一处要记得改六处。这里把「动作长什么样」收敛为唯一来源：
 * 视图只声明要用哪个动作并按需补自己的回调，图标 / 颜色 / 提示语一律从本表取。
 *
 * 边界：本模块只承载可共享的**展示元数据**，不持有回调。
 * 动作回调是各视图私有（要拿 row、要弹自家弹窗），留在视图里最自然；
 * 硬塞进来会把配置表变成隐式依赖视图的上帝对象。
 *
 * 用法：
 *   import { COLLECT_ACTIONS } from "../constants/actionColumns";
 *   <ReButton v-bind="COLLECT_ACTIONS.editFunction" layout="square" @click="openEdit(row)" />
 */

/**
 * 操作列动作的可共享展示元数据。
 */
export interface CollectActionMeta {
  /** ReIcon 图标名 */
  icon: string;
  /** ReButton 语义色；不传表示用默认色 */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 提示语。square 布局下同时充当 tooltip 与 aria-label */
  tip: string;
}

/**
 * 采集侧全部操作列动作的键。
 */
export type CollectActionKey =
  | "replay"
  | "records"
  | "logs"
  | "deleteRun"
  | "viewResult"
  | "deleteRecord"
  | "editFunction"
  | "testFunction"
  | "deleteFunction"
  | "editVariable"
  | "deleteVariable"
  | "editNotice"
  | "testNotice"
  | "deleteNotice"
  | "designFlow"
  | "editFlow"
  | "previewFlow"
  | "runFlow"
  | "flowRuns"
  | "flowRecords"
  | "flowMore";

/**
 * 全局操作列登记表。
 *
 * 新增动作只加在这里；视图里再写死 icon / type / tip 视为违规。
 */
export const COLLECT_ACTIONS: Record<CollectActionKey, CollectActionMeta> = {
  // 运行记录（TaskView）
  replay: { icon: "VideoPlay", type: "primary", tip: "回放这次运行（只看动画，不重跑）" },
  records: { icon: "Files", tip: "看这次运行产出的采集结果" },
  logs: { icon: "Tickets", tip: "看这次运行的节点日志" },
  deleteRun: { icon: "Delete", type: "danger", tip: "删除这条运行记录及其节点日志" },

  // 采集结果（RecordView）
  viewResult: { icon: "View", type: "primary", tip: "查看这条结果的字段" },
  deleteRecord: { icon: "Delete", type: "danger", tip: "删除这条结果" },

  // 函数库（FunctionView）
  editFunction: { icon: "Edit", type: "primary", tip: "编辑这个函数" },
  testFunction: { icon: "VideoPlay", type: "warning", tip: "试跑这个函数" },
  deleteFunction: { icon: "Delete", type: "danger", tip: "删除这个函数" },

  // 变量管理（VariableView）
  editVariable: { icon: "Edit", type: "primary", tip: "编辑这个变量" },
  deleteVariable: { icon: "Delete", type: "danger", tip: "删除这个变量" },

  // 执行通知（NoticeView）
  editNotice: { icon: "Edit", type: "primary", tip: "编辑这条通知配置" },
  testNotice: {
    icon: "Promotion",
    type: "warning",
    tip: "按这条配置试发一次（试运行不发通知，只能用这里验证渠道）",
  },
  deleteNotice: { icon: "Delete", type: "danger", tip: "删除这条通知配置" },

  // 采集流程（CollectorView）
  designFlow: { icon: "Share", type: "primary", tip: "流程设计（画布：节点 / 连线 / 参数）" },
  editFlow: { icon: "Edit", type: "primary", tip: "编辑采集器属性（名称 / 分类 / 调度等）" },
  previewFlow: { icon: "Grid", type: "primary", tip: "预览图" },
  runFlow: { icon: "VideoPlay", type: "success", tip: "运行" },
  flowRuns: { icon: "Timer", tip: "运行记录" },
  flowRecords: { icon: "Files", tip: "采集结果" },
  flowMore: { icon: "MoreFilled", tip: "更多操作" },
};
