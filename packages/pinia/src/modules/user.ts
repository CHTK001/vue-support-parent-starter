/**
 * user store（@repo/pinia）—— 用户令牌 / 登录信息 / 登录登出
 *
 * 登录逻辑统一走 core 的 api 封装（登录/登出/刷新 token/用户信息），
 * 令牌持久化用 core 的 storage + token 配置。任何主题/应用复用同一套。
 */
import { defineStore } from "pinia";
import { CACHE_PREFIX, getConfig } from "@repo/config";
import { clearAuthCache, setAccessToken, setRefreshToken, setUserInfo } from "@repo/utils";

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
      const { login, setUserRoles, setUserPerms } = await import("@repo/core");
      const res = await login(data);
      const result = res?.data;
      if (!result) {
        throw new Error("账号或密码错误");
      }
      this.setToken(result);
      // 同步到 core 权限模块（v-admin / v-role / v-perm 指令）
      if (result.roles?.length) setUserRoles(result.roles);
      if (result.perms?.length) setUserPerms(result.perms);
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
      const { logout } = await import("@repo/core");
      try {
        await logout({});
      } catch {
        // 忽略登出接口异常
      }
      this.$reset();
      // 静默清除用户级缓存（远程菜单 / 布局），下次登录重新拉取
      clearAuthCache();
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
