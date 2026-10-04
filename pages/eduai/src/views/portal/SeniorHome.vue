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
          <span class="sp-card__no">{{ i + 1 }}</span>
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
  /* 高中端：深海军蓝→石板灰的克制渐变，与小学亮蓝、初中靛蓝区分 */
  background: linear-gradient(
    178deg,
    #0f172a 0%,
    #1e3a5f 24%,
    #334155 46%,
    var(--el-bg-color-page) 46.1%,
    var(--el-fill-color-lighter) 100%
  );
}
.sp-head {
  padding: 30px 44px 0;
}
.sp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
}
.sp-title {
  margin: 0;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 4px;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 26px;
  min-width: min(640px, 100%);
  padding-top: 4px;
}
.sp-stat__val {
  font-size: 46px;
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
  font-size: 26px;
  margin-right: 2px;
}
.sp-stat__lbl {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-white) 78%, transparent);
}

.sp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 22px;
  /* 原 28px，最近档 16px（xl）；底部两角贴边所以保留 0 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
  background: var(--el-bg-color);
  min-height: 52vh;
}
.sp-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.sp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 16px 22px;
  /* 原 18px，最近档 16px（xl）；原 box-shadow 换成边框（koi 卡片不加投影） */
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.sp-card:hover {
  transform: translateY(-3px);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 12px 26px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.sp-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.sp-card__no {
  position: absolute;
  top: 10px;
  left: 12px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sp-card__ic {
  width: 58px;
  height: 58px;
  /* 原 18px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  /* 底色由 modules.ts 的 color/colorTo 渐变内联下发（数据驱动），这里只定前景 */
  color: var(--el-color-white);
}
.sp-card__title {
  font-size: 19px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.sp-card__sub {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.sp-more {
  margin: 26px 0 10px;
  text-align: right;
  font-size: 15px;
  font-weight: 800;
  color: var(--el-color-primary);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.sp-more:focus-visible {
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
@media (max-width: 1200px) {
  .sp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .sp-stat__val { font-size: 34px; }
}
@media (max-width: 800px) {
  .sp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sp-head { padding: 20px 20px 0; }
  .sp-title { font-size: 32px; }
  .sp-body { margin: 18px 12px 0; padding: 20px 16px; }
}
/* 尊重系统「减少动态效果」偏好：关掉本页全部 transition */
@media (prefers-reduced-motion: reduce) {
  .sp-card {
    transition: none;
  }
}
</style>
