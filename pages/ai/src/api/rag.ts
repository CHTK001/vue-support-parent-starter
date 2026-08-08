/** RAG 配置接口（与后端 AiRagSettingController 对齐） */
import { get } from './request';
import { RagOptions } from './types';

export const ragApi = {
  /** 获取 RAG 配置选项（向量模型 / OCR 模型 / LLM 模型 / 向量数据库） */
  options: () => get<RagOptions>('/v2/rag/options'),
};
