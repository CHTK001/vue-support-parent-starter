// ======================== 流程定义（WfDef） ========================

export interface WfDef {
  wfDefId?: number;
  wfDefName: string;
  wfDefCode: string;
  wfDefCategory?: string;
  wfDefVersion?: number;
  wfDefStatus?: number; // 0=草稿 1=已发布 2=已禁用
  wfDefFormConfig?: string;
  wfDefRemark?: string;
  createTime?: string;
  createName?: string;
}

export interface WfDefNode {
  wfDefNodeId?: number;
  wfDefId?: number;
  nodeName: string;
  nodeType: WorkflowNodeType;
  nodeConfig?: string;
  assigneeType?: string;
  assigneeValue?: string;
  nodeSort?: number;
  /** 前端辅助：临时位置 (不持久化) */
  _position?: { x: number; y: number };
}

export interface WfDefEdge {
  wfDefEdgeId?: number;
  wfDefId?: number;
  edgeName?: string;
  sourceNodeId: number;
  targetNodeId: number;
  edgeCondition?: string;
}

export interface WfDefVO extends WfDef {
  nodes: WfDefNode[];
  edges: WfDefEdge[];
}

// ======================== 流程实例（WfInst） ========================

export type InstStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export interface WfInst {
  wfInstId?: number;
  wfDefId: number;
  businessType?: string;
  businessId?: string;
  instTitle: string;
  formData?: string;
  starterId?: number;
  deptId?: number;
  instStatus?: InstStatus;
  idempotentKey?: string;
  currentNodeId?: number;
  finishTime?: string;
  createTime?: string;
  createName?: string;
  wfDefName?: string; // 联表查询
}

// ======================== 任务（WfTask） ========================

export type TaskStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "TRANSFERRED" | "CANCELLED";

export interface WfTask {
  wfTaskId?: number;
  wfInstId: number;
  wfDefNodeId?: number;
  nodeName?: string;
  assigneeId: number;
  assigneeName?: string;
  taskStatus: TaskStatus;
  comment?: string;
  attachment?: string;
  deadline?: string;
  formData?: string;
  sort?: number;
  createTime?: string;
}

// ======================== 历史（WfTaskHistory） ========================

export type HistoryOperation = "SUBMIT" | "APPROVE" | "REJECT" | "RETURN" | "WITHDRAW" | "TRANSFER";

export interface WfTaskHistory {
  wfTaskHistoryId?: number;
  wfInstId: number;
  wfTaskId?: number;
  operatorId: number;
  operatorName?: string;
  operation: HistoryOperation;
  comment?: string;
  durationSeconds?: number;
  createTime?: string;
}

// ======================== 实例视图（WfInstVO） ========================

export interface WfInstVO extends WfInst {
  wfDefName?: string;
  currentTasks: WfTask[];
  tasks: WfTask[];
  histories: WfTaskHistory[];
}

// ======================== 请求 DTO ========================

export interface WfInstCreateRequest {
  wfDefId: number;
  businessType?: string;
  businessId?: string;
  instTitle: string;
  formData?: Record<string, any>;
  idempotentKey?: string;
}

export interface WfTaskProcessRequest {
  wfTaskId: number;
  comment?: string;
  formData?: Record<string, any>;
  transferUserId?: number;
  transferUserName?: string;
}

// ======================== 节点类型 ========================

export type WorkflowNodeType = "START" | "END" | "APPROVAL" | "CC" | "CONDITION";

export const NODE_TYPE_CONFIG: Record<WorkflowNodeType, { label: string; icon: string; color: string }> = {
  START: { label: "开始", icon: "ri:play-circle-line", color: "#10b981" },
  END: { label: "结束", icon: "ri:stop-circle-line", color: "#f59e0b" },
  APPROVAL: { label: "审批", icon: "ri:user-check-line", color: "#6366f1" },
  CC: { label: "抄送", icon: "ri:mail-send-line", color: "#14b8a6" },
  CONDITION: { label: "条件", icon: "ri:git-branch-line", color: "#8b5cf6" },
};

// ======================== 分配策略选项 ========================

export interface AssigneeTypeOption {
  value: string;
  label: string;
  placeholder: string;
}

export const ASSIGNEE_TYPE_OPTIONS: AssigneeTypeOption[] = [
  { value: "USER", label: "指定人员", placeholder: "格式: userId:userName" },
  { value: "ROLE", label: "指定角色", placeholder: "输入角色ID或角色编码" },
  { value: "DEPT", label: "指定部门", placeholder: "输入部门ID" },
  { value: "DEPT_HEAD", label: "部门负责人", placeholder: "层级(默认1)" },
  { value: "APPLICANT", label: "发起人自己", placeholder: "无需填写" },
];
