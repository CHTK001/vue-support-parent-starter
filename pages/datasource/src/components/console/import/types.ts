/**
 * 导入向导的共享类型。
 *
 * <p>步骤体组件只认这些结构，不认识后端 DTO —— 换接口时改动落在
 * {@code useImportWizard} 里，模板层不用跟着动。</p>
 */

/** 导入类型：只保留 CSV 与 Excel 两类 */
export type ImportKind = "csv" | "excel";

/** 外壳形态：弹窗态（横向步骤条）与页面态（竖向步骤轨）共用同一套步骤体 */
export type WizardVariant = "dialog" | "page";

/** 步骤定义 */
export interface ImportStepDef {
  /** 步骤标题 */
  title: string;
  /** 未走到这一步时的说明 */
  desc: string;
}

/** 第 4 步的一行：一张源表（CSV 文件 / Excel 工作表）→ 一张目标表 */
export interface ImportTargetRow {
  /** 源名称（工作表名或文件名） */
  source: string;
  /** Excel 工作表名；CSV 为空串 */
  sheet: string;
  /** 目标表名 */
  targetTable: string;
  /** 是否新建表 */
  createTable: boolean;
}

/** 第 5 步的一行映射 */
export interface ImportMappingRow {
  /** 源列名 */
  source: string;
  /** 目标列名，空串表示不导入 */
  target: string;
  /** 是否作为匹配键 */
  key: boolean;
}

/** 执行日志的一行 */
export interface ImportLogLine {
  /** 时分秒 */
  at: string;
  /** 文本 */
  text: string;
  /** 语气：ok / warn / error / info */
  tone: string;
}

/** 第 7 步的运行统计 */
export interface ImportRunState {
  done: number;
  total: number;
  /** 之前已完成表（多工作表串行时）的累计行数 */
  baseDone: number;
  /** 之前已完成表的累计总数 */
  baseTotal: number;
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: number;
  elapsedMs: number;
  finished: boolean;
  failed: boolean;
  /** 失败原因（首条 error 事件的消息），底部条直接展示，不用翻日志 */
  errorText: string;
}
