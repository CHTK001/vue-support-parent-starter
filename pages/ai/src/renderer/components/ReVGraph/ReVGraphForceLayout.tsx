/**
 * ReVGraphForceLayout — 力导向布局组件族
 * 支持: force | force-cluster | force-radial | force-ego
 */
import React from 'react';
import { ReVGraph } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export type ReVGraphForceLayoutType =
  | 'force'
  | 'force-cluster'
  | 'force-radial'
  | 'force-ego';

export interface ReVGraphForceLayoutProps extends Omit<ReVGraphProps, 'layoutType'> {
  /** 力导向布局类型 */
  forceType?: ReVGraphForceLayoutType;
  /** 中心点 X */
  centerX?: number;
  /** 中心点 Y */
  centerY?: number;
  /** 引力系数 */
  linkDistance?: number;
}

export const ReVGraphForceLayout: React.FC<ReVGraphForceLayoutProps> = ({
  forceType = 'force',
  centerX = 400,
  centerY = 300,
  linkDistance = 120,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType={forceType}
      direction="LR"
      defaultNodeStyle={{
        size: [80, 80],
        borderRadius: 40,
        fill: 'var(--color-bg-panel, #1e2027)',
        stroke: 'var(--color-border, #3a3d45)',
        lineWidth: 1.5,
      }}
      defaultEdgeStyle={{
        stroke: 'var(--color-border-muted, #3a3d45)',
        lineWidth: 1.5,
      }}
    />
  );
};

export default ReVGraphForceLayout;
