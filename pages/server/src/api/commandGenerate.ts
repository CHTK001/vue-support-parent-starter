/**
 * AI 生成部署命令 / 脚本 API（/v2/command/*）。
 *
 * <p>与 ReCommand 组件里已经验证过的调用方式保持一致：模型列表走 GET + unwrapResult，
 * 生成走 POST + SSE 帧（start / chunk / done / error），重连必须关闭 —— 生成是有副作用的
 * 一次性请求，自动重连只会把同一段脚本吐两遍，还会让「停止生成」按不住。</p>
 *
 * <p>放到 api 层而不是组件里，是为了让「脚本四件套」的编排（见 views/release/scriptAi.ts）
 * 可以复用同一出入口，不必再抄一遍 SSE 选项。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { http, unwrapResult } from "@repo/utils";

/**
 * 可选模型
 */
export interface CommandModel {
  id?: number | string;
  name: string;
  /** 提交时使用的模型标识，优先于 name */
  code?: string;
  providerName?: string;
  capabilities?: string[];
}

/**
 * 生成请求体
 *
 * <p>后端固定只收这几个字段：os / projectType / mainEntry / projectPath / logPath /
 * appName / requirement / model / multi。端口、JDK 路径这类附加参数没有独立字段，
 * 必须折进 requirement 交给模型理解。</p>
 */
export interface CommandGeneratePayload {
  os: "linux" | "windows" | string;
  projectType?: string;
  mainEntry?: string;
  projectPath?: string;
  logPath?: string;
  appName?: string;
  requirement?: string;
  model?: string;
  /** true 时一次产出多个脚本（JSON），false 时只产出单段脚本 */
  multi?: boolean;
}

/**
 * SSE 帧
 */
export type CommandFrame =
  | { type: "start"; shell?: string }
  | { type: "chunk"; content?: string }
  | { type: "done"; full?: string }
  | { type: "error"; message?: string };

/**
 * 生成回调
 */
export interface CommandGenerateHandlers {
  /** 增量片段（已去掉空片段） */
  onChunk?: (content: string) => void;
  /** 收尾全文：优先 done.full，缺省用累计片段 */
  onDone?: (full: string) => void;
  /** 失败原因（连接失败、后端 error 帧） */
  onError?: (message: string) => void;
}

/**
 * 可用模型列表
 *
 * <p>与 ReCommand 一致：失败返回空数组而不是抛错 —— 拿不到模型只意味着「AI 入口不可用」，
 * 不该让整个页面因为一个可选能力而报错。</p>
 *
 * @param capability 能力标签，如 chat
 * @returns 模型列表（失败时为空数组）
 */
export const listCommandModels = async (capability?: string): Promise<CommandModel[]> => {
  try {
    const res = await http().get("/v2/command/models").query({ capability });
    const list = unwrapResult<CommandModel[]>(res);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/**
 * 生成命令 / 脚本（SSE 流式）
 *
 * <p>同步返回可关闭句柄：调用方拿到就能挂到「停止生成」按钮上。帧按到达顺序分发，
 * done / error 只认第一次，重复帧与 close() 之后的迟到回调都会被丢弃。</p>
 *
 * @param payload 生成请求体
 * @param handlers 帧回调
 * @returns 可关闭句柄
 */
export function generateCommand(
  payload: CommandGeneratePayload,
  handlers: CommandGenerateHandlers = {},
): { close(): void } {
  let acc = "";
  let settled = false;
  let client: { close(): void } | null = null;

  const fail = (message: string) => {
    if (settled) {
      return;
    }
    settled = true;
    handlers.onError?.(message);
  };

  try {
    client = http()
      .post("/v2/command/generate")
      // 展开成对象字面量再交给 .data()：RequestBody 是 Record<string, unknown>，
      // 而 interface 没有隐式索引签名，直接传会报 TS2345。
      .data({ ...payload })
      .sse<CommandFrame>({
        reconnect: false,
        onMessage: (e) => {
          const frame = e.data;
          if (!frame || typeof frame !== "object") {
            return;
          }
          switch (frame.type) {
            case "chunk": {
              const content = frame.content;
              if (!content) {
                return;
              }
              acc += content;
              handlers.onChunk?.(content);
              return;
            }
            case "done": {
              if (settled) {
                return;
              }
              settled = true;
              handlers.onDone?.((frame.full || "").trim() || acc.trim());
              return;
            }
            case "error": {
              fail(frame.message || "生成失败");
              return;
            }
            default:
              return;
          }
        },
        onError: (err) => fail(err instanceof Error ? err.message : "AI 连接失败"),
        // 正常收尾（服务端关流）或调用方 close() 都走这里；不作为失败上报，
        // 否则「用户主动停止」会被渲染成一条红色报错。
        onClose: () => undefined,
      });
  } catch {
    fail("AI 调用失败");
  }

  return {
    close() {
      settled = true;
      client?.close();
    },
  };
}
