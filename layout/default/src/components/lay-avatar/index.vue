<script setup lang="ts">
import { computed } from "vue";
import { useLayout } from "../../hooks/useLayout";

interface Props {
  src: string;
  alt?: string;
  style?: any;
}

const props = defineProps<Props>();

const { layoutTheme } = useLayout();

const themeClass = computed(() => {
  return layoutTheme.value.theme;
});
</script>

<template>
  <div class="lay-avatar" :class="themeClass">
    <img :src="src" :alt="alt" :style="style" class="lay-avatar-img" />
    <!-- 节日装饰层 -->
    <div v-if="themeClass === 'halloween'" class="avatar-decoration halloween-decoration">
      <!-- 南瓜帽 -->
      <div class="pumpkin-hat"></div>
      <!-- 蝙蝠装饰 -->
      <div class="bat-decoration"></div>
    </div>
    <div v-else-if="themeClass === 'spring-festival'" class="avatar-decoration spring-decoration">
      <!-- 红包边框 -->
      <div class="red-envelope-border"></div>
      <!-- 灯笼挂件 -->
      <div class="lantern-left"></div>
      <div class="lantern-right"></div>
      <!-- 福字角标 -->
      <div class="fu-badge">福</div>
    </div>
    <div v-else-if="themeClass === 'christmas'" class="avatar-decoration christmas-decoration">
      <!-- 圣诞帽 -->
      <div class="santa-hat"></div>
      <!-- 铃铛装饰 -->
      <div class="bell-left"></div>
      <div class="bell-right"></div>
      <!-- 雪花边框 -->
      <div class="snowflake-border"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lay-avatar {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  
  .lay-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: inherit;
  }
}

.avatar-decoration {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

/* ==================== 万圣节装饰 ==================== */
.halloween-decoration {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  // 南瓜帽
  .pumpkin-hat {
    position: absolute;
    top: -15%;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 30%;
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
      width: 20%;
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
      width: 40%;
      height: 40%;
      background: radial-gradient(circle, #000 30%, transparent 30%);
      background-size: 25% 40%;
      background-position: center;
      background-repeat: no-repeat;
    }
  }

  // 蝙蝠装饰
  .bat-decoration {
    position: absolute;
    top: 10%;
    right: -10%;
    width: 30px;
    height: 20px;
    background: #2c003e;
    border-radius: 50%;
    animation: bat-fly 3s ease-in-out infinite;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 20px;
      height: 15px;
      background: #2c003e;
      border-radius: 50% 50% 0 0;
      transform: translateY(-50%);
    }
    
    &::before {
      left: -15px;
      transform: translateY(-50%) rotate(-20deg);
    }
    
    &::after {
      right: -15px;
      transform: translateY(-50%) rotate(20deg);
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

/* ==================== 春节装饰 ==================== */
.spring-decoration {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  // 红包边框
  .red-envelope-border {
    position: absolute;
    top: -5%;
    left: -5%;
    width: 110%;
    height: 110%;
    border: 3px solid #dc143c;
    border-radius: inherit;
    box-shadow: 
      0 0 15px rgba(220, 20, 60, 0.6),
      inset 0 0 10px rgba(255, 215, 0, 0.3);
    background: linear-gradient(45deg, 
      transparent 48%, 
      rgba(255, 215, 0, 0.3) 49%, 
      rgba(255, 215, 0, 0.3) 51%, 
      transparent 52%
    );
    animation: border-glow 2s ease-in-out infinite;
  }

  // 左侧灯笼
  .lantern-left {
    position: absolute;
    top: -20%;
    left: -15%;
    width: 25px;
    height: 35px;
    background: linear-gradient(135deg, #dc143c 0%, #a00000 100%);
    border-radius: 50% 50% 40% 40%;
    box-shadow: 
      0 4px 8px rgba(220, 20, 60, 0.5),
      inset 0 2px 4px rgba(255, 215, 0, 0.3);
    animation: lantern-swing 3s ease-in-out infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 10px;
      background: #ffd700;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 右侧灯笼
  .lantern-right {
    position: absolute;
    top: -20%;
    right: -15%;
    width: 25px;
    height: 35px;
    background: linear-gradient(135deg, #dc143c 0%, #a00000 100%);
    border-radius: 50% 50% 40% 40%;
    box-shadow: 
      0 4px 8px rgba(220, 20, 60, 0.5),
      inset 0 2px 4px rgba(255, 215, 0, 0.3);
    animation: lantern-swing 3s ease-in-out infinite 0.5s;
    
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 10px;
      background: #ffd700;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 福字角标
  .fu-badge {
    position: absolute;
    top: -10%;
    right: -10%;
    width: 35px;
    height: 35px;
    background: linear-gradient(135deg, #dc143c 0%, #ff4444 100%);
    border-radius: 50%;
    border: 2px solid #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
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
      0 0 15px rgba(220, 20, 60, 0.6),
      inset 0 0 10px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 
      0 0 25px rgba(220, 20, 60, 0.8),
      inset 0 0 15px rgba(255, 215, 0, 0.5);
  }
}

@keyframes lantern-swing {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

@keyframes fu-rotate {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

/* ==================== 圣诞节装饰 ==================== */
.christmas-decoration {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  // 圣诞帽
  .santa-hat {
    position: absolute;
    top: -25%;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 40%;
    background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);
    border-radius: 0 50% 0 0;
    box-shadow: 0 4px 8px rgba(196, 30, 58, 0.5);
    
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 25%;
      background: #fff;
      border-radius: 0 0 50% 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      right: 10%;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }

  // 左侧铃铛
  .bell-left {
    position: absolute;
    bottom: -10%;
    left: -10%;
    width: 20px;
    height: 22px;
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
      width: 8px;
      height: 8px;
      background: #c41e3a;
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 右侧铃铛
  .bell-right {
    position: absolute;
    bottom: -10%;
    right: -10%;
    width: 20px;
    height: 22px;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border-radius: 0 0 50% 50%;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.5);
    animation: bell-ring 2s ease-in-out infinite 0.3s;
    
    &::before {
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #c41e3a;
      border-radius: 50%;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
    }
  }

  // 雪花边框
  .snowflake-border {
    position: absolute;
    top: -5%;
    left: -5%;
    width: 110%;
    height: 110%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: inherit;
    box-shadow: 
      0 0 15px rgba(255, 255, 255, 0.4),
      inset 0 0 10px rgba(196, 30, 58, 0.2);
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.8) 2px, transparent 2px);
    background-size: 100% 100%;
    animation: snowflake-twinkle 2s ease-in-out infinite;
  }
}

@keyframes bell-ring {
  0%, 100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
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
