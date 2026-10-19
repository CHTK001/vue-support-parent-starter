<template>
  <div class="home-page">

    <!-- ============== 科技风 Hero ============== -->
    <div class="hero">
      <div class="hero__bg" aria-hidden="true">
        <div class="hero__grid" />
      </div>
      <div class="hero__content">
        <div class="hero__text">
          <div class="hero__badge">
            <span class="hero__badge-dot" />
            AI 教育工作台
          </div>
          <h1 class="hero__title">教育 AI 工作台</h1>
          <p class="hero__sub">题库 · AI 组卷 · AI 阅卷 · 知识库 · 错题库 · 考试管理</p>
        </div>
        <!-- AI 状态灯 + 模型名 -->
        <div class="hero__ai" :class="health.available ? 'is-ok' : 'is-warn'">
          <div class="ai-pulse" aria-hidden="true" />
          <div class="ai-pulse ai-pulse--delay" aria-hidden="true" />
          <div class="ai-pulse ai-pulse--delay2" aria-hidden="true" />
          <span class="ai-dot" />
          <span class="ai-label">{{ health.available ? 'AI 已启用' : 'AI 未启用' }}</span>
          <span v-if="health.available && (health.provider || health.model)" class="ai-model">
            {{ health.provider }}{{ health.model ? ' · ' + health.model : '' }}
          </span>
          <button class="ai-config-btn" @click="go('/edu/ai-provider')">
            <el-icon size="12"><Setting /></el-icon>
            配置
          </button>
        </div>
      </div>
    </div>

    <!-- ============== 仪表板数据卡 ============== -->
    <div class="stats-row">
      <div
        v-for="s in stats"
        :key="s.label"
        class="stat-card"
        :class="{ 'is-loading': s.loading, [`is-${s.tone}`]: !s.loading && s.value > 0 }"
      >
        <div class="stat-card__icon" :style="{ background: s.bg }">
          <el-icon :size="22"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__title">{{ s.label }}</div>
          <div class="stat-card__value">{{ s.loading ? '—' : s.value.toLocaleString() }}</div>
          <div class="stat-card__hint">{{ s.hint }}</div>
        </div>
        <!-- 底部进度条（占满时显示满格） -->
        <div
          v-if="!s.loading && s.max > 0"
          class="stat-card__bar"
          :style="{ '--pct': Math.min(100, (s.value / s.max) * 100) + '%' }"
          :title="`${s.value} / ${s.max}`"
        />
      </div>
    </div>

    <!-- ============== 6 大能力入口 ============== -->
    <div class="section-title">
      <span class="section-title__line" />
      <span>快捷入口</span>
      <span class="section-title__line" />
    </div>
    <div class="cap-grid">
      <div
        v-for="card in cards"
        :key="card.path"
        class="cap-card"
        role="button"
        tabindex="0"
        @click="go(card.path)"
        @keydown.enter="go(card.path)"
      >
        <!-- 科技装饰：顶部扫描光 + 四角 L 形 -->
        <div class="cap-card__scan" :style="{ background: card.gradient }" />
        <div class="cap-card__corner" />
        <div class="cap-card__icon" :style="{ background: card.gradient }">
          <el-icon :size="28"><component :is="card.icon" /></el-icon>
        </div>
        <div class="cap-card__body">
          <div class="cap-card__title">{{ card.title }}</div>
          <div class="cap-card__desc">{{ card.desc }}</div>
        </div>
        <div class="cap-card__tags">
          <span v-for="t in card.tags" :key="t" class="cap-tag">{{ t }}</span>
        </div>
        <div class="cap-card__arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  CircleCheck,
  Warning,
  Setting,
  Notebook,
  MagicStick,
  Reading,
  DataAnalysis,
  Warning as WarningIcon,
  Document,
  User,
  Tickets,
} from '@element-plus/icons-vue';

import { eduaiApi } from '../api/eduaiApi';

const router = useRouter();

