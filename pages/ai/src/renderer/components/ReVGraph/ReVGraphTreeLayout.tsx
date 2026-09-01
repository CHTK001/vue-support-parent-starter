/**
 * ReVGraphTreeLayout — 树形布局组件族
 * 支持: compact-box | dendrogram | indented | mindmap
 */
import React from 'react';
import { ReVGraph } from '../ReVGraph';
import type { ReVGraphProps } from '../ReVGraph';

export type ReVGraphTreeLayoutType = 'compact-box' | 'dendrogram' | 'indented' | 'mindmap';

export interface ReVGraphTreeLayoutProps extends Omit<ReVGraphProps, 'layoutType'> {
  /** 树布局类型 */
  treeType?: ReVGraphTreeLayoutType;
  /** 水平间距 */
  hSpacing?: number;
  /** 垂直间距 */
  vSpacing?: number;
}

export const ReVGraphTreeLayout: React.FC<ReVGraphTreeLayoutProps> = ({
  treeType = 'compact-box',
  hSpacing = 40,
  vSpacing = 30,
  ...rest
}) => {
  return (
    <ReVGraph
      {...rest}
      layoutType={treeType}
      direction="TB"
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
