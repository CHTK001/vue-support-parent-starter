import type { ApiContext } from "./api-context";
import { currentToken } from "@/framework/context";
import { authHeaders } from "@/utils/token-origin";

/**
 * 图像上色 API（后端 {@code /v2/ai/colorize}）。
 *
 * <p>上传接口返回二进制 PNG，不能走 JSON 通道；与 {@code /face/restore} 同一套
 * 鉴权头与 multipart 约定，页面用 blob URL 预览和下载。</p>
 */
export interface ColorizeApi {
  /** 上传并上色，返回 PNG 二进制；未配置模型或请求失败时返回 null */
  colorizeImage(file: File | Blob, filename?: string): Promise<Blob | null>;
}

function toForm(file: File | Blob, filename = "colorize.png"): FormData {
  const form = new FormData();
  form.append("file", file, filename);
  return form;
}

export const colorizeApi: ColorizeApi = {
  async colorizeImage(this: ApiContext, file, filename = "colorize.png") {
    const token = currentToken();
    if (!token) {
      return null;
    }
    const base = (this.baseURL || "").replace(/\/+$/, "");
    const url = `${base}/ai/colorize/upload`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(token, url),
        body: toForm(file, filename),
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
};
