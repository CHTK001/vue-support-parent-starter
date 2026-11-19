<template>
  <div class="pp">
    <div class="pp-inner">
      <!-- 起点旗（标题）+ 统计彩旗（绒线串），整个页面没有 header，
           品牌就是那面旗，弯杆挂在跑道起点 -->
      <div class="pp-top">
        <div class="pp-title-flag">
          <span class="pp-title-flag__pole" aria-hidden="true"></span>
          <div class="pp-title-flag__banner">
            <h1 class="pp-title">趣味学习</h1>
            <p class="pp-sub">
              {{ stageText }} · {{ overview?.student?.grade || "—" }}
              <span class="pp-sep">|</span>
              你好，{{ displayName }}
            </p>
          </div>
        </div>

        <div class="pp-bunting" aria-label="学习统计">
          <div class="pp-bflag pp-bflag--blue">
            <span class="pp-bflag__line">
              <span class="pp-bflag__ic"><ReIcon name="Reading" :size="15" aria-hidden="true" /></span>
              <span class="pp-bflag__val">{{ week?.studyCount ?? 0 }} 次</span>
            </span>
            <span class="pp-bflag__lbl">本周学习</span>
          </div>
          <div class="pp-bflag pp-bflag--gold">
            <span class="pp-bflag__line">
              <span class="pp-bflag__ic"><ReIcon name="Star" :size="15" aria-hidden="true" /></span>
              <span class="pp-bflag__val">{{ total?.stars ?? 0 }} 颗</span>
            </span>
            <span class="pp-bflag__lbl">星星奖励</span>
          </div>
          <div class="pp-bflag pp-bflag--green">
            <span class="pp-bflag__line">
              <span class="pp-bflag__ic"><ReIcon name="CircleCheck" :size="15" aria-hidden="true" /></span>
              <span class="pp-bflag__val">{{ streakDays }} 天</span>
            </span>
            <span class="pp-bflag__lbl">连续打卡</span>
          </div>
          <div class="pp-bflag pp-bflag--red">
            <span class="pp-bflag__line">
              <span class="pp-bflag__ic"><ReIcon name="Flag" :size="15" aria-hidden="true" /></span>
              <span class="pp-bflag__val">{{ masteredCount }}/{{ modules.length }}</span>
            </span>
            <span class="pp-bflag__lbl">已攻克</span>
          </div>
        </div>
      </div>

      <!-- 跑道：蛇形虚线贯穿整行，模块卡像补给站沿道错位铺开；
           🏃 小人按「已攻克模块数」站在跑道对应位置 -->
      <section class="pp-lane-zone" aria-label="功能模块">
        <svg class="pp-lane" viewBox="0 0 1200 64" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 32 C 100 16, 200 16, 300 32 S 500 48, 600 32 S 800 16, 900 32 S 1100 48, 1200 32" />
        </svg>
        <span class="pp-runner" :style="{ left: runnerLeft }" aria-hidden="true">🏃</span>
        <div class="pp-stops">
          <button
            v-for="(m, i) in modules"
            :key="m.moduleCode"
            type="button"
            class="pp-stop"
            :style="{ '--pp-i': i }"
            @click="emit('open', m.moduleCode)"
          >
            <span v-if="badgeOf(m) > 0" class="pp-badge">{{ badgeOf(m) }}</span>
            <span v-if="m.moduleCode === recommendCode" class="pp-rec">今日推荐</span>
            <span class="pp-stop__main">
              <span
                class="pp-stop__ic"
                :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
              >{{ m.icon }}</span>
              <span class="pp-stop__text">
                <span class="pp-stop__title">{{ m.title }}</span>
                <span class="pp-stop__sub">{{ m.subtitle }}</span>
              </span>
            </span>
            <!-- 真实进度：后端 edu_student_progress；无学习记录显示「未开始」 -->
            <span class="pp-stop__foot">
              <span class="pp-stop__track" aria-hidden="true">
                <span
                  class="pp-stop__fill"
                  :style="{ width: `${progOf(m).value}%`, background: `linear-gradient(90deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
                ></span>
              </span>
              <span class="pp-stop__pct" :class="{ 'is-none': !progOf(m).started }">
                {{ progOf(m).started ? `${progOf(m).value}%` : "未开始" }}
              </span>
            </span>
            <!-- 补给站定位桩：卡片「插」在跑道上的小圆点 -->
            <span
              class="pp-stop__dot"
              aria-hidden="true"
              :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
            ></span>
          </button>
        </div>
      </section>

      <!-- 终点线：原生 button，键盘 Tab 聚焦后 Enter/Space 可直接触发 -->
      <button type="button" class="pp-finish" @click="emit('open', '')">
        <span class="pp-finish__check" aria-hidden="true"></span>
        <span>查看更多功能</span>
        <span class="pp-finish__arrow" aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PrimaryHome —— 小学端首页（彩虹跑道 · PC/移动双端）
 *
 * 设计语言：整页是一条横贯的跑道。标题立在起点旗上（旗杆 + 三角旗 + 轻摆），
 * 四枚统计是挂在绒线串上的小彩旗（本周学习 / 星星 / 打卡 / 已攻克）；
 * 模块卡是沿蛇形虚线跑道错位铺开的补给站（3n+2 下沉一格形成蜿蜒路径），
 * 卡片底部的定位桩让它像是「插」在跑道上；一个 🏃 小人按「已攻克模块数」
 * 站在跑道对应位置；被后端推荐（overview.recommend）的补给站插「今日推荐」旗；
 * 终点是带方格旗的「查看更多功能」。
 *
 * 无 header：品牌 = 起点旗。颜色全部走 koi 变量（--el-* / --el-radius-* /
 * --el-transition-*），暗色模式由 html.dark 自动跟随；系统「减少动态效果」
 * 偏好下关闭全部动画（见样式底部 @media）。
 *
 * 统计口径全部来自后端真实数据（edu_student_daily / edu_student_progress /
 * overview.recommend / overview.wrongPending）：没有数据时显示 0 或「未开始」，
 * 不用假数字。错题本角标直接用后端 wrongPending（真实待复习数），
 * 其余模块的角标仍按「剩余进度」折算。
 */
