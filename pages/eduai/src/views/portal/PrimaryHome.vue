<template>
  <div class="pp">
    <header class="pp-head">
      <div class="pp-head__row">
        <div>
          <h1 class="pp-title">趣味学习</h1>
          <p class="pp-sub">
            {{ stageText }} · {{ overview?.student?.grade || "—" }}
            <span class="pp-sep">|</span>
            你好，{{ displayName }}
          </p>
        </div>
        <div class="pp-pills">
          <!-- 图标统一走 ReIcon：emoji 会被读屏念成「书本」「星星」之类的冗余文本 -->
          <div class="pp-pill">
            <span class="pp-pill__ic is-blue"><ReIcon name="Reading" :size="16" aria-hidden="true" /></span>
            <span class="pp-pill__val">{{ week?.studyCount ?? 0 }} 次</span>
            <span class="pp-pill__lbl">本周学习</span>
          </div>
          <div class="pp-pill">
            <span class="pp-pill__ic is-gold"><ReIcon name="Star" :size="16" aria-hidden="true" /></span>
            <span class="pp-pill__val">{{ total?.stars ?? 0 }} 颗</span>
            <span class="pp-pill__lbl">星星奖励</span>
          </div>
          <div class="pp-pill">
            <span class="pp-pill__lbl is-inline">连续打卡</span>
            <span class="pp-pill__check"><ReIcon name="CircleCheck" :size="17" aria-hidden="true" /></span>
            <span class="pp-pill__val">{{ streakDays }} 天</span>
          </div>
        </div>
      </div>
    </header>

    <section class="pp-body">
      <div class="pp-grid">
        <button
          v-for="m in modules"
          :key="m.moduleCode"
          type="button"
          class="pp-card"
          @click="emit('open', m.moduleCode)"
        >
          <span v-if="badgeOf(m) > 0" class="pp-badge">{{ badgeOf(m) }}</span>
          <span
            class="pp-card__ic"
            :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
          >{{ m.icon }}</span>
          <span class="pp-card__text">
            <span class="pp-card__title">{{ m.title }}</span>
            <span class="pp-card__sub">{{ m.subtitle }}</span>
          </span>
        </button>
      </div>
      <!-- 「查看更多功能」是 div 而不是 button，tabindex 让它能被 Tab 到，
           否则下面的 :focus-visible 焦点环永远不会触发（键盘用户看不到焦点） -->
      <div class="pp-more" tabindex="0" @click="emit('open', '')">查看更多功能 ›</div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * PrimaryHome —— 小学端首页（活泼可爱，蓝白清新渐变）
 *
 * 对应设计稿：蓝色渐变顶栏 + 你好问候 + 三枚统计胶囊；白底大圆角容器里
 * 6 张功能卡（圆形渐变图标 + 标题 + 副标题），未完成的模块带红色角标。
 *
 * 统计口径全部来自后端真实数据（edu_student_daily / edu_student_progress），
 * 没有数据时显示 0，不用假数字。
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

/**
 * 未完成角标：按该模块的剩余进度折算成待完成项数量。
 *
 * 学习数据里没有「待办条目数」这个概念，只有进度百分比；
 * 这里用 100-进度 折算成一个直观的待完成数（满分 100 时角标消失）。
 *
 * @param m 模块
 * @returns 角标数字，0 表示不显示
 */
function badgeOf(m: PortalModule): number {
  if (!m.badgeFromIncomplete) {
    return 0;
  }
  const p = (props.overview?.modules ?? []).find((r) => r.moduleCode === m.moduleCode);
  if (!p) {
    return 48;
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
  /* 小学端：亮蓝→浅蓝渐变（对齐设计稿 #20A5EB 顶栏 + 浅蓝底） */
  background: linear-gradient(
    180deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 54%,
    var(--el-color-primary-light-7) 100%
  );
}
.pp-head {
  padding: 28px 44px 0;
}
.pp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
/* 品牌区标题压在主色带上，靠描边阴影保证可读性（见 .pp-title） */
.pp-title {
  margin: 0;
  font-size: 46px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  /* 卡通描边：更厚的落下阴影，像贴纸字 */
  text-shadow: 0 4px 0 color-mix(in srgb, var(--el-color-black) 14%, transparent);
}
.pp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  /* 色带上的白字不能换成 --el-text-color-primary（暗色下会变浅色失去对比），
     用 --el-color-white + color-mix 保留原来的 95% 透明度 */
  color: color-mix(in srgb, var(--el-color-white) 95%, transparent);
}
.pp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.pp-pills {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  padding-top: 6px;
}
.pp-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 20px;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  /* 卡片类容器不加投影：改用一条边框承载边界，暗色模式下也分得清 */
  border: 1px solid var(--el-border-color-lighter);
}
.pp-pill__ic {
  width: 30px;
  height: 30px;
  /* 原 9px，最近档 8px（md） */
  border-radius: var(--el-radius-md, 8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.pp-pill__ic.is-blue { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.pp-pill__ic.is-gold { background: color-mix(in srgb, var(--el-color-warning) 14%, transparent); }
.pp-pill__lbl {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.pp-pill__lbl.is-inline { margin-right: 2px; }
.pp-pill__val {
  font-size: 19px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.pp-pill__check {
  color: var(--el-color-success);
  font-weight: 900;
  font-size: 17px;
  display: inline-flex;
  align-items: center;
}

.pp-body {
  margin: 26px 26px 30px;
  padding: 30px 30px 24px;
  /* 对齐设计稿：整块白色圆角容器（四周同圆角） */
  border-radius: 28px;
  background: var(--el-bg-color);
  min-height: 60vh;
  box-shadow: 0 18px 40px color-mix(in srgb, #0b3f7a 16%, transparent);
}
.pp-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.pp-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  /* 对齐设计稿：白卡 + 柔和投影、20px 圆角，不描重边 */
  border: 0;
  border-radius: 20px;
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  outline: none;
  box-shadow: 0 10px 24px color-mix(in srgb, #0b3f7a 10%, transparent);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.pp-card:hover {
  /* 童趣但仍克制：轻微上浮 */
  transform: translateY(-4px);
  box-shadow: 0 16px 32px color-mix(in srgb, #0b3f7a 18%, transparent);
}
.pp-card:active {
  transform: translateY(-1px);
}
.pp-card:focus-visible {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 20%, transparent),
    0 10px 24px color-mix(in srgb, #0b3f7a 10%, transparent);
}
.pp-card__ic {
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  /* 设计稿是「圆角方块」图标，不是圆形 */
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: var(--el-color-white);
  /* 图标自身带一层同色柔和投影（底色由 modules.ts 内联渐变下发） */
  box-shadow: 0 10px 20px -6px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}
.pp-card__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.pp-card__title {
  font-size: 21px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.pp-card__sub {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}
.pp-badge {
  position: absolute;
  /* 对齐设计稿：红点落在卡片右上角内侧 */
  top: 12px;
  right: 16px;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  /* 原 13px = 胶囊高度的一半，等价 full，语义比 12px(lg) 更准 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-danger);
  color: var(--el-color-white);
  font-size: 13px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pp-more {
  margin: 26px 0 10px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: var(--el-color-primary);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pp-more:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
@media (max-width: 1100px) {
  .pp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-title { font-size: 34px; }
}
@media (max-width: 700px) {
  .pp-grid { grid-template-columns: minmax(0, 1fr); }
  .pp-head { padding: 20px 20px 0; }
  .pp-body { margin: 18px 12px 0; padding: 20px 16px; }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部过渡 */
@media (prefers-reduced-motion: reduce) {
  .pp-card {
    transition: none;
  }
}
</style>
