/**
 * 知识库模板数据集登记表。
 *
 * <p>只有登记了数据集的模板，才会在「使用此模板创建」时把**文档 + 实体 + 关系**
 * 整体复制进新建的知识库；未登记的模板退化为「按预置类型生成骨架文档」。</p>
 */
import type { KbTemplateDataset } from './types'
import { SANGUO_DATASET } from './sanguo'

/** 模板 key → 完整数据集 */
export const TEMPLATE_DATASETS: Record<string, KbTemplateDataset> = {
  sanguo: SANGUO_DATASET,
}

export { SANGUO_DATASET }
export type { KbTemplateDoc, KbTemplateEntity, KbTemplateRelation, KbTemplateDataset } from './types'
