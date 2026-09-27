<template>
  <div class="jp">
    <header class="jp-head">
      <div class="jp-head__row">
        <div>
          <h1 class="jp-title">趣味学习</h1>
          <p class="jp-sub">
            {{ stageText }} · {{ overview?.student?.grade || "—" }}
            <span class="jp-sep">|</span>
            学习进度 {{ overallProgress }}%
          </p>
        </div>
        <div class="jp-stats">
          <div class="jp-stat">
            <span class="jp-stat__ic is-blue">✔</span>
            <div>
              <div class="jp-stat__lbl">今日学习</div>
              <div class="jp-stat__val">{{ today?.studyMinutes ?? 0 }}<i>分钟</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-green">✓</span>
            <div>
              <div class="jp-stat__lbl">完成练习</div>
              <div class="jp-stat__val">{{ today?.questionCount ?? 0 }}<i>题</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-amber">!</span>
            <div>
              <div class="jp-stat__lbl">错题本</div>
              <div class="jp-stat__val">{{ wrongPending }}<i>题待复习</i></div>
            </div>
          </div>
          <div class="jp-stat">
            <span class="jp-stat__ic is-purple">✦</span>
            <div>
              <div class="jp-stat__lbl">学习积分</div>
              <div class="jp-stat__val">{{ total?.points ?? 0 }}<i>分</i></div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <section class="jp-body">
      <div class="jp-grid">
        <button
          v-for="(m, i) in modules"
          :key="m.moduleCode"
          type="button"
          class="jp-card"
          @click="emit('open', m.moduleCode)"
        >
          <span class="jp-card__no">{{ i + 1 }}</span>
          <div class="jp-card__top">
            <span
              class="jp-card__ic"
              :style="{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.colorTo} 100%)` }"
            >{{ m.icon }}</span>
            <div class="jp-card__text">
              <div class="jp-card__title">{{ m.title }}</div>
              <div class="jp-card__sub">{{ m.subtitle }}</div>
            </div>
          </div>
          <div class="jp-bar"><span class="jp-bar__fill" :style="{ width: progressOf(m) + '%' }" /></div>
        </button>
      </div>
      <div v-if="recommendTitle" class="jp-rec">
        今日推荐：{{ recommendTitle }}
        <span v-if="recommendSub"> | {{ recommendSub }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * JuniorHome —— 初中端首页（简洁现代，深蓝渐变）
 *
 * 对应设计稿：深蓝渐变顶栏 + 四张统计卡（今日学习/完成练习/错题本/学习积分）；
 * 白底区域 8 张功能卡，每张带学习进度条；底部一行「今日推荐」。
 *
 * 顶栏右侧的学习进度取所有模块进度的平均值 —— 设计稿写的是 68%，
 * 但没有定义这个数字从哪来，用平均进度是唯一能从真实数据算出来的口径。
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
const total = computed(() => props.overview?.total);
const wrongPending = computed(() => props.overview?.wrongPending ?? 0);
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

const overallProgress = computed(() => {
  if (!props.modules.length) {
    return 0;
  }
  const sum = props.modules.reduce((acc, m) => acc + progressOf(m), 0);
  return Math.round(sum / props.modules.length);
});

const recommendModule = computed(() =>
  props.modules.find((m) => m.moduleCode === props.overview?.recommend),
);
const recommendTitle = computed(() => recommendModule.value?.title ?? "");
const recommendSub = computed(() => recommendModule.value?.subtitle ?? "");
</script>

<style scoped>
.jp {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: auto;
  background: linear-gradient(175deg, #2563eb 0%, #3b82f6 34%, #eef2ff 34.1%, #f8fafc 100%);
}
.jp-head {
  padding: 30px 44px 0;
}
.jp-head__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 26px;
  flex-wrap: wrap;
}
.jp-title {
  margin: 0;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.jp-sub {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}
.jp-sep {
  margin: 0 8px;
  opacity: 0.7;
}
.jp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-width: min(680px, 100%);
}
.jp-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
}
.jp-stat__ic {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 900;
  color: #fff;
}
.jp-stat__ic.is-blue { background: #2563eb; }
.jp-stat__ic.is-green { background: #22c55e; }
.jp-stat__ic.is-amber { background: #f59e0b; }
.jp-stat__ic.is-purple { background: #8b5cf6; }
.jp-stat__lbl {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.jp-stat__val {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.jp-stat__val i {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-left: 3px;
}

.jp-body {
  margin: 26px 26px 0;
  padding: 30px 30px 22px;
  border-radius: 28px 28px 0 0;
  background: #fff;
  min-height: 55vh;
}
.jp-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
.jp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 18px;
  border: 0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s, box-shadow 0.15s;
}
.jp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13);
}
.jp-card__no {
  position: absolute;
  top: 12px;
  right: 14px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.jp-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.jp-card__ic {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
}
.jp-card__text {
  min-width: 0;
}
.jp-card__title {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
}
.jp-card__sub {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jp-bar {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.jp-bar__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  transition: width 0.3s;
}
.jp-rec {
  margin: 26px 0 10px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #475569;
}
@media (max-width: 1200px) {
  .jp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .jp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 800px) {
  .jp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .jp-head { padding: 20px 20px 0; }
  .jp-title { font-size: 32px; }
  .jp-body { margin: 18px 12px 0; padding: 20px 16px; }
}
</style>
