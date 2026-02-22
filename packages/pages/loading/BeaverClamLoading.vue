<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { resolveCrackLevel, type CrackLevel } from "../game/beaverClamLogic";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 是否显示进度条 */
  showProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "河狸正在努力敲开蛤蜊...",
  showProgress: true
});

// 游戏状态
const progress = ref(0);
const hitCount = ref(0);
const clamHp = ref(100);
const isHitting = ref(false);
const clamShake = ref(false);
const clamOpen = ref(false);
const particles = ref<Array<{ x: number; y: number; vx: number; vy: number; color: string }>>([]);

// 河狸位置（固定在左侧）
const beaverX = ref(100);
const beaverY = ref(300);
const beaverDirection = ref(1); // 1 = 向右

// 蛤蜊位置（固定在右侧）
const clamX = ref(600);
const clamY = ref(300);

// 计算裂纹等级
const crackLevel = computed<CrackLevel>(() => {
  return resolveCrackLevel(clamHp.value);
});

// 裂纹样式类
const clamCrackClass = computed(() => {
  if (crackLevel.value === "broken") {
    return "crack-broken";
  }
  if (crackLevel.value === "heavy") {
    return "crack-heavy";
  }
  if (crackLevel.value === "medium") {
    return "crack-medium";
  }
  return "crack-intact";
});

// 生成粒子效果
const spawnParticles = (x: number, y: number, level: CrackLevel) => {
  const count = level === "broken" ? 12 : level === "heavy" ? 8 : 5;
  for (let i = 0; i < count; i++) {
    particles.value.push({
      x,
      y: y - 20,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 1) * 10,
      color: Math.random() > 0.5 ? "#fff" : "#ccc"
    });
  }
};

// 更新粒子
const updateParticles = () => {
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i];
    p.x += p.vx * 0.5;
    p.y += p.vy * 0.5;
    p.vy += 0.5;
    if (p.y > 600) {
      particles.value.splice(i, 1);
    }
  }
};

// 敲击动作
const performHit = () => {
  if (isHitting.value || clamHp.value <= 0) {
    return;
  }
  
  isHitting.value = true;
  clamShake.value = true;
  
  // 减少血量
  const damage = 8 + Math.random() * 4;
  clamHp.value = Math.max(0, clamHp.value - damage);
  hitCount.value++;
  
  // 生成粒子
  const currentLevel = resolveCrackLevel(clamHp.value);
  spawnParticles(clamX.value, clamY.value, currentLevel);
  
  // 如果血量归零，打开蛤蜊
  if (clamHp.value <= 0) {
    setTimeout(() => {
      clamOpen.value = true;
      // 显示珍珠后重置
      setTimeout(() => {
        resetAnimation();
      }, 1500);
    }, 300);
  }
  
  // 停止抖动
  const shakeDuration = currentLevel === "heavy" || currentLevel === "broken" ? 260 : 180;
  setTimeout(() => {
    clamShake.value = false;
  }, shakeDuration);
  
  // 收回手臂
  setTimeout(() => {
    isHitting.value = false;
  }, 400);
};

// 重置动画
const resetAnimation = () => {
  clamHp.value = 100;
  hitCount.value = 0;
  clamOpen.value = false;
  particles.value = [];
};

// 自动敲击循环
let hitInterval: number;
let particleInterval: number;
let progressInterval: number;

onMounted(() => {
  // 自动敲击循环（每1.2秒敲一次）
  hitInterval = setInterval(() => {
    if (!clamOpen.value) {
      performHit();
    }
  }, 1200);
  
  // 粒子更新循环
  particleInterval = setInterval(() => {
    updateParticles();
  }, 16);
  
  // 进度条更新
  if (props.showProgress) {
    progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 5;
      }
    }, 200);
  }
});

onUnmounted(() => {
  if (hitInterval) {
    clearInterval(hitInterval);
  }
  if (particleInterval) {
    clearInterval(particleInterval);
  }
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});
</script>

