<template>
  <div
    v-if="isEnabled"
    :class="['menu-active-indicator', `indicator-${currentTheme}`]"
  >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { emitter } from "@repo/core";
import { responsiveStorageNameSpace } from "@repo/config";
import type { StorageConfigs } from "@repo/config";
import { localStorageProxy } from "@repo/utils";

interface Props {
  /** 是否激活状态 */
  isActive?: boolean;
  /** 是否在弹出菜单中 */
  isPopup?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isPopup: false,
});

// 当前主题
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`,
  )?.systemTheme || "default",
);

// 是否启用装饰
const isEnabled = computed(() => false);

onMounted(() => {
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
</script>

<style lang="scss" scoped>
.menu-active-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

// ==================== 已移除的节日主题 ====================
</style>
