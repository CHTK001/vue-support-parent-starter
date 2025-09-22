<script setup lang="ts">
import { useGlobal } from "@pureadmin/utils";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "../../../hooks/useNav";

import MenuFold from "@iconify-icons/ri/menu-fold-fill";

interface Props {
  isActive: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false,
});

const { t } = useI18n();
const { tooltipEffect } = useNav();

const iconClass = computed(() => {
  return ["w-[16px]", "h-[16px]", "inline-block", "align-middle", "cursor-pointer", "duration-&lsqb;100ms&rsqb"];
});

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeColor = computed(() => $storage.layout?.themeColor);

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

const toggleClick = () => {
  emit("toggleClick");
};
</script>

<template>
  <div class="left-collapse" :class="{ 'collapsed-state': !isActive }">
    <IconifyIconOffline
      v-tippy="{
        content: isActive ? t('buttons.pureClickCollapse') : t('buttons.pureClickExpand'),
        theme: tooltipEffect,
        hideOnClick: 'toggle',
        placement: 'right',
      }"
      :icon="MenuFold"
      :class="[iconClass, themeColor === 'light' ? '' : 'text-primary']"
      :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
      @click="toggleClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.left-collapse {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 0 6px -3px var(--el-color-primary);
  z-index: 10000;
  /* 确保收缩按钮在悬浮菜单弹出层之上 */
  pointer-events: auto;
  /* 确保可以接收鼠标事件 */
  background: var(--el-bg-color-overlay);
  /* 添加背景色确保可见性 */
  border-top: 1px solid var(--el-border-color-light);
  /* 添加顶部边框分隔 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 居中对齐 */
  cursor: pointer;
  /* 鼠标指针 */
  transition: all 0.3s ease;
  /* 平滑过渡 */

  &:hover {
    background: var(--el-color-primary-light-9);
    /* hover效果 */
  }

  /* 收缩状态下的特殊样式 */
  &.collapsed-state {
    background: var(--el-color-primary-light-8);
    border-top: 2px solid var(--el-color-primary);
    box-shadow: 0 0 8px -2px var(--el-color-primary);

    &::before {
      content: "";
      position: absolute;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: var(--el-color-primary);
      border-radius: 1px;
    }

    &:hover {
      background: var(--el-color-primary-light-7);
      box-shadow: 0 0 12px -1px var(--el-color-primary);
    }
  }
}
</style>
