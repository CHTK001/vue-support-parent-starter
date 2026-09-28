<!--
  PaperComposeView —— 手动组卷画布

  路由挂载说明（路由注册由另一 Agent 负责，本文件不修改路由文件）：
    本视图由路由路径 /eduai/paper-compose 挂载，组件名 PaperComposeView。
    - 带 ?paperId=123 进入：直接回读该试卷详情并回填，不做空白新建；
    - 不带 paperId：保持「未保存」空白新建行为。

  布局：
    左栏「试卷画布」自适应（卷头信息 + 工具栏 + 一题一行的题目清单 + 多页预览）；
    右栏「试卷购物车」约 340px（题型标签 / 题干摘要 / 分值 / 移除 / 加入 / HTML5 拖拽加入）。

  依赖说明：
    - 拖拽：pages/eduai 未声明任何拖拽库（sortablejs 只在仓库根与 packages/ui 声明），
      按任务约定使用原生 HTML5 drag 事件实现，不新增依赖。
    - 二维码：使用 qrcode（仓库内 packages/theme 与 apps/vue-support-ai-guada 早已在用），
      以题项唯一编号 paperQuestionNo 为内容本地渲染成 PNG dataURL，
      扫码内容即后端 GET /v2/edu/paper/qr/{paperQuestionNo} 的定位凭据。
    - 接口：统一走 src/api/eduaiApi.ts（不另建请求层）。
    - 购物车：复用并行子 Agent 提供的 usePaperCart(paperId)（本轮契约冻结，按契约 import）。
    - 题库市场：弹框 QuestionMarketDialog（props modelValue / paperId，emits picked）。
