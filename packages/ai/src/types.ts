/**
 * AI Worker 消息类型定义
 */

/**
 * Worker 任务类型
 */
export type TaskType = 
  | 'text-classification'
  | 'sentiment-analysis'
  | 'question-answering'
  | 'text-generation'
  | 'translation'
  | 'summarization'
  | 'embedding'
  | 'zero-shot-classification';

/**
 * Worker 请求消息
 */
export interface WorkerRequest {
  id: string;
  type: TaskType;
  model?: string;
  inputs: string | string[] | Record<string, unknown>;
  options?: Record<string, unknown>;
}

/**
 * Worker 响应消息
 */
export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * AI 任务配置
 */
export interface AITaskConfig {
  model?: string;
  options?: Record<string, unknown>;
}

/**
 * 文本分类结果
 */
export interface ClassificationResult {
  label: string;
  score: number;
}

/**
 * 嵌入向量结果
 */
export interface EmbeddingResult {
  embedding: number[];
}

