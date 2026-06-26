import LayoutKoi from "./index.vue";
export default LayoutKoi;

// Types
export type { KoiLayoutType, KoiGlobalState, KoiTabItem, KoiAuthState, TabsStyle } from "./types";

// Stores
export { useKoiGlobalStore } from "./stores/global";
export { useKoiTabsStore } from "./stores/tabs";
export { useKoiAuthStore } from "./stores/auth";
export { useKoiKeepAliveStore } from "./stores/keepAlive";

// Config
export { CACHE_PREFIX, HOME_URL, LOGIN_URL, DEFAULT_THEME } from "./config/index";

// Hooks
export { useScreenStore } from "./hooks/screen/index";