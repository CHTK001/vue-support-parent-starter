<template>
  <div class="sp">
    <header class="sp-head">
      <div class="sp-head__row">
        <div>
          <h1 class="sp-title">趣味学习</h1>
          <p class="sp-sub">
            {{ stageText }} · {{ overview?.student?.grade || "—" }}
            <span class="sp-sep">|</span>
            高考冲刺 {{ daysToExam }} 天
          </p>
        </div>
        <div class="sp-stats">
          <div class="sp-stat">
            <div class="sp-stat__val">{{ today?.studyMinutes ?? 0 }}</div>
            <div class="sp-stat__lbl">今日学习分钟</div>
          </div>
          <div class="sp-stat">
            <div class="sp-stat__val is-accent">{{ week?.accuracy ?? 0 }}<i>%</i></div>
            <div class="sp-stat__lbl">本周正确率</div>
          </div>
          <div class="sp-stat">
            <div class="sp-stat__val">{{ modulesMastered }}</div>
            <div class="sp-stat__lbl">已攻克模块</div>
          </div>
          <div class="sp-stat">
            <div class="sp-stat__val"><i>#</i>{{ classRank || "—" }}</div>
            <div class="sp-stat__lbl">班级排名</div>
          </div>
        </div>
      </div>
    </header>

    <section class="sp-body">
      <div class="sp-grid">
        <button
          v-for="(m, i) in modules"
          :key="m.moduleCode"
          type="button"
          class="sp-card"
          @click="emit('open', m.moduleCode)"
        >
          <span
            class="sp-card__no"
            :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
          >{{ i + 1 }}</span>
          <span
            class="sp-card__ic"
            :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
          >{{ m.icon }}</span>
          <div class="sp-card__title">{{ m.title }}</div>
          <div class="sp-card__sub">已学 {{ progressOf(m) }}%</div>
        </button>
      </div>
      <!-- 「查看全部」是 div 而不是 button，tabindex 让它能被 Tab 到，
           否则下面的 :focus-visible 焦点环永远不会触发（键盘用户看不到焦点） -->
      <div class="sp-more" tabindex="0" @click="emit('open', '')">查看全部 →</div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * SeniorHome —— 高中端首页（专业克制，高考冲刺感）
 *
 * 对应设计稿：深蓝渐变顶栏 + 四个大数字（今日学习分钟 / 本周正确率 /
 * 已攻克知识点 / 班级排名）；白底区域 8 张扁平卡片，标注已学进度。
 *
 * 一处与设计稿的偏差：稿上写的是「已攻克知识点」，但学习数据模型里没有
 * 按学生的知识点掌握表，只有模块进度（edu_student_progress），
 * 因此这里如实显示「已攻克模块」（进度达到 100 的模块数），不编数字。
 */
import { computed } from "vue";
import type { PortalModule } from "./modules";
import { progressOf as readProgress, stageLabel } from "./modules";
import type { StudentOverview } from "../../api/types";

const props = defineProps<{
  overview: StudentOverview | null;
  modules: PortalModule[];
}>();

const emit = defineEmits<{ (e: "open", moduleCode: string): void }>();

const today = computed(() => props.overview?.today);
const week = computed(() => props.overview?.week);
const modulesMastered = computed(() => props.overview?.modulesMastered ?? 0);
const classRank = computed(() => props.overview?.classRank ?? 0);
const stageText = computed(() => stageLabel(props.overview?.stage));

/**
 * 该卡片的模块进度
 *
 * @param m 模块
 * @returns 0-100
 */
function progressOf(m: PortalModule): number {
  return readProgress(props.overview?.modules, m.moduleCode);
}

/**
 * 距高考天数（按每年 6 月 7 日算）
 *
 * @returns 天数，跨年自动滚到下一届
 */
const daysToExam = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  let exam = new Date(y, 5, 7);
  if (exam.getTime() < now.getTime()) {
    exam = new Date(y + 1, 5, 7);
  }
  return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / 86400000));
});
</script>

<style scoped>
/*
 * koi 令牌口径（与 JuniorHome / PrimaryHome / TeacherPortalView / StudentPortalView 完全一致）：
 *   品牌色带 = --el-color-primary-dark-2 → --el-color-primary → --el-color-primary-light-3
 *   页面底   = --el-bg-color-page，卡片面 = --el-bg-color
 *   文字三级 = --el-text-color-primary / -regular / -secondary / -placeholder
 *   圆角只走 --el-radius-* 六档，动画只走 --el-transition-duration
 * 卡片类容器一律不加投影，投影只留给「悬浮浮起」与「键盘焦点环」两种反馈。
 */
