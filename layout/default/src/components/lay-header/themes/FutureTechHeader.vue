<template>
  <HeaderWrapper :fixed="set.fixedHeader">
    <div class="header-container future-tech-header">
      <!-- 未来科技装饰层 -->
      <div class="festival-decoration">
        <!-- 霓虹光线 -->
        <div class="neon-line neon-line-1"></div>
        <div class="neon-line neon-line-2"></div>
        <div class="neon-line neon-line-3"></div>
        <!-- 扫描线效果 -->
        <div class="scan-line"></div>
        <!-- 数字雨效果 -->
        <div class="digital-rain"></div>
        <!-- 电路板纹理 -->
        <div class="circuit-pattern"></div>
      </div>

      <LayNav />

      <!-- 标签页：在非移动模式下显示，且未隐藏标签页 -->
      <div v-if="layout !== 'mobile' && !set.hideTabs" class="header-tags">
        <LayTag v-if="defer(2)" />
      </div>
    </div>
  </HeaderWrapper>
</template>

<script setup lang="ts">
import LayTag from "../../lay-tag/index.vue";
import LayNav from "../../lay-navbar/index.vue";
import HeaderWrapper from "../components/HeaderWrapper.vue";
import { useAppStoreHook, useSettingStoreHook } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";
import { computed, reactive } from "vue";
import { useLayout } from "../../../hooks/useLayout";
import { setType } from "../../../types";
import { useDefer } from "@repo/utils";

const { layout } = useLayout();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const pureSetting = useSettingStoreHook();

const appStore = useAppStoreHook();
const defer = useDefer(3);

const set: setType = reactive({
  sidebar: computed(() => appStore.sidebar),
  device: computed(() => appStore.device),
  fixedHeader: computed(() => pureSetting.fixedHeader),
  classes: computed(() => ({
    hideSidebar: !set.sidebar.opened,
    openSidebar: set.sidebar.opened,
    withoutAnimation: set.sidebar.withoutAnimation,
    mobile: set.device === "mobile",
  })),
  hideTabs: computed(() => $storage?.configure.hideTabs),
});
</script>

<style lang="scss" scoped>
.header-container {
  position: relative;
  background: var(--el-bg-color);
}

.future-tech-header {
  > :not(.festival-decoration) {
    position: relative;
    z-index: 20;
  }

  .festival-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    overflow: hidden;
  }

  // 霓虹光线
  .neon-line {
    position: absolute;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
    box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
    animation: neon-flow 3s linear infinite;
  }

  .neon-line-1 {
    top: 20%;
    width: 100%;
    animation-delay: 0s;
  }

  .neon-line-2 {
    top: 50%;
    width: 100%;
    animation-delay: 1s;
  }

  .neon-line-3 {
    top: 80%;
    width: 100%;
    animation-delay: 2s;
  }

  // 扫描线效果
  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
    animation: scan-move 4s linear infinite;
  }

  // 数字雨效果
  .digital-rain {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(transparent 50%, rgba(0, 255, 255, 0.03) 50%),
      linear-gradient(90deg, transparent 50%, rgba(0, 255, 255, 0.03) 50%);
    background-size: 20px 20px, 20px 20px;
    animation: digital-rain-fall 20s linear infinite;
  }

  // 电路板纹理
  .circuit-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 10% 30%, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 30% 70%, rgba(138, 43, 226, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 70% 40%, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 90% 80%, rgba(138, 43, 226, 0.1) 1px, transparent 1px);
    background-size: 100% 100%;
    
    &::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 10%;
      width: 20%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
      box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 70%;
      right: 10%;
      width: 25%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.3), transparent);
      box-shadow: 0 0 5px rgba(138, 43, 226, 0.5);
    }
  }

  // 顶部和底部霓虹边框
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ffff, transparent);
    box-shadow: 0 0 10px #00ffff;
    animation: border-glow 2s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #8a2be2, transparent);
    box-shadow: 0 0 10px #8a2be2;
    animation: border-glow 2s ease-in-out infinite reverse;
  }
}

@keyframes neon-flow {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes scan-move {
  0% {
    top: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

@keyframes digital-rain-fall {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 0 100%, 100% 0;
  }
}

@keyframes border-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
