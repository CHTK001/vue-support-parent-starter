/**
 * Theme runtime sync
 *
 * Layout theme (header / aside / menu / optimum)
 *   → theme-vars.scss, toggle html class for instant browser repaint
 *
 * User theme color themeColor (#2992FF etc.)
 *   → themeColor.ts, only writes primary + light-1~9 + dark-2
 */
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { DEFAULT_THEME } from "../config/index";
import { useKoiGlobalStore } from "../stores/global";
import { applyPrimaryColorVars } from "./themeColor";

/** Global singleton: only register watch once */
let themeWatcherInitialized = false;

export const useTheme = () => {
  const globalStore = useKoiGlobalStore();
  const { layout, isDark, themeColor, isGrey, isWeak, asideInverted, headerInverted } = storeToRefs(globalStore);

  const applyGreyOrWeak = () => {
    const html = document.documentElement;
    html.classList.toggle("grey-mode", isGrey.value);
    html.classList.toggle("weak-mode", isWeak.value);
  };

  const applyTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark", isDark.value);
    html.style.colorScheme = isDark.value ? "dark" : "light";
    const effectiveHeaderInverted =
      headerInverted.value || (layout.value === "horizontal" && asideInverted.value);
    html.classList.toggle("header-inverted", effectiveHeaderInverted && !isDark.value);
    html.classList.toggle("aside-inverted", asideInverted.value && !isDark.value);
    html.classList.toggle("layout-horizontal", layout.value === "horizontal");
    applyPrimaryColorVars(html, themeColor.value || DEFAULT_THEME, isDark.value);
  };

  const changeGreyOrWeak = (type: "grey" | "weak", value: boolean) => {
    const html = document.documentElement;
    html.classList.toggle("grey-mode", type === "grey" && value);
    html.classList.toggle("weak-mode", type === "weak" && value);
    const propName = type === "grey" ? "isWeak" : "isGrey";
    globalStore.setGlobalState(propName, false);
  };

  if (!themeWatcherInitialized) {
    themeWatcherInitialized = true;
    watch([layout, isDark, themeColor, asideInverted, headerInverted], applyTheme, { immediate: true });
    watch([isGrey, isWeak], applyGreyOrWeak, { immediate: true });
  }

  const switchDark = () => {
    applyTheme();
  };

  const changeThemeColor = (val: string | null) => {
    if (!val) {
      val = DEFAULT_THEME;
      ElMessage({ type: "success", message: "Theme color reset to default" });
    }
    globalStore.setGlobalState("themeColor", val);
    applyPrimaryColorVars(document.documentElement, val, isDark.value);
  };

  const initThemeConfig = () => {
    applyTheme();
    applyGreyOrWeak();
  };

  return {
    initThemeConfig,
    switchDark,
    changeThemeColor,
    changeGreyOrWeak,
    applyTheme
  };
};
