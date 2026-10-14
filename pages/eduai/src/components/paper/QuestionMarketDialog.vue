<!--
  QuestionMarketDialog —— 题库市场弹框（组卷页内嵌弹出，非独立菜单页）

  交互：
    - 右侧市场：检索（关键词 / 学科 / 学段 / 年级 / 难度 / 题型）+ 本地分页 + 复选框多选；
      勾选后点「加入购物车」，先播飞入动画（选中行 → 左侧购物车面板），
      再 emit('picked')，**弹窗不关闭**，可继续挑题（离开组卷页前的连续挑选场景）。
    - 左侧购物车：与组卷页右栏同一份数据（usePaperCart 按 paperId 持久化），
      这里只读展示 + 改分值 / 移除 / 清空，全部经 emit 交回组卷页落库，
      不在弹窗内复制一份购物车状态（避免两个实例互相覆盖）。

  数据来源走 eduaiApi.pageQuestions。
  动画为纯 CSS transition + requestAnimationFrame，不引入新依赖。
-->
<template>
  <ReDialog
    :model-value="props.modelValue"
    width="1180px"
    top="5vh"
    append-to-body
    destroy-on-close
    class="question-market-dialog"
    @update:model-value="onVisibleChange"
    @closed="onClosed"
  >
    <template #header>
      <div class="qmd-head">
        <span class="qmd-head__title">
          <el-icon class="qmd-head__icon"><ShoppingCart /></el-icon>
          题库市场
        </span>
        <span class="qmd-head__sub">
          <el-tag v-if="paperId" type="primary" effect="light" size="small">试卷 #{{ paperId }}</el-tag>
          <el-tag v-else type="info" effect="light" size="small">临时购物车</el-tag>
          <span class="qmd-head__hint">右侧挑题加入左侧购物车；关闭后回到组卷页继续组卷</span>
        </span>
      </div>
    </template>

    <!-- ==================== 主体：左购物车 / 右市场 ==================== -->
    <div class="qmd-body">
      <!-- 左：组卷购物车（只读展示 + 改分值/移除/清空，写操作全部 emit 回组卷页） -->
      <section ref="cartPanelRef" class="qmd-cart">
        <header class="qmd-cart__head">
          <span class="qmd-cart__title">
            组卷购物车
            <span class="qmd-cart__count">{{ cartItems.length }}</span>
          </span>
          <el-button link type="danger" size="small" :disabled="!cartItems.length" @click="emit('clearCart')">
            清空
          </el-button>
        </header>

        <div v-if="!cartItems.length" class="qmd-cart__empty">
          <el-empty :image-size="64" description="购物车为空，去右侧市场挑题" />
        </div>

        <div v-else class="qmd-cart__list">
          <div v-for="item in cartItems" :key="item.questionId" class="qmd-cart__row">
            <div class="qmd-cart__row-head">
              <el-tag type="info" size="small">{{ typeLabel(item.type) }}</el-tag>
              <el-button link type="danger" size="small" @click="emit('removeFromCart', item.questionId)">
                移除
              </el-button>
            </div>
            <div class="qmd-cart__row-stem" v-html="renderMathSummary(item.stem, 56) || '（题干为空）'" />
            <div class="qmd-cart__row-foot">
              <span class="qmd-cart__row-label">分值</span>
              <ReInputNumber
                :model-value="item.score"
                :min="1"
                :max="100"
                size="small"
                controls-position="right"
                @update:model-value="(v: number | undefined) => emit('setCartScore', item.questionId, Number(v) || 1)"
              />
            </div>
          </div>
        </div>

        <footer v-if="cartItems.length" class="qmd-cart__foot">合计 {{ cartItems.length }} 题 / {{ cartTotalScore }} 分</footer>
      </section>

      <!-- 右：市场（检索 / 多选 / 加入购物车） -->
      <section class="qmd-market">
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

        <!-- 题目列表（复选框多选） -->
        <div ref="listRef" v-loading="loading" class="qmd-list">
          <div v-for="q in rows" :key="q.questionId" class="qmd-row">
            <span :ref="(el) => setRowRef(q.questionId, el)" class="qmd-row__check">
              <el-checkbox :model-value="selectedIds.includes(q.questionId)" @change="toggleSelect(q.questionId)" />
            </span>
            <div class="qmd-row__body">
              <div class="qmd-row__head">
                <el-tag type="info">{{ typeLabel(q.questionType) }}</el-tag>
                <span class="qmd-diff" :class="diffClass(q.questionDifficulty)">{{ diffLabel(q.questionDifficulty) }}</span>
                <span class="qmd-row__subject">{{ q.questionSubject || "未标学科" }}</span>
                <span v-if="q.questionGrade" class="qmd-row__grade">{{ q.questionGrade }}</span>
                <el-tag v-if="inCart(q.questionId)" type="success" size="small" effect="plain">已在购物车</el-tag>
              </div>
              <div class="qmd-row__stem" v-html="renderMathSummary(q.questionStem, 72) || '（题干为空）'" />
            </div>
          </div>
          <el-empty v-if="!loading && !rows.length" :image-size="72" description="没有匹配的题目" />
        </div>

        <!-- 市场底部：选择统计 + 分页 + 加入购物车 -->
        <div class="qmd-market__foot">
          <div class="qmd-market__foot-left">
            <span class="qmd-foot__selected">已选 {{ selectedIds.length }} 题</span>
            <el-button link :disabled="!selectedIds.length" @click="clearSelection">清空选择</el-button>
          </div>
          <div class="qmd-market__foot-right">
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
      </section>
    </div>

    <template #footer>
      <div class="qmd-dialog-foot">
        <span class="qmd-dialog-foot__tip">购物车与组卷页右栏实时同步（按试卷持久化），挑完点右侧关闭继续组卷</span>
        <ReButton type="primary" @click="closeDialog">完成，返回组卷</ReButton>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * QuestionMarketDialog —— 题库市场弹框。
 *
 * 选中题目后点「加入购物车」：先播飞入动画，动画结束抛出 picked 事件，
 * 由调用方（组卷页）写入购物车；弹窗保持打开，支持连续挑题。
 * 购物车数据归组卷页所有（usePaperCart 单实例），本组件只读展示 + emit 写操作，
 * 避免同页两份购物车实例互相覆盖（localStorage 后写覆盖先写）。
 */