<template>
  <div class="beaver-loading">
    <div class="game-area">
      <!-- 地面 -->
      <div class="ground"></div>
      
      <!-- 蛤蜊 -->
      <div
        class="clam"
        :class="[{ shake: clamShake, open: clamOpen }, clamCrackClass]"
        :style="{ transform: `translate(${clamX}px, ${clamY}px)` }"
      >
        <div class="clam-shell-bottom"></div>
        <div class="clam-pearl" v-if="clamOpen"></div>
        <div class="clam-shell-top"></div>
      </div>
      
      <!-- 河狸 -->
      <div 
        class="beaver" 
        :class="{ hit: isHitting }"
        :style="{ transform: `translate(${beaverX}px, ${beaverY}px) scaleX(${beaverDirection})` }"
      >
        <div class="beaver-tail"></div>
        <div class="beaver-body"></div>
        <div class="beaver-head">
          <div class="beaver-ear"></div>
          <div class="beaver-eye"></div>
          <div class="beaver-tooth"></div>
        </div>
        <div class="beaver-arm">
          <div class="stone"></div>
        </div>
        <div class="beaver-leg"></div>
      </div>
      
      <!-- 粒子效果 -->
      <div 
        v-for="(p, i) in particles" 
        :key="i" 
        class="particle"
        :style="{ 
          transform: `translate(${p.x}px, ${p.y}px)`, 
          backgroundColor: p.color 
        }"
      ></div>
      
      <!-- HUD -->
      <div class="hud">
        <div class="score">敲击次数: {{ hitCount }}</div>
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: clamHp + '%' }"></div>
        </div>
      </div>
      
      <!-- 加载文本 -->
      <div class="loading-text">
        <span class="text-content">{{ loadingText }}</span>
      </div>
      
      <!-- 进度条 -->
      <div v-if="showProgress" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }">
          <div class="progress-shine"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.beaver-loading {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  overflow: hidden;
}

.game-area {
  position: relative;
  width: 800px;
  height: 600px;
  background: #87CEEB; /* Sky/Water */
  border: 4px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.ground {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100px;
  background: #deb887;
}

.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(255,255,255,0.8);
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
}

.hp-bar {
  width: 200px;
  height: 20px;
  background: #eee;
  border: 1px solid #333;
  margin-top: 5px;
  border-radius: 4px;
  overflow: hidden;
  
  .hp-fill {
    height: 100%;
    background: #ff4757;
    transition: width 0.2s;
  }
}

/* Clam Styles - 与游戏完全一致 */
.clam {
  position: absolute;
  width: 60px;
  height: 50px;
  margin-top: -50px; /* Pivot from bottom */
  margin-left: -30px;
  z-index: 2;
  transition: transform 0.1s;
  left: 0;
  top: 0;
  
  &.shake {
    animation: shake 0.1s infinite;
  }
  
  .clam-shell-bottom {
    position: absolute;
    bottom: 0;
    width: 60px;
    height: 30px;
    background: #6c5ce7;
    border-radius: 0 0 30px 30px;
    border: 2px solid #333;
  }
  
  .clam-shell-top {
    position: absolute;
    bottom: 28px; /* Overlap */
    width: 60px;
    height: 30px;
    background: #a29bfe;
    border-radius: 30px 30px 0 0;
    border: 2px solid #333;
    transform-origin: bottom center;
    transition: transform 0.3s;
  }

  &.crack-medium .clam-shell-top::after,
  &.crack-heavy .clam-shell-top::after,
  &.crack-broken .clam-shell-top::after {
    content: "";
    position: absolute;
    left: 28px;
    bottom: 8px;
    width: 4px;
    height: 18px;
    border-left: 2px solid rgba(255, 255, 255, 0.9);
    border-right: 2px solid rgba(128, 128, 255, 0.8);
    transform: skewX(-10deg);
  }

  &.crack-heavy .clam-shell-top::before,
  &.crack-broken .clam-shell-top::before {
    content: "";
    position: absolute;
    left: 18px;
    bottom: 4px;
    width: 22px;
    height: 14px;
    border-left: 2px solid rgba(255, 255, 255, 0.9);
    border-right: 2px solid rgba(128, 128, 255, 0.8);
    transform: skewX(14deg);
  }

  &.crack-broken .clam-shell-top {
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }
  
  &.open .clam-shell-top {
    transform: rotate(-60deg);
  }
  
  .clam-pearl {
    position: absolute;
    bottom: 15px;
    left: 20px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 5px gold;
  }
}

