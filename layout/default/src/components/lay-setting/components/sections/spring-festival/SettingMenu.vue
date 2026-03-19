<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingMenu"
    kicker="Festival Menu"
    title="春节菜单状态"
    description="把菜单文字、hover 与激活态收紧到红底金字体系，避免当前状态不明显、不够聚焦。"
    icon="ri:menu-search-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

