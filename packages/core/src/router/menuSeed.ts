/**
 * 菜单灌入时机策略（core）
 *
 * <p>背景 —— 修「左侧菜单有时加载不出来」：</p>
 * <p>侧边栏数据源 {@code authStore.recursiveMenuList} 只有 {@code authStore.listRouters()}
 * 一处会写，而它在框架里只有三个触发点：</p>
 * <ol>
 *   <li>{@code createVueApp} 的启动灌入 —— 仅 {@code app.openAuth=false} 时执行；</li>
 *   <li>路由守卫的 {@code loadRemoteRoutes → initAuthRouter} —— 仅
 *       {@code route.mode} 为 remote/all 时执行；</li>
 *   <li>主题里的手动动作（顶栏刷新按钮 / 用户菜单「清缓存」）。</li>
 * </ol>
 *
 * <p>于是「{@code openAuth=true} + {@code route.mode=static/module}」这类应用
 * （框架默认配置正是这个组合）在前两条上都落空：</p>
 * <ul>
 *   <li>带令牌整页刷新：① 因 openAuth=true 跳过、② 因非 remote/all 跳过 → 没人灌菜单；</li>
 *   <li>SPA 内登录：登录流程只调 {@code initAuthRouter}，static 分支同样不灌 → 没人灌菜单。</li>
 * </ul>
 *
 * <p>表现即「左侧菜单有时加载不出来」：只有用户手动点过顶栏刷新 / 清过缓存
 * 菜单才会出现，能不能出来纯看操作顺序。</p>
 *
 * <p>本模块给出<b>唯一</b>判定，供启动灌入（{@code turbo/app/createVueApp}）与
 * 登录后灌入（{@code @repo/pinia authRouter}）共用，避免两处各写一遍
 * {@code mode === "remote" || mode === "all"} 而随时间漂移。</p>
 *
 * @since 4.0.0
 */

/**
 * 菜单是否由路由守卫负责拉取（remote / all 模式走 loadRemoteRoutes → initAuthRouter）。
 *
 * <p>与 {@code core/router/guard.ts} 的 {@code isRemote} 判定保持一致：
 * 这两种模式下守卫会在导航时按需拉远程菜单并处理「拉取失败强制重登」，
 * 应用侧再插手灌一次只会重复拉取，还可能绕开失败降级逻辑。</p>
 *
 * @param mode config.route.mode（缺省时按框架默认 static 处理）
 * @returns true 表示守卫负责，应用侧不该在启动/登录时插手
 */
export function isGuardOwnedMenuMode(mode: string | null | undefined): boolean {
  return mode === "remote" || mode === "all";
}

/** 启动灌入判定的输入 */
export interface MenuSeedStartupInput {
  /** config.app.openAuth：是否开启前端登录流程 */
  openAuth: boolean;
  /** config.route.mode */
  routeMode: string | null | undefined;
  /** 启动瞬间是否已持有访问令牌（整页刷新会带令牌进目标路由） */
  hasToken: boolean;
}

/**
 * 应用启动（含整页刷新）时是否需要补灌菜单 + 用户信息。
 *
 * <ul>
 *   <li>{@code openAuth=false}：没有登录流程，守卫直接放行，启动即灌（历史行为，保持不变）。</li>
 *   <li>remote/all：守卫负责，这里灌会重复拉取 → 不灌。</li>
 *   <li>static/module + 有令牌：整页刷新直接进目标路由，登录流程与守卫都不会跑 →
 *       必须灌，否则侧边栏空壳（本函数要修的缺陷）。</li>
 *   <li>static/module + 无令牌：接下来守卫会把用户弹去登录页 → 不灌，
 *       登录成功后由 {@code @repo/pinia initAuthRouter} 的静态分支灌入。</li>
 * </ul>
 *
 * @param input 见 {@link MenuSeedStartupInput}
 * @returns true 表示启动时应执行一次菜单 + 用户信息灌入
 */
export function shouldSeedMenuAtStartup(input: MenuSeedStartupInput): boolean {
  if (!input.openAuth) {
    return true;
  }
  if (isGuardOwnedMenuMode(input.routeMode)) {
    return false;
  }
  return input.hasToken;
}
