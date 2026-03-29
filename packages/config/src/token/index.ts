import Cookies from "js-cookie";
import { decryptStorageValue, encryptStorageKey } from "@repo/codec-wasm";
import { getConfig } from "../config";

export const userKey = "user-info";
export const TokenKey = "authorized-token";
const TOKEN_EXPIRES_SECOND_THRESHOLD = 1_000_000_000_000;

/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): any {
  const cookieToken = parseTokenPayload(Cookies.get(TokenKey));
  if (hasAccessToken(cookieToken)) {
    return cookieToken;
  }

  const storageToken = readTokenFromUserStorage();
  if (hasAccessToken(storageToken)) {
    return {
      ...(cookieToken || {}),
      ...storageToken,
    };
  }

  return cookieToken || null;
}

function parseTokenPayload(raw?: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasAccessToken(token: any) {
  return typeof token?.accessToken === "string" && token.accessToken.trim() !== "";
}

function readTokenFromUserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const config = getConfig();
    const encryptedKey = encryptStorageKey(userKey, config.SystemCode);
    const rawValue =
      window.localStorage.getItem(encryptedKey) ||
      window.localStorage.getItem(userKey);

    if (!rawValue) {
      return null;
    }

    const decodedValue =
      config.StorageEncode === false
        ? rawValue
        : decryptStorageValue(
            rawValue,
            config.StorageKey,
            config.SystemCode,
            config.StorageKey,
            config.StorageEncode,
          );

    const parsedValue = parseTokenPayload(decodedValue || rawValue);
    if (!hasAccessToken(parsedValue)) {
      return null;
    }

    return {
      accessToken: parsedValue.accessToken,
      refreshToken: parsedValue.refreshToken || "",
      expires: normalizeTokenExpires(parsedValue.expires),
    };
  } catch {
    return null;
  }
}

/**
 * 统一解析后端返回的 token 过期时间
 * 支持秒级时间戳、毫秒级时间戳、日期字符串和缺省值
 */
export function normalizeTokenExpires(expires: unknown): number {
  if (expires == null) {
    return 0;
  }

  if (typeof expires === "number" && Number.isFinite(expires)) {
    if (expires <= 0) {
      return 0;
    }
    return expires < TOKEN_EXPIRES_SECOND_THRESHOLD ? expires * 1000 : expires;
  }

  if (typeof expires === "string") {
    const normalizedValue = expires.trim();
    if (!normalizedValue) {
      return 0;
    }

    const numberValue = Number(normalizedValue);
    if (Number.isFinite(numberValue)) {
      return normalizeTokenExpires(numberValue);
    }

    const dateValue = Date.parse(normalizedValue);
    return Number.isFinite(dateValue) ? dateValue : 0;
  }

  return 0;
}

/** 设置`token` */
export function setToken(data: any, userSetting: any = {}) {
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = userSetting;
  const expires = normalizeTokenExpires(data?.expires);
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
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
      : {},
  );

  return {
    accessToken,
    refreshToken,
    expires,
  };
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  if (!token) {
    return null;
  }
  return "Bearer " + token;
};

/** 移除`token`以及`refreshToken` */
export const logOut = () => {
  removeToken();
  if (TokenSetting.loginOutFunction) {
    TokenSetting.loginOutFunction();
  }
};

const TokenSetting = {
  loginOutFunction: null,
  tokenRefreshFunction: null,
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
    if (TokenSetting.tokenRefreshFunction) {
      TokenSetting.tokenRefreshFunction(data)
        .then((item) => {
          resolve(item);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      resolve(null);
    }
  });
};

/** 移除`token` */
export const removeToken = () => {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
};
