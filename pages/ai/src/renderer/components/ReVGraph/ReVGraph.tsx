/**
 * ReVGraph — VisActor VGraph 封装组件
 *
 * 提供统一的产品化图可视化能力，支持 DAG、树形、力导向等布局。
 * 布局类型和方向均使用枚举定义。
 *
 * @example
 * import { ReVGraph, ReVGraphLayoutType, GraphDirection } from '@pages/ai/renderer/components/ReVGraph';
 *
 * <ReVGraph
 *   data={{ nodes: [...], edges: [...] }}
 *   layoutType={ReVGraphLayoutType.DAG}
 *   direction={GraphDirection.TOP_TO_BOTTOM}
 * />
 */
import React, { useEffect, useRef } from 'react';
import { Graph, LAYOUT_TYPES } from '@visactor/vgraph';
import type { GraphConfigs } from '@visactor/vgraph';

// ─── 枚举定义 ─────────────────────────────────────────────────

/**
 * ReVGraph 布局类型枚举
 */
export enum ReVGraphLayoutType {
  /** DAG 有向无环图 — 适用于工作流、Pipeline */
  DAG = 'dag',
  /** 紧凑树形 — 适用于树形结构紧凑展示 */
  COMPACT_BOX = 'compact-box',
  /** 层级树 — 适用于传统树形图 */
  DENDROGRAM = 'dendrogram',
  /** 缩进树 — 适用于文件目录式展示 */
  INDENTED = 'indented',
  /** 思维导图 — 适用于脑图式发散展示 */
  MIND_MAP = 'mindmap',
  /** 力导向 — 适用于关系网络 */
  FORCE = 'force',
}

/**
 * 图布局方向枚举
 */
export enum GraphDirection {
  /** 从上到下 */
  TOP_TO_BOTTOM = 'TB',
  /** 从下到上 */
  BOTTOM_TO_TOP = 'BT',
  /** 从左到右 */
  LEFT_TO_RIGHT = 'LR',
  /** 从右到左 */
  RIGHT_TO_LEFT = 'RL',
}

// ─── 数据模型 ─────────────────────────────────────────────────