-->
<template>
  <div class="compose-page">
    <!-- ==================== 左栏：试卷题目 ==================== -->
    <!-- 题目清单（原生 HTML5 拖拽排序；同时作为购物车拖拽的投放区）
           卷头信息（名称/学科/学段/年级等）在组卷弹框与设置弹框中编辑，
           这里不再重复铺一屏表单，只保留标题 + 关键操作图标。 -->
      <el-card shadow="never" class="canvas-card compose-main">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">试卷题目</span>
            <span class="panel-head__sub">
              <span class="score-chip" :class="{ 'is-warn': !scoreOk }">
                <el-icon v-if="!scoreOk"><Warning /></el-icon>
                当前 {{ totalScore }} / {{ header.targetScore }} 分
              </span>
              <span class="panel-head__meta">共 {{ composeQuestions.length }} 题 · 试卷 ID {{ paperId ?? "未保存" }}</span>
            </span>
            <span class="panel-head__actions">
              <ReButton layout="square" icon="Sort" tip="按题数均分" @click="onDistributeEvenly" />
              <ReButton layout="square" icon="Setting" tip="设置" @click="openSettings" />
              <ReButton layout="square" type="primary" icon="Check" tip="保存草稿" :loading="saving" @click="onSaveDraft" />
              <ReButton layout="square" type="success" icon="Upload" tip="发布" :loading="publishing" @click="onPublish" />
            </span>
          </div>
        </template>

        <div
          class="compose-dropzone"
          :class="{ 'is-cart-over': cartDropOver }"
          @dragover.prevent="onComposeDragOver"
          @dragleave="onComposeDragLeave"
          @drop="onComposeDrop"
        >
          <div v-if="!composeQuestions.length" class="compose-empty">
            <el-empty :image-size="72" description="点击「题库」挑题进购物车，再把右侧购物车的题拖到这里开始组卷" />
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
                <el-tag  type="info">{{ typeLabel(q.type) }}</el-tag>
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
                    :max="maxQuestionScore"
                    
                    controls-position="right"
                    class="compose-row__score"
                  />
                  <el-button type="danger" link :icon="Delete" title="移出试卷" @click="removeComposeQuestion(idx)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- ==================== 中栏：纸张预览 ==================== -->
      <el-card shadow="never" class="canvas-card preview-card">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">纸张预览</span>
            <span class="panel-head__sub">
              {{ previewHeader.pageSize }} · {{ previewHeader.pageOrientation === "LANDSCAPE" ? "横向" : "纵向" }} · 共 {{ pageCount }} 页 · 缩放 {{ Math.round(previewScale * 100) }}%
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
                    <div class="paper-header__title" :class="`is-${previewHeader.titleStyle}`">{{ previewHeader.name || "未命名试卷" }}</div>
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
                  <div v-if="!page.length" class="paper-body__empty">试卷还没有题目，把右侧购物车的题拖到上方题目清单后在此预览</div>
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

    <!-- ==================== 右栏：试卷购物车 ==================== -->
    <aside class="cart-panel">
      <el-card shadow="never" class="cart-card">
        <template #header>
          <div class="panel-head">
            <span class="panel-head__title">试卷购物车</span>
            <span class="panel-head__actions">
              <ReButton layout="square" type="primary" icon="Plus" tip="继续添加题目" @click="openMarket" />
              <ReButton v-if="cartItems.length" layout="square" type="danger" icon="Delete" tip="清空购物车" @click="clearCart" />
            </span>
          </div>
        </template>

        <div class="cart-summary">
          已选 {{ cartCount }} 题 · 合计 {{ cartTotalScore }} 分
        </div>

        <div class="cart-list">
          <div v-if="!cartItems.length" class="cart-empty">
            <el-empty :image-size="64" description="购物车是空的，点击「题库」挑题加入" />
          </div>

          <div
            v-for="item in cartItems"
            :key="item.questionId"
            class="cart-row"
            :class="{ 'is-dragging': draggingCartId === item.questionId }"
            draggable="true"
            @dragstart="onCartDragStart($event, item)"
            @dragend="onCartDragEnd"
          >
            <div class="cart-row__head">
              <el-icon class="cart-row__handle" title="拖拽到左侧题目清单加入试卷"><Rank /></el-icon>
              <el-tag  type="info">{{ typeLabel(item.type) }}</el-tag>
              <span v-if="item.difficulty != null" class="diff-pill" :class="diffClass(item.difficulty)">{{ diffLabel(item.difficulty) }}</span>
              <span v-if="item.subject" class="cart-row__subject">{{ item.subject }}</span>
            </div>
            <div class="cart-row__stem" v-html="renderMathSummary(item.stem, 56) || '（题干为空）'" />
            <div class="cart-row__foot">
              <el-input-number
                :model-value="item.score"
                :min="1"
                :max="maxQuestionScore"
                
                controls-position="right"
                class="cart-row__score"
                @change="onCartScoreChange(item, $event)"
              />
              <ReButton  type="primary" icon="Plus" @click="addCartItemToPaper(item)">加入</ReButton>
              <el-button type="danger" link :icon="Delete" title="从购物车移除" @click="removeFromCart(item.questionId)" />
            </div>
          </div>
        </div>

        <div class="cart-tip">提示：把购物车条目拖到左侧题目清单，或点「加入」一键上卷；上卷后自动从购物车移除。</div>
      </el-card>
    </aside>

    <!-- ==================== 题库市场弹框 ==================== -->
    <QuestionMarketDialog v-model="marketVisible" :paper-id="paperId" @picked="onMarketPicked" />

    <!-- ==================== 设置弹框（左配置 / 右实时预览） ==================== -->
    <el-dialog v-model="settingsVisible" title="试卷设置" width="1080px" top="5vh" append-to-body destroy-on-close class="paper-settings-dialog">
      <div class="settings-grid">
        <!-- 左：配置项 -->
        <div class="settings-form">
          <div class="settings-field">
            <label class="settings-field__label">大标题</label>
            <el-input v-model="settingsDraft.name" maxlength="100" clearable placeholder="试卷大标题文本" />
          </div>
          <div class="settings-field">
            <label class="settings-field__label">大标题风格</label>
            <el-select v-model="settingsDraft.titleStyle" style="width: 100%">
              <el-option v-for="s in TITLE_STYLE_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
          <div class="settings-field">
            <label class="settings-field__label">页眉（仅首页顶部渲染）</label>
            <ReRichText v-model="settingsDraft.header" placeholder="如：XX 学校 2026 学年第一学期期末考试" />
          </div>
          <div class="settings-field">
            <label class="settings-field__label">页脚（每页底部渲染）</label>
            <ReRichText v-model="settingsDraft.footer" placeholder="如：考试时间 90 分钟，满分 100 分" />
          </div>
          <div class="settings-field settings-field--grid">
            <div class="settings-field">
              <label class="settings-field__label">纸张规格</label>
              <el-select v-model="settingsDraft.pageSize" style="width: 100%">
                <el-option v-for="p in PAPER_SIZE_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </div>
            <div class="settings-field">
              <label class="settings-field__label">方向</label>
              <el-select v-model="settingsDraft.pageOrientation" style="width: 100%">
                <el-option value="PORTRAIT" label="纵向" />
                <el-option value="LANDSCAPE" label="横向" />
              </el-select>
            </div>
          </div>
          <div class="settings-field settings-field--grid">
            <div class="settings-field">
              <label class="settings-field__label">总分</label>
              <el-input-number v-model="settingsDraft.targetScore" :min="1" :max="1000" :step="10" style="width: 100%" />
            </div>
            <div class="settings-field">
              <label class="settings-field__label">模板选择</label>
              <el-select
                v-model="settingsDraft.templateId"
                clearable
                filterable
                :loading="templatesLoading"
                placeholder="选模板自动回填页眉/页脚/风格"
                style="width: 100%"
                @change="onTemplateChange"
              >
                <el-option v-for="t in templateRows" :key="templateIdOf(t) ?? templateNameOf(t)" :label="templateNameOf(t)" :value="templateIdOf(t)" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 右：实时预览（复用纸张预览的渲染逻辑与样式） -->
        <div class="settings-preview">
          <div class="settings-preview__hint">实时预览（{{ settingsDraft.pageSize }} · {{ settingsDraft.pageOrientation === "LANDSCAPE" ? "横向" : "纵向" }} · 共 {{ pageCount }} 页）</div>
          <div class="settings-preview__viewport">
            <div v-for="(page, pi) in previewPages" :key="pi" class="preview-group">
              <div class="page-slot" :style="settingsPageSlotStyle">
                <div class="paper-page" :style="settingsPaperPageStyle">
                  <div v-if="pi === 0" class="paper-header">
                    <div v-if="hasHeaderContent" class="paper-header__rich" v-html="headerHtml" />
                    <template v-else>
                      <div class="paper-header__title" :class="`is-${settingsDraft.titleStyle}`">{{ settingsDraft.name || "未命名试卷" }}</div>
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
                      <div
                        v-if="item.answerHeight > 0"
                        class="paper-question__answer"
                        :style="{ height: `${item.answerHeight}px` }"
                      />
                    </div>
                    <div v-if="!page.length" class="paper-body__empty">试卷还没有题目</div>
                  </div>
                  <div class="paper-footer">
                    <div v-if="hasFooterContent" class="paper-footer__rich" v-html="footerHtml" />
                    <div class="paper-footer__page">第 {{ pi + 1 }} 页 / 共 {{ pageCount }} 页</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSettings">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * PaperComposeView —— 手动组卷画布
 *
 * - 路由参数 paperId：非空时回读试卷详情回填；为空时空白新建（未保存态）。
 * - 左栏画布：卷头 + 工具栏 + 题目清单（原生 HTML5 拖拽排序）+ 多页预览。
 * - 右栏购物车：usePaperCart(paperId) 维护待上卷题目，支持拖拽/点击上卷。
 * - 保存：先建卷 / 改卷头，再同步增删题与分值，最后按题项编号数组提交排序。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import QRCode from "qrcode";
