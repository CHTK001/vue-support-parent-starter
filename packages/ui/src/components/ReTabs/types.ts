/**
 * ReTabs 类型定义
 *
 * @author CH
 * @since 4.0.0
 */

/** 工作区页签项 */
export interface ReTabsItem {
  /** 唯一标识（建议 `${业务id}:${功能}`，保证同主机的多个功能各自独立） */
  name: string;
  /** 主标题，如主机名 */
  label: string;
  /**
   * 副标题（功能名：远控 / 端口 / 进程…）。
   *
   * <p>与 label 分成两行渲染：同一台主机开五个页签时，若只显示主机名，
   * 五个页签长得一模一样，只能靠图标猜。副标题让「这台主机的哪一项」一眼可辨。</p>
   */
  hint?: string;
  /** 图标名（Element Plus 图标名或 iconify 名） */
  icon?: string;
  /** 是否禁用（如主机离线时禁止打开远控） */
  disabled?: boolean;
  /** 是否可关闭，缺省跟随组件级 closable */
  closable?: boolean;
  /**
   * 状态点：复用全局语义色。
   * online=绿 / offline=灰 / unknown=黄 / alarm=红
   */
  status?: "online" | "offline" | "unknown" | "alarm" | null;
  /** 未保存改动标记（label 后小圆点） */
  dirty?: boolean;
  /** 计数徽标（如端口 12、进程 143） */
  badge?: string | number | null;
}

/** 右键菜单项 */
export interface ReTabsContextItem {
  /** 命令标识，点击后经 context-command 事件回传 */
  key: string;
  /** 菜单文案 */
  label: string;
  /** 图标名 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 危险操作（红色） */
  danger?: boolean;
  /** 该项之前插入分隔线 */
  divided?: boolean;
}
