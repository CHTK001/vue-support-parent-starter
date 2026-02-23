/**
 * Transformers.js AI 模块
 * 用于加载和管理 ONNX 模型，实现本地 AI 对话
 */

import { ref, computed } from 'vue';
import { pipeline, env, type Pipeline } from '@xenova/transformers';
import type { ModelConfig, ModelStatus, GenerationOptions } from '../types/ai';
import { isModelQuestion, getModelIdentityResponse } from '../utils/aiModelDetector';

// 配置 Transformers.js 使用本地缓存
env.allowLocalModels = true;
env.allowRemoteModels = true;

/**
 * 支持的模型配置列表
 */
export const SUPPORTED_MODELS: ModelConfig[] = [
  {
    modelId: 'onnx-community/Llama-3.2-1B-Instruct-ONNX',
    name: 'Llama 3.2 1B',
    description: 'Meta 的轻量级指令微调模型，适合本地运行',
    size: 1200,
    default: true,
  },
  {
    modelId: 'onnx-community/Qwen2.5-0.5B-Instruct-ONNX',
    name: 'Qwen2.5 0.5B',
    description: '阿里云的小型指令模型，响应速度快',
    size: 600,
  },
  {
    modelId: 'onnx-community/TinyLlama-1.1B-Chat-v1.0-ONNX',
    name: 'TinyLlama 1.1B',
    description: '超轻量级对话模型，资源占用极低',
    size: 800,
  },
];

/**
 * 使用 Transformers.js AI 的 Composable
 * 
 * @param modelId 模型 ID，默认为默认模型
 * @returns AI 功能接口
 */