import { Check, Coin, Delete, Plus, Rank, Setting, Sort, Upload, Warning } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReRichText from "@repo/ui/re-rich-text";
import { eduaiApi } from "../api/eduaiApi";
import type { MarketQuestion, PaperComposePayload, PaperTemplate } from "../api/types";
import { usePaperCart, toCartItem, type CartItem } from "../composables/usePaperCart";
import QuestionMarketDialog from "../components/paper/QuestionMarketDialog.vue";
import { htmlToMathText, renderMathSummary, renderMixedText, renderRichWithMath } from "../utils/mathText";

defineOptions({ name: "PaperComposeView" });

/* ==================== 类型定义（视图内自持展示类型） ==================== */

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
  templateId?: number;
  titleStyle?: string;
  targetScore?: number;
  paperName?: string;
  paperSubject?: string;
  paperGradeLevel?: string;
  paperGrade?: string;
  paperPageSize?: string;
  paperPageOrientation?: string;
  paperTemplate?: string;
  paperHeader?: string;
  paperFooter?: string;
  paperTemplateId?: number;
  paperTotalScore?: number;
  questions?: PaperQuestionVO[];
}

/** 卷头 / 纸张 / 模板设置（工具栏与设置弹框共用的状态形状） */
interface PaperHeader {
  name: string;
  subject: string;
  gradeLevel: string;
  grade: string;
  pageSize: string;
  pageOrientation: string;
  template: string;
  templateId: number | null;
  titleStyle: string;
  targetScore: number;
  header: string;
  footer: string;
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

/** 大标题风格（与后端模板 template_style 取值一致） */
const TITLE_STYLE_OPTIONS = [
  { value: "classic", label: "经典（宋体居中）" },
  { value: "modern", label: "现代（黑体左对齐）" },
  { value: "simple", label: "简约（细体疏排）" },
  { value: "exam", label: "正式（考卷双线）" },
];

/** 未持久化题项的临时编号前缀；保存成功回读服务端编号后被替换 */
const TMP_NO_PREFIX = "TMP-";

/** 预览分页估算参数 */
const PAGE_PADDING = 40;
const HEADER_HEIGHT_RICH = 132;
const HEADER_HEIGHT_DEFAULT = 88;
const FOOTER_HEIGHT = 56;

/** 设置弹框右侧实时预览的可用宽度（px），用于等比缩放纸张 */
const SETTINGS_PREVIEW_WIDTH = 440;

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

/**
 * 分值夹在 1 ~ maxQuestionScore。
 *
 * @param score 原始分值
 * @returns 合法分值；非法或非正数时回退 5
 */
function clampScore(score?: number): number {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) {
    return 5;
  }
  return Math.min(maxQuestionScore.value, Math.max(1, Math.round(n)));
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/* ==================== 路由参数 ==================== */

const route = useRoute();

/** 读取路由 query 的字符串值（兼容数组） */
function queryText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? String(value[0]) : "";
  }
  return value == null ? "" : String(value);
}

