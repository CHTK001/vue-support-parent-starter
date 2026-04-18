/**
 * 通用任务步骤模型。
 */
export interface TaskDialogStep {
  stepKey: string;
  title: string;
  status: string;
  message: string;
  updatedAt?: number;
}

/**
 * 通用任务摘要项。
 */
export interface TaskDialogSummaryItem {
  label: string;
  value: string;
}

/**
 * 通用任务弹框模型。
 */
export interface TaskDialogModel {
  taskId: string;
  status: string;
  message?: string;
  serverIds?: Array<number | string>;
  imageName?: string;
  imageTag?: string;
  summaryItems?: TaskDialogSummaryItem[];
  /**
   * 错误摘要（失败任务展示）。
   */
  errorSummary?: string;
  /**
   * 实时日志行（用于复制/排查）。
   */
  logs?: string[];
  /**
   * 是否展示重试入口。
   */
  retryable?: boolean;
  /**
   * 重试按钮文案。
   */
  retryLabel?: string;
  createdAt?: number;
  updatedAt?: number;
  steps?: TaskDialogStep[];
}
