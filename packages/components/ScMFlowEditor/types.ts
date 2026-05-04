import type { EditorData, NodeShape, NodeTypeName } from "../ScFlowEditor";

export type ScMFlowFieldComponent = "input" | "textarea" | "switch" | "select" | "number";

export interface ScMFlowOption {
  label: string;
  value: string | number | boolean;
}

export interface ScMFlowFieldSchema {
  field: string;
  label: string;
  component: ScMFlowFieldComponent;
  required?: boolean;
  defaultValue?: string | number | boolean;
  options?: ScMFlowOption[];
}

export interface ScMFlowPort {
  id: string;
  label: string;
  side: "left" | "right" | "top" | "bottom";
}

export interface ScMFlowPaletteItem {
  kind: string;
  title: string;
  detail: string;
  color: string;
  icon?: string;
  image?: string;
  editorType?: NodeTypeName;
  shape?: NodeShape;
  ports: ScMFlowPort[];
  schema: ScMFlowFieldSchema[];
}

export interface ScMFlowNode {
  id: string;
  kind: string;
  title: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  icon?: string;
  image?: string;
}

export interface ScMFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceOutput?: string;
  targetInput?: string;
}

export interface ScMFlowSchema {
  flowCode: string;
  flowVersion: number;
  flowName: string;
  flowScope?: string;
  nodes: ScMFlowNode[];
  edges: ScMFlowEdge[];
}

export interface ScMFlowEntry {
  flowCode: string;
  flowName: string;
}

export interface ScMFlowNodeMeta {
  id: string;
  kind: string;
  title: string;
  config: Record<string, any>;
  icon?: string;
  image?: string;
}

export interface ScMFlowEditorContext {
  editorData: EditorData;
  metaMap: Record<string, ScMFlowNodeMeta>;
}



