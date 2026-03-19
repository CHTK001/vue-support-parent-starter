<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingMenu"
    kicker="Pixel Menu"
    title="像素菜单状态"
    description="菜单激活、徽标与动效统一收敛到复古像素块，避免出现半现代半像素的断层。"
    icon="ri:menu-4-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

