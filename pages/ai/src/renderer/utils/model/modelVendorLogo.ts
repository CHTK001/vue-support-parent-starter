/**
 * 模型厂商 Logo 解析
 *
 * 根据模型名称前缀匹配厂商 Logo 的 URL，供 Bot 列表 / 聊天记录展示。
 * 未匹配时返回 null。
 */
const VENDOR_LOGOS: Record<string, string> = {
  // OpenAI / GPT
  'gpt-': 'https://cdn.example.com/logos/openai.svg',
  'o1-': 'https://cdn.example.com/logos/openai.svg',
  'o3-': 'https://cdn.example.com/logos/openai.svg',
  'chat-completions-': 'https://cdn.example.com/logos/openai.svg',
  // Claude / Anthropic
  'claude-': 'https://cdn.example.com/logos/anthropic.svg',
  // Gemini / Google
  'gemini-': 'https://cdn.example.com/logos/google.svg',
  // DeepSeek
  'deepseek-': 'https://cdn.example.com/logos/deepseek.svg',
  // 通义千问
  'qwen-': 'https://cdn.example.com/logos/qwen.svg',
  // 百度
  'ernie-': 'https://cdn.example.com/logos/baidu.svg',
  // 星火
  'spark-': 'https://cdn.example.com/logos/spark.svg',
  // 暢鵬
  'gpt-4.1': 'https://cdn.example.com/logos/openai.svg',
};

/**
 * 解析模型厂商 Logo URL。
 * @param model 模型名称
 * @param _size 可选尺寸（当前未使用，保留接口兼容性）
 * @returns Logo URL 或 null
 */
export function resolveModelVendorLogo(model?: string | null, _size?: number | undefined): string | null {
  if (!model) return null;
  const lower = model.toLowerCase();
  for (const [prefix, url] of Object.entries(VENDOR_LOGOS)) {
    if (lower.includes(prefix)) return url;
  }
  return null;
}