import { message } from "@repo/core";
import { computed, reactive, ref, watch } from "vue";

import { Search, ShoppingCart } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReInputNumber from "@repo/ui/re-input-number";
import { eduaiApi } from "../../api/eduaiApi";
import type { MarketQuestion } from "../../api/types";
import { renderMathSummary } from "../../utils/mathText";
import ReDialog from "@repo/ui/re-dialog";
import type { CartItem } from "../../composables/usePaperCart";

defineOptions({ name: "QuestionMarketDialog" });

const props = withDefaults(
  defineProps<{
    /** 弹框显隐（v-model） */
    modelValue: boolean;
    /** 目标试卷标识；为空表示临时购物车 */
    paperId?: number | null;
    /** 组卷页购物车条目（只读展示；写操作走 emit，不在弹窗内复制状态） */
    cartItems: CartItem[];
    /** 打开时预填的检索学科（来自组卷页卷头） */
    initialSubject?: string;
    /** 打开时预填的检索学段（中文标签或码值均可，由后端口径过滤） */
    initialGradeLevel?: string;
    /** 打开时预填的检索年级 */
    initialGrade?: string;
  }>(),
  { paperId: null, initialSubject: "", initialGradeLevel: "", initialGrade: "" },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "picked", list: MarketQuestion[]): void;
  (e: "removeFromCart", questionId: number): void;
  (e: "setCartScore", questionId: number, score: number): void;
  (e: "clearCart"): void;
}>();

/* ==================== 常量（与 PaperComposeView 题库市场一致） ==================== */

/** 学段词表（与后端 gradeLevels 的 value 码值一致，下拉 value 绑 code） */
const GRADE_LEVELS = [
  { code: "PRIMARY", label: "小学" },
  { code: "JUNIOR", label: "初中" },
  { code: "SENIOR", label: "高中" },
  { code: "UNIVERSITY", label: "大学" },
  { code: "OTHER", label: "其他" },
];

/** 年级行里的 gradeLevel 存的是中文标签（小学/初中/…），转成码值再与下拉的 code 比较 */
const GRADE_LEVEL_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  GRADE_LEVELS.map((g) => [g.label, g.code]),
);

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

/** 用户是否动过检索条件；动过之后再次打开不再用组卷页卷头预填覆盖 */
const filtersTouched = ref(false);

const loading = ref(false);
const flying = ref(false);
const marketAll = ref<MarketQuestion[]>([]);
const selectedIds = ref<number[]>([]);
const page = ref(1);
const pageSize = ref(10);
const subjectOptions = ref<{ label: string; value: string }[]>([]);
const gradeMeta = ref<{ gradeName?: string; gradeLevel?: string | null }[]>([]);

const cartPanelRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
/** 当前页各题复选框容器：questionId → 元素（仅用于飞入动画取起点） */
const rowRefs = new Map<number, HTMLElement>();

