import { ref, watch } from "vue";
import { uniStorage } from "./useUniStorage";

const THEME_KEY = "uni-layout.theme";

export type UniThemeMode = "light" | "dark";

const mode = ref<UniThemeMode>(uniStorage.get<UniThemeMode>(THEME_KEY, "light"));

const applyTheme = (m: UniThemeMode) => {
  // H5 下通过 class 切换
  // #ifdef H5
  document.documentElement.setAttribute("data-uni-theme", m);
  // #endif
  uniStorage.set(THEME_KEY, m);
};

applyTheme(mode.value);

watch(mode, applyTheme);

export function useUniTheme() {
  const isDark = ref(mode.value === "dark");

  const toggle = () => {
    mode.value = mode.value === "light" ? "dark" : "light";
    isDark.value = mode.value === "dark";
  };

  const setTheme = (m: UniThemeMode) => {
    mode.value = m;
    isDark.value = m === "dark";
  };

  return { mode, isDark, toggle, setTheme };
}
