import { http, type ReturnResult } from "@/utils/http";

export type UserInfoVO = {
  sysUserId: number | string;
  sysUserUsername: string;
  sysUserNickname: string;
  sysUserPhone: string;
  sysUserEmail: string;
  avatar: string;
  roles: string[];
  perms: string[];
};
export type FlatUserResult = {
  accessToken: string;
  /** 用于调用刷新`accessToken`的接口时所需的`token` */
  refreshToken: string;
  /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
  expires: Number;
} & UserInfoVO;

export type UserResult = {
  userInfo: UserInfoVO;
  accessToken: string;
  /** 用于调用刷新`accessToken`的接口时所需的`token` */
  refreshToken: string;
  /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
  expires: Number;
};

export type RefreshTokenResult = {} & UserResult;

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<ReturnResult<UserResult>>("post", "/v2/user/login", {
    data
  });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<ReturnResult<RefreshTokenResult>>(
    "post",
    "/v2/user/refresh-token",
    {
      data
    }
  );
};
