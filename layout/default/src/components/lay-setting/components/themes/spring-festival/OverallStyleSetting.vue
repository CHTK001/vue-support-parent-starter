<script setup lang="ts">
import BaseComponent from "../../base/OverallStyleSetting.vue";

// 主题特定组件，继承基础组件
// 可以在这里覆盖样式或添加主题特定的逻辑
</script>

<template>
  <BaseComponent />
</template>

<style lang="scss" scoped>
// 春节主题特定样式
html[data-skin="spring-festival"],
html.theme-spring-festival {
  // 可以在这里添加春节主题特定的样式覆盖
}
</style>