/* ==================== 卷头 / 纸张 / 模板状态 ==================== */

const paperId = ref<number | null>(null);
const saving = ref(false);
const publishing = ref(false);
const composeQuestions = ref<ComposeQuestion[]>([]);
/** 已从画布移除但仍需通知服务端删除的题项 */
const removedServerItems = ref<RemovedQuestion[]>([]);
/** 服务端已确认的分值快照（questionId → score），用于找出本地改过的分值 */
const savedScores = new Map<number, number>();

const header = reactive<PaperHeader>({
  name: "",
  subject: "",
  gradeLevel: "",
  grade: "",
  pageSize: "A4",
  pageOrientation: "PORTRAIT",
  template: "default",
  templateId: null,
  titleStyle: "classic",
  targetScore: 100,
  header: "",
  footer: "",
});

/**
 * 单题分值上限。
 *
 * <p>满分可配置后不能把每题固定夹在 50：例如满分 120 只有 2 题时，均分需要每题 60，
 * 若仍夹在 50 会导致合计永远凑不到满分、发布被拦。上限取「满分」与 50 的较大者，
 * 保证任意题数组合都能达到满分。</p>
 */
const maxQuestionScore = computed(() => Math.max(50, header.targetScore > 0 ? header.targetScore : 100));

/** 设置弹框的编辑草稿；确定后整体写回 header */
const settingsDraft = reactive<PaperHeader>({ ...header });

const settingsVisible = ref(false);

function syncHeaderToDraft() {
  Object.assign(settingsDraft, header);
}

function applyDraftToHeader() {
  header.name = settingsDraft.name;
  header.pageSize = settingsDraft.pageSize;
  header.pageOrientation = settingsDraft.pageOrientation;
  header.templateId = settingsDraft.templateId;
  header.titleStyle = settingsDraft.titleStyle;
  header.targetScore = settingsDraft.targetScore;
  header.header = settingsDraft.header;
  header.footer = settingsDraft.footer;
}

function openSettings() {
  syncHeaderToDraft();
  settingsVisible.value = true;
  if (!templatesLoaded.value) {
    void loadTemplates();
  }
}

function confirmSettings() {
  applyDraftToHeader();
  settingsVisible.value = false;
}

/* ==================== 组卷模板（下拉选择后回填页眉/页脚/风格） ==================== */

const templateRows = ref<PaperTemplate[]>([]);
const templatesLoading = ref(false);
const templatesLoaded = ref(false);

/**
 * 读取模板字段（兼容后端实体前缀命名 templateXxx 与前端短命名）。
 *
 * @param {PaperTemplate} tpl 模板对象
 * @param {...string} keys 候选字段名
 * @returns {string} 首个非空字符串值，找不到返回空串
 */
function templateText(tpl: PaperTemplate, ...keys: string[]): string {
  const rec = tpl as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return "";
}

/**
 * 读取模板主键（兼容 templateId / id）。
 *
 * @param {PaperTemplate} tpl 模板对象
 * @returns {number | null} 模板 ID；非法时为 null
 */
