import type {
  Batch,
  ClientMsg,
  HubMsg,
  Transport,
  TransportStatus,
} from "@p10node/office-engine/collab";
import { authHeaders, collabCurrentUserId } from "../api/filestorageApi";
import { apiOrigin } from "../api/connection";

/** 保存快照时回传的上下文条目（与引擎 {@code session.context()} 同形状） */
export interface CollabContextEntry {
  seq: number;
  site: number;
  ops: unknown[];
}

/**
 * 实时协同传输层：SSE 下行 + POST 上行。
 *
 * <p><b>为什么不用 WebSocket。</b>文件服务守住「8082 单端口单实例」，而
 * {@code @p10node/office-engine} 的 {@link Transport} 是一个纯接口 —— 实现它即可
 * 接任意后端。SSE 就是一条普通 HTTP 长连接：网关、鉴权过滤器、反向代理都不用
 * 额外开口子，断线由浏览器原生处理；上行用独立 POST，两条请求靠 {@code clientId}
 * 关联，协议内容仍然是引擎原生的 {@code ClientMsg / HubMsg}，一个字段都没有自造。</p>
 *
 * <p><b>握手顺序。</b>引擎的 {@code CollabSession} 只在 {@code onStatus('open')}
 * 时才发 {@code hello}。所以这里必须在 fetch 拿到响应头（或读到服务端首个
 * {@code open} 事件）后立刻上报 open，否则两边都在等对方先开口。</p>
 *
 * <p><b>断线重连。</b>指数退避（0.5s 起，封顶 10s，带抖动）。重连成功后引擎会带
 * {@code have + site} 重新 hello，hub 只补发缺的批次，不需要重新加载文档。</p>
 */
export class CollabHubTransport implements Transport {
  /** 下行消息回调（引擎会话注入） */
  onMessage?: (msg: HubMsg) => void;

  /** 连接状态回调（引擎会话注入） */
  onStatus?: (status: TransportStatus) => void;

  /** 协同文档号 */
  private readonly collabId: string;

  /** 编辑器实例标识（上下行两条请求的关联键，整个实例生命周期内稳定） */
  private readonly clientId: string;

  /** 已主动关闭 */
  private closed = false;

  /** 重连次数（成功连上后归零） */
  private retry = 0;

  /** 当前下行请求的中止器 */
  private abort: AbortController | null = null;

  /** 重连定时器 */
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /** 静默看门狗定时器 */
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;

  /** 存活探针是否在飞（避免探针互相叠加） */
  private probing = false;

  /** 最近一次收到数据的时间（调试 / 断言用） */
  private lastSeenAt = 0;

  /**
   * 静默上限（毫秒）。
   *
   * <p><b>为什么必须有它。</b>服务端每 25s 推一次 {@code ping}；只要一个 ping 周期
   * 以上收不到任何字节，就说明这条 HTTP 长连接已经名存实亡。典型场景是后端重启：
   * 浏览器这一侧的 socket 可能被代理一直挂着不关，{@code reader.read()} 永远不返回
   * {@code done}，传输层就永远不会重连 —— 页面还显示「协同在线」，实际上行已经
   * 全部打到新进程上并被「下行流未建立」拒绝。</p>
   */
  private readonly idleLimit = 55_000;

  /** 已应用的最新序列号（= 引擎 {@code session.rev}） */
  private rev = 0;

  /** 快照上下文日志（与引擎 {@code session.context()} 对齐，按 seq 升序） */
  private log: CollabContextEntry[] = [];

  /** 上下文保留条数（与引擎 {@code logWindow} 默认值一致） */
  private readonly logWindow = 5000;

  /** 已发出但尚未收到回声批次的操作号（保存前必须为 0，否则文件内容会超前于 seq） */
  private readonly inflightIds = new Set<string>();

  /** 本连接在 hub 的房间站点号（welcome 下发） */
  private siteNo = 0;

  /** 是否已经完成首次 welcome（用于区分「首连取 ctx」与「重连保留日志」） */
  private joined = false;