export function useTransformersAI(modelId?: string) {
  // 当前模型状态
  const modelStatus = ref<ModelStatus>('idle');
  // 当前加载的模型 ID
  const currentModelId = ref<string>(modelId || SUPPORTED_MODELS.find(m => m.default)?.modelId || SUPPORTED_MODELS[0].modelId);
  // 模型实例
  let modelInstance: Pipeline | null = null;
  // 加载错误信息
  const error = ref<string | null>(null);
  // 是否正在生成
  const isGenerating = ref(false);
  // 生成控制器（用于中断）
  let generationController: AbortController | null = null;

  /**
   * 当前模型配置
   */
  const currentModel = computed(() => {
    return SUPPORTED_MODELS.find(m => m.modelId === currentModelId.value) || SUPPORTED_MODELS[0];
  });

  /**
   * 加载模型
   * 
   * @param model 模型 ID，不传则使用当前模型
   * @returns Promise<void>
   */
  const loadModel = async (model?: string): Promise<void> => {
    const targetModelId = model || currentModelId.value;
    
    // 如果模型已加载且相同，直接返回
    if (modelInstance && currentModelId.value === targetModelId && modelStatus.value === 'ready') {
      return;
    }

    try {
      modelStatus.value = 'loading';
      error.value = null;

      // 创建文本生成管道
      modelInstance = await pipeline('text-generation', targetModelId, {
        quantized: true, // 使用量化模型以减小体积
        progress_callback: (progress: { status?: string; file?: string; progress?: number }) => {
          // 可以在这里显示加载进度
          console.log('[AI][模型加载]', progress);
        },
      }) as Pipeline;

      currentModelId.value = targetModelId;
      modelStatus.value = 'ready';
    } catch (err: unknown) {
      console.error('[AI][模型加载失败]', err);
      const errorMessage = err instanceof Error ? err.message : '模型加载失败';
      error.value = errorMessage;
      modelStatus.value = 'error';
      modelInstance = null;
      throw err;
    }
  };

  /**
   * 生成回复
   * 
   * @param prompt 用户输入
   * @param options 生成选项
   * @param onToken 流式输出回调
   * @returns Promise<string>
   */
  const generate = async (
    prompt: string,
    options: GenerationOptions = {},
    onToken?: (token: string) => void
  ): Promise<string> => {
    // 检查是否为模型相关问题
    if (isModelQuestion(prompt)) {
      const response = getModelIdentityResponse(prompt);
      if (onToken) {
        // 模拟流式输出
        for (let i = 0; i < response.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          onToken(response[i]);
        }
      }
      return response;
    }

    // 确保模型已加载
    if (modelStatus.value !== 'ready' || !modelInstance) {
      await loadModel();
    }

    if (!modelInstance) {
      throw new Error('模型未加载');
    }

    try {
      isGenerating.value = true;
      generationController = new AbortController();

      // 构建提示词（针对指令模型）
      const formattedPrompt = formatPrompt(prompt);

      // 生成选项
      const generationOptions = {
        max_new_tokens: options.maxLength || 200,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        top_k: options.topK || 50,
        repetition_penalty: options.repetitionPenalty || 1.1,
        do_sample: true,
        return_full_text: false,
      };

      // 生成回复
      const result = await modelInstance(formattedPrompt, generationOptions);
      
      // 提取生成的文本
      let generatedText = '';
      if (Array.isArray(result) && result.length > 0) {
        generatedText = result[0].generated_text || '';
      } else if (typeof result === 'string') {
        generatedText = result;
      } else if (result?.generated_text) {
        generatedText = result.generated_text;
      }

      // 清理格式
      generatedText = cleanGeneratedText(generatedText, formattedPrompt);

      // 流式输出
      if (onToken && generatedText) {
        for (let i = 0; i < generatedText.length; i++) {
          if (generationController?.signal.aborted) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 20));
          onToken(generatedText[i]);
        }
      }

      return generatedText;
    } catch (err: unknown) {
      console.error('[AI][生成失败]', err);
      if (err instanceof Error && err.name !== 'AbortError') {
        error.value = err.message || '生成失败';
      }
      throw err;
    } finally {
      isGenerating.value = false;
      generationController = null;
    }
  };

  /**
   * 格式化提示词（针对指令模型）
   * 
   * @param prompt 用户输入
   * @returns 格式化后的提示词
   */
  const formatPrompt = (prompt: string): string => {
    // Llama 3.2 指令格式
    if (currentModelId.value.includes('Llama-3.2')) {
      return `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
    }
    
    // Qwen 指令格式
    if (currentModelId.value.includes('Qwen')) {
      return `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
    }
    
    // 默认格式
    return prompt;
  };

  /**
   * 清理生成的文本
   * 
   * @param text 生成的文本
   * @param prompt 原始提示词
   * @returns 清理后的文本
   */
  const cleanGeneratedText = (text: string, prompt: string): string => {
    // 移除提示词部分
    let cleaned = text.replace(prompt, '').trim();
    
    // 移除特殊标记
    cleaned = cleaned
      .replace(/<\|.*?\|>/g, '')
      .replace(/<\|im_start\|>/g, '')
      .replace(/<\|im_end\|>/g, '')
      .replace(/<\|eot_id\|>/g, '')
      .trim();
    
    return cleaned;
  };

  /**
   * 停止生成
   */
  const stopGeneration = () => {
    if (generationController) {
      generationController.abort();
      generationController = null;
    }
    isGenerating.value = false;
  };

  /**
   * 卸载模型
   */
  const unloadModel = () => {
    if (modelInstance) {
      // Transformers.js 会自动清理资源
      modelInstance = null;
      modelStatus.value = 'idle';
    }
  };

  return {
    // 状态
    modelStatus: computed(() => modelStatus.value),
    currentModel,
    error: computed(() => error.value),
    isGenerating: computed(() => isGenerating.value),
    isReady: computed(() => modelStatus.value === 'ready'),
    
    // 方法
    loadModel,
    generate,
    stopGeneration,
    unloadModel,
    
    // 常量
    supportedModels: SUPPORTED_MODELS,
  };
}

