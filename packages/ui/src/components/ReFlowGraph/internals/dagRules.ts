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

// ------------------------------------------------------------
// 环检测（checkStructure 的 CYCLE 规则本体）
// ------------------------------------------------------------

/** {@link findFlowCycle} 的结果：环上的节点与连线 id */
export interface FlowCycleProbe {
  /** 环上的节点 id（按环的行走顺序） */
  nodeIds: string[];
  /** 环内的连线 id（两端都落在环节点上） */
  edgeIds: string[];
}

/**
 * 在有向图里找一个环（强连通分量）。
 *
 * <p>用 Tarjan 强连通分量：大小 &gt; 1 的分量即环；自环（from === to）跳过 ——
 * 它由 checkStructure 的 {@code SELF_LOOP} 单独报告，这里再报一遍会一条边吃两条告警。</p>
 *
 * <p>刻意只返回<b>第一个</b>环：多环图一次全报会刷满问题条，用户也是逐个修；
 * 修掉一个环再跑一次校验自然会露出下一个。</p>
 *
 * <p>参数收最小结构（{@code id} / {@code from} / {@code to}），与 FlowNode/FlowEdge
 * 结构兼容，本文件保持零依赖、可 headless 单测。</p>
 *
 * @param nodes 全部节点（只读 id）
 * @param edges 全部连线（只读 id/from/to）
 * @returns 环上的节点（按行走顺序）与连线；无环时两个数组皆为空
 */
export function findFlowCycle(
  nodes: ReadonlyArray<{ id: string }>,
  edges: ReadonlyArray<{ id: string; from: string; to: string }>,
): FlowCycleProbe {
  // 邻接表；只保留两端都已知且非自环的边
  const adj = new Map<string, Array<{ to: string; edgeId: string }>>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (e.from === e.to) return;
    adj.get(e.from)?.push({ to: e.to, edgeId: e.id });
  });

  // 迭代式 Tarjan：递归版在深链路（几百节点串成一条）上有栈溢出风险
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  let counter = 0;
  let found: string[] | null = null;

  const strongConnect = (start: string) => {
    // 帧里存节点与其邻接表游标，回溯时用子节点 low 更新父 low
    const frames: Array<{ v: string; i: number }> = [{ v: start, i: 0 }];
    index.set(start, counter);
    low.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);

    while (frames.length) {
      const frame = frames[frames.length - 1];
      const next = adj.get(frame.v)?.[frame.i];
      frame.i += 1;
      if (next) {
        if (!index.has(next.to)) {
          index.set(next.to, counter);
          low.set(next.to, counter);
          counter += 1;
          stack.push(next.to);
          onStack.add(next.to);
          frames.push({ v: next.to, i: 0 });
        } else if (onStack.has(next.to)) {
          low.set(frame.v, Math.min(low.get(frame.v) ?? 0, index.get(next.to) ?? 0));
        }
        continue;
      }
      // 邻接耗尽：回溯，把 low 传给父帧
      frames.pop();
      const parent = frames[frames.length - 1];
      if (parent) {
        low.set(parent.v, Math.min(low.get(parent.v) ?? 0, low.get(frame.v) ?? 0));
      }
      if (low.get(frame.v) === index.get(frame.v)) {
        const comp: string[] = [];
        for (;;) {
          const w = stack.pop() as string;
          onStack.delete(w);
          comp.push(w);
          if (w === frame.v) break;
        }
        if (comp.length > 1) {
          found = comp;
          return;
        }
      }
      if (found) return;
    }
  };

  for (const n of nodes) {
    if (found) break;
    if (!index.has(n.id)) strongConnect(n.id);
  }
  if (!found) {
    return { nodeIds: [], edgeIds: [] };
  }
  const members = new Set(found);
  // 按边的图序走出一条环路径，message 里能直接读出 A → B → C → A
  const start = found[0];
  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cur: string = start;
  const seen = new Set<string>([cur]);
  nodeIds.push(cur);
  while (nodeIds.length <= members.size) {
    const step = edges.find(
      (e) => e.from === cur && members.has(e.to) && (e.to === start || !seen.has(e.to)),
    );
    if (!step) break;
    edgeIds.push(step.id);
    if (step.to === start) break;
    cur = step.to;
    seen.add(cur);
    nodeIds.push(cur);
  }
  return { nodeIds, edgeIds };
}

// ------------------------------------------------------------
// 链路追踪（选中节点/连线后高亮上下游）
// ------------------------------------------------------------

/**
 * 以某个焦点（节点或连线）为原点，收集它的全部上游边与下游边。
 *
 * <p>上游 = 沿连线逆向能走到焦点的所有边；下游 = 从焦点正向能走到的所有边。
 * 只在图上做 BFS，不懂业务语义，供「链路追踪高亮」使用。</p>
 *
 * @param edges      全部连线
 * @param focusId    焦点 id（节点 id 或连线 id，由 {@code focusIsEdge} 区分）
 * @param focusIsEdge true 时焦点是连线：该边自身计入双侧，并从其两端向外扩散
 * @returns 上游 / 下游边 id 集合
 */
export function collectTraceEdgeIds(
  edges: ReadonlyArray<{ id: string; from: string; to: string }>,
  focusId: string,
  focusIsEdge: boolean,
): { up: string[]; down: string[] } {
  const byId = new Map(edges.map((e) => [e.id, e]));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  edges.forEach((e) => {
    const up = incoming.get(e.to) ?? [];
    if (!incoming.has(e.to)) incoming.set(e.to, up);
    up.push(e.id);
    const down = outgoing.get(e.from) ?? [];
    if (!outgoing.has(e.from)) outgoing.set(e.from, down);
    down.push(e.id);
  });

  const focusEdge = focusIsEdge ? byId.get(focusId) : undefined;
  if (focusIsEdge && !focusEdge) {
    return { up: [], down: [] };
  }
  const up: string[] = focusIsEdge ? [focusEdge!.id] : [];
  const down: string[] = focusIsEdge ? [focusEdge!.id] : [];

  /**
   * 从起点沿给定方向的邻接表 BFS，把沿途边 id 收进 bucket。
   *
   * @param start   起始节点 id
   * @param bucket  收集结果的数组（up 或 down）
   * @param nextOf  前进方向的邻接表（上游取 incoming，下游取 outgoing）
   * @param otherEnd 前进时「对端节点」的取法（上游取 from，下游取 to）
   */
  const collect = (
    start: string,
    bucket: string[],
    nextOf: (n: string) => string[] | undefined,
    otherEnd: (e: { from: string; to: string }) => string,
  ): void => {
    const queue = [start];
    const seen = new Set(queue);
    while (queue.length) {
      const n = queue.shift() as string;
      for (const eid of nextOf(n) ?? []) {
        bucket.push(eid);
        const other = otherEnd(byId.get(eid) as { from: string; to: string });
        if (!seen.has(other)) {
          seen.add(other);
          queue.push(other);
        }
      }
    }
  };

  collect(focusIsEdge ? focusEdge!.from : focusId, up, (n) => incoming.get(n), (e) => e.from);
  collect(focusIsEdge ? focusEdge!.to : focusId, down, (n) => outgoing.get(n), (e) => e.to);
  return { up, down };
}
