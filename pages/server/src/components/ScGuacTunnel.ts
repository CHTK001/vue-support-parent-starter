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
export function createScGuacTunnel(url: string): Guacamole.Tunnel {
  const tunnel: any = new Guacamole.Tunnel();

  let socket: WebSocket | null = null;
  let closed = false;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * sync 看门狗：guacd 协议要求客户端对服务端 sync 指令回发 sync，
   * 否则判定客户端假死并断连（实测 ~15s code=1000）。官方客户端在
   * display.flush 完成后回发，但 flush 走 requestAnimationFrame——
   * 页面失焦/rAF 停摆（后台标签页、headless）时回调永不执行。
   * 这里兜底：客户端 4s 内没回，隧道直接代回。
   */
  let syncWatchdog: ReturnType<typeof setTimeout> | null = null;
  let pendingSyncTs: string | null = null;

  function armSyncWatchdog(timestamp: string): void {
    pendingSyncTs = timestamp;
    if (syncWatchdog) return;
    syncWatchdog = setTimeout(() => {
      syncWatchdog = null;
      const ts = pendingSyncTs;
      pendingSyncTs = null;
      if (ts != null) tunnel.sendMessage("sync", ts);
    }, 4000);
  }

  function disarmSyncWatchdog(): void {
    if (syncWatchdog) { clearTimeout(syncWatchdog); syncWatchdog = null; }
    pendingSyncTs = null;
  }

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
      disarmSyncWatchdog();
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
    disarmSyncWatchdog();
    if (socket) {
      try { socket.close(); } catch { /* ignore */ }
      socket = null;
    }
    tunnel.setState(Guacamole.Tunnel.State.CLOSED);
  };

  tunnel.sendMessage = function (...elements: any[]): void {
    if (!tunnel.isConnected() || !socket || socket.readyState !== WebSocket.OPEN) return;
    if (elements.length === 0) return;

    // 客户端自己回了 sync → 撤销看门狗
    if (elements[0] === "sync") disarmSyncWatchdog();

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

  /**
   * 解析 Guacamole 协议指令流并派发 oninstruction（与官方 WebSocketTunnel.onmessage 一致）。
   *
   * 关键点：length 必须从 startIndex 起读（首指令时 startIndex=0）。
   * 官方实现靠 elementEnd=undefined 时 NaN 被 substring 钳到 0 达成同一效果；
   * 若把 elementEnd 初始化为 0，首条指令长度会少读一位 → parseInt 为 NaN →
   * startIndex 变 NaN → 整条 WS 消息被静默丢弃，画面永远渲染不出来。
   */
  function handleMessage(message: string): void {
    let startIndex = 0;
    let elementEnd: number | undefined;
    const elements: string[] = [];

    do {
      const lengthEnd = message.indexOf(".", startIndex);
      if (lengthEnd === -1) {
        return; // 指令不完整，等待下一段
      }

      const length = parseInt(message.substring(startIndex, lengthEnd), 10);
      if (isNaN(length)) {
        return;
      }
      startIndex = lengthEnd + 1;
      elementEnd = startIndex + length;

      const element = message.substring(startIndex, elementEnd);
      const terminator = message.substring(elementEnd, elementEnd + 1);
      elements.push(element);

      if (terminator === ";") {
        const opcode = elements.shift() ?? "";

        // 收到首条指令时置为 OPEN
        if (tunnel.state === Guacamole.Tunnel.State.CONNECTING) {
          tunnel.setState(Guacamole.Tunnel.State.OPEN);
        }

        // 服务端 sync → 武装看门狗（客户端先回则撤销）
        if (opcode === "sync" && elements.length > 0) {
          armSyncWatchdog(elements[0]);
        }

        if (opcode !== Guacamole.Tunnel.INTERNAL_DATA_OPCODE && tunnel.oninstruction) {
          tunnel.oninstruction(opcode, [...elements]);
        }
        elements.length = 0;
      }

      // 下一条指令从 terminator 之后开始
      startIndex = elementEnd + 1;
    } while (startIndex < message.length);
  }

  return tunnel as Guacamole.Tunnel;
}
