/**
 * user store（@repo/pinia）—— 用户令牌 / 登录信息 / 登录登出
 *
 * 登录逻辑统一走 core 的 api 封装（登录/登出/刷新 token/用户信息），
 * 令牌持久化用 core 的 storage + token 配置。任何主题/应用复用同一套。
 */
import { defineStore } from "pinia";
import { CACHE_PREFIX, getConfig } from "@repo/config";
import { clearAllAuthData, setAccessToken, setRefreshToken, setUserInfo } from "@repo/utils";

/** 用户信息 */
export interface UserInfo {
  userId?: string | number;
  username?: string;
  nickname?: string;
  avatar?: string;
  roles?: string[];
  perms?: string[];
  [key: string]: unknown;
}

const userStore = defineStore("user", {
  persist: {
    key: CACHE_PREFIX + "user",
  },
  state: (): any => {
    return {
      token: "",
      accessToken: "",
      refreshToken: "",
      expires: 0,
      username: "",
      nickname: "",
      avatar: "",
      roles: [] as string[],
      perms: [] as string[],
      userInfo: {} as UserInfo,
    };
  },
  actions: {
    /** 设置登录态（登录/刷新成功后调用） */
    setToken(data: {
      accessToken?: string;
      refreshToken?: string;
      expires?: number;
      username?: string;
      nickname?: string;
      avatar?: string;
      roles?: string[];
      perms?: string[];
      userInfo?: UserInfo;
    }) {
      const { accessToken, refreshToken, expires, username, nickname, avatar, roles, perms, userInfo } = data;
      this.accessToken = accessToken || "";
      this.refreshToken = refreshToken || "";
      this.expires = expires || 0;
      this.token = accessToken || "";
      this.username = username || "";
      this.nickname = nickname || "";
      this.avatar = avatar || "";
      this.roles = roles || [];
      this.perms = perms || [];
      this.userInfo = userInfo || {};
      // accessToken / refreshToken 写入框架 storage，供 axios 拦截器与定时刷新读取
      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      // userInfo 写入框架 storage（key "userInfo"），供 createApp 同步权限 / 其它模块读取
      if (userInfo && Object.keys(userInfo).length > 0) {
        setUserInfo(userInfo);
      }
    },
    /** 登录（走 core api） */
    async loginByUsername(data: Record<string, unknown>) {
      const { login, setUserRoles, setUserPerms, refreshDefaultSetting } = await import("@repo/core");
      const res = await login(data);
      const result = res?.data;
      if (!result) {
        throw new Error(res?.msg || "账号或密码错误");
      }
      this.setToken(result);
      if (result.roles?.length) setUserRoles(result.roles);
      if (result.perms?.length) setUserPerms(result.perms);
      // 令牌就绪后补拉后端配置（能力开关等），失败静默降级为本地配置
      void refreshDefaultSetting();
      return result;
    },
    /** 刷新 token */
    async refreshToken() {
      const { refreshToken, setUserRoles, setUserPerms } = await import("@repo/core");
      const res = await refreshToken({ refreshToken: this.refreshToken });
      const result = res?.data;
      if (result) {
        this.setToken(result);
        if (result.roles?.length) setUserRoles(result.roles);
        if (result.perms?.length) setUserPerms(result.perms);
      }
      return result;
    },
    /** 登出 */
    async logOut() {
      const { logout, invalidateSessionScope } = await import("@repo/core");
      // <b>先作废会话作用域，再发登出请求。</b>顺序不能反：
      // ① 登出只清本地令牌，**停不掉已发出的请求**。不中断的话，登出前发的那批
      //    请求（定时刷新、菜单、列表）还会陆续返回并写回本地 ——
      //    最严重的是刷新响应把 accessToken / refreshToken 写回去，
      //    用户点了「退出登录」却仍是登录态，且永远登出不掉。
      // ② 登出请求在**新的**作用域里发出，不受这次 abort 波及，能正常打到服务端。
      invalidateSessionScope();
      try {
        await logout({});
      } catch {
        // 忽略登出接口异常：本地态照常清理，否则用户会卡在「登不出去」
      }
      this.$reset();
      // 清除令牌 + 菜单缓存 + 布局缓存，下次登录重新拉取
      clearAllAuthData();
    },
    setLoginName(loginName: string) {
      this.username = loginName;
    },
    /** 获取 accessToken（供 axios 拦截器） */
    getAccessToken(): string {
      return this.accessToken || this.token;
    },
  },
  getters: {},
});

export default userStore;
