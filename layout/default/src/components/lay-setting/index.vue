<script setup lang="ts">
/**
 * lay-setting 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.1 - 布局级设置面板改为静态主题映射，避免切换时触发布局抖动
 */
import { useThemeComponent } from "../../hooks/useThemeComponent";
import ChristmasSetting from "./themes/Christmas.vue";
import DefaultSetting from "./themes/Default.vue";
import EightBitSetting from "./themes/EightBit.vue";
import FutureTechSetting from "./themes/FutureTech.vue";
import HalloweenSetting from "./themes/Halloween.vue";
import SpringFestivalSetting from "./themes/SpringFestival.vue";

// 设置面板属于布局主骨架的一部分，保持静态导入避免打开/切换时出现宽度抖动
const themeComponents = {
  default: DefaultSetting,
  "8bit": EightBitSetting,
  "spring-festival": SpringFestivalSetting,
  halloween: HalloweenSetting,
  christmas: ChristmasSetting,
  "future-tech": FutureTechSetting,
};

// 使用统一的主题切换 Hook
const { CurrentComponent } = useThemeComponent(themeComponents, DefaultSetting);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
