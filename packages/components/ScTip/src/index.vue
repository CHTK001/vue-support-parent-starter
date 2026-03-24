<template>
  <el-tooltip
    v-bind="$attrs"
    :content="computedContent"
    :effect="effect"
    :placement="placement"
    :disabled="disabled"
    :offset="offset"
    :show-arrow="showArrow"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :auto-close="autoClose"
    :popper-class="popperClass"
    :enterable="enterable"
    :teleported="teleported"
    :trigger="trigger"
    :virtual-triggering="virtualTriggering"
    :virtual-ref="virtualRef"
    :persistent="persistent"
    @show="handleShow"
    @hide="handleHide"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content || typeit" #content>
      <div v-if="typeit" ref="typeitRef" class="sc-tip-typeit"></div>
      <slot v-else name="content" />
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
/**
 * ScTip 提示组件
 * 封装 el-tooltip，支持 TypeIt 打字机动画效果
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { Placement } from "element-plus";
import TypeIt from "typeit";

const props = withDefaults(
  defineProps<{
    /** 提示内容 */
    content?: string;
    /** 主题 */
    effect?: "dark" | "light";
    /** 位置 */
    placement?: Placement;
    /** 是否禁用 */
    disabled?: boolean;
    /** 偏移量 */
    offset?: number;
    /** 是否显示箭头 */
    showArrow?: boolean;
    /** 延迟显示（毫秒） */
    showAfter?: number;
    /** 延迟隐藏（毫秒） */
    hideAfter?: number;
    /** 自动关闭时间（毫秒） */
    autoClose?: number;
    /** 自定义类名 */
    popperClass?: string;
    /** 鼠标是否可进入 */
    enterable?: boolean;
    /** 是否插入到 body */
    teleported?: boolean;
    /** 触发方式 */
    trigger?: "hover" | "click" | "focus" | "contextmenu";
    /** 虚拟触发 */
    virtualTriggering?: boolean;
    /** 虚拟引用 */
    virtualRef?: any;
    /** 持久化 */
    persistent?: boolean;
    /** 是否启用打字机效果 */
    typeit?: boolean;
    /** 打字机速度（毫秒） */
    typeitSpeed?: number;
    /** 打字机配置 */
    typeitOptions?: Partial<TypeIt.Options>;
  }>(),
  {
    content: "",
    effect: "dark",
    placement: "top",
    disabled: false,
    offset: 12,
    showArrow: true,
    showAfter: 0,
    hideAfter: 200,
    autoClose: 0,
    popperClass: "",
    enterable: true,
    teleported: true,
    trigger: "hover",
    virtualTriggering: false,
    persistent: false,
    typeit: false,
    typeitSpeed: 50,
    typeitOptions: () => ({})
  }
);

const emit = defineEmits<{
  show: [];
  hide: [];
}>();

const typeitRef = ref<HTMLElement>();
let typeitInstance: TypeIt | null = null;

const computedContent = computed(() => {
  return props.typeit ? "" : props.content;
});

/**
 * 初始化 TypeIt
 */
function initTypeIt(): void {
  if (!props.typeit || !typeitRef.value || !props.content) return;

  typeitInstance = new TypeIt(typeitRef.value, {
    strings: [props.content],
    speed: props.typeitSpeed,
    waitUntilVisible: true,
    cursor: false,
    ...props.typeitOptions
  });

  typeitInstance.go();
}

/**
 * 销毁 TypeIt
 */
function destroyTypeIt(): void {
  if (typeitInstance) {
    typeitInstance.destroy();
    typeitInstance = null;
  }
}

function handleShow(): void {
  emit("show");
  if (props.typeit) {
    setTimeout(() => {
      initTypeIt();
    }, 100);
  }
}

function handleHide(): void {
  emit("hide");
  destroyTypeIt();
}

// 监听内容变化
watch(
  () => props.content,
  () => {
    if (props.typeit && typeitRef.value) {
      destroyTypeIt();
      initTypeIt();
    }
  }
);

onUnmounted(() => {
  destroyTypeIt();
});

// 暴露方法
defineExpose({
  show: () => {
    // el-tooltip 的 show 方法需要通过 ref 调用
  },
  hide: () => {
    // el-tooltip 的 hide 方法需要通过 ref 调用
  }
});
</script>

<style lang="scss" scoped>
.sc-tip-typeit {
  min-width: 50px;
  min-height: 20px;
}
</style>
