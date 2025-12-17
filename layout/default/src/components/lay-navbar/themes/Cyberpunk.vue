<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import LaySidebarBreadCrumb from "../../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";
//@ts-ignore
import LayTool from "../../lay-tool/index.vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import { onBeforeUnmount, ref } from "vue";

const {
  layout,
  device,
  pureApp,
  toggleSideBar,
} = useNav();

const { $storage } = useGlobal<any>();
const showBreadcrumb = ref($storage?.configure?.showBreadcrumb ?? true);

emitter.on("breadcrumbChange", (value: boolean) => {
  showBreadcrumb.value = value;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbChange");
});
</script>

<template>
  <div class="cyberpunk-navbar">
    <!-- 扫描线效果 -->
    <div class="scan-line"></div>
    
    <!-- 电路纹理背景 -->
    <div class="circuit-pattern"></div>
    
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile' && showBreadcrumb"
      class="breadcrumb-container"
    />

    <LayNavMix v-if="layout === 'mix'" />

    <div
      v-if="
        layout === 'vertical' ||
        layout === 'hover' ||
        layout === 'card' ||
        layout === 'double'
      "
      class="vertical-header-right"
    >
      <LayTool />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 赛博朋克 Navbar 优化版
$cyber-cyan: #00ffff;
$cyber-magenta: #ff00ff;
$cyber-purple: #a855f7;

.cyberpunk-navbar {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  position: relative;
  background: linear-gradient(
    135deg, 
    rgba(5, 5, 16, 0.98) 0%, 
    rgba(15, 15, 35, 0.98) 50%,
    rgba(5, 5, 16, 0.98) 100%
  );
  overflow: hidden;
  backdrop-filter: blur(12px);
  
  // 顶部霓虹灯条 - 增强流光效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg, 
      transparent 0%,
      $cyber-cyan 15%,
      $cyber-magenta 35%,
      $cyber-purple 50%,
      $cyber-magenta 65%,
      $cyber-cyan 85%,
      transparent 100%
    );
    box-shadow: 
      0 0 15px rgba(0, 255, 255, 0.8),
      0 0 30px rgba(255, 0, 255, 0.4),
      0 0 45px rgba(0, 255, 255, 0.2);
    animation: neonPulse 2.5s ease-in-out infinite;
  }
  
  // 底部边框 - 渐变线
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg, 
      transparent 0%,
      rgba(0, 255, 255, 0.4) 20%,
      rgba(255, 0, 255, 0.3) 50%,
      rgba(0, 255, 255, 0.4) 80%,
      transparent 100%
    );
  }
  
  // 扫描线效果 - 更快速更微妙
  .scan-line {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0, 255, 255, 0.08) 45%,
      rgba(255, 0, 255, 0.05) 50%,
      rgba(0, 255, 255, 0.08) 55%,
      transparent 100%
    );
    animation: scan 4s linear infinite;
    pointer-events: none;
  }
  
  // 电路纹理 - 更精细
  .circuit-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 1px,
        rgba(0, 255, 255, 0.02) 1px,
        rgba(0, 255, 255, 0.02) 2px
      ),
      radial-gradient(
        ellipse at 20% 50%,
        rgba(0, 255, 255, 0.05) 0%,
        transparent 40%
      ),
      radial-gradient(
        ellipse at 80% 50%,
        rgba(255, 0, 255, 0.03) 0%,
        transparent 40%
      );
    pointer-events: none;
  }
  
  .hamburger-container {
    height: 40px;
    line-height: 40px;
    cursor: pointer;
    padding: 0 16px;
    margin: 0 12px;
    border-radius: 4px;
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    transition: all 0.3s ease;
    z-index: 10;
    color: #00ffff;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 255, 0.3),
        transparent
      );
      transition: left 0.5s ease;
    }

    &:hover {
      background: rgba(0, 255, 255, 0.2);
      border-color: rgba(0, 255, 255, 0.6);
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
      
      &::before {
        left: 100%;
      }
    }
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 56px;
    padding-right: 24px;
    gap: 12px;
    margin-left: auto;
    z-index: 10;
  }

  .breadcrumb-container {
    margin-left: 20px;
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      rgba(5, 5, 16, 0.85) 0%,
      rgba(10, 10, 26, 0.8) 100%
    );
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 255, 255, 0.35);
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.35),
      0 0 15px rgba(0, 255, 255, 0.15),
      inset 0 1px 0 rgba(0, 255, 255, 0.15);
    transition: all 0.25s ease;
    z-index: 10;
    position: relative;
    overflow: hidden;
    
    // 顶部微光
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 255, 0.4) 50%,
        transparent
      );
    }
    
    // 悬停闪光
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 255, 0.1),
        transparent
      );
      transition: left 0.4s ease;
    }
    
    &:hover {
      border-color: $cyber-cyan;
      box-shadow: 
        0 6px 24px rgba(0, 255, 255, 0.35),
        0 0 30px rgba(0, 255, 255, 0.25),
        inset 0 0 20px rgba(0, 255, 255, 0.08);
      transform: translateY(-2px);
      
      &::after {
        left: 100%;
      }
    }
    
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        color: $cyber-cyan;
        font-weight: 500;
        font-family: 'Rajdhani', sans-serif;
        letter-spacing: 0.5px;
        text-shadow: 0 0 6px rgba(0, 255, 255, 0.5);
        transition: all 0.2s ease;
        
        &:hover {
          color: #fff;
          text-shadow: 0 0 12px rgba(0, 255, 255, 0.8);
        }
      }
      
      &:last-child .el-breadcrumb__inner {
        color: $cyber-magenta;
        font-weight: 600;
        text-shadow: 0 0 6px rgba(255, 0, 255, 0.5);
      }
    }
    
    :deep(.el-breadcrumb__separator) {
      color: rgba(0, 255, 255, 0.4);
      font-weight: 400;
      text-shadow: 0 0 4px rgba(0, 255, 255, 0.3);
    }
  }
  
  // 工具按钮样式
  .vertical-header-right {
    :deep(.tool-item) {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(0, 255, 255, 0.3);
      color: #00ffff;
      backdrop-filter: blur(8px);
      box-shadow: 
        0 2px 6px rgba(0, 0, 0, 0.3),
        0 0 10px rgba(0, 255, 255, 0.2);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(0, 255, 255, 0.2),
          transparent
        );
        transition: left 0.5s ease;
      }
      
      &:hover {
        background: rgba(0, 255, 255, 0.15);
        border-color: rgba(0, 255, 255, 0.6);
        color: #00ffff;
        box-shadow: 
          0 4px 12px rgba(0, 255, 255, 0.3),
          0 0 20px rgba(0, 255, 255, 0.4);
        transform: translateY(-2px);
        
        &::before {
          left: 100%;
        }
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}

@keyframes neonPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 20px rgba(0, 255, 255, 1);
  }
}

@keyframes scan {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}
</style>
