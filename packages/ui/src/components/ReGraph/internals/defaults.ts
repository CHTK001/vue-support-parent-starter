/**
 * ReGraph 系列组件共享事件
 */
import type { RGLine, RGLink, RGNode, RGUserEvent } from "@relation-graph/vue3";

export interface ReGraphBaseEmits {
  (e: "ready", instance: unknown): void;
  (e: "node-click", node: RGNode, ev: RGUserEvent): void;
  (e: "line-click", line: RGLine, link: RGLink, ev: RGUserEvent): void;
}

/** 默认布局 */
export const LayoutDefaults = {
  force: {
    layoutName: "force",
    force_node_repulsion: 1000,
    force_line_elastic: 100,
    force_friction: 0.6,
    preventNodeOverlap: true,
    preventOverlapInnerPadding: 20,
  },
  mind: { layoutName: "mindmap" },
  tree: {
    layoutName: "tree",
    from: "top",
    distance_coefficient: 1.2,
  },
  circle: { layoutName: "circle" },
  center: { layoutName: "center" },
  fixed: { layoutName: "fixed" },
  relation: { layoutName: "center" },
} as const;
