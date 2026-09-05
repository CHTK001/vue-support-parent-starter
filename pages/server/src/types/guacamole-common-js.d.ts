/**
 * guacamole-common-js 类型垫片
 *
 * 社区包(1.5.0)以默认导出聚合全部类，无官方类型；
 * 此处仅声明本项目使用的最小 API 面。
 *
 * 采用 namespace 模式：把全部类放进 `Guacamole` 命名空间并 `export default`，
 * 从而 `import Guacamole from 'guacamole-common-js'` 后：
 *  - 运行时值：new Guacamole.Tunnel() / Guacamole.Status.Code ...
 *  - 类型空间：Guacamole.Tunnel / Guacamole.Status / Guacamole.Client ...
 */
declare module 'guacamole-common-js' {
  namespace Guacamole {
    /** 隧道抽象：负责与网关的指令收发 */
    class Tunnel {
      /** 隧道状态枚举 */
      static State: {
        readonly IDLE: number;
        readonly OPENING: number;
        readonly OPEN: number;
        readonly CLOSED: number;
        /** 兼容既有: CONNECTING 别名 OPENING */
        readonly CONNECTING: number;
      };
      /** 内部数据 opcode（协议层占位，通常为空字符串） */
      static INTERNAL_DATA_OPCODE: string;

      /** 指令接收回调 */
      oninstruction: ((opcode: string, parameters: string[]) => void) | null;
      /** 隧道状态变化回调 */
      onstatechange: ((state: number) => void) | null;
      /** 错误回调 */
      onerror: ((status: Status) => void) | null;
      /** 当前状态值（与 State 枚举对应） */
      state: number;
      connect(data?: string): void;
      disconnect(): void;
      /** 是否处于连接中/已打开 */
      isConnected(): boolean;
      /** 更新状态并触发 onstatechange */
      setState(state: number): void;
      /** 协议指令发送 */
      sendMessage(...elements: unknown[]): void;
    }

    /** 状态码 */
    class Status {
      /** 状态码枚举 */
      static Code: {
        readonly SUCCESS: number;
        readonly UNKNOWN: number;
        readonly SERVER_ERROR: number;
        readonly CLIENT_TUNNEL_CLOSED: number;
        readonly UPSTREAM_NOT_FOUND: number;
        readonly UPSTREAM_UNAVAILABLE: number;
        readonly UPSTREAM_TIMEOUT: number;
        readonly UPSTREAM_CLOSED: number;
        readonly INSECURE_CONNECTION: number;
        readonly CLIENT_BAD_SESSION: number;
        readonly CLIENT_BAD_REQUEST: number;
        readonly CLIENT_OVERRIDDEN: number;
        readonly CLIENT_UNAUTHORIZED: number;
        readonly CLIENT_FORBIDDEN: number;
        readonly CLIENT_NOT_FOUND: number;
        readonly SESSION_CONFLICT: number;
        readonly SESSION_CLOSED: number;
        readonly SESSION_TIMEOUT: number;
      };
      code: number;
      message: string;
      constructor(code: number, message: string);
    }

    /** WebSocket 隧道实现 */
    class WebSocketTunnel extends Tunnel {
      constructor(url: string);
    }

    /** 客户端：封装握手、输入事件与渲染分发 */
    class Client {
      static readonly STATE_IDLE: number;
      static readonly STATE_CONNECTING: number;
      static readonly STATE_CONNECTED: number;
      static readonly STATE_DISCONNECTED: number;

      onerror: ((status: Status) => void) | null;
      onstatechange: ((state: number) => void) | null;
      onname: ((name: string) => void) | null;
      onclipboard: ((stream: unknown, mimetype: string) => void) | null;

      constructor(tunnel: Tunnel);
      connect(data?: string): void;
      disconnect(): void;
      /** 获取渲染层显示对象 */
      getDisplay(): Display;
      sendSize(width: number, height: number): void;
      sendKeyEvent(pressed: boolean | number, keysym: number): void;
      sendMouseState(state: MouseState): void;
      createClipboardStream(mimetype: string): StringWriter;
    }

    /** 显示层：多层 canvas 渲染 */
    class Display {
      getElement(): HTMLElement;
      scale: number;
      getWidth(): number;
      getHeight(): number;
      resize(width: number, height: number): void;
      getDefaultLayer(): Layer;
      getCursorLayer(): Layer;
      onresize: ((width: number, height: number) => void) | null;
      oncursor: ((canvas: HTMLCanvasElement, x: number, y: number) => void) | null;
    }

    /** 图层 */
    class Layer {
      canvas: HTMLCanvasElement;
    }

    /** 鼠标状态 */
    class MouseState {
      x: number;
      y: number;
      left: boolean;
      middle: boolean;
      right: boolean;
      up: boolean;
      down: boolean;
    }

    /** 鼠标事件封装 */
    class Mouse {
      constructor(element: HTMLElement);
      onmousedown: ((state: MouseState) => void) | null;
      onmouseup: ((state: MouseState) => void) | null;
      onmousemove: ((state: MouseState) => void) | null;
    }

    /** 键盘事件封装 */
    class Keyboard {
      constructor(element?: HTMLElement | Document);
      onkeydown: ((keysym: Keysym) => void) | null;
      onkeyup: ((keysym: Keysym) => void) | null;
      reset(): void;
    }

    /** 键码对象（含 X11 keysym） */
    class Keysym {
      keysym: number;
    }

    /** 字符串读取流 */
    class StringReader {
      ontext: ((text: string) => void) | null;
      onend: (() => void) | null;
    }

    /** 字符串写入流 */
    class StringWriter {
      sendText(text: string): void;
      sendEnd(): void;
    }
  }

  export default Guacamole;
}