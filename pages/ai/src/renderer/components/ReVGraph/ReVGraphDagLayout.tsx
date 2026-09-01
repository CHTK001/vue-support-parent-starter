/**
 * ReVGraphDagLayout — DAG 流程图组件
 * 适用于 Pipeline、工作流等线性流程可视化
 */
import React from 'react';
import { ReVGraph, ReVGraphLayoutType, GraphDirection } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export interface ReVGraphDagLayoutProps extends Omit<ReVGraphProps, 'layoutType' | 'direction'> {
  /** DAG 方向: TOP_TO_BOTTOM(默认) | BOTTOM_TO_TOP | LEFT_TO_RIGHT | RIGHT_TO_LEFT */
  direction?: GraphDirection | 'TB' | 'BT' | 'LR' | 'RL';
  /** 层级间距 */
  rankSep?: number;
  /** 节点间距 */
  nodeSep?: number;
}

export const ReVGraphDagLayout: React.FC<ReVGraphDagLayoutProps> = ({
  direction = GraphDirection.TOP_TO_BOTTOM,
  rankSep = 80,
  nodeSep = 60,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType={ReVGraphLayoutType.DAG}
      direction={direction as GraphDirection}
      defaultNodeStyle={{
        size: [120, 48],
        borderRadius: 8,
        fill: 'var(--color-bg-panel, #1e2027)',
        stroke: 'var(--color-border, #3a3d45)',
        lineWidth: 1.5,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 6,
      }}
      defaultEdgeStyle={{
        stroke: 'var(--color-border-muted, #3a3d45)',
        lineWidth: 2,
        curveOffset: 0,
      }}
    />
  );
};

export default ReVGraphDagLayout;
