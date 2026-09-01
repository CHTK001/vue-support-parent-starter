/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Graph, Shape } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import React, { useEffect, useRef } from 'react';
import type { OrchestrationData } from '@/common/types/agent/managedAgent';
import AgentNodeComponent from './AgentNodeComponent';

interface AgentOrchestrationGraphProps {
  data: OrchestrationData;
  editable?: boolean;
  onSelectSubAgent?: (agentId: string) => void;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;
const PORT_DOT_RADIUS = 4;
const COLOR_PORT = '#C2C8D5';

// 注册 React 节点
register({
  shape: 'agent-node',
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  effect: ['data'],
  html: (cell: { getData: () => unknown }) => {
    const data = cell.getData() as { label: string; kind: 'master' | 'sub-agent'; model?: string } | undefined;
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    const { createRoot } = require('react-dom/client');
    const root = createRoot(wrapper);
    root.render(
      React.createElement(AgentNodeComponent, {
        label: data?.label ?? '',
        kind: data?.kind ?? 'sub-agent',
        model: data?.model,
        status: 'idle',
      })
    );

    return wrapper;
  },
});

// 自定义边样式
Shape.Edge.config({
  attrs: {
    line: {
      stroke: '#A2B1C3',
      strokeWidth: 1.5,
      targetMarker: {
        name: 'block',
        width: 8,
        height: 6,
        fill: '#A2B1C3',
      },
    },
  },
  router: 'manhattan',
  connector: { name: 'smooth' },
});

const toGraphData = (data: OrchestrationData) => ({
  nodes: data.nodes.map((node) => {
    const isMaster = node.kind === 'master';
    return {
      id: node.id,
      shape: 'agent-node',
      x: node.position?.x ?? (isMaster ? 400 : 200),
      y: node.position?.y ?? (isMaster ? 100 : 300),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: { label: node.label, kind: node.kind } as { label: string; kind: 'master' | 'sub-agent' },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: {
                r: PORT_DOT_RADIUS,
                magnet: true,
                stroke: COLOR_PORT,
                strokeWidth: 1,
                fill: '#fff',
                style: { visibility: 'hidden' },
              },
            },
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: {
                r: PORT_DOT_RADIUS,
                magnet: true,
                stroke: COLOR_PORT,
                strokeWidth: 1,
                fill: '#fff',
                style: { visibility: 'hidden' },
              },
            },
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: PORT_DOT_RADIUS,
                magnet: true,
                stroke: COLOR_PORT,
                strokeWidth: 1,
                fill: '#fff',
                style: { visibility: 'hidden' },
              },
            },
          },
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: PORT_DOT_RADIUS,
                magnet: true,
                stroke: COLOR_PORT,
                strokeWidth: 1,
                fill: '#fff',
                style: { visibility: 'hidden' },
              },
            },
          },
        },
        items: [
          { group: 'top' },
          { group: 'bottom' },
          { group: 'left' },
          { group: 'right' },
        ],
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
          label: {
            text: edge.label || '',
            fill: '#86909c',
            fontSize: 11,
            fontWeight: 'normal',
          },
          rect: {
            ref: 'label',
            fill: '#fff',
            stroke: '#e5e6eb',
            strokeWidth: 1,
            rx: 3,
            ry: 3,
            refWidth: 12,
            refHeight: 10,
            refX: -6,
            refY: -5,
          },
        },
      },
    ],
  })),
});

const AgentOrchestrationGraph: React.FC<AgentOrchestrationGraphProps> = ({
  data,
  editable = true,
  onSelectSubAgent,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphRef.current) return;

    const graph = new Graph({
      container,
      autoResize: true,
      panning: {
        enabled: editable,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      },
      connecting: {
        connector: { name: 'smooth' },
        connectionPoint: 'anchor',
        allowBlank: false,
        snap: { radius: 20 },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 1.5,
                targetMarker: {
                  name: 'block',
                  width: 8,
                  height: 6,
                  fill: '#A2B1C3',
                },
              },
            },
            router: 'manhattan',
            connector: { name: 'smooth' },
          });
        },
        validateMagnet({ magnet }) {
          return magnet.getAttribute('magnet') !== 'false';
        },
      },
      interacting: {
        nodeMovable: editable,
        edgeMovable: false,
        edgeLabelMovable: false,
      },
      background: {
        color: '#f8f9fb',
      },
      grid: {
        visible: true,
        type: 'dot',
        size: 20,
        args: {
          color: '#e5e6eb',
          thickness: 1,
        },
      },
    });

    // 鼠标悬浮端口时显示
    graph.on('node:mouseenter', ({ node }) => {
      const ports = node.getPorts() as Array<{ id?: string }>;
      ports.forEach((port) => {
        graph.portUpdateAttrs(node.id, port.id ?? '', {
          circle: { style: { visibility: 'visible' } },
        });
      });
    });

    graph.on('node:mouseleave', ({ node }) => {
      const ports = node.getPorts() as Array<{ id?: string }>;
      ports.forEach((port) => {
        graph.portUpdateAttrs(node.id, port.id ?? '', {
          circle: { style: { visibility: 'hidden' } },
        });
      });
    });

    graph.on('node:click', ({ node }) => {
      const kind = (node.getData() as { kind?: string } | undefined)?.kind;
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

    graph.zoomToFit({ padding: 60, maxScale: 1.2 });
    dataRef.current = data;
  }, [data]);

  return <div ref={containerRef} className='h-full min-h-380px w-full' />;
};

export default AgentOrchestrationGraph;
