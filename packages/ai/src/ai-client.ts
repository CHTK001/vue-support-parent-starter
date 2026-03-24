/**
 * AI 客户端 - 封装 Web Worker 通信
 */
import type {
  WorkerRequest,
  WorkerResponse,
  TaskType,
  AITaskConfig,
  ClassificationResult,
  EmbeddingResult
} from './types';

/**
 * AI 客户端类
 */
export class AIClient {
  private worker: Worker | null = null;
  private pendingTasks: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  /**
   * 初始化 Worker
   */
  private initWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    // 使用 Vite 的 Worker 支持
    // 在 Vite 中，使用 ?worker 后缀导入 Worker 文件
    // 这种方式在开发和生产环境中都能正常工作
    let workerUrl: string | URL;
    
    try {
      // 使用 Vite 的 Worker 导入方式
      // Vite 会自动处理 ?worker 后缀，将其转换为 Worker 实例或 URL
      // @ts-expect-error - Vite 特殊处理，类型定义可能不完整
      workerUrl = new URL('./worker.ts?worker', import.meta.url);
    } catch {
      // 降级方案：使用 Blob URL（适用于非 Vite 环境）
      const workerCode = `
        import { pipeline } from '@xenova/transformers';
        
        const pipelines = new Map();
        
        async function getPipeline(task, model) {
          const key = \`\${task}:\${model || 'default'}\`;
          if (pipelines.has(key)) {
            return pipelines.get(key);
          }
          const pipelineInstance = await pipeline(task, model);
          pipelines.set(key, pipelineInstance);
          return pipelineInstance;
        }
        
        self.addEventListener('message', async (event) => {
          const { id, type, model, inputs, options } = event.data;
          try {
            const pipelineInstance = await getPipeline(type, model);
            const result = await pipelineInstance(inputs, options);
            self.postMessage({ id, success: true, data: result });
          } catch (error) {
            self.postMessage({
              id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerUrl = URL.createObjectURL(blob);
    }
    
    this.worker = new Worker(workerUrl, { type: 'module' });
    
    // 监听 Worker 消息
    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { id, success, data, error } = event.data;
      const task = this.pendingTasks.get(id);
      
      if (task) {
        this.pendingTasks.delete(id);
        if (success) {
          task.resolve(data);
        } else {
          task.reject(new Error(error || 'Unknown error'));
        }
      }
    });

    // 监听 Worker 错误
    this.worker.addEventListener('error', (error) => {
      console.error('[AI Worker] Error:', error);
      // 清理所有待处理任务
      for (const task of this.pendingTasks.values()) {
        task.reject(new Error('Worker error'));
      }
      this.pendingTasks.clear();
    });

    return this.worker;
  }

  /**
   * 执行 AI 任务
   */
  private async executeTask<T = unknown>(
    type: TaskType,
    inputs: string | string[] | Record<string, unknown>,
    config?: AITaskConfig
  ): Promise<T> {
    const worker = this.initWorker();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<T>((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        if (this.pendingTasks.has(id)) {
          this.pendingTasks.delete(id);
          reject(new Error('Task timeout'));
        }
      }, 300000); // 5分钟超时

      this.pendingTasks.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value as T);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      const request: WorkerRequest = {
        id,
        type,
        model: config?.model,
        inputs,
        options: config?.options
      };

      worker.postMessage(request);
    });
  }

  /**
   * 文本分类
   */
  async classify(
    text: string,
    config?: AITaskConfig
  ): Promise<ClassificationResult[]> {
    return this.executeTask<ClassificationResult[]>(
      'text-classification',
      text,
      config
    );
  }

  /**
   * 情感分析
   */
  async sentiment(
    text: string,
    config?: AITaskConfig
  ): Promise<ClassificationResult[]> {
    return this.executeTask<ClassificationResult[]>(
      'sentiment-analysis',
      text,
      config
    );
  }

  /**
   * 问答
   */
  async questionAnswering(
    question: string,
    context: string,
    config?: AITaskConfig
  ): Promise<{ answer: string; score: number }> {
    return this.executeTask(
      'question-answering',
      { question, context },
      config
    );
  }

  /**
   * 文本生成
   */
  async generate(
    prompt: string,
    config?: AITaskConfig
  ): Promise<string> {
    return this.executeTask<string>(
      'text-generation',
      prompt,
      config
    );
  }

  /**
   * 翻译
   */
  async translate(
    text: string,
    config?: AITaskConfig
  ): Promise<string> {
    return this.executeTask<string>(
      'translation',
      text,
      config
    );
  }

  /**
   * 摘要
   */
  async summarize(
    text: string,
    config?: AITaskConfig
  ): Promise<string> {
    return this.executeTask<string>(
      'summarization',
      text,
      config
    );
  }

  /**
   * 获取文本嵌入向量
   */
  async embed(
    text: string | string[],
    config?: AITaskConfig
  ): Promise<EmbeddingResult> {
    return this.executeTask<EmbeddingResult>(
      'embedding',
      text,
      config
    );
  }

  /**
   * 零样本分类
   */
  async zeroShotClassify(
    text: string,
    candidateLabels: string[],
    config?: AITaskConfig
  ): Promise<ClassificationResult[]> {
    return this.executeTask<ClassificationResult[]>(
      'zero-shot-classification',
      { text, candidate_labels: candidateLabels },
      config
    );
  }

  /**
   * 销毁 Worker 并清理资源
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingTasks.clear();
  }
}

/**
 * 创建 AI 客户端实例
 */
export function createAIClient(): AIClient {
  return new AIClient();
}

/**
 * 默认单例实例
 */
let defaultClient: AIClient | null = null;

/**
 * 获取默认 AI 客户端
 */
export function getAIClient(): AIClient {
  if (!defaultClient) {
    defaultClient = createAIClient();
  }
  return defaultClient;
}