/* Beaver Styles - 与游戏完全一致 */
.beaver {
  position: absolute;
  width: 80px;
  height: 80px;
  margin-top: -80px;
  margin-left: -40px;
  z-index: 3;
  transition: transform 0.1s;
  left: 0;
  top: 0;
  
  .beaver-body {
    position: absolute;
    bottom: 0;
    width: 60px;
    height: 70px;
    background: #8B4513;
    border-radius: 30px 30px 10px 10px;
    left: 10px;
  }
  
  .beaver-head {
    position: absolute;
    top: -10px;
    left: 15px;
    width: 50px;
    height: 50px;
    background: #8B4513;
    border-radius: 50%;
    
    .beaver-eye {
      position: absolute;
      top: 15px;
      right: 10px;
      width: 6px;
      height: 6px;
      background: #000;
      border-radius: 50%;
    }
    
    .beaver-ear {
      position: absolute;
      top: 0;
      right: 5px;
      width: 10px;
      height: 10px;
      background: #654321;
      border-radius: 50%;
    }
    
    .beaver-tooth {
      position: absolute;
      bottom: 5px;
      right: 15px;
      width: 10px;
      height: 8px;
      background: #fff;
      border: 1px solid #ccc;
    }
  }
  
  .beaver-tail {
    position: absolute;
    bottom: 5px;
    left: -20px;
    width: 40px;
    height: 20px;
    background: #4e342e;
    border-radius: 20px;
    transform: rotate(-20deg);
  }
  
  .beaver-arm {
    position: absolute;
    top: 30px;
    right: 5px;
    width: 20px;
    height: 30px;
    background: #8B4513;
    border-radius: 10px;
    transform-origin: top center;
    transform: rotate(20deg);
    
    .stone {
      position: absolute;
      bottom: -5px;
      left: -5px;
      width: 20px;
      height: 15px;
      background: #808080;
      border-radius: 50%;
    }
  }
  
  /* Animations */
  &.hit {
    .beaver-arm {
      animation: smash 0.4s ease-in-out;
    }
  }
}

@keyframes smash {
  0% { transform: rotate(20deg); }
  40% { transform: rotate(-60deg); } /* Lift */
  60% { transform: rotate(80deg); }  /* Hit */
  100% { transform: rotate(20deg); }
}

@keyframes shake {
  0% { transform: translate(0, 0); }
  25% { transform: translate(2px, 2px); }
  50% { transform: translate(-2px, -2px); }
  75% { transform: translate(2px, -2px); }
  100% { transform: translate(0, 0); }
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
  left: 0;
  top: 0;
}

.loading-text {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  color: #333;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid #333;
  border-radius: 3px;
  overflow: hidden;
  z-index: 10;
}

.progress-fill {
  height: 100%;
  background: #ff4757;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
  
  .progress-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    animation: shine 1.5s infinite;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 响应式
@media (max-width: 768px) {
  .game-area {
    width: 100%;
    max-width: 600px;
    height: 450px;
  }
  
  .beaver {
    transform: scale(0.8);
  }
  
  .clam {
    transform: scale(0.8);
  }
  
  .loading-text {
    font-size: 16px;
    bottom: 100px;
  }
  
  .progress-bar {
    width: 250px;
    bottom: 50px;
  }
}
</style>

