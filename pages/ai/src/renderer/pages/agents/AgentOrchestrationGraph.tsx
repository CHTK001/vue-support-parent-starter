/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Graph, Shape } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import React, { useEffect, useRef, useState } from 'react';
import type { OrchestrationData } from '@/common/types/agent/managedAgent';
import AgentNodeComponent from './AgentNodeComponent';
import type { AgentNodeData } from './AgentNodeComponent';

interface AgentOrchestrationGraphProps {
  data: OrchestrationData;
  editable?: boolean;
  onEditNode?: (nodeId: string, nodeData: AgentNodeData) => void;
  onDeleteNode?: (nodeId: string) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

// ─── 注册 React 节点 ──────────────────────────────────────────
register({
  shape: 'agent-node',
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  effect: ['data'],
  component: AgentNodeComponent,
});

// ─── 连线默认样式 ─────────────────────────────────────────────
Shape.Edge.config({
  attrs: {
    line: {
      stroke: '#4a5568',
      strokeWidth: 1.5,
      targetMarker: { name: 'block', width: 8, height: 6, fill: '#4a5568' },
    },
  },
  router: 'manhattan',
  connector: { name: 'smooth' },
});

// ─── 将 OrchestrationData 转为 X6 数据 ────────────────────────
const toGraphData = (data: OrchestrationData) => ({
  nodes: data.nodes.map((node) => {
    const isMaster = node.kind === 'master';
    return {
      id: node.id,
      shape: 'agent-node',
      x: node.position?.x ?? (isMaster ? 400 : 200),
      y: node.position?.y ?? (isMaster ? 80 : 200),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: { label: node.label, kind: node.kind } as AgentNodeData,
      ports: {
        groups: {
          top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#64748b', strokeWidth: 1.5, fill: '#1e293b' }, style: { visibility: 'hidden' } } },
          bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#64748b', strokeWidth: 1.5, fill: '#1e293b' }, style: { visibility: 'hidden' } } },
          left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#64748b', strokeWidth: 1.5, fill: '#1e293b' }, style: { visibility: 'hidden' } } },
          right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#64748b', strokeWidth: 1.5, fill: '#1e293b' }, style: { visibility: 'hidden' } } },
        },
        items: [{ group: 'top' }, { group: 'bottom' }, { group: 'left' }, { group: 'right' }],
      },
    };
  }),
  edges: data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    labels: [
      {
        position: 0.5,
        attrs: {
          label: { text: edge.label || '', fill: '#94a3b8', fontSize: 11 },
          rect: { fill: 'transparent', stroke: 'none' },
        },
      },
    ],
  })),
});

// ─── 右键菜单 ─────────────────────────────────────────────────
const ContextMenu: React.FC<{
  x: number;
  y: number;
  nodeId: string;
  nodeLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ x, y, nodeLabel, onEdit, onDelete, onClose }) => {
  React.useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 9999,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    minWidth: 150,
    overflow: 'hidden',
    padding: '4px 0',
  };

  const itemStyle = (hover: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 14px',
    border: 'none',
    background: hover ? '#334155' : 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: hover ? '#f1f5f9' : '#cbd5e1',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.12s',
  });

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <div style={{ padding: '6px 14px 4px', fontSize: 11, color: '#64748b', borderBottom: '1px solid #334155', letterSpacing: '0.5px' }}>
        {nodeLabel}
      </div>
      <button style={itemStyle(false)} onClick={() => { onEdit(); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <span>✏️</span> 编辑
      </button>
      <button style={itemStyle(false)} onClick={() => { onDelete(); onClose(); }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#7f1d1d30')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <span style={{ color: '#f87171' }}>🗑️</span> <span style={{ color: '#f87171' }}>删除</span>
      </button>
    </div>
  );
};

// ─── 工具栏 ───────────────────────────────────────────────────
const Toolbar: React.FC<{
  nodeCount: number;
  edgeCount: number;
  onFit: () => void;
  onReset: () => void;
}> = ({ nodeCount, edgeCount, onFit, onReset }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: 'rgba(30,41,59,0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: 10,
    border: '1px solid #334155',
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
  }}>
    <div style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>
      {nodeCount} 节点 · {edgeCount} 边
    </div>
    <div style={{ width: 1, height: 16, background: '#334155', margin: '0 4px' }} />
    <button onClick={onFit} title="适应视图"
      style={btnStyle}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    </button>
    <button onClick={onReset} title="重置"
      style={btnStyle}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  </div>
);

const btnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#94a3b8',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