/** 年级候选项跟随学段联动：年级行的 gradeLevel 是中文标签，下拉选的是码值，两边转码值比较 */
const gradeOptions = computed(() => {
  const level = filters.gradeLevel;
  return gradeMeta.value
    .filter((g) => {
      if (!g.gradeName) {
        return false;
      }
      if (!level) {
        return true;
      }
      if (!g.gradeLevel) {
        return true;
      }
      return (GRADE_LEVEL_LABEL_TO_CODE[g.gradeLevel] ?? g.gradeLevel) === level;
    })
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

/** 购物车合计分值（展示用，真正的购物车状态在组卷页） */
const cartTotalScore = computed(() => props.cartItems.reduce((sum, item) => sum + (item.score || 0), 0));

/** 某题是否已在购物车（市场行角标，避免重复挑题） */
const inCart = (questionId: number): boolean => props.cartItems.some((item) => item.questionId === questionId);

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
    message.error("题库加载失败: " + errorText(e));
  } finally {
    loading.value = false;
  }
}

function runSearch(): void {
  filtersTouched.value = true;
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
};

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
 * 播放入场动画：从选中复选框位置飞向左侧购物车面板。
 *
 * @returns 动画结束（或被跳过）后 resolve
 */
function playFlyAnimation(): Promise<void> {
  const targetRect = cartPanelRef.value?.getBoundingClientRect();
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
  const ty = targetRect.top + Math.min(targetRect.height / 2, 80);
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

/**
 * 加入购物车：播飞入动画 → emit picked（组卷页落库）→ 清空勾选。
 *
 * <p>与旧版的区别：不再关闭弹窗。市场改成组卷页内嵌弹窗后，
 * 「关弹窗」意味着挑选中断，这里改为连续挑题模式，
 * 真正的关闭走页脚「完成，返回组卷」或右上角关闭。</p>
 */
async function addToCart(): Promise<void> {
  if (flying.value) {
    return;
  }
  const picked = marketAll.value.filter((q) => selectedIds.value.includes(q.questionId));
  if (!picked.length) {
    message.warning("请先勾选题目");
    return;
  }
  flying.value = true;
  try {
    await playFlyAnimation();
    emit("picked", picked);
    selectedIds.value = [];
  } finally {
    flying.value = false;
  }
}

/** 页脚「完成，返回组卷」：关闭弹窗，回组卷页继续操作 */
function closeDialog(): void {
  emit("update:modelValue", false);
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

// 打开弹框时：按组卷页卷头预填检索条件（用户动过之后不覆盖）+ 加载维度与题库
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return;
    }
    if (!filtersTouched.value) {
      filters.subject = props.initialSubject || "";
      // 卷头的学段是中文标签（初中），下拉绑的是码值（JUNIOR）；已是码值时查表落空原样传入
      filters.gradeLevel = GRADE_LEVEL_LABEL_TO_CODE[props.initialGradeLevel] ?? props.initialGradeLevel;
      filters.grade = props.initialGrade || "";
    }
    void ensureDimensions();
    void loadMarket();
  },
);
</script>

<style scoped>
/* ==================== 头部 ==================== */
.qmd-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 28px;
}
.qmd-head__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.qmd-head__icon {
  color: var(--el-color-primary);
}
.qmd-head__sub {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.qmd-head__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ==================== 主体两栏：左购物车 / 右市场 ==================== */
.qmd-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

/* ---------- 左：购物车 ---------- */
.qmd-cart {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  /* 列表区内部滚动；整体高度随右栏市场区，不无限拉高弹窗 */
  max-height: 56vh;
}
.qmd-cart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.qmd-cart__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.qmd-cart__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
.qmd-cart__empty {
  padding: 24px 0;
}
.qmd-cart__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px;
}
.qmd-cart__row {
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.qmd-cart__row:last-child {
  border-bottom: none;
}
.qmd-cart__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qmd-cart__row-stem {
  margin: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-word;
}
.qmd-cart__row-stem :deep(.katex) {
  font-size: 1em;
}
.qmd-cart__row-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qmd-cart__row-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.qmd-cart__foot {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ---------- 右：市场 ---------- */
.qmd-market {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qmd-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qmd-filters__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.qmd-filters__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qmd-list {
  flex: 1;
  min-height: 200px;
  /* 列表区内部滚动，footer 常驻可见；56vh 与左栏购物车对齐 */
  max-height: 40vh;
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
.qmd-market__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.qmd-market__foot-left,
.qmd-market__foot-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.qmd-foot__selected {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ==================== 弹窗页脚 ==================== */
.qmd-dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.qmd-dialog-foot__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   本组件唯一的动效是 .qmd-fly-dot（飞入圆点），已在下面的全局 style 块里降级处理，
   它的元素由 document.createElement 创建、不带 scoped 属性，故规则不能放在这里。 */
@media (prefers-reduced-motion: reduce) {
  .qmd-row,
  .qmd-cart__row {
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
