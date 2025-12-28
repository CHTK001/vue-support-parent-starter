<script setup lang="ts">
/**
 * 新春灯笼主题导航栏 - 深度定制版
 * 特色：悬挂灯笼装饰、祥云背景、金色边框、福字点缀
 */
import { useNav } from "../../../hooks/useNav";
import LayBreadcrumb from "../../breadcrumb/index.vue";
import LaySidebarTopCollapse from "../../lay-sidebar/components/SidebarTopCollapse.vue";
import LayNavMix from "../../lay-sidebar/NavMix.vue";
import LayTool from "../../lay-tool/index.vue";
import { useGlobal, useDark } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import { onBeforeUnmount, ref, onMounted } from "vue";

const { isDark } = useDark();

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

// 悬挂灯笼数据
const lanterns = ref([
  { id: 1, left: '15%', delay: 0, size: 'small' },
  { id: 2, left: '35%', delay: 0.3, size: 'medium' },
  { id: 3, left: '55%', delay: 0.6, size: 'small' },
  { id: 4, left: '75%', delay: 0.2, size: 'medium' },
  { id: 5, left: '90%', delay: 0.5, size: 'small' },
]);

// 祥云数据
const clouds = ref([
  { id: 1, left: '5%', top: '60%', scale: 0.6, delay: 0 },
  { id: 2, left: '25%', top: '70%', scale: 0.4, delay: 2 },
  { id: 3, left: '60%', top: '65%', scale: 0.5, delay: 4 },
  { id: 4, left: '80%', top: '55%', scale: 0.45, delay: 1 },
]);
</script>

<template>
  <div class="lunar-navbar">
    <!-- 顶部金色边框 -->
    <div class="top-border">
      <div class="border-pattern"></div>
    </div>
    
    <!-- 祥云背景 -->
    <div class="clouds-container">
      <div 
        v-for="cloud in clouds" 
        :key="cloud.id"
        class="cloud"
        :style="{
          left: cloud.left,
          top: cloud.top,
          transform: `scale(${cloud.scale})`,
          animationDelay: `${cloud.delay}s`
        }"
      >
        <svg viewBox="0 0 100 50" width="80" height="40">
          <path 
            d="M10,40 Q0,35 5,25 Q10,15 25,20 Q30,5 50,10 Q70,5 75,20 Q90,15 95,25 Q100,35 90,40 Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
    
    <!-- 悬挂灯笼装饰 -->
    <div class="lanterns-container">
      <div 
        v-for="lantern in lanterns" 
        :key="lantern.id"
        :class="['hanging-lantern', lantern.size]"
        :style="{
          left: lantern.left,
          animationDelay: `${lantern.delay}s`
        }"
      >
        <!-- 吊绳 -->
        <div class="rope"></div>
        <!-- 灯笼主体 -->
        <div class="lantern-body">
          <div class="lantern-top"></div>
          <div class="lantern-main">
            <span class="fu-char">福</span>
          </div>
          <div class="lantern-bottom"></div>
          <div class="tassel"></div>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="navbar-content">
      <LaySidebarTopCollapse
        v-if="device === 'mobile'"
        class="hamburger-container"
        :is-active="pureApp.sidebar.opened"
        @toggleClick="toggleSideBar"
      />

      <LayBreadcrumb
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
    
    <!-- 底部金色边框 -->
    <div class="bottom-border"></div>
  </div>
</template>

