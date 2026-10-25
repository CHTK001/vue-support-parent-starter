/**
 * 局部类型声明：d3-sankey@0.12.3（该库无 @types 官方包）。
 * 只声明 ReChart 用到的 API，严格对齐 v0.12.3 的 dist/d3-sankey.js 真实导出。
 */
declare module "d3-sankey" {
  export interface SankeyNode<N extends Record<string, unknown>> {
    [key: string]: unknown;
    sourceLinks: SankeyLink<N>[];
    targetLinks: SankeyLink<N>[];
    index: number;
    depth: number;
    height: number;
    layer: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }

  export interface SankeyLink<N extends Record<string, unknown>> {
    source: string | number | SankeyNode<N>;
    target: string | number | SankeyNode<N>;
    value: number;
    index: number;
    width: number;
    y0: number;
    y1: number;
  }

  /** 布局调用后返回的完整图结构（v0.12：sankey(data) 直接返回该对象） */
  export interface SankeyGraph<N extends Record<string, unknown>, L extends Record<string, unknown>> {
    nodes: Array<N & SankeyNode<N>>;
    links: Array<L & SankeyLink<N>>;
  }

  export type SankeyNodeId<N extends Record<string, unknown>> = (node: N, index: number, nodes: N[]) => string;
  export type SankeyNodeAlignFunction<N extends Record<string, unknown>> = (node: N, n: number) => number;

  export interface SankeyLayout<N extends Record<string, unknown>, L extends Record<string, unknown>> {
    (translateToDepth?: number): unknown;
    <D>(data: D & { nodes: N[]; links: L[] }): SankeyGraph<N, L>;
    nodeId(id: string | SankeyNodeId<N>): this;
    nodeAlign(align: SankeyNodeAlignFunction<N>): this;
    nodeWidth(width: number): this;
    nodePadding(padding: number): this;
    extent(extent: [[number, number], [number, number]]): this;
    iterations(iterations: number): this;
    nodes(): N[];
    links(): L[];
  }

  export function sankeyLeft<N extends Record<string, unknown>>(
    node: N,
    n: number,
  ): number;
  export function sankeyRight<N extends Record<string, unknown>>(
    node: N,
    n: number,
  ): number;
  export function sankeyCenter<N extends Record<string, unknown>>(
    node: N,
    n: number,
  ): number;
  export function sankeyJustify<N extends Record<string, unknown>>(
    node: N,
    n: number,
  ): number;

  /** 生成桑基连线 SVG path。接收一个已完成布局的 link，返回 path 字符串。 */
  export function sankeyLinkHorizontal<N extends Record<string, unknown>>(): (
    link: SankeyLink<N> & Record<string, unknown>,
  ) => string;

  export function sankey<N extends Record<string, unknown>, L extends Record<string, unknown>>(
    layout?: SankeyLayout<N, L>,
  ): SankeyLayout<N, L>;
}