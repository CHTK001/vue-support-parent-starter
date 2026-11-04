/**
 * 软件安装进度帧的纯逻辑归一
 *
 * <p>软件模块（{@code software-starter}）在安装 / 卸载 / 更新每落库一次就经全局 socket
 * 广播一帧 {@code {module:"software", event:"install-progress", data:{...}, dataId}}。
 * 归一放在这里、不放在 {@code processTasks.ts}，是为了两件事：</p>
 * <ol>
 *   <li><b>可测</b>：本文件不 import vue / socket / http，单测直接喂帧对象，
 *       不需要连服务端，也不需要 jsdom 之外的任何环境。</li>
 *   <li><b>可复用</b>：项目发布任务（{@code module="project"}）走的是「phase + 日志」
 *       语义，而安装走的是「状态码 + 百分比」语义。两种载荷各自归一，
 *       公共的浮层只吃归一后的字段，不必在模板里判断消息来源。</li>
 * </ol>
 *
 * <p><b>字段为什么容忍多种写法</b>：后端 {@code SocketInstallProgressPublisher} 在
 * {@code data} 里同时铺了通用步进字段（{@code percentage}/{@code status}/{@code dataId}）
 * 与安装上下文（{@code progress}/{@code statusCode}/{@code recordId}）。前端只认其中一套
 * 会在后端做一次字段清理时静默失联——表现为「进度条永远停在 0，但安装其实成功了」，
 * 这类静默失败比报错难查得多，所以这里两套都读，取到就用。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */

/** 订阅用模块标识，与后端 {@code SocketInstallProgressPublisher.MODULE} 对齐 */
export const INSTALL_MODULE = "software";

/** 订阅用事件名，与后端 {@code SocketInstallProgressPublisher.EVENT} 对齐 */
export const INSTALL_EVENT = "install-progress";

/**
 * 安装任务在浮层里的 taskId 前缀
 *
 * <p>浮层按 {@code taskId} 去重。安装记录标识是 {@code recordId}，与项目任务的
 * {@code taskId} 来自不同的表、不同的生成规则，理论上可能同形。加前缀后两类任务
 * 永不撞键，也不会因为撞键把一帧安装进度写进一个发布任务里。</p>
 */
export const INSTALL_TASK_PREFIX = "software:";

/** 后端状态码：已安装（终态·成功） */
const STATUS_INSTALLED = 2;

/** 后端状态码：卸载完成（终态·成功） */
const STATUS_UNINSTALLED = 5;

/**
 * 进度帧归一结果
 *
 * <p>字段名用浮动层的口径（{@code currentStep}/{@code progress}/{@code success}），
 * 这样 {@code processTasks.ts} 拿到后可以直接赋值，不必再做二次转换。</p>
 */
export interface InstallProgressFrame {
  /** 安装记录标识 */
  recordId: string;
  /** 浮动层任务 id（前缀 + recordId） */
  taskId: string;
  /** 软件标识，可为空串 */
  softwareId: string;
  /** 发起用户，可为空串 */
  userId: string;
  /** 设备标识，可为空串 */
  deviceId: string;
  /** 操作类型（已归一为 install / uninstall / upgrade） */
  operation: string;
  /** 操作中文名（安装 / 卸载 / 升级） */
  operationText: string;
  /** 浮层标题 */
  title: string;
  /** 状态码，未知为 -1 */
  statusCode: number;
  /** 状态中文名（如「已安装」），可为空串 */
  statusText: string;
  /** 进度 0~100 */
  progress: number;
  /** 进度说明或错误信息，可为空串 */
  message: string;
  /** 是否终态（不会再有后续帧） */
  finished: boolean;
  /** 终态是否为成功（非终态恒为 false） */
  success: boolean;
}

/**
 * 操作类型 → 中文名
 *
 * <p>{@code update} 归一到 {@code upgrade}：库里存的是 {@code update}，
 * 但浮动层与项目发布共用同一套操作标签（{@code upgrade} 才显示「升级」），
 * 归一后同一个操作在两处都显示中文，不会出现半截英文。</p>
 */
const OPERATION_LABELS: Record<string, string> = {
  install: "安装",
  uninstall: "卸载",
  upgrade: "升级",
  update: "升级",
  rollback: "回滚",
};

/**
 * 操作类型归一
 *
 * @param raw 原始操作类型，可为 {@code null}
 * @return 归一后的操作类型，未知时回落 {@code install}
 */
function normalizeOperation(raw: unknown): string {
  const op = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!op) {
    return "install";
  }
  return op === "update" ? "upgrade" : op;
}

