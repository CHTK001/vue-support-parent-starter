<script setup lang="ts">
/**
 * 内容渲染组件
 * 封装 keep-alive + component 的公共逻辑，避免重复代码
 * @author Auto-refactored
 * @version 1.0.0
 */
import { computed, h, Transition, defineComponent } from "vue";

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

// 过渡动画组件
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
      default: 'fade-slide',
    },
  },
  setup(props, { slots }) {
    const getTransitionName = computed(() => {
      if (!props.menuTransition) return undefined;
      // 路由级别的动画配置优先
      const routeTransition = props.route?.meta?.transition;
      if (routeTransition) return routeTransition;
      // 使用全局配置的动画类型
      return props.transitionType;
    });

    return () => {
      const content = slots.default?.();
      
      if (!props.menuTransition) {
        return content;
      }
      
      return h(
        Transition,
        {
          name: getTransitionName.value,
          mode: "out-in",
          appear: true,
        },
        () => content
      );
    };
  },
});

const contentStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.layoutRadius) {
    style['border-radius'] = `${props.layoutRadius}px`;
  }
  return { ...style, ...props.extraStyle };
});
</script>

<template>
  <TransitionWrapper :route="route" :menu-transition="menuTransition" :transition-type="transitionType">
    <keep-alive v-if="isKeepAlive" :include="cachePageList">
      <component
        :is="comp"
        :key="route.name"
        :frameInfo="frameInfo"
        class="main-content"
        :class="extraClass"
        :style="contentStyle"
      />
    </keep-alive>
    <component
      v-else
      :is="comp"
      :key="route.name"
      :frameInfo="frameInfo"
      class="main-content"
      :class="extraClass"
      :style="contentStyle"
    />
  </TransitionWrapper>
</template>
