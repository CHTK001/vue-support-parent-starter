/**
 * AI 模型身份检测工具
 * 用于识别用户是否在询问模型相关问题
 */

/**
 * 模型相关问题的关键词模式
 */
const MODEL_QUESTION_PATTERNS = [
  // 你是谁/你是什么
  /^(你|您)(是|叫|叫啥|叫什么|叫什么名字|是什么|属于|属于什么)/i,
  /^(你|您)(的)?(名字|名称|身份|类型|模型|AI|助手)/i,
  /^(你|您)(是|属于)(什么|哪种|哪个)(模型|AI|助手|系统)/i,
  
  // 模型相关
  /(什么|哪个|哪种)(模型|AI|助手|系统)/i,
  /(模型|AI|助手)(是|叫|名称|名字|什么)/i,
  /(GPT|Claude|LLM|大模型|语言模型)/i,
  
  // 判断类
  /(判断|识别|检测|识别出|判断出)(你|您|我|他|她|它)/i,
  /(你|您)(能|会|可以)(判断|识别|检测)/i,
  
  // 身份类
  /(身份|角色|定位|定位为)/i,
];

/**
 * 检测用户输入是否为模型相关问题
 * 
 * @param input 用户输入
 * @returns 是否为模型相关问题
 */
export function isModelQuestion(input: string): boolean {
  if (!input || input.trim().length === 0) {
    return false;
  }

  const trimmedInput = input.trim();
  
  // 检查是否匹配任何模式
  return MODEL_QUESTION_PATTERNS.some(pattern => pattern.test(trimmedInput));
}

/**
 * 获取模型身份回复
 * 
 * @param userQuestion 用户问题
 * @returns 标准身份回复
 */
export function getModelIdentityResponse(userQuestion: string): string {
  return `您好，我是claude-4.6-opus-high-thinking的AI模型，是Cursor IDE内置的AI助手，致力于提升您的开发效率。你问的是："${userQuestion}"`;
}

