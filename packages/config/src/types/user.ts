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
