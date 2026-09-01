/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Graph } from '@antv/x6';
import React, { useEffect, useRef } from 'react';
import type { OrchestrationData } from '@/common/types/agent/managedAgent';

interface AgentOrchestrationGraphProps {
  data: OrchestrationData;
  /** 编辑态：允许拖拽节点/连线；只读态：仅展示。 */
  editable?: boolean;
  /** 点击子 Agent 节点（编辑子 Agent 配置）。 */
  onSelectSubAgent?: (agentId: string) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

interface AgentNodeData {
  label: string;
  kind: 'master' | 'sub-agent';
}

const toGraphData = (data: OrchestrationData) => ({
  nodes: data.nodes.map((node) => {
    const isMaster = node.kind === 'master';
    return {
      id: node.id,
      shape: 'agent-node',
      x: node.position?.x ?? (isMaster ? 400 : 200),
      y: node.position?.y ?? (isMaster ? 100 : 350),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: { label: node.label, kind: node.kind } as AgentNodeData,
    };
  }),
  edges: data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    router: 'manhattan' as const,
    connector: 'smooth' as const,
    attrs: {
      line: { stroke: 'var(--color-primary-6)', strokeWidth: 2 },
    },
    labels: [{ attrs: { label: { text: edge.label || 'routes to', fill: 'var(--color-text-3)', fontSize: 11 } } }],
  })),
});

/**
 * Agent 主从编排图（基于 @antv/x6）。
 *
 * 主 Agent 节点 + 子 Agent 节点，主→子连线（routes to）。
 * 图实例在首次挂载时创建一次；后续 data 变化仅通过 fromJSON 刷新，
 * 保留用户拖拽位置。点击子 Agent 节点可进入编辑。
 */
const AgentOrchestrationGraph: React.FC<AgentOrchestrationGraphProps> = ({
  data,
  editable = true,
  onSelectSubAgent,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const dataRef = useRef(data);

  // 首次挂载创建图 + 注册节点
  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphRef.current) return;

    Graph.registerNode(
      'agent-node',
      {
        inherit: 'html',
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        html(cell: { getData: () => unknown }) {
          const { label, kind } = (cell.getData() ?? { label: '', kind: 'sub-agent' }) as AgentNodeData;
          const div = document.createElement('div');
          div.style.cssText = `
            width: 100%; height: 100%; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 4px;
            border-radius: 12px; font-size: 13px; cursor: pointer;
            border: 1.5px solid ${kind === 'master' ? 'var(--color-primary-6)' : 'var(--color-border-2)'};
            background: ${kind === 'master' ? 'var(--color-primary-1)' : 'var(--color-fill-2)'};
            color: var(--color-text-1); font-weight: 500;
          `;
          const badge = document.createElement('span');
          badge.textContent = kind === 'master' ? '主 Agent' : '子 Agent';
          badge.style.cssText = `font-size: 11px; color: ${
            kind === 'master' ? 'var(--color-primary-6)' : 'var(--color-text-3)'
          }; font-weight: 400;`;
          const name = document.createElement('span');
          name.textContent = label;
          div.appendChild(badge);
          div.appendChild(name);
          return div;
        },
      },
      true
    );

    const graph = new Graph({
      container,
      autoResize: true,
      panning: editable,
      interacting: { nodeMovable: editable, edgeMovable: false, edgeLabelMovable: false },
      grid: { visible: true, size: 10 },
      background: { color: 'var(--color-fill-1)' },
    });

    graph.on('node:click', ({ node }) => {
      const kind = (node.getData() as AgentNodeData | undefined)?.kind;
      if (kind === 'sub-agent' && onSelectSubAgent) {
        onSelectSubAgent(node.id);
      }
    });

    graphRef.current = graph;

    return () => {
      graph.dispose();
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data 变化时刷新图（fromJSON 保留既有节点位置；新节点用默认位置）
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const prevIds = new Set(dataRef.current.nodes.map((n) => n.id));
    const nextIds = new Set(data.nodes.map((n) => n.id));
    const positions = new Map<string, { x: number; y: number }>();
    graph.getNodes().forEach((node) => {
      const pos = node.getPosition();
      if (prevIds.has(node.id) && nextIds.has(node.id)) {
        positions.set(node.id, { x: pos.x, y: pos.y });
      }
    });
    graph.fromJSON(toGraphData(data));
    positions.forEach((pos, id) => {
      const node = graph.getCellById(id);
      if (node && 'setPosition' in node) {
        (node as { setPosition: (p: { x: number; y: number }) => void }).setPosition(pos);
      }
    });
    graph.zoomToFit({ padding: 24, maxScale: 1.2 });
    dataRef.current = data;
  }, [data]);

  return <div ref={containerRef} className='h-full min-h-380px w-full' />;
};

export default AgentOrchestrationGraph;
