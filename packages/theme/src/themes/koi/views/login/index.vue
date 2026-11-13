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
      <template #fallback>
        <!-- 登录样式是异步块：加载期间给一个与登录页同底的轻量占位，避免闪白 -->
        <div class="login-suspense" aria-live="polite" aria-busy="true">
          <span class="login-suspense__dot"></span>
          <span class="login-suspense__dot"></span>
          <span class="login-suspense__dot"></span>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, watchEffect, defineAsyncComponent } from "vue";
import { storeToRefs } from "pinia";
import useGlobalStore from "@repo/pinia/modules/global";
import { resolveLoginStyle } from "./loginStyles";
import KoiDark from "@repo/theme/koi/layouts/components/Header/components/ReDark.vue";
import KoiLanguage from "@repo/theme/koi/layouts/components/Header/components/ReLanguage.vue";
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

/* 登录样式块加载占位：与登录页同色，避免白闪 */
.login-suspense {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--el-bg-color-page, #f6f7fb);
}

html.dark .login-suspense {
  background: #08080e;
}

.login-suspense__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  opacity: 0.35;
  animation: login-suspense-pulse 1s ease-in-out infinite;
}

.login-suspense__dot:nth-child(2) {
  animation-delay: 0.16s;
}

.login-suspense__dot:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes login-suspense-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-suspense__dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>