import { computed } from "vue";
import type { PortalModule } from "./modules";
import { stageLabel } from "./modules";
import type { StudentOverview } from "../../api/types";

const props = defineProps<{
  overview: StudentOverview | null;
  modules: PortalModule[];
}>();

const emit = defineEmits<{ (e: "open", moduleCode: string): void }>();

const week = computed(() => props.overview?.week);
const total = computed(() => props.overview?.total);
const streakDays = computed(() => props.overview?.streakDays ?? 0);
const stageText = computed(() => stageLabel(props.overview?.stage));
const displayName = computed(() => props.overview?.student?.studentName || "同学");

/** 今日推荐模块编码：后端下发（overview.recommend），命中哪张补给站就给哪张插推荐旗 */
const recommendCode = computed(() => props.overview?.recommend ?? "");

/** 已攻克（进度 100）的模块数：跑道上的小人按它前进，彩旗串展示 x/总数 */
const masteredCount = computed(() => props.overview?.modulesMastered ?? 0);

/**
 * 小人在跑道上的位置：按已攻克模块数占本学段目录的比例，从起点跑到终点。
 * 用 clamp 兜住两端，避免 0% 时顶出起点、100% 时压住方格旗。
 */
const runnerLeft = computed(() => {
  const totalModules = props.modules.length || 1;
  const pct = Math.round((masteredCount.value / totalModules) * 100);
  return `clamp(2%, ${pct}%, 96%)`;
});

/**
 * 模块真实进度与是否有过学习记录。
 *
 * <p>后端 edu_student_progress 只返回「有记录」的模块；没有记录的模块进度未知，
 * 页面显示「未开始」，而不是用 0% 冒充真实进度。</p>
 *
 * @param m 模块
 * @returns value 进度 0-100；started 是否存在学习记录
 */
function progOf(m: PortalModule): { value: number; started: boolean } {
  const hit = (props.overview?.modules ?? []).find((r) => r.moduleCode === m.moduleCode);
  if (!hit) {
    return { value: 0, started: false };
  }
  return { value: Math.max(0, Math.min(100, hit.progress ?? 0)), started: true };
}

/**
 * 未完成角标。
 *
 * <p>错题本直接用后端的 {@link StudentOverview.wrongPending}（真实待复习错题数），
 * 不做任何折算；其余开启 badgeFromIncomplete 的模块，按该模块剩余进度折算成
 * 待完成项数量（学习数据里没有「待办条目数」，只有进度百分比；满分 100 时角标消失）。</p>
 *
 * <p>**查不到该模块的学习记录时返回 0（不显示角标）**，这是刻意改的：
 * 原实现在无记录时直接 `return 48`，等于凭空造一个数字印在卡片上 ——
 * 学生看到「48」会以为真有 48 个待办，而库里根本没有这个数。
 * 宁可什么都不显示，也不显示假数据。</p>
 *
 * @param m 模块
 * @returns 角标数字，0 表示不显示
 */
