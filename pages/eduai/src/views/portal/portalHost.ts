/**
 * 学生端模块宿主桥 —— 让内嵌模块能「就地退出」，而不是跳管理后台路由
 *
 * <p>为什么需要它：学生端把趣味模块**就地全屏挂载**在 {@code StudentPortalView}
 * 里（见该文件 EMBEDDED），不跳路由。但模块自己不知道自己在被内嵌：
 * 成语消消乐结算页的「返回首页」原本 `router.push("/edu/fun")`，而
 * {@code /edu/fun/*} 注册在管理后台 layout 之下 —— 于是学生点一下「返回首页」
 * 就被甩进后台，侧边栏、标签栏、面包屑全露出来（用户实测反馈）。
 *
 * <p>方案：宿主 {@code provide} 一个 close 出口，模块 {@code inject} 后优先调用它；
 * 没有宿主时（模块被当作独立后台路由打开）才回退到学生端首页。
 * 这样两种打开方式都不会把学生带进后台。</p>
 */
import { inject, provide, type InjectionKey } from "vue";

/** 宿主提供的能力集合 */
export interface PortalModuleHost {
  /** 关闭当前内嵌模块，回到学生端首页 */
  close: () => void;
}

/** 注入键：用 Symbol 而非字符串，避免与别的 provide 撞名 */
export const PortalModuleHostKey: InjectionKey<PortalModuleHost> = Symbol("eduai.portal.host");

/**
 * 在学生端首页（宿主）里声明模块宿主能力。
 *
 * @param host 宿主能力实现
 */
export function providePortalModuleHost(host: PortalModuleHost): void {
  provide(PortalModuleHostKey, host);
}

/**
 * 在模块里取宿主能力。
 *
 * <p>刻意不抛错：模块被当作独立后台路由打开时没有宿主，返回 null 让调用方
 * 自己决定退路（走学生端首页）。</p>
 *
 * @returns 宿主能力；不在学生端内嵌时为 null
 */
export function usePortalModuleHost(): PortalModuleHost | null {
  return inject(PortalModuleHostKey, null);
}