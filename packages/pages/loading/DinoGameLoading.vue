<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 占位兼容 */
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  loadingText: "正在唤醒恐龙小游戏...",
  showProgress: false
});

// 画布参数（保持原尺寸，通过 CSS 全屏显示）
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 150;
const GROUND_Y = CANVAS_HEIGHT - 24;
const DINO_X = 70;
const DINO_WIDTH = 40;
const DINO_HEIGHT_RUN = 43;
const DINO_HEIGHT_DUCK = 25;

// 游戏状态
const canvasRef = ref<HTMLCanvasElement | null>(null);
const dinoY = ref(0);
const velocity = ref(0);
const isJumping = ref(false);
const isDucking = ref(false);
const gameOver = ref(false);
const started = ref(false);
const score = ref(0);
const highScore = ref(0);

// 游戏参数（降低难度，dinoY 向上为正）
const GRAVITY = -0.6;
const JUMP_VELOCITY = 12;
const INITIAL_SPEED = 5;
const MAX_SPEED = 10;
const SPEED_INCREASE = 0.0005;

let currentSpeed = INITIAL_SPEED;
let frameCount = 0;
let dinoFrame = 0; // 恐龙动画帧
let groundOffset = 0;
let obstacles: Array<{ x: number; type: number; width: number; height: number }> = [];
let nextObstacleDistance = 0;
let scoreFlashFrames = 0;
let lastMilestoneScore = 0;

interface Cloud {
  x: number;
  y: number;
  speed: number;
}

let clouds: Cloud[] = [];
let nextCloudDistance = 0;

const isIntroActive = ref(true);
const isSpacePressed = ref(false);

let frameId = 0;
let introTimer = 0;
let spaceTimer = 0;

// Chrome 恐龙像素数据 - 使用精确的像素坐标 [x, y] 格式
// 站立/奔跑帧1 - 40x43 像素
const drawDinoPixels = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isDucking: boolean
) => {
  ctx.fillStyle = "#535353";

  if (isDucking) {
    // 下蹲状态：更接近原版的小短身 + 大头
    // 身体
    for (let py = 12; py <= 24; py += 2) {
      for (let px = 0; px <= 30; px += 2) {
        ctx.fillRect(x + px, y + py, 2, 2);
      }
    }
    // 头部
    for (let py = 0; py <= 12; py += 2) {
      for (let px = 16; px <= 34; px += 2) {
        // 下颌挖空一点，轮廓更像
        if (py >= 10 && px <= 20) {
          continue;
        }
        ctx.fillRect(x + px, y + py, 2, 2);
      }
    }
    // 尾巴（略微上翘）
    for (let i = 0; i < 5; i += 1) {
      for (let px = -2 * i; px <= 0; px += 2) {
        ctx.fillRect(x + px, y + 18 + i * 2, 2, 2);
      }
    }
    // 腿（简单两条）
    for (let py = 24; py <= 30; py += 2) {
      ctx.fillRect(x + 6, y + py, 2, 2);
      ctx.fillRect(x + 10, y + py, 2, 2);
    }
    // 眼睛
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 30, y + 4, 2, 2);
  } else {
    // 站立/奔跑状态：头大、身子短，尾巴上翘，更接近原版
    // 身体
    for (let py = 16; py <= 32; py += 2) {
      for (let px = 0; px <= 24; px += 2) {
        ctx.fillRect(x + px, y + py, 2, 2);
      }
    }
    // 头部
    for (let py = 0; py <= 16; py += 2) {
      for (let px = 12; px <= 30; px += 2) {
        // 下颌区域挖空，做出嘴巴轮廓
        if (py >= 10 && px <= 16) {
          continue;
        }
        ctx.fillRect(x + px, y + py, 2, 2);
      }
    }
    // 脖子与胸口加厚一点
    for (let py = 12; py <= 20; py += 2) {
      for (let px = 8; px <= 12; px += 2) {
        ctx.fillRect(x + px, y + py, 2, 2);
      }
    }
    // 小短手
    for (let py = 18; py <= 22; py += 2) {
      ctx.fillRect(x + 20, y + py, 2, 2);
      ctx.fillRect(x + 22, y + py, 2, 2);
    }
    // 尾巴（从身体后方向右上方翘起）
    for (let i = 0; i < 6; i += 1) {
      for (let px = -2 * i; px <= 0; px += 2) {
        ctx.fillRect(x + px, y + 24 + i * 2, 2, 2);
      }
    }

    // 腿部动画 - 根据帧数切换（两条小短腿交替）
    if (frame === 0) {
      // 帧1：左腿在前，右腿在后
      for (let py = 32; py <= 40; py += 2) {
        // 左腿
        ctx.fillRect(x + 4, y + py, 2, 2);
        ctx.fillRect(x + 6, y + py, 2, 2);
        // 右腿稍微靠里一点
        if (py >= 34) {
          ctx.fillRect(x + 10, y + py, 2, 2);
          ctx.fillRect(x + 12, y + py, 2, 2);
        }
      }
    } else {
      // 帧2：右腿在前，左腿在后
      for (let py = 32; py <= 40; py += 2) {
        // 右腿
        ctx.fillRect(x + 10, y + py, 2, 2);
        ctx.fillRect(x + 12, y + py, 2, 2);
        // 左腿稍微靠里一点
        if (py >= 34) {
          ctx.fillRect(x + 4, y + py, 2, 2);
          ctx.fillRect(x + 6, y + py, 2, 2);
        }
      }
    }
    // 眼睛
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 28, y + 4, 2, 2);
  }
};

