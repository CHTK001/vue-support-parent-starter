declare module "@logicflow/extension" {
  import type { LogicFlow } from "@logicflow/core";

  export interface MiniMapOptions {
    /** 小地图挂载容器 */
    container?: HTMLElement;
    /** 宽度，缺省 200 */
    width?: number;
    /** 高度，缺省 150 */
    height?: number;
    /** 是否显示对应的主图边缘 */
    showEdge?: boolean;
    /** 是否显示头部 */
    isShowHeader?: boolean;
    /** 是否显示关闭按钮 */
    isShowCloseIcon?: boolean;
    /** 水平位置，与 showEdge 配合 */
    position?: { leftPosition?: number; topPosition?: number; rightPosition?: number; bottomPosition?: number };
    /** 缩放比例，缺省 1 */
    ratio?: number;
  }

  /**
   * 小地图插件。
   *
   * 注意：`@logicflow/extension@2.3.1` 没有 mini-map 的 d.ts（es 与 lib 下均缺失，
   * lib 下 `components/mini-map/index.d.ts` 是 189 字节的元数据占位文件），直接
   * `import` 会报解析错，所以用本地声明补齐。
   */
  export class MiniMap {
    constructor({ lf, LogicFlow, options }: { lf?: LogicFlow; LogicFlow?: typeof LogicFlow; options?: MiniMapOptions });
    init: () => void;
    on: (name: string, handler: (...args: any[]) => void) => void;
    off: (name: string, handler: (...args: any[]) => void) => void;
    setOption: (option: Partial<MiniMapOptions>) => void;
    setView: (reRender?: boolean) => void;
    resize: () => void;
    getTransform: () => { SCALE_X: number; SCALE_Y: number; TRANSFORM_X: number; TRANSFORM_Y: number };
    updateViewPort: () => void;
    updateBounds: () => void;
    focusOn: (nodeId: string) => void;
    resetTranslate: () => void;
    getGraphRawData: () => { nodes: Array<any>; edges: Array<any> };
    destroy: () => void;
    pluginName: string;
  }

  export function registerPlugin(plugin: any, name?: string): void;
}
