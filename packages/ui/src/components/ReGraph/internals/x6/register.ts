/**
 * X6 节点 / 连线形状注册
 *
 * 每个节点类型（start / llm / knowledge / tool / condition / ...）都注册为一个
 * 独立的 Vue 形状（基于 @antv/x6-vue-shape），渲染各自的 SFC 组件，拥有独立属性配置。
 * 连线为带箭头的有向边 `re-graph-edge`。
 */
import { Graph } from "@antv/x6";
import { register as registerVueShape } from "@antv/x6-vue-shape";
import { PORT_GROUPS, resolveNodeType } from "./nodeTypes";
import type { ReGraphEdge, ReGraphNode, ReGraphNodeType, ReGraphNodeTypeDef } from "./types";
import StartNode from "./nodes/StartNode.vue";
import EndNode from "./nodes/EndNode.vue";
import LlmNode from "./nodes/LlmNode.vue";
import KnowledgeNode from "./nodes/KnowledgeNode.vue";
import ToolNode from "./nodes/ToolNode.vue";
import ConditionNode from "./nodes/ConditionNode.vue";
import CodeNode from "./nodes/CodeNode.vue";
import HttpNode from "./nodes/HttpNode.vue";
import InputNode from "./nodes/InputNode.vue";
import OutputNode from "./nodes/OutputNode.vue";
import DefaultNode from "./nodes/DefaultNode.vue";

/** 类型 → Vue 组件映射（每个图形一个独立组件） */
export const NODE_COMPONENTS: Record<string, unknown> = {
  start: StartNode,
  end: EndNode,
  llm: LlmNode,
  knowledge: KnowledgeNode,
  tool: ToolNode,
  condition: ConditionNode,
  code: CodeNode,
  http: HttpNode,
  input: InputNode,
  output: OutputNode,
  default: DefaultNode,
};

let registered = false;

/** 端口组定义（锚点） */
export function portGroups() {
  const portAttrs = {
    circle: {
      r: 4,
      magnet: true,
      stroke: "#5b8ff9",
      strokeWidth: 1,
      fill: "#fff",
      style: { visibility: "visible" },
    },
  };
  return {
    top: { position: "top", attrs: portAttrs },
    right: { position: "right", attrs: portAttrs },
    bottom: { position: "bottom", attrs: portAttrs },
    left: { position: "left", attrs: portAttrs },
  } as const;
}

/** 注册所有 Vue 节点形状（按类型）与连线形状，幂等 */
export function ensureRegistered(extra: ReGraphNodeTypeDef[] = []): void {
  if (registered) return;
  registered = true;

  const overrides = new Map(extra.map((e) => [e.type, e]));
  Object.entries(NODE_COMPONENTS).forEach(([type, component]) => {
    const ov = overrides.get(type as ReGraphNodeType);
    const comp = (ov && (ov as { component?: unknown }).component) || component;
    registerVueShape({
      shape: `re-graph-node-${type}`,
      component: comp,
      width: 180,
      height: 44,
      ports: {
        groups: portGroups(),
        items: PORT_GROUPS.map((g) => ({ group: g, id: g })),
      },
    });
  });

  Graph.registerEdge(
    "re-graph-edge",
    {
      inherit: "edge",
      attrs: {
        line: {
          stroke: "#8c8c8c",
          strokeWidth: 1.5,
          targetMarker: { name: "block", width: 10, height: 8 },
        },
      },
      router: { name: "manhattan" },
      connector: { name: "rounded" },
      zIndex: 0,
    },
    true,
  );
}

/** 生成节点 metadata（shape 由类型决定，业务数据挂在 data 上供 Vue 组件读取） */
export function buildNodeMetadata(node: ReGraphNode) {
  const def = resolveNodeType(node.type);
  return {
    // shape 必须取 resolveNodeType 归一化后的类型，不能直接用 node.type：
    // 调色板只注册了 start/llm/knowledge/... 这一批，调用方传业务自定义类型
    // （如关系图谱的 person/location/event）时，直接拼接会得到未注册的 shape，
    // X6 会抛 "Node with name 'xxx' does not exist" 并导致整张图渲染不出来。
    shape: `re-graph-node-${def.type}`,
    id: node.id,
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.width ?? 180,
    height: node.height ?? 44,
    ports: {
      groups: portGroups(),
      items: PORT_GROUPS.map((g) => ({ group: g, id: g })),
    },
    data: {
      reType: node.type ?? def.type,
      reText: node.text,
      reData: node.data ?? {},
      reColor: node.color,
      reIcon: node.icon,
      locked: node.locked ?? false,
      hidden: node.hidden ?? false,
    },
  };
}

/** 生成连线 metadata（支持每种图形的 router / connector 差异） */
export function buildEdgeMetadata(
  edge: ReGraphEdge,
  opts?: { router?: string; connector?: string },
) {
  const fromPort = edge.fromPort ?? "bottom";
  const toPort = edge.toPort ?? "top";
  // 边的样式覆盖：X6 attrs，约定写在 { line: {...} } 下
  const userLine = ((edge.style ?? {}) as { line?: Record<string, unknown> }).line ?? {};
  const line = {
    stroke: "#8c8c8c",
    strokeWidth: 1.5,
    targetMarker: { name: "block", width: 10, height: 8 },
    ...userLine,
  };
  return {
    shape: "re-graph-edge",
    id: edge.id,
    source: { cell: edge.from, port: fromPort },
    target: { cell: edge.to, port: toPort },
    attrs: { line },
    router: { name: opts?.router ?? "manhattan" },
    connector: { name: opts?.connector ?? "rounded" },
    labels: edge.text ? [{ attrs: { label: { text: edge.text } } }] : [],
    data: { reData: edge.data ?? {}, animated: !!edge.animated },
  };
}
