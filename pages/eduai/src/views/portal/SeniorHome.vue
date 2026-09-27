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
      <div class="sp-more" @click="emit('open', '')">查看全部 →</div>
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
.sp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  background: linear-gradient(178deg, #0b2447 0%, #123a6b 22%, #2563eb 40%, #f1f5f9 40.1%, #f8fafc 100%);
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
  color: #fff;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
}
.sp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
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
  color: #fff;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}
.sp-stat__val.is-accent { color: #4ade80; }
.sp-stat__val i {
  font-style: normal;
  font-size: 26px;
  margin-right: 2px;
}
.sp-stat__lbl {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.78);
}

.sp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 22px;
  border-radius: 28px 28px 0 0;
  background: #fff;
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
  border: 0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.07);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.sp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}
.sp-card__no {
  position: absolute;
  top: 10px;
  left: 12px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 50%;
  background: #dbeafe;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sp-card__ic {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
}
.sp-card__title {
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 1px;
}
.sp-card__sub {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.sp-more {
  margin: 26px 0 10px;
  text-align: right;
  font-size: 15px;
  font-weight: 800;
  color: #2563eb;
  cursor: pointer;
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
</style>
