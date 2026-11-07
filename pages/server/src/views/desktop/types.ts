/**
 * 虚拟桌面：窗口与应用的共享类型。
 *
 * <p>桌面只负责「窗口在哪儿、显示哪个应用、绑定哪台主机」，
 * 应用内部的数据全部来自既有的 SSH / SFTP / 命令执行接口，
 * 因此这里的类型刻意不依赖台账的完整 Host 结构，避免把整页状态带进每个窗口。</p>
 *
 * @author CH
 * @since 4.0.0.55
 */

/** 桌面应用标识 */
export type DesktopAppKey = "terminal" | "files" | "monitor" | "system" | "process" | "net" | "console" | "notes";

/** 桌面窗口 */
export interface DesktopWindow {
  /** 窗口唯一标识 */
  id: string;
  /** 应用标识 */
  app: DesktopAppKey;
  /** 窗口绑定的主机（打开时确定，切换顶栏主机不影响已开窗口） */
  hostId: number;
  /** 标题栏文案（应用名 · 主机名） */
  title: string;
  /** 左上角 x */
  x: number;
  /** 左上角 y */
  y: number;
  /** 宽 */
  w: number;
  /** 高 */
  h: number;
  /** 层叠顺序 */
  z: number;
  /** 是否最小化（最小化只隐藏，不销毁，终端会话要保住） */
  min: boolean;
  /** 是否最大化 */
  max: boolean;
  /** 最大化前的几何，还原时恢复 */
  restore?: { x: number; y: number; w: number; h: number };
}

/** 应用定义 */
export interface DesktopAppDef {
  /** 应用标识 */
  key: DesktopAppKey;
  /** Dock 上的名称 */
  label: string;
  /** Dock 图标（Element Plus 图标名） */
  icon: string;
  /** 默认宽 */
  w: number;
  /** 默认高 */
  h: number;
  /** hover 提示 */
  hint: string;
}

/** 桌面需要的主机字段（台账只回这些就够画桌面） */
export interface DesktopHost {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort?: number | null;
  serverHostOsType?: string | null;
  serverHostOnline: number;
  /** 采集方式；只用于展示，不作为「能不能 SSH」的依据（本机同样可能开着 sshd） */
  serverHostCollectMode?: string | null;
  /** 台账是否开启 SSH（0 = 明确关闭；其余按可用处理） */
  serverHostSshEnabled?: number | null;
}
