<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTheme.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingTheme"
    kicker="Red Gold Theme"
    title="春节红金总控"
    description="春节主题入口优先强化中国红与鎏金文字，保证换肤、动画和皮肤切换都落到同一视觉语言。"
    icon="ri:vip-crown-2-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

