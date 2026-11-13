/**
 * 复制表任务坞的类型。
 *
 * <p>单独放一个文件：{@code <script setup>} 里不允许出现 ES 模块导出语句，
 * 接口写在组件里会直接编译失败（"cannot contain ES module exports"）——
 * 与 {@code ReProgressDialog/types.ts} 同一口径。</p>
 */

/** 最近任务（任务坞里用得到的字段） */
export interface CopyHistoryItem {
  /** 任务 id */
  taskId: string;
  /** 形如 `src.t → dst.t` */
  subtitle?: string;
  /** RUNNING / SUCCESS / FAILED / CANCELLED / UNKNOWN */
  status: string;
  /** 结论文案 */
  message?: string;
  /** 是否已结束 */
  finished: boolean;
}
