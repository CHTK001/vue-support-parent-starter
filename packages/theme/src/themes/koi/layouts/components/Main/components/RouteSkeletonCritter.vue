<template>
  <span ref="root" class="rs-critter" :class="`rs-critter--${animal}`" aria-hidden="true">
    <span class="rs-critter__body">
      <!-- 小熊猫：白身黑耳/黑眼圈，颜色写死而不是 currentColor —— 熊猫靠黑白对比辨认，
           反色会变成另一只动物；深色主题下白身也照样看得见 -->
      <svg v-if="animal === 'panda'" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffffff" stroke="rgba(15, 23, 42, 0.3)" stroke-width="1">
          <ellipse cx="16" cy="21" rx="9" ry="8.2" />
          <circle cx="16" cy="11.6" r="8" />
          <ellipse cx="12" cy="28.4" rx="3.1" ry="2.2" />
          <ellipse cx="20" cy="28.4" rx="3.1" ry="2.2" />
        </g>
        <g fill="#1f2328">
          <circle cx="9.6" cy="5.6" r="3.1" />
          <circle cx="22.4" cy="5.6" r="3.1" />
          <ellipse cx="12.4" cy="11.4" rx="2.4" ry="3" transform="rotate(-20 12.4 11.4)" />
          <ellipse cx="19.6" cy="11.4" rx="2.4" ry="3" transform="rotate(20 19.6 11.4)" />
          <ellipse cx="16" cy="15.2" rx="1.2" ry="0.9" />
          <ellipse cx="8.2" cy="20.4" rx="2.4" ry="3.2" transform="rotate(24 8.2 20.4)" />
          <ellipse cx="23.8" cy="20.4" rx="2.4" ry="3.2" transform="rotate(-24 23.8 20.4)" />
        </g>
        <g fill="#ffffff">
          <circle cx="12.8" cy="11" r="0.95" />
          <circle cx="19.2" cy="11" r="0.95" />
        </g>
      </svg>

      <!-- 小鸟（默认）：纯色剪影，跟随主题文字色 -->
      <svg v-else viewBox="0 0 32 30" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M10.4 16.2 1.6 11.4l2.6 9.2 6.2-4.4Z" />
        <ellipse cx="17.2" cy="18.2" rx="8.6" ry="7.2" />
        <circle cx="22.8" cy="10.4" r="5.4" />
        <path d="M27.4 10.2 32 8.8l-4.2 4.2-.4-2.8Z" />
        <path class="rs-critter__wing" d="M12.6 15.4c3.2-3.4 7.4-3.6 10.4-.4-3.3 3.6-7.4 3.6-10.4.4Z" />
        <circle class="rs-critter__eye" cx="24.4" cy="9.2" r="1.15" />
        <path
          d="M14.6 25v3M20 25v3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * RouteSkeletonCritter —— 路由骨架屏上随机移动的小动物
 *
 * <p><b>可配置</b>：{@code animal} 选形象，{@code motion} 选动作（不传则按形象推导：
 * 小鸟 = hop 抛物线跳；小熊猫 = climb 上下爬）。新增动物只要加一个 SVG 和一条动作分支。</p>
 *
 * <p><b>落脚点</b>：骨架里的每一根「骨头」（{@code .rs-bone}，即加载条）都是栖木。
 * hop 随机换一根跳过去（含纵向）；climb 只挑纵向最近的一两根，沿骨头爬上去/爬下来，
 * 不跳、不起弧、也不扬尘。</p>
 *
 * <p><b>为什么用 Web Animations API</b>：落点每次都不同，距离、高度、时长要按两点算；
 * WAAPI 可以把每次移动写成一次性 transform 动画，落点写回内联样式，只走合成层。
 * 动画结束即 cancel，不在元素上累积 Animation。</p>
 *
 * <p><b>停表条件</b>：页签隐藏（document.hidden）与 prefers-reduced-motion 都不动；
 * 骨架尺寸变化（ResizeObserver）重新落位；卸载清定时器/动画/监听。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({ name: "RouteSkeletonCritter" });

/** 栖木选择器：骨架里所有加载条 */
const PERCH_SELECTOR = ".rs-bone";

