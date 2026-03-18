<template>
  <HeaderWrapper :fixed="set.fixedHeader">
    <div class="header-container spring-festival-header">
      <!-- 春节装饰层 -->
      <div class="festival-decoration">
        <!-- 红包边框 -->
        <div class="red-envelope-border"></div>
        <!-- 左侧灯笼 -->
        <div class="lantern-left"></div>
        <!-- 右侧灯笼 -->
        <div class="lantern-right"></div>
        <!-- 福字角标 -->
        <div class="fu-badge">福</div>
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

.spring-festival-header {
  .festival-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  // 红包边框
  .red-envelope-border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-top: 3px solid #dc143c;
    border-bottom: 3px solid #dc143c;
    box-shadow: 
      0 0 15px rgba(220, 20, 60, 0.4),
      inset 0 0 10px rgba(255, 215, 0, 0.2);
    background: linear-gradient(90deg, 
      transparent 48%, 
      rgba(255, 215, 0, 0.15) 49%, 
      rgba(255, 215, 0, 0.15) 51%, 
      transparent 52%
    );
    animation: border-glow 2s ease-in-out infinite;
  }

  // 左侧灯笼
  .lantern-left {
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    width: 30px;
    height: 40px;
    background: linear-gradient(135deg, #dc143c 0%, #a00000 100%);
    border-radius: 50% 50% 40% 40%;
    box-shadow: 
      0 4px 8px rgba(220, 20, 60, 0.5),
      inset 0 2px 4px rgba(255, 215, 0, 0.3);
    animation: lantern-swing 3s ease-in-out infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 12px;
      background: #ffd700;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 右侧灯笼
  .lantern-right {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    width: 30px;
    height: 40px;
    background: linear-gradient(135deg, #dc143c 0%, #a00000 100%);
    border-radius: 50% 50% 40% 40%;
    box-shadow: 
      0 4px 8px rgba(220, 20, 60, 0.5),
      inset 0 2px 4px rgba(255, 215, 0, 0.3);
    animation: lantern-swing 3s ease-in-out infinite 0.5s;
    
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 12px;
      background: #ffd700;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 10px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 福字角标
  .fu-badge {
    position: absolute;
    top: 10px;
    right: 50%;
    transform: translateX(50%);
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #dc143c 0%, #ff4444 100%);
    border-radius: 50%;
    border: 2px solid #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    box-shadow: 
      0 4px 12px rgba(220, 20, 60, 0.6),
      inset 0 2px 4px rgba(255, 215, 0, 0.4);
    animation: fu-rotate 4s linear infinite;
  }
}

@keyframes border-glow {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(220, 20, 60, 0.4),
      inset 0 0 10px rgba(255, 215, 0, 0.2);
  }
  50% {
    box-shadow: 
      0 0 25px rgba(220, 20, 60, 0.6),
      inset 0 0 15px rgba(255, 215, 0, 0.4);
  }
}

@keyframes lantern-swing {
  0%, 100% {
    transform: translateY(-50%) rotate(-5deg);
  }
  50% {
    transform: translateY(-50%) rotate(5deg);
  }
}

@keyframes fu-rotate {
  0% {
    transform: translateX(50%) rotate(0deg) scale(1);
  }
  50% {
    transform: translateX(50%) rotate(180deg) scale(1.1);
  }
  100% {
    transform: translateX(50%) rotate(360deg) scale(1);
  }
}
</style>
