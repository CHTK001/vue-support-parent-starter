/**
 * AI 服务接口
 * 支持多种 AI 提供商生成 Mock 数据
 */

import { DocStorage } from "./storage";

/** AI 服务提供商 */
export type AIProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "huggingface"
  | "cloudflare"
  | "ollama"
  | "custom";

/** AI 服务配置 */
export interface AIServiceConfig {
  /** 提供商 */
  provider: AIProvider;
  /** API 地址 */
  apiUrl?: string;
  /** API Key */
  apiKey?: string;
  /** 模型名称 */
  model?: string;
  /** 是否启用 */
  enabled: boolean;
}

/** AI 生成请求 */
export interface AIGenerateRequest {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** API 描述 */
  description?: string;
  /** 参数定义 */
  parameters?: any[];
  /** 请求体定义 */
  requestBody?: any;
  /** 响应定义 */
  responses?: any;
}

/** AI 生成响应 */
export interface AIGenerateResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
}

// 默认配置
const DEFAULT_CONFIGS: Record<AIProvider, Partial<AIServiceConfig>> = {
  openai: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-3.5-turbo",
  },
  anthropic: {
    apiUrl: "https://api.anthropic.com/v1/messages",
    model: "claude-3-haiku-20240307",
  },
  gemini: {
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-pro",
  },
  huggingface: {
    apiUrl: "https://api-inference.huggingface.co/models",
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  },
  cloudflare: {
    apiUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run",
    model: "@cf/meta/llama-2-7b-chat-int8",
  },
  ollama: {
    apiUrl: "http://localhost:11434/api/generate",
    model: "llama2",
  },
  custom: {
    apiUrl: "",
    model: "",
  },
};

// 存储键
const AI_CONFIG_KEY = "ai_service_config";

/**
 * AI 服务类
 */
export class AIService {
  private config: AIServiceConfig | null = null;

  /**
   * 初始化配置
   */
  async init(): Promise<void> {
    this.config = await DocStorage.getConfig<AIServiceConfig>(AI_CONFIG_KEY);
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIServiceConfig | null {
    return this.config;
  }

  /**
   * 保存配置
   */
  async saveConfig(config: AIServiceConfig): Promise<void> {
    this.config = config;
    await DocStorage.setConfig(AI_CONFIG_KEY, config);
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig(provider: AIProvider): Partial<AIServiceConfig> {
    return DEFAULT_CONFIGS[provider] || {};
  }

  /**
   * 生成 Mock 数据
   */
  async generateMockData(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    if (!this.config || !this.config.enabled) {
      return { success: false, error: "AI 服务未启用" };
    }

    const prompt = this.buildPrompt(request);

    try {
      switch (this.config.provider) {
        case "openai":
          return await this.callOpenAI(prompt);
        case "anthropic":
          return await this.callAnthropic(prompt);
        case "gemini":
          return await this.callGemini(prompt);
        case "huggingface":
          return await this.callHuggingFace(prompt);
        case "cloudflare":
          return await this.callCloudflare(prompt);
        case "ollama":
          return await this.callOllama(prompt);
        case "custom":
          return await this.callCustom(prompt);
        default:
          return { success: false, error: "未知的 AI 提供商" };
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      return { success: false, error: error.message || "AI 生成失败" };
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(request: AIGenerateRequest): string {
    let prompt = `Generate realistic mock JSON response data for the following API endpoint.

API Information:
- Method: ${request.method}
- Path: ${request.path}
${request.description ? `- Description: ${request.description}` : ""}

`;

    if (request.parameters && request.parameters.length > 0) {
      prompt += `Parameters:\n`;
      request.parameters.forEach((param) => {
        prompt += `- ${param.name} (${param.in}): ${param.type}${param.required ? " [required]" : ""}\n`;
      });
      prompt += "\n";
    }

    if (request.requestBody) {
      prompt += `Request Body Schema:\n${JSON.stringify(request.requestBody, null, 2)}\n\n`;
    }

    prompt += `Requirements:
1. Generate a complete, realistic JSON response
2. Use meaningful sample data (names, emails, dates, etc.)
3. If it's a list endpoint, generate 3-5 items
4. Include common response wrapper like { "success": true, "code": 200, "data": ... }
5. Response must be valid JSON only, no explanations

Response:`;

    return prompt;
  }

  /**
   * 调用 OpenAI
   */
  private async callOpenAI(prompt: string): Promise<AIGenerateResponse> {
    const response = await fetch(this.config!.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config!.model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates realistic mock API response data. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    return this.parseAIResponse(content);
  }

  /**
   * 调用 Anthropic
   */
  private async callAnthropic(prompt: string): Promise<AIGenerateResponse> {
    const response = await fetch(this.config!.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config!.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config!.model || "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    return this.parseAIResponse(content);
  }

  /**
   * 调用 Google Gemini
   */
  private async callGemini(prompt: string): Promise<AIGenerateResponse> {
    const url = `${this.config!.apiUrl}/${this.config!.model}:generateContent?key=${this.config!.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    return this.parseAIResponse(content);
  }

  /**
   * 调用 HuggingFace
   */
  private async callHuggingFace(prompt: string): Promise<AIGenerateResponse> {
    const url = `${this.config!.apiUrl}/${this.config!.model}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${error}`);
    }

    const result = await response.json();
    const content = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

    return this.parseAIResponse(content);
  }

  /**
   * 调用 Cloudflare Workers AI
   */
  private async callCloudflare(prompt: string): Promise<AIGenerateResponse> {
    const response = await fetch(this.config!.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates realistic mock API response data. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${error}`);
    }

    const result = await response.json();
    const content = result.result?.response;

    return this.parseAIResponse(content);
  }

  /**
   * 调用 Ollama (本地)
   */
  private async callOllama(prompt: string): Promise<AIGenerateResponse> {
    const response = await fetch(this.config!.apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config!.model || "llama2",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const result = await response.json();
    const content = result.response;

    return this.parseAIResponse(content);
  }

  /**
   * 调用自定义服务
   */
  private async callCustom(prompt: string): Promise<AIGenerateResponse> {
    if (!this.config!.apiUrl) {
      return { success: false, error: "未配置自定义 API 地址" };
    }

    const response = await fetch(this.config!.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config!.apiKey ? { Authorization: `Bearer ${this.config!.apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        model: this.config!.model,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom API error: ${error}`);
    }

    const result = await response.json();
    // 假设返回格式为 { content: "..." } 或 { data: "..." }
    const content = result.content || result.data || result.response || result.text;

    return this.parseAIResponse(content);
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(content: string | undefined): AIGenerateResponse {
    if (!content) {
      return { success: false, error: "AI 返回空内容" };
    }

    try {
      // 尝试提取 JSON
      let jsonStr = content;

      // 移除 markdown 代码块
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // 尝试找到 JSON 对象
      const startIndex = jsonStr.indexOf("{");
      const endIndex = jsonStr.lastIndexOf("}");
      if (startIndex !== -1 && endIndex !== -1) {
        jsonStr = jsonStr.substring(startIndex, endIndex + 1);
      }

      const data = JSON.parse(jsonStr);
      return { success: true, data };
    } catch (error) {
      console.error("Failed to parse AI response:", error, content);
      return {
        success: false,
        error: "无法解析 AI 返回的 JSON 数据",
      };
    }
  }
}

// 单例
export const aiService = new AIService();

export default aiService;
