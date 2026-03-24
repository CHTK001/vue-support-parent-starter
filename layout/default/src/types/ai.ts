/**
 * AI 模块类型定义
 */

/**
 * 支持的模型配置
 */
export interface ModelConfig {
  /** 模型 ID（HuggingFace 格式） */
  modelId: string;
  /** 模型显示名称 */
  name: string;
  /** 模型描述 */
  description: string;
  /** 模型大小（MB） */
  size: number;
  /** 是否为默认模型 */
  default?: boolean;
}

/**
 * 模型状态
 */
export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 对话消息
 */
export interface ChatMessage {
  /** 消息 ID */
  id: number;
  /** 消息类型 */
  type: 'user' | 'bot';
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  time: Date;
  /** 是否正在加载 */
  loading?: boolean;
}

/**
 * 模型生成选项
 */
export interface GenerationOptions {
  /** 最大生成长度 */
  maxLength?: number;
  /** 温度（控制随机性） */
  temperature?: number;
  /** Top-p 采样 */
  topP?: number;
  /** Top-k 采样 */
  topK?: number;
  /** 重复惩罚 */
  repetitionPenalty?: number;
}