function badgeOf(m: PortalModule): number {
  // 错题本：后端有真实的待复习错题数，直接用，不做进度折算
  if (m.moduleCode === "wrongbook") {
    return props.overview?.wrongPending ?? 0;
  }
  if (!m.badgeFromIncomplete) {
    return 0;
  }
  const p = (props.overview?.modules ?? []).find((r) => r.moduleCode === m.moduleCode);
  // 没有该模块的学习记录 → 真实的待完成数未知 → 不显示，而不是编一个
  if (!p) {
    return 0;
  }
  return Math.max(0, 100 - (p.progress ?? 0));
}
</script>

<style scoped>
/*
 * koi 令牌口径（与 JuniorHome / SeniorHome / TeacherPortalView / StudentPortalView 完全一致）：
 *   品牌色带 = --el-color-primary → --el-color-primary-light-3
 *   页面底   = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字三级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器一律不加投影，投影只留给「悬浮浮起」与「键盘焦点环」两种反馈。
 */
.pp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  /* 跑道天空：亮蓝 → 浅蓝 → 页面底，整块是跑道场地的天空 */
  background: linear-gradient(
    180deg,
    var(--el-color-primary-light-8) 0%,
    var(--el-color-primary-light-9) 46%,
    var(--el-bg-color-page) 100%
  );
  /* 手机端刘海/手势条会压住内容，底部留出安全区 */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pp-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(20px, 3vw, 40px) clamp(16px, 3.2vw, 44px) clamp(18px, 2.4vw, 30px);
}