function templateIdOf(tpl: PaperTemplate): number | null {
  const rec = tpl as unknown as Record<string, unknown>;
  const n = Number(rec.templateId ?? rec.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 读取模板展示名。
 *
 * @param {PaperTemplate} tpl 模板对象
 * @returns {string} 模板名称
 */
function templateNameOf(tpl: PaperTemplate): string {
  return templateText(tpl, "templateName", "name") || `模板 ${templateIdOf(tpl) ?? ""}`;
}

async function loadTemplates() {
  templatesLoading.value = true;
  try {
    const res = await eduaiApi.getPaperTemplatePage({ pageNum: 1, pageSize: 200, templateStatus: 1 });
    templateRows.value = res?.data ?? res?.records ?? [];
    templatesLoaded.value = true;
  } catch (e) {
    templateRows.value = [];
    ElMessage.error("模板加载失败: " + errorText(e));
  } finally {
    templatesLoading.value = false;
  }
}

/**
 * 选中模板后把模板的页眉/页脚/风格回填到设置草稿。
 *
 * @param {number | null} id 模板 ID
 */
function onTemplateChange(id: number | null) {
  settingsDraft.templateId = id;
  if (id == null) {
    return;
  }
  const tpl = templateRows.value.find((t) => templateIdOf(t) === id);
  if (!tpl) {
    return;
  }
  const style = templateText(tpl, "templateStyle", "style");
  if (style) {
    settingsDraft.titleStyle = style;
  }
  const head = templateText(tpl, "templateHeader", "header");
  if (head) {
    settingsDraft.header = head;
  }
  const foot = templateText(tpl, "templateFooter", "footer");
  if (foot) {
    settingsDraft.footer = foot;
  }
  const size = templateText(tpl, "templatePageSize", "pageSize");
  if (size) {
    settingsDraft.pageSize = size;
  }
  const orientation = templateText(tpl, "templateOrientation", "pageOrientation", "orientation");
  if (orientation) {
    settingsDraft.pageOrientation = orientation;
  }
  ElMessage.success(`已套用模板「${templateNameOf(tpl)}」`);
}

/* ==================== 维度下拉（工具栏学科 / 年级） ==================== */

const subjectOptions = ref<{ label: string; value: string }[]>([]);
const gradeMeta = ref<{ gradeName?: string; gradeLevel?: string | null }[]>([]);

/** 年级候选项跟随工具栏学段联动 */
const gradeOptions = computed(() => {
  const level = header.gradeLevel;
  const list = gradeMeta.value.filter((g) => g.gradeName && (!level || !g.gradeLevel || g.gradeLevel === level));
  return list.map((g) => ({ gradeName: g.gradeName as string }));
});

async function loadDimensionMeta() {
  try {
    const res = (await eduaiApi.dimensionDropdown()) as DimensionDropdown;
    subjectOptions.value = (res?.subjects ?? [])
      .map((s) => ({ label: s.subjectName ?? "", value: s.subjectName ?? "" }))
      .filter((o) => o.value);
    gradeMeta.value = res?.grades ?? [];
  } catch {
    subjectOptions.value = [];
    gradeMeta.value = [];
  }
}

/* ==================== 购物车（usePaperCart） ==================== */

const {
  items: cartItems,
  addMany: addCartMany,
  remove: removeFromCart,
  clear: clearCart,
  setScore: setCartScore,
  has: cartHas,
  totalScore: cartTotalScore,
  count: cartCount,
} = usePaperCart(paperId);

/** 题库弹框可见性 */
const marketVisible = ref(false);

function openMarket() {
  marketVisible.value = true;
}

/** 题库弹框「已选题」回填购物车（MarketQuestion -> CartItem，带去重） */
function onMarketPicked(list: MarketQuestion[]) {
  if (!list.length) {
    return;
  }
  // 统一走共享映射（含分值兜底），避免各处各写一遍、并防止缺分值落成 0 分
  const mapped: CartItem[] = list.map((q) => toCartItem(q));
  const fresh = mapped.filter((it) => !cartHas(it.questionId));
  const skipped = mapped.length - fresh.length;
  if (fresh.length) {
    addCartMany(fresh);
    ElMessage.success(`已加入购物车 ${fresh.length} 题${skipped ? `，跳过重复 ${skipped} 题` : ""}`);
  } else {
    ElMessage.info("所选题目都已在购物车中");
  }
}

/**
 * 修改购物车条目分值（走 composable，不直接改 item）。
 *
 * @param {CartItem} item 购物车条目
 * @param {number | undefined} value 新分值
 */
function onCartScoreChange(item: CartItem, value: number | undefined) {
  setCartScore(item.questionId, clampScore(value));
}

/* ==================== 购物车 -> 试卷（拖拽 / 点击） ==================== */

/** 正在拖拽的购物车题目 ID；非空表示当前是「购物车上卷」拖拽而非卷内排序 */
const draggingCartId = ref<number | null>(null);
/** 购物车拖拽悬停在左侧题目清单上方 */
const cartDropOver = ref(false);

const draggingCartItem = computed(() => cartItems.value.find((it) => it.questionId === draggingCartId.value) ?? null);

function onCartDragStart(event: DragEvent, item: CartItem) {
  draggingCartId.value = item.questionId;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", `cart:${item.questionId}`);
  }
}

function onCartDragEnd() {
  draggingCartId.value = null;
  cartDropOver.value = false;
}

function onComposeDragOver(event: DragEvent) {
  if (draggingCartId.value == null) {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  cartDropOver.value = true;
}

function onComposeDragLeave() {
  cartDropOver.value = false;
}

function onComposeDrop(event: DragEvent) {
  event.preventDefault();
  cartDropOver.value = false;
  const item = draggingCartItem.value;
  draggingCartId.value = null;
  if (item) {
    addCartItemToPaper(item);
  }
}

/**
 * 把购物车条目追加到试卷（未保存时为本地态 + TMP- 临时编号），并从购物车移除。
 *
 * @param {CartItem} item 购物车条目
 */
function addCartItemToPaper(item: CartItem) {
  if (composeQuestions.value.some((q) => q.questionId === item.questionId)) {
    removeFromCart(item.questionId);
    ElMessage.info("该题已在试卷中，已从购物车移除");
    return;
  }
  composeQuestions.value.push({
    questionId: item.questionId,
    type: item.type,
    stem: item.stem,
    options: item.options,
    answer: item.answer,
    analysis: item.analysis,
    score: clampScore(item.score),
    paperQuestionNo: nextTmpNo(),
  });
  removeFromCart(item.questionId);
  ElMessage.success("已加入试卷");
}

/* ==================== 二维码（每题唯一，内容 = paperQuestionNo） ==================== */

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
 * @param {string} no 题项唯一编号
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

let tmpSeq = 0;

function nextTmpNo(): string {
  tmpSeq += 1;
  return `${TMP_NO_PREFIX}${Date.now().toString(36)}-${tmpSeq}`;
}

function isPendingQuestion(q: ComposeQuestion): boolean {
  return !q.paperQuestionNo || q.paperQuestionNo.startsWith(TMP_NO_PREFIX);
}

const totalScore = computed(() => composeQuestions.value.reduce((sum, q) => sum + (q.score || 0), 0));
const scoreOk = computed(() => totalScore.value === header.targetScore);

/* ==================== 题目清单：删除 / 拖拽排序 ==================== */

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
  // 购物车上卷拖拽不走卷内排序
  if (draggingCartId.value != null) {
    return;
  }
  const e = event as DragEvent;
  dragIndex.value = index;
  dragOverIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
}

function onDragOver(event: Event, index: number) {
  // 购物车上卷拖拽交给外层投放区处理
  if (draggingCartId.value != null) {
    return;
  }
  const e = event as DragEvent;
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
  dragOverIndex.value = index;
}

function onDrop(event: Event, index: number) {
  // 购物车上卷拖拽交给外层投放区处理
  if (draggingCartId.value != null) {
    return;
  }
  const e = event as DragEvent;
  e.preventDefault();
  moveQuestion(dragIndex.value, index);
  onDragEnd();
}

function onDragEnd() {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
  draggingCartId.value = null;
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
    templateId: header.templateId,
    titleStyle: header.titleStyle,
    paperTotalScore: header.targetScore,
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
      ElMessage.success(`已按题数均分 ${header.targetScore} 分`);
    } catch (e) {
      ElMessage.error("均分失败: " + errorText(e));
    }
    return;
  }
  // 存在未持久化题项：本地均分（目标总分按题数分摊，余数给前几题），保存时随分值提交
  const target = header.targetScore > 0 ? header.targetScore : 100;
  const n = composeQuestions.value.length;
  const base = Math.floor(target / n);
  const rest = target - base * n;
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
    ElMessage.warning(`当前总分 ${totalScore.value} 分，需先调整到 ${header.targetScore} 分再发布`);
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

