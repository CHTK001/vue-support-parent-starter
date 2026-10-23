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
        :class="s.loading ? 'is-loading' : 'is-' + s.tone"
      >
        <div class="stat-card__icon" :style="{ background: s.bg }">
          <el-icon :size="22"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__title">{{ s.label }}</div>
          <div class="stat-card__value">{{ s.loading ? '—' : s.value.toLocaleString() }}</div>
          <div class="stat-card__hint">{{ s.hint }}</div>
        </div>
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
        <div class="cap-card__accent" :style="{ background: card.gradient }" />
        <div class="cap-card__icon" :style="{ background: card.gradient }">
          <el-icon :size="28"><component :is="card.icon" /></el-icon>
        </div>
        <div class="cap-card__body">
          <div class="cap-card__title">{{ card.title }}</div>
          <div class="cap-card__desc">{{ card.desc }}</div>
          <div class="cap-card__tags">
            <span v-for="t in card.tags" :key="t" class="cap-tag">{{ t }}</span>
          </div>
        </div>
        <div class="cap-card__arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowRight,
  Document,
  DataAnalysis,
  MagicStick,
  Notebook,
  Reading,
  Setting,
  Tickets,
  User,
  Warning,
} from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";

const router = useRouter();

interface Health {
  available: boolean;
  provider: string;
  model: string;
}
const health = reactive<Health>({ available: false, provider: "", model: "" });

interface DashStat {
  label: string;
  value: number;
  hint: string;
  icon: any;
  bg: string;
  loading: boolean;
  tone: "blue" | "green" | "orange" | "red";
}
const stats = reactive<DashStat[]>([
  { label: "题目总数", value: 0, hint: "题库", icon: Notebook, bg: "var(--el-color-primary)", loading: true, tone: "blue" },
  { label: "学生总数", value: 0, hint: "已绑定", icon: User, bg: "var(--el-color-success)", loading: true, tone: "green" },
  { label: "考试总数", value: 0, hint: "全部", icon: Document, bg: "var(--el-color-warning)", loading: true, tone: "orange" },
  { label: "待阅卷", value: 0, hint: "进行中", icon: Tickets, bg: "var(--el-color-danger)", loading: true, tone: "red" },
]);

async function loadDashboard() {
  stats.forEach((s) => (s.loading = true));
  try {
    const [qr, sr, er, mr] = await Promise.allSettled([
      eduaiApi.pageQuestions({ pageSize: 1 }),
      eduaiApi.listStudents(),
      eduaiApi.pageExams({ pageSize: 1 }),
      eduaiApi.teacherMarkingTasks(),
    ]);
    if (qr.status === "fulfilled") stats[0].value = qr.value.total ?? qr.value.data.length ?? 0;
    if (sr.status === "fulfilled") stats[1].value = sr.value.length ?? 0;
    if (er.status === "fulfilled") stats[2].value = er.value.total ?? er.value.data.length ?? 0;
    if (mr.status === "fulfilled") stats[3].value = mr.value.length ?? 0;
  } finally {
    stats.forEach((s) => (s.loading = false));
  }
}

async function loadHealth() {
  try {
    const res = await eduaiApi.aiCapability();
    health.available = res?.available === true;
    health.provider = res?.provider ?? "";
    health.model = res?.model ?? "";
  } catch {
    health.available = false;
  }
}

interface CapCard {
  path: string;
  title: string;
  desc: string;
  tags: string[];
  icon: any;
  gradient: string;
}
const cards: CapCard[] = [
  { path: "/edu/question", title: "题库管理", desc: "题目录入、批量导入、多维度筛选与审核", tags: ["CRUD", "导入", "审核"], icon: Notebook, gradient: "linear-gradient(135deg, #5B8FF9, #5AD8A6)" },
  { path: "/edu/paper", title: "AI 组卷", desc: "根据知识点、难度、题型智能生成试卷", tags: ["AI", "自动出题"], icon: MagicStick, gradient: "linear-gradient(135deg, #9270CA, #5B8FF9)" },
  { path: "/edu/marking", title: "AI 阅卷", desc: "主观题自动批改，客观题秒级判分", tags: ["异步", "AI"], icon: Reading, gradient: "linear-gradient(135deg, #FF9D4D, #F6BD16)" },
  { path: "/edu/knowledge", title: "知识库", desc: "知识点树形管理 + 文档向量检索", tags: ["树形", "语义检索"], icon: DataAnalysis, gradient: "linear-gradient(135deg, #5AD8A6, #5B8FF9)" },
  { path: "/edu/wrongbook", title: "错题库", desc: "错题自动收集，复习卷与掌握度跟踪", tags: ["聚合", "复习"], icon: Warning, gradient: "linear-gradient(135deg, #F6BD16, #FF9D4D)" },
  { path: "/edu/exam", title: "考试管理", desc: "考试创建、班级分发、阅卷闭环", tags: ["CRUD", "闭环"], icon: Document, gradient: "linear-gradient(135deg, #6DC8EC, #5B8FF9)" },
];