// ─── 主组件 ───────────────────────────────────────────────────
const AgentOrchestrationGraph: React.FC<AgentOrchestrationGraphProps> = ({
  data,
  editable = true,
  onEditNode,
  onDeleteNode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const dataRef = useRef(data);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; nodeLabel: string } | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphRef.current) return;

    const graph = new Graph({
      container,
      autoResize: true,
      background: { color: '#0f172a' },
      grid: {
        visible: true,
        type: 'mesh',
        size: 20,
        args: { color: '#1e293b', thickness: 1 },
      },
      panning: { enabled: editable, eventTypes: ['leftMouseDown', 'mouseWheel'] },
      mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'], minScale: 0.2, maxScale: 3 },
      connecting: {
        connector: { name: 'smooth' },
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: { radius: 20 },
        createEdge() {
          return new Shape.Edge({
            attrs: { line: { stroke: '#4a5568', strokeWidth: 1.5, targetMarker: { name: 'block', width: 8, height: 6, fill: '#4a5568' } } },
            router: 'manhattan',
            connector: { name: 'smooth' },
          });
        },
        validateMagnet({ magnet }) { return magnet.getAttribute('magnet') !== 'false'; },
      },
      interacting: {
        nodeMovable: editable,
        edgeMovable: false,
        edgeLabelMovable: false,
      },
    });

    // 鼠标经过时显示端口
    graph.on('node:mouseenter', ({ node }) => {
      (node.getPorts() as Array<{ id?: string }>).forEach((port) => {
        graph.portUpdateAttrs(node.id, port.id ?? '', { circle: { style: { visibility: 'visible' } } });
      });
    });
    graph.on('node:mouseleave', ({ node }) => {
      (node.getPorts() as Array<{ id?: string }>).forEach((port) => {
        graph.portUpdateAttrs(node.id, port.id ?? '', { circle: { style: { visibility: 'hidden' } } });
      });
    });

    // 右键菜单
    graph.on('node:contextmenu', ({ node }) => {
      const nodeData = node.getData() as AgentNodeData;
      const label = nodeData?.label || node.id;
      const point = graph.screenToGridPoint(graph.eventPos() as { x: number; y: number });
      setContextMenu({ x: point.x + NODE_WIDTH / 2, y: point.y + NODE_HEIGHT, nodeId: node.id, nodeLabel: label });
    });

    // 点击空白关闭菜单
    graph.on('blank:click', () => setContextMenu(null));

    // 更新计数
    const updateCount = () => {
      setNodeCount(graph.getNodes().length);
      setEdgeCount(graph.getEdges().length);
    };
    graph.on('node:added node:removed', updateCount);
    graph.on('edge:added edge:removed', updateCount);

    graphRef.current = graph;
    updateCount();

    return () => {
      graph.dispose();
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = () => {
    if (!contextMenu || !onEditNode) return;
    const graph = graphRef.current;
    if (!graph) return;
    const node = graph.getCellById(contextMenu.nodeId);
    const nodeData = node?.getData() as AgentNodeData | undefined;
    onEditNode(contextMenu.nodeId, nodeData || { label: contextMenu.nodeLabel, kind: 'sub-agent' });
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu || !onDeleteNode) return;
    onDeleteNode(contextMenu.nodeId);
    setContextMenu(null);
  };

  const handleFit = () => {
    graphRef.current?.zoomToFit({ padding: 60, maxScale: 1.2 });
  };

  const handleReset = () => {
    graphRef.current?.zoom(1, { maxScale: 1, minScale: 0.5 });
    graphRef.current?.centerContent();
  };

  // 同步数据
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    const prevIds = new Set(dataRef.current.nodes.map((n) => n.id));
    const nextIds = new Set(data.nodes.map((n) => n.id));
    const positions = new Map<string, { x: number; y: number }>();
    graph.getNodes().forEach((node) => {
      if (prevIds.has(node.id) && nextIds.has(node.id)) {
        const pos = node.getPosition();
        positions.set(node.id, { x: pos.x, y: pos.y });
      }
    });

    graph.fromJSON(toGraphData(data));
    positions.forEach((pos, id) => {
      const node = graph.getCellById(id) as any;
      if (node?.setPosition) node.setPosition(pos);
    });

    graph.zoomToFit({ padding: 60, maxScale: 1.2 });
    dataRef.current = data;
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Toolbar nodeCount={nodeCount} edgeCount={edgeCount} onFit={handleFit} onReset={handleReset} />
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeLabel={contextMenu.nodeLabel}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AgentOrchestrationGraph;
export type { AgentOrchestrationGraphProps };
