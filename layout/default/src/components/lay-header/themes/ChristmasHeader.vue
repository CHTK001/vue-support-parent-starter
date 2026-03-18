<template>
  <HeaderWrapper :fixed="set.fixedHeader">
    <div class="header-container christmas-header">
      <!-- 圣诞节装饰层 -->
      <div class="festival-decoration">
        <!-- 圣诞帽 -->
        <div class="santa-hat"></div>
        <!-- 铃铛装饰 -->
        <div class="bell-decoration bell-left"></div>
        <div class="bell-decoration bell-right"></div>
        <!-- 雪花边框 -->
        <div class="snowflake-border"></div>
        <!-- 圣诞树装饰 -->
        <div class="christmas-tree"></div>
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

.christmas-header {
  .festival-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  // 圣诞帽
  .santa-hat {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 90px;
    height: 50px;
    background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);
    border-radius: 0 50% 0 0;
    box-shadow: 0 4px 8px rgba(196, 30, 58, 0.5);
    
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30%;
      background: #fff;
      border-radius: 0 0 50% 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      right: 15%;
      width: 25px;
      height: 25px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }

  // 铃铛装饰
  .bell-decoration {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 25px;
    height: 28px;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border-radius: 0 0 50% 50%;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
    animation: bell-ring 2s ease-in-out infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      background: #c41e3a;
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 10px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  .bell-left {
    left: 15%;
    animation-delay: 0s;
  }

  .bell-right {
    right: 15%;
    animation-delay: 0.3s;
  }

  // 雪花边框
  .snowflake-border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-top: 2px solid rgba(255, 255, 255, 0.4);
    border-bottom: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 0 15px rgba(255, 255, 255, 0.3),
      inset 0 0 10px rgba(196, 30, 58, 0.1);
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 90% 25%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 80% 75%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 2px, transparent 2px);
    background-size: 100% 100%;
    animation: snowflake-twinkle 2s ease-in-out infinite;
  }

  // 圣诞树装饰
  .christmas-tree {
    position: absolute;
    top: 50%;
    left: 5%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 30px solid #165b33;
    
    &::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-bottom: 24px solid #1e7d45;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
    }
  }
}

@keyframes bell-ring {
  0%, 100% {
    transform: translateY(-50%) rotate(-10deg);
  }
  50% {
    transform: translateY(-50%) rotate(10deg);
  }
}

@keyframes snowflake-twinkle {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