// 仙人掌类型（宽度x高度）
const CACTUS_TYPES = [
  { width: 17, height: 34 }, // 单株小
  { width: 25, height: 50 }, // 单株大
  { width: 17, height: 34, double: true }, // 双株小
  { width: 25, height: 50, double: true } // 双株大
];

// 绘制恐龙 - 使用精确像素绘制
const drawDino = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  drawDinoPixels(ctx, x, y, dinoFrame, isDucking.value);
};

// 绘制仙人掌 - 使用精确像素绘制
const drawCactus = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: number
) => {
  ctx.fillStyle = "#535353";
  const cactus = CACTUS_TYPES[type];

  // 单株小仙人掌 (17x34)
  if (type === 0) {
    // 主茎
    for (let i = 0; i < 34; i += 2) {
      for (let j = 0; j < 17; j += 2) {
        ctx.fillRect(x + j, y - 34 + i, 2, 2);
      }
    }
    // 左侧分支
    for (let i = 8; i < 14; i += 2) {
      for (let j = -6; j < -2; j += 2) {
        ctx.fillRect(x + j, y - 34 + i, 2, 2);
      }
    }
    // 右侧分支
    for (let i = 8; i < 14; i += 2) {
      for (let j = 17; j < 23; j += 2) {
        ctx.fillRect(x + j, y - 34 + i, 2, 2);
      }
    }
  }
  // 单株大仙人掌 (25x50)
  else if (type === 1) {
    // 主茎
    for (let i = 0; i < 50; i += 2) {
      for (let j = 0; j < 25; j += 2) {
        ctx.fillRect(x + j, y - 50 + i, 2, 2);
      }
    }
    // 左侧分支
    for (let i = 12; i < 20; i += 2) {
      for (let j = -8; j < -2; j += 2) {
        ctx.fillRect(x + j, y - 50 + i, 2, 2);
      }
    }
    // 右侧分支
    for (let i = 12; i < 20; i += 2) {
      for (let j = 25; j < 31; j += 2) {
        ctx.fillRect(x + j, y - 50 + i, 2, 2);
      }
    }
  }
  // 双株小仙人掌
  else if (type === 2) {
    // 第一株
    for (let i = 0; i < 34; i += 2) {
      for (let j = 0; j < 17; j += 2) {
        ctx.fillRect(x + j, y - 34 + i, 2, 2);
      }
    }
    // 第二株
    for (let i = 0; i < 34; i += 2) {
      for (let j = 0; j < 17; j += 2) {
        ctx.fillRect(x + 27 + j, y - 34 + i, 2, 2);
      }
    }
  }
  // 双株大仙人掌
  else if (type === 3) {
    // 第一株
    for (let i = 0; i < 50; i += 2) {
      for (let j = 0; j < 25; j += 2) {
        ctx.fillRect(x + j, y - 50 + i, 2, 2);
      }
    }
    // 第二株
    for (let i = 0; i < 50; i += 2) {
      for (let j = 0; j < 25; j += 2) {
        ctx.fillRect(x + 35 + j, y - 50 + i, 2, 2);
      }
    }
  }
};

// 绘制云朵（接近原版的简易像素云）
const drawClouds = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#b0b0b0";
  for (const cloud of clouds) {
    const baseX = cloud.x;
    const baseY = cloud.y;
    ctx.fillRect(baseX, baseY, 18, 4);
    ctx.fillRect(baseX + 4, baseY - 4, 12, 4);
    ctx.fillRect(baseX + 8, baseY + 4, 10, 4);
  }
};

