<!--
  PaperComposeView —— 手动组卷画布

  路由挂载说明（路由注册由另一 Agent 负责，本文件不修改路由文件）：
    本视图应由路由路径 /eduai/paper-compose 挂载，组件名 PaperComposeView。

  布局：
    左栏「题库市场」约 380px（检索 + 多选 + 分页 + 加入试卷）；
    右栏「试卷画布」自适应（工具条 / 页头页脚 / 题目清单拖拽排序 / 多页预览）。

  依赖说明：
    - 拖拽：pages/eduai 未声明任何拖拽库（sortablejs 只在仓库根与 packages/ui 声明），
      按任务约定使用原生 HTML5 drag 事件实现，不新增依赖。
    - 二维码：使用 qrcode（仓库内 packages/theme 与 apps/vue-support-ai-guada 早已在用），
      以题项唯一编号 paperQuestionNo 为内容本地渲染成 PNG dataURL，
      扫码内容即后端 GET /v2/edu/paper/qr/{paperQuestionNo} 的定位凭据。
    - 接口：统一走 src/api/eduaiApi.ts（不另建请求层）。
-->
<template>
  <div class="compose-page">
    <!-- ==================== 左栏：题库市场 ==================== -->
    <aside class="market-panel">
      <el-card shadow="never" class="market-card">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">题库市场</span>
            <span class="panel-head__sub">共 {{ marketTotal }} 题</span>
          </div>
        </template>

        <!-- 检索条件 -->
        <div class="market-filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="关键词（题干 / 学科）"
            :prefix-icon="Search"
            @keyup.enter="runMarketSearch"
            @clear="runMarketSearch"
          />
          <div class="market-filters__grid">
            <el-select v-model="filters.subject" clearable filterable placeholder="学科" @change="runMarketSearch">
              <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-select v-model="filters.gradeLevel" clearable placeholder="学段" @change="onGradeLevelChange">
              <el-option v-for="lv in GRADE_LEVELS" :key="lv.code" :label="lv.label" :value="lv.code" />
            </el-select>
            <el-select v-model="filters.grade" clearable placeholder="年级" @change="runMarketSearch">
              <el-option v-for="g in gradeOptions" :key="g.gradeName" :label="g.gradeName" :value="g.gradeName" />
            </el-select>
            <el-select v-model="filters.difficulty" clearable placeholder="难度" @change="runMarketSearch">
              <el-option v-for="d in DIFFICULTIES" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <el-select v-model="filters.type" clearable placeholder="题型" class="market-filters__span2" @change="runMarketSearch">
              <el-option v-for="t in QUESTION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </div>
          <div class="market-filters__actions">
            <ReButton type="primary" icon="Search" @click="runMarketSearch">检索</ReButton>
            <ReButton icon="RefreshLeft" @click="resetMarketSearch">重置</ReButton>
          </div>
        </div>

        <!-- 题目列表（左侧复选框多选） -->
        <div v-loading="marketLoading" class="market-list">
          <div v-for="q in marketRows" :key="q.questionId" class="market-row">
            <el-checkbox
              :model-value="selectedIds.includes(q.questionId)"
              class="market-row__check"
              @change="toggleMarketSelect(q.questionId)"
            />
            <div class="market-row__body">
              <div class="market-row__head">
                <el-tag size="small" type="info">{{ typeLabel(q.questionType) }}</el-tag>
                <span class="diff-pill" :class="diffClass(q.questionDifficulty)">{{ diffLabel(q.questionDifficulty) }}</span>
                <span class="market-row__subject">{{ q.questionSubject || "未标学科" }}</span>
              </div>
              <div class="market-row__stem" v-html="renderMathSummary(q.questionStem, 64) || '（题干为空）'" />
            </div>
          </div>
          <el-empty v-if="!marketLoading && !marketRows.length" :image-size="64" description="没有匹配的题目" />
        </div>

        <!-- 底部：加入试卷 + 分页 -->
        <div class="market-foot">
          <div class="market-foot__actions">
            <ReButton type="primary" icon="Plus" :disabled="!selectedIds.length" @click="addSelectedToPaper">加入试卷</ReButton>
            <el-button link :disabled="!selectedIds.length" @click="clearSelection">清空选择</el-button>
          </div>
          <div class="market-foot__pager">
            <span class="market-foot__selected">已选 {{ selectedIds.length }} 题</span>
            <el-pagination
              v-model:current-page="marketPage"
              v-model:page-size="marketPageSize"
              :total="marketTotal"
              :page-sizes="[10, 20, 50]"
              layout="sizes, prev, pager, next"
              small
              background
            />
          </div>
        </div>
      </el-card>
    </aside>

    <!-- ==================== 右栏：试卷画布 ==================== -->
    <section class="canvas-panel">
      <!-- 工具条 -->
      <el-card shadow="never" class="canvas-card">
        <div class="toolbar">
          <div class="tool-field tool-field--name">
            <label class="tool-field__label">试卷名称</label>
            <el-input v-model="header.name" maxlength="100" clearable placeholder="输入试卷名称" />
          </div>
          <div class="tool-field">
            <label class="tool-field__label">学科</label>
            <el-select v-model="header.subject" filterable allow-create default-first-option clearable placeholder="学科" style="width: 100%">
              <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
          <div class="tool-field">
            <label class="tool-field__label">学段</label>
            <el-select v-model="header.gradeLevel" clearable placeholder="学段" style="width: 100%">
              <el-option v-for="lv in GRADE_LEVELS" :key="lv.code" :label="lv.label" :value="lv.code" />
            </el-select>
          </div>
          <div class="tool-field">
            <label class="tool-field__label">年级</label>
            <el-select v-model="header.grade" filterable allow-create default-first-option clearable placeholder="年级" style="width: 100%">
              <el-option v-for="g in gradeOptions" :key="g.gradeName" :label="g.gradeName" :value="g.gradeName" />
            </el-select>
          </div>
          <div class="tool-field">
            <label class="tool-field__label">纸张规格</label>
            <el-select v-model="header.pageSize" style="width: 100%">
              <el-option v-for="p in PAPER_SIZE_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </div>
          <div class="tool-field tool-field--orientation">
            <label class="tool-field__label">纸张方向</label>
            <el-radio-group v-model="header.pageOrientation">
              <el-radio-button value="PORTRAIT">纵向</el-radio-button>
              <el-radio-button value="LANDSCAPE">横向</el-radio-button>
            </el-radio-group>
          </div>
          <div class="tool-field">
            <label class="tool-field__label">首页模板</label>
            <el-select v-model="header.template" style="width: 100%">
              <el-option v-for="t in TEMPLATE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </div>
          <div class="tool-field tool-field--score">
            <label class="tool-field__label">总分</label>
            <div class="score-chip" :class="{ 'is-warn': !scoreOk }">
              <el-icon v-if="!scoreOk"><Warning /></el-icon>
              当前 {{ totalScore }} / 100 分
            </div>
          </div>
          <div class="toolbar__actions">
            <ReButton icon="Sort" @click="onDistributeEvenly">均分 100 分</ReButton>
            <ReButton type="primary" icon="DocumentChecked" :loading="saving" @click="onSaveDraft">保存草稿</ReButton>
            <ReButton type="success" icon="Promotion" :loading="publishing" @click="onPublish">发布</ReButton>
          </div>
        </div>

        <!-- 页头 / 页脚（可折叠富文本） -->
        <el-collapse v-model="openedPanels" class="header-footer">
          <el-collapse-item name="hf" title="页头 / 页脚设置">
            <div class="header-footer__grid">
              <div class="header-footer__field">
                <div class="header-footer__label">页头（仅首页顶部渲染）</div>
                <ReRichText v-model="header.header" placeholder="如：XX 学校 2026 学年第一学期期末考试" />
              </div>
              <div class="header-footer__field">
                <div class="header-footer__label">页脚（每页底部渲染）</div>
                <ReRichText v-model="header.footer" placeholder="如：考试时间 90 分钟，满分 100 分" />
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 题目清单（原生 HTML5 拖拽排序） -->
      <el-card shadow="never" class="canvas-card">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">试卷题目</span>
            <span class="panel-head__sub">
              共 {{ composeQuestions.length }} 题 · 试卷 ID {{ paperId ?? "未保存" }}
            </span>
          </div>
        </template>

        <div v-if="!composeQuestions.length" class="compose-empty">
          <el-empty :image-size="72" description="从左侧题库勾选题目，点击「加入试卷」开始组卷" />
        </div>

        <div v-else class="compose-list">
          <div
            v-for="(q, idx) in composeQuestions"
            :key="q.paperQuestionNo"
            class="compose-row"
            :class="{ 'is-dragging': dragIndex === idx, 'is-over': dragOverIndex === idx && dragIndex !== idx }"
            draggable="true"
            @dragstart="onDragStart($event, idx)"
            @dragover="onDragOver($event, idx)"
            @drop="onDrop($event, idx)"
            @dragend="onDragEnd"
          >
            <div class="compose-row__main">
              <el-icon class="compose-row__handle" title="按住拖拽排序"><Rank /></el-icon>
              <span class="compose-row__no">{{ idx + 1 }}</span>
              <el-tag size="small" type="info">{{ typeLabel(q.type) }}</el-tag>
              <span class="compose-row__stem" v-html="renderMathSummary(q.stem, 72) || '（题干为空）'" />
            </div>
            <div class="compose-row__side">
              <!--
                每题右上角唯一二维码：内容为题项唯一编号 paperQuestionNo，
                扫码内容即后端 GET /v2/edu/paper/qr/{paperQuestionNo} 的定位凭据。
                渲染尚未完成或失败时，回退显示编号文本。
              -->
              <div class="qr-slot" :data-qr-no="q.paperQuestionNo" :title="`题项编号：${q.paperQuestionNo}`">
                <img
                  v-if="qrImages[q.paperQuestionNo]"
                  class="qr-slot__img"
                  :src="qrImages[q.paperQuestionNo]"
                  :alt="`题项 ${q.paperQuestionNo} 二维码`"
                />
                <span v-else class="qr-slot__text">{{ q.paperQuestionNo }}</span>
              </div>
              <div class="compose-row__actions">
                <el-input-number
                  v-model="q.score"
                  :min="1"
                  :max="50"
                  size="small"
                  controls-position="right"
                  class="compose-row__score"
                />
                <el-button type="danger" link :icon="Delete" title="移出试卷" @click="removeComposeQuestion(idx)" />
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 分页预览 -->
      <el-card shadow="never" class="canvas-card">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">纸张预览</span>
            <span class="panel-head__sub">
              {{ header.pageSize }} · {{ header.pageOrientation === "LANDSCAPE" ? "横向" : "纵向" }} · 共 {{ pageCount }} 页 · 缩放 {{ Math.round(previewScale * 100) }}%
            </span>
          </div>
        </template>

        <div ref="previewViewportRef" class="preview-viewport">
          <div v-for="(page, pi) in previewPages" :key="pi" class="preview-group">
            <div class="page-slot" :style="pageSlotStyle">
              <div class="paper-page" :style="paperPageStyle">
                <!-- 首页页头：有页头富文本用富文本，否则用默认标题块 -->
                <div v-if="pi === 0" class="paper-header">
                  <div v-if="hasHeaderContent" class="paper-header__rich" v-html="headerHtml" />
                  <template v-else>
                    <div class="paper-header__title">{{ header.name || "未命名试卷" }}</div>
                    <div class="paper-header__meta">{{ metaLine }}</div>
                  </template>
                </div>

                <div class="paper-body">
                  <div v-for="item in page" :key="item.q.paperQuestionNo" class="paper-question">
                    <div class="paper-question__stem">
                      <span class="paper-question__no">{{ item.no }}.</span>
                      <span v-if="item.stemHtml" class="paper-question__html" v-html="item.stemHtml" />
                      <span v-else class="paper-question__empty">（题干为空）</span>
                      <span class="paper-question__score">（{{ item.q.score }} 分）</span>
                    </div>
                    <div v-if="item.options.length" class="paper-question__options">
                      <div v-for="(opt, oi) in item.options" :key="oi" class="paper-option">
                        <span class="paper-option__letter">{{ optionLetter(oi) }}.</span>
                        <span v-html="renderMixedText(opt)" />
                      </div>
                    </div>
                    <!-- 答案区域留空：客观题在题干处作答，主观题留出空白书写区 -->
                    <div
                      v-if="item.answerHeight > 0"
                      class="paper-question__answer"
                      :style="{ height: `${item.answerHeight}px` }"
                    />
                  </div>
                  <div v-if="!page.length" class="paper-body__empty">试卷还没有题目，从左侧题库加入题目后在此预览</div>
                </div>

                <div class="paper-footer">
                  <div v-if="hasFooterContent" class="paper-footer__rich" v-html="footerHtml" />
                  <div class="paper-footer__page">第 {{ pi + 1 }} 页 / 共 {{ pageCount }} 页</div>
                </div>
              </div>
            </div>
            <!-- 页面之间留缝显示页码 -->
            <div v-if="pi < previewPages.length - 1" class="preview-gap">第 {{ pi + 1 }} 页</div>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * PaperComposeView —— 手动组卷画布
 *
 * - 左栏题库市场：服务端按学科 / 学段 / 年级 / 难度 / 题型筛选，
 *   关键词因后端 QuestionQueryDTO 无该字段故在本地过滤，再本地分页。
 * - 右栏画布：工具条 + 页头页脚富文本 + 题目清单（原生 HTML5 拖拽）+ 多页预览。
 * - 保存：先建卷 / 改卷头，再同步增删题与分值，最后按题项编号数组提交排序。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import QRCode from "qrcode";
