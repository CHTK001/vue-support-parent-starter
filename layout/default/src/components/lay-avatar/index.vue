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

  }
}
</style>
