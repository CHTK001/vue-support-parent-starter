export const TOKEN_KEY = "uni-mall.token";

export const getToken = (): string => {
  try {
    return uni.getStorageSync(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

export const setToken = (token: string) => {
  try {
    uni.setStorageSync(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const clearToken = () => {
  try {
    uni.removeStorageSync(TOKEN_KEY);
  } catch {
    // ignore
  }
};