const props = withDefaults(
  defineProps<{
    /** 形象：小鸟（跳） / 小熊猫（爬） */
    animal?: "bird" | "panda";
    /** 动作：hop=抛物线跳；climb=上下爬。不传按形象推导 */
    motion?: "hop" | "climb";
    /** 加载结束：停止跳动并播离场动画（鸟飞出屏幕 / 熊猫溜走） */
    leaving?: boolean;
  }>(),
  { animal: "bird", motion: undefined, leaving: false },
);

/** 实际动作：显式 motion 优先，否则 bird→hop / panda→climb */
const mode = computed<"hop" | "climb">(
  () => props.motion ?? (props.animal === "panda" ? "climb" : "hop"),
);

const root = ref<HTMLElement | null>(null);

/** 下一次移动的定时器；null 表示没排 */
let timer: ReturnType<typeof setTimeout> | null = null;
/** 正在跑的动画：骨架尺寸一变就要 cancel，否则它会飞向旧的像素坐标 */
let flying: Animation | null = null;
/** 当前落点（px，相对骨架容器左上角） */
let pos = { x: 0, y: 0 };
/** 朝向：1 朝右 / -1 朝左，用于 scaleX 翻转 */
let facing: 1 | -1 = 1;
/** 上一次站的骨头：下一次优先换一根，避免原地反复横跳 */
let lastPerch: HTMLElement | null = null;
/** 连续移动了几次：连续一阵后歇久一点，节奏才像活物 */
let movesInARow = 0;
/** 系统是否要求减少动态效果 */
let motionOff = false;
/** 组件是否还挂着：卸载后 onfinish 仍可能回调，必须拦住 */
let alive = true;
/** 是否已进入离场：进入后不再排新的跳动 */
let exiting = false;

/** 骨架尺寸变化监听：换页时卡片高度、宽度都可能变，骨头坐标跟着变 */
let resizeObserver: ResizeObserver | null = null;
/** ResizeObserver 挂上时会立刻回调一次，第一次要跳过 */
let resizeFirst = true;
/** 系统的「减少动态效果」媒体查询：用户中途改设置也要跟着停/开 */
let motionQuery: MediaQueryList | null = null;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

/** 排下一次移动：间隔随机；25% 概率接一个连动。爬比跳慢 */
function schedule(delay?: number) {
  clearTimer();
  if (!alive || exiting || motionOff || document.hidden) return;
  const base =
    delay ??
    (mode.value === "climb" ? rand(520, 1300) : rand(220, 760));
  timer = setTimeout(move, base);
}

/** 转身：只改 CSS 变量，避免和 WAAPI 写的 transform 抢同一个属性 */
function faceTo(dir: 1 | -1) {
  if (dir === facing) return;
  facing = dir;
  root.value?.style.setProperty("--rs-facing", String(dir));
}

/** 落地受击：身体压一下再弹回，160ms 结束（只有跳会用到） */
function squash(el: HTMLElement) {
  const body = el.firstElementChild as HTMLElement | null;
  body?.animate(
    [
      { transform: `scaleX(${facing}) scaleY(1)` },
      { transform: `scaleX(${facing}) scaleY(0.86)` },
      { transform: `scaleX(${facing}) scaleY(1)` },
    ],
    { duration: 160, easing: "ease-out" },
  );
}

/** 落地小尘土：一个点从脚下扩散淡出（260ms），用完即删（只有跳会扬尘） */
function puff(el: HTMLElement, container: HTMLElement, x: number, y: number) {
  const dot = document.createElement("span");
  dot.className = "rs-critter__dust";
  const base = `translate(${x + el.offsetWidth / 2 - 3}px, ${y + el.offsetHeight - 3}px)`;
  dot.style.transform = base;
  container.appendChild(dot);

  const anim = dot.animate(
    [
      { transform: `${base} scale(0.4)`, opacity: "0.45" },
      { transform: `${base} scale(1.9)`, opacity: "0" },
    ],
    { duration: 260, easing: "ease-out" },
  );
  anim.onfinish = () => dot.remove();
}

/** 收集可站的骨头（太窄的站不稳，比如分页按钮 32px，直接跳过） */
function collectPerches(el: HTMLElement, container: HTMLElement) {
  const base = container.getBoundingClientRect();
  const w = el.offsetWidth;
  return [...container.querySelectorAll<HTMLElement>(PERCH_SELECTOR)]
    .filter((node) => node.offsetParent !== null)
    .map((node) => {
      const r = node.getBoundingClientRect();
      return { node, left: r.left - base.left, top: r.top - base.top, width: r.width };
    })
    .filter((p) => p.width >= w + 10);
}

