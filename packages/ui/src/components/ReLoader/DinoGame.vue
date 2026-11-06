<template>
  <!--
    像素恐龙小游戏。

    <p>两种模式：</p>
    <ul>
      <li>{@code play}：应用内加载遮罩里真正可玩 —— 空格 / ↑ / W 起跳，撞到仙人掌结束，可重开；</li>
      <li>{@code demo}：设置面板的卡片预览 —— 同一个组件自动跳、自动重开，看到的就是实物。</li>
    </ul>

    <p>结构与配色沿用 {@code animations.ts} 里的 {@code .sla-dino__*}（em 单位、--sla-s 定尺寸），
    这里只额外加 {@code .sla-dino--game} 关掉那套纯 CSS 自走动画，改由游戏循环用内联
    transform / left 驱动 —— 首屏 loader.js 仍是纯 CSS 自动跑，不加载本组件。</p>
  -->
  <div
    class="sla sla-dino sla-dino--game"
    :class="{ 'is-idle': state !== 'running', 'is-over': state === 'over' }"
    :data-state="state"
    :data-score="displayScore"
    @click="onPress"
  >
    <div class="sla-dino__scene">
      <div class="sla-dino__ground"></div>

      <div
        class="sla-dino__runner"
        :style="{ transform: `translateY(-${jump.toFixed(3)}em)` }"
      >
        <span class="sla-dino__body"></span>
        <span class="sla-dino__head"></span>
        <span class="sla-dino__tail"></span>
        <span class="sla-dino__leg sla-dino__leg--front"></span>
        <span class="sla-dino__leg sla-dino__leg--back"></span>
      </div>

      <div
        v-for="obstacle in obstacles"
        :key="obstacle.id"
        class="sla-dino__cactus"
        :style="{ left: `${obstacle.left.toFixed(3)}em` }"
      >
        <span class="sla-dino__branch sla-dino__branch--left"></span>
        <span class="sla-dino__branch sla-dino__branch--right"></span>
      </div>

      <span class="sla-dino__score">{{ displayScore }}</span>

      <span v-if="mode === 'play' && state === 'ready'" class="sla-dino__hint">空格开始</span>

      <div v-if="mode === 'play' && state === 'over'" class="sla-dino__over">
        <span class="sla-dino__over-text">游戏结束</span>
        <span class="sla-dino__over-score">得分 {{ displayScore }}</span>
        <button type="button" class="sla-dino__restart" @click.stop="restart">再来一局</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 像素恐龙小游戏（ReLoader 的 dino 变体）。
 *
 * <p>坐标全部是 em：{@code --sla-s} 表示场景高度，1em = 高度 / 8.8，
 * 与 CSS 里的 {@code .sla-dino} 完全同一套口径，所以 56px 的卡片预览和
 * 96px 的应用内遮罩是同一个游戏，不需要两套参数。</p>
 *
 * <p>为什么自己做 rAF 循环而不是继续用 CSS 关键帧：碰撞、计分、重开都需要
 * 「当前在哪一帧」的状态，CSS 动画拿不到。物理量用 em/s，与尺寸无关。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    /** play：可玩；demo：自动演示（设置面板预览） */
    mode?: "play" | "demo";
    /** 速度倍率（与主题配置的 --sla-rate 同一口径，1 = 原速） */
    rate?: number;
  }>(),
  { mode: "play", rate: 1 },
);

/* ------------------------------------------------------------------ *
 * 场景几何（单位：em，与 .sla-dino 的 em 坐标一致）
 * ------------------------------------------------------------------ */
/** 场景宽：容器是 2.5 倍高度，而高度 = 8.8em */
const SCENE_W = 22;
const RUNNER_LEFT = 2.6;
const RUNNER_W = 4.8;
const CACTUS_W = 1.4;
/** 重力与起跳速度（em/s、em/s²）：峰值约 2.76em，滞空约 0.6s */
const GRAVITY = 62;
const JUMP_SPEED = 18.5;
/** 高于这个高度就能跨过仙人掌（仙人掌 3em，恐龙脚底在 1.7em） */
const CLEAR_HEIGHT = 2.1;
/** 基础前进速度（em/s），随积分缓慢加快 */
const BASE_SPEED = 8;
const MAX_SPEED = 15;

type GameState = "ready" | "running" | "over";

interface Obstacle {
  id: number;
  /** 左边缘位置（em） */
  left: number;
}

const state = ref<GameState>("ready");
const score = ref(0);
/** 腾空高度（em，向上为正） */
const jump = ref(0);
const obstacles = ref<Obstacle[]>([]);
const displayScore = computed(() => Math.floor(score.value));

/** 起跳初速（em/s）；落地后归零 */
let velocity = 0;
/** 当前前进速度（em/s），含速度倍率 */
let speed = BASE_SPEED;
/** 距离下一次生成还有多久（秒） */
let spawnIn = 0;
/** demo 模式撞车后等多久自动重开（秒） */
let restartIn = 0;
let obstacleSeq = 0;
let raf = 0;
let lastFrame = 0;
/** 按键后短时间内忽略重复触发（按住空格不会连跳） */
let lastPress = 0;

function rate(): number {
  const r = Number(props.rate);
  return Number.isFinite(r) && r > 0 ? r : 1;
}

function reset(): void {
  state.value = "ready";
  score.value = 0;
  jump.value = 0;
  obstacles.value = [];
  velocity = 0;
  speed = BASE_SPEED;
  spawnIn = 0;
  restartIn = 0;
}

function start(): void {
  reset();
  state.value = "running";
  spawnIn = (9 + Math.random() * 4) / (BASE_SPEED * rate());
}

