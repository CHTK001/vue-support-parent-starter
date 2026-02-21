<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  /** 加载文案 */
  loadingText?: string;
  /** 占位兼容 */
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  loadingText: "正在加载马里奥游戏...",
  showProgress: false
});

// 游戏常量
const TILE_SIZE = 16;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 240;
const GRAVITY = 0.8;
const JUMP_POWER = -12;
const MAX_SPEED = 4;
const ACCELERATION = 0.3;
const FRICTION = 0.85;

// 游戏状态
const canvasRef = ref<HTMLCanvasElement | null>(null);
const gameStarted = ref(false);
const gameOver = ref(false);
const score = ref(0);
const lives = ref(3);
const timeLeft = ref(400);
const cameraX = ref(0);

// 马里奥状态
const mario = ref({
  x: 50,
  y: 180,
  vx: 0,
  vy: 0,
  width: 16,
  height: 16,
  onGround: false,
  facingRight: true,
  animFrame: 0,
  animTimer: 0
});

// 按键状态
const keys = ref({
  left: false,
  right: false,
  jump: false,
  jumpPressed: false
});

// 生成关卡数据 - 第一关完整地图
const generateLevel = () => {
  const blocks: Array<{ type: string; x: number; y: number; width?: number; height?: number }> = [];
  
  // 地面 - 第一关大约3200像素宽
  for (let i = 0; i < 200; i++) {
    blocks.push({ type: 'ground', x: i * TILE_SIZE, y: 224, width: TILE_SIZE, height: TILE_SIZE });
  }
  
  // 第一组平台 (x: 200-400)
  for (let i = 0; i < 4; i++) {
    blocks.push({ type: 'brick', x: 200 + i * TILE_SIZE, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 264, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 280, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 296, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  for (let i = 0; i < 2; i++) {
    blocks.push({ type: 'brick', x: 312 + i * TILE_SIZE, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  }
  
  // 第一个管道 (x: 400)
  blocks.push({ type: 'pipe', x: 400, y: 208, width: 32, height: 32 });
  
  // 第二组平台 (x: 500-700)
  for (let i = 0; i < 3; i++) {
    blocks.push({ type: 'brick', x: 500 + i * TILE_SIZE, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 548, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'brick', x: 564, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  
  // 第二个管道 (x: 800)
  blocks.push({ type: 'pipe', x: 800, y: 208, width: 32, height: 32 });
  
  // 第三组平台 (x: 1000-1200)
  for (let i = 0; i < 5; i++) {
    blocks.push({ type: 'brick', x: 1000 + i * TILE_SIZE, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 1080, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 1096, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  
  // 第四组平台 (x: 1300-1500)
  for (let i = 0; i < 4; i++) {
    blocks.push({ type: 'brick', x: 1300 + i * TILE_SIZE, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 1364, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 1380, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  
  // 第三个管道 (x: 1600)
  blocks.push({ type: 'pipe', x: 1600, y: 208, width: 32, height: 32 });
  
  // 第五组平台 (x: 1800-2000) - 阶梯式
  for (let i = 0; i < 3; i++) {
    blocks.push({ type: 'brick', x: 1800 + i * TILE_SIZE, y: 192 - i * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 1848, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'brick', x: 1864, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  
  // 第六组平台 (x: 2200-2400)
  for (let i = 0; i < 6; i++) {
    blocks.push({ type: 'brick', x: 2200 + i * TILE_SIZE, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 2296, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 2312, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'question', x: 2328, y: 144, width: TILE_SIZE, height: TILE_SIZE });
  
  // 第七组平台 (x: 2600-2800)
  for (let i = 0; i < 4; i++) {
    blocks.push({ type: 'brick', x: 2600 + i * TILE_SIZE, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'question', x: 2664, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  blocks.push({ type: 'brick', x: 2680, y: 128, width: TILE_SIZE, height: TILE_SIZE });
  
  // 终点旗杆区域 (x: 3000+)
  for (let i = 0; i < 10; i++) {
    blocks.push({ type: 'brick', x: 3000 + i * TILE_SIZE, y: 160, width: TILE_SIZE, height: TILE_SIZE });
  }
  blocks.push({ type: 'flagpole', x: 3100, y: 0, width: 16, height: 224 });
  
  return blocks;
};

const level = ref(generateLevel());

// 检查是否到达终点
const checkWin = () => {
  if (mario.value.x >= 3100) {
    gameOver.value = true;
    score.value += timeLeft.value * 50; // 时间奖励
  }
};

// 生成敌人 - 第一关敌人分布
const generateEnemies = () => {
  return [
    { x: 300, y: 208, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 450, y: 208, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 600, y: 144, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 850, y: 208, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 1100, y: 112, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 1400, y: 144, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 1650, y: 208, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 1900, y: 144, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 2300, y: 128, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 },
    { x: 2700, y: 112, vx: -1, vy: 0, width: 16, height: 16, onGround: true, dead: false, deadTimer: 0 }
  ];
};

const enemies = ref(generateEnemies());

let frameId = 0;
let lastTime = 0;
let timeInterval: number;

// 碰撞检测
const checkCollision = (rect1: { x: number; y: number; width: number; height: number }, 
                       rect2: { x: number; y: number; width: number; height: number }): boolean => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
};

// 获取马里奥脚下的方块
const getBlockAt = (x: number, y: number): { type: string; x: number; y: number; width?: number; height?: number } | null => {
  for (const block of level.value) {
    const blockX = block.x;
    const blockY = block.y;
    const blockWidth = block.width || TILE_SIZE;
    const blockHeight = block.height || TILE_SIZE;
    
    if (x >= blockX && x < blockX + blockWidth &&
        y >= blockY && y < blockY + blockHeight) {
      return block;
    }
  }
  return null;
};


// 精确的马里奥像素精灵绘制
const drawMario = (ctx: CanvasRenderingContext2D, x: number, y: number, facingRight: boolean, animFrame: number, onGround: boolean) => {
  ctx.save();
  
  const px = x;
  const py = y;
  
  if (!facingRight) {
    // 翻转绘制：以马里奥中心为轴翻转
    ctx.translate(px + 8, 0);
    ctx.scale(-1, 1);
    ctx.translate(-px - 8, 0);
  }
  
  // 根据动画帧和状态绘制不同的精灵
  if (!onGround) {
    // 跳跃状态
    // 帽子
    ctx.fillStyle = '#e52521';
    ctx.fillRect(px + 2, py + 0, 12, 2);
    ctx.fillRect(px + 1, py + 2, 14, 2);
    // 脸
    ctx.fillStyle = '#ffc83d';
    ctx.fillRect(px + 2, py + 4, 12, 6);
    // 眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 3, py + 5, 1, 1);
    ctx.fillRect(px + 10, py + 5, 1, 1);
    // 胡子
    ctx.fillStyle = '#885818';
    ctx.fillRect(px + 2, py + 8, 12, 2);
    // 身体
    ctx.fillStyle = '#e52521';
    ctx.fillRect(px + 1, py + 10, 14, 4);
    // 手（向上）
    ctx.fillRect(px + 0, py + 8, 2, 4);
    ctx.fillRect(px + 14, py + 8, 2, 4);
    // 腿（弯曲）
    ctx.fillStyle = '#2144c0';
    ctx.fillRect(px + 2, py + 14, 4, 2);
    ctx.fillRect(px + 10, py + 14, 4, 2);
  } else if (Math.abs(mario.value.vx) > 0.1) {
    // 跑步状态
    if (animFrame === 0) {
      // 跑步帧1
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 2, py + 0, 12, 2);
      ctx.fillRect(px + 1, py + 2, 14, 2);
      ctx.fillStyle = '#ffc83d';
      ctx.fillRect(px + 2, py + 4, 12, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 3, py + 5, 1, 1);
      ctx.fillRect(px + 10, py + 5, 1, 1);
      ctx.fillStyle = '#885818';
      ctx.fillRect(px + 2, py + 8, 12, 2);
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 1, py + 10, 14, 4);
      ctx.fillRect(px + 0, py + 12, 2, 2);
      ctx.fillRect(px + 14, py + 10, 2, 4);
      ctx.fillStyle = '#2144c0';
      ctx.fillRect(px + 2, py + 14, 3, 2);
      ctx.fillRect(px + 11, py + 14, 3, 2);
    } else if (animFrame === 1) {
      // 跑步帧2
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 2, py + 0, 12, 2);
      ctx.fillRect(px + 1, py + 2, 14, 2);
      ctx.fillStyle = '#ffc83d';
      ctx.fillRect(px + 2, py + 4, 12, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 3, py + 5, 1, 1);
      ctx.fillRect(px + 10, py + 5, 1, 1);
      ctx.fillStyle = '#885818';
      ctx.fillRect(px + 2, py + 8, 12, 2);
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 1, py + 10, 14, 4);
      ctx.fillRect(px + 0, py + 8, 2, 6);
      ctx.fillRect(px + 14, py + 14, 2, 2);
      ctx.fillStyle = '#2144c0';
      ctx.fillRect(px + 2, py + 14, 3, 2);
      ctx.fillRect(px + 11, py + 16, 3, 2);
    } else {
      // 跑步帧3
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 2, py + 0, 12, 2);
      ctx.fillRect(px + 1, py + 2, 14, 2);
      ctx.fillStyle = '#ffc83d';
      ctx.fillRect(px + 2, py + 4, 12, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + 3, py + 5, 1, 1);
      ctx.fillRect(px + 10, py + 5, 1, 1);
      ctx.fillStyle = '#885818';
      ctx.fillRect(px + 2, py + 8, 12, 2);
      ctx.fillStyle = '#e52521';
      ctx.fillRect(px + 1, py + 10, 14, 4);
      ctx.fillRect(px + 0, py + 14, 2, 2);
      ctx.fillRect(px + 14, py + 8, 2, 6);
      ctx.fillStyle = '#2144c0';
      ctx.fillRect(px + 2, py + 16, 3, 2);
      ctx.fillRect(px + 11, py + 14, 3, 2);
    }
  } else {
    // 站立状态
    ctx.fillStyle = '#e52521';
    ctx.fillRect(px + 2, py + 0, 12, 2);
    ctx.fillRect(px + 1, py + 2, 14, 2);
    ctx.fillStyle = '#ffc83d';
    ctx.fillRect(px + 2, py + 4, 12, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 3, py + 5, 1, 1);
    ctx.fillRect(px + 10, py + 5, 1, 1);
    ctx.fillStyle = '#885818';
    ctx.fillRect(px + 2, py + 8, 12, 2);
    ctx.fillStyle = '#e52521';
    ctx.fillRect(px + 1, py + 10, 14, 4);
    ctx.fillRect(px + 0, py + 12, 2, 2);
    ctx.fillRect(px + 14, py + 12, 2, 2);
    ctx.fillStyle = '#2144c0';
    ctx.fillRect(px + 2, py + 14, 3, 2);
    ctx.fillRect(px + 11, py + 14, 3, 2);
  }
  
  ctx.restore();
};

// 绘制云朵
const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 1) => {
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  
  const scale = size;
  // 使用多个圆形组成云朵
  ctx.beginPath();
  // 左侧大圆
  ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  // 中间大圆
  ctx.beginPath();
  ctx.arc(x + 12 * scale, y - 2 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
  // 右侧大圆
  ctx.beginPath();
  ctx.arc(x + 24 * scale, y, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  // 上方小圆
  ctx.beginPath();
  ctx.arc(x + 6 * scale, y - 6 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 18 * scale, y - 8 * scale, 7 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
};

// 绘制敌人（蘑菇怪）
const drawGoomba = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  // 身体（棕色）
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(x + 2, y + 10, 12, 6);
  
  // 头（棕色）
  ctx.fillRect(x + 1, y + 4, 14, 8);
  
  // 眼睛
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 4, y + 6, 2, 2);
  ctx.fillRect(x + 10, y + 6, 2, 2);
  
  // 脚
  ctx.fillStyle = '#654321';
  ctx.fillRect(x, y + 16, 4, 2);
  ctx.fillRect(x + 12, y + 16, 4, 2);
};

// 绘制方块
const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
  if (type === 'ground') {
    // 地面砖块
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#803000';
    ctx.fillRect(x, y, TILE_SIZE, 2);
    ctx.fillRect(x, y, 2, TILE_SIZE);
    ctx.fillStyle = '#fbd000';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
  } else if (type === 'brick') {
    // 砖块
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#803000';
    ctx.fillRect(x, y, TILE_SIZE, 2);
    ctx.fillRect(x, y, 2, TILE_SIZE);
    ctx.fillStyle = '#fbd000';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
    // 砖块纹理
    ctx.fillStyle = '#803000';
    ctx.fillRect(x + 4, y + 6, 8, 1);
    ctx.fillRect(x + 4, y + 10, 8, 1);
  } else if (type === 'question') {
    // 问号方块
    ctx.fillStyle = '#fbd000';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(x, y, TILE_SIZE, 2);
    ctx.fillRect(x, y, 2, TILE_SIZE);
    ctx.fillStyle = '#803000';
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
    // 问号
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
  } else if (type === 'pipe') {
    // 管道
    ctx.fillStyle = '#00a000';
    ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#00c000';
    ctx.fillRect(x + 2, y + 2, 28, 4);
    ctx.fillStyle = '#008000';
    ctx.fillRect(x, y, 32, 2);
    ctx.fillRect(x, y, 2, 32);
  } else if (type === 'flagpole') {
    // 旗杆
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6, y, 4, 224);
    // 旗子
    ctx.fillStyle = '#e52521';
    ctx.fillRect(x + 10, y + 20, 20, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 10, y + 24, 20, 2);
  }
};

// 游戏循环
const gameLoop = (currentTime: number) => {
  if (!canvasRef.value) {
    return;
  }
  
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    return;
  }
  
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // 清空画布
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  
  // 绘制云朵背景（多层，不同速度产生视差效果）
  // 远层云朵（移动慢）
  const cloudPositions = [
    { x: 50, y: 30, size: 1.0 },
    { x: 250, y: 40, size: 0.8 },
    { x: 450, y: 25, size: 1.2 },
    { x: 650, y: 35, size: 0.9 },
    { x: 850, y: 30, size: 1.1 },
    { x: 1050, y: 45, size: 0.85 },
    { x: 1250, y: 28, size: 1.15 },
    { x: 1450, y: 38, size: 0.95 },
    { x: 1650, y: 32, size: 1.05 },
    { x: 1850, y: 42, size: 0.9 }
  ];
  
  for (const cloud of cloudPositions) {
    const cloudX = (cloud.x - cameraX.value * 0.2) % (SCREEN_WIDTH + 200) - 50;
    if (cloudX > -100 && cloudX < SCREEN_WIDTH + 100) {
      drawCloud(ctx, cloudX, cloud.y, cloud.size);
    }
  }
  
  // 中层云朵（移动稍快）
  const midCloudPositions = [
    { x: 150, y: 60, size: 0.7 },
    { x: 350, y: 70, size: 0.6 },
    { x: 550, y: 55, size: 0.8 },
    { x: 750, y: 65, size: 0.65 },
    { x: 950, y: 60, size: 0.75 },
    { x: 1150, y: 75, size: 0.6 },
    { x: 1350, y: 58, size: 0.85 },
    { x: 1550, y: 68, size: 0.7 }
  ];
  
  for (const cloud of midCloudPositions) {
    const cloudX = (cloud.x - cameraX.value * 0.4) % (SCREEN_WIDTH + 200) - 50;
    if (cloudX > -100 && cloudX < SCREEN_WIDTH + 100) {
      drawCloud(ctx, cloudX, cloud.y, cloud.size);
    }
  }
  
  if (gameStarted.value && !gameOver.value) {
    // 更新计时器
    if (timeInterval && currentTime - timeInterval > 1000) {
      timeLeft.value--;
      timeInterval = currentTime;
      if (timeLeft.value <= 0) {
        gameOver.value = true;
      }
    }
    
    // 马里奥移动
    if (keys.value.left) {
      mario.value.vx -= ACCELERATION;
      mario.value.facingRight = false;
    }
    if (keys.value.right) {
      mario.value.vx += ACCELERATION;
      mario.value.facingRight = true;
    }
    
    // 跳跃
    if (keys.value.jump && !keys.value.jumpPressed && mario.value.onGround) {
      mario.value.vy = JUMP_POWER;
      mario.value.onGround = false;
      keys.value.jumpPressed = true;
    }
    if (!keys.value.jump) {
      keys.value.jumpPressed = false;
    }
    
    // 应用摩擦力
    mario.value.vx *= FRICTION;
    if (Math.abs(mario.value.vx) < 0.1) {
      mario.value.vx = 0;
    }
    
    // 限制最大速度
    mario.value.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, mario.value.vx));
    
    // 重力
    mario.value.vy += GRAVITY;
    
    // 更新位置
    mario.value.x += mario.value.vx;
    mario.value.y += mario.value.vy;
    
    // 碰撞检测 - 垂直
    mario.value.onGround = false;
    for (const block of level.value) {
      const blockX = block.x;
      const blockY = block.y;
      const blockWidth = block.width || TILE_SIZE;
      const blockHeight = block.height || TILE_SIZE;
      
      if (checkCollision(mario.value, { x: blockX, y: blockY, width: blockWidth, height: blockHeight })) {
        // 从上方碰撞
        if (mario.value.vy > 0 && mario.value.y < blockY) {
          mario.value.y = blockY - mario.value.height;
          mario.value.vy = 0;
          mario.value.onGround = true;
        }
        // 从下方碰撞
        else if (mario.value.vy < 0 && mario.value.y > blockY) {
          mario.value.y = blockY + blockHeight;
          mario.value.vy = 0;
        }
      }
    }
    
    // 碰撞检测 - 水平
    for (const block of level.value) {
      const blockX = block.x;
      const blockY = block.y;
      const blockWidth = block.width || TILE_SIZE;
      const blockHeight = block.height || TILE_SIZE;
      
      if (checkCollision(mario.value, { x: blockX, y: blockY, width: blockWidth, height: blockHeight })) {
        if (mario.value.vx > 0) {
          mario.value.x = blockX - mario.value.width;
          mario.value.vx = 0;
        } else if (mario.value.vx < 0) {
          mario.value.x = blockX + blockWidth;
          mario.value.vx = 0;
        }
      }
    }
    
    // 防止掉出屏幕底部
    if (mario.value.y > SCREEN_HEIGHT) {
      lives.value--;
      if (lives.value <= 0) {
        gameOver.value = true;
      } else {
        mario.value.x = 50;
        mario.value.y = 180;
        mario.value.vx = 0;
        mario.value.vy = 0;
      }
    }
    
    // 更新相机
    if (mario.value.x > SCREEN_WIDTH / 2) {
      cameraX.value = mario.value.x - SCREEN_WIDTH / 2;
    }
    
    // 检查胜利
    checkWin();
    
    // 更新敌人
    for (const enemy of enemies.value) {
      if (enemy.dead) {
        enemy.deadTimer++;
        if (enemy.deadTimer > 30) {
          enemy.y += 5;
        }
        continue;
      }
      
      enemy.vy += GRAVITY;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      
      // 敌人碰撞检测
      enemy.onGround = false;
      for (const block of level.value) {
        const blockX = block.x;
        const blockY = block.y;
        const blockWidth = block.width || TILE_SIZE;
        const blockHeight = block.height || TILE_SIZE;
        
        if (checkCollision(enemy, { x: blockX, y: blockY, width: blockWidth, height: blockHeight })) {
          if (enemy.vy > 0 && enemy.y < blockY) {
            enemy.y = blockY - enemy.height;
            enemy.vy = 0;
            enemy.onGround = true;
          }
        }
      }
      
      // 敌人边界检测（掉头）
      if (enemy.onGround) {
        const checkX = enemy.vx > 0 ? enemy.x + enemy.width + 1 : enemy.x - 1;
        const checkY = enemy.y + enemy.height;
        const blockAhead = getBlockAt(checkX, checkY);
        const blockBelow = getBlockAt(enemy.x + enemy.width / 2, enemy.y + enemy.height + 1);
        
        // 如果前方没有地面或遇到障碍物，掉头
        if (!blockBelow || (blockAhead && blockAhead.type !== 'ground')) {
          enemy.vx *= -1;
        }
      }
      
      // 防止掉出屏幕
      if (enemy.x < cameraX.value - 100) {
        enemy.x = cameraX.value + SCREEN_WIDTH + 50;
      }
      
      // 马里奥与敌人碰撞
      if (checkCollision(mario.value, enemy)) {
        if (mario.value.vy > 0 && mario.value.y < enemy.y) {
          // 踩死敌人
          enemy.dead = true;
          enemy.deadTimer = 0;
          mario.value.vy = -6;
          score.value += 100;
        } else {
          // 被敌人碰到
          lives.value--;
          if (lives.value <= 0) {
            gameOver.value = true;
          } else {
            mario.value.x = 50;
            mario.value.y = 180;
            mario.value.vx = 0;
            mario.value.vy = 0;
            cameraX.value = 0;
          }
        }
      }
    }
    
    // 更新动画
    if (Math.abs(mario.value.vx) > 0.1) {
      mario.value.animTimer++;
      if (mario.value.animTimer > 8) {
        mario.value.animFrame = (mario.value.animFrame + 1) % 3;
        mario.value.animTimer = 0;
      }
    } else {
      mario.value.animFrame = 0;
    }
  }
  
  // 绘制关卡
  ctx.save();
  ctx.translate(-cameraX.value, 0);
  
  for (const block of level.value) {
    const blockX = block.x;
    const blockY = block.y;
    const blockWidth = block.width || TILE_SIZE;
    const blockHeight = block.height || TILE_SIZE;
    
    // 只绘制可见的方块
    if (blockX + blockWidth > cameraX.value - 50 && blockX < cameraX.value + SCREEN_WIDTH + 50) {
      drawBlock(ctx, blockX, blockY, block.type);
    }
  }
  
  // 绘制敌人
  for (const enemy of enemies.value) {
    if (enemy.x > cameraX.value - 50 && enemy.x < cameraX.value + SCREEN_WIDTH + 50) {
      if (enemy.dead) {
        ctx.save();
        ctx.scale(1, -0.3);
        drawGoomba(ctx, enemy.x, -enemy.y);
        ctx.restore();
      } else {
        drawGoomba(ctx, enemy.x, enemy.y);
      }
    }
  }
  
  // 绘制马里奥
  const marioScreenX = mario.value.x;
  if (marioScreenX > cameraX.value - 50 && marioScreenX < cameraX.value + SCREEN_WIDTH + 50) {
    drawMario(ctx, marioScreenX, mario.value.y, mario.value.facingRight, mario.value.animFrame, mario.value.onGround);
  }
  
  ctx.restore();
  
  // 绘制UI
  ctx.fillStyle = '#000';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`得分: ${score.value}`, 10, 25);
  ctx.fillText(`生命: ${lives.value}`, 10, 45);
  ctx.fillText(`时间: ${timeLeft.value}`, 10, 65);
  
  if (!gameStarted.value) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('按空格键开始', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    ctx.font = '16px monospace';
    ctx.fillText('方向键移动，空格跳跃', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
  }
  
  if (gameOver.value) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    if (mario.value.x >= 3100) {
      ctx.fillText('恭喜通关！', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
      ctx.font = '16px monospace';
      ctx.fillText(`最终得分: ${score.value}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
    } else {
      ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }
    ctx.font = '16px monospace';
    ctx.fillText('按R键重新开始', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 50);
  }
  
  frameId = requestAnimationFrame(gameLoop);
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'ArrowLeft' || event.key === 'ArrowLeft') {
    keys.value.left = true;
    event.preventDefault();
  }
  if (event.code === 'ArrowRight' || event.key === 'ArrowRight') {
    keys.value.right = true;
    event.preventDefault();
  }
  if (event.code === 'Space' || event.key === ' ') {
    keys.value.jump = true;
    event.preventDefault();
    if (!gameStarted.value) {
      gameStarted.value = true;
      timeInterval = performance.now();
    }
  }
  if ((event.code === 'KeyR' || event.key === 'r') && gameOver.value) {
    resetGame();
    event.preventDefault();
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.code === 'ArrowLeft' || event.key === 'ArrowLeft') {
    keys.value.left = false;
    event.preventDefault();
  }
  if (event.code === 'ArrowRight' || event.key === 'ArrowRight') {
    keys.value.right = false;
    event.preventDefault();
  }
  if (event.code === 'Space' || event.key === ' ') {
    keys.value.jump = false;
    event.preventDefault();
  }
};

// 重置游戏
const resetGame = () => {
  mario.value = {
    x: 50,
    y: 180,
    vx: 0,
    vy: 0,
    width: 16,
    height: 16,
    onGround: false,
    facingRight: true,
    animFrame: 0,
    animTimer: 0
  };
  cameraX.value = 0;
  gameStarted.value = false;
  gameOver.value = false;
  score.value = 0;
  lives.value = 3;
  timeLeft.value = 400;
  enemies.value = generateEnemies();
};

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = SCREEN_WIDTH;
    canvasRef.value.height = SCREEN_HEIGHT;
    lastTime = performance.now();
    frameId = requestAnimationFrame(gameLoop);
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  resetGame();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (frameId) {
    cancelAnimationFrame(frameId);
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<template>
  <div class="mario-game-container">
    <canvas
      ref="canvasRef"
      class="mario-canvas"
    />
    <div class="game-info">
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<style scoped>
.mario-game-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #5c94fc;
  font-family: monospace;
}

.mario-canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 2px solid #000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.game-info {
  margin-top: 10px;
  color: #fff;
  font-size: 14px;
}

.loading-text {
  text-align: center;
}
</style>