type Perch = ReturnType<typeof collectPerches>[number];

/** 在骨头上随机取一个落点：脚踩骨头顶边 */
function pointOn(el: HTMLElement, perch: Perch) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return {
    x: rand(perch.left + 2, Math.max(perch.left + 2, perch.left + perch.width - w - 2)),
    // 贴着容器顶边的骨头也不许把身体顶出骨架（否则会压到上面的页签）
    y: Math.max(2, perch.top - h),
  };
}

/**
 * pickPerch —— 按动作挑下一根栖木
 *  - hop：随机换一根（避开当前这根），可以上下左右乱跳
 *  - climb：只挑纵向最近的两三根，沿骨头爬上/爬下，不做大跨度的"飞"
 */
function pickPerch(el: HTMLElement, container: HTMLElement, fromY: number) {
  const list = collectPerches(el, container);
  if (!list.length) return null;

  if (mode.value === "climb") {
    const feet = fromY + el.offsetHeight;
    const candidates = list
      .filter((p) => Math.abs(p.top - feet) > 6)
      .sort((a, b) => Math.abs(a.top - feet) - Math.abs(b.top - feet))
      .slice(0, 3);
    if (!candidates.length) return null;
    const perch = candidates[Math.floor(Math.random() * candidates.length)];
    lastPerch = perch.node;

    // 爬：尽量沿同一列上下，只做小幅横移（左右各 24px），看起来才像顺着架子爬
    const w = el.offsetWidth;
    const minX = perch.left + 2;
    const maxX = Math.max(minX, perch.left + perch.width - w - 2);
    return {
      x: Math.min(Math.max(pos.x + rand(-24, 24), minX), maxX),
      y: Math.max(2, perch.top - el.offsetHeight),
    };
  }

  const pool = list.length > 1 ? list.filter((p) => p.node !== lastPerch) : list;
  const perch = pool[Math.floor(Math.random() * pool.length)] ?? list[0];
  lastPerch = perch.node;
  return pointOn(el, perch);
}

/** 立刻落到某根骨头上（不做动画）：用于初始定位、尺寸变化、动画偏好切换 */
function settleOnPerch() {
  const el = root.value;
  const container = el?.parentElement;
  if (!el || !container) return;
  const perch = pickPerch(el, container, pos.y);
  if (!perch) return;
  pos = perch;
  el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

/** 一次移动：hop 走抛物线、climb 走带摆动的直线；落点写回内联 transform */
function move() {
  if (!alive || exiting) return;
  const el = root.value;
  const container = el?.parentElement;
  if (!el || !container) return schedule();

  const target = pickPerch(el, container, pos.y);
  if (!target) return schedule();

  const from = { ...pos };
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return schedule(rand(180, 320));

  faceTo(dx >= 0 ? 1 : -1);
  pos = target;

  const climbing = mode.value === "climb";
  let keyframes: Keyframe[];
  let duration: number;
  let easing: string;

  if (climbing) {
    // 爬：不抬弧，沿着两点的直线走，身体左右摆一下 = 四肢交替
    const wobble = 3;
    duration = Math.round(480 + Math.min(dist * 2.4, 460));
    easing = "ease-in-out";
    keyframes = [
      { transform: `translate(${from.x}px, ${from.y}px) rotate(0deg)`, offset: 0 },
      {
        transform: `translate(${from.x + dx * 0.35}px, ${from.y + dy * 0.3}px) rotate(${wobble}deg)`,
        offset: 0.32,
      },
      {
        transform: `translate(${from.x + dx * 0.7}px, ${from.y + dy * 0.7}px) rotate(${-wobble}deg)`,
        offset: 0.68,
      },
      { transform: `translate(${target.x}px, ${target.y}px) rotate(0deg)`, offset: 1 },
    ];
  } else {
    // 跳：抛物线 + 起跳侧倾
    const topY = Math.min(from.y, target.y);
    const arc = Math.max(4, Math.min(30, 10 + dist * 0.12, topY + 6));
    const tilt = dx >= 0 ? 6 : -6;
    duration = Math.round(300 + Math.min(dist * 0.9, 360));
    easing = "cubic-bezier(.34,.15,.56,1)";
    keyframes = [
      { transform: `translate(${from.x}px, ${from.y}px) rotate(0deg)`, offset: 0 },
      {
        transform: `translate(${(from.x + target.x) / 2}px, ${Math.min(from.y, target.y) - arc}px) rotate(${tilt}deg)`,
        offset: 0.5,
      },
      { transform: `translate(${target.x}px, ${target.y}px) rotate(0deg)`, offset: 1 },
    ];
  }

  const anim = el.animate(keyframes, { duration, easing });
  flying = anim;

  anim.onfinish = () => {
    if (!alive) return;
    // 先落到最终位移，再撤销动画：顺序反了会看到一帧回弹
    el.style.transform = `translate(${target.x}px, ${target.y}px)`;
    anim.cancel();
    flying = null;

    if (!climbing) {
      squash(el);
      puff(el, container, target.x, target.y);
    }

    // 节奏：25% 连动；连动一阵（8 次）后歇久一点，别像打点器
    movesInARow += 1;
    if (movesInARow >= 8) {
      movesInARow = 0;
      schedule(rand(1200, 2400));
    } else {
      schedule(
        Math.random() < 0.25
          ? rand(90, 190)
          : climbing
            ? rand(520, 1300)
            : rand(220, 760),
      );
    }
  };
}

/** 当前视觉位置（可能正在空中）：以 rect 为准，避免从"上一次落点"起跳造成瞬移 */
function currentXY(el: HTMLElement, container: HTMLElement) {
  const base = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - base.left, y: r.top - base.top, base };
}

