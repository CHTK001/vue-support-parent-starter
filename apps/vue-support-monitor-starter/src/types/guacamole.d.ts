/**
 * Guacamole Common JS 类型声明
 */

declare module 'guacamole-common-js' {
  export interface GuacamoleClient {
    currentState: number;
    onstatechange: ((state: number) => void) | null;
    onerror: ((error: any) => void) | null;
    onname: ((name: string) => void) | null;
    onclipboard: ((stream: any, mimetype: string) => void) | null;
    onfile: ((stream: any, mimetype: string, filename: string) => void) | null;
    onpipe: ((stream: any, mimetype: string, name: string) => void) | null;
    onsync: ((timestamp: number) => void) | null;
    
    connect(): void;
    disconnect(): void;
    getDisplay(): GuacamoleDisplay;
    sendMouseState(mouseState: any): void;
    sendKeyEvent(pressed: number, keysym: number): void;
    createClipboardStream(mimetype: string): any;
    createFileStream(mimetype: string, filename: string): any;
  }

  export interface GuacamoleDisplay {
    getElement(): HTMLCanvasElement;
    scale(scale: number): void;
  }

  export interface GuacamoleTunnel {
    disconnect(): void;
  }

  export interface GuacamoleMouse {
    onmousedown: ((mouseState: any) => void) | null;
    onmouseup: ((mouseState: any) => void) | null;
    onmousemove: ((mouseState: any) => void) | null;
  }

  export interface GuacamoleKeyboard {
    onkeydown: ((keysym: number) => void) | null;
    onkeyup: ((keysym: number) => void) | null;
  }

  export interface GuacamoleStringWriter {
    sendText(text: string): void;
    sendEnd(): void;
  }

  export interface GuacamoleArrayBufferWriter {
    sendData(data: ArrayBuffer): void;
    sendEnd(): void;
  }

  export class Client implements GuacamoleClient {
    static readonly IDLE: number;
    static readonly CONNECTING: number;
    static readonly WAITING: number;
    static readonly CONNECTED: number;
    static readonly DISCONNECTING: number;
    static readonly DISCONNECTED: number;

    currentState: number;
    onstatechange: ((state: number) => void) | null;
    onerror: ((error: any) => void) | null;
    onname: ((name: string) => void) | null;
    onclipboard: ((stream: any, mimetype: string) => void) | null;
    onfile: ((stream: any, mimetype: string, filename: string) => void) | null;
    onpipe: ((stream: any, mimetype: string, name: string) => void) | null;
    onsync: ((timestamp: number) => void) | null;

    constructor(tunnel: GuacamoleTunnel);
    connect(): void;
    disconnect(): void;
    getDisplay(): GuacamoleDisplay;
    sendMouseState(mouseState: any): void;
    sendKeyEvent(pressed: number, keysym: number): void;
    createClipboardStream(mimetype: string): any;
    createFileStream(mimetype: string, filename: string): any;
  }

  export class WebSocketTunnel implements GuacamoleTunnel {
    constructor(url: string);
    disconnect(): void;
  }

  export class Mouse implements GuacamoleMouse {
    onmousedown: ((mouseState: any) => void) | null;
    onmouseup: ((mouseState: any) => void) | null;
    onmousemove: ((mouseState: any) => void) | null;

    constructor(element: HTMLElement);
  }

  export class Keyboard implements GuacamoleKeyboard {
    onkeydown: ((keysym: number) => void) | null;
    onkeyup: ((keysym: number) => void) | null;

    constructor(element: HTMLElement | Document);
  }

  export class StringWriter implements GuacamoleStringWriter {
    constructor(stream: any);
    sendText(text: string): void;
    sendEnd(): void;
  }

  export class ArrayBufferWriter implements GuacamoleArrayBufferWriter {
    constructor(stream: any);
    sendData(data: ArrayBuffer): void;
    sendEnd(): void;
  }

  const Guacamole = {
    Client,
    WebSocketTunnel,
    Mouse,
    Keyboard,
    StringWriter,
    ArrayBufferWriter
  };

  export default Guacamole;
}
