<!--
  QuestionMarketDialog —— 题库市场弹框

  交互：
    - 检索（关键词 / 学科 / 学段 / 年级 / 难度 / 题型）+ 本地分页；
    - 勾选多题后点「加入购物车」，先播飞入动画（选中复选框 → 弹框右上角购物车图标），
      动画结束再 emit('picked', 选中题目) 并关闭弹框。

  数据来源统一走 eduaiApi.pageQuestions（与 PaperComposeView 的市场逻辑一致）。
  动画为纯 CSS transition + requestAnimationFrame，不引入新依赖。
-->
<template>
  <el-dialog
    :model-value="props.modelValue"
    width="880px"
    top="6vh"
    append-to-body
    destroy-on-close
    class="question-market-dialog"
    @update:model-value="onVisibleChange"
    @closed="onClosed"
  >
    <template #header>
      <div class="qmd-head">
        <span class="qmd-head__title">
          <span ref="cartIconRef" class="qmd-head__cart" title="购物车">
            <el-icon><ShoppingCart /></el-icon>
            <span v-if="selectedIds.length" class="qmd-head__badge">{{ selectedIds.length }}</span>
          </span>
          题库市场
        </span>
     
      </div>
    </template>

    <!-- 检索条件 -->
    <div class="qmd-filters">
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="关键词（题干 / 学科）"
        :prefix-icon="Search"
        @keyup.enter="runSearch"
        @clear="runSearch"
      />
      <div class="qmd-filters__grid">
        <el-select v-model="filters.subject" clearable filterable placeholder="学科" @change="runSearch">
          <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="filters.gradeLevel" clearable placeholder="学段" @change="onGradeLevelChange">
          <el-option v-for="lv in GRADE_LEVELS" :key="lv.code" :label="lv.label" :value="lv.code" />
        </el-select>
        <el-select v-model="filters.grade" clearable placeholder="年级" @change="runSearch">
          <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
        </el-select>
        <el-select v-model="filters.difficulty" clearable placeholder="难度" @change="runSearch">
          <el-option v-for="d in DIFFICULTIES" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <el-select v-model="filters.type" clearable placeholder="题型" @change="runSearch">
          <el-option v-for="t in QUESTION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <div class="qmd-filters__actions">
          <ReButton type="primary" icon="Search" @click="runSearch">检索</ReButton>
          <ReButton icon="RefreshLeft" @click="resetSearch">重置</ReButton>
        </div>
      </div>
    </div>

    <!-- 题目列表（左侧复选框多选） -->
    <div ref="listRef" v-loading="loading" class="qmd-list">
      <div v-for="q in rows" :key="q.questionId" class="qmd-row">
        <span :ref="(el) => setRowRef(q.questionId, el)" class="qmd-row__check">
          <el-checkbox :model-value="selectedIds.includes(q.questionId)" @change="toggleSelect(q.questionId)" />
        </span>
        <div class="qmd-row__body">
          <div class="qmd-row__head">
            <el-tag  type="info">{{ typeLabel(q.questionType) }}</el-tag>
            <span class="qmd-diff" :class="diffClass(q.questionDifficulty)">{{ diffLabel(q.questionDifficulty) }}</span>
            <span class="qmd-row__subject">{{ q.questionSubject || "未标学科" }}</span>
            <span v-if="q.questionGrade" class="qmd-row__grade">{{ q.questionGrade }}</span>
          </div>
          <div class="qmd-row__stem" v-html="renderMathSummary(q.questionStem, 72) || '（题干为空）'" />
        </div>
      </div>
      <el-empty v-if="!loading && !rows.length" :image-size="72" description="没有匹配的题目" />
    </div>

    <template #footer>
      <div class="qmd-foot">
        <div class="qmd-foot__left">
          <span class="qmd-foot__selected">已选 {{ selectedIds.length }} 题</span>
          <el-button link :disabled="!selectedIds.length" @click="clearSelection">清空选择</el-button>
        </div>
        <div class="qmd-foot__right">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next"
            small
            background
          />
          <ReButton
            type="primary"
            icon="ShoppingCart"
            :loading="flying"
            :disabled="!selectedIds.length"
            @click="addToCart"
          >
            加入购物车
          </ReButton>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * QuestionMarketDialog —— 题库市场弹框
 *
 * 选中题目后点「加入购物车」：先播飞入动画，动画结束再抛出 picked 事件，
 * 由调用方（组卷页）决定如何写入购物车 / 试卷。
 */
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Search, ShoppingCart } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import { eduaiApi } from "../../api/eduaiApi";
import type { MarketQuestion } from "../../api/types";
import { renderMathSummary } from "../../utils/mathText";

defineOptions({ name: "QuestionMarketDialog" });

const props = withDefaults(
  defineProps<{
    /** 弹框显隐（v-model） */
    modelValue: boolean;
    /** 目标试卷标识；为空表示临时购物车 */
    paperId?: number | null;
  }>(),
  { paperId: null },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "picked", list: MarketQuestion[]): void;
}>();

/* ==================== 常量（与 PaperComposeView 题库市场一致） ==================== */

