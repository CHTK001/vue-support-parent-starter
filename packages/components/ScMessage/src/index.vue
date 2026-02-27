<template>
  <!-- 无渲染组件，内部使用 @repo/utils 的 message 函数 -->
</template>

<script setup lang="ts">
/**
 * ScMessage 消息提示组件
 * 内部使用 @repo/utils 的 message 函数显示消息
 * 在模板中使用时，组件挂载时会自动显示消息
 */
import { watch, onMounted, onUnmounted } from "vue";
import type { PropType } from "vue";
import { message } from "@repo/utils";
import type { MessageHandler } from "element-plus";

const props = defineProps({
  type: {
    type: String as PropType<"success" | "warning" | "info" | "error">,
    default: "info"
  },
  message: {
    type: String,
    default: ""
  },
  duration: {
    type: Number,
    default: 2000
  },
  showClose: {
    type: Boolean,
    default: false
  },
  center: {
    type: Boolean,
    default: false
  },
  offset: {
    type: Number,
    default: 20
  },
  modelValue: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:modelValue", "close"]);

let messageHandler: MessageHandler | null = null;

/**
 * 显示消息
 */
const showMessage = () => {
  if (!props.modelValue || !props.message) {
    return;
  }

  // 如果已有消息，先关闭
  if (messageHandler) {
    messageHandler.close();
    messageHandler = null;
  }

  // 调用 @repo/utils 的 message 函数
  messageHandler = message(props.message, {
    type: props.type,
    duration: props.duration,
    showClose: props.showClose,
    center: props.center,
    offset: props.offset,
    onClose: () => {
      messageHandler = null;
      emit("update:modelValue", false);
      emit("close");
    }
  });
};

/**
 * 关闭消息
 */
const closeMessage = () => {
  if (messageHandler) {
    messageHandler.close();
    messageHandler = null;
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      showMessage();
    } else {
      closeMessage();
    }
  }
);

// 监听 message 变化
watch(
  () => props.message,
  () => {
    if (props.modelValue) {
      showMessage();
    }
  }
);

onMounted(() => {
  if (props.modelValue && props.message) {
    showMessage();
  }
});

onUnmounted(() => {
  closeMessage();
});
</script>