// 绘制分数（00000 + HI 00000，接近 Chrome 样式）
const drawScore = (ctx: CanvasRenderingContext2D, width: number) => {
  const scoreText = score.value.toString().padStart(5, "0");
  const highText = highScore.value.toString().padStart(5, "0");

  ctx.save();
  ctx.fillStyle = scoreFlashFrames > 0 ? "#f97316" : "#535353";
  ctx.font = "12px 'Courier New', monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  ctx.fillText(scoreText, width - 16, 8);

  if (highScore.value > 0) {
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.fillText(`HI ${highText}`, width - 16 - scoreWidth - 28, 8);
  }

  ctx.restore();

  if (scoreFlashFrames > 0) {
    scoreFlashFrames--;
  }
};

// 绘制地面
const drawGround = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const groundY = height - 24;
  ctx.fillStyle = "#535353";
  ctx.fillRect(0, groundY, width, 2);

  // 地面细节
  ctx.fillStyle = "#535353";
  for (let i = 0; i < width; i += 20) {
    const x = (i - groundOffset) % 20;
    if (x < 10) {
      ctx.fillRect(x, groundY - 6, 1, 1);
    }
  }
};

  // 碰撞检测
  const checkCollision = (): boolean => {
    const dinoX = DINO_X;
    const dinoHeight = isDucking.value ? DINO_HEIGHT_DUCK : DINO_HEIGHT_RUN;
    const dinoYTop = GROUND_Y - dinoHeight - dinoY.value;
    const dinoWidth = DINO_WIDTH;

    for (const obstacle of obstacles) {
      const obstacleX = CANVAS_WIDTH - obstacle.x;
      const obstacleYTop = GROUND_Y - obstacle.height;

    if (
      dinoX < obstacleX + obstacle.width &&
      dinoX + dinoWidth > obstacleX &&
      dinoYTop < obstacleYTop + obstacle.height &&
      dinoYTop + dinoHeight > obstacleYTop
    ) {
      return true;
    }
  }
  return false;
};

// 重置游戏
const resetGame = () => {
  dinoY.value = 0;
  velocity.value = 0;
  isJumping.value = false;
  isDucking.value = false;
  currentSpeed = INITIAL_SPEED;
  frameCount = 0;
  dinoFrame = 0;
  groundOffset = 0;
  obstacles = [];
  nextObstacleDistance = 0;
  clouds = [];
  nextCloudDistance = 0;
  scoreFlashFrames = 0;
  lastMilestoneScore = 0;
  score.value = 0;
  gameOver.value = false;
  started.value = false;
  isIntroActive.value = true;
};

// 开始游戏
const startRun = () => {
  if (!started.value) {
    started.value = true;
  }
};

// 跳跃
const jump = () => {
  if (gameOver.value) {
    resetGame();
    startRun();
    return;
  }
  startRun();
  if (!isJumping.value && !isDucking.value) {
    isJumping.value = true;
    velocity.value = JUMP_VELOCITY;
  }
};

// 下蹲
const duck = () => {
  if (gameOver.value) {
    return;
  }
  startRun();
  if (!isJumping.value) {
    isDucking.value = true;
  }
};

// 停止下蹲
const stopDuck = () => {
  isDucking.value = false;
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === "Space" || event.key === " ") {
    event.preventDefault();
    jump();
    if (!isSpacePressed.value) {
      isSpacePressed.value = true;
      if (spaceTimer > 0) {
        window.clearTimeout(spaceTimer);
      }
      spaceTimer = window.setTimeout(() => {
        isSpacePressed.value = false;
      }, 160);
    }
  } else if (event.key === "ArrowDown" || event.code === "ArrowDown") {
    event.preventDefault();
    duck();
  }
};

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" || event.code === "ArrowDown") {
    event.preventDefault();
    stopDuck();
  }
};

