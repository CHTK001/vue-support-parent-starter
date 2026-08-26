/**
 * guacamole-common-js 类型垫片
 *
 * 社区包(1.5.0)以默认导出聚合全部类，无官方类型；
 * 此处仅声明本项目使用的最小 API 面。
 */
declare module 'guacamole-common-js' {
  /** 隧道抽象：负责与网关的指令收发 */
  export class Tunnel {
    /** 指令接收回调 */
    oninstruction: ((opcode: string, parameters: string[]) => void) | null;
    /** 隧道状态变化回调 */
    onstatechange: ((state: number) => void) | null;
    /** 错误回调 */
    onerror: ((status: { code: number; message: string }) => void) | null;
    connect(data?: string): void;
    disconnect(): void;
  }

  /** WebSocket 隧道实现 */
  export class WebSocketTunnel extends Tunnel {
    constructor(url: string);
  }

  /** 客户端：封装握手、输入事件与渲染分发 */
  export class Client {
    static readonly STATE_IDLE: number;
    static readonly STATE_CONNECTING: number;
    static readonly STATE_CONNECTED: number;
    static readonly STATE_DISCONNECTED: number;

    onerror: ((status: { code: number; message: string }) => void) | null;
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
  export class Display {
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
  export class Layer {
    canvas: HTMLCanvasElement;
  }

  /** 鼠标状态 */
  export class MouseState {
    x: number;
    y: number;
    left: boolean;
    middle: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }

  /** 鼠标事件封装 */
  export class Mouse {
    constructor(element: HTMLElement);
    onmousedown: ((state: MouseState) => void) | null;
    onmouseup: ((state: MouseState) => void) | null;
    onmousemove: ((state: MouseState) => void) | null;
  }

  /** 键盘事件封装 */
  export class Keyboard {
    constructor(element?: HTMLElement | Document);
    onkeydown: ((keysym: Keysym) => void) | null;
    onkeyup: ((keysym: Keysym) => void) | null;
    reset(): void;
  }

  /** 键码对象（含 X11 keysym） */
  export class Keysym {
    keysym: number;
  }

  /** 字符串读取流 */
  export class StringReader {
    ontext: ((text: string) => void) | null;
    onend: (() => void) | null;
  }

  /** 字符串写入流 */
  export class StringWriter {
    sendText(text: string): void;
    sendEnd(): void;
  }

  /** 默认导出命名空间形态（兼容 import Guacamole from ...） */
  const GuacamoleNamespace: {
    Client: typeof Client;
    Display: typeof Display;
    Layer: typeof Layer;
    Keyboard: typeof Keyboard;
    Keysym: typeof Keysym;
    Mouse: typeof Mouse;
    MouseState: typeof MouseState;
    StringReader: typeof StringReader;
    StringWriter: typeof StringWriter;
    Tunnel: typeof Tunnel;
    WebSocketTunnel: typeof WebSocketTunnel;
  };

  export default GuacamoleNamespace;
}