/** 回读试卷详情（路由带 paperId 进入 / 均分后刷新用；兼容旧 paper* 字段名） */
async function loadDetail(id: number) {
  const detail = (await eduaiApi.getPaper(id)) as unknown as PaperDetail;
  paperId.value = id;
  header.name = detail.name ?? detail.paperName ?? header.name;
  header.subject = detail.subject ?? detail.paperSubject ?? header.subject;
  header.gradeLevel = detail.gradeLevel ?? detail.paperGradeLevel ?? header.gradeLevel;
  header.grade = detail.grade ?? detail.paperGrade ?? header.grade;
  // 后端 PaperVO 的纸张/页眉页脚字段带 paper 前缀，需兼容
  header.pageSize = detail.pageSize ?? detail.paperPageSize ?? header.pageSize;
  header.pageOrientation = detail.pageOrientation ?? detail.paperPageOrientation ?? header.pageOrientation;
  header.template = detail.template ?? detail.paperTemplate ?? header.template;
  header.templateId = detail.templateId ?? detail.paperTemplateId ?? header.templateId;
  header.titleStyle = detail.titleStyle ?? header.titleStyle;
  header.targetScore = detail.targetScore ?? detail.paperTotalScore ?? header.targetScore;
  header.header = detail.header ?? detail.paperHeader ?? header.header;
  header.footer = detail.footer ?? detail.paperFooter ?? header.footer;

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

/** 预览取值来源：设置弹框打开时用草稿（实时预览），否则用当前卷头 */
const previewHeader = computed<PaperHeader>(() => (settingsVisible.value ? settingsDraft : header));

const previewViewportRef = ref<HTMLElement | null>(null);
const previewViewportWidth = ref(0);
/** 预览所在卡片 body 的可用高度（由 ResizeObserver 提供），用于按高度约束缩放 */
const previewViewportHeight = ref(0);
let previewObserver: ResizeObserver | null = null;

const previewPaperWidth = computed(() => {
  const size = PAPER_SIZES[previewHeader.value.pageSize] ?? PAPER_SIZES.A4;
  return previewHeader.value.pageOrientation === "LANDSCAPE" ? size.height : size.width;
});

const previewPaperHeight = computed(() => {
  const size = PAPER_SIZES[previewHeader.value.pageSize] ?? PAPER_SIZES.A4;
  return previewHeader.value.pageOrientation === "LANDSCAPE" ? size.width : size.height;
});

/**
 * 预览缩放：按容器宽度等比缩放（最大 100%）。
 *
 * <p>不按高度缩放：A4 在 96dpi 下高约 1123px，塞进几百像素高的卡片会缩成 20%~30%，
 * 文字不可读，反而不如保持 100% 宽度让用户纵向滚动。卡片 body 已是 overflow-y:auto。</p>
 */
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

/** 设置弹框右侧实时预览：按弹框可用宽度等比缩放 */
const settingsPreviewScale = computed(() => Math.min(1, SETTINGS_PREVIEW_WIDTH / previewPaperWidth.value));

const settingsPageSlotStyle = computed(() => ({
  width: `${previewPaperWidth.value * settingsPreviewScale.value}px`,
  height: `${previewPaperHeight.value * settingsPreviewScale.value}px`,
}));

const settingsPaperPageStyle = computed(() => ({
  width: `${previewPaperWidth.value}px`,
  height: `${previewPaperHeight.value}px`,
  transform: `scale(${settingsPreviewScale.value})`,
}));

const headerHtml = computed(() => renderRichWithMath(previewHeader.value.header));
const footerHtml = computed(() => renderRichWithMath(previewHeader.value.footer));
const hasHeaderContent = computed(() => htmlToMathText(previewHeader.value.header).length > 0);
const hasFooterContent = computed(() => htmlToMathText(previewHeader.value.footer).length > 0);

const metaLine = computed(() => {
  const parts: string[] = [];
  if (previewHeader.value.subject) {
    parts.push(previewHeader.value.subject);
  }
  const gradeText = `${levelLabel(previewHeader.value.gradeLevel)}${previewHeader.value.grade || ""}`;
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

/** previewPages 至少返回一页（空卷为 [[]]），页数即数组长度 */
const pageCount = computed(() => previewPages.value.length);

/* ==================== 生命周期 ==================== */

/**
 * 按路由 query 初始化：带 paperId 回读详情，否则空白新建（可预填学科/学段）。
 */
async function initFromRoute() {
  const raw = route.query.paperId;
  const id = Number(Array.isArray(raw) ? raw[0] : raw);
  if (Number.isFinite(id) && id > 0) {
    try {
      await loadDetail(id);
    } catch (e) {
      ElMessage.error("试卷加载失败: " + errorText(e));
    }
    return;
  }
  // 未带 paperId：保持未保存空白新建；兼容旧入口的学科/学段预填
  header.subject = queryText(route.query.subject) || header.subject;
  header.gradeLevel = queryText(route.query.gradeLevel) || header.gradeLevel;
}

onMounted(() => {
  void initFromRoute();
  void loadDimensionMeta();
  if (previewViewportRef.value && typeof ResizeObserver !== "undefined") {
    // 观察滚动容器（卡片 body）而不是预览自身：预览是 overflow:visible，
    // 其自身高度等于内容高度，量不到「可用高度」。
    const host = previewViewportRef.value.parentElement ?? previewViewportRef.value;
    previewObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        previewViewportWidth.value = entry.contentRect.width;
        previewViewportHeight.value = entry.contentRect.height;
      }
    });
    previewObserver.observe(host);
  } else if (previewViewportRef.value) {
    previewViewportWidth.value = previewViewportRef.value.clientWidth;
    previewViewportHeight.value =
      previewViewportRef.value.parentElement?.clientHeight ?? previewViewportRef.value.clientHeight;
  }
});

