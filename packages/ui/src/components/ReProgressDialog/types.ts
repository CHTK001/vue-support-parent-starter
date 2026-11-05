/**
 * ReProgressDialog 的类型定义
 *
 * <p>单独放一个文件：{@code <script setup>} 里不允许出现 ES 模块导出语句，
 * 接口写在组件里会直接编译失败（"cannot contain ES module exports"）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */

/**
 * 单步骤（字段与后端 TenantProvisionTask.Step 对齐）
 */
export interface ProgressStep {
  /** 步骤键 */
  key: string;
  /** 标题 */
  title: string;
  /** 步骤说明（这一步要做什么） */
  description?: string;
  /** 状态：WAIT / RUNNING / SUCCESS / SKIPPED / ERROR / CANCELLED */
  status?: string;
  /** 状态中文标签 */
  statusLabel?: string;
  /** 结果补充（错误原因、跳过原因等） */
  detail?: string | null;
}

/**
 * 任务快照（字段与后端 TenantProvisionTask.toMap() 对齐）
 */
export interface ProgressSnapshot {
  /** 任务标识 */
  taskId?: string;
  /** 租户标识 */
  tenantId?: string;
  /** 租户名称（弹窗副标题用） */
  tenantName?: string;
  /** 租户账号（弹窗副标题用） */
  tenantUsername?: string;
  /** 任务状态：RUNNING / SUCCESS / FAILED / CANCELLED */
  status?: string;
  /** 进度百分比 0-100 */
  percentage?: number;
  /** 当前步骤键 */
  currentKey?: string;
  /** 当前步骤标题 */
  currentTitle?: string;
  /** 当前步骤描述（进度条下面那一行） */
  currentDescription?: string;
  /** 最终结论 */
  message?: string;
  /** 是否可取消（后端声明） */
  cancellable?: boolean;
  /** 是否已结束 */
  finished?: boolean;
  /** 全部步骤 */
  steps?: ProgressStep[];
  /** 全部描述流水 */
  details?: string[];
}
