/**
 * @novnc/novnc 类型垫片
 *
 * 社区包以默认导出 `RFB` 类、且不含官方类型声明，
 * 直接 `import RFB from '@novnc/novnc'` 会触发 TS7016（隐式 any）。
 *
 * 采用默认导出类声明：只声明本项目实际使用的最小 API 面，
 * 未覆盖的成员访问仍会报错（而不是被 any 吞掉），避免类型形同虚设。
 */
declare module '@novnc/novnc' {
  /** 认证凭据（noVNC 扩展字段 target 用于多目标转发） */
  export interface RfbCredentials {
    username: string;
    password: string;
    target?: string;
  }

  /** 连接参数 */
  export interface RfbOptions {
    credentials?: RfbCredentials;
    /** 共享会话：多客户端同时接入 */
    shared?: boolean;
    /** 视图缩放模式 */
    viewOnly?: boolean;
    /** 重复按同一键的最小间隔（ms） */
    repeaterID?: number;
  }

  /** 事件负载：多数事件为 undefined，部分携带 detail */
  export interface RfbEventDetail {
    clean?: boolean;
    reason?: string;
    status?: number;
    [key: string]: unknown;
  }

  export interface RfbEvent {
    type: string;
    detail?: RfbEventDetail;
  }

  type RfbEventListener = (event: RfbEvent) => void;

  /**
   * noVNC 核心 RFB 客户端。
   *
   * 负责与远端 VNC 服务（RFB 协议）协商、渲染桌面到传入的 DOM 容器，
   * 并把输入事件回传远端；既可直连 TCP，也可经 WebSocket 代理（本项目走后者）。
   */
  export default class RFB {
    /**
     * @param target 渲染容器
     * @param url 远端地址（`ws://` / `wss://` 表示走 WebSocket 代理）
     * @param options 连接参数
     */
    constructor(target: HTMLElement, url: string, options?: RfbOptions);

    /** 缩放远程画面以适配容器 */
    scaleViewport: boolean;
    /** 裁剪超出容器的画面部分 */
    clipViewport: boolean;
    /** 容器尺寸变化时调整远端分辨率 */
    resizeSession: boolean;
    /** 用本地样式绘制光标 */
    showDotCursor: boolean;
    /** 只读（屏蔽输入） */
    viewOnly: boolean;
    /** 当前视图缩放级别（scaleViewport 开启时可读） */
    readonly scale: number;
    /** 远端桌面宽高（像素） */
    readonly width: number;
    readonly height: number;
    /** 当前显示的桌面名 */
    readonly desktopName: string;

    /** 关闭连接 */
    disconnect(): void;
    /** 断开底层传输但保留对象（用于切换目标） */
    reconnect(): void;
    /** 调整视口缩放级别 */
    scaleBy?(factor: number): void;

    /** 注册事件回调 */
    addEventListener(type: string, listener: RfbEventListener): void;
    /** 移除事件回调 */
    removeEventListener(type: string, listener: RfbEventListener): void;

    /** 认证被服务端再次索要时回传凭据 */
    sendCredentials(credentials: RfbCredentials): void;
    /**
     * 发送按键
     *
     * @param keysym X11 keysym
     * @param code 键位码
     * @param down true=按下，false=松开
     */
    sendKey(keysym: number, code: string, down?: boolean): void;
    /** 发送组合键（一次按下） */
    sendKeyCombo(keysyms: number[], codes?: string[]): void;
    /** 下发 Ctrl+Alt+Del（带正确扫描码，触发 Windows 安全注意序列） */
    sendCtrlAltDel(): void;
    /** 释放所有已按下的按键 */
    releaseAllKeys?(): void;

    /** 移动鼠标指针到画布坐标 */
    _handleMouseMove?(x: number, y: number): void;
  }
}
