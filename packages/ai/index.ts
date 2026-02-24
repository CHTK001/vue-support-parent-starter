/**
 * @repo/ai - AI工具包入口
 * 基于 @xenova/transformers 和 Web Worker
 */

export { AIClient, createAIClient, getAIClient } from './src/ai-client';
export type {
  TaskType,
  WorkerRequest,
  WorkerResponse,
  AITaskConfig,
  ClassificationResult,
  EmbeddingResult
} from './src/types';

