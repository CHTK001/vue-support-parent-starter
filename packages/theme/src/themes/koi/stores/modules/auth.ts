// 定义权限小仓库[选择式Api写法]
import { defineStore } from "pinia";
import { staticRouter } from "@repo/theme/koi/config/menus";
import { getShowStaticAndDynamicMenuList, getAllBreadcrumbList } from "@repo/utils";
import { getMenu, getMe, setUserRoles, setUserPerms, createMenuRouteResolver } from "@repo/core";
import KoiLayout from "@repo/theme/koi/layouts/index.vue";

/** 菜单 → 路由解析器（koi views glob + koi 布局注入，逻辑在 core） */
const menuResolver = createMenuRouteResolver({
  viewModules: import.meta.glob("../views/**/*.vue") as Record<string, () => Promise<unknown>>,
  layoutComponent: KoiLayout,
  notFoundComponent: () => import("@repo/pages/error/404.vue"),
});
const { generateRoutes, generateFlattenRoutes } = menuResolver;

// 权限数据，不进行持久化。否则刷新浏览器无法获取新的数据。
const authStore = defineStore("auth", {
  // 存储数据state
  state: (): any => {
    return {
      // 扁平化路由数据
      menuList: [],
      // 递归之后的菜单数据
      recursiveMenuList: [],
      // 面包屑数据
      breadcrumbList: [],
      // 用户角色
      roleList: [],
      // 按钮权限列表
      buttonList: [],
      // 用户信息
      loginUser: {
        userId: "",
        loginName: "",
        sex: "",
        avatar: ""
      }
    };
  },
  // 该函数没有上下文数据，所以获取state中的变量需要使用this
  actions: {
    // 获取后端菜单数据
    async listRouters() {
      // 远程动态菜单（core api）
      let remoteMenu: any[] = [];
      try {
        const res = await getMenu();
        const data = res?.data;
        if (Array.isArray(data)) {
          remoteMenu = data;
        }
      } catch (e) {
        console.warn("[auth] 远程菜单获取失败，使用 mock", e);
        // 兼容旧 mock 数据（无后端时兜底）
        const mock = (await import("@repo/assets/json/authMenu.json")).default;
        remoteMenu = mock.data ?? [];
      }

      // 菜单两部分：项目静态菜单 + 远程动态菜单
      this.menuList = generateFlattenRoutes(remoteMenu);
      // 左侧菜单栏渲染（静态 + 动态，剔除隐藏）
      this.recursiveMenuList = getShowStaticAndDynamicMenuList(staticRouter).concat(
        generateRoutes(getShowStaticAndDynamicMenuList(remoteMenu), 0)
      );
      // 面包屑（静态 + 动态，无论是否隐藏）
      this.breadcrumbList = staticRouter.concat(generateRoutes(remoteMenu, 0));
    },
    // 获取角色数据 AND 按钮数据 AND 用户信息
    async getLoginUserInfo() {
      try {
        const res = await getMe();
        const data = res?.data as any;
        if (data) {
          this.roleList = data.roles ?? data.roleInfos?.map((r: any) => r.roleCode) ?? [];
          this.buttonList = data.perms ?? [];
          this.loginUser = {
            userId: data.sysUserId ?? data.userId ?? "",
            loginName: data.sysUserUsername ?? data.username ?? data.loginName ?? "",
            sex: data.sex ?? "",
            avatar: data.avatar ?? data.sysUserAvatar ?? ""
          };
          setUserRoles(this.roleList);
          setUserPerms(this.buttonList);
        }
      } catch (e) {
        console.warn("[auth] 用户信息获取失败，使用 mock", e);
        const mock = (await import("@repo/assets/json/authUser.json")).default;
        this.roleList = mock.data.roles;
        this.buttonList = mock.data.buttons;
        this.loginUser = mock.data.loginUser;
        setUserRoles(this.roleList);
        setUserPerms(this.buttonList);
      }
    }
  },
  // 计算属性，和vuex是使用一样，getters里面不是方法，是计算返回的结果值
  getters: {
    // 按钮权限列表
    getButtonList: state => state.buttonList,
    // 菜单权限列表 ==> 原始后端接口菜单数据，扁平化之后的一维数组菜单，主要用来添加动态路由，隐藏和不隐藏的菜单路由都需要
    getMenuList: state => state.menuList,
    // 菜单权限列表 ==> 左侧菜单栏渲染，这里的菜单将后端数据进行递归，需要将动态路由 isVisible == 0 的隐藏菜单剔除, 将静态路由 isVisible == 0 的隐藏菜单剔除
    showMenuList: state => state.recursiveMenuList,
    // 递归处理后的所有面包屑导航列表
    getBreadcrumbList: state => getAllBreadcrumbList(state.breadcrumbList)
  }
});

// 对外暴露方法
export default authStore;
