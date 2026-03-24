<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from "vue";
import {
  calcDistance,
  applyHit,
  resolveBeaverState,
  resolveCrackLevel,
  type BeaverState,
  type CrackLevel
} from "./beaverClamLogic";

// 游戏常量
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BEAVER_SPEED = 3;
const ATTACK_RANGE = 80;
const BASE_DAMAGE = 10;

// 状态
const score = ref(0);
const clamHp = ref(100);
const gameActive = ref(false);
const particles = ref<
  { x: number; y: number; vx: number; vy: number; color: string }[]
>([]);
const logs = ref<string[]>([]);

// 实体
const beaver = reactive({
  x: 100,
  y: 300,
  direction: 1,
  state: "idle" as BeaverState,
  frame: 0
});

const clam = reactive({
  x: 600,
  y: 300,
  isOpen: false,
  isShake: false,
  crackLevel: "intact" as CrackLevel
});

// 基于血量的裂纹等级
const clamCrackClass = computed(() => {
  if (clam.crackLevel === "broken") {
    return "crack-broken";
  }
  if (clam.crackLevel === "heavy") {
    return "crack-heavy";
  }
  if (clam.crackLevel === "medium") {
    return "crack-medium";
  }
  return "crack-intact";
});

// 音效系统（实际项目中可替换为更完整的 Audio 管理器）
const audioMap: Record<string, HTMLAudioElement | null> = {
  hit: null,
  break: null,
  success: null
};

const initAudio = () => {
  // 这里路径交由业务按需挂载静态资源
  try {
    audioMap.hit = new Audio("/audio/beaver_hit.mp3");
    audioMap.break = new Audio("/audio/clam_break.mp3");
    audioMap.success = new Audio("/audio/beaver_success.mp3");
  } catch {
    // 静默处理，避免在不支持 Audio 的环境报错
  }
};

const playSound = (type: "hit" | "break" | "success") => {
  const audio = audioMap[type];
  if (!audio) {
    return;
  }
  // 重置到开头，模拟多次敲击的叠加感
  audio.currentTime = 0;
  void audio.play().catch(() => {});
};

// Game Loop
let animationFrameId: number;
let lastTime = 0;

const update = (time: number) => {
  if (!gameActive.value) {
    return;
  }
  const delta = time - lastTime;
  lastTime = time;

  // AI：朝蛤蜊移动
  if (clamHp.value > 0) {
    const dist = calcDistance(beaver.x, beaver.y, clam.x, clam.y);
    beaver.state = resolveBeaverState(beaver.state, dist, ATTACK_RANGE);

    if (beaver.state === "walk") {
      const dx = clam.x - beaver.x;
      const dy = clam.y - beaver.y;
      const angle = Math.atan2(dy, dx);
      beaver.x += Math.cos(angle) * BEAVER_SPEED;
      beaver.y += Math.sin(angle) * BEAVER_SPEED;
      beaver.direction = dx > 0 ? 1 : -1;

      // 简单行走帧切换
      if (Math.floor(time / 100) % 2 === 0) {
        beaver.frame = 1;
      } else {
        beaver.frame = 0;
      }
    } else if (beaver.state === "idle") {
      // 到达敲击范围自动触发攻击
      performHit();
    }
  }

  // 粒子物理
  updateParticles(delta);

  animationFrameId = requestAnimationFrame(update);
};