/** 学段词表（与 edu_question 落库值一致） */
const GRADE_LEVELS = [
  { code: "PRIMARY", label: "小学" },
  { code: "JUNIOR", label: "初中" },
  { code: "SENIOR", label: "高中" },
  { code: "UNIVERSITY", label: "大学" },
  { code: "OTHER", label: "其他" },
];

const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "单选题" },
  { value: "MULTIPLE_CHOICE", label: "多选题" },
  { value: "JUDGE", label: "判断题" },
  { value: "FILL", label: "填空题" },
  { value: "SHORT_ANSWER", label: "简答题" },
  { value: "ESSAY", label: "作文" },
];

const DIFFICULTIES = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n} · ${["很易", "较易", "中等", "较难", "很难"][n - 1]}`,
}));

/** 飞入动画时长（毫秒） */
const FLY_DURATION = 420;

/* ==================== 状态 ==================== */

const filters = reactive({
  keyword: "",
  subject: "",
  gradeLevel: "",
  grade: "",
  difficulty: undefined as number | undefined,
  type: "",
});

const loading = ref(false);
const flying = ref(false);
const marketAll = ref<MarketQuestion[]>([]);
const selectedIds = ref<number[]>([]);
const page = ref(1);
const pageSize = ref(10);
const subjectOptions = ref<{ label: string; value: string }[]>([]);
const gradeMeta = ref<{ gradeName?: string; gradeLevel?: string | null }[]>([]);

const cartIconRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
/** 当前页各题复选框容器：questionId → 元素（仅用于飞入动画取起点） */
const rowRefs = new Map<number, HTMLElement>();

/** 年级候选项跟随学段联动 */
const gradeOptions = computed(() => {
  const level = filters.gradeLevel;
  return gradeMeta.value
    .filter((g) => g.gradeName && (!level || !g.gradeLevel || g.gradeLevel === level))
    .map((g) => g.gradeName as string);
});

/** 关键词本地过滤：后端 QuestionQueryDTO 无 keyword 字段 */
const filtered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase();
  if (!kw) {
    return marketAll.value;
  }
  return marketAll.value.filter((q) => {
    const hay = `${q.questionStem || ""} ${q.questionSubject || ""}`.toLowerCase();
    return hay.includes(kw);
  });
});

const total = computed(() => filtered.value.length);

const rows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

/* ==================== 展示小工具 ==================== */

const typeLabel = (t?: string) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t ?? "-";

const diffLabel = (n?: number) => {
  if (n == null) {
    return "-";
  }
  if (n <= 2) {
    return "简单";
  }
  if (n === 3) {
    return "中等";
  }
  return "困难";
};

const diffClass = (n?: number) => {
  if (n == null) {
    return "is-gray";
  }
  if (n <= 2) {
    return "is-green";
  }
  if (n === 3) {
    return "is-orange";
  }
  return "is-red";
};

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/* ==================== 数据加载 ==================== */

let dimensionLoaded = false;

async function ensureDimensions(): Promise<void> {
  if (dimensionLoaded) {
    return;
  }
  try {
    const res = await eduaiApi.dimensionDropdown();
    subjectOptions.value = (res?.subjects ?? [])
      .map((s) => ({ label: s.subjectName ?? "", value: s.subjectName ?? "" }))
      .filter((o) => o.value);
    gradeMeta.value = res?.grades ?? [];
    dimensionLoaded = true;
  } catch {
    subjectOptions.value = [];
    gradeMeta.value = [];
  }
}

async function loadMarket(): Promise<void> {
  loading.value = true;
  try {
    const res = await eduaiApi.pageQuestions({
      pageNum: 1,
      pageSize: 500,
      subject: filters.subject || undefined,
      gradeLevel: filters.gradeLevel || undefined,
      grade: filters.grade || undefined,
      type: filters.type || undefined,
      difficulty: filters.difficulty,
    });
    marketAll.value = res?.data ?? res?.records ?? [];
  } catch (e) {
    marketAll.value = [];
    ElMessage.error("题库加载失败: " + errorText(e));
  } finally {
    loading.value = false;
  }
}

function runSearch(): void {
  page.value = 1;
  rowRefs.clear();
  void loadMarket();
}

function resetSearch(): void {
  filters.keyword = "";
  filters.subject = "";
  filters.gradeLevel = "";
  filters.grade = "";
  filters.difficulty = undefined;
  filters.type = "";
  runSearch();
}

function onGradeLevelChange(): void {
  filters.grade = "";
  runSearch();
}

/* ==================== 多选 ==================== */

function toggleSelect(id: number): void {
  const index = selectedIds.value.indexOf(id);
  if (index >= 0) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function clearSelection(): void {
  selectedIds.value = [];
}

/** 分页切换时清理旧的复选框引用，避免动画取到已卸载的节点 */
watch(page, () => {
  rowRefs.clear();
});

/** 模板 ref 回填：只保留真实 DOM 元素 */
function setRowRef(id: number, el: unknown): void {
  if (el instanceof HTMLElement) {
    rowRefs.set(id, el);
  } else {
    rowRefs.delete(id);
  }
}

/* ==================== 飞入动画（纯 CSS transition + rAF） ==================== */

/** 创建一个 fixed 定位的飞入小圆点 */
function createFlyDot(x: number, y: number): HTMLElement {
  const dot = document.createElement("span");
  dot.className = "qmd-fly-dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  document.body.appendChild(dot);
  return dot;
}

/**
 * 播放入场动画：从选中复选框位置飞向右上角购物车图标。
 *
 * @returns 动画结束（或被跳过）后 resolve
 */
function playFlyAnimation(): Promise<void> {
  const targetRect = cartIconRef.value?.getBoundingClientRect();
  const sources: { x: number; y: number }[] = [];

  for (const id of selectedIds.value) {
    const el = rowRefs.get(id);
    if (!el) {
      continue;
    }
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) {
      continue;
    }
    sources.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  // 选中项不在当前页时，从列表中心兜底，保证动画可感知
  if (!sources.length && listRef.value) {
    const r = listRef.value.getBoundingClientRect();
    sources.push({ x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 120) });
  }

  if (!sources.length || !targetRect) {
    return Promise.resolve();
  }

  const tx = targetRect.left + targetRect.width / 2;
  const ty = targetRect.top + targetRect.height / 2;
  const dots = sources.map((s) => createFlyDot(s.x, s.y));

  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const dot of dots) {
          const startX = Number.parseFloat(dot.style.left) || 0;
          const startY = Number.parseFloat(dot.style.top) || 0;
          dot.style.transform = `translate3d(${tx - startX}px, ${ty - startY}px, 0) scale(0.25)`;
          dot.style.opacity = "0";
        }
      });
    });
    window.setTimeout(() => {
      for (const dot of dots) {
        dot.remove();
      }
      resolve();
    }, FLY_DURATION + 60);
  });
}

/* ==================== 交互 ==================== */

async function addToCart(): Promise<void> {
  if (flying.value) {
    return;
  }
  const picked = marketAll.value.filter((q) => selectedIds.value.includes(q.questionId));
  if (!picked.length) {
    ElMessage.warning("请先勾选题目");
    return;
  }
  flying.value = true;
  try {
    await playFlyAnimation();
    emit("picked", picked);
    emit("update:modelValue", false);
    selectedIds.value = [];
    page.value = 1;
  } finally {
    flying.value = false;
  }
}

function onVisibleChange(visible: boolean): void {
  emit("update:modelValue", visible);
  if (!visible) {
    rowRefs.clear();
  }
}

function onClosed(): void {
  rowRefs.clear();
}

// 打开弹框时加载维度与题库
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      void ensureDimensions();
      void loadMarket();
    }
  },
);
</script>

<style scoped>
.qmd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 28px;
}
.qmd-head__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.qmd-head__cart {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  /* 购物车圆形底用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 18px;
}
.qmd-head__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-danger);
  color: var(--el-color-white);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}
.qmd-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.qmd-filters__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.qmd-filters__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qmd-list {
  min-height: 240px;
  max-height: 52vh;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}
.qmd-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.qmd-row:last-child {
  border-bottom: none;
}
.qmd-row__check {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}
.qmd-row__body {
  flex: 1;
  min-width: 0;
}
.qmd-row__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.qmd-row__subject,
.qmd-row__grade {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.qmd-row__stem {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.qmd-row__stem :deep(.katex) {
  font-size: 1em;
}
.qmd-diff {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--el-radius-xs, 4px);
  font-size: 12px;
  line-height: 18px;
}
.qmd-diff.is-gray {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.qmd-diff.is-green {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.qmd-diff.is-orange {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
.qmd-diff.is-red {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.qmd-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.qmd-foot__left,
.qmd-foot__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.qmd-foot__selected {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   本组件唯一的动效是 .qmd-fly-dot（飞入圆点），已在下面的全局 style 块里降级处理，
   它的元素由 document.createElement 创建、不带 scoped 属性，故规则不能放在这里。 */
@media (prefers-reduced-motion: reduce) {
  .qmd-head__badge,
  .qmd-row {
    transition: none;
  }
}
</style>

<!-- 飞入圆点由 document.createElement 动态创建，scoped 属性不会附加，故用全局样式 -->
<style>
.qmd-fly-dot {
  position: fixed;
  z-index: 3000;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  /* 飞入圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-primary);
  box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  pointer-events: none;
  opacity: 0.95;
  /* 0.42s 是「刻意慢于微交互」的飞入叙事动画，必须与脚本里的 FLY_DURATION
     （420ms）严格对齐 —— 改短会让圆点先消失后按钮才解除 loading；
     也不并入 --el-transition-duration-fast（0.2s），那样飞行过程根本看不清 */
  transition: transform 0.42s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.42s ease-in;
}

/* 无障碍：关闭飞入圆点。
   不能只写 transition:none —— 那样圆点会停在起点原地约 480ms 才被移除，
   看起来像卡住。直接 display:none 让它从创建起就不可见；
   「正在加入」的反馈由「加入购物车」按钮自身的 :loading="flying" 承担，不会丢。 */
@media (prefers-reduced-motion: reduce) {
  .qmd-fly-dot {
    display: none;
  }
}
</style>
