import Guacamole from 'guacamole-common-js';

/**
 * 自定义 Guacamole WebSocket 隧道
 *
 * 原版 Guacamole.WebSocketTunnel 硬编码 WebSocket subprotocol "guacamole"，
 * 且无条件在 URL 后追加 "?token"；当后端 Spring WebSocket 未协商 subprotocol
 * 时浏览器会判定握手失败（Invalid WebSocket Header）。
 *
 * 注意：Guacamole.Tunnel 基类在构造函数中以 `this.connect = function(){}` 赋值
 * 实例属性，会覆盖子类 prototype 上的同名方法，因此本类必须把方法定义为
 * 实例属性（在构造函数内赋值），不能使用 class 方法语法。
 */
export function createReGuacTunnel(url: string): Guacamole.Tunnel {
  const tunnel: any = new Guacamole.Tunnel();

  let socket: WebSocket | null = null;
  let closed = false;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  tunnel.connect = function (): void {
    closed = false;
    tunnel.setState(Guacamole.Tunnel.State.CONNECTING);

    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => {
      tunnel.setState(Guacamole.Tunnel.State.OPEN);
      // 心跳：维持连接（可选）
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(Guacamole.Tunnel.INTERNAL_DATA_OPCODE + '.0.;');
        }
      }, 10000);
    };

    ws.onmessage = (event: MessageEvent) => {
      handleMessage(String(event.data));
    };

    ws.onclose = (event: CloseEvent) => {
      if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
      if (closed) return;
      tunnel.setState(Guacamole.Tunnel.State.CLOSED);
      if (tunnel.onerror) {
        tunnel.onerror(new Guacamole.Status(
          Guacamole.Status.Code.UPSTREAM_NOT_FOUND,
          event.reason || 'WebSocket closed: ' + event.code,
        ));
      }
    };
  };

  tunnel.disconnect = function (): void {
    closed = true;
    if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
    if (socket) {
      try { socket.close(); } catch { /* ignore */ }
      socket = null;
    }
    tunnel.setState(Guacamole.Tunnel.State.CLOSED);
  };

  tunnel.sendMessage = function (...elements: any[]): void {
    if (!tunnel.isConnected() || !socket || socket.readyState !== WebSocket.OPEN) return;
    if (elements.length === 0) return;

    const getElement = (value: any): string => {
      const str = String(value);
      return str.length + '.' + str;
    };

    let message = getElement(elements[0]);
    for (let i = 1; i < elements.length; i++) {
      message += ',' + getElement(elements[i]);
    }
    message += ';';
    socket.send(message);
  };

  /** 解析 Guacamole 协议指令流并派发 oninstruction（与 WebSocketTunnel.onmessage 一致） */
  function handleMessage(message: string): void {
    let startIndex = 0;
    let elementEnd = 0;

    do {
      const lengthEnd = message.indexOf('.', startIndex);
      if (lengthEnd === -1) {
        return;
      }

      const length = parseInt(message.substring(elementEnd + 1, lengthEnd), 10);
      startIndex = lengthEnd + 1;
      elementEnd = startIndex + length;

      const element = message.substring(startIndex, elementEnd);
      const terminator = message.substring(elementEnd, elementEnd + 1);

      if (terminator === ';') {
        // 解析整条指令的所有参数
        const all = message.substring(0, elementEnd + 1);
        const elements: string[] = [];
        let i = 0;
        while (i < all.length) {
          const dot = all.indexOf('.', i);
          if (dot === -1) break;
          const len = parseInt(all.substring(i, dot), 10);
          if (isNaN(len)) break;
          const valStart = dot + 1;
          const valEnd = valStart + len;
          if (valEnd > all.length) break;
          elements.push(all.substring(valStart, valEnd));
          i = valEnd;
          if (all.charAt(valEnd) === ';') break;
          i += 1; // 跳过逗号
        }

        const opcode = elements.shift() ?? '';

        // 第一条指令时置为 OPEN
        if (tunnel.state === Guacamole.Tunnel.State.CONNECTING) {
          tunnel.setState(Guacamole.Tunnel.State.OPEN);
        }

        if (opcode !== Guacamole.Tunnel.INTERNAL_DATA_OPCODE && tunnel.oninstruction) {
          tunnel.oninstruction(opcode, elements);
        }
      }

      startIndex = elementEnd + 1;
    } while (startIndex < message.length);
  }

  return tunnel as Guacamole.Tunnel;
}
