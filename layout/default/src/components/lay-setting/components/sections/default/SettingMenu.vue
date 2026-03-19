<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingMenu"
    kicker="Menu States"
    title="默认菜单表现"
    description="菜单动效、文字和激活态以可读性优先，提供所有主题的基础交互模板。"
    icon="ri:menu-2-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