/* ============ 起点：标题旗 + 统计彩旗 ============ */
.pp-top {
  display: flex;
  align-items: flex-start;
  gap: clamp(16px, 2.4vw, 32px);
  flex-wrap: wrap;
}
.pp-title-flag {
  position: relative;
  padding-left: 22px;
}
/* 旗杆：金黄圆杆 + 顶端圆球 */
.pp-title-flag__pole {
  position: absolute;
  left: 2px;
  top: -12px;
  bottom: -12px;
  width: 9px;
  border-radius: var(--el-radius-full);
  background: linear-gradient(
    180deg,
    var(--el-color-warning),
    color-mix(in srgb, var(--el-color-warning) 52%, var(--el-color-black))
  );
}
.pp-title-flag__pole::after {
  content: "";
  position: absolute;
  left: 50%;
  top: -12px;
  transform: translateX(-50%);
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--el-color-warning);
}
/* 三角旗：右端收尖（clip-path），带轻摆动画 */
.pp-title-flag__banner {
  clip-path: polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%);
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: var(--el-color-white);
  padding: clamp(12px, 1.6vw, 18px) clamp(44px, 5.4vw, 62px) clamp(12px, 1.6vw, 18px) clamp(18px, 2.2vw, 26px);
  box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  animation: pp-sway 5s ease-in-out infinite;
  transform-origin: left center;
}
@keyframes pp-sway {
  0%, 100% { transform: rotate(-1.6deg); }
  50% { transform: rotate(1.8deg); }
}
.pp-title {
  margin: 0;
  font-size: clamp(24px, 3.4vw, 40px);
  font-weight: 900;
  letter-spacing: clamp(1px, 0.3vw, 3px);
}
.pp-sub {
  margin: 6px 0 0;
  font-size: clamp(12px, 1.4vw, 15px);
  font-weight: 600;
  color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
}
.pp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
/* 统计彩旗：挂在一条绒线串上，三面颜色各不同，微微错落 + 轻摆 */
.pp-bunting {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 1.4vw, 14px);
  padding-top: 16px;
}
.pp-bunting::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 3px;
  height: 2px;
  border-radius: var(--el-radius-full);
  background: var(--el-color-primary-light-5);
  opacity: 0.85;
}
.pp-bflag {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  min-height: 54px;
  clip-path: polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%);
  padding: 6px clamp(14px, 1.8vw, 20px) 7px clamp(12px, 1.6vw, 18px);
  color: var(--el-color-white);
  animation: pp-flutter 4.5s ease-in-out infinite;
  transform-origin: top left;
}
.pp-bflag:nth-child(2) { margin-top: 3px; animation-delay: 0.35s; }
.pp-bflag:nth-child(3) { margin-top: 6px; animation-delay: 0.7s; }
.pp-bflag:nth-child(4) { margin-top: 9px; animation-delay: 1.05s; }
@keyframes pp-flutter {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1.6deg); }
}
.pp-bflag--blue {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
}
.pp-bflag--gold {
  background: linear-gradient(135deg, var(--el-color-warning), color-mix(in srgb, var(--el-color-warning) 72%, var(--el-color-white)));
}
.pp-bflag--green {
  background: linear-gradient(135deg, var(--el-color-success), color-mix(in srgb, var(--el-color-success) 70%, var(--el-color-white)));
}
.pp-bflag--red {
  background: linear-gradient(135deg, var(--el-color-danger), color-mix(in srgb, var(--el-color-danger) 70%, var(--el-color-white)));
}
.pp-bflag__line {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.pp-bflag__val {
  font-size: clamp(14px, 1.8vw, 17px);
  font-weight: 900;
  line-height: 1.1;
}
.pp-bflag__lbl {
  font-size: 10.5px;
  font-weight: 700;
  opacity: 0.92;
}

/* ============ 跑道 ============ */
.pp-lane-zone {
  position: relative;
  margin-top: clamp(24px, 3.2vw, 38px);
}
/* 蛇形跑道：随 3n+2 错位起伏的虚线，穿过每排补给站中部（宽度自适应拉伸） */
.pp-lane {
  position: absolute;
  left: 1%;
  top: 50%;
  width: 98%;
  height: 64px;
  transform: translateY(-50%);
  overflow: visible;
  pointer-events: none;
}
.pp-lane path {
  fill: none;
  stroke: color-mix(in srgb, var(--el-color-primary) 42%, transparent);
  stroke-width: 8px;
  stroke-linecap: round;
  stroke-dasharray: 18px 16px;
  /* 宽度拉伸时线宽与虚线间距保持屏幕像素，不随 viewBox 变形 */
  vector-effect: non-scaling-stroke;
}
/* 学习小人：按已攻克模块数站在跑道上，进度变化时沿跑道滑动 */
.pp-runner {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  font-size: clamp(20px, 2.4vw, 26px);
  line-height: 1;
  pointer-events: none;
  transition: left var(--el-transition-duration, 0.3s) ease;
}
/* 终点方格旗：跑道尽头插一面小旗 */
.pp-lane-zone::after {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: conic-gradient(
    var(--el-color-primary) 90deg,
    var(--el-color-white) 90deg 180deg,
    var(--el-color-primary) 180deg 270deg,
    var(--el-color-white) 270deg
  );
  background-size: 11px 11px;
  box-shadow: 0 0 0 2px var(--el-bg-color);
  z-index: 0;
}
/* 补给站：3 列蛇形错位（第 2、5、8 个下沉 12px），hover 从自身位置再浮起 */
.pp-stops {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(230px, 24vw, 300px), 1fr));
  gap: clamp(14px, 1.8vw, 20px);
}
.pp-stops > :nth-child(3n + 2) {
  --pp-off: 12px;
}
.pp-stop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(8px, 1vw, 10px);
  padding: clamp(12px, 1.4vw, 18px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  outline: none;
  transform: translateY(var(--pp-off, 0px));
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  /* 入场：沿跑道依次「驶入」；backwards 让等待期保持隐藏，结束后不影响 hover */
  animation: pp-drive-in 0.5s ease backwards;
  animation-delay: calc(var(--pp-i, 0) * 55ms + 80ms);
}
@keyframes pp-drive-in {
  from {
    opacity: 0;
    transform: translateY(calc(var(--pp-off, 0px) + 18px));
  }
}
/* 今日推荐旗：骑在卡片左上缘的小燕尾旗（数据来自 overview.recommend） */
.pp-rec {
  position: absolute;
  top: -9px;
  left: 12px;
  z-index: 1;
  padding: 3px 10px 6px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%);
  background: linear-gradient(
    135deg,
    var(--el-color-warning),
    color-mix(in srgb, var(--el-color-warning) 72%, var(--el-color-white))
  );
  color: var(--el-color-white);
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
}
.pp-stop__main {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.2vw, 14px);
}
.pp-stop:hover {
  z-index: 2;
  transform: translateY(calc(var(--pp-off, 0px) - 6px));
  box-shadow: 0 14px 26px -10px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.pp-stop:active {
  transform: translateY(var(--pp-off, 0px));
}
.pp-stop:focus-visible {
  z-index: 2;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.pp-stop__ic {
  flex-shrink: 0;
  width: clamp(42px, 4.4vw, 56px);
  height: clamp(42px, 4.4vw, 56px);
  border-radius: clamp(12px, 1.5vw, 16px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(20px, 2.2vw, 26px);
  color: var(--el-color-white);
  /* 图标自身带一层同色柔和投影（底色由 modules.ts 内联渐变下发） */
  box-shadow: 0 8px 16px -6px color-mix(in srgb, var(--el-color-black) 24%, transparent);
}
.pp-stop__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1 1 auto;
}
.pp-stop__title {
  font-size: clamp(14px, 1.7vw, 18px);
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 0.4px;
  overflow-wrap: anywhere;
}
.pp-stop__sub {
  font-size: clamp(11px, 1.3vw, 13px);
  color: var(--el-text-color-placeholder);
  font-weight: 600;
  overflow-wrap: anywhere;
}
/* 进度行：细进度轨道 + 右侧百分比；无学习记录时显示「未开始」 */
.pp-stop__foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pp-stop__track {
  flex: 1 1 auto;
  height: 4px;
  border-radius: var(--el-radius-full);
  background: var(--el-fill-color-light);
  overflow: hidden;
}
.pp-stop__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width var(--el-transition-duration, 0.3s) ease;
}
.pp-stop__pct {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 800;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.pp-stop__pct.is-none {
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}
/* 定位桩：卡片底缘中间的模块色小圆点，像插在跑道上 */
.pp-stop__dot {
  position: absolute;
  left: 50%;
  bottom: -7px;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--el-bg-color);
}
.pp-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-danger);
  color: var(--el-color-white);
  font-size: 12px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ============ 终点线 ============ */