import { Delete, Rank, Search, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReRichText from "@repo/ui/re-rich-text";
import { eduaiApi } from "../api/eduaiApi";
import type { PaperComposePayload } from "../api/types";
import { htmlToMathText, renderMathSummary, renderMixedText, renderRichWithMath } from "../utils/mathText";

defineOptions({ name: "PaperComposeView" });

/* ==================== 类型定义（不修改 api/types.ts，视图内自持契约类型） ==================== */

/** 题库市场题目（edu_question 实体字段） */
interface MarketQuestion {
  questionId: number;
  questionType: string;
  questionSubject: string;
  questionGradeLevel: string;
  questionGrade: string;
  questionDifficulty?: number;
  questionScore?: number;
  questionStem: string;
  questionOptions?: string;
  questionAnswer?: string;
  questionAnalysis?: string;
}

/** 题库分页返回（兼容 data / records 两种字段） */
interface MarketPage {
  data?: MarketQuestion[];
  records?: MarketQuestion[];
  total?: number;
}

/** 画布中的一道题（题项编号 paperQuestionNo 是排序 / 二维码的唯一凭据） */
interface ComposeQuestion {
  questionId: number;
  type: string;
  stem: string;
  options?: string;
  answer?: string;
  analysis?: string;
  score: number;
  paperQuestionNo: string;
}

/** 试卷详情内题目（后端 QuestionVO 短字段名；题项编号字段名是 questionNo，不是 paperQuestionNo） */
interface PaperQuestionVO {
  id: number;
  type: string;
  stem: string;
  options?: string;
  answer?: string;
  analysis?: string;
  score?: number;
  questionNo?: string;
  section?: string;
  order?: number;
}

/** 试卷详情（新契约短字段 + 兼容旧 paper* 字段名） */
interface PaperDetail {
  name?: string;
  subject?: string;
  gradeLevel?: string;
  grade?: string;
  pageSize?: string;
  pageOrientation?: string;
  template?: string;
  header?: string;
  footer?: string;
  paperName?: string;
  paperSubject?: string;
  paperGradeLevel?: string;
  paperGrade?: string;
  questions?: PaperQuestionVO[];
}

/** 维度下拉（学科 / 年级） */
interface DimensionDropdown {
  subjects?: { subjectName?: string }[];
  grades?: { gradeName?: string; gradeLevel?: string | null }[];
}

/** 预览页中的题项（题干 / 选项已预渲染，避免模板内重复解析） */
interface PreviewItem {
  q: ComposeQuestion;
  no: number;
  options: string[];
  stemHtml: string;
  answerHeight: number;
}

/** 已从画布移除但仍存在于服务端的题项（保存时统一删除） */
interface RemovedQuestion {
  questionId: number;
  paperQuestionNo: string;
}

/* ==================== 常量 ==================== */

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

/** 纸张规格（按 96dpi 折算的屏幕像素近似值） */
const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1587 },
  A5: { width: 559, height: 794 },
  B5: { width: 665, height: 945 },
  LETTER: { width: 816, height: 1056 },
};

