import type { ApiContext } from "./api-context";
import { currentToken } from "@/framework/context";
import { authHeaders } from "@/utils/token-origin";

/**
 * 语音合成（TTS）API（后端 {@code /api/tts}）。
 *
 * <p>合成接口返回二进制音频（wav / mp3 / ogg / flac），走 multipart 直传文本、
 * 读 blob 预览与下载；与 {@code /api/tts/config} 的 JSON 摘要接口分开。</p>
 *
 * <p>配置来源：后端优先读 {@code tts} 设置分组对当前用户生效的合并值
 * （可在「系统设置 → 音频配置」改），分组未配置的字段回落到 {@code ai.tts.*} 配置文件。</p>
 */
export interface TtsApi {
  /**
   * 合成语音。
   *
   * @param text 待合成文本
   * @param options 覆盖默认模型 / 音色 / 格式 / 语言
   * @returns 音频二进制；失败时返回 null
   */
  synthesize(
    text: string,
    options?: { model?: string; voice?: string; format?: string; language?: string }
  ): Promise<Blob | null>;

  /**
   * 当前用户生效的 TTS 配置摘要（provider / model / voice / format，密钥不回显）。
   *
   * <p>方法名带 {@code tts} 前缀而非裸 {@code config}：ApiService 是把所有领域模块
   * 合并到同一个类上的，裸名容易与别的领域的 {@code config} 撞车。</p>
   */
  ttsConfig(): Promise<TtsConfig | null>;
}

/** TTS 配置摘要 */
export interface TtsConfig {
  provider?: string;
  model?: string;
  voice?: string;
  format?: string;
  language?: string;
}

export const ttsApi: TtsApi = {
  async synthesize(this: ApiContext, text, options = {}) {
    const token = currentToken();
    if (!token) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/tts`;
    const body: Record<string, string> = { text };
    if (options.model) body.model = options.model;
    if (options.voice) body.voice = options.voice;
    if (options.format) body.format = options.format;
    if (options.language) body.language = options.language;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...authHeaders(token, url),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      return await res.blob();
    } catch {
      return null;
    }
  },

  async ttsConfig(this: ApiContext) {
    const token = currentToken();
    if (!token) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/tts/config`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(token, url),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      const data = json?.data ?? json ?? {};
      return {
        provider: data.provider,
        model: data.model,
        voice: data.voice,
        format: data.format,
        language: data.language,
      };
    } catch {
      return null;
    }
  },
};
