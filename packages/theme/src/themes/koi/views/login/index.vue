<template>
  <div class="login-page-container">
    <div class="flex flex-items-center pos-absolute top-8px right-8px z-10 h-40px gap-2px p-y-2px p-x-12px bg-#F4F4F5 dark:bg-#141414 border-1px border-solid border-#E4E7ED dark:border-#4C4D4F rounded-20px shadow-[0_4px_12px_rgb(0_0_0_/_15%)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all transition-300ms transition-ease">
      <ReThemeColor />
      <KoiLanguage />
      <KoiDark />
      <ReLoginStylePicker />
    </div>

    <Suspense>
      <component :is="loginStyleComp" />
    </Suspense>

    <ReLoading />
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watchEffect, defineAsyncComponent } from "vue";
import { storeToRefs } from "pinia";
import useGlobalStore from "@repo/pinia/modules/global";
import { resolveLoginStyle } from "./loginStyles";
import KoiDark from "@repo/theme/koi/layouts/components/Header/components/Dark.vue";
import ReLoading from "./components/ReLoading.vue";
import KoiLanguage from "@repo/theme/koi/layouts/components/Header/components/Language.vue";
import ReThemeColor from "./components/ReThemeColor.vue";
import ReLoginStylePicker from "./components/ReLoginStylePicker.vue";

const globalStore = useGlobalStore();
const { loginStyle } = storeToRefs(globalStore);

const loginStyleComp = shallowRef(defineAsyncComponent(resolveLoginStyle("default")));

watchEffect(() => {
  const loader = resolveLoginStyle(loginStyle.value);
  loginStyleComp.value = defineAsyncComponent(loader);
});
</script>

<style scoped>
.login-page-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>