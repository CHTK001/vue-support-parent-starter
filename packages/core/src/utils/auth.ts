import { useUserStoreHook } from "../store/modules/UserStore";
import type {
  FlatUserResult,
  UserResult,
} from "../api/common/user";
import { localStorageProxy } from "@repo/utils";
import { buildStoredUserResult, type StoredUserResult } from "./auth-payload";
import {
  getToken as getGlobalToken,
  removeToken as removeGlobalToken,
  setLoginOutFunction,
  setRefreshTokenFunction,
  setToken as setGlobalToken,
  userKey,
} from "@repo/config";

/** 获取`token` */
export function getToken(): UserResult {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return getGlobalToken() || localStorageProxy().getItem(userKey);
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`、`refreshToken`这三条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`refreshToken`、`expires`这六条信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 * @param data - 用户数据，包含 accessToken、refreshToken、expires 等信息
 * @param userSetting - 用户设置，包含 isRemembered 和 expires 等信息（expires 会被忽略，使用 data.expires）
 */
export function setToken(
  data: UserResult,
  userSetting?: { isRemembered?: boolean; expires?: number },
) {
  const userStore = useUserStoreHook();
  // setGlobalToken 期望的 userSetting 是 { isRemembered, loginDay }，而不是 { isRemembered, expires }
  const setting = {
    isRemembered:
      userSetting?.isRemembered ??
      data?.isRemembered ??
      userStore.isRemembered ??
      true,
    loginDay: userStore.loginDay ?? 7,
  };
  const { accessToken, refreshToken, expires } = setGlobalToken(data, setting);
  setLoginOutFunction(useUserStoreHook().logOut);
  setRefreshTokenFunction(useUserStoreHook().handRefreshToken);
  const previousUserInfo =
    localStorageProxy().getItem<StoredUserResult>(userKey) || null;
  const storedUserInfo = buildStoredUserResult(data, {
    accessToken,
    refreshToken,
    expires,
    isRemembered: setting.isRemembered,
    fallback: previousUserInfo,
  });

  localStorageProxy().setItem(userKey, storedUserInfo);

  userStore.SET_AVATAR(storedUserInfo.avatar || "");
  userStore.sysUserId = storedUserInfo.sysUserId ?? "";
  userStore.SET_TENANT(storedUserInfo.tenantId || "");
  userStore.SET_USERNAME(storedUserInfo.sysUserUsername || "");
  userStore.SET_NICKNAME(storedUserInfo.sysUserNickname || "");
  userStore.SET_ROLES(storedUserInfo.roles || []);
  userStore.SET_PERMS(storedUserInfo.perms || []);
  userStore.SET_ISREMEMBERED(setting.isRemembered);
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  removeGlobalToken();
  localStorageProxy().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};
