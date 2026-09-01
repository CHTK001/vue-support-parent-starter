/**
 * ReVGraphForceLayout — 力导向布局组件
 * 支持: force | force-cluster | force-radial | force-ego
 */
import React from 'react';
import { ReVGraph, ReVGraphLayoutType, GraphDirection } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export type ReVGraphForceLayoutType =
  | ReVGraphLayoutType.FORCE
  | 'force-cluster'
  | 'force-radial'
  | 'force-ego';

export interface ReVGraphForceLayoutProps extends Omit<ReVGraphProps, 'layoutType' | 'direction'> {
  /** 力导向布局类型 */
  forceType?: ReVGraphForceLayoutType;
  /** 中心点 X */
  centerX?: number;
  /** 中心点 Y */
  centerY?: number;
  /** 链接距离 */
  linkDistance?: number;
}

export const ReVGraphForceLayout: React.FC<ReVGraphForceLayoutProps> = ({
  forceType = ReVGraphLayoutType.FORCE,
  centerX = 400,
  centerY = 300,
  linkDistance = 120,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType={forceType}
      direction={GraphDirection.LEFT_TO_RIGHT}
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
