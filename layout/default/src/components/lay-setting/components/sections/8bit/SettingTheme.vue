<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTheme.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingTheme"
    kicker="Pixel Profile"
    title="像素主题控制台"
    description="主题皮肤与动画入口切成像素质感，保留复古游戏机面板的切换节奏。"
    icon="ri:gamepad-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

