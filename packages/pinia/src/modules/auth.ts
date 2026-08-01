/**
 * auth store（@repo/pinia）—— 权限 / 菜单 / 用户信息
 *
 * 通用权限菜单状态：
 *  - 菜单：项目静态菜单 + 远程动态菜单（core api），组件解析走注册的菜单解析器
 *  - 用户信息：core getMe 接口
 *  - 权限码同步到 core permission（v-admin / v-role / v-perm 指令）
 */
import { defineStore } from "pinia";
import { getShowStaticAndDynamicMenuList, getAllBreadcrumbList } from "@repo/utils";
import { getMenu, getMe, setUserRoles, setUserPerms } from "@repo/core";
import { getMenuResolver } from "../menuResolver";
import { getStaticMenu } from "../staticMenu";

// 权限数据，不进行持久化。否则刷新浏览器无法获取新的数据。
const authStore = defineStore("auth", {
  state: (): any => {
    return {
      menuList: [],
      recursiveMenuList: [],
      breadcrumbList: [],
      roleList: [],
      buttonList: [],
      loginUser: {
        userId: "",
        loginName: "",
        sex: "",
        avatar: "",
      },
    };
  },
  actions: {
    async listRouters() {
      const { generateRoutes, generateFlattenRoutes } = getMenuResolver();
      const staticRouter = getStaticMenu();
      let remoteMenu: any[] = [];
      try {
        const res = await getMenu();
        const data = res?.data;
        if (Array.isArray(data)) {
          remoteMenu = data;
        }
      } catch (e) {
        console.warn("[auth] 远程菜单获取失败，使用 mock", e);
        const mock = (await import("@repo/assets/json/authMenu.json")).default;
        remoteMenu = mock.data ?? [];
      }

      this.menuList = generateFlattenRoutes(remoteMenu);
      this.recursiveMenuList = getShowStaticAndDynamicMenuList(staticRouter).concat(
        generateRoutes(getShowStaticAndDynamicMenuList(remoteMenu), 0),
      );
      this.breadcrumbList = staticRouter.concat(generateRoutes(remoteMenu, 0));
    },
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
            avatar: data.avatar ?? data.sysUserAvatar ?? "",
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
    },
  },
  getters: {
    getButtonList: (state) => state.buttonList,
    getMenuList: (state) => state.menuList,
    showMenuList: (state) => state.recursiveMenuList,
    getBreadcrumbList: (state) => getAllBreadcrumbList(state.breadcrumbList),
  },
});

export default authStore;