/* ---------- AI 状态（与顶栏徽标同口径） ---------- */
interface Health {
  available: boolean;
  provider: string;
  model: string;
}
const health = reactive<Health>({ available: false, provider: '', model: '' });

/* ---------- 仪表板统计 ---------- */
interface DashStat {
  label: string;
  value: number;
  hint: string;
  icon: any;
  bg: string;
  loading: boolean;
  tone: string;
  max: number;
}
const stats = reactive<DashStat[]>([
  { label: "题目总数", value: 0, hint: "题库", icon: Notebook, bg: "var(--el-color-primary)", loading: true, tone: "blue", max: 0 },
  { label: "学生总数", value: 0, hint: "已绑定", icon: User, bg: "var(--el-color-success)", loading: true, tone: "green", max: 0 },
  { label: "考试总数", value: 0, hint: "全部", icon: Document, bg: "var(--el-color-warning)", loading: true, tone: "orange", max: 0 },
  { label: "待阅卷", value: 0, hint: "进行中", icon: Tickets, bg: "var(--el-color-danger)", loading: true, tone: "red", max: 0 },
]);

async function loadDashboard() {
  stats.forEach(s => { s.loading = true; });
  try {
    const [qr, sr, er, mr] = await Promise.allSettled([
      eduaiApi.pageQuestions({ pageSize: 1 }),
      eduaiApi.listStudents(),
      eduaiApi.pageExams({ pageSize: 1 }),
      eduaiApi.teacherMarkingTasks(),
    ]);
    if (qr.status === "fulfilled") stats[0].value = qr.value.total ?? qr.value.list?.length ?? 0;
    if (sr.status === "fulfilled") stats[1].value = sr.value.length ?? 0;
    if (er.status === "fulfilled") { stats[2].value = er.value.total ?? er.value.list?.length ?? 0; stats[2].max = stats[2].value; }
    if (mr.status === "fulfilled") { stats[3].value = mr.value.length ?? 0; stats[3].max = mr.value.length ?? 1; }
  } finally {
    stats.forEach(s => { s.loading = false; });
  }
}

async function loadHealth() {
  try {
    const res = await eduaiApi.aiCapability();
    health.available = res?.available === true;
    health.provider = res?.provider ?? '';
    health.model = res?.model ?? '';
  } catch {
    health.available = false;
  }
}

/* ---------- 能力入口卡片 ---------- */
interface CapCard {
  path: string; title: string; desc: string; tags: string[]; icon: any; gradient: string;
}
const cards: CapCard[] = [
  { path: '/edu/question',   title: '题库管理',  desc: '题目录入、批量导入、多维度筛选与审核', tags: ['CRUD', '导入', '审核'], icon: Notebook,      gradient: 'linear-gradient(135deg, #5B8FF9, #5AD8A6)' },
  { path: '/edu/paper',     title: 'AI 组卷',   desc: '根据知识点、难度、题型智能生成试卷',   tags: ['AI', '自动出题'],    icon: MagicStick,    gradient: 'linear-gradient(135deg, #9270CA, #5B8FF9)' },
  { path: '/edu/marking',   title: 'AI 阅卷',   desc: '主观题自动批改，客观题秒级判分',            tags: ['异步', 'AI'],          icon: Reading,        gradient: 'linear-gradient(135deg, #FF9D4D, #F6BD16)' },
  { path: '/edu/knowledge', title: '知识库',     desc: '知识点树形管理 + 文档向量检索',             tags: ['树形', '语义检索'],   icon: DataAnalysis,   gradient: 'linear-gradient(135deg, #5AD8A6, #5B8FF9)' },
  { path: '/edu/wrongbook', title: '错题库',     desc: '错题自动收集，复习卷与掌握度跟踪',          tags: ['聚合', '复习'],      icon: WarningIcon,    gradient: 'linear-gradient(135deg, #F6BD16, #FF9D4D)' },
  { path: '/edu/exam',     title: '考试管理',   desc: '考试创建、班级分发、阅卷闭环',              tags: ['CRUD', '闭环'],     icon: Document,       gradient: 'linear-gradient(135deg, #6DC8EC, #5B8FF9)' },
];