onBeforeUnmount(() => {
  previewObserver?.disconnect();
  previewObserver = null;
});
</script>

<style scoped>
/* ---------- 整体两栏布局：左试卷画布 / 右购物车 ---------- */
.compose-page {
  display: flex;
  gap: 14px;
  padding: 16px;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

/*
  三栏布局：左=试卷题目 / 中=纸张预览 / 右=购物车。
  每栏卡片自身是 flex 列，body 承担内部滚动 —— 卡片默认 flex:0 1 auto 会被压缩到
  小于内容高度并裁切内容，所以这里显式给出各栏的伸缩比例与 min-height:0。
*/
.compose-main {
  flex: 1.15 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-card {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 题目栏与预览栏的 body 各自滚动，header 固定 */
.compose-main :deep(.el-card__body),
.preview-card :deep(.el-card__body) {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.cart-panel {
  flex: 0 0 340px;
  min-height: 0;
  display: flex;
}

/* ---------- 卡片通用 ---------- */
.canvas-card,
.cart-card {
  border-radius: 14px;
  border: 0;
}

.cart-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cart-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 14px 10px;
  gap: 10px;
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
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.panel-head__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.panel-head__sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.panel-head__meta {
  white-space: nowrap;
}

/* 标题右侧的操作图标组（设置/保存/发布、购物车的添加/清空） */
.panel-head__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ---------- 工具条 ---------- */
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

.tool-field--score {
  width: 170px;
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
  gap: 6px;
  margin-left: auto;
}

/* ---------- 题目清单投放区（购物车拖拽落点） ---------- */
.compose-dropzone {
  min-height: 120px;
  border: 1px dashed transparent;
  border-radius: 10px;
  transition: border-color 0.15s, background 0.15s;
}

.compose-dropzone.is-cart-over {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

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

/* ---------- 右栏：购物车 ---------- */
.cart-summary {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
  padding: 6px 10px;
}

.cart-list {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-empty {
  padding-top: 12px;
}

.cart-row {
  flex-shrink: 0;
  padding: 9px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  cursor: grab;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.cart-row:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.08);
}

.cart-row.is-dragging {
  opacity: 0.45;
  cursor: grabbing;
}

.cart-row__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.cart-row__handle {
  color: var(--el-text-color-placeholder);
  cursor: grab;
}

.cart-row__subject {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.cart-row__stem {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.cart-row__stem :deep(.katex) {
  font-size: 0.95em;
}

.cart-row__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.cart-row__score {
  width: 108px;
}

.cart-tip {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 8px;
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

/* ---------- 设置弹框 ---------- */
.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  min-height: 520px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-field--grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.settings-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.settings-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  border-left: 1px solid var(--el-border-color-lighter);
  padding-left: 18px;
}

.settings-preview__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.settings-preview__viewport {
  flex: 1;
  min-height: 0;
  max-height: 620px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

/* ---------- 纸张预览（画布内与设置弹框内共用） ---------- */
.preview-viewport {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  /* 原先 overflow:hidden 会把超出卡片高度的 A4 直接切掉；
     改为可见溢出交给外层（卡片 body 已是 overflow-y:auto）滚动查看 */
  overflow: visible;
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

/* 大标题风格：classic / modern / simple / exam */
.paper-header__title.is-classic {
  font-family: "Songti SC", "SimSun", serif;
  letter-spacing: 3px;
}

.paper-header__title.is-modern {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  letter-spacing: 1px;
  text-align: left;
}

.paper-header__title.is-simple {
  font-weight: 500;
  letter-spacing: 6px;
  color: #4b5563;
}

.paper-header__title.is-exam {
  letter-spacing: 4px;
  border-bottom: 3px double #1f2329;
  padding-bottom: 6px;
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
