/**
 * rsocket-* 浏览器端 stub
 *
 * rsocket-core / rsocket-websocket-client 为 Flow 语法编写的 alpha 包（0.0.28），
 * 浏览器与 rolldown 均无法解析。本应用不使用 rsocket 协议，因此用 stub 替换，
 * 使 @repo/core 的 socket 模块可在浏览器中加载（createRSocketService 不会被调用）。
 */

export class RSocketClient {}

export class RSocketFlowable {}

export class Single {}

export const WellKnownMimeType = {
  APPLICATION_JSON: "application/json",
};

export default class RSocketWebSocketClient {
  connect() {
    return {
      subscribe() {
        return this;
      },
      cancel() {},
    };
  }
}
