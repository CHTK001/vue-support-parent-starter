import type { RouteRecordName } from "vue-router";

export type cacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type positionType = {
  startIndex?: number;
  length?: number;
  deleteCount?: number;
  path?: string;
};

export type appType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 判断是否手动点击Collapse
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
  viewportSize: { width: number; height: number };
};

export type multiType = {
  path: string;
  name: string;
  meta: any;
  query?: object;
  params?: object;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  ShowBarSetting: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  avatar?: string;
  sysUserId?: string | number;
  tenantId?: string;
  username?: string;
  loginType?: string;
  nickname?: string;
  managedDeptIds?: Array<string | number>;
  roleInfos?: Array<{
    roleCode: string;
    roleName?: string;
    readable?: boolean;
    writeable?: boolean;
    executable?: boolean;
  }>;
  roles?: Array<string>;
  perms?: Array<string>;
  agreementVersion?: string;
  agreementUpdatedAt?: string;
  agreementAcceptedVersion?: string;
  agreementAcceptedAt?: string;
  agreementNeedConfirm?: boolean;
  isRemembered?: boolean;
  loginDay?: number;
};
