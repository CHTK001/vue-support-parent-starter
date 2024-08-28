import { http, type ReturnResult } from "@/utils/http";

export type UserInfoVO = {
  sysUserId: number | string;
  sysUserUsername: string;
  sysUserNickname: string;
  sysUserPhone: string;
  sysUserEmail: string;
  avatar: string;
  sysUserAvatar?: string;
  roles: string[];
  perms: string[];
};
export type UserLog = {
  sysLogId: number | string;
  sysLogUsername: string;
  sysLogIp: string;
  sysLogAddress: string;
  sysLogIsp: string;
  sysLogUrl: string;
  sysLogParam: string;
  sysLogFrom: string;
  sysLogStatus: string;
} & SysBase;
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

/** 删除系统配置 */
export const fetchDeleteUser = id => {
  const params = { sysUserId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/user/delete", {
    params
  });
};

/** 保存用户配置 */
export const fetchSaveUser = setting => {
  return http.request<Boolean>("post", "/v2/user/save", { data: setting });
};

/** 更新用户配置 */
export const fetchUpdateUser = setting => {
  if (!setting.sysUserId) {
    return;
  }
  return http.request<ReturnResult<object>>("put", "/v2/user/update", {
    data: setting
  });
};
/** 更新用户信息 */
export const fetchUpdateUserOwner = setting => {
  return http.request<ReturnResult<object>>("put", "/v2/user/updateOwner", {
    data: setting
  });
};

/** 获取用户配置 */
export const fetchPageUser = params => {
  return http.request<ReturnResult<object[]>>("get", "/v2/user/page", {
    params
  });
};
/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<ReturnResult<UserResult>>("post", "/v2/user/login", {
    data
  });
};

/** 获取当前用户信息 */
export const getMine = () => {
  return http.request<ReturnResult<UserResult>>("get", "/v2/user/me", {});
};

export const getMineLogs = params => {
  return http.request<ReturnResult<UserLog>>("get", "/v2/user/log/mine-logs", {
    params
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