const go = (path: string) => { void router.push(path); };

onMounted(() => { void loadHealth(); void loadDashboard(); });
</script>

<style scoped>
/* ================================================
   科技风 Hero
   ================================================ */
.home-page {
  min-height: 100%;
  padding: 0 0 32px;
  background: var(--el-bg-color-page, var(--el-bg-color));
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 36px 28px 28px;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1f3a 50%, #24243e 100%);
  border-bottom: 1px solid rgba(91, 143, 249, 0.15);
}

/* 背景网格线 */
.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(91, 143, 249, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(91, 143, 249, 0.07) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #5b8ff9;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.hero__badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #5b8ff9;
  box-shadow: 0 0 6px #5b8ff9;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #5b8ff9; }
  50%       { opacity: 0.5; box-shadow: 0 0 12px #5b8ff9; }
}

.hero__title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-shadow: 0 0 30px rgba(91, 143, 249, 0.4);
}
.hero__sub {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}

/* AI 状态灯 */
.hero__ai {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(91, 143, 249, 0.2);
  background: rgba(91, 143, 249, 0.08);
  backdrop-filter: blur(8px);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}
.hero__ai.is-warn {
  border-color: rgba(245, 108, 108, 0.3);
  background: rgba(245, 108, 108, 0.08);
}

.ai-pulse {
  position: absolute;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(91, 143, 249, 0.4);
  animation: expand-ring 2.5s ease-out infinite;
  pointer-events: none;
}
.ai-pulse--delay { animation-delay: 0.8s; }
.ai-pulse--delay2 { animation-delay: 1.6s; }
@keyframes expand-ring {
  0%   { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

.ai-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #5b8ff9;
  box-shadow: 0 0 8px #5b8ff9;
  flex-shrink: 0;
}
.is-warn .ai-dot { background: #f56c6c; box-shadow: 0 0 8px #f56c6c; }

.ai-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}
.ai-model {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  border-left: 1px solid rgba(255,255,255,0.15);
  padding-left: 8px;
  margin-left: 2px;
}
.ai-config-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}
.ai-config-btn:hover {
  color: #fff;
  background: rgba(91, 143, 249, 0.2);
  border-color: rgba(91, 143, 249, 0.4);
}

/* ================================================
   仪表板数据卡（玻璃态）
   ================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  padding: 20px 24px 0;
}
.stat-card {
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(91, 143, 249, 0.12);
  border-color: rgba(91, 143, 249, 0.25);
}

/* 左侧色条 */
.stat-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: v-bind('stats[0]?.bg');
}
.stat-card.is-green::before { background: var(--el-color-success); }
.stat-card.is-orange::before { background: var(--el-color-warning); }
.stat-card.is-red::before { background: var(--el-color-danger); }

.stat-card__icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-card__body { flex: 1; min-width: 0; }
.stat-card__title { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 2px; }
.stat-card__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.1;
  font-family: var(--el-font-family);
  font-variant-numeric: tabular-nums;
}
.stat-card__hint { font-size: 11px; color: var(--el-text-color-placeholder); margin-top: 2px; }

/* 底部进度条 */
.stat-card__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(to right, v-bind('stats[0]?.bg') var(--pct), var(--el-border-color-extra-light) var(--pct));
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ================================================
   分组标题
   ================================================ */
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 24px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}
.section-title__line {
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

/* ================================================
   能力入口卡片（科技感增强 v2）
   ================================================ */
.cap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  padding: 0 24px;
}

.cap-card {
  position: relative;
  overflow: hidden;
  /* 多层叠加背景：毛玻璃底 + 悬浮态主题色光晕 */
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--el-color-primary) 12%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--el-color-primary) 8%, transparent) 0%, transparent 50%),
    color-mix(in srgb, var(--el-bg-color) 60%, var(--el-color-primary) 3%);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border-radius: 16px;
  padding: 18px 18px 16px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  /* 透明边框占位，伪元素实现动态渐变描边 */
  border: 1px solid transparent;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
}

