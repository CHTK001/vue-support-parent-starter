<template>
  <div class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i" @click="handleSwitchDark">
    <el-tooltip content="Dark mode" v-if="!globalStore.isDark">
      <KoiGlobalIcon name="koi-moon-side" size="18" />
    </el-tooltip>
    <el-tooltip content="Light mode" v-if="globalStore.isDark">
      <KoiGlobalIcon name="koi-sun-line" size="20" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "../../../utils/theme";
import { useKoiGlobalStore } from "../../../stores/global";

const globalStore = useKoiGlobalStore();
const { switchDark } = useTheme();

defineProps({ size: { type: Number, default: 20 } });

const handleSwitchDark = async (event: MouseEvent) => {
  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  if ((document as any).startViewTransition == undefined) {
    globalStore.setGlobalState("isDark", !globalStore.isDark);
    switchDark();
  } else {
    const transition = (document as any).startViewTransition(() => {
      globalStore.setGlobalState("isDark", !globalStore.isDark);
      switchDark();
    });
    await transition.ready;
    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
    document.documentElement.animate(
      { clipPath: globalStore.isDark ? clipPath : [...clipPath].reverse() },
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
::view-transition-old(root), ::view-transition-new(root) { mix-blend-mode: normal; animation: none; }
::view-transition-old(root) { z-index: 9999; }
::view-transition-new(root) { z-index: 1; }
.dark::view-transition-old(root) { z-index: 1; }
.dark::view-transition-new(root) { z-index: 9999; }
</style>
