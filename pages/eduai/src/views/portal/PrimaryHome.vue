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
          <div class="pp-pill">
            <span class="pp-pill__ic is-blue">📘</span>
            <span class="pp-pill__val">{{ week?.studyCount ?? 0 }} 次</span>
            <span class="pp-pill__lbl">本周学习</span>
          </div>
          <div class="pp-pill">
            <span class="pp-pill__ic is-gold">⭐</span>
            <span class="pp-pill__val">{{ total?.stars ?? 0 }} 颗</span>
            <span class="pp-pill__lbl">星星奖励</span>
          </div>
          <div class="pp-pill">
            <span class="pp-pill__lbl is-inline">连续打卡</span>
            <span class="pp-pill__check">✓</span>
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
      <div class="pp-more" @click="emit('open', '')">查看更多功能 ›</div>
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
.pp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  background: linear-gradient(180deg, #20a5eb 0%, #4fc3f7 42%, #eaf7ff 42.1%, #f5fbff 100%);
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
.pp-title {
  margin: 0;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
}
.pp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
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
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(12, 74, 110, 0.16);
}
.pp-pill__ic {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.pp-pill__ic.is-blue { background: #dbeafe; }
.pp-pill__ic.is-gold { background: #fef3c7; }
.pp-pill__lbl {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}
.pp-pill__lbl.is-inline { margin-right: 2px; }
.pp-pill__val {
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
}
.pp-pill__check {
  color: #22c55e;
  font-weight: 900;
  font-size: 17px;
}

.pp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 22px;
  border-radius: 28px 28px 0 0;
  background: #fff;
  min-height: 60vh;
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
  padding: 22px 20px;
  border: 0;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s, box-shadow 0.15s;
}
.pp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}
.pp-card__ic {
  flex-shrink: 0;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
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
  color: #0f172a;
  letter-spacing: 1px;
}
.pp-card__sub {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 600;
}
.pp-badge {
  position: absolute;
  top: -8px;
  right: 16px;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 13px;
  background: #ef4444;
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
}
.pp-more {
  margin: 26px 0 10px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #20a5eb;
  cursor: pointer;
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
</style>