function jumpNow(): void {
  // 已在地面才允许起跳；空中再按无效（也避免连跳穿模）
  if (state.value !== "running" || jump.value > 0.01) return;
  velocity = JUMP_SPEED;
}

function restart(): void {
  start();
  jumpNow();
}

/** 空格 / ↑ / W / 点击 / 重开按钮都走这里 */
function onPress(): void {
  if (props.mode !== "play") return;
  const now = Date.now();
  if (now - lastPress < 90) return;
  lastPress = now;

  if (state.value === "over") {
    restart();
    return;
  }
  if (state.value === "ready") {
    start();
    jumpNow();
    return;
  }
  jumpNow();
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

function onKeydown(event: KeyboardEvent): void {
  if (props.mode !== "play") return;
  if (event.key !== " " && event.key !== "ArrowUp" && event.key.toLowerCase() !== "w") return;
  // 在输入框里打字时不要劫持空格
  if (isEditable(event.target)) return;
  event.preventDefault();
  onPress();
}

/* ------------------------------------------------------------------ *
 * 游戏循环
 * ------------------------------------------------------------------ */
function spawn(): void {
  obstacles.value.push({ id: ++obstacleSeq, left: SCENE_W });
  // 间距按当前速度折算成「秒」：速度越快，留给玩家的反应时间不变
  const gap = 9 + Math.random() * 4;
  spawnIn = gap / speed;
}

function step(dt: number): void {
  // demo：站着就开始，撞了自动重开 —— 卡片里永远有动静
  if (props.mode === "demo") {
    if (state.value === "ready") start();
    if (state.value === "over") {
      restartIn -= dt;
      if (restartIn <= 0) start();
    }
  }

  if (state.value !== "running") return;

  score.value += dt * 10;
  speed = Math.min(MAX_SPEED, BASE_SPEED + score.value / 45) * rate();

  // 跳跃物理：先加位移再扣速度，落地时对齐到 0，避免负数抖动
  if (jump.value > 0 || velocity > 0) {
    jump.value += velocity * dt;
    velocity -= GRAVITY * rate() * dt;
    if (jump.value <= 0) {
      jump.value = 0;
      velocity = 0;
    }
  }

  spawnIn -= dt;
  if (spawnIn <= 0) spawn();

  for (const obstacle of obstacles.value) obstacle.left -= speed * dt;
  obstacles.value = obstacles.value.filter((o) => o.left > -CACTUS_W);

  // demo 自动起跳：障碍进入「起跳区」就跳，看起来和真人操作一样
  if (props.mode === "demo") {
    const nearest = obstacles.value.reduce<Obstacle | null>(
      (acc, o) => (acc === null || o.left < acc.left ? o : acc),
      null,
    );
    if (nearest && nearest.left < 8.4 && jump.value <= 0.01) jumpNow();
  }

  // 碰撞：横向重叠 + 没跳够高
  const runnerLeft = RUNNER_LEFT + 0.45;
  const runnerRight = RUNNER_LEFT + RUNNER_W - 0.55;
  const hit = obstacles.value.some(
    (o) => o.left + CACTUS_W > runnerLeft && o.left < runnerRight && jump.value < CLEAR_HEIGHT,
  );
  if (hit) {
    state.value = "over";
    velocity = 0;
    if (props.mode === "demo") restartIn = 1.1;
  }
}

function tick(now: number): void {
  raf = requestAnimationFrame(tick);
  if (document.hidden) {
    // 页面不可见时不要把后台时间算成一大步，回来从新的一帧开始
    lastFrame = 0;
    return;
  }
  if (!lastFrame) {
    lastFrame = now;
    return;
  }
  // 单帧最多按 50ms 算：切回标签页时不会瞬移穿模
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  step(dt);
}

onMounted(() => {
  if (props.mode === "demo") start();
  window.addEventListener("keydown", onKeydown);
  raf = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  cancelAnimationFrame(raf);
});
</script>

<style scoped>
/*
  游戏模式的覆盖：共享 CSS 把恐龙做成「纯 CSS 自走」，这里关掉会与游戏状态打架的
  那几条关键帧（跳跃 / 仙人掌横移），其余（腿、地面）保留，画面继续有速度感。
*/
.sla-dino--game .sla-dino__runner {
  animation: none;
  will-change: transform;
}

.sla-dino--game .sla-dino__cactus {
  right: auto;
  animation: none;
}

/* 还没开始 / 已经结束时，腿和地面停住：站着不动才读得出「等你操作」 */
.sla-dino--game.is-idle .sla-dino__leg,
.sla-dino--game.is-idle .sla-dino__ground {
  animation-play-state: paused;
}

.sla-dino__score {
  position: absolute;
  top: 0.25em;
  right: 0.5em;
  z-index: 2;

  /* 固定 px 而不是 em：56px 的预览里 em 会缩成 3px，数字完全读不出来 */
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: #52525b;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.sla-dino__hint {
  position: absolute;
  top: 0.3em;
  left: 0.5em;
  z-index: 2;
  font-size: 10px;
  line-height: 1;
  color: #a1a1aa;
}

.sla-dino__over {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: color-mix(in srgb, #f8fafc 82%, transparent);
  line-height: 1;
}

.sla-dino__over-text {
  font-size: 11px;
  font-weight: 700;
  color: #3f3f46;
}

.sla-dino__over-score {
  font-size: 10px;
  color: #71717a;
  font-variant-numeric: tabular-nums;
}

.sla-dino__restart {
  margin-top: 2px;
  padding: 1px 7px;
  font: inherit;
  font-size: 10px;
  color: #fff;
  cursor: pointer;
  background: var(--sla-c, #406eeb);
  border: 0;
  border-radius: 4px;
}
</style>
