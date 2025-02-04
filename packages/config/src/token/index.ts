import Cookies from "js-cookie";
import { localStorageProxy } from "@repo/utils";
import { FlatUserResult, UserResult } from "@repo/core";
export const userKey = "user-info";
export const TokenKey = "authorized-token";
import { useUserStoreHook } from "@repo/core";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";
const TokenSetting = {
  loginOutFunction: null,
  tokenRefreshFunction: null,
};
/** 获取`token` */
export function getToken(): UserResult {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return Cookies.get(TokenKey) ? JSON.parse(Cookies.get(TokenKey)) : localStorageProxy().getItem(userKey);
}

/** 设置`token` */
export function setToken(data: UserResult, userSetting: any = {}) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = userSetting;
  expires = new Date(~~data.expires * 1000).getTime(); // 如果后端直接设置时间戳，将此处代码改为expires = data.expires，然后把上面的DataInfo<Date>改成DataInfo<number>即可
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires >= 0
    ? Cookies.set(TokenKey, cookieString, {
        expires: (expires - Date.now()) / 86400000,
      })
    : Cookies.set(TokenKey, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay,
        }
      : {}
  );

  function setUserKey({ avatar, sysUserUsername, sysUserNickname, roles }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(sysUserUsername);
    useUserStoreHook().SET_NICKNAME(sysUserNickname);
    useUserStoreHook().SET_ROLES(roles);
    localStorageProxy().setItem(userKey, {
      refreshToken,
      accessToken,
      expires,
      avatar,
      sysUserUsername,
      sysUserNickname,
      roles,
    });
  }

  if (data?.userInfo?.sysUserUsername && data?.userInfo?.roles) {
    const { sysUserUsername, roles } = data.userInfo;
    setUserKey({
      avatar: data?.userInfo?.avatar ?? "",
      sysUserUsername,
      sysUserNickname: data?.userInfo?.sysUserNickname ?? "",
      roles,
    });
  } else {
    const avatar = localStorageProxy().getItem<FlatUserResult>(userKey)?.avatar ?? "";
    const sysUserUsername = localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserUsername ?? "";
    const sysUserNickname = localStorageProxy().getItem<FlatUserResult>(userKey)?.sysUserNickname ?? "";
    const roles = localStorageProxy().getItem<FlatUserResult>(userKey)?.roles ?? [];
    setUserKey({
      avatar,
      sysUserUsername,
      sysUserNickname,
      roles,
    });
  }
  return {
    accessToken,
    refreshToken,
    expires,
  };
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 移除`token`以及`refreshToken` */
export const logOut = () => {
  removeToken();
  useUserStoreHook().logOut();
};

/** 设置`token`的移除函数 */
export const setLoginOutFunction = (func: Function) => {
  TokenSetting.loginOutFunction = func;
};

/** 设置`token`的刷新函数 */
export const setRefreshTokenFunction = (func: Function) => {
  TokenSetting.tokenRefreshFunction = func;
};
export const handRefreshToken = (data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!TokenSetting.tokenRefreshFunction) {
      reject(null);
      return;
    }
    TokenSetting.tokenRefreshFunction(data)
      .then((item) => {
        resolve(item);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
/** 移除`token` */
export const removeToken = () => {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  localStorageProxy().removeItem(userKey);
};