.sp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  /* 高中端：深海军蓝→亮蓝（对齐设计稿 #111827 / #2563EB） */
  background: linear-gradient(
    178deg,
    #0f172a 0%,
    #1e3a8a 30%,
    #2563eb 52%,
    var(--el-bg-color-page) 52.1%,
    var(--el-fill-color-lighter) 100%
  );
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sp-head {
  padding: clamp(16px, 2.4vw, 30px) clamp(16px, 3.2vw, 44px) 0;
}
.sp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(12px, 2vw, 26px);
  flex-wrap: wrap;
}
.sp-title {
  margin: 0;
  font-size: clamp(26px, 4.2vw, 44px);
  font-weight: 900;
  letter-spacing: clamp(1px, 0.3vw, 4px);
  color: var(--el-color-white);
  /* 白字压在深色带上的可读性靠描边阴影，暗色模式下色带更深，描边同样跟随 */
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 15%, transparent);
}
.sp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  /* 色带上的白字不能换成 --el-text-color-primary（暗色下会变浅色失去对比），
     用 --el-color-white + color-mix 保留原来的 92% 透明度 */
  color: color-mix(in srgb, var(--el-color-white) 92%, transparent);
}
.sp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.sp-stats {
  display: grid;
  /* auto-fit：四个大数字按可用宽度自动换列。原先写死 repeat(4) 且
     min-width: min(640px,100%)，在 390px 手机上每个数字只剩 ~90px，
     「今日学习分钟」这类标签必被挤断 */
  grid-template-columns: repeat(auto-fit, minmax(clamp(120px, 26vw, 170px), 1fr));
  gap: clamp(12px, 2vw, 26px);
  min-width: 0;
  width: 100%;
  padding-top: 4px;
}
.sp-stat__val {
  font-size: clamp(26px, 3.4vw, 46px);
  font-weight: 900;
  color: var(--el-color-white);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}
/* 深色带上的浅绿强调：必须是「比 success 更亮」的一档，否则在深底上读不出来 */
.sp-stat__val.is-accent { color: var(--el-color-success-light-3); }
.sp-stat__val i {
  font-style: normal;
  font-size: clamp(15px, 1.9vw, 26px);
  margin-right: 2px;
}
.sp-stat__lbl {
  margin-top: 4px;
  font-size: clamp(11px, 1.3vw, 13px);
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-white) 78%, transparent);
}

.sp-body {
  margin: clamp(14px, 2vw, 26px) clamp(12px, 1.8vw, 26px) 0;
  padding: clamp(16px, 2.2vw, 30px) clamp(14px, 2.2vw, 30px) clamp(14px, 1.8vw, 22px);
  /* 原 28px，最近档 16px（xl）；底部两角贴边所以保留 0 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
  background: var(--el-bg-color);
  /* 原 min-height:52vh —— 写死 vh 在矮屏上凭空多出一段空白，改成收放+封顶 */
  min-height: min(52dvh, 500px);
}
.sp-grid {
  display: grid;
  /* auto-fit：八张卡按可用宽度自己算列数，不再靠 1200/800 两个死断点 */
  grid-template-columns: repeat(auto-fit, minmax(clamp(130px, 21vw, 210px), 1fr));
  gap: clamp(12px, 1.5vw, 18px);
}
.sp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.2vw, 12px);
  padding: clamp(16px, 2.2vw, 28px) clamp(10px, 1.2vw, 16px) clamp(12px, 1.7vw, 22px);
  /* 对齐设计稿：白卡 + 柔和投影、20px 圆角 */
  border: 0;
  border-radius: clamp(14px, 1.6vw, 20px);
  background: var(--el-bg-color);
  cursor: pointer;
  box-shadow: 0 10px 24px color-mix(in srgb, #0f172a 12%, transparent);
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.sp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 30px color-mix(in srgb, #0f172a 20%, transparent);
}
.sp-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sp-card__no {
  position: absolute;
  top: 10px;
  left: 12px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: var(--el-border-radius-circle, 50%);
  /* 对齐设计稿：序号圆牌用该卡片的主题色（底色由模板内联下发），文字白 */
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sp-card__ic {
  width: clamp(46px, 5.2vw, 72px);
  height: clamp(46px, 5.2vw, 72px);
  /* 对齐设计稿：更大的圆角方块图标 + 柔和投影 */
  border-radius: clamp(14px, 1.8vw, 22px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(22px, 2.6vw, 32px);
  /* 底色由 modules.ts 的 color/colorTo 渐变内联下发（数据驱动），这里只定前景 */
  color: var(--el-color-white);
  box-shadow: 0 10px 20px -6px color-mix(in srgb, var(--el-color-black) 24%, transparent);
}
.sp-card__title {
  font-size: clamp(13px, 1.6vw, 19px);
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
  text-align: center;
  overflow-wrap: anywhere;
}
.sp-card__sub {
  font-size: clamp(11px, 1.3vw, 13px);
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.sp-more {
  margin: 26px 0 10px;
  padding: 10px 0;
  text-align: right;
  font-size: 15px;
  font-weight: 800;
  color: var(--el-color-primary);
  cursor: pointer;
  /* 触摸目标：手机上 10px 上下留白 + 15px 字号不足 44px */
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.sp-more:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
/*
 * 响应式：列数已由 .sp-grid / .sp-stats 的 auto-fit + minmax(clamp(…)) 接管，
 * 这里**不再**写 repeat(3)/repeat(2) 的死断点 —— 与 auto-fit 逻辑重复且互相覆盖，
 * 窄屏反而被固定列数压成又窄又高的长条。只保留间距收口。
 */
@media (max-width: 800px) {
  .sp-head { padding: 16px 16px 0; }
  .sp-sub { margin-top: 6px; font-size: 13px; }
  .sp-body { margin: 14px 10px 0; padding: 16px 12px; min-height: 0; }
  .sp-more { margin: 14px 0 6px; font-size: 14px; }
  /* 触摸目标不小于 44px */
  .sp-card { min-height: 96px; }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .sp-card {
    transition: none;
  }
}
</style>