const go = (path: string) => {
  void router.push(path);
};

onMounted(() => {
  void loadHealth();
  void loadDashboard();
});
</script>

<style scoped>
.home-page {
  min-height: 100%;
  padding: 0 0 32px;
  background: var(--el-bg-color-page, var(--el-bg-color));
}

/* ---------- Hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  padding: 36px 28px 28px;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1f3a 50%, #24243e 100%);
  border-bottom: 1px solid rgba(91, 143, 249, 0.15);
}
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
  letter-spacing: 0;
  color: #5b8ff9;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.hero__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5b8ff9;
  box-shadow: 0 0 6px #5b8ff9;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%,
  100% { opacity: 1; box-shadow: 0 0 6px #5b8ff9; }
  50% { opacity: 0.5; box-shadow: 0 0 12px #5b8ff9; }
}
.hero__title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0;
  line-height: 1.2;
  text-shadow: 0 0 30px rgba(91, 143, 249, 0.4);
}
.hero__sub {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(91, 143, 249, 0.4);
  animation: expand-ring 2.5s ease-out infinite;
  pointer-events: none;
}
.ai-pulse--delay { animation-delay: 0.8s; }
.ai-pulse--delay2 { animation-delay: 1.6s; }
@keyframes expand-ring {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
.ai-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5b8ff9;
  box-shadow: 0 0 8px #5b8ff9;
  flex-shrink: 0;
}
.is-warn .ai-dot { background: #f56c6c; box-shadow: 0 0 8px #f56c6c; }
.ai-label { font-weight: 600; color: rgba(255, 255, 255, 0.9); }
.ai-model {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  padding-left: 8px;
  margin-left: 2px;
}
.ai-config-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
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

/* ---------- Stats ---------- */
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
.stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: var(--el-color-primary);
}
.stat-card.is-green::before { background: var(--el-color-success); }
.stat-card.is-orange::before { background: var(--el-color-warning); }
.stat-card.is-red::before { background: var(--el-color-danger); }
.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-card__body {
  flex: 1;
  min-width: 0;
}
.stat-card__title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}
.stat-card__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.stat-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

/* ---------- Section ---------- */
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 24px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}
.section-title__line {
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

/* ---------- Cap cards ---------- */
.cap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  padding: 0 24px;
}
.cap-card {
  position: relative;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 18px 18px 16px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
}
.cap-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(91, 143, 249, 0.15);
  border-color: rgba(91, 143, 249, 0.3);
}
.cap-card:focus-visible {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 15%, transparent);
}
.cap-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 14px 14px 0 0;
  opacity: 0.8;
}
.cap-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.cap-card__body {
  flex: 1;
  min-width: 0;
}
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
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-placeholder);
  font-size: 16px;
  transition: transform 0.2s, color 0.2s;
}
.cap-card:hover .cap-card__arrow {
  transform: translateY(-50%) translateX(3px);
  color: var(--el-color-primary);
}

/* ---------- Responsive ---------- */
@media (max-width: 768px) {
  .hero {
    padding: 28px 18px 22px;
  }
  .hero__content {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  .hero__title {
    font-size: 24px;
  }
  .stats-row {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    padding: 16px 14px 0;
  }
  .stat-card {
    padding: 12px;
    gap: 10px;
  }
  .stat-card__value {
    font-size: 22px;
  }
  .section-title {
    padding: 22px 14px 12px;
  }
  .cap-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 0 14px;
  }
  .cap-card {
    padding: 14px 14px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__badge-dot,
  .ai-pulse {
    animation: none;
  }
  .cap-card,
  .stat-card {
    transition: none;
  }
}
</style>