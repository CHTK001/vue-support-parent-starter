<template>
  <HeaderWrapper :fixed="set.fixedHeader">
    <div class="header-container halloween-header">
      <!-- 万圣节装饰层 -->
      <div class="festival-decoration">
        <!-- 南瓜帽 -->
        <div class="pumpkin-hat"></div>
        <!-- 蝙蝠装饰 -->
        <div class="bat-decoration bat-left"></div>
        <div class="bat-decoration bat-right"></div>
        <!-- 幽灵装饰 -->
        <div class="ghost-decoration"></div>
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

.halloween-header {
  .festival-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  // 南瓜帽
  .pumpkin-hat {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 40px;
    background: linear-gradient(135deg, #ff7518 0%, #ff5500 100%);
    border-radius: 50% 50% 0 0;
    box-shadow: 
      0 4px 8px rgba(255, 117, 24, 0.4),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 15px;
      height: 15px;
      background: #228b22;
      border-radius: 4px 4px 0 0;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      height: 50%;
      background: radial-gradient(circle, #000 30%, transparent 30%);
      background-size: 25% 40%;
      background-position: center;
      background-repeat: no-repeat;
    }
  }

  // 蝙蝠装饰
  .bat-decoration {
    position: absolute;
    top: 20px;
    width: 35px;
    height: 25px;
    background: #2c003e;
    border-radius: 50%;
    animation: bat-fly 3s ease-in-out infinite;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 25px;
      height: 18px;
      background: #2c003e;
      border-radius: 50% 50% 0 0;
      transform: translateY(-50%);
    }
    
    &::before {
      left: -18px;
      transform: translateY(-50%) rotate(-20deg);
    }
    
    &::after {
      right: -18px;
      transform: translateY(-50%) rotate(20deg);
    }
  }

  .bat-left {
    left: 15%;
    animation-delay: 0s;
  }

  .bat-right {
    right: 15%;
    animation-delay: 1.5s;
  }

  // 幽灵装饰
  .ghost-decoration {
    position: absolute;
    top: 10px;
    right: 10%;
    width: 40px;
    height: 50px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50% 50% 0 0;
    animation: ghost-float 4s ease-in-out infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 10px;
      width: 8px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      box-shadow: 12px 0 0 #000;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 15px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.8) 20%, 
        transparent 40%,
        rgba(255, 255, 255, 0.8) 60%,
        transparent 80%,
        rgba(255, 255, 255, 0.8) 100%
      );
      border-radius: 0 0 50% 50%;
    }
  }
}

@keyframes bat-fly {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

@keyframes ghost-float {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-15px);
    opacity: 1;
  }
}
</style>
