import { defineStore } from "pinia";
import { type userType, store, router, resetRouter, routerArrays } from "../utils";
import { type UserResult, type UserInfoVO, type FlatUserResult, getLogin, refreshTokenApi } from "@/api/user";
import { localStorageProxy } from "@/utils/storage";
import { useConfigStore } from "./config";

import { useMultiTagsStoreHook } from "./multiTags";
import { setToken, removeToken, userKey } from "@/utils/auth";
import { useLayoutStore } from "./layout";

export const useUserStore = defineStore({
  id: "pure-user",
  state: (): userType => ({
    // 头像
    avatar: localStorageProxy().getItem<FlatUserResult>(userKey)?.avatar ?? "",
    // 用户名
    username: localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserUsername ?? "",
    // 昵称
    nickname: localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserNickname ?? "",
    // 页面级别权限
    roles: localStorageProxy().getItem<FlatUserResult>(userKey)?.roles ?? [],
    perms: localStorageProxy().getItem<FlatUserResult>(userKey)?.perms ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
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
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then(item => {
            const { data } = item;
            setToken(data);
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      removeToken();
      useConfigStore()?.clear();
      useLayoutStore()?.close();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<UserResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(item => {
            if (item) {
              const { data } = item;
              setToken(data);
              resolve(data);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
