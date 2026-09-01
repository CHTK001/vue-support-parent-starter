/**
 * ReVGraph — VisActor VGraph 封装组件
 *
 * 提供统一的产品化图可视化能力，支持 DAG、树形、力导向等布局。
 *
 * @example
 * <ReVGraph
 *   data={{ nodes: [...], edges: [...] }}
 *   layoutType="dag"
 *   direction="TB"
 * />
 */
import React, { useEffect, useRef } from 'react';
import { Graph, LAYOUT_TYPES } from '@visactor/vgraph';
import type { GraphConfigs } from '@visactor/vgraph';

export type ReVGraphLayoutType = 'dag' | 'compact-box' | 'dendrogram' | 'indented' | 'mindmap' | 'force';

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

export interface ReVGraphProps {
  data: ReVGraphData;
  layoutType?: ReVGraphLayoutType;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  interactive?: boolean;
  height?: number;
  defaultNodeStyle?: Record<string, any>;
  defaultEdgeStyle?: Record<string, any>;
  onNodeClick?: (node: ReVGraphNode) => void;
  onGraphReady?: (graph: Graph) => void;
  className?: string;
}

const LAYOUT_TYPE_MAP: Record<ReVGraphLayoutType, string> = {
  'dag': LAYOUT_TYPES.DAG,
  'compact-box': LAYOUT_TYPES.COMPACT_BOX,
  'dendrogram': LAYOUT_TYPES.DENDROGRAM,
  'indented': LAYOUT_TYPES.INDENTED,
  'mindmap': LAYOUT_TYPES.MIND_MAP,
  'force': LAYOUT_TYPES.FORCE,
};

export const ReVGraph: React.FC<ReVGraphProps> = ({
  data,
  layoutType = 'dag',
  direction = 'TB',
  interactive = true,
  height = 600,
  defaultNodeStyle,
  defaultEdgeStyle,
  onNodeClick,
  onGraphReady,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const optionsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: GraphConfigs = {
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height,
      autoFit: 'center' as any,
      autoLayout: true,
      layout: {
        type: LAYOUT_TYPE_MAP[layoutType],
        options: {
          direction,
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
    optionsRef.current = config;
    onGraphReady?.(graph);

    return () => {
      graph.destroy();
      graphRef.current = null;
      optionsRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data when data prop changes
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.data(data as GraphData);
  }, [data]);

  // Update layout when layoutType or direction changes
  useEffect(() => {
    if (!graphRef.current || !optionsRef.current) return;
    const layoutTypeStr = LAYOUT_TYPE_MAP[layoutType];
    (optionsRef.current as any).layout = {
      type: layoutTypeStr,
      options: { direction },
    };
    graphRef.current.layout(layoutTypeStr, { direction });
  }, [layoutType, direction]);

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