// 游戏循环
const loop = () => {
  const canvas = canvasRef.value;
  if (!canvas) {
    frameId = window.requestAnimationFrame(loop);
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    frameId = window.requestAnimationFrame(loop);
    return;
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7f7f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 背景云朵
  drawClouds(ctx);

  if (started.value && !gameOver.value) {
    frameCount++;

    // 更新速度
    if (currentSpeed < MAX_SPEED) {
      currentSpeed += SPEED_INCREASE;
    }

    // 更新分数（每 100 分高亮一段时间）
    const nextScore = Math.floor(frameCount / 10);
    if (nextScore !== score.value) {
      score.value = nextScore;
      if (score.value > highScore.value) {
        highScore.value = score.value;
      }
      if (
        score.value > 0 &&
        score.value % 100 === 0 &&
        score.value !== lastMilestoneScore
      ) {
        scoreFlashFrames = 30;
        lastMilestoneScore = score.value;
      }
    }

    // 更新恐龙位置
    if (isJumping.value || dinoY.value > 0) {
      velocity.value += GRAVITY;
      dinoY.value += velocity.value;
      if (dinoY.value <= 0) {
        dinoY.value = 0;
        isJumping.value = false;
        velocity.value = 0;
      }
    }

    // 更新恐龙动画帧
    if (!isJumping.value && !isDucking.value) {
      dinoFrame = Math.floor(frameCount / 7) % 2;
    }

    // 更新地面滚动
    groundOffset = (groundOffset + currentSpeed) % 20;

    // 生成障碍物（降低难度：增加间距）
    nextObstacleDistance -= currentSpeed;
    if (nextObstacleDistance <= 0) {
      const type = Math.floor(Math.random() * CACTUS_TYPES.length);
      obstacles.push({
        x: 0,
        type,
        width: CACTUS_TYPES[type].double
          ? CACTUS_TYPES[type].width * 2 + 10
          : CACTUS_TYPES[type].width,
        height: CACTUS_TYPES[type].height
      });
      nextObstacleDistance = 200 + Math.random() * 300;
    }

    // 更新障碍物位置
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x += currentSpeed;
      if (obstacles[i].x > 700) {
        obstacles.splice(i, 1);
      }
    }

    // 生成云朵（慢速飘动，接近原版效果）
    nextCloudDistance -= currentSpeed * 0.5;
    if (nextCloudDistance <= 0) {
      clouds.push({
        x: CANVAS_WIDTH + 40,
        y: 20 + Math.random() * 30,
        speed: 0.5 + Math.random() * 0.5
      });
      nextCloudDistance = 150 + Math.random() * 250;
    }

    // 更新云朵位置
    for (let i = clouds.length - 1; i >= 0; i--) {
      clouds[i].x -= clouds[i].speed;
      if (clouds[i].x < -60) {
        clouds.splice(i, 1);
      }
    }

    // 碰撞检测
    if (checkCollision()) {
      gameOver.value = true;
      isIntroActive.value = false;
    }
  }

  // 绘制地面
  drawGround(ctx, canvas.width, canvas.height);

  // 绘制障碍物
  for (const obstacle of obstacles) {
    drawCactus(
      ctx,
      CANVAS_WIDTH - obstacle.x,
      GROUND_Y,
      obstacle.type
    );
  }

  // 绘制恐龙
  const dinoHeight = isDucking.value ? DINO_HEIGHT_DUCK : DINO_HEIGHT_RUN;
  const dinoDrawY = GROUND_Y - dinoHeight;
  drawDino(ctx, DINO_X, dinoDrawY - dinoY.value);

  // 绘制分数（画布内分数更贴近原版）
  drawScore(ctx, canvas.width);

  // 绘制游戏结束提示（更接近 Chrome 风格）
  if (gameOver.value) {
    ctx.fillStyle = "#535353";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("游戏结束", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "12px system-ui";
    ctx.fillText("按空格键重新开始", canvas.width / 2, canvas.height / 2 + 12);
  }

  frameId = window.requestAnimationFrame(loop);
};

onMounted(() => {
  resetGame();
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);
  frameId = window.requestAnimationFrame(loop);
  introTimer = window.setTimeout(() => {
    isIntroActive.value = false;
  }, 2400);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("keyup", handleKeyup);
  if (frameId) {
    window.cancelAnimationFrame(frameId);
  }
  if (introTimer > 0) {
    window.clearTimeout(introTimer);
  }
  if (spaceTimer > 0) {
    window.clearTimeout(spaceTimer);
  }
});
</script>

<template>
  <div class="cool-loading dino-intro-loading" @click="jump">
    <canvas
      ref="canvasRef"
      class="dino-canvas"
      :width="CANVAS_WIDTH"
      :height="CANVAS_HEIGHT"
    />
  </div>
</template>

<style scoped>
.dino-intro-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.dino-canvas {
  width: min(100vw, 100vh * 4);
  height: min(100vh, 100vw / 4);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  display: block;
}
</style>