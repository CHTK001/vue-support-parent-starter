/**
 * SSE 客户端回归测试。
 *
 * 重点回归：心跳注释事件不得透传给业务。
 *
 * 背景：`@microsoft/fetch-event-source` 的 parser 遇到空行会**无条件**派发一次事件，
 * 而 SSE 注释行（`: keep-alive`）被正确跳过、不会写入 data 字段。
 * 于是「注释 + 空行」这一组合会产生一个 `data: ""` 的空事件；
 * 若原样交给 `onMessage`，`parseData("")` 返回空字符串，
 * 调用方执行 `state = payload ?? {}` 时空串不会被 `??` 兜住，
 * 整个页面状态会被清成空字符串（监控大屏表现为所有数值变 `—` / 0）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

/** 记录底层库实际收到的回调，便于直接驱动事件 */
type CapturedOptions = {
  onopen?: (response: unknown) => void | Promise<void>;
  onmessage?: (msg: { data?: string; event?: string; id?: string; retry?: number }) => void;
  onclose?: () => void;
  onerror?: (err: unknown) => number | void;
};

const captured: { options?: CapturedOptions } = {};

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: vi.fn((_url: string, options: CapturedOptions) => {
    captured.options = options;
    return Promise.resolve();
  }),
}));

// 未初始化的应用配置没有 http.baseUrl，补一个最小实现
vi.mock("@repo/config", () => ({
  getConfig: () => ({ http: { baseUrl: "" } }),
}));

/** 驱动一次 SSE 事件 */
function emit(data: string | undefined, extra?: { event?: string; id?: string }): void {
  captured.options?.onmessage?.({ data, ...extra });
}

describe("sse/client 心跳注释过滤", () => {
  beforeEach(() => {
    captured.options = undefined;
    vi.clearAllMocks();
  });

  it("空 data 事件（心跳注释产生）不触发 onMessage", async () => {
    const onMessage = vi.fn();
    const { createSseClient } = await import("../client");
    createSseClient("/v2/server/info/stream", { auth: false, onMessage });

    expect(captured.options?.onmessage).toBeTypeOf("function");
    emit("");
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("data 缺失（undefined / null）的事件同样被丢弃", async () => {
    const onMessage = vi.fn();
    const { createSseClient } = await import("../client");
    createSseClient("/v2/server/info/stream", { auth: false, onMessage });

    emit(undefined);
    emit(null as unknown as string);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("真实 JSON 事件正常透传，且按 JSON 解析", async () => {
    const onMessage = vi.fn();
    const { createSseClient } = await import("../client");
    createSseClient<{ hostname: string }>("/v2/server/info/stream", { auth: false, onMessage });

    emit(JSON.stringify({ hostname: "prod-node-01" }));
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ event: "message", data: { hostname: "prod-node-01" } }));
  });

  it("[DONE] 结束标记不被误过滤（OpenAI 流依赖它收尾）", async () => {
    const onMessage = vi.fn();
    const { createSseClient } = await import("../client");
    createSseClient("/v1/chat/completions", { auth: false, onMessage });

    emit("[DONE]");
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage.mock.calls[0][0].data).toBe("[DONE]");
  });

  it("心跳与真实事件混合时，只有真实事件到达业务", async () => {
    const received: unknown[] = [];
    const { createSseClient } = await import("../client");
    // 模拟 ServerMonitor 的写法：state = payload ?? {}
    let state: { hostname?: string } = { hostname: "rest-node" };
    createSseClient<{ hostname: string }>("/v2/server/info/stream", {
      auth: false,
      onMessage: (e) => {
        received.push(e.data);
        state = e.data ?? {};
      },
    });

    emit(""); // 心跳注释产生的空事件
    expect(state).toEqual({ hostname: "rest-node" });

    emit(JSON.stringify({ hostname: "sse-node" }));
    expect(received).toEqual([{ hostname: "sse-node" }]);
    expect(state).toEqual({ hostname: "sse-node" });

    emit(""); // 再次心跳，不得把已有数据清空
    expect(state).toEqual({ hostname: "sse-node" });
  });
});
