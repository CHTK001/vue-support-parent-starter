/**
 * Docker 独立页面路由（@pages/docker）
 *
 * <p>单页路由 {@code /docker}：页面内部再用页签切分容器 / 镜像 / 网络 / 卷 /
 * 镜像库 / 模板，所以不拆成六个二级路由 —— 拆了之后「从资产页带着 hostId
 * 跳过来」还要在六个路径间重新传参，反而更容易丢上下文。</p>
 *
 * <p>宿主只需在 {@code router/index.ts} 里展开本工厂产出的数组，
 * 与其它 {@code pages/xx} 包同一套装配方式。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createDockerRoutes} 的可选项 */
export interface DockerRoutesOptions {
  /** 是否进侧边栏（默认 false：Docker 属于主机工作区，入口收在右键菜单「工作台 → Docker（独立页）」） */
  showLink?: boolean;
  /** 侧边栏高亮回指的路由路径（默认 /docker） */
  activeMenu?: string;
  /** 菜单排序（默认 13，排在文件管理之后） */
  rank?: number;
}

/**
 * 生成 Docker 页面路由。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由树的数组
 */
export function createDockerRoutes(options: DockerRoutesOptions = {}): RouteConfigsTable[] {
  // Docker 是主机资产的 Tab（右键菜单「工作台」二级菜单），不是侧边栏里独立的菜单项。
  // 所以不挂 showLink（页面仍随路由表由宿主注册，从 /docker?hostId= 进入），嵌入其它应用
  // 时才可把菜单项开给侧边栏。
  return [
    {
      path: "/docker",
      name: "Docker",
      component: () => import("../views/DockerView.vue"),
      meta: {
        title: "Docker",
        icon: "Box",
        showLink: false,
        rank: options.rank ?? 13,
        activeMenu: options.activeMenu || "/docker",
        // 不缓存：本页的日志 / 终端是长连接，被 keep-alive 挂起时不会卸载，
        // 后台 SSE 会一直占着后端 SSH 会话，回到页面还会看到一份过期输出。
        keepAlive: false,
      },
    },
  ];
}
