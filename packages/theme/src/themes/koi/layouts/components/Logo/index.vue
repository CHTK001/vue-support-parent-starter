<template>
  <div
    class="koi-logo flex flex-items-center"
    :class="[rootClass, isHeaderLayout ? 'p-l-5px' : 'p-x-5px']"
    v-show="showLogo"
  >
    <!-- Logo 图片 -->
    <div
      class="koi-logo__avatar rounded-full flex-shrink-0"
      :class="logoContainerClass"
      :style="logoContainerStyle"
    >
      <el-image
        :src="logoUrl"
        fit="cover"
        class="w-100% h-100% rounded-full"
      >
        <template #error>
          <el-icon class="w-100% h-100% rounded-full text-[--el-color-primary]" :size="34">
            <CircleCloseFilled />
          </el-icon>
        </template>
      </el-image>
    </div>
    
    <!-- 标题文字 -->
    <el-tooltip 
      :content="$t('project.title')" 
      :show-after="1500" 
      placement="right"
    >
      <div
        class="koi-logo__title truncate select-none"
        :class="titleClass"
        :style="titleStyle"
        v-text="$t('project.title')"
        v-show="showTitleBlock"
      ></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useBreakpoints } from "@vueuse/core";
import { breakpointsEnum } from "@repo/utils";
import settings from "@repo/theme/koi/settings";
import logoUrl from "@repo/assets/images/logo/logo.webp";

const breakpoints = useBreakpoints(breakpointsEnum);

// 接收父组件传递的参数
const props = defineProps({
  isCollapse: {
    require: false, // true显示，false隐藏
    type: Boolean
  },
  layout: {
    require: "vertical", // 布局模式[纵向：vertical | 分栏：columns | 经典：classic | 上左：optimum | 横向：horizontal]
    type: String
  }
});

const titleSize = ref(`${settings.loginTitleSize}px`);
const showLogo = ref(settings.logoShow);
const logoSize = ref(settings.logoSize);
const titleAnimate = ref(settings.logoTitleAnimate);

const isHeaderLayout = computed(() => props.layout === "horizontal" || props.layout === "classic");

/** 顶栏布局：大屏显示标题，侧栏折叠时隐藏 */
const showTitleBlock = computed(() => {
  if (props.isCollapse) return false;
  if (isHeaderLayout.value) return breakpoints.greater("lg").value;
  return true;
});

const rootClass = computed(() => (isHeaderLayout.value ? "koi-logo--header" : ""));

// Logo 容器样式计算属性
const logoContainerStyle = computed(() => {
  const size = logoSize.value;
  return {
    width: size,
    height: size,
    maxWidth: size,
    maxHeight: size
  };
});

// Logo 容器类名计算属性
const logoContainerClass = computed(() => {
  const baseClass = "rounded-full";
  switch (props.layout) {
    case 'classic':
      return `${baseClass} m-l--4px`;
    case 'horizontal':
      return `${baseClass}`;
    default:
      return baseClass;
  }
});

// 标题容器类名计算属性
const titleClass = computed(() => {
  const baseClass = `truncate select-none ${titleAnimate.value}`;
  switch (props.layout) {
    case "horizontal":
    case "classic":
      return `${baseClass} m-x-10px min-w-0 shrink`;
    default:
      return `${baseClass} flex-1 m-l-10px`;
  }
});

// 标题样式计算属性
const titleStyle = computed(() => {
  const baseStyle = { 'font-size': titleSize.value };
  if (props.layout === 'horizontal' || props.layout === 'classic') {
    return {
      ...baseStyle,
      color: 'var(--el-header-logo-text-color) !important'
    };
  } else {
    return {
      ...baseStyle,
      color: 'var(--el-aside-logo-text-color) !important'
    };
  }
  return baseStyle;
});
</script>

<style lang="scss" scoped>
.koi-logo {
  height: $aside-header-height;
  line-height: $aside-header-height;
}

.koi-logo--header {
  min-width: 0;
  max-width: min(220px, 32vw);
  flex-shrink: 1;
  overflow: hidden;
}

.koi-logo__avatar {
  min-width: 0;
}

.koi-logo__title {
  min-width: 0;
}

.koi-logo--header .koi-logo__title {
  max-width: 155px;
  flex: 1 1 auto;
}

@media (max-width: 1199px) {
  .koi-logo--header .koi-logo__title {
    display: none !important;
  }
}
</style>
