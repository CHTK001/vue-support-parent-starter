<template>
  <div class="sc-dialog-container">
    <!-- 根据布局类型选择不同的组件 -->
    <component :is="layoutComponent" v-bind="dialogProps" v-model="dialogVisible" @open="onOpen" @opened="onOpened" @close="onClose" @closed="onClosed" @cancel="handleCancel" @confirm="handleConfirm">
      <!-- 传递插槽内容 -->
      <template v-if="$slots.default" #default>
        <slot />
      </template>

      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from "vue";
import { ScDialogProps, ScDialogEmits } from "./types";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import SimpleLayout from "./layouts/SimpleLayout.vue";
import HeadlessLayout from "./layouts/HeadlessLayout.vue";

/**
 * 定义组件属性
 */
const props = withDefaults(defineProps<ScDialogProps>(), {
  // 对话框基本属性
  modelValue: false,
  title: "",
  width: "500px",
  top: "15vh",
  modal: true,
  appendToBody: false,
  lockScroll: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  draggable: true,
  center: false,
  destroyOnClose: false,

  // 布局模式
  layout: "default",

  // 扩展属性
  type: "default",
  icon: "ep:info-filled",
  showIcon: true,
  isForm: false,

  // 底部按钮属性
  showFooter: true,
  showCancelButton: true,
  showConfirmButton: true,
  cancelText: "取消",
  confirmText: "确定",
  cancelIcon: "ep:close",
  confirmIcon: "ep:check",
  confirmButtonType: "primary",
  loading: false
});

/**
 * 定义组件事件
 */
const emit = defineEmits<ScDialogEmits>();

/**
 * 获取插槽
 */
const slots = useSlots();

/**
 * 对话框可见状态
 */
const dialogVisible = ref(props.modelValue);

/**
 * 根据layout属性选择对应的布局组件
 */
const layoutComponent = computed(() => {
  switch (props.layout) {
    case "simple":
      return SimpleLayout;
    case "headless":
      return HeadlessLayout;
    case "default":
    default:
      return DefaultLayout;
  }
});

/**
 * 传递给布局组件的属性
 */
const dialogProps = computed(() => {
  const { layout, modelValue, ...restProps } = props;
  return {
    ...restProps,
    showCancelButton: props.showFooter && props.showCancelButton,
    showConfirmButton: props.showFooter && props.showConfirmButton
  };
});

/**
 * 监听modelValue变化，同步到dialogVisible
 */
watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
  }
);

/**
 * 监听dialogVisible变化，同步到modelValue
 */
watch(
  () => dialogVisible.value,
  val => {
    emit("update:modelValue", val);
  }
);

/**
 * 处理取消按钮点击事件
 */
const handleCancel = () => {
  emit("cancel");
  dialogVisible.value = false;
};

/**
 * 处理确认按钮点击事件
 */
const handleConfirm = () => {
  emit("confirm");
};

/**
 * 对话框打开事件
 */
const onOpen = () => {
  emit("open");
};

/**
 * 对话框打开动画结束事件
 */
const onOpened = () => {
  emit("opened");
};

/**
 * 对话框关闭事件
 */
const onClose = () => {
  emit("close");
};

/**
 * 对话框关闭动画结束事件
 */
const onClosed = () => {
  emit("closed");
};

/**
 * 手动打开对话框
 */
const open = () => {
  dialogVisible.value = true;
};

/**
 * 手动关闭对话框
 */
const close = () => {
  dialogVisible.value = false;
};

/**
 * 暴露方法给父组件
 */
defineExpose({
  open,
  close
});
</script>

<style lang="scss">
.sc-dialog-container {
  // 对话框容器样式
}
</style>
