import { default as LayoutDefault } from "./index.vue";
export { useNav } from "./hooks/useNav";
export { useLayout } from "./hooks/useLayout";
export { useTranslationLang } from "./hooks/useTranslationLang";
export { useDataThemeChange } from "./hooks/useDataThemeChange";
import { localStorageProxy } from "@repo/utils";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
window.onload = () => {
  registerRequestIdleCallback(() => {
    createFingerprint((finger) => {
      localStorageProxy().setItem("visitId", finger);
    });
  });
};
export default LayoutDefault;
