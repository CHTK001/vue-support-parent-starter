/**
 * ReVGraphTreeLayout — 树形布局组件
 * 支持: compact-box | dendrogram | indented | mindmap
 */
import React from 'react';
import { ReVGraph, ReVGraphLayoutType, GraphDirection } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export type ReVGraphTreeLayoutType =
  | ReVGraphLayoutType.COMPACT_BOX
  | ReVGraphLayoutType.DENDROGRAM
  | ReVGraphLayoutType.INDENTED
  | ReVGraphLayoutType.MIND_MAP;

export interface ReVGraphTreeLayoutProps extends Omit<ReVGraphProps, 'layoutType' | 'direction'> {
  /** 树形布局类型 */
  treeType?: ReVGraphTreeLayoutType;
  /** 水平间距 */
  hSpacing?: number;
  /** 垂直间距 */
  vSpacing?: number;
}

export const ReVGraphTreeLayout: React.FC<ReVGraphTreeLayoutProps> = ({
  treeType = ReVGraphLayoutType.COMPACT_BOX,
  hSpacing = 40,
  vSpacing = 30,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType={treeType}
      direction={GraphDirection.TOP_TO_BOTTOM}
      defaultNodeStyle={{
        size: [140, 52],
        borderRadius: 10,
        fill: 'var(--color-bg-panel, #1e2027)',
        stroke: 'var(--color-border, #3a3d45)',
        lineWidth: 1.5,
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowBlur: 5,
      }}
      defaultEdgeStyle={{
        stroke: 'var(--color-border-muted, #3a3d45)',
        lineWidth: 1.5,
      }}
    />
  );
};

export default ReVGraphTreeLayout;
