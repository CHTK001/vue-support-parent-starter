<template>
  <div v-if="isEnabled" :class="['menu-active-indicator', `indicator-${currentTheme}`]">
    <!-- 圣诞主题：横向圣诞树 -->
    <template v-if="currentTheme === 'christmas'">
      <div class="christmas-indicator">
        <svg class="christmas-tree" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
          <!-- 树干 -->
          <rect x="14" y="12" width="4" height="4" fill="#8B4513"/>
          <!-- 树叶层 -->
          <polygon points="16,0 24,6 20,6 26,10 22,10 28,14 4,14 10,10 6,10 12,6 8,6" fill="#1b5e20"/>
          <!-- 装饰球 -->
          <circle cx="12" cy="10" r="1.5" fill="#c62828"/>
          <circle cx="20" cy="8" r="1.5" fill="#ffd700"/>
          <circle cx="16" cy="12" r="1.5" fill="#c62828"/>
          <circle cx="18" cy="6" r="1" fill="#ffd700"/>
          <!-- 星星 -->
          <polygon points="16,0 17,3 20,3 17.5,5 18.5,8 16,6 13.5,8 14.5,5 12,3 15,3" fill="#ffd700" class="tree-star"/>
        </svg>
        <span class="sparkle sparkle-1">✨</span>
        <span class="sparkle sparkle-2">⭐</span>
      </div>
    </template>

    <!-- 中秋主题：圆月光晕 -->
    <template v-else-if="currentTheme === 'mid-autumn'">
      <div class="mid-autumn-indicator">
        <div class="moon-glow"></div>
        <span class="moon">🌕</span>
        <span class="star star-1">✨</span>
        <span class="star star-2">⭐</span>
      </div>
    </template>

    <!-- 春节主题：小灯笼 -->
    <template v-else-if="currentTheme === 'spring-festival'">
      <div class="spring-indicator">
        <span class="lantern">🏮</span>
        <div class="gold-line"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { emitter } from '@repo/core';
import { responsiveStorageNameSpace } from '@repo/config';
import type { StorageConfigs } from '@repo/config';
import { localStorageProxy } from '@repo/utils';

interface Props {
  /** 是否激活状态 */
  isActive?: boolean;
  /** 是否在弹出菜单中 */
  isPopup?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isPopup: false,
});

// 当前主题
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);

// 是否启用装饰
const isEnabled = computed(() => {
  return props.isActive && ['christmas', 'mid-autumn', 'spring-festival'].includes(currentTheme.value);
});

onMounted(() => {
  emitter.on('systemThemeChange', (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off('systemThemeChange');
});
</script>

<style lang="scss" scoped>
.menu-active-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

// ==================== 圣诞主题 ====================
.indicator-christmas {
  .christmas-indicator {
    position: relative;
    display: flex;
    align-items: center;
    
    .christmas-tree {
      width: 28px;
      height: 14px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      animation: treeGlow 2s ease-in-out infinite;
      
      .tree-star {
        animation: starTwinkle 1.5s ease-in-out infinite;
      }
    }
    
    .sparkle {
      position: absolute;
      font-size: 8px;
      animation: sparkleFloat 2s ease-in-out infinite;
      
      &.sparkle-1 {
        top: -4px;
        right: -2px;
        animation-delay: 0s;
      }
      
      &.sparkle-2 {
        bottom: -4px;
        left: -2px;
        animation-delay: 0.5s;
      }
    }
  }
}

@keyframes treeGlow {
  0%, 100% {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.3));
  }
  50% {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
  }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

@keyframes sparkleFloat {
  0%, 100% { opacity: 0.6; transform: translateY(0) scale(1); }
  50% { opacity: 1; transform: translateY(-2px) scale(1.2); }
}

// ==================== 中秋主题 ====================
.indicator-mid-autumn {
  .mid-autumn-indicator {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .moon-glow {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 213, 79, 0.6) 0%, transparent 70%);
      animation: moonGlow 3s ease-in-out infinite;
    }
    
    .moon {
      font-size: 16px;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.8));
      animation: moonFloat 4s ease-in-out infinite;
    }
    
    .star {
      position: absolute;
      font-size: 8px;
      animation: starTwinkle 2s ease-in-out infinite;
      
      &.star-1 {
        top: -6px;
        right: -4px;
        animation-delay: 0.3s;
      }
      
      &.star-2 {
        bottom: -6px;
        left: -4px;
        animation-delay: 0.8s;
      }
    }
  }
}

@keyframes moonGlow {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.6; 
  }
  50% { 
    transform: scale(1.3); 
    opacity: 0.9; 
  }
}

@keyframes moonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

// ==================== 春节主题 ====================
.indicator-spring-festival {
  .spring-indicator {
    position: relative;
    display: flex;
    align-items: center;
    
    .lantern {
      font-size: 14px;
      animation: lanternSwing 2s ease-in-out infinite;
      transform-origin: top center;
      filter: drop-shadow(0 2px 4px rgba(220, 20, 60, 0.5));
    }
    
    .gold-line {
      position: absolute;
      left: -20px;
      width: 16px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ffd700, transparent);
      animation: goldShimmer 1.5s ease-in-out infinite;
    }
  }
}

@keyframes lanternSwing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

@keyframes goldShimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
