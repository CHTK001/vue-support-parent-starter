/**
 * AI Worker - 在 Web Worker 中处理 transformers 任务
 */
import { pipeline, type Pipeline, type PipelineType } from '@xenova/transformers';
import type { WorkerRequest, WorkerResponse } from './types';

// Worker 全局状态
const pipelines: Map<string, Pipeline> = new Map();

/**
 * 获取或创建 pipeline
 */
async function getPipeline(
  task: string,
  model?: string
): Promise<Pipeline> {
  const key = `${task}:${model || 'default'}`;
  
  if (pipelines.has(key)) {
    return pipelines.get(key)!;
  }

  const pipelineInstance = await pipeline(
    task as PipelineType,
    model
  );
  
  pipelines.set(key, pipelineInstance);
  return pipelineInstance;
}

/**
 * 处理 Worker 消息
 */
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, model, inputs, options } = event.data;

  try {
    const pipelineInstance = await getPipeline(type, model);
    const result = await pipelineInstance(inputs, options);
    
    const response: WorkerResponse = {
      id,
      success: true,
      data: result
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    self.postMessage(response);
  }
});

