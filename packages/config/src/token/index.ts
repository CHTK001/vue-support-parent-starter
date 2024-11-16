import Cookies from "js-cookie";
import { localStorageProxy } from "@repo/utils";
import { UserResult } from "../types/user";
export const userKey = "user-info";
export const TokenKey = "authorized-token";

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
export function setToken(data: UserResult, expires: number) {
  return Cookies.set(TokenKey, JSON.stringify(data), { expires: expires });
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 移除`token`以及`refreshToken` */
export const logOut = () => {
  TokenSetting.loginOutFunction && TokenSetting.loginOutFunction();
};

/** 设置`token`的移除函数 */
export const setLoginOutFunction = (func: Function) => {
  TokenSetting.loginOutFunction = func;
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
  return Cookies.remove(TokenKey);
};
