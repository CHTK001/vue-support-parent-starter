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
  applyFlattenSingleRoot,
  getAllBreadcrumbList,
  setUserInfo,
} from "@repo/utils";
import { getMenu, getMe, setUserRoles, setUserPerms } from "@repo/core";
import { getConfig } from "@repo/config";
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
    /** 拉取菜单并写入 store；返回值表示远程菜单是否拉取失败（区别于「确实没有菜单」） */
    async listRouters(opts?: { skipRemote?: boolean }): Promise<boolean> {
      const { generateRoutes, generateFlattenRoutes } = getMenuResolver();
      const staticRouter = getStaticMenu();
      // 仅 remote/all 模式拉取平台动态菜单（与 core/router/guard.ts 同一判定）。
      // skipRemote（无登录态的无鉴权应用）时只构建本地静态菜单，不发起必然 401/403 的远程请求。
      // static/module 应用菜单全在本地，后端未实现 /v2/user/menu 时请求会 401/403，
      // 被 core 的 http 拦截器判为会话失效并清令牌跳 /login。
      const mode = getConfig().route.mode;
      const useRemoteMenu = !opts?.skipRemote && (mode === "remote" || mode === "all");
      let remoteMenu: any[] = [];
      let remoteFailed = false;
      if (useRemoteMenu) {
        // getMenu() 内部 cache-aside：有缓存直接用，没有请求并写回缓存
        try {
          const res = await getMenu();
          const data = res?.data;
          if (Array.isArray(data)) {
            remoteMenu = data;
          } else {
            // 响应不是数组：接口异常/业务失败，不能当成「该账号没有菜单」
            remoteFailed = true;
          }
        } catch (e) {
          remoteFailed = true;
          log.warn(`[auth] 远程菜单获取失败，使用静态菜单`, e);
        }
      }

      this.menuList = generateFlattenRoutes(remoteMenu);
      const visibleStaticMenus = getShowStaticAndDynamicMenuList(staticRouter);
      // 业务注册的兜底菜单仅在远程菜单不可用/为空时参与侧边栏；远程菜单成功后
      // 隐藏兜底节点，避免同名路径重复渲染。
      const baseMenus = remoteMenu.length
        ? visibleStaticMenus.filter((item: { meta?: Record<string, unknown> }) => item?.meta?.isRemoteFallback !== true)
        : visibleStaticMenus;
      let mergedMenu = baseMenus.concat(
        generateRoutes(getShowStaticAndDynamicMenuList(remoteMenu), 0),
      );
      // 单根炸开（默认关闭）：顶级仅一个分组时把子菜单提升为顶级
      if (getConfig().menu.flattenSingleRoot) {
        mergedMenu = applyFlattenSingleRoot(mergedMenu);
      }
      this.recursiveMenuList = mergedMenu;
      this.breadcrumbList = baseMenus.concat(generateRoutes(remoteMenu, 0));
      return remoteFailed;
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
