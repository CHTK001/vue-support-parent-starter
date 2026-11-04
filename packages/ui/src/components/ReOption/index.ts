/**
 * ReOption —— 下拉选项（薄封装 element-plus 的 ElOption）
 *
 * <p>实现本体在 {@code ReKit/index.ts}（与 ReSelect 的其它透传组件收在一起，
 * 避免为几行代码新建目录）。这里只是一个<b>独立入口</b>：
 * 页面需要按需导入 {@code ReOption} 而不想引入整个 ReKit 时用它。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
export { ReOption, ReOption as default } from "../ReKit";
