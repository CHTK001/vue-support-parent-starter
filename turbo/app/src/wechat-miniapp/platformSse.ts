/**
 * @repo/app/wechat-miniapp —— SSE 适配（uni.request 的 enableChunked）
 *
 * <p>小程序没有 {@code EventSource} / {@code fetch}，只能用 {@code uni.request}
 * 的 {@code enableChunked} + {@code onChunkReceived} 收字节流。本文件把「传输 + 分帧」
 * 全部收在一处，业务层只处理事件语义：</p>
 * <ul>
 *   <li>URL 拼接（与 http 共用 {@link joinUrl}）、Bearer 注入、401 回调；</li>
 *   <li>增量 UTF-8 解码（多字节中文可能被切在两个 chunk 之间）；</li>
 *   <li>SSE 分帧（{@code \n\n} 分隔、{@code data:} 多行合并）、[DONE] 收尾、心跳忽略；</li>
 *   <li>环境不支持分块时立即 abort（避免后端白跑一次 Agent）并抛错，由调用方降级。</li>
 * </ul>
 */
import type { MpSse, MpSseHandlers, MpSseParams } from "./types";
import { getUniRuntime } from "./uni";
import { joinUrl } from "./url";

/** uni.request 的流式任务（回调形式，跨版本签名不一，这里只声明用到的部分） */
interface ChunkedTask {
  abort(): void;
  onChunkReceived?(callback: (res: { chunk: ArrayBuffer | string }) => void): void;
}

/** 流式请求适配器依赖 */
export interface MpSseDeps {
  baseUrl: string;
  getAccessToken: () => string;
  onUnauthorized?: () => void | Promise<void>;
}

/**
 * 增量 UTF-8 解码器：把字节流累积解码，跨 chunk 的多字节字符留到下一块。
 */
class Utf8StreamDecoder {
  private pending: number[] = [];

  decode(bytes: Uint8Array): string {
    const all = this.pending.concat(Array.from(bytes));
    this.pending = [];
    let out = "";
    let i = 0;
    while (i < all.length) {
      const b = all[i];
      if (b < 0x80) {
        out += String.fromCharCode(b);
        i += 1;
        continue;
      }
      let need = 0;
      if ((b & 0xe0) === 0xc0) need = 1;
      else if ((b & 0xf0) === 0xe0) need = 2;
      else if ((b & 0xf8) === 0xf0) need = 3;
      if (need === 0) {
        // 非法起始字节，丢弃
        i += 1;
        continue;
      }
      if (i + need >= all.length) {
        // 长度不足：剩余字节留到下一个 chunk
        this.pending = all.slice(i);
        break;
      }
      let cp = b & (need === 1 ? 0x1f : need === 2 ? 0x0f : 0x07);
      let ok = true;
      for (let k = 1; k <= need; k += 1) {
        const cb = all[i + k];
        if ((cb & 0xc0) !== 0x80) {
          ok = false;
          break;
        }
        cp = (cp << 6) | (cb & 0x3f);
      }
      if (!ok) {
        i += 1;
        continue;
      }
      out += String.fromCodePoint(cp);
      i += need + 1;
    }
    return out;
  }
}

/** 解析一个 SSE 块：取 data: 行（多行按规范以换行合并）；event: 行对本端无意义 */
function parseSseBlock(block: string): string | undefined {
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  return dataLines.length ? dataLines.join("\n") : undefined;
}

/** 创建 SSE 客户端 */
export function createMpSse(deps: MpSseDeps): MpSse {
  const { baseUrl, getAccessToken, onUnauthorized } = deps;

  return {
    supported(): boolean {
      try {
        const can = (getUniRuntime() as { canIUse?: (name: string) => boolean }).canIUse?.(
          "request.onChunkReceived",
        );
        if (typeof can === "boolean") return can;
      } catch {
        // 探测失败时按支持处理，真正调用失败再走降级
      }
      return true;
    },

    stream(params: MpSseParams, handlers: MpSseHandlers): { abort: () => void } {
      const token = params.auth === false ? "" : getAccessToken();
      const header: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(params.header ?? {}),
      };

      const decoder = new Utf8StreamDecoder();
      let buffer = "";
      let finished = false;
      const finish = (fn: () => void) => {
        if (finished) return;
        finished = true;
        fn();
      };

      const handleData = (data: string) => {
        if (data === "[DONE]") {
          finish(handlers.onDone);
          return;
        }
        if (data === "") return; // 心跳保活帧
        try {
          handlers.onMessage(JSON.parse(data));
        } catch {
          // 非 JSON 帧，忽略
        }
      };

      const consume = (raw: ArrayBuffer | string) => {
        buffer += typeof raw === "string" ? raw : decoder.decode(new Uint8Array(raw));
        buffer = buffer.replace(/\r\n/g, "\n");
        let idx = buffer.indexOf("\n\n");
        while (idx >= 0) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const data = parseSseBlock(block);
          if (data !== undefined) handleData(data);
          idx = buffer.indexOf("\n\n");
        }
      };

      const task = getUniRuntime().request({
        url: joinUrl(baseUrl, params.url),
        method: "POST",
        data: params.data,
        header,
        enableChunked: true,
        timeout: params.timeout,
        success: (res: { statusCode: number }) => {
          if (res.statusCode === 401) {
            void onUnauthorized?.();
            finish(() => handlers.onError(new Error("登录已过期，请重新登录")));
          } else if (res.statusCode >= 400) {
            finish(() => handlers.onError(new Error(`请求失败（HTTP ${res.statusCode}）`)));
          } else {
            finish(handlers.onDone);
          }
        },
        fail: (error: { errMsg?: string }) =>
          finish(() => handlers.onError(new Error(error?.errMsg || "连接中断"))),
      }) as ChunkedTask;

      if (typeof task.onChunkReceived !== "function") {
        try {
          task.abort();
        } catch {
          // ignore
        }
        throw new Error("当前环境不支持流式响应（enableChunked），请降级为普通发送");
      }
      task.onChunkReceived((res) => {
        try {
          consume(res.chunk);
        } catch {
          // 单块解析失败不影响后续块
        }
      });

      return {
        abort: () => {
          try {
            task.abort();
          } catch {
            // ignore
          }
        },
      };
    },
  };
}
