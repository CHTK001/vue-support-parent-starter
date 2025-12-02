<template>
  <!-- Tech 主题：使用 scifiPanel -->
  <scifi-panel v-bind="scifiPanelProps" @click="handleClick">
    <!-- 标题插槽 -->
    <template v-if="$slots.title || title" #title>
      <slot name="title">
        <scifi-panel-title v-if="title">
          <IconifyIconOnline v-if="icon" :icon="icon" style="margin-right: 8px" />
          {{ title }}
        </scifi-panel-title>
      </slot>
    </template>

    <!-- 内容 -->
    <slot />

    <!-- 底部插槽 -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </scifi-panel>
</template>

<script setup lang="ts">
/**
 * ScPanel Tech 主题组件
 * 使用 scifiPanel 实现
 * @author CH
 * @since 2025-12-03
 * @version 3.0.0
 */
import { computed } from "vue";

interface Props {
  /** 面板标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 面板宽度 */
  width?: string | number;
  /** 面板高度 */
  height?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  icon: "",
  disabled: false,
  width: "100%",
  height: "auto"
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const scifiPanelProps = computed(() => ({
  // scifiPanel 的属性，根据实际 API 调整
  disabled: props.disabled,
  style: {
    width: typeof props.width === "number" ? `${props.width}px` : props.width,
    height: typeof props.height === "number" ? `${props.height}px` : props.height
  }
}));

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
</script>

<style lang="scss" scoped>
// 自定义样式
</style>
