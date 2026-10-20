import type { ApiContext } from "./api-context";
import { currentToken } from "@/framework/context";
import { authHeaders } from "@/utils/token-origin";

/**
 * 音频识别（ASR）API（后端 {@code /v2/ai/asr}）。
 *
 * <p>上传接口返回 JSON 信封（{@code {success, data:{text,...}}}），走业务的
 * JSON 通道即可；音频体积较大，仍用 multipart 直传，不 base64。</p>
 *
 * <p>与 OpenAI 兼容壳 {@code /v1/audio/transcriptions} 的区别：后者只是把
 * "Transcribe audio: xxx" 拼成 prompt 问聊天模型的占位实现，不调用真实 ASR；
 * 本模块直连 {@code VirtualClient} SPI（whisper / sensevoice / sherpa 等）。</p>
 */
export interface AsrApi {
  /**
   * 上传音频并转写为文本。
   *
   * @param file 音频文件
   * @param options 覆盖默认模型 / 语言（留空用「音频配置」页的值）
   * @returns 转写结果；未配置 ASR 或请求失败时返回 null
   */
  transcribe(
    file: File | Blob,
    options?: { filename?: string; model?: string; language?: string }
  ): Promise<AsrTranscribeResult | null>;

  /**
   * 当前用户生效的 ASR 配置摘要（provider / model / language，密钥不回显）。
   *
   * <p>方法名带 {@code asr} 前缀而非裸 {@code config}：ApiService 把所有领域模块
   * 合并到同一个类上，裸名容易与别的领域的 {@code config} 撞车。</p>
   */
  asrConfig(): Promise<AsrConfig | null>;
}

/** 转写结果 */
export interface AsrTranscribeResult {
  /** 全文转写 */
  text: string;
  /** 实际使用的语言 */
  language?: string;
  /** 实际使用的服务商 */
  provider?: string;
  /** 实际使用的模型 */
  model?: string;
}

/** ASR 配置摘要 */
export interface AsrConfig {
  provider?: string;
  model?: string;
  language?: string;
}

export const asrApi: AsrApi = {
  async transcribe(this: ApiContext, file, options = {}) {
    const token = currentToken();
    if (!token) {
      return null;
    }
    const filename = options.filename || "audio.wav";
    const form = new FormData();
    form.append("file", file, filename);
    if (options.model) {
      form.append("model", options.model);
    }
    if (options.language) {
      form.append("language", options.language);
    }

    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/ai/asr/transcribe`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(token, url),
        body: form,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      const data = json?.data ?? json ?? {};
      const text = typeof data.text === "string" ? data.text : "";
      return {
        text,
        language: data.language,
        provider: data.provider,
        model: data.model,
      };
    } catch {
      return null;
    }
  },

  async asrConfig(this: ApiContext) {
    try {
      const json = await this._request<Record<string, any>>("/ai/asr/config", { method: "POST" });
      const data = json?.data ?? json ?? {};
      return {
        provider: data.provider,
        model: data.model,
        language: data.language,
      };
    } catch {
      return null;
    }
  },
};
