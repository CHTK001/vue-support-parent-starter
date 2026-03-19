<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingMenu"
    kicker="Spooky Menu"
    title="万圣菜单状态"
    description="菜单文本、hover 和激活态统一切到南瓜橙加暗紫底，避免出现文字浮不出来的情况。"
    icon="ri:menu-fold-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

