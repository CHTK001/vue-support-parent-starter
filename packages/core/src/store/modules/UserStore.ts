import { defineStore } from "pinia";
import { resetRouter, router, store, type userType } from "../utils";
import { type FlatUserResult, getLogin, refreshTokenApi, getLogout, type UserInfoVO, type UserResult } from "../../api/common/user";
import { localStorageProxy, message } from "@repo/utils";
import { useConfigStore } from "./ConfigStore";

import { useMultiTagsStoreHook } from "./MultiTagsStore";
import { defaultRouterArrays, removeToken, setToken, setUserPerm, setUserRole, userKey } from "@repo/config";

export const useUserStore = defineStore({
  id: "pure-user",
  state: (): userType => ({
    // 头像
    avatar: localStorageProxy().getItem<FlatUserResult>(userKey)?.avatar ?? "",
    sysUserId: localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserId ?? "",
    tenantId: localStorageProxy().getItem<FlatUserResult>(userKey)?.tenantId ?? "",
    // 用户名
    username: localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserUsername ?? "",
    // 昵称
    nickname: localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserNickname ?? "",
    loginType: null,
    // 页面级别权限
    roles: localStorageProxy().getItem<FlatUserResult>(userKey)?.roles ?? [],
    perms: localStorageProxy().getItem<FlatUserResult>(userKey)?.perms ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7,
  }),
  actions: {
    async upgrade(userInfo: UserInfoVO) {
      this.SET_AVATAR(userInfo.avatar || userInfo.sysUserAvatar);
      this.SET_NICKNAME(userInfo.sysUserNickname);
    },
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },

    SET_TENANT(tenantId: string) {
      this.tenantId = tenantId;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
      setUserRole(roles);
    },
    SET_PERMS(perms: Array<string>) {
      this.perms = perms;
      setUserPerm(perms);
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(data) {
      this.loginType = data.loginType;
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then((item) => {
            const data = item.data;
            if (!data) {
              message("账号或密码错误", { type: "error" });
              reject(null);
              return;
            }
            setToken(data, {
              isRemembered: data?.isRemembered || true,
              expires: data?.expires || -1,
            });
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    load(userInfo) {
      if (typeof userInfo === "string") {
        userInfo = JSON.parse(userInfo);
      }
      return new Promise<UserResult>((resolve) => {
        setToken(userInfo, {
          isRemembered: userInfo?.isRemembered || true,
          expires: userInfo?.expires || -1,
        });
        resolve(userInfo);
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      removeToken();
      useConfigStore()?.clear();
      // useLayoutStore()?.clear();
      useMultiTagsStoreHook().handleTags("equal", [...defaultRouterArrays]);
      resetRouter();
      localStorageProxy().removeItem("async-routes");
      getLogout({
        loginType: this.loginType,
      });
      if (router.hasRoute("Login")) {
        router.push("/login");
      }
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<UserResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then((item) => {
            if (item) {
              const { data } = item;
              setToken(data, {
                isRemembered: data?.isRemembered || true,
                expires: data?.expires || -1,
              });
              resolve(data);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});

export function useUserStoreHook() {
  return useUserStore(store);
}
