import { defineFakeRoute } from "vite-plugin-fake-server/client";

const createSetting = (
  sysSettingId: number,
  sysSettingGroup: string,
  sysSettingName: string,
  sysSettingValue: string,
  sysSettingValueType = "string",
) => ({
  sysSettingId,
  sysSettingName,
  sysSettingValue,
  sysSettingRemark: "",
  sysSettingStatus: 1,
  sysSettingValueType,
  sysSettingGroup,
  sysSettingFromApp: "system",
  sysSettingAppInner: "true",
  sysSettingConfig: "",
});

type SettingItem = ReturnType<typeof createSetting>;

const adminUser = {
  sysUserId: 1,
  sysUserUsername: "admin",
  sysUserNickname: "开发管理员",
  sysUserPhone: "13800000000",
  sysUserEmail: "admin@example.com",
  avatar: "https://avatars.githubusercontent.com/u/44761321",
  tenantId: "system-dev",
  roles: ["admin"],
  perms: ["system:*:*", "manage:user:page", "manage:role:page"],
};

const defaultSettings = [
  createSetting(1, "default", "SystemName", "系统管理"),
  createSetting(2, "default", "CheckCodeOpen", "false", "Boolean"),
  createSetting(3, "default", "CheckTotpCodeOpen", "false", "Boolean"),
  createSetting(4, "default", "SlidingBlockOpen", "false", "Boolean"),
  createSetting(5, "default", "OpenThirdPartyLogin", "false", "Boolean"),
];

const configSettings = [
  createSetting(101, "config", "Version", "1.0.0"),
  createSetting(102, "config", "SystemName", "系统管理"),
  createSetting(103, "config", "BaseUrl", "/"),
  createSetting(104, "config", "LoopDebuggerOpen", "false", "Boolean"),
  createSetting(105, "config", "CrashPageOpen", "false", "Boolean"),
  createSetting(106, "config", "WatermarkOpen", "false", "Boolean"),
  createSetting(107, "config", "WatermarkColor", "#409EFF", "Color"),
  createSetting(108, "config", "WatermarkAlpha", "0.15", "Number"),
  createSetting(109, "config", "WatermarkRotate", "-15", "Number"),
  createSetting(110, "config", "CodecResponseOpen", "false", "Boolean"),
  createSetting(111, "config", "CodecRequestOpen", "false", "Boolean"),
  createSetting(112, "config", "SocketOpen", "false", "Boolean"),
  createSetting(113, "config", "SocketProtocol", "socketio"),
  createSetting(114, "config", "SocketPath", "/socket.io"),
  createSetting(115, "config", "SocketUrl", "ws://127.0.0.1:18170"),
  createSetting(116, "config", "SocketStartupConnect", "true", "Boolean"),
];

const ssoSettings = [
  createSetting(201, "sso", "OpenThirdPartyLogin", "false", "Boolean"),
];

const settingsByGroup: Record<string, SettingItem[]> = {
  default: defaultSettings,
  config: configSettings,
  sso: ssoSettings,
};

const getSettingsByGroup = (group?: unknown) => {
  if (typeof group !== "string") {
    return [];
  }

  return settingsByGroup[group] || [];
};

export default defineFakeRoute([
  {
    url: "/system/api/v2/user/me",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      data: adminUser,
    }),
  },
  {
    url: "/system/api/v2/setting/default",
    method: "get",
    response: () => ({
      success: true,
      code: 200,
      data: defaultSettings,
    }),
  },
  {
    url: "/system/api/v2/setting/list",
    method: "get",
    response: ({ query }: { query?: Record<string, unknown> }) => ({
      success: true,
      code: 200,
      data: getSettingsByGroup(query?.sysSettingGroup),
    }),
  },
]);