/** 小鸟离场：从当前位置起飞，斜着飞出屏幕顶部 */
function exitBird(el: HTMLElement, start: { x: number; y: number; base: DOMRect }) {
  const dir: 1 | -1 = start.x > start.base.width / 2 ? 1 : -1;
  faceTo(dir);
  const dx = dir * (200 + Math.random() * 120);
  const outY = -(start.base.top + el.offsetHeight + 80);
  const anim = el.animate(
    [
      { transform: `translate(${start.x}px, ${start.y}px) rotate(0deg)`, opacity: 1, offset: 0 },
      { transform: `translate(${start.x}px, ${start.y - 10}px) rotate(0deg)`, opacity: 1, offset: 0.12 },
      {
        transform: `translate(${start.x + dx * 0.5}px, ${start.y - 120}px) rotate(${dir * 7}deg)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${start.x + dx}px, ${outY}px) rotate(${dir * 12}deg)`,
        opacity: 0.9,
        offset: 1,
      },
    ],
    { duration: 620, easing: "cubic-bezier(.3,.08,.6,1)", fill: "forwards" },
  );
  // forwards 之外再落一次内联样式：动画对象被回收/取消时位置也不会弹回去
  anim.onfinish = () => {
    el.style.transform = `translate(${start.x + dx}px, ${outY}px) rotate(${dir * 12}deg)`;
    el.style.opacity = "0.9";
  };
}

/** 熊猫离场：顺着当前这根骨头滑到地面，再从右侧哒哒哒跑出屏幕 */
function exitPanda(el: HTMLElement, start: { x: number; y: number; base: DOMRect }) {
  faceTo(1);
  const ground = Math.max(0, start.base.height - el.offsetHeight);
  const outX = window.innerWidth - start.base.left + 100;
  const drop = el.animate(
    [
      { transform: `translate(${start.x}px, ${start.y}px)`, opacity: 1 },
      { transform: `translate(${start.x}px, ${ground}px)`, opacity: 1 },
    ],
    { duration: 260, easing: "cubic-bezier(.45,0,.9,1)" },
  );
  drop.onfinish = () => {
    if (!alive) return;
    const span = outX - start.x;
    const run = el.animate(
      [
        { transform: `translate(${start.x}px, ${ground}px) rotate(0deg)`, opacity: 1, offset: 0 },
        {
          transform: `translate(${start.x + span * 0.35}px, ${ground - 3}px) rotate(-5deg)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(${start.x + span * 0.7}px, ${ground}px) rotate(5deg)`,
          opacity: 1,
          offset: 0.7,
        },
        { transform: `translate(${outX}px, ${ground}px) rotate(0deg)`, opacity: 0.85, offset: 1 },
      ],
      { duration: 440, easing: "linear", fill: "forwards" },
    );
    run.onfinish = () => {
      el.style.transform = `translate(${outX}px, ${ground}px)`;
      el.style.opacity = "0";
    };
  };
}

