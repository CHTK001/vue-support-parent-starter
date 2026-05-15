<script setup lang="ts">
/**
 * 内容渲染组件
 * 封装 keep-alive + component 的公共逻辑，避免重复代码
 * 页面级切换不再使用过渡动画，避免点击菜单时整块内容区域产生动画
 */
import { computed, defineComponent, h, unref } from "vue";
import { Transition } from "vue";

const props = defineProps<{
  /** 要渲染的组件 */
  comp: any;
  /** 路由对象 */
  route: any;
  /** 是否启用 keep-alive */
  isKeepAlive: boolean;
  /** 缓存页面列表 */
  cachePageList: string[];
  /** iframe 信息 */
  frameInfo?: any;
  /** 布局圆角 */
  layoutRadius?: number;
  /** 是否启用过渡动画 */
  menuTransition?: boolean;
  /** 动画类型 */
  transitionType?: string;
  /** 额外的样式 */
  extraStyle?: Record<string, string>;
  /** 额外的 class */
  extraClass?: string;
}>();

// 包装组件：支持路由切换过渡动画
const TransitionWrapper = defineComponent({
  props: {
    route: {
      type: Object,
      required: true,
    },
    menuTransition: {
      type: Boolean,
      default: false,
    },
    transitionType: {
      type: String,
      default: "fade-slide",
    },
  },
  setup(props, { slots }) {
    return () => {
      // 默认内置淡化滑动过渡
      const type = props.transitionType || "fade-slide";
      return h(
        Transition,
        { name: type, mode: "out-in" },
        { default: () => slots.default?.() },
      );
    };
  },
});

const contentStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.layoutRadius) {
    style["border-radius"] = `${props.layoutRadius}px`;
  }
  style["flex"] = "1";
  return { ...style, ...props.extraStyle };
});

const resolvedComp = computed(() => unref(props.comp));
</script>

<template>
  <TransitionWrapper
    :route="route"
    :menu-transition="menuTransition"
    :transition-type="transitionType"
  >
    <component
      :is="resolvedComp"
      :key="route.fullPath || route.name"
      :frameInfo="frameInfo"
      class="main-content"
      :class="extraClass"
      :style="contentStyle"
    />
  </TransitionWrapper>
</template>
