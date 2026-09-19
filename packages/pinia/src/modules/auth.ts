/**
 * auth store（@repo/pinia）—— 权限 / 菜单 / 用户信息
 *
 * 通用权限菜单状态：
 *  - 菜单：项目静态菜单 + 远程动态菜单（core api），组件解析走注册的菜单解析器
 *  - 用户信息：core getMe 接口
 *  - 权限码同步到 core permission（v-admin / v-role / v-perm 指令）
 */
import { defineStore } from "pinia";
import {
  getShowStaticAndDynamicMenuList,
  getAllBreadcrumbList,
  setUserInfo,
} from "@repo/utils";
import { getMenu, getMe, setUserRoles, setUserPerms } from "@repo/core";
import { getMenuResolver } from "../menuResolver";
import { getStaticMenu } from "../staticMenu";
import { log } from "@repo/utils";

// 菜单 / 用户信息（缓存策略见 core api）：
// 远程菜单走 cache-aside（先读 storage 缓存，没有才请求），减少刷新页面时的服务器压力。
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
        avatarFrame: 0,
        avatarFrameShow: 0,
        birthday: "",
        phone: "",
        email: "",
        idCard: "",
        nickname: "",
      },
    };
  },
  actions: {
    async listRouters() {
      const { generateRoutes, generateFlattenRoutes } = getMenuResolver();
      const staticRouter = getStaticMenu();
      // getMenu() 内部 cache-aside：有缓存直接用，没有请求并写回缓存
      let remoteMenu: any[] = [];
      try {
        const res = await getMenu();
        const data = res?.data;
        if (Array.isArray(data)) {
          remoteMenu = data;
        }
      } catch (e) {
        log.warn(`[auth] 远程菜单获取失败，使用静态菜单`, e);
      }

      this.menuList = generateFlattenRoutes(remoteMenu);
      this.recursiveMenuList = getShowStaticAndDynamicMenuList(staticRouter).concat(
        generateRoutes(getShowStaticAndDynamicMenuList(remoteMenu), 0),
      );
      this.breadcrumbList = staticRouter.concat(generateRoutes(remoteMenu, 0));
    },
    /** loading=false 时静默刷新（不触发顶部进度条） */
    async getLoginUserInfo(loading = true) {
      try {
        const res = await getMe(loading);
        const data = res?.data as any;
        if (data) {
          this.roleList = data.roles ?? data.roleInfos?.map((r: any) => r.roleCode) ?? [];
          this.buttonList = data.perms ?? [];
          this.loginUser = {
            userId: data.sysUserId ?? data.userId ?? "",
            loginName: data.sysUserUsername ?? data.username ?? data.loginName ?? "",
            sex: data.sex ?? "",
            avatar: data.avatar ?? data.sysUserAvatar ?? "",
            avatarFrame: data.sysUserAvatarFrame ?? data.avatarFrame ?? 0,
            avatarFrameShow: data.sysUserAvatarFrameShow ?? data.avatarFrameShow ?? 0,
            birthday: data.sysUserBirthday ?? data.birthday ?? "",
            phone: data.sysUserPhone ?? data.phone ?? "",
            email: data.sysUserEmail ?? data.email ?? "",
            idCard: data.sysUserCard ?? data.idCard ?? "",
            nickname: data.sysUserNickname ?? data.nickname ?? "",
          };
          setUserRoles(this.roleList);
          setUserPerms(this.buttonList);
          // userInfo 写入框架 storage（key "userInfo"），供 createApp 同步权限 / 其它模块读取
          setUserInfo(data);
        }
      } catch (e) {
        log.warn(`[auth] 用户信息获取失败，跳过`, e);
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
