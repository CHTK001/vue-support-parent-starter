/**
 * 模板库领域模型
 *
 * 支持多种模板语言（html / vue / jsx / json）与模板类型（单据 / 短信 / 邮件 ...）；
 * 模板以 JSON 描述进行存取，运行时由 vue-plugin-hiprint 的 PrintTemplate 加载、设计与打印。
 *
 * @author CH
 * @since 4.0.0.42
 */

/** 模板语言 */
export type TemplateLanguage = 'html' | 'vue' | 'jsx' | 'json'

/** 模板类型 */
export type TemplateType = 'document' | 'sms' | 'email' | 'label' | 'other'

/** 模板状态 */
export type TemplateStatus = 'draft' | 'online' | 'offline'

/** 模板来源：hiprint（绘制模板）/ message（消息模板）/ paper（组卷模板） */
export type TemplateSource = 'hiprint' | 'message' | 'paper'

/** 模板实体（透传后端） */
export interface TemplateInfo {
  /** 模板 ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板副标题 / 描述 */
  subtitle: string
  /** 模板语言 */
  language: TemplateLanguage
  /** 模板类型 */
  type: TemplateType
  /** 模板状态 */
  status: TemplateStatus
  /** 模板来源：hiprint / message / paper */
  source: TemplateSource
  /** 来源行 ID（消息/组卷模板的主键 ID，hiprint 时缺省） */
  sourceId?: string
  /** 来源提供方（消息提供商 ID / 组卷归属用户 ID） */
  providerId?: string
  /** 创建者 */
  creator: string
  /** 最后修改者 */
  modifier?: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
  /** 模板 JSON 描述（设计器产物） */
  content?: string
  /** 备注 */
  remark?: string
}

/** 模板分页查询条件 */
export interface TemplatePageQuery {
  keyword?: string
  language?: TemplateLanguage
  type?: TemplateType
  status?: TemplateStatus
  source?: TemplateSource
  page: number
  size: number
}

/** 分页结果 */
export type PageResult<T> = {
  records: T[]
  total: number
  page: number
  size: number
}

/** designer 入参：Proxy 后的模板数据 */
export interface TemplateDesignerPayload {
  /** 模板 ID（新建时为 ''） */
  id: string
  /** 模板基础信息 */
  info: TemplateInfo
  /** 模板设计描述 */
  content: string
  /** 操作模式：'design' / 'preview' / 'print' */
  mode: 'design' | 'preview' | 'print'
}