/** 进入离场：停表 → 取当前视觉位置 → 按形象播对应动画；reduce-motion 只淡出 */
function startExit() {
  if (exiting) return;
  exiting = true;
  clearTimer();
  const el = root.value;
  const container = el?.parentElement;
  if (!el || !container) return;

  const start = currentXY(el, container);
  flying?.cancel();
  flying = null;

  if (motionOff) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "linear", fill: "forwards" });
    return;
  }
  if (mode.value === "climb") exitPanda(el, start);
  else exitBird(el, start);
}

watch(
  () => props.leaving,
  (v) => {
    if (v) startExit();
  },
);

function onVisibility() {
  if (document.hidden) {
    clearTimer();
  } else {
    movesInARow = 0;
    schedule(rand(180, 520));
  }
}

/** 骨架尺寸变了（换页时卡片高度/宽度不同）：取消在跑的动画，直接落到一根新骨头上 */
function onResize() {
  if (resizeFirst) {
    resizeFirst = false;
    return;
  }
  if (!alive) return;
  clearTimer();
  flying?.cancel();
  flying = null;
  settleOnPerch();
  schedule(rand(200, 480));
}

/** 系统「减少动态效果」中途变化：关掉就停表并落稳，打开就重新开始 */
function onMotionPref(e: MediaQueryListEvent) {
  motionOff = e.matches;
  if (motionOff) {
    clearTimer();
    flying?.cancel();
    flying = null;
    settleOnPerch();
  } else {
    movesInARow = 0;
    schedule(rand(150, 400));
  }
}

onMounted(() => {
  const el = root.value;
  const container = el?.parentElement;
  if (!el || !container) return;

  settleOnPerch();

  motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
  motionOff = motionQuery?.matches ?? false;
  motionQuery?.addEventListener?.("change", onMotionPref);

  // 骨头坐标是像素值：容器一变就要重新落位，否则会悬在半空
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
  }

  if (motionOff) return;

  document.addEventListener("visibilitychange", onVisibility);
  // 路由骨架常常只活一两百毫秒：挂载就开始动，保证"看到它时它就在动"
  move();
});

onBeforeUnmount(() => {
  alive = false;
  clearTimer();
  flying?.cancel();
  flying = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  motionQuery?.removeEventListener?.("change", onMotionPref);
  motionQuery = null;
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<style lang="scss" scoped>
.rs-critter {
  /* 绝对定位写在组件里：父级只需 position: relative/absolute，组件自己浮在骨头之上 */
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: block;
  width: 26px;
  height: 24px;
  pointer-events: none;
  will-change: transform;
  color: var(--el-text-color-primary);
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 18%));

  html.dark & {
    filter: drop-shadow(0 1px 1px rgb(0 0 0 / 45%));
  }
}

/* 小熊猫细节多：给大一点，黑白块才分得清 */
.rs-critter--panda {
  width: 30px;
  height: 28px;
}

.rs-critter__body {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 50% 100%;
  /* 站立时的呼吸：与落地的 squash 共用 transform，WAAPI 运行的那 160ms 会盖住它。
     flip 在 keyframes 里一起写，否则动画会把 --rs-facing 的翻转覆盖掉。 */
  animation: rs-critter-breathe 2.4s ease-in-out infinite;
}

@keyframes rs-critter-breathe {
  0%,
  100% {
    transform: scaleX(var(--rs-facing, 1)) translateY(0) scaleY(1);
  }
  50% {
    transform: scaleX(var(--rs-facing, 1)) translateY(-1px) scaleY(0.965);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rs-critter__body {
    animation: none;
    transform: scaleX(var(--rs-facing, 1));
  }
}

svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 翅与眼用底色挖出来：纯色剪影里它们才是可辨认的细节 */
.rs-critter__wing,
.rs-critter__eye {
  fill: var(--el-bg-color, #fff);
}

/* 落地尘土：绝对定位、不参与排版，动画结束即被移除 */
.rs-critter__dust {
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  pointer-events: none;
  will-change: transform, opacity;
}
</style>
