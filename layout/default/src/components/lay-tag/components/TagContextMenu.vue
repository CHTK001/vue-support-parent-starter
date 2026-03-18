<script setup lang="ts">
/**
 * TagContextMenu — 标签页右键菜单
 * 封装右键菜单的渲染逻辑，接收菜单项和位置信息
 */
defineProps<{
  visible: boolean;
  style: Record<string, string>;
  items: Array<{
    icon: any;
    text: string;
    show: boolean;
    disabled?: boolean;
    divided?: boolean;
  }>;
  transformI18n: (key: any) => string;
}>();

const emit = defineEmits<{
  select: [key: number, item: any];
}>();
</script>

<template>
  <ul v-show="visible" class="tag-contextmenu" :style="style">
    <li
      v-for="(item, key) in items.slice(0, 6)"
      :key="key"
      v-show="item.show"
      :class="{ 'is-disabled': item.disabled }"
      @click="!item.disabled && emit('select', key, item)"
    >
      <IconifyIconOffline :icon="item.icon" />
      {{ transformI18n(item.text) }}
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.tag-contextmenu {
  position: absolute;
  z-index: 3000;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  min-width: 140px;
  border-radius: var(--dt-radius-md, 8px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--dt-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
  border: 1px solid var(--dt-border-color, rgba(0, 0, 0, 0.06));
  font-size: 13px;
  color: var(--el-text-color-regular);

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    cursor: pointer;
    border-radius: 4px;
    margin: 2px 4px;
    transition: background var(--dt-transition-fast, 0.15s ease),
      color var(--dt-transition-fast, 0.15s ease);

    &:hover:not(.is-disabled) {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    &.is-disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    :deep(svg) {
      font-size: 14px;
      flex-shrink: 0;
    }
  }
}

// 深色模式
html.dark .tag-contextmenu {
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>
