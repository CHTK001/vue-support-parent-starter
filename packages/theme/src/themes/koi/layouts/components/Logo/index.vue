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
        :src="displayLogoUrl"
        fit="cover"
        class="w-100% h-100% rounded-full"
        @error="handleLogoError"
      >
        <template #error>
          <el-icon class="w-100% h-100% rounded-full text-[--el-color-primary]" :size="34">
            <CircleCloseFilled />
          </el-icon>
        </template>
      </el-image>
    </div>
    
    <!-- 标题文字（品牌名来自 app.yaml loginConfig.brandName） -->
    <el-tooltip 
      :content="brandName" 
      :show-after="1500" 
      placement="right"
    >
      <div
        class="koi-logo__title truncate select-none"
        :class="titleClass"
        :style="titleStyle"
        v-text="brandName"
        v-show="showTitleBlock"
      ></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useBreakpoints } from "@vueuse/core";
import { breakpointsEnum } from "@repo/utils";
import settings from "@repo/theme/koi/settings";
import { getConfig } from "@repo/config";
import { isToolbarVisible } from "../Header/toolbarPrefs";
import { resolveAssetUrl } from "@repo/assets";
import { translateConfigText } from "@repo/languages";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";

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
  },
  noAnimate: {
    require: false, // true关闭标题动画，false开启
    type: Boolean,
    default: false
  }
});

const titleSize = ref(`${settings.loginTitleSize}px`);
const logoSize = ref(settings.logoSize);
const titleAnimate = ref(settings.logoTitleAnimate);

// logo 显示开关（yaml master + 用户偏好；兼容 settings.logoShow）
const showLogo = computed(() => {
  return isToolbarVisible("logo") && settings.logoShow;
});

// 品牌名（app.yaml loginConfig.brandName，为空时回退 loginConfig.title）
const brandName = computed(() => {
  const cfg = getConfig();
  return translateConfigText(cfg.login.brandName) || translateConfigText(cfg.login.title) || "";
});

// Logo 图片地址（app.yaml / 远程配置 login.logoUrl，为空时回退内置 logo）
const resolvedLogoUrl = computed(() => {
  const cfg = getConfig();
  const url = cfg.login.logoUrl;
  return url ? resolveAssetUrl(url) : fallbackLogoUrl;
});

// 实际显示地址：配置的 logo 加载失败时自动回退内置 logo，避免出现 X 错误图标。
// 这样无论远程配置了什么（含无效路径），logo 都能正常显示；用户自定义有效时优先自定义。
const displayLogoUrl = ref<string>(resolvedLogoUrl.value);
const usingFallback = ref<boolean>(false);
watch(resolvedLogoUrl, (val) => {
  // 配置变化（如后台改 logo）：重置为新配置并允许再次回退
  usingFallback.value = false;
  displayLogoUrl.value = val;
});
const handleLogoError = () => {
  if (!usingFallback.value && displayLogoUrl.value !== fallbackLogoUrl) {
    usingFallback.value = true;
    displayLogoUrl.value = fallbackLogoUrl;
  }
};

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
  const baseClass = `truncate select-none ${props.noAnimate ? "" : titleAnimate.value}`;
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

