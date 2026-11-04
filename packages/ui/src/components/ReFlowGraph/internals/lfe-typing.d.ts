/**
 * 类型声明补丁：`@logicflow/extension@2.3.1` 没有 mini-map 的 d.ts。
 *
 * 原因：`es/index.d.ts` / `lib/index.d.ts` 均 `export * from './components/mini-map'`，
 * 而 `es/components/mini-map/` 下只有 `index.js`，`lib/components/mini-map/index.d.ts`
 * 则是 189 字节的 IDE 元数据占位文件（不是合法的 TS 声明），所以直接
 * `import { MiniMap } from "@logicflow/extension"` 时 `vue-tsc` 会在那个占位文件上
 * 报大量解析错（TS1127 / TS1435），得先把它避开。
 *
 * 做法：在本仓库的 tsconfig 里用 `paths` 把 `@logicflow/extension` 的类型解析劫持
 * 到本文件，不再加载 `@logicflow/extension` 的 `lib/index.d.ts`。这**只改动类型检查
 * 的解析**，不改动运行时：Vite/esbuild 仍然从 node_modules 加载真实的 `es/index.js`。
 *
 * 类型内容由 `es/components/mini-map/index.js` 的类实现反推。
 */
declare module "@logicflow/extension" {
  import type { LogicFlow } from "@logicflow/core";

  export type MiniMapPosition =
    | "left-top"
    | "right-top"
    | "left-bottom"
    | "right-bottom";

  export interface MiniMapOptions {
    /** 小地图在画布上的水平偏移 */
    leftPosition?: number;
    /** 小地图在画布上的垂直偏移 */
    topPosition?: number;
    /** 小地图在画布上的水平偏移（相对右侧） */
    rightPosition?: number;
    /** 小地图在画布上的垂直偏移（相对底部） */
    bottomPosition?: number;
    /** 小地图画布宽度，缺省 200 */
    width?: number;
    /** 小地图画布高度，缺省 150 */
    height?: number;
    /** 是否在小地图中显示连线，缺省 false */
    showEdge?: boolean;
    /** 是否显示标题栏，缺省 false */
    isShowHeader?: boolean;
    /** 是否显示关闭按钮，缺省 false */
    isShowCloseIcon?: boolean;
    /** 标题栏文本，缺省 `导航` */
    headerTitle?: string;
  }

  /**
   * 小地图插件。
   *
   * 行为对齐 `es/components/mini-map/index.js` 的 `MiniMap` 类。小地图内部创建了自己
   * 的逻辑流实例（`isSilentMode: true` + `history: false` +
   * `disabledPlugins: ['miniMap', 'control', 'selectionSelect']`），所以小地图状态的
   * 显示/隐藏 / 显隐 / 内容刷新 / 位置全部走 `MiniMap` 实例的公开方法。
   */
  export class MiniMap {
    constructor({
      lf,
      LogicFlow,
      options,
    }: {
      lf?: LogicFlow;
      LogicFlow?: typeof LogicFlow;
      options?: MiniMapOptions;
    });

    /** 显示小地图（left / top 是画布视口左上角相对定位） */
    show: (left?: number, top?: number) => void;
    /** 隐藏小地图 */
    hide: () => void;
    /** 重设小地图中主画布的视图 */
    setView: (reRender?: boolean) => void;
    /** 更新小地图在画布上的位置 */
    updatePosition: (position: MiniMapPosition | Partial<MiniMapOptions>) => void;
    /** 一次性设置性选项 */
    setOption: (options: Partial<MiniMapOptions>) => void;
    /** 更新小地图的边界信息 */
    updateBounds: () => void;
    /** 更新小地图视口信息 */
    updateViewPort: () => void;
    /** 重设画布缩放和平移 */
    reset: () => void;
    /** 计算小地图画布的缩放与位移 */
    getTransform: () => {
      SCALE_X: number;
      SCALE_Y: number;
      TRANSLATE_X: number;
      TRANSLATE_Y: number;
    };
    /** 主画布原始图数据 */
    getGraphRawData: () => { nodes: unknown[]; edges: unknown[] };
    /** 销毁小地图 */
    destroy: () => void;
    /** 插件名，`mini-map` */
    pluginName: string;
  }
}