const performHit = () => {
  if (beaver.state === "hit" || clamHp.value <= 0) {
    return;
  }
  beaver.state = "hit";

  // 动画序列：举起 → 落下 → 还原
  setTimeout(() => {
    const dist = calcDistance(beaver.x, beaver.y, clam.x, clam.y);

    if (dist <= 100 && clamHp.value > 0) {
      clam.isShake = true;

      // 力度：距离越近、得分越高，力度略大
      const proximityFactor = Math.max(0.6, 1.2 - dist / 120);
      const comboFactor = 1 + Math.min(score.value, 10) * 0.03;
      const powerMultiplier = proximityFactor * comboFactor;

      const hitResult = applyHit(clamHp.value, BASE_DAMAGE, powerMultiplier);
      clamHp.value = hitResult.nextHp;
      clam.crackLevel = hitResult.crackLevel;
      score.value += 1;

      // 物理反馈：音效 + 抖动 + 粒子
      playSound("hit");
      spawnParticles(clam.x, clam.y, hitResult.crackLevel);

      if (hitResult.isBroken) {
        clam.isOpen = true;
        playSound("break");
        addLog("蛤蜊敲开了！获得珍珠！");
        playSound("success");
      }

      const shakeDuration = hitResult.crackLevel === "heavy" || hitResult.crackLevel === "broken" ? 260 : 180;
      setTimeout(() => {
        clam.isShake = false;
      }, shakeDuration);
    }

    // 收回前爪
    setTimeout(() => {
      beaver.state = "idle";
    }, 300);
  }, 400);
};

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

const updateParticles = (delta: number) => {
  const dt = delta > 0 ? delta / 16.7 : 1;
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.5 * dt;
    if (p.y > GAME_HEIGHT) {
      particles.value.splice(i, 1);
    }
  }
};

const addLog = (msg: string) => {
  logs.value.unshift(msg);
  if (logs.value.length > 5) {
    logs.value.pop();
  }
};

const startGame = () => {
  if (gameActive.value) return;
  gameActive.value = true;
  clamHp.value = 100;
  clam.isOpen = false;
  clam.crackLevel = resolveCrackLevel(clamHp.value);
  beaver.x = 100;
  beaver.y = 300;
  lastTime = performance.now();
  initAudio();
  update(lastTime);
  addLog("游戏开始！河狸出动！");
};

const resetGame = () => {
  gameActive.value = false;
  cancelAnimationFrame(animationFrameId);
  score.value = 0;
  clamHp.value = 100;
  clam.isOpen = false;
  clam.crackLevel = resolveCrackLevel(clamHp.value);
  beaver.x = 100;
  beaver.y = 300;
  beaver.state = "idle";
  logs.value = [];
};

onMounted(() => {
  // Auto start for demo
  startGame();
});

onUnmounted(() => {
  gameActive.value = false;
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="beaver-game-container">
    <div class="game-area">
      <div class="hud">
        <div class="score">敲击次数: {{ score }}</div>
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: clamHp + '%' }"></div>
        </div>
      </div>
      
      <!-- Clam -->
      <div
        class="clam"
        :class="[{ shake: clam.isShake, open: clam.isOpen }, clamCrackClass]"
        :style="{ transform: `translate(${clam.x}px, ${clam.y}px)` }"
      >
        <div class="clam-shell-bottom"></div>
        <div class="clam-pearl" v-if="clam.isOpen"></div>
        <div class="clam-shell-top"></div>
      </div>
      
      <!-- Beaver -->
      <div class="beaver" 
           :class="beaver.state"
           :style="{ transform: `translate(${beaver.x}px, ${beaver.y}px) scaleX(${beaver.direction})` }">
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
      
      <!-- Particles -->
      <div v-for="(p, i) in particles" :key="i" class="particle" 
           :style="{ transform: `translate(${p.x}px, ${p.y}px)`, backgroundColor: p.color }">
      </div>
    </div>
    
    <div class="controls">
      <button class="btn" @click="startGame">开始游戏</button>
      <button class="btn" @click="resetGame">重置</button>
      <div class="logs">
        <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.beaver-game-container {
  padding: 20px;
  background: #f0f9ff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  
  /* Ground */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100px;
    background: #deb887;
  }
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

/* Clam Styles */
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

/* Beaver Styles */
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
  &.walk {
    .beaver-body {
      animation: bounce 0.3s infinite alternate;
    }
  }
  
  &.hit {
    .beaver-arm {
      animation: smash 0.4s ease-in-out;
    }
  }
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-5px); }
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

.controls {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  
  .btn {
    padding: 10px 20px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #66b1ff;
    }
  }
  
  .logs {
    width: 300px;
    height: 100px;
    border: 1px solid #ddd;
    padding: 10px;
    overflow-y: auto;
    background: #fff;
    font-size: 12px;
  }
}
</style>
