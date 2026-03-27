<script setup lang="ts">
/**
 * TagItem — 单个标签页项
 * 封装标签的图标、标题、关闭按钮渲染逻辑
 */
import {  useRenderIcon  } from "@repo/components/ReIcon";
import TagChrome from "./TagChrome.vue";
import CloseIcon from "@iconify-icons/ep/close";

const props = defineProps<{
  item: any;
  index: number;
  showModel: string;
  showTagIcon: boolean;
  isFixedTag: (item: any) => boolean;
  iconIsActive: (item: any, index: number) => boolean;
  scheduleIsActive: (item: any) => string;
  activeIndex: number;
  transformI18n: (key: any) => string;
}>();

const emit = defineEmits<{
  close: [item: any];
}>();
</script>

<template>
  <!-- 非 chrome 模式 -->
  <template v-if="showModel !== 'chrome'">
    <component
      v-if="showTagIcon && item.meta?.icon"
      :is="useRenderIcon(item.meta.icon)"
      class="tag-icon"
    />
    <span class="tag-title">{{ transformI18n(item.meta.title) }}</span>
    <span
      v-if="isFixedTag(item) ? false : iconIsActive(item, index) || (index === activeIndex && index !== 0)"
      class="el-icon-close close-size"
      @click.stop="emit('close', item)"
    >
      <IconifyIconOffline :icon="CloseIcon" />
    </span>
    <span v-if="showModel !== 'card'" :class="[scheduleIsActive(item)]" />
  </template>

  <!-- chrome 模式 -->
  <div v-else class="chrome-tab">
    <div class="chrome-tab__bg">
      <TagChrome />
    </div>
    <component
      v-if="showTagIcon && item.meta?.icon"
      :is="useRenderIcon(item.meta.icon)"
      class="tag-icon"
    />
    <span class="tag-title">{{ transformI18n(item.meta.title) }}</span>
    <span
      v-if="isFixedTag(item) ? false : index !== 0"
      class="chrome-close-btn"
      @click.stop="emit('close', item)"
    >
      <IconifyIconOffline :icon="CloseIcon" />
    </span>
    <span class="chrome-tab-divider" />
  </div>
</template>
