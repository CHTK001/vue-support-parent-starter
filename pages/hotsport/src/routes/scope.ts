/**
 * 页面作用域包装 —— 让本包的视图能安全嵌进宿主布局。
 *
 * <p><strong>为什么需要</strong>：本包的 15 个页面原本是独立应用的整套界面
 * （自带深色工程台主题、自带全局类名）。直接挂到平台里会出两类问题：</p>
 * <ol>
 *   <li>样式串味 —— {@code .panel}、{@code .view}、{@code .muted} 这类通用类名是全局的；</li>
 *   <li>Element Plus 弹层丢失主题 —— 下拉/日期面板/气泡都会被 teleport 到 {@code body}，
 *       不在作用域内，取不到本包的 {@code --el-*} 覆盖，于是深色页面上弹出白色浮层。</li>
 * </ol>
 *
 * <p>做法：每个路由的组件包一层，渲染 {@code div.hotsport-scope} 并在挂载期间给
 * {@code body} 打 {@code hotsport-dark} 标记。样式文件里 {@code --el-*} 同时挂在
 * 这两个选择器上，浮层就跟着走。视图本身一行代码都不用改。</p>
 *
 * <p><strong>组件名必须唯一</strong>：宿主用 {@code <keep-alive :include="route.name">}
 * 做缓存，命中依据是组件名。若所有页面共用一个包装名，缓存会互相顶掉，
 * 因此 {@link hotsportPage} 的第一个参数就是路由名。</p>
 *
 * @since 4.0.0
 */
import {
  defineAsyncComponent,
  defineComponent,
  h,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  type AsyncComponentLoader,
} from "vue";

/** 挂在 body 上的标记类，供弹层令牌选择器使用 */
export const HOTSPORT_BODY_CLASS = "hotsport-dark";

/** 作用域根类名 */
export const HOTSPORT_SCOPE_CLASS = "hotsport-scope";

/**
 * 生成一个带作用域的页面组件。
 *
 * @param name   组件名（必须唯一，且与路由 {@code name} 一致，keep-alive 才能命中）
 * @param loader 视图的异步导入函数
 * @returns 可直接放进路由 {@code component} 的组件
 */
export function hotsportPage(name: string, loader: AsyncComponentLoader) {
  const view = defineAsyncComponent(loader);

  return defineComponent({
    name,
    setup() {
      // keep-alive 页面离开时不会卸载，只有 deactivated；
      // 因此进入/离开两个时机都要处理，否则切到别的页面后 body 标记会残留。
      const enter = () => document.body.classList.add(HOTSPORT_BODY_CLASS);
      const leave = () => document.body.classList.remove(HOTSPORT_BODY_CLASS);

      onMounted(enter);
      onActivated(enter);
      onBeforeUnmount(leave);
      onDeactivated(leave);

      return () => h("div", { class: HOTSPORT_SCOPE_CLASS }, [h(view)]);
    },
  });
}