  /**
   * 构造。
   *
   * @param collabId 协同文档号（= hub 房间号）
   */
  constructor(collabId: string) {
    this.collabId = collabId;
    // crypto.randomUUID 在非安全上下文（http://内网地址）下不可用，必须兜底
    const random =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    this.clientId = random;
  }

  /** 连接标识（测试脚本可读，便于关联上下行） */
  get id(): string {
    return this.clientId;
  }

  /** 已应用的最新序列号 */
  get lastSeq(): number {
    return this.rev;
  }

  /** 本连接的房间站点号（welcome 之后才有效） */
  get site(): number {
    return this.siteNo;
  }

  /** 在飞的操作批次数（>0 表示本地还有未定序的改动） */
  get pending(): number {
    return this.inflightIds.size;
  }

  /**
   * 快照上下文：文档内容对应的 seq 之前最近的若干批次。
   *
   * <p>与引擎 {@code CollabSession.context()} 同语义（{@code log.slice(-n)}），
   * 服务端 {@code POST /{id}/hub/snapshot} 收到的 {@code ctx} 就来自这里。
   * 没有它，新加入者从快照打开后收到「基于更早状态」的批次时会直接报
   * {@code Operation is too old to merge}。</p>
   *
   * @param n 最多返回多少条（默认与引擎一致 5000）
   * @returns 按 seq 升序的批次条目
   */
  context(n = this.logWindow): CollabContextEntry[] {
    return n > 0 ? this.log.slice(-n) : [];
  }

  /**
   * 建立下行流（由引擎会话构造时调用）。
   */
  connect(): void {
    if (this.closed) {
      return;
    }
    void this.openStream();
  }

