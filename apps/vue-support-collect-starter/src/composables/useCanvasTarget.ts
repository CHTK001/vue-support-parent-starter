/**
 * 跨页跳转要打开的流程画布目标。
 *
 * 布局用 route.fullPath 当 keepAlive 的 key，靠 query 深链会换 key、重建画布实例，
 * 刚画好的流程丢在旧实例上，用户看到的是空画布。目标放在模块作用域里，
 * 谁挂载都只消费一次，与路由实例无关。
 */
let pendingFlowId = 0;

/** 登记要打开的流程（调用方随后再跳到画布页） */
export function openFlowOnCanvas(flowId: number): void {
  pendingFlowId = flowId > 0 ? flowId : 0;
}

/** 取出并清空目标；没有目标返回 0 */
export function takeCanvasFlowId(): number {
  const id = pendingFlowId;
  pendingFlowId = 0;
  return id;
}

/**
 * 只看有没有目标，不消费。
 *
 * 画布页激活时用它决定要不要走"脏画布不重载 metas"的窄路径：有目标就必须走完整重载，
 * 否则深链会被静默丢掉（打开流程前本来就要过一次丢弃确认，不会亏掉草稿）。
 */
export function peekCanvasFlowId(): number {
  return pendingFlowId;
}
