/**
 * ReFlowGraph 的 DAG 端口方向规则
 *
 * 刻意独立成文件、且不引用任何 X6 类型：这是 engine.ts 连线校验里唯一带业务判断的一段，
 * 抽成纯函数才能脱离画布单独验证（headless 环境下端口到端口的合成拖拽落点不稳定，
 * 靠 UI 断言这条规则会得到不可复现的结论）。
 *
 * 语义对齐 X6 官方 DAG 示例（https://x6.antv.antgroup.com/examples/showcase/practices/#dag
 * 源码 site/examples/showcase/practices/demo/dag.tsx）：top 是入边锚、bottom 是出边锚。
 */

/** 四向端口名，与 shapes.ts 的 flowPortGroups() / flowPortItems() 保持一致 */
export type FlowPortName = "top" | "right" | "bottom" | "left";

/** 只作入边的锚点（连线的目标端） */
const INLET_PORT: FlowPortName = "top";

/** 只作出边的锚点（连线的源端） */
const OUTLET_PORT: FlowPortName = "bottom";

/**
 * 判断一次连线在端口方向上是否合法。
 *
 * 与官方示例的差别见 engine.ts 文件头：官方用 `validateMagnet` 表达这条规则，但该回调
 * 的签名只有 `{cell, view, magnet, e}`，拿不到源/目标方向，物理上表达不了「top 只作入边」。
 * 本组件走 `bottom → top` 端口连线，改在能拿到两端端口的 `validateConnection` 上落地。
 *
 * 端口为 {@code null} 表示落在节点本体（`allowNode` 通道），不属于方向违规，一律放行。
 *
 * @param sourcePort 连线源端端口名，{@code null} 表示源落在节点本体
 * @param targetPort 连线目标端端口名，{@code null} 表示目标落在节点本体
 * @return 方向合法返回 {@code true}，否则返回 {@code false}
 */
export function isDagTerminalAllowed(
  sourcePort: string | null | undefined,
  targetPort: string | null | undefined,
): boolean {
  if (sourcePort === INLET_PORT) {
    return false;
  }
  if (targetPort === OUTLET_PORT) {
    return false;
  }
  return true;
}