export interface ReVGraphNode {
  id: string;
  label?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

export interface ReVGraphEdge {
  source: string;
  target: string;
  label?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

export interface ReVGraphData {
  nodes: ReVGraphNode[];
  edges: ReVGraphEdge[];
}

// ─── Props ────────────────────────────────────────────────────

export interface ReVGraphProps {
  data: ReVGraphData;
  /** 布局类型，默认 DAG */
  layoutType?: ReVGraphLayoutType | string;
  /** 布局方向，默认 TB */
  direction?: GraphDirection | string;
  interactive?: boolean;
  height?: number;
  defaultNodeStyle?: Record<string, any>;
  defaultEdgeStyle?: Record<string, any>;
  onNodeClick?: (node: ReVGraphNode) => void;
  onGraphReady?: (graph: Graph) => void;
  className?: string;
}

// ─── 工具函数 ─────────────────────────────────────────────────

/** 字符串 → ReVGraphLayoutType 安全转换 */
export function resolveLayoutType(value: ReVGraphLayoutType | string): ReVGraphLayoutType {
  return (Object.values(ReVGraphLayoutType) as string[]).includes(value as string)
    ? (value as ReVGraphLayoutType)
    : ReVGraphLayoutType.DAG;
}

/** 字符串 → GraphDirection 安全转换 */
export function resolveDirection(value: GraphDirection | string): GraphDirection {
  return (Object.values(GraphDirection) as string[]).includes(value as string)
    ? (value as GraphDirection)
    : GraphDirection.TOP_TO_BOTTOM;
}

/** ReVGraphLayoutType → VGraph 内部字符串映射 */
const LAYOUT_VALUE_MAP: Record<ReVGraphLayoutType, string> = {
  [ReVGraphLayoutType.DAG]: LAYOUT_TYPES.DAG,
  [ReVGraphLayoutType.COMPACT_BOX]: LAYOUT_TYPES.COMPACT_BOX,
  [ReVGraphLayoutType.DENDROGRAM]: LAYOUT_TYPES.DENDROGRAM,
  [ReVGraphLayoutType.INDENTED]: LAYOUT_TYPES.INDENTED,
  [ReVGraphLayoutType.MIND_MAP]: LAYOUT_TYPES.MIND_MAP,
  [ReVGraphLayoutType.FORCE]: LAYOUT_TYPES.FORCE,
};

/** GraphDirection → VGraph direction 字符串 */
const DIRECTION_MAP: Record<GraphDirection, string> = {
  [GraphDirection.TOP_TO_BOTTOM]: 'TB',
  [GraphDirection.BOTTOM_TO_TOP]: 'BT',
  [GraphDirection.LEFT_TO_RIGHT]: 'LR',
  [GraphDirection.RIGHT_TO_LEFT]: 'RL',
};

// ─── 组件 ─────────────────────────────────────────────────────

export const ReVGraph: React.FC<ReVGraphProps> = ({
  data,
  layoutType,
  direction,
  interactive = true,
  height = 600,
  defaultNodeStyle,
  defaultEdgeStyle,
  onNodeClick,
  onGraphReady,
  className,
}) => {
  const resolvedLayout = resolveLayoutType(layoutType ?? ReVGraphLayoutType.DAG);
  const resolvedDirection = resolveDirection(direction ?? GraphDirection.TOP_TO_BOTTOM);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const configRef = useRef<GraphConfigs | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const vgraphLayoutType = LAYOUT_VALUE_MAP[resolvedLayout];
    const vgraphDirection = DIRECTION_MAP[resolvedDirection];

    const config: GraphConfigs = {
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height,
      autoFit: 'center' as any,
      autoLayout: true,
      layout: {
        type: vgraphLayoutType,
        options: {
          direction: vgraphDirection,
          controlEdgeIntersection: true,
          preventOverlap: true,
        },
      },
      setDefaultNode: (nodeData: any) => ({
        style: {
          size: [130, 48],
          borderRadius: 8,
          fill: 'var(--color-bg-panel, #1e2027)',
          stroke: 'var(--color-border, #3a3d45)',
          lineWidth: 1.5,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 6,
          labelFill: 'var(--color-text, #e5e5e5)',
          labelFontSize: 13,
          ...((defaultNodeStyle as any) ?? {}),
          ...((nodeData as any).style ?? {}),
        },
        label: (nodeData as any)?.label ?? (nodeData as any)?.id,
        ...nodeData,
      }),
      setDefaultEdge: (edgeData: any) => ({
        style: {
          stroke: 'var(--color-border-muted, #3a3d45)',
          lineWidth: 2,
          curveOffset: 0,
          ...((defaultEdgeStyle as any) ?? {}),
          ...((edgeData as any).style ?? {}),
        },
        label: (edgeData as any)?.label,
        ...edgeData,
      }),
    };

    const graph = new Graph(config);
    graph.data(data as any);
    graphRef.current = graph;
    configRef.current = config;
    onGraphReady?.(graph);

    return () => {
      graph.destroy();
      graphRef.current = null;
      configRef.current = null;
    };
  }, [resolvedLayout, resolvedDirection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data when data prop changes
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.data(data as any);
  }, [data]);

  // Update layout when layoutType or direction changes
  useEffect(() => {
    if (!graphRef.current) return;
    const vgraphLayoutType = LAYOUT_VALUE_MAP[resolvedLayout];
    const vgraphDirection = DIRECTION_MAP[resolvedDirection];
    graphRef.current.layout(vgraphLayoutType, { direction: vgraphDirection });
  }, [resolvedLayout, resolvedDirection]);

  return (
    <div
      className={`re-vgraph-container ${className ?? ''}`}
      style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}
    >
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
};

export default ReVGraph;