.pp-finish {
  position: relative;
  z-index: 1;
  margin: clamp(28px, 3.6vw, 42px) 0 0;
  min-height: 48px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--el-radius-lg, 12px);
  border: 2px dashed var(--el-color-primary-light-5);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-family: inherit;
  appearance: none;
  font-size: clamp(14px, 1.6vw, 16px);
  font-weight: 900;
  letter-spacing: 0.5px;
  cursor: pointer;
  outline: none;
  transition:
    background var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.pp-finish:hover {
  background: var(--el-color-primary-light-9);
}
/* 键盘焦点：浏览器默认焦点框太粗，统一换成 koi 焦点环 */
.pp-finish:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.pp-finish__check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: conic-gradient(
    var(--el-color-primary) 90deg,
    var(--el-bg-color) 90deg 180deg,
    var(--el-color-primary) 180deg 270deg,
    var(--el-bg-color) 270deg
  );
  background-size: 10px 10px;
  border: 1px solid var(--el-border-color-light);
}
.pp-finish__arrow {
  font-size: 20px;
  font-weight: 900;
}

/*
 * 响应式：列数已由 .pp-stops 的 auto-fit + minmax(clamp(…)) 接管，
 * 这里不再写 repeat(2)/repeat(1) 的死断点；只收口间距、字号与错位幅度。
 */
@media (max-width: 700px) {
  .pp-inner { padding: 18px 14px 16px; }
  .pp-top { flex-direction: column; gap: 14px; }
  .pp-bunting { width: 100%; padding-top: 12px; }
  .pp-stops > :nth-child(3n + 2) { --pp-off: 8px; }
  .pp-stop { min-height: 64px; }
  .pp-finish { margin-top: 22px; font-size: 14px; }
}
/*
 * 矮屏收口：底部外边距叠起来会在内容刚好填满视口时顶出「幽灵滚动」，
 * 只按高度收掉尾巴，不动列数。
 */
@media (max-height: 700px) {
  .pp-inner { padding-bottom: clamp(10px, 1.4vh, 18px); }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部动画与过渡 */
@media (prefers-reduced-motion: reduce) {
  .pp-title-flag__banner,
  .pp-bflag,
  .pp-stop {
    animation: none;
  }
  .pp-stop,
  .pp-stop__fill,
  .pp-runner,
  .pp-finish {
    transition: none;
  }
}
</style>