export * from "./src/config/socket";
export * from "./src/router";
export * from "./src/router/utils";
export * from "./src/store";

export * from "./src/api/common/setting";
export * from "./src/api/common/sfc";
export * from "./src/api/common/user";
export * from "./src/api/common/weather";
export * from "./src/api/common/dict";
export * from "./src/api/common/sms";
export * from "./src/api/common/email";
export * from "./src/api/common/big-model";
export * from "./src/api/common/template";
export * from "./src/api/common/user-log";
export * from "./src/api/common/totp";
export * from "./src/api/common/project";
export * from "./src/api/common/common";
export * from "./src/api/common/page-common-video";

import { useAppStoreHook } from "./src/store/modules/AppStore";
export * from "./src/store/modules/ConfigStore";
export * from "./src/store/modules/EpThemeStore";
export * from "./src/store/modules/GridStackStore";
export * from "./src/store/modules/MultiTagsStore";
export * from "./src/store/modules/PermissionStore";
export * from "./src/store/modules/LayoutLayoutStore";
export * from "./src/store/modules/LayoutStore";
export * from "./src/store/modules/SettingStore";
export * from "./src/store/modules/UserStore";
export * from "./src/store/modules/WeatherStore";
export * from "./src/utils/auth";
export * from "./src/utils/mitt";
export * from "./src/utils/fingerprintjs2";
export * from "./src/utils/compatibility";
export * from "./src/utils/propTypes";
export * from "./src/config/socket";

export type * from "./src/utils/propTypes";
export type * from "./src/types";
export type * from "./src/store/types";
export type * from "./src/api/common/user";
export type * from "./src/api/common/user-log";
export type * from "./src/api/common/setting";
export type * from "./src/api/common/sfc";
export type * from "./types/router";
import type { RouteConfigsTable } from "./types/router";

export { useAppStoreHook, type RouteConfigsTable };
