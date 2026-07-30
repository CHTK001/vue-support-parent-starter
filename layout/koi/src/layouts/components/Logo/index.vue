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
        :src="logoSrc"
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
import { breakpointsEnum } from "../../../hooks/screen/index.ts";
import settings from "../../../settings";
import { useKoiConfig } from "../../../utils/useKoiConfig.ts";
import logoUrl from "../../../assets/images/logo/logo.webp";

const breakpoints = useBreakpoints(breakpointsEnum);

// 接收父组件传递的参数
const props = defineProps({
  isCollapse: {
    require: false,
    type: Boolean
  },
  layout: {
    require: "vertical",
    type: String
  }
});

const koiConfig = useKoiConfig();

/** Logo 标题字体大小（px） */
const titleSize = computed(() => {
  const v = koiConfig.cfgNumber("logoTitleSize", settings.loginTitleSize);
  return typeof v === "number" ? `${v}px` : v;
});

/** 是否显示 Logo */
const showLogo = computed(() => koiConfig.cfgBool("logoShow", settings.logoShow !== false));

/** Logo 图片尺寸（px） */
const logoSize = computed(() => {
  const v = koiConfig.cfgNumber("logoSize", settings.logoSize);
  return typeof v === "number" ? `${v}px` : v;
});

/** Logo 标题渐变动画 */
const titleAnimate = computed(() => koiConfig.cfgBool("logoTitleAnimate", settings.logoTitleAnimate !== false));

/** Logo 图片：app.yaml LoginLogo 优先，否则用本地 logo.webp */
const logoSrc = computed(() => koiConfig.cfgString("LoginLogo", "") || logoUrl);

const isHeaderLayout = computed(() => props.layout === "horizontal" || props.layout === "classic");

/** 顶栏布局：大屏显示标题，侧栏折叠时隐藏 */
const showTitleBlock = computed(() => {
  if (props.isCollapse) return false;
  if (isHeaderLayout.value) return breakpoints.greater("lg").value;
  return true;
});

const rootClass = computed(() => (isHeaderLayout.value ? "koi-logo--header" : ""));

const logoContainerStyle = computed(() => {
  const size = logoSize.value;
  return {
    width: size,
    height: size,
    maxWidth: size,
    maxHeight: size
  };
});

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

const titleClass = computed(() => {
  const baseClass = `truncate select-none ${titleAnimate.value ? "koi-logo__title--animate" : ""}`;
  switch (props.layout) {
    case "horizontal":
    case "classic":
      return `${baseClass} m-x-10px min-w-0 shrink`;
    default:
      return `${baseClass} flex-1 m-l-10px`;
  }
});

const titleStyle = computed(() => {
  const baseStyle = { 'font-size': titleSize.value };
  if (props.layout === 'horizontal' || props.layout === 'classic') {
    return {
      ...baseStyle,
      color: 'var(--el-header-logo-text-color) !important'
    };
  }
  return {
    ...baseStyle,
    color: 'var(--el-aside-logo-text-color) !important'
  };
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

.koi-logo__title--animate {
  background: linear-gradient(
    90deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-5) 50%,
    var(--el-color-primary) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: koi-logo-title-shimmer 4s ease-in-out infinite;
}

@keyframes koi-logo-title-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
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