const PAPER_SIZE_OPTIONS = [
  { value: "A4", label: "A4（默认）" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "B5", label: "B5" },
  { value: "LETTER", label: "LETTER" },
];

/** 首页模板占位（后端按 template 渲染不同封面样式） */
const TEMPLATE_OPTIONS = [
  { value: "default", label: "default" },
  { value: "simple", label: "简约" },
  { value: "formal", label: "正式" },
];

/** 未持久化题项的临时编号前缀；保存成功回读服务端编号后被替换 */
const TMP_NO_PREFIX = "TMP-";

/** 预览分页估算参数 */
const PAGE_PADDING = 40;
const HEADER_HEIGHT_RICH = 132;
const HEADER_HEIGHT_DEFAULT = 88;
const FOOTER_HEIGHT = 56;

/* ==================== 请求层统一走 eduaiApi（原视图内自建 paperApi 已删除，避免重复定义） ==================== */

/* ==================== 展示小工具 ==================== */

const levelLabel = (code?: string) => GRADE_LEVELS.find((lv) => lv.code === code)?.label ?? "";
const typeLabel = (t?: string) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t ?? "-";
const optionLetter = (i: number) => String.fromCharCode(65 + i);

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

/** 选项列存 JSON 文本，解析失败时按分隔符兜底 */
function parseOptions(raw?: string): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}. ${v}`);
    }
    return [String(parsed)];
  } catch {
    return String(raw)
      .split(/[\n;；]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

/** 分值夹在 1-50（与分值输入框一致） */
function clampScore(score?: number): number {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) {
    return 5;
  }
  return Math.min(50, Math.max(1, Math.round(n)));
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/* ==================== 左栏：题库市场状态 ==================== */

const filters = reactive({
  keyword: "",
  subject: "",
  gradeLevel: "",
  grade: "",
  difficulty: undefined as number | undefined,
  type: "",
});

const marketLoading = ref(false);
const marketAll = ref<MarketQuestion[]>([]);
const selectedIds = ref<number[]>([]);
const marketPage = ref(1);
const marketPageSize = ref(10);
const subjectOptions = ref<{ label: string; value: string }[]>([]);
const gradeMeta = ref<{ gradeName?: string; gradeLevel?: string | null }[]>([]);

/** 年级候选项跟随学段联动 */
const gradeOptions = computed(() => {
  const level = filters.gradeLevel;
  const list = gradeMeta.value.filter((g) => g.gradeName && (!level || !g.gradeLevel || g.gradeLevel === level));
  return list.map((g) => ({ gradeName: g.gradeName as string }));
});

/** 关键词本地过滤：后端 QuestionQueryDTO 无 keyword 字段 */
const marketFiltered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase();
  if (!kw) {
    return marketAll.value;
  }
  return marketAll.value.filter((q) => {
    const hay = `${q.questionStem || ""} ${q.questionSubject || ""}`.toLowerCase();
    return hay.includes(kw);
  });
});

const marketTotal = computed(() => marketFiltered.value.length);

const marketRows = computed(() => {
  const start = (marketPage.value - 1) * marketPageSize.value;
  return marketFiltered.value.slice(start, start + marketPageSize.value);
});

async function loadDimensionMeta() {
  try {
    const res = await eduaiApi.dimensionDropdown();
    subjectOptions.value = (res?.subjects ?? [])
      .map((s) => ({ label: s.subjectName ?? "", value: s.subjectName ?? "" }))
      .filter((o) => o.value);
    gradeMeta.value = res?.grades ?? [];
  } catch {
    subjectOptions.value = [];
    gradeMeta.value = [];
  }
}

async function loadMarket() {
  marketLoading.value = true;
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
    marketLoading.value = false;
  }
}

function runMarketSearch() {
  marketPage.value = 1;
  void loadMarket();
}

function resetMarketSearch() {
  filters.keyword = "";
  filters.subject = "";
  filters.gradeLevel = "";
  filters.grade = "";
  filters.difficulty = undefined;
  filters.type = "";
  runMarketSearch();
}

function onGradeLevelChange() {
  filters.grade = "";
  runMarketSearch();
}

function toggleMarketSelect(id: number) {
  const i = selectedIds.value.indexOf(id);
  if (i >= 0) {
    selectedIds.value.splice(i, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

/* ==================== 右栏：画布状态 ==================== */

const paperId = ref<number | null>(null);
const saving = ref(false);
const publishing = ref(false);
const openedPanels = ref<string[]>(["hf"]);
const composeQuestions = ref<ComposeQuestion[]>([]);
/** 已从画布移除但仍需通知服务端删除的题项 */
const removedServerItems = ref<RemovedQuestion[]>([]);
/** 服务端已确认的分值快照（questionId → score），用于找出本地改过的分值 */
const savedScores = new Map<number, number>();

/** 题项编号 → 二维码 PNG dataURL */
const qrImages = ref<Record<string, string>>({});

/**
 * 渲染单题二维码。
 *
 * <p>二维码内容就是题项唯一编号 paperQuestionNo，与后端
 * {@code GET /v2/edu/paper/qr/{paperQuestionNo}} 的入参一致，扫码即可定位到
 * 「哪张卷的第几题」。未保存的题项编号是 TMP- 临时号，保存后会被真实编号替换，
 * 因此编号变化时要重新渲染。</p>
 *
 * @param {string} {no} 题项唯一编号
 */
async function renderQr(no: string): Promise<void> {
  if (!no) {
    return;
  }
  try {
    const url = await QRCode.toDataURL(no, {
      width: 132,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000ff", light: "#ffffffff" },
    });
    qrImages.value = { ...qrImages.value, [no]: url };
  } catch {
    // 渲染失败时保留编号文本兜底，不阻断组卷
  }
}

/** 题项集合或编号变化时，为所有尚未渲染的题项补出二维码 */
async function syncQrs(): Promise<void> {
  const pending = composeQuestions.value
    .map((q) => q.paperQuestionNo)
    .filter((no) => no && !qrImages.value[no]);
  if (pending.length === 0) {
    return;
  }
  await Promise.all(pending.map((no) => renderQr(no)));
  // 清理已移出试卷的题项，避免 dataURL 无限堆积
  const alive = new Set(composeQuestions.value.map((q) => q.paperQuestionNo));
  const next: Record<string, string> = {};
  for (const [no, url] of Object.entries(qrImages.value)) {
    if (alive.has(no)) {
      next[no] = url;
    }
  }
  qrImages.value = next;
}

watch(composeQuestions, () => void syncQrs(), { deep: true, immediate: true });

const header = reactive({
  name: "",
  subject: "",
  gradeLevel: "",
  grade: "",
  pageSize: "A4",
  pageOrientation: "PORTRAIT",
  template: "default",
  header: "",
  footer: "",
});

let tmpSeq = 0;

function nextTmpNo(): string {
  tmpSeq += 1;
  return `${TMP_NO_PREFIX}${Date.now().toString(36)}-${tmpSeq}`;
}

function isPendingQuestion(q: ComposeQuestion): boolean {
  return !q.paperQuestionNo || q.paperQuestionNo.startsWith(TMP_NO_PREFIX);
}

const totalScore = computed(() => composeQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0));
const scoreOk = computed(() => totalScore.value === 100);

/* ==================== 加入试卷 / 删除 / 拖拽 ==================== */

function addSelectedToPaper() {
  const picked = marketAll.value.filter((q) => selectedIds.value.includes(q.questionId));
  if (!picked.length) {
    ElMessage.warning("请先在题库市场勾选题目");
    return;
  }
  let added = 0;
  let skipped = 0;
  for (const q of picked) {
    if (composeQuestions.value.some((item) => item.questionId === q.questionId)) {
      skipped += 1;
      continue;
    }
    composeQuestions.value.push({
      questionId: q.questionId,
      type: q.questionType,
      stem: q.questionStem,
      options: q.questionOptions,
      answer: q.questionAnswer,
      analysis: q.questionAnalysis,
      score: clampScore(q.questionScore),
      paperQuestionNo: nextTmpNo(),
    });
    added += 1;
  }
  clearSelection();
  if (added) {
    ElMessage.success(`已加入 ${added} 题${skipped ? `，跳过重复 ${skipped} 题` : ""}`);
  } else {
    ElMessage.info("所选题目都已在试卷中");
  }
}

function removeComposeQuestion(index: number) {
  const item = composeQuestions.value[index];
  if (!item) {
    return;
  }
  if (!isPendingQuestion(item)) {
    removedServerItems.value.push({ questionId: item.questionId, paperQuestionNo: item.paperQuestionNo });
    savedScores.delete(item.questionId);
  }
  composeQuestions.value.splice(index, 1);
}

const dragIndex = ref(-1);
const dragOverIndex = ref(-1);

function onDragStart(event: Event, index: number) {
  const e = event as DragEvent;
  dragIndex.value = index;
  dragOverIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
}

function onDragOver(event: Event, index: number) {
  const e = event as DragEvent;
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
  dragOverIndex.value = index;
}

function onDrop(event: Event, index: number) {
  const e = event as DragEvent;
  e.preventDefault();
  moveQuestion(dragIndex.value, index);
  onDragEnd();
}

function onDragEnd() {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
}

function moveQuestion(from: number, to: number) {
  if (from < 0 || to < 0 || from === to || from >= composeQuestions.value.length) {
    return;
  }
  const list = composeQuestions.value;
  const [item] = list.splice(from, 1);
  if (!item) {
    return;
  }
  list.splice(to, 0, item);
}

/* ==================== 保存 / 均分 / 发布 ==================== */

function buildPaperPayload(): Record<string, unknown> {
  return {
    name: header.name.trim(),
    subject: header.subject,
    gradeLevel: header.gradeLevel,
    grade: header.grade,
    pageSize: header.pageSize,
    pageOrientation: header.pageOrientation,
    template: header.template,
    header: header.header,
    footer: header.footer,
  };
}

/** 建卷（无 ID 时）或更新卷头，返回试卷 ID */
async function ensurePaper(): Promise<number> {
  const payload = buildPaperPayload();
  if (paperId.value != null) {
    await eduaiApi.updatePaper(paperId.value, payload as unknown as PaperComposePayload);
    return paperId.value;
  }
  const created = await eduaiApi.createPaper(payload as unknown as PaperComposePayload);
  paperId.value = created;
  return created;
}

/** 保存成功后回读服务端的题项编号（新增题在加题接口返回里没有编号） */
async function refreshPaperQuestionNos(id: number) {
  const detail = (await eduaiApi.getPaper(id)) as unknown as PaperDetail;
  const byQuestionId = new Map<number, PaperQuestionVO>();
  for (const item of detail.questions ?? []) {
    byQuestionId.set(item.id, item);
  }
  for (const q of composeQuestions.value) {
    const server = byQuestionId.get(q.questionId);
    // 后端 QuestionVO 的题项编号字段名为 questionNo
    if (server?.questionNo) {
      q.paperQuestionNo = server.questionNo;
    }
  }
}

/**
 * 推送题项增删与分值变更。
 *
 * 契约里只有加题接口带分值（POST /questions body: [{questionId, score}]），没有单独的改分接口，
 * 因此把「新增题」与「分值被改动的存量题」合并提交，按 questionId 视为同题幂等写入；
 * 若后端把该接口实现成纯追加，需要改为先删后加。
 */
async function pushQuestionChanges(id: number) {
  // 1) 删除画布上移除的存量题
  const pendingRemovals = removedServerItems.value;
  for (const gone of pendingRemovals) {
    await eduaiApi.removePaperQuestion(id, gone.questionId);
    savedScores.delete(gone.questionId);
  }
  removedServerItems.value = [];

  // 2) 新增题 + 分值变更的存量题
  const batch = composeQuestions.value.filter(
    (q) => isPendingQuestion(q) || savedScores.get(q.questionId) !== q.score,
  );
  if (!batch.length) {
    return;
  }
  const hasPending = batch.some((q) => isPendingQuestion(q));
  await eduaiApi.addPaperQuestions(
    id,
    batch.map((q) => ({ questionId: q.questionId, score: q.score })),
  );
  if (hasPending) {
    await refreshPaperQuestionNos(id);
  }
  for (const q of batch) {
    savedScores.set(q.questionId, q.score);
  }
}

/** 保存草稿（notify=false 供发布流程静默保存） */
async function savePaper(notify = true): Promise<boolean> {
  if (!header.name.trim()) {
    ElMessage.warning("请先填写试卷名称");
    return false;
  }
  saving.value = true;
  try {
    const id = await ensurePaper();
    await pushQuestionChanges(id);
    await eduaiApi.sortPaperQuestions(
      id,
      composeQuestions.value.map((q) => q.paperQuestionNo),
    );
    if (notify) {
      ElMessage.success("草稿已保存");
    }
    return true;
  } catch (e) {
    ElMessage.error("保存失败: " + errorText(e));
    return false;
  } finally {
    saving.value = false;
  }
}

function onSaveDraft() {
  void savePaper();
}

function onDistributeEvenly() {
  void distributeEvenly();
}

async function distributeEvenly() {
  if (!composeQuestions.value.length) {
    ElMessage.warning("请先加入题目");
    return;
  }
  const allPersisted = composeQuestions.value.every((q) => !isPendingQuestion(q));
  if (paperId.value != null && allPersisted) {
    // 已保存且全部持久化：交给后端均分，再回读结果
    try {
      await eduaiApi.evenPaperScores(paperId.value);
      await loadDetail(paperId.value);
      ElMessage.success("已按题数均分 100 分");
    } catch (e) {
      ElMessage.error("均分失败: " + errorText(e));
    }
    return;
  }
  // 存在未持久化题项：本地均分（100 分按题数分摊，余数给前几题），保存时随分值提交
  const n = composeQuestions.value.length;
  const base = Math.floor(100 / n);
  const rest = 100 - base * n;
  composeQuestions.value.forEach((q, i) => {
    q.score = clampScore(base + (i < rest ? 1 : 0));
  });
  ElMessage.success("已在本地均分，保存后同步到后端");
}

function onPublish() {
  void publishPaper();
}

async function publishPaper() {
  if (!composeQuestions.value.length) {
    ElMessage.warning("试卷还没有题目，无法发布");
    return;
  }
  if (!scoreOk.value) {
    ElMessage.warning(`当前总分 ${totalScore.value} 分，需先调整到 100 分再发布`);
    return;
  }
  publishing.value = true;
  try {
    const saved = await savePaper(false);
    if (!saved || paperId.value == null) {
      return;
    }
    await eduaiApi.publishPaper(paperId.value);
    ElMessage.success("发布成功");
  } catch (e) {
    ElMessage.error("发布失败: " + errorText(e));
  } finally {
    publishing.value = false;
  }
}

/** 回读试卷详情（均分后刷新用；兼容旧 paper* 字段名） */
async function loadDetail(id: number) {
  const detail = (await eduaiApi.getPaper(id)) as unknown as PaperDetail;
  paperId.value = id;
  header.name = detail.name ?? detail.paperName ?? header.name;
  header.subject = detail.subject ?? detail.paperSubject ?? header.subject;
  header.gradeLevel = detail.gradeLevel ?? detail.paperGradeLevel ?? header.gradeLevel;
  header.grade = detail.grade ?? detail.paperGrade ?? header.grade;
  header.pageSize = detail.pageSize ?? header.pageSize;
  header.pageOrientation = detail.pageOrientation ?? header.pageOrientation;
  header.template = detail.template ?? header.template;
  header.header = detail.header ?? header.header;
  header.footer = detail.footer ?? header.footer;

  const list = [...(detail.questions ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  composeQuestions.value = list.map((item) => ({
    questionId: item.id,
    type: item.type,
    stem: item.stem,
    options: item.options,
    answer: item.answer,
    analysis: item.analysis,
    score: clampScore(item.score),
    // 后端 QuestionVO 的题项编号字段名为 questionNo
    paperQuestionNo: item.questionNo || nextTmpNo(),
  }));
  savedScores.clear();
  for (const q of composeQuestions.value) {
    savedScores.set(q.questionId, q.score);
  }
  removedServerItems.value = [];
}

/* ==================== 预览（纸张尺寸 / 缩放 / 分页） ==================== */

const previewViewportRef = ref<HTMLElement | null>(null);
const previewViewportWidth = ref(0);
let previewObserver: ResizeObserver | null = null;

const previewPaperWidth = computed(() => {
  const size = PAPER_SIZES[header.pageSize] ?? PAPER_SIZES.A4;
  return header.pageOrientation === "LANDSCAPE" ? size.height : size.width;
});

const previewPaperHeight = computed(() => {
  const size = PAPER_SIZES[header.pageSize] ?? PAPER_SIZES.A4;
  return header.pageOrientation === "LANDSCAPE" ? size.width : size.height;
});

/** 按容器宽度等比缩放（最大 100%） */
const previewScale = computed(() => {
  if (previewViewportWidth.value <= 0) {
    return 1;
  }
  const available = previewViewportWidth.value - 24;
  if (available >= previewPaperWidth.value) {
    return 1;
  }
  return Math.max(0.2, available / previewPaperWidth.value);
});

const pageSlotStyle = computed(() => ({
  width: `${previewPaperWidth.value * previewScale.value}px`,
  height: `${previewPaperHeight.value * previewScale.value}px`,
}));

const paperPageStyle = computed(() => ({
  width: `${previewPaperWidth.value}px`,
  height: `${previewPaperHeight.value}px`,
  transform: `scale(${previewScale.value})`,
}));

const headerHtml = computed(() => renderRichWithMath(header.header));
const footerHtml = computed(() => renderRichWithMath(header.footer));
const hasHeaderContent = computed(() => htmlToMathText(header.header).length > 0);
const hasFooterContent = computed(() => htmlToMathText(header.footer).length > 0);

const metaLine = computed(() => {
  const parts: string[] = [];
  if (header.subject) {
    parts.push(header.subject);
  }
  const gradeText = `${levelLabel(header.gradeLevel)}${header.grade || ""}`;
  if (gradeText) {
    parts.push(gradeText);
  }
  parts.push(`${composeQuestions.value.length} 题`);
  parts.push(`满分 ${totalScore.value} 分`);
  return parts.join(" · ");
});

/** 主观题作答留白高度（客观题在题干处作答，不额外留白） */
function answerSpaceHeight(type: string): number {
  if (type === "FILL") {
    return 34;
  }
  if (type === "SHORT_ANSWER") {
    return 60;
  }
  if (type === "ESSAY") {
    return 96;
  }
  return 0;
}

function buildPreviewItem(q: ComposeQuestion, no: number): PreviewItem {
  return {
    q,
    no,
    options: parseOptions(q.options),
    stemHtml: renderRichWithMath(q.stem),
    answerHeight: answerSpaceHeight(q.type),
  };
}

/** 估算题项渲染高度：基础高度 + 题干超出首行的部分 + 选项行 + 作答留白 */
function estimateQuestionHeight(item: PreviewItem): number {
  const base: Record<string, number> = {
    SINGLE_CHOICE: 44,
    MULTIPLE_CHOICE: 44,
    JUDGE: 40,
    FILL: 40,
    SHORT_ANSWER: 44,
    ESSAY: 48,
  };
  const stemLines = Math.max(1, Math.ceil(htmlToMathText(item.q.stem).length / 38));
  const optionLines = item.options.reduce(
    (sum, text) => sum + Math.max(1, Math.ceil(htmlToMathText(text).length / 44)),
    0,
  );
  return (base[item.q.type] ?? 44) + (stemLines - 1) * 21 + optionLines * 21 + item.answerHeight + 14;
}

const headerBlockHeight = computed(() => (hasHeaderContent.value ? HEADER_HEIGHT_RICH : HEADER_HEIGHT_DEFAULT));

/** 多页切分：按固定参数估算每题高度，超出当前页可容纳高度就新起一页 */
const previewPages = computed<PreviewItem[][]>(() => {
  const items = composeQuestions.value.map((q, index) => buildPreviewItem(q, index + 1));
  const limit = previewPaperHeight.value - PAGE_PADDING - FOOTER_HEIGHT;
  const firstPageStart = PAGE_PADDING + headerBlockHeight.value + 12;
  const laterPageStart = PAGE_PADDING + 12;

  const pages: PreviewItem[][] = [];
  let current: PreviewItem[] = [];
  let used = firstPageStart;
  let isFirstPage = true;

  for (const item of items) {
    const height = estimateQuestionHeight(item);
    if (current.length > 0 && used + height > limit) {
      pages.push(current);
      current = [];
      isFirstPage = false;
      used = laterPageStart;
    }
    current.push(item);
    used += height;
  }
  pages.push(current);
  return pages;
});

const pageCount = computed(() => previewPages.value.length);

/* ==================== 生命周期 ==================== */

onMounted(() => {
  void loadDimensionMeta();
  void loadMarket();
  if (previewViewportRef.value && typeof ResizeObserver !== "undefined") {
    previewObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        previewViewportWidth.value = entry.contentRect.width;
      }
    });
    previewObserver.observe(previewViewportRef.value);
  } else if (previewViewportRef.value) {
    previewViewportWidth.value = previewViewportRef.value.clientWidth;
  }
});

onBeforeUnmount(() => {
  previewObserver?.disconnect();
  previewObserver = null;
});
</script>

<style scoped>
/* ---------- 整体两栏布局 ---------- */
.compose-page {
  display: flex;
  gap: 14px;
  padding: 16px;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.market-panel {
  width: 380px;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
}

.canvas-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

/* ---------- 卡片通用 ---------- */
.market-card,
.canvas-card {
  border-radius: 14px;
  border: 0;
}

.market-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.market-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 14px 14px 12px;
  gap: 12px;
}

.canvas-card :deep(.el-card__header) {
  padding: 12px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.canvas-card :deep(.el-card__body) {
  padding: 16px 18px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.panel-head__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.panel-head__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 左栏：检索 ---------- */
.market-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.market-filters__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.market-filters__span2 {
  grid-column: span 2;
}

.market-filters__actions {
  display: flex;
  gap: 8px;
}

/* ---------- 左栏：题目列表 ---------- */
.market-list {
  flex: 1;
  min-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 4px 10px;
  background: var(--el-bg-color);
}

.market-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 9px 2px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.market-row:last-child {
  border-bottom: none;
}

.market-row__check {
  margin-top: 1px;
}

.market-row__body {
  flex: 1;
  min-width: 0;
}

.market-row__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.market-row__subject {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.market-row__stem {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.market-row__stem :deep(.katex) {
  font-size: 0.95em;
}

.diff-pill {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  line-height: 1.5;
}

.diff-pill.is-green {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.diff-pill.is-orange {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.diff-pill.is-red {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.diff-pill.is-gray {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

/* ---------- 左栏：底部操作 ---------- */
.market-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 10px;
}

.market-foot__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.market-foot__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.market-foot__selected {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* ---------- 右栏：工具条 ---------- */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  align-items: flex-end;
}

.tool-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 150px;
}

.tool-field--name {
  width: 240px;
}

.tool-field--orientation {
  width: 170px;
}

.tool-field--score {
  width: 150px;
}

.tool-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.score-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
  white-space: nowrap;
}

.score-chip.is-warn {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* ---------- 右栏：页头页脚 ---------- */
.header-footer {
  margin-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.header-footer :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-footer__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding-bottom: 6px;
}

.header-footer__label {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 右栏：题目清单 ---------- */
.compose-empty {
  padding: 10px 0;
}

.compose-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compose-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  cursor: grab;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.compose-row:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.08);
}

.compose-row.is-dragging {
  opacity: 0.45;
  cursor: grabbing;
}

.compose-row.is-over {
  border-color: var(--el-color-primary);
  box-shadow: inset 0 2px 0 var(--el-color-primary);
}

.compose-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.compose-row__handle {
  margin-top: 2px;
  color: var(--el-text-color-placeholder);
  cursor: grab;
}

.compose-row__no {
  min-width: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 24px;
}

.compose-row__stem {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
}

.compose-row__stem :deep(.katex) {
  font-size: 0.95em;
}

.compose-row__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.compose-row__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compose-row__score {
  width: 118px;
}

/* 每题唯一二维码：扫码内容为题项唯一编号 paperQuestionNo */
.qr-slot {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  padding: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.qr-slot__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

/* 渲染失败时的编号文本兜底 */
.qr-slot__text {
  padding: 0 4px;
  font-size: 10px;
  line-height: 1.3;
  color: var(--el-text-color-placeholder);
  text-align: center;
  word-break: break-all;
}

/* ---------- 纸张预览（.canvas-panel 内第二张卡片，纵向堆叠在题目列表下方）---------- */
.preview-viewport {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  overflow: hidden;
}

.preview-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-slot {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.paper-page {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  background: #ffffff;
  color: #1f2329;
  box-shadow: 0 6px 22px rgba(31, 35, 41, 0.14);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  padding: 40px 44px 24px;
  box-sizing: border-box;
}

.paper-header {
  flex-shrink: 0;
  text-align: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e6eb;
  margin-bottom: 12px;
}

.paper-header__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}

.paper-header__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.paper-header__rich {
  font-size: 14px;
}

.paper-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.paper-body__empty {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.paper-question__stem {
  font-size: 13.5px;
  line-height: 1.65;
}

.paper-question__no {
  font-weight: 700;
  margin-right: 4px;
}

.paper-question__score {
  margin-left: 6px;
  font-size: 12px;
  color: #6b7280;
}

.paper-question__empty {
  color: #9ca3af;
}

.paper-question__options {
  margin-top: 4px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.paper-option {
  font-size: 13px;
  line-height: 1.6;
}

.paper-option__letter {
  font-weight: 600;
  margin-right: 4px;
}

.paper-question__answer {
  margin-top: 6px;
  border: 1px dashed #d0d3d9;
  border-radius: 4px;
}

.paper-footer {
  flex-shrink: 0;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e6eb;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.paper-footer__rich {
  margin-bottom: 4px;
}

.paper-footer__page {
  letter-spacing: 1px;
}

/* 页面之间的留缝 + 页码 */
.preview-gap {
  margin: 14px 0;
  padding: 2px 14px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border: 1px dashed var(--el-border-color);
}
</style>