/* ---- 动态渐变边框（旋转流光效果）---- */
.cap-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    color-mix(in srgb, var(--el-color-primary) 60%, transparent) 60deg,
    color-mix(in srgb, var(--el-color-primary) 30%, transparent) 120deg,
    transparent 180deg,
    color-mix(in srgb, var(--el-color-primary) 60%, transparent) 240deg,
    color-mix(in srgb, var(--el-color-primary) 30%, transparent) 300deg,
    transparent 360deg
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  pointer-events: none;
  animation: border-flow 4s linear infinite paused;
  transition: opacity 0.3s ease;
}

/* 悬浮时：边框显现 + 旋转流动 */
.cap-card:hover::before {
  opacity: 1;
  animation-play-state: running;
}

@keyframes border-flow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ---- 悬浮态整体效果 ---- */
.cap-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow:
    0 0 32px color-mix(in srgb, var(--el-color-primary) 30%, transparent),
    0 0 64px color-mix(in srgb, var(--el-color-primary) 15%, transparent),
    0 20px 48px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

/* ---- 焦点态 ---- */
.cap-card:focus-visible {
  outline: none;
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 0 0 2px var(--el-color-primary),
    0 0 24px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

/* ---- 四角科技装饰（L 形）---- */
.cap-card__corner {
  position: absolute;
  inset: 10px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 四角用伪元素分段绘制：top-left / top-right / bottom-left / bottom-right */
.cap-card__corner::before,
.cap-card__corner::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    /* 左上角：横线 + 竖线 */
    linear-gradient(to right, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 0 0 / 14px 1px no-repeat,
    linear-gradient(to bottom, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 0 0 / 1px 14px no-repeat,
    /* 右上角 */
    linear-gradient(to right, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 100% 0 / 14px 1px no-repeat,
    linear-gradient(to bottom, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 100% 0 / 1px 14px no-repeat,
    /* 右下角 */
    linear-gradient(to right, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 100% 100% / 14px 1px no-repeat,
    linear-gradient(to bottom, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 100% 100% / 1px 14px no-repeat,
    /* 左下角 */
    linear-gradient(to right, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 0 100% / 14px 1px no-repeat,
    linear-gradient(to bottom, color-mix(in srgb, var(--el-color-primary) 70%, transparent) 2px, transparent 2px) 0 100% / 1px 14px no-repeat;
}
.cap-card:hover .cap-card__corner { opacity: 1; }

/* ---- 顶部扫描光 ---- */
.cap-card__scan {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 扫描光条：从左滑到右 */
.cap-card__scan::after {
  content: "";
  position: absolute;
  top: 0; left: -60%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.9) 50%,
    transparent 100%
  );
  animation: scan-line 2.5s ease-in-out infinite;
  animation-play-state: paused;
}

.cap-card:hover .cap-card__scan {
  opacity: 1;
}
.cap-card:hover .cap-card__scan::after {
  animation-play-state: running;
}

@keyframes scan-line {
  0%   { left: -60%; }
  100% { left: 120%; }
}

.cap-card__icon {
  width: 52px; height: 52px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cap-card__body { flex: 1; min-width: 0; }
.cap-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.cap-card__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
}

.cap-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cap-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

.cap-card__arrow {
  position: absolute;
  right: 14px; top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-placeholder);
  font-size: 16px;
  transition: transform 0.2s, color 0.2s;
}
.cap-card:hover .cap-card__arrow {
  transform: translateY(-50%) translateX(3px);
  color: var(--el-color-primary);
}

/* ================================================
   无障碍
   ================================================ */
@media (prefers-reduced-motion: reduce) {
  .hero__badge-dot, .ai-pulse, .stat-card__bar { animation: none; }
  .cap-card, .stat-card { transition: none; }
  .cap-card:hover, .stat-card:hover { transform: none; }
  .cap-card:hover .cap-card__arrow { transform: translateY(-50%); }
}
</style>
