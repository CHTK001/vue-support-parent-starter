/**
 * 知识库模板数据集类型定义。
 *
 * <p>模板创建知识库时，数据集会被整体复制进新建知识库：
 * 先写 {@code docs}（Markdown 原文，走 {@code PUT /bases/{id}/file} 建索引），
 * 再建 {@code entities}（{@code POST /v2/rag/graph/entity}），
 * 最后建 {@code relations}（{@code POST /v2/rag/graph/relation}）。</p>
 */

/** 模板文档（相对路径 + Markdown 正文） */
export interface KbTemplateDoc {
  /** 相对路径，可含目录，如 {@code 人物/关羽.md} */
  path: string
  /** Markdown 正文 */
  content: string
}

/** 模板实体 */
export interface KbTemplateEntity {
  /** 实体名称（图谱节点显示名） */
  name: string
  /** 实体类型：person / organization / event / location / other */
  type: string
  /** 实体说明 */
  description: string
  /**
   * 实体图片地址，可选。
   *
   * <p>相对路径（如 {@code /kb-images/sanguo/关羽.png}，由前端静态目录托管）或完整
   * URL 均可；创建知识库时经 {@code POST /v2/rag/graph/entity} 的 {@code logo}
   * 参数落库，图谱节点有图即用图渲染。</p>
   */
  image?: string
}

/** 模板关系 */
export interface KbTemplateRelation {
  /** 源实体名称 */
  source: string
  /** 目标实体名称 */
  target: string
  /** 关系类型 */
  type: string
}

/** 模板数据集 */
export interface KbTemplateDataset {
  docs: KbTemplateDoc[]
  entities: KbTemplateEntity[]
  relations: KbTemplateRelation[]
}
