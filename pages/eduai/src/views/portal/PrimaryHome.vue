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
 * <p>**查不到该模块的学习记录时返回 0（不显示角标）**，这是刻意改的：
 * 原实现在无记录时直接 `return 48`，等于凭空造一个数字印在卡片上 ——
 * 学生看到「48」会以为真有 48 个待办，而库里根本没有这个数。
 * 宁可什么都不显示，也不显示假数据。</p>
 *
 * @param m 模块
 * @returns 角标数字，0 表示不显示
 */
function badgeOf(m: PortalModule): number {
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
  /* 小学端：亮蓝→浅蓝渐变（对齐设计稿 #20A5EB 顶栏 + 浅蓝底） */
  background: linear-gradient(
    180deg,
    var(--el-color-primary) 0%,
    var(--el-color-primary-light-3) 54%,
    var(--el-color-primary-light-7) 100%
  );
  /* 手机端刘海/手势条会压住内容，底部留出安全区 */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pp-head {
  /* 边距随视口收放：写死 28/44 在手机上把内容挤到只剩一列 */
  padding: clamp(16px, 2.4vw, 28px) clamp(16px, 3.2vw, 44px) 0;
}
.pp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(12px, 2vw, 24px);
  flex-wrap: wrap;
}
/* 品牌区标题压在主色带上，靠描边阴影保证可读性（见 .pp-title） */
.pp-title {
  margin: 0;
  /* 46px 在 390px 宽的屏上会折行，改成随视口收放的 clamp */
  font-size: clamp(26px, 4.4vw, 46px);
  font-weight: 900;
  letter-spacing: clamp(1px, 0.3vw, 3px);
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
  gap: clamp(8px, 1.2vw, 14px);
  flex-wrap: wrap;
  padding-top: 6px;
}
.pp-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  /* 原写死 52px：短屏上三枚胶囊叠起来就多占一整行。改成有下限的 min-height，
     内容（数字变大）撑多高都放得下 */
  min-height: clamp(40px, 5vw, 52px);
  padding: 6px clamp(12px, 1.4vw, 20px);
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  /* 卡片类容器不加投影：改用一条边框承载边界，暗色模式下也分得清 */
  border: 1px solid var(--el-border-color-lighter);
}
.pp-pill__ic {
  width: clamp(24px, 3vw, 30px);
  height: clamp(24px, 3vw, 30px);
  /* 原 9px，最近档 8px（md） */
  border-radius: var(--el-radius-md, 8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(13px, 1.6vw, 16px);
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
  font-size: clamp(16px, 2vw, 19px);
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
  margin: clamp(14px, 2vw, 26px) clamp(12px, 1.8vw, 26px) clamp(16px, 2.2vw, 30px);
  padding: clamp(16px, 2.2vw, 30px) clamp(14px, 2.2vw, 30px) clamp(14px, 1.8vw, 24px);
  /* 对齐设计稿：整块白色圆角容器（四周同圆角） */
  border-radius: clamp(18px, 2.4vw, 28px);
  background: var(--el-bg-color);
  /* 原 min-height:60vh —— 写死 vh 在矮屏上凭空多出一段空白，把内容整体推下首屏；
     改成随视口高度收放并封顶，短内容页不再被撑出空壳 */
  min-height: min(60dvh, 560px);
  box-shadow: 0 18px 40px color-mix(in srgb, #0b3f7a 16%, transparent);
}
.pp-grid {
  display: grid;
  /* auto-fit + minmax：列数按可用宽度自己算，不再为每个断点写死 repeat(n, …)，
     与成语消消乐同一套写法 */
  grid-template-columns: repeat(auto-fit, minmax(clamp(150px, 26vw, 260px), 1fr));
  gap: clamp(12px, 1.6vw, 20px);
}
.pp-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.4vw, 16px);
  padding: clamp(12px, 1.6vw, 20px);
  /* 对齐设计稿：白卡 + 柔和投影、20px 圆角，不描重边 */
  border: 0;
  border-radius: clamp(14px, 1.6vw, 20px);
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
  width: clamp(44px, 5vw, 68px);
  height: clamp(44px, 5vw, 68px);
  /* 设计稿是「圆角方块」图标，不是圆形 */
  border-radius: clamp(14px, 1.8vw, 22px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(20px, 2.4vw, 30px);
  color: var(--el-color-white);
  /* 图标自身带一层同色柔和投影（底色由 modules.ts 内联渐变下发） */
  box-shadow: 0 10px 20px -6px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}
.pp-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* 允许文字占满剩余宽度并在过长处断行，否则窄屏下标题会顶破卡片 */
  min-width: 0;
  flex: 1 1 auto;
}
.pp-card__title {
  font-size: clamp(15px, 1.9vw, 21px);
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
  overflow-wrap: anywhere;
}
.pp-card__sub {
  font-size: clamp(12px, 1.5vw, 14px);
  color: var(--el-text-color-placeholder);
  font-weight: 600;
  overflow-wrap: anywhere;
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
  padding: 10px 0;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: var(--el-color-primary);
  cursor: pointer;
  /* 触摸目标：手机上 10px 上下留白 + 15px 字号不足 44px */
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pp-more:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/*
 * 响应式：列数已由 .pp-grid 的 auto-fit + minmax(clamp(…)) 接管，
 * 这里**不再**写 repeat(2)/repeat(1) 的死断点 —— 之前 1100px/700px 两个断点
 * 与 auto-fit 逻辑重复且互相覆盖，窄屏反而被固定成一列（实测 390px 宽下
 * 6 张卡叠成 1817px 长条，要滚 973px）。这里只保留间距与字号的收口。
 */
@media (max-width: 700px) {
  .pp-head { padding: 16px 16px 0; }
  .pp-sub { margin-top: 6px; font-size: 13px; }
  .pp-pills { width: 100%; padding-top: 10px; }
  /* 手机上三枚胶囊各占一行太占屏，压成两列网格 */
  .pp-pills {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  .pp-body { margin: 14px 10px 0; padding: 16px 12px; border-radius: 18px; min-height: 0; }
  .pp-more { margin: 18px 0 6px; font-size: 14px; }
  /* 触摸目标不小于 44px（iOS HIG / Material 都说 44~48） */
  .pp-card { min-height: 64px; }
}
/*
 * 矮屏收口：`.pp-body` 的下外边距 + 下内边距叠起来会在内容刚好填满视口时
 * 顶出一圈「幽灵滚动」——1280x620 实测 scrollHeight 661 / clientHeight 620，
 * 页面能滚但滚过去什么都没有，触控板用户会当成卡住。
 * 只按**高度**收口尾巴，不动列数（列数归 .pp-grid 的 auto-fit 管）。
 */
@media (max-height: 700px) {
  .pp-body {
    margin-bottom: 0;
    padding-bottom: clamp(10px, 1.4vh, 18px);
  }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部过渡 */
@media (prefers-reduced-motion: reduce) {
  .pp-card {
    transition: none;
  }
}
</style>
