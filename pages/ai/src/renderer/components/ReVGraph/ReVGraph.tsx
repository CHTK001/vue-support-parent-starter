/**
 * ReVGraph — VisActor VGraph 封装组件
 *
 * 提供统一的产品化图可视化能力，支持 DAG、树形、力导向等布局。
 * 每个布局单独组件化，可通过 layoutType prop 切换。
 *
 * @example
 * <ReVGraph
 *   data={{ nodes: [...], edges: [...] }}
 *   layoutType="dag"
 *   direction="TB"
 *   onNodeClick={(node) => console.log(node.id)}
 * />
 */
import React, { useEffect, useRef } from 'react';
import { Graph, LAYOUT_TYPES, dragCanvas, panZoom, dragNode, brushSelect } from '@visactor/vgraph';
import type { GraphData } from '@visactor/vgraph';

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

export interface ReVGraphGroup {
  id: string;
  parentId?: string;
  nodes?: string[];
  label?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

export interface ReVGraphData {
  nodes: ReVGraphNode[];
  edges: ReVGraphEdge[];
  groups?: ReVGraphGroup[];
}

export interface ReVGraphProps {
  data: ReVGraphData;
  layoutType?: ReVGraphLayoutType;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  interactive?: boolean;
  height?: number;
  defaultNodeStyle?: Partial<any>;
  defaultEdgeStyle?: Partial<any>;
  onNodeClick?: (node: ReVGraphNode) => void;
  onEdgeClick?: (edge: ReVGraphEdge) => void;
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
  onEdgeClick,
  onGraphReady,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height,
      autoFit: 'center' as any,
      background: 'transparent',
      node: {
        state: {
          hover: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' },
          active: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.3)' },
        },
        ...(defaultNodeStyle || {}),
      },
      edge: {
        state: {
          hover: { lineWidth: 3, shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.15)' },
        },
        arrowHead: { enabled: true },
        ...(defaultEdgeStyle || {}),
      },
      layout: {
        type: LAYOUT_TYPE_MAP[layoutType],
        direction,
        controlEdgeIntersection: true,
        preventOverlap: true,
        sortByEdge: true,
        enableBlocking: true,
        maxIteration: 300,
      },
      behaviors: interactive
        ? ['zoom-canvas', 'drag-canvas', 'click-select', 'brush-select']
        : ['zoom-canvas', 'drag-canvas'],
    });

    graph.setData(data);
    graph.render();
    graphRef.current = graph;
    onGraphReady?.(graph);

    return () => {
      graph.release();
      graphRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.setData(data);
    graphRef.current.render();
  }, [data]);

  useEffect(() => {
    if (!graphRef.current) return;
    const layout = (graphRef.current as any).options?.layout;
    if (layout) {
      layout.type = LAYOUT_TYPE_MAP[layoutType];
      layout.direction = direction;
      graphRef.current.render();
    }
  }, [layoutType, direction]);

  return (
    <div className={`re-vgraph-container ${className ?? ''}`} style={{ width: '100%', height, position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
};

export default ReVGraph;