<style lang="scss" scoped>
.lunar-navbar {
  width: 100%;
  height: 48px;
  position: relative;
  background: linear-gradient(180deg, #8B0000 0%, #DC143C 50%, #B22222 100%);
  overflow: visible;
  
  // 顶部金色花纹边框
  .top-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%,
      #FFD700 10%,
      #FFA500 30%,
      #FFD700 50%,
      #FFA500 70%,
      #FFD700 90%,
      transparent 100%
    );
    
    .border-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: repeating-linear-gradient(
        90deg,
        transparent 0px,
        transparent 15px,
        rgba(139, 0, 0, 0.5) 15px,
        rgba(139, 0, 0, 0.5) 17px
      );
    }
  }
  
  // 底部边框
  .bottom-border {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(255, 215, 0, 0.6) 20%,
      rgba(255, 215, 0, 0.8) 50%,
      rgba(255, 215, 0, 0.6) 80%,
      transparent 100%
    );
  }
  
  // 祥云容器
  .clouds-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    
    .cloud {
      position: absolute;
      color: rgba(255, 215, 0, 0.15);
      animation: cloud-float 20s ease-in-out infinite;
      
      svg {
        filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.3));
      }
    }
  }
  
  // 悬挂灯笼容器
  .lanterns-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    pointer-events: none;
    z-index: 5;
    
    .hanging-lantern {
      position: absolute;
      top: -2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: lantern-swing 3s ease-in-out infinite;
      transform-origin: top center;
      
      &.small {
        .rope { height: 8px; }
        .lantern-body { transform: scale(0.5); }
      }
      
      &.medium {
        .rope { height: 12px; }
        .lantern-body { transform: scale(0.65); }
      }
      
      .rope {
        width: 2px;
        background: linear-gradient(180deg, #8B4513, #CD853F);
        border-radius: 1px;
      }
      
      .lantern-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .lantern-top {
          width: 16px;
          height: 6px;
          background: linear-gradient(180deg, #FFD700, #DAA520);
          border-radius: 2px 2px 0 0;
          box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
        }
        
        .lantern-main {
          width: 28px;
          height: 32px;
          background: linear-gradient(180deg, 
            #FF4500 0%, 
            #DC143C 30%, 
            #B22222 70%, 
            #8B0000 100%
          );
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 10px rgba(255, 69, 0, 0.6),
            inset 0 0 15px rgba(255, 200, 100, 0.3);
          position: relative;
          
          // 灯笼横条
          &::before,
          &::after {
            content: '';
            position: absolute;
            left: 2px;
            right: 2px;
            height: 1px;
            background: rgba(255, 215, 0, 0.4);
          }
          &::before { top: 30%; }
          &::after { bottom: 30%; }
          
          .fu-char {
            font-size: 12px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
            font-family: 'STKaiti', 'KaiTi', serif;
          }
        }
        
        .lantern-bottom {
          width: 14px;
          height: 5px;
          background: linear-gradient(180deg, #DAA520, #FFD700);
          border-radius: 0 0 2px 2px;
          box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
        }
        
        .tassel {
          width: 2px;
          height: 12px;
          background: linear-gradient(180deg, #FFD700, #FF6347);
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 8px;
            background: linear-gradient(180deg, #FFD700, #FF4500);
            border-radius: 0 0 3px 3px;
            animation: tassel-swing 2s ease-in-out infinite;
          }
        }
      }
    }
  }
  
  // 主内容区
  .navbar-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    
    .hamburger-container {
      z-index: 10;
      color: #FFD700;
      
      &:hover {
        color: #FFF;
      }
    }
    
    .vertical-header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 280px;
      padding-right: 20px;
      gap: 12px;
      margin-left: auto;
    }
    
    .breadcrumb-container {
      margin-left: 20px;
      height: 38px;
      display: flex;
      align-items: center;
      padding: 0 20px;
    }
  }
}

// 动画
@keyframes lantern-swing {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes tassel-swing {
  0%, 100% { transform: translateX(-50%) rotate(-5deg); }
  50% { transform: translateX(-50%) rotate(5deg); }
}

@keyframes cloud-float {
  0%, 100% { transform: translateX(0) scale(var(--scale, 0.5)); }
  50% { transform: translateX(10px) scale(var(--scale, 0.5)); }
}

// 深色模式适配
html.dark .lunar-navbar {
  background: linear-gradient(180deg, #5C0000 0%, #8B0000 50%, #6B0000 100%);
  
  .clouds-container .cloud {
    color: rgba(255, 215, 0, 0.1);
  }
}
</style>
