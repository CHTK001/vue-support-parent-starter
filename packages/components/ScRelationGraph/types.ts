export interface ScRelationGraphPaletteItem {
  kind: string;
  title: string;
  detail?: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
}

export interface ScRelationGraphNode {
  id: string;
  type?: "relation-rect" | "relation-circle" | "relation-diamond" | "relation-subflow" | "relation-image";
  label: string;
  icon?: string;
  kind?: string;
  position: { x: number; y: number };
  runtimeStatus?: string;
  displayInfo?: string;
  errorMessage?: string;
  executionRound?: number;
  containerSize?: [number, number];
  htmlContent?: string;
  imageUrl?: string;
}

export interface ScRelationGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  visited?: boolean;
  runtimeStatus?: string;
}
