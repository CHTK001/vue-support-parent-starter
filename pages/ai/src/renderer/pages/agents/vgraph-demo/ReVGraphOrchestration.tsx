/**
 * ReVGraphOrchestration — Agent 编排可视化页面
 *
 * 使用 ReVGraph 替代原 @antv/x6 实现，支持多种布局切换、
 * 节点交互、边动画、实时数据更新。
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  ReVGraph,
  ReVGraphDagLayout,
  ReVGraphTreeLayout,
  ReVGraphForceLayout,
  type ReVGraphData,
  type ReVGraphNode,
  type ReVGraphEdge,
  type ReVGraphLayoutType,
} from '@/renderer/components/ReVGraph';
import { Button, Select, Space, Tag, Typography } from '@arco-design/web-react';
import { IconRefresh, IconExpand } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// ─── 颜色主题 ───────────────────────────────────────────────
const NODE_COLORS = {
  master: { fill: '#1a3a5c', stroke: '#4a90d9', text: '#e8f0fe' },
  sub:    { fill: '#1a3c3a', stroke: '#4ad9a0', text: '#e8fef8' },
  tool:   { fill: '#3c1a3a', stroke: '#d94ad9', text: '#fee8fe' },
  llm:    { fill: '#3c3a1a', stroke: '#d9d44a', text: '#fefce8' },
  default:{ fill: '#1e2027', stroke: '#3a3d45', text: '#e5e5e5' },
};

const EDGE_COLORS = {
  default: '#3a3d45',
  active:  '#4a90d9',
  success: '#4ad9a0',
  warning: '#d9a04a',
  error:   '#d94a4a',
};

// ─── Demo 数据生成器 ────────────────────────────────────────
const DEMO_DAG: ReVGraphData = {
  nodes: [
    { id: 'root',    label: '🎯 Master Agent',  style: { ...NODE_COLORS.master, label: 'Master' } },
    { id: 'plan',    label: '📋 Planner',       style: { ...NODE_COLORS.sub } },
    { id: 'research',label: '🔍 Researcher',    style: { ...NODE_COLORS.sub } },
    { id: 'coder',   label: '💻 Coder',         style: { ...NODE_COLORS.sub } },
    { id: 'reviewer',label: '🔎 Reviewer',      style: { ...NODE_COLORS.tool } },
    { id: 'deploy',  label: '🚀 Deploy',        style: { ...NODE_COLORS.llm } },
    { id: 'notify',  label: '📢 Notify',        style: { ...NODE_COLORS.tool } },
  ],
  edges: [
    { source: 'root', target: 'plan',     label: 'assign' },
    { source: 'plan', target: 'research', label: 'branch' },
    { source: 'plan', target: 'coder',    label: 'branch' },
    { source: 'research', target: 'reviewer', label: 'review' },
    { source: 'coder', target: 'reviewer',   label: 'review' },
    { source: 'reviewer', target: 'deploy', label: 'approve' },
    { source: 'deploy', target: 'notify',   label: 'done' },
  ],
};

const DEMO_TREE: ReVGraphData = {
  nodes: [
    { id: 'root', label: '🏠 Root Agent', style: { ...NODE_COLORS.master } },
    { id: 'a1', label: '🤖 Agent A', style: { ...NODE_COLORS.sub } },
    { id: 'a2', label: '🤖 Agent B', style: { ...NODE_COLORS.sub } },
    { id: 'a3', label: '🤖 Agent C', style: { ...NODE_COLORS.sub } },
    { id: 'a1a', label: '🔧 Sub A1', style: { ...NODE_COLORS.tool } },
    { id: 'a1b', label: '🔧 Sub A2', style: { ...NODE_COLORS.tool } },
    { id: 'a2a', label: '🔧 Sub B1', style: { ...NODE_COLORS.tool } },
  ],
  edges: [
    { source: 'root', target: 'a1' },
    { source: 'root', target: 'a2' },
    { source: 'root', target: 'a3' },
    { source: 'a1', target: 'a1a' },
    { source: 'a1', target: 'a1b' },
    { source: 'a2', target: 'a2a' },
  ],
};

const DEMO_FORCE: ReVGraphData = {
  nodes: [
    { id: 'hub',  label: '🎯 Hub',     style: { ...NODE_COLORS.master, size: [100, 100] } },
    { id: 'n1',   label: 'Agent-1',    style: { ...NODE_COLORS.sub } },
    { id: 'n2',   label: 'Agent-2',    style: { ...NODE_COLORS.sub } },
    { id: 'n3',   label: 'Agent-3',    style: { ...NODE_COLORS.sub } },
    { id: 'n4',   label: 'Agent-4',    style: { ...NODE_COLORS.tool } },
    { id: 'n5',   label: 'Agent-5',    style: { ...NODE_COLORS.tool } },
    { id: 'n6',   label: 'Agent-6',    style: { ...NODE_COLORS.llm } },
    { id: 'n7',   label: 'Agent-7',    style: { ...NODE_COLORS.llm } },
  ],
  edges: [
    { source: 'hub', target: 'n1' },
    { source: 'hub', target: 'n2' },
    { source: 'hub', target: 'n3' },
    { source: 'n1', target: 'n4' },
    { source: 'n2', target: 'n5' },
    { source: 'n3', target: 'n6' },
    { source: 'n4', target: 'n7' },
    { source: 'n5', target: 'n7' },
  ],
};

const DEMO_DATA: Record<string, ReVGraphData> = {
  dag:     DEMO_DAG,
  tree:    DEMO_TREE,
  force:   DEMO_FORCE,
};

// ─── 组件 ───────────────────────────────────────────────────
const ReVGraphOrchestration: React.FC = () => {
  const { t } = useTranslation();
  const [layoutType, setLayoutType] = useState<ReVGraphLayoutType>('dag');
  const [demoKey, setDemoKey] = useState('dag');
  const [selectedNode, setSelectedNode] = useState<ReVGraphNode | null>(null);
  const [graphReady, setGraphReady] = useState(false);

  const currentData = DEMO_DATA[demoKey] ?? DEMO_DAG;

  const handleNodeClick = useCallback((node: ReVGraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleLayoutChange = useCallback((type: string) => {
    setLayoutType(type as ReVGraphLayoutType);
  }, []);

  const handleDemoChange = useCallback((key: string) => {
    setDemoKey(key);
    setSelectedNode(null);
  }, []);

  const handleReset = useCallback(() => {
    setDemoKey('dag');
    setLayoutType('dag');
    setSelectedNode(null);
  }, []);

  return (
    <div className="re-orchestration-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div className="re-toolbar" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        background: 'var(--color-bg-panel, #1e2027)',
        borderRadius: 10,
        border: '1px solid var(--color-border, #3a3d45)',
      }}>
        <Text strong style={{ color: 'var(--color-text, #e5e5e5)' }}>
          {t('reVGraph.orchestration.title', 'Agent 编排可视化')}
        </Text>

        <div style={{ flex: 1 }} />

        {/* Demo selector */}
        <Select
          value={demoKey}
          onChange={handleDemoChange}
          style={{ width: 160 }}
          size="small"
          options={[
            { label: 'DAG 流程图', value: 'dag' },
            { label: '树形结构', value: 'tree' },
            { label: '力导向网络', value: 'force' },
          ]}
        />

        {/* Layout selector */}
        <Select
          value={layoutType}
          onChange={handleLayoutChange}
          style={{ width: 160 }}
          size="small"
          options={[
            { label: 'DAG 布局', value: 'dag' },
            { label: '紧凑树', value: 'compact-box' },
            { label: '思维导图', value: 'mindmap' },
            { label: '力导向', value: 'force' },
            { label: '环形力导向', value: 'force-radial' },
            { label: '网格', value: 'grid' },
          ]}
        />

        <Button
          icon={<IconRefresh />}
          size="small"
          onClick={handleReset}
         type="outline"
        >
          重置
        </Button>
      </div>

      {/* Main graph area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <ReVGraph
          data={currentData}
          layoutType={layoutType}
          direction="TB"
          interactive
          height={560}
          defaultNodeStyle={{
            size: [130, 48],
            borderRadius: 10,
            fill: 'var(--color-bg-panel, #1e2027)',
            stroke: 'var(--color-border, #3a3d45)',
            lineWidth: 1.5,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 8,
            labelFill: 'var(--color-text, #e5e5e5)',
            labelFontSize: 13,
            labelFontWeight: 500,
            cursor: 'pointer',
          }}
          defaultEdgeStyle={{
            stroke: 'var(--color-border-muted, #3a3d45)',
            lineWidth: 2,
            curveOffset: 0,
            labelFill: 'var(--color-text-secondary, #8k8k8k)',
            labelFontSize: 11,
            cursor: 'pointer',
          }}
          onNodeClick={handleNodeClick}
          onGraphReady={(g) => setGraphReady(true)}
          className="re-vgraph-main"
        />

        {/* Status overlay */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end',
        }}>
          <Tag color={graphReady ? 'green' : 'arcoblue'} size="small">
            {graphReady ? '● Ready' : '○ Loading...'}
          </Tag>
          <Tag color="arcoblue" size="small">
            {layoutType} · {demoKey}
          </Tag>
        </div>

        {/* Selected node info */}
        {selectedNode && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            padding: '10px 16px',
            background: 'var(--color-bg-panel, #1e2027)',
            border: '1px solid var(--color-border, #3a3d45)',
            borderRadius: 8,
            minWidth: 200,
          }}>
            <Text strong style={{ color: 'var(--color-text, #e5e5e5)', fontSize: 13 }}>
              {selectedNode.label}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                ID: {selectedNode.id}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, padding: '8px 16px',
        background: 'var(--color-bg-panel, #1e2027)',
        borderRadius: 8,
        border: '1px solid var(--color-border, #3a3d45)',
        flexWrap: 'wrap',
      }}>
        {[
          { color: '#4a90d9', label: 'Master Agent' },
          { color: '#4ad9a0', label: 'Sub-Agent' },
          { color: '#d94ad9', label: 'Tool' },
          { color: '#d9d44a', label: 'LLM' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-quaternary, #666)' }}>
          点击节点查看详情 · 滚轮缩放 · 拖拽平移
        </div>
      </div>
    </div>
  );
};

export default ReVGraphOrchestration;


