<template>
  <div class="icon-renderer">
    <!-- HTTP图标 -->
    <img v-if="isHttpIcon" :src="icon" :alt="alt" class="http-icon" @error="handleImageError" />
    <!-- Iconify图标 -->
    <IconifyIconOnline v-else :icon="iconName" class="iconify-icon" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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

// 判断是否为HTTP图标
const isHttpIcon = computed(() => {
  return props.icon.startsWith("http://") || props.icon.startsWith("https://");
});

// 获取图标名称，如果不是HTTP图标且不包含冒号，则添加ri:前缀
const iconName = computed(() => {
  if (isHttpIcon.value) {
    return "";
  }

  // 如果图标名称不包含冒号，默认添加ri:前缀
  if (!props.icon.includes(":")) {
    return `ri:${props.icon}`;
  }

  return props.icon;
});

// 处理图片加载错误
const handleImageError = (event: Event) => {
  console.warn(`Failed to load icon image: ${props.icon}`);
  // 可以在这里设置一个默认的fallback图标
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
};
</script>

<style lang="scss" scoped>
.icon-renderer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  .http-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }

  .iconify-icon {
    width: 60%;
    height: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