  /**
   * 上行：把客户端消息 POST 给 hub。
   *
   * <p>失败不在这里重试：操作批次由引擎按 {@code base} 在重连后重发，
   * 传输层再补发一次反而会在 hub 侧变成两个不同 id 的重复批次。</p>
   *
   * @param msg 客户端消息
   */
  send(msg: ClientMsg): void {
    if (this.closed) {
      return;
    }
    if (msg.t === "ops") {
      this.inflightIds.add(msg.id);
    }
    const params = new URLSearchParams();
    params.set("clientId", this.clientId);
    params.set("userId", collabCurrentUserId());
    void fetch(`${this.baseUrl()}/${encodeURIComponent(this.collabId)}/hub?${params.toString()}`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(msg),
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        // 后端重启后，浏览器这侧的旧 SSE socket 可能被代理挂住不关：downlink 看起来还在，
        // 上行却已经落到新进程上。新进程不认这条流，会回 success=false。
        // 这是「连接已经死了」的最可靠证据 —— 立刻重建下行流并重新 hello，
        // 不能等 ping 超时（用户会先打出一串不收敛的编辑）。
        if (!response.ok) {
          this.forceReconnect();
          return;
        }
        const text = await response.text();
        try {
          const parsed = JSON.parse(text) as { success?: boolean; msg?: string };
          // 只对「这条下行流已经不存在」的两条业务错误重连：
          // 其余错误（无权限、文档不存在）重连也没用，交给引擎报错即可。
          if (parsed && parsed.success === false && /下行流未建立|尚未完成协同握手/.test(parsed.msg ?? "")) {
            this.forceReconnect();
          }
        } catch {
          // 非 JSON（代理返回 HTML 错误页）：按连接已坏处理
          this.forceReconnect();
        }
      })
      .catch(() => {
        // 下行断了会触发重连；上行失败由引擎在重连后按 seq 重发
      });
  }

  /**
   * 主动关闭（组件卸载）。
   */
  close(): void {
    this.closed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.stopWatchdog();
    this.abort?.abort();
    this.abort = null;
    this.onStatus?.("closed");
  }

  /**
   * 立即判定当前下行流已死并重建。
   *
   * <p>用于「上行被拒」这种确定性证据：不再等 ping 超时，直接 abort 旧流，
   * 走重连分支重新 hello。重连成功后引擎会带 {@code have=rev} 补差，不会重放整份文档。</p>
   */
  private forceReconnect(): void {
    if (this.closed) {
      return;
    }
    this.retry = 0;
    const current = this.abort;
    if (current) {
      // abort 会让 read() 抛错，随后走统一的 closed → scheduleReconnect
      current.abort();
      return;
    }
    // 当前没有活着的流（正在退避等待）：直接提前重连
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    void this.openStream();
  }

  /**
   * 启动静默看门狗：每 5s 做两件事。
   *
   * <ol>
   *   <li><b>存活探针</b>：问服务端「这个 clientId 的下行流还在你身上吗」。
   *       后端重启 / 实例切换后答案立刻变 false，客户端马上重建流并重新 hello，
   *       不用等用户先产生上行流量。</li>
   *   <li><b>静默兜底</b>：连续 {@link #idleLimit} 收不到任何字节（含 ping），
   *       说明这条连接名存实亡，同样强制重连。</li>
   * </ol>
   */
  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      if (this.closed) {
        return;
      }
      const silent = Date.now() - this.lastSeenAt;
      if (this.lastSeenAt > 0 && silent > this.idleLimit) {
        // 先记一次时间，避免 abort 期间又被重复判定
        this.lastSeenAt = Date.now();
        this.forceReconnect();
        return;
      }
      void this.probeAlive();
    }, 5_000);
  }

  /**
   * 探一次连接存活（5s 一次，避免并发叠加）。
   */
  private async probeAlive(): Promise<void> {
    if (this.closed || this.probing || !this.abort) {
      return;
    }
    this.probing = true;
    try {
      const response = await fetch(
        `${this.baseUrl()}/${encodeURIComponent(this.collabId)}/hub/alive?clientId=${encodeURIComponent(this.clientId)}`,
        {
          method: "GET",
          headers: authHeaders(),
          cache: "no-store",
          credentials: "same-origin",
        },
      );
      if (!response.ok) {
        this.forceReconnect();
        return;
      }
      const body = (await response.json()) as { data?: { alive?: boolean } };
      if (body?.data?.alive === false) {
        this.forceReconnect();
      }
    } catch {
      // 探针失败本身不构成重连证据：网络抖动交给静默兜底判断
    } finally {
      this.probing = false;
    }
  }

  /** 停止静默看门狗 */
  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * 打开 SSE 下行流，读到流结束/出错后按退避重连。
   */
  private async openStream(): Promise<void> {
    if (this.closed) {
      return;
    }
    const controller = new AbortController();
    this.abort = controller;
    let opened = false;
    try {
      const response = await fetch(
        `${this.baseUrl()}/${encodeURIComponent(this.collabId)}/hub?clientId=${encodeURIComponent(this.clientId)}`,
        {
          method: "GET",
          headers: { ...authHeaders(), Accept: "text/event-stream" },
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        },
      );
      if (!response.ok || !response.body) {
        throw new Error(`协同下行流建立失败（HTTP ${response.status}）`);
      }
      // 响应头已到：服务端已注册这条流，可以发 hello 了
      opened = true;
      this.retry = 0;
      this.lastSeenAt = Date.now();
      this.startWatchdog();
      this.onStatus?.("open");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        this.lastSeenAt = Date.now();
        buffer += decoder.decode(value, { stream: true });
        let cut = buffer.indexOf("\n\n");
        while (cut >= 0) {
          const frame = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          this.dispatch(frame);
          cut = buffer.indexOf("\n\n");
        }
      }
    } catch {
      // 网络错误 / 被 abort：统一走下面的重连判断
    } finally {
      if (this.abort === controller) {
        this.abort = null;
      }
    }
    if (this.closed) {
      return;
    }
    // 流结束 = 连接断了（服务重启、代理超时、网络切换）
    this.stopWatchdog();
    this.onStatus?.("closed");
    if (opened) {
      this.retry = Math.min(this.retry + 1, 6);
    }
    this.scheduleReconnect();
  }

  /**
   * 解析一帧 SSE（{@code event: msg} / {@code data: {...}}）。
   *
   * @param frame 原始帧文本
   */
  private dispatch(frame: string): void {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      const clean = line.endsWith("\r") ? line.slice(0, -1) : line;
      if (!clean || clean.startsWith(":")) {
        continue;
      }
      if (clean.startsWith("event:")) {
        event = clean.slice(6).trim();
        continue;
      }
      if (clean.startsWith("data:")) {
        data.push(clean.slice(5).replace(/^ /, ""));
      }
    }
    if (event === "ping" || event === "open") {
      // 心跳 / 握手占位：只需要让连接保活，不产生协议消息
      return;
    }
    if (event !== "msg" || data.length === 0) {
      return;
    }
    let msg: HubMsg;
    try {
      msg = JSON.parse(data.join("\n")) as HubMsg;
    } catch {
      // 单条坏帧不能拖垮整条流
      return;
    }
    this.track(msg);
    this.onMessage?.(msg);
  }

  /**
   * 跟踪序列号与上下文（不改变协议消息，只做本地记账）。
   *
   * <p>引擎的 {@code session} 内部同样维护 {@code rev} 与 {@code log}，但
   * {@code mount()} 不把它暴露出来；而保存快照时必须同时告诉服务端
   * 「文件内容对应的 seq」和「快照点的上下文批次」，否则新加入者会从错误的
   * 位置重放。这里按引擎 {@code onBatch} 的同一口径记账：</p>
   * <ul>
   *   <li>{@code welcome}：首次加入用 {@code ctx} 作为日志起点，随后按序吸收
   *       {@code log}；重连保留已有日志。</li>
   *   <li>{@code batch}：{@code seq <= rev} 直接丢弃（重发/回声），其余追加并推进
   *       {@code rev}。</li>
   * </ul>
   *
   * @param msg 下行消息
   */
  private track(msg: HubMsg): void {
    if (msg.t === "welcome") {
      if (msg.reset) {
        return;
      }
      this.siteNo = msg.site;
      if (!this.joined) {
        this.log = (msg.ctx ?? []).map((entry) => ({
          seq: entry.seq,
          site: entry.site,
          ops: entry.ops ?? [],
        }));
        this.joined = true;
        // 首次加入：引擎 rev 从 base 起算，服务端用 from 回显这个 base
        this.rev = Math.max(this.rev, msg.from ?? 0);
      }
      for (const batch of msg.log ?? []) {
        this.absorb(batch);
      }
      this.trim();
      return;
    }
    if (msg.t === "batch") {
      this.absorb(msg.b);
      this.trim();
    }
  }

  /**
   * 吸收一个已定序的批次。
   *
   * @param batch 服务端批次
   */
  private absorb(batch: Batch): void {
    this.inflightIds.delete(batch.id);
    if (batch.seq <= this.rev) {
      return;
    }
    this.log.push({ seq: batch.seq, site: batch.site, ops: batch.ops ?? [] });
    this.rev = batch.seq;
  }

  /** 按窗口裁剪上下文，保持与引擎 {@code logWindow} 一致 */
  private trim(): void {
    if (this.log.length > this.logWindow) {
      this.log.splice(0, this.log.length - this.logWindow);
    }
  }

  /**
   * 安排一次退避重连。
   */
  private scheduleReconnect(): void {
    if (this.closed || this.retryTimer) {
      return;
    }
    const delay = Math.min(500 * 2 ** this.retry, 10_000) + Math.floor(Math.random() * 250);
    this.onStatus?.("connecting");
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.openStream();
    }, delay);
  }

  /**
   * 协同接口基址。
   *
   * <p>跟随连接设置（{@code filestorage.apiBase}）：本机前端连远端后端时，
   * 下行流与上行 POST 必须与普通接口同一个源，否则协同永远停在「连接中」。</p>
   *
   * @returns 绝对地址前缀
   */
  private baseUrl(): string {
    return `${apiOrigin()}/v2/file/collab`;
  }
}