/**
 * 数值字段收敛到 0~100
 *
 * <p>后端已做一次收敛，前端仍再收一次：socket 载荷可能来自旧版本服务端或
 * 中间转发层，越界值会让进度条溢出容器，负值会让它倒退。</p>
 *
 * @param raw 原始值，可为 {@code null}
 * @return 0~100 之间的整数
 */
function normalizeProgress(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * 从 socket 载荷解析一帧安装进度
 *
 * <p>入参可以是 {@code subscribe} 交付的整条 {@code WsMessage}，也可以是已经取出的
 * {@code data}；两种都接受，调用方不必记住该传哪一层。无法识别的载荷返回 {@code null}，
 * 由调用方静默丢弃——**不能**抛异常，一帧脏数据不该让整页的 socket 分发中断。</p>
 *
 * @param raw 原始载荷
 * @return 归一后的进度帧；缺 {@code recordId} 等关键字段时返回 {@code null}
 */
export function parseInstallProgress(raw: unknown): InstallProgressFrame | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const message = raw as Record<string, unknown>;
  const data =
    message.data && typeof message.data === "object"
      ? (message.data as Record<string, unknown>)
      : message;

  const recordId = firstText(data.recordId, data.dataId, message.dataId);
  if (!recordId) {
    return null;
  }

  const softwareId = firstText(data.softwareId, "");
  const operation = normalizeOperation(data.operation);
  const operationText = OPERATION_LABELS[operation] ?? "操作";
  const statusCode = typeof data.statusCode === "number" ? data.statusCode : -1;
  const progress = normalizeProgress(data.progress ?? data.percentage);
  const finished =
    typeof data.finished === "boolean"
      ? data.finished
      : statusCode === STATUS_INSTALLED ||
        statusCode === STATUS_UNINSTALLED ||
        statusCode === 3 ||
        statusCode === 7;
  const success = finished && (statusCode === STATUS_INSTALLED || statusCode === STATUS_UNINSTALLED);

  return {
    recordId,
    taskId: INSTALL_TASK_PREFIX + recordId,
    softwareId,
    userId: firstText(data.userId, ""),
    deviceId: firstText(data.deviceId, ""),
    operation,
    operationText,
    title: buildTitle(operationText, softwareId),
    statusCode,
    statusText: firstText(data.statusText, ""),
    progress,
    message: firstText(data.message, ""),
    finished,
    success,
  };
}

/**
 * 组装浮层标题
 *
 * <p>后端帧里只有软件标识，没有软件名称（名称要再查一次库，推送时不做这件事）。
 * 因此标题用「操作 + 标识」，标识缺失时只留操作，绝不显示 {@code undefined}。</p>
 *
 * @param operationText 操作中文名
 * @param softwareId    软件标识
 * @return 标题
 */
function buildTitle(operationText: string, softwareId: string): string {
  return softwareId ? `${operationText} ${softwareId}` : operationText;
}

/**
 * 生成一帧的内容指纹
 *
 * <p>后端 {@code SocketInstallProgressPublisher} 对同一帧<b>同时</b>走了两条通道：
 * {@code broadcast}（所有观察者）与 {@code sendToUser}（发起人兜底）。而发起人本身就在
 * 广播受众里，于是同一帧会到达同一页面<b>两次</b>。载荷是同一个序列化字符串，两次
 * 内容完全一致，因此用内容指纹可以精确识别这种重复。</p>
 *
 * <p>不去重的表现不是报错，而是浮层日志里每行都出现两遍（「准备安装」×2、
 * 「安装失败」×2）——看起来像后端发了两次，实际是投递通道重叠，
 * 排查时极易误判成推送逻辑重复推送。</p>
 *
 * <p>指纹只比较<b>会改变展示</b>的字段。同一个指纹被跳过是安全的：跳过的那一帧
 * 本来也不会让界面产生任何变化。反过来，若两帧之间有任何可见差异，指纹必然不同，
 * 不会被误吞。</p>
 *
 * @param frame 归一后的进度帧
 * @return 内容指纹
 */
export function frameFingerprint(frame: InstallProgressFrame): string {
  return [
    frame.recordId,
    frame.statusCode,
    frame.progress,
    frame.finished ? 1 : 0,
    frame.success ? 1 : 0,
    frame.statusText,
    frame.message,
  ].join("\u0001");
}

/**
 * 取第一个非空文本
 *
 * @param values 候选值
 * @return 第一个去掉首尾空白后非空的字符串，全空时返回空串
 */
function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}
