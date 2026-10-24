/**
 * 主机命令面板的类型。
 *
 * <p>单独成文件的原因和 {@code ScHostMetricsBar.types.ts} 一样：
 * {@code <script setup>} 里不能出现 ES 模块导出语句，而调用方（主机工作区）
 * 需要构造条目数组并接收选中回调，两侧得共用同一个类型。</p>
 *
 * @author CH
 * @since 4.0.0
 */

/** 面板里的一条可执行项 */
export interface PaletteItem {
  /**
   * 唯一标识，格式为 {@code 作用域:值}。
   *
   * <p>空串表示这是一行<b>分组标题</b>，只做视觉分段、不参与键盘选中。</p>
   */
  key: string;
  /** 主标题 */
  label: string;
  /** 副标题（IP、说明等） */
  hint?: string;
  /** 图标名 */
  icon?: string;
  /** 分组标题 */
  group: string;
}
