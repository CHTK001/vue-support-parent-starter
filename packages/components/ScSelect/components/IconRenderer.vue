<template>
  <div class="icon-renderer">
    <IconifyIconOnline :icon="icon" :alt="alt" class="iconify-icon" />
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "../../ReIcon";

const props = defineProps({
  icon: {
    type: String,
    default: "ri:settings-3-line" // 默认图标
  },
  alt: {
    type: String,
    default: "icon"
  }
});
</script>

<style lang="scss" scoped>
.icon-renderer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .iconify-icon {
    width: 60%;
    height: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
