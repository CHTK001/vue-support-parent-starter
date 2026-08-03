<template>
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i" @click="handleSwitchDark">
    <!-- 明亮模式 -->
    <el-tooltip :content="$t('header.darkMode')" v-if="!globalStore.isDark">
      <ReIcon name="koi-moon-side" size="18" />
    </el-tooltip>
    <!-- 暗黑模式 -->
    <el-tooltip :content="$t('header.lightMode')" v-if="globalStore.isDark">
      <ReIcon name="koi-sun-line" size="20" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();
const { switchDark } = useTheme();

defineProps({
  size: {
    type: Number,
    default: 20
  }
});

/** 暗黑主题和明亮主题切换 */
const handleSwitchDark = async (event: MouseEvent) => {
  const x = event.clientX;
  const y = event.clientY;
  // 画圆
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  // @ts-ignore
  if (document.startViewTransition == undefined) {
    const willBeDark = !globalStore.isDark;
    /** 明亮和暗黑模式核心逻辑 */
    // 同步更新 themeMode，使 resolveDarkByMode 能正确判定
    globalStore.setGlobalState("themeMode", willBeDark ? "dark" : "light");
    globalStore.setGlobalState("isDark", willBeDark);
    switchDark();
    /** 明亮和暗黑模式核心逻辑 */
  } else {
    // @ts-ignore
    const transition = document.startViewTransition(() => {
      const willBeDark = !globalStore.isDark;
      /** 明亮和暗黑模式核心逻辑 */
      // 同步更新 themeMode，使 resolveDarkByMode 能正确判定
      globalStore.setGlobalState("themeMode", willBeDark ? "dark" : "light");
      globalStore.setGlobalState("isDark", willBeDark);
      switchDark();
      /** 明亮和暗黑模式核心逻辑 */
    });
    await transition.ready;
    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
    document.documentElement.animate(
      {
        clipPath: globalStore.isDark ? clipPath : [...clipPath].reverse()
      },
      {
        duration: 300,
        easing: "ease-in",
        fill: "both",
        pseudoElement: globalStore.isDark ? "::view-transition-new(root)" : "::view-transition-old(root)"
      }
    );
  }
};
</script>

<style lang="scss" scoped></style>
<style lang="scss">
::view-transition-old(root),
::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: none;
}
::view-transition-old(root) {
  z-index: 9999;
}
::view-transition-new(root) {
  z-index: 1;
}
.dark::view-transition-old(root) {
  z-index: 1;
}
.dark::view-transition-new(root) {
  z-index: 9999;
}
</style>
