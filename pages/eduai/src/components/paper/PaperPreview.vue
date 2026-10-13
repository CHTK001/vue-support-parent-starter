<template>
  <div ref="viewportRef" class="pp-viewport">
    <div v-for="(page, pi) in pages" :key="pi" class="pp-group">
      <div class="pp-slot" :style="slotStyle">
        <div class="pp-page" :style="pageStyle">
          <!-- 首页页头：页头富文本优先，否则回落到「大标题 + 信息行」 -->
          <div v-if="pi === 0" class="pp-header">
            <div v-if="hasHeaderContent" class="pp-header__rich" v-html="headerHtml" />
            <template v-else>
              <div class="pp-header__title" :class="`is-${header.titleStyle || 'classic'}`">
                {{ header.name || "未命名试卷" }}
              </div>
              <div class="pp-header__meta">{{ metaLine }}</div>
            </template>
          </div>

          <div class="pp-body">
            <!-- 答题卡：只保留题号与作答区，像正式答题卡一样整页留空 -->
            <div v-if="activeMode === 'answer-sheet'" class="pp-answer-sheet">
              <div v-for="item in page" :key="item.key" class="pp-answer-sheet__row">
                <span class="pp-answer-sheet__no">{{ item.no }}.</span>
                <div class="pp-answer-sheet__lines">
                  <div v-for="n in answerSheetLineCount(item)" :key="n" class="pp-answer-sheet__line" />
                </div>
                <span class="pp-answer-sheet__type">{{ typeName(item.q.type) }} {{ item.q.score }}分</span>
              </div>
            </div>

            <!-- 参考答案：题号 + 答案 + 解析，便于核对 -->
            <div v-else-if="activeMode === 'answer-key'" class="pp-answer-key">
              <div v-for="item in page" :key="item.key" class="pp-answer-key__row">
                <span class="pp-answer-key__no">{{ item.no }}.</span>
                <div class="pp-answer-key__main">
                  <div class="pp-answer-key__answer">
                    <span class="pp-answer-key__label">答案</span>
                    <span v-if="item.answerContent" v-html="renderMixedText(item.answerContent)" />
                    <span v-else class="pp-answer-key__empty">未录入</span>
                  </div>
                  <div v-if="item.q.analysis" class="pp-answer-key__analysis">
                    <span class="pp-answer-key__label">解析</span>
                    <span v-html="renderRichWithMath(item.q.analysis)" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 试卷 / 已作答：正常题目版式；已作答额外叠写答案痕迹 -->
            <template v-else>
              <div v-for="item in page" :key="item.key" class="pp-question">
                <div class="pp-question__stem">
                  <span class="pp-question__no">{{ item.no }}.</span>
                  <span v-if="item.stemHtml" class="pp-question__html" v-html="item.stemHtml" />
                  <span v-else class="pp-question__empty">（题干为空）</span>
                  <span class="pp-question__score">（{{ item.q.score }} 分）</span>
                </div>
                <div v-if="item.options.length" class="pp-question__options">
                  <div v-for="(opt, oi) in item.options" :key="oi" class="pp-option">
                    <span class="pp-option__letter">{{ optionLetter(oi) }}.</span>
                    <span v-html="renderMixedText(opt)" />
                  </div>
                  <div v-if="activeMode === 'answered' && item.writtenAnswer" class="pp-question__answered-choice">
                    <span class="pp-question__answered-label">作答</span>
                    <b>{{ item.writtenAnswer }}</b>
                  </div>
                </div>
                <!-- 主观题留出空白书写区；已作答模式在空白区叠写答案 -->
                <div v-if="item.answerHeight > 0" class="pp-question__answer" :style="{ height: `${item.answerHeight}px` }">
                  <div
                    v-if="activeMode === 'answered' && item.writtenAnswer"
                    class="pp-answer__written"
                    v-html="renderMixedText(item.writtenAnswer)"
                  />
                </div>
                <!-- 客观题也给一个显式作答行，卷面看起来更接近真实试卷 -->
                <div
                  v-else-if="activeMode !== 'answered' && item.options.length"
                  class="pp-question__objective-answer"
                >
                  作答：________
                </div>
                <div
                  v-else-if="activeMode === 'answered' && item.options.length && !item.writtenAnswer"
                  class="pp-question__objective-answer"
                >
                  作答：________
                </div>
              </div>
            </template>
            <div v-if="!page.length" class="pp-body__empty">{{ emptyText }}</div>
          </div>

          <div class="pp-footer">
            <div v-if="hasFooterContent" class="pp-footer__rich" v-html="footerHtml" />
            <div class="pp-footer__page">第 {{ pi + 1 }} 页 / 共 {{ pages.length }} 页</div>
          </div>
        </div>
      </div>
      <div v-if="pi < pages.length - 1" class="pp-gap">第 {{ pi + 1 }} 页</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PaperPreview —— 试卷纸张预览（A4/A3/A5/B5/LETTER × 纵横）
 *
 * <p>原先这段分页与页面渲染逻辑只存在于组卷页内，且在中栏与设置弹框里各复制了一份；
 * 试卷列表的「详情」也需要同一套渲染。此处抽为唯一实现，组卷页与详情弹框共用。</p>
 *
 * <p>分页是<b>估算</b>而非真实排版：按题型给每道题一个基准高度，再叠加题干行数、
 * 选项行数与主观题作答留白，累加超出当前页可容纳高度就新起一页。
 * 好处是无需等待浏览器测量即可稳定出页数，代价是与打印结果可能有极小出入。</p>
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { htmlToMathText, renderMixedText, renderRichWithMath } from "../../utils/mathText";

/** 导出 / 预览内容模式 */
export type PaperExportMode = "paper" | "answer-sheet" | "answer-key" | "answered";

/** 卷头 / 纸张 / 模板设置（只保留预览用到的字段，其余忽略） */
export interface PreviewHeader {
  /** 试卷名称；为空时显示「未命名试卷」 */
  name?: string;
  /** 学科，进入首页信息行 */
  subject?: string;
  /** 学段码值：PRIMARY / JUNIOR / SENIOR / UNIVERSITY / OTHER */
  gradeLevel?: string;
  /** 年级 */
  grade?: string;
  /** 纸张规格：留空按 A4 */
  pageSize?: string;
  /** 纸张方向：LANDSCAPE 为横向 */
  pageOrientation?: string;
  /** 大标题风格：classic / modern / simple / exam */
  titleStyle?: string;
  /** 页头富文本；非空时取代默认标题块 */
  header?: string;
  /** 页脚富文本 */
  footer?: string;
}

/** 一道题（预览所需的最小字段集） */
export interface PreviewQuestion {
  /** 题目标识，用作渲染 key */
  questionId: number;
  /** 题型码值，决定基准高度与作答留白 */
  type?: string;
  /** 题干（可为富文本） */
  stem?: string;
  /** 选项列表（JSON 文本或分隔符文本） */
  options?: string;
  /** 分值，显示在题干末尾 */
  score?: number;
  /** 题项编号；缺省时用序号 */
  paperQuestionNo?: string;
  /** 标准答案（试卷详情带 answer 字段时用于参考答案/已作答导出） */
  answer?: string;
  /** 题目解析（答案页导出） */
  analysis?: string;
}

const props = withDefaults(
  defineProps<{
    /** 卷头 / 纸张设置 */
    header: PreviewHeader;
    /** 题目列表（已按最终顺序排列） */
    questions: PreviewQuestion[];
    /**
     * 固定可用宽度（px）。不传时按自身容器宽度自适应，
     * 用于宽度已知的场景（如弹框右侧预览）避免首帧缩放抖动。
     */
    fitWidth?: number;
    /**
     * 手动缩放倍率（相对「适应宽度」）。1 = 原始自适应。
     * 供带缩放按钮的调用方叠加在其自身的档位状态上。
     */
    zoom?: number;
    /** 空卷时的提示文案 */
    emptyText?: string;
    /** 内容模式：试卷 / 答题卡 / 参考答案 / 已作答 */
    mode?: PaperExportMode;
    /**
     * 已作答模式的手写/勾选答案。
     * key 优先用 paperQuestionNo，其次用 String(questionId)。
     */
    answers?: Record<string, string>;
  }>(),
  { fitWidth: 0, zoom: 1, emptyText: "试卷还没有题目", mode: "paper", answers: () => ({}) },
);

defineOptions({ name: "PaperPreview" });

/** 学段码值 → 中文名（与 edu_question / edu_paper 落库值一致） */
const GRADE_LEVEL_LABELS: Record<string, string> = {
  PRIMARY: "小学",
  JUNIOR: "初中",
  SENIOR: "高中",
  UNIVERSITY: "大学",
  OTHER: "其他",
};

/** 纸张规格（按 96dpi 折算的屏幕像素近似值） */
const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1587 },
  A5: { width: 559, height: 794 },
  B5: { width: 665, height: 945 },
  LETTER: { width: 816, height: 1056 },
};

/** 分页估算参数（px） */
const PAGE_PADDING = 40;
const HEADER_HEIGHT_RICH = 132;
const HEADER_HEIGHT_DEFAULT = 88;
const FOOTER_HEIGHT = 56;

/** 答题卡每题的固定行数（主观题多留空，客观题一行即可） */
const ANSWER_SHEET_LINES_BY_TYPE: Record<string, number> = {
  SINGLE_CHOICE: 2,
  MULTIPLE_CHOICE: 2,
  JUDGE: 2,
  FILL: 3,
  SHORT_ANSWER: 6,
  SUBJECTIVE: 6,
  ESSAY: 10,
};

/** 题型码值 → 中文名 */
const TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTIPLE_CHOICE: "多选",
  JUDGE: "判断",
  FILL: "填空",
  SHORT_ANSWER: "简答",
  SUBJECTIVE: "主观",
  ESSAY: "作文",
};

/** 缩放下限，避免窄容器下缩到不可读 */
const MIN_SCALE = 0.2;

/** 缩放上限，防止放大到纸张溢出容器后无法回看 */
const MAX_SCALE = 3;

/** 预览页中的一道题（题干 / 选项已预渲染，模板内不再重复解析） */
interface PreviewItem {
  /** 渲染 key：题项编号优先，缺省用题目标识 */
  key: string;
  /** 原题对象 */
  q: PreviewQuestion;
  /** 试卷内连续序号（1 起） */
  no: number;
  /** 已解析的选项文本 */
  options: string[];
  /** 已渲染公式的题干 HTML */
  stemHtml: string;
  /** 作答留白高度，客观题为 0 */
  answerHeight: number;
  /** 标准答案（模板渲染/导出用） */
  answerContent: string;
  /** 预写的模拟作答（answer-sheet/answered 模式用） */
  writtenAnswer: string;
}

const optionLetter = (i: number): string => String.fromCharCode(65 + i);

/**
 * 去掉选项文本自带的序号前缀（`A.` / `B、` / `C)` / `D．` 等），
 * 避免与模板里统一渲染的 `optionLetter(oi) + '.'` 重复（`A.A. xxx`）。
 */
function stripOptionPrefix(text: string): string {
  return text.replace(/^[A-Ha-h][.、．)）:：]\s*/, "");
}

/** 选项列可能是 JSON 数组 / JSON 对象，也可能是换行或分号分隔的文本 */
function parseOptions(raw?: string): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => stripOptionPrefix(String(v)));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}. ${stripOptionPrefix(String(v))}`);
    }
    return [stripOptionPrefix(String(parsed))];
  } catch {
    return String(raw)
      .split(/[\n;；]/)
      .map((s) => stripOptionPrefix(s.trim()))
      .filter(Boolean);
  }
}

/** 主观题作答留白高度：客观题在题干处作答，不额外留白 */
function answerSpaceHeight(type?: string): number {
  if (type === "FILL") {
    return 34;
  }
  if (type === "SHORT_ANSWER") {
    return 60;
  }
  // 后端「SUBJECTIVE」是另一套主观题型码（如翻译句子），与 SHORT_ANSWER 同级留白；
  // 不识别它会导致这类题既没有留白区、又没有选项兜底行，卷面上完全看不到作答区。
  if (type === "SUBJECTIVE") {
    return 60;
  }
  if (type === "ESSAY") {
    return 96;
  }
  return 0;
}

/** 各题型的单题基准高度 */
const BASE_HEIGHTS: Record<string, number> = {
  SINGLE_CHOICE: 44,
  MULTIPLE_CHOICE: 44,
  JUDGE: 40,
  FILL: 40,
  SHORT_ANSWER: 44,
  ESSAY: 48,
};

/** 题干每行可容纳的字符数（用于估算折行数） */
const STEM_CHARS_PER_LINE = 38;

/** 每个选项行可容纳的字符数 */
const OPTION_CHARS_PER_LINE = 44;

/** 折行行高 */
const LINE_HEIGHT = 21;

const paperWidth = computed(() => {
  const size = PAPER_SIZES[props.header.pageSize ?? "A4"] ?? PAPER_SIZES.A4;
  return props.header.pageOrientation === "LANDSCAPE" ? size.height : size.width;
});

const paperHeight = computed(() => {
  const size = PAPER_SIZES[props.header.pageSize ?? "A4"] ?? PAPER_SIZES.A4;
  return props.header.pageOrientation === "LANDSCAPE" ? size.width : size.height;
});

const headerHtml = computed(() => renderRichWithMath(props.header.header));
const footerHtml = computed(() => renderRichWithMath(props.header.footer));
const hasHeaderContent = computed(() => htmlToMathText(props.header.header).length > 0);
const hasFooterContent = computed(() => htmlToMathText(props.header.footer).length > 0);

/** 首页信息行：学科 · 学段年级 · 题数 · 满分 */
const metaLine = computed(() => {
  const parts: string[] = [];
  if (props.header.subject) {
    parts.push(props.header.subject);
  }
  const level = GRADE_LEVEL_LABELS[props.header.gradeLevel ?? ""] ?? "";
  const gradeText = `${level}${props.header.grade || ""}`;
  if (gradeText) {
    parts.push(gradeText);
  }
  parts.push(`${props.questions.length} 题`);
  const full = props.questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
  parts.push(`满分 ${full} 分`);
  const suffix =
    activeMode.value === "answer-sheet" ? " · 答题卡"
      : activeMode.value === "answer-key" ? " · 参考答案"
        : activeMode.value === "answered" ? " · 已作答" : "";
  return parts.join(" · ") + suffix;
});

/** 组装单题预览数据 */
function buildItem(q: PreviewQuestion, index: number): PreviewItem {
  const byNo = q.paperQuestionNo ? activeAnswers.value[q.paperQuestionNo] : "";
  const byId = activeAnswers.value[String(q.questionId)];
  return {
    key: q.paperQuestionNo || `Q${q.questionId}`,
    q,
    no: index + 1,
    options: parseOptions(q.options),
    stemHtml: renderRichWithMath(q.stem),
    answerHeight: answerSpaceHeight(q.type),
    answerContent: q.answer || "",
    writtenAnswer: byNo || byId || "",
  };
}

/** 题型中文名（答题卡紧凑显示） */
function typeName(type?: string): string {
  return TYPE_LABEL[type ?? ""] ?? type ?? "-";
}

/** 答题卡模式的单题估算行数 */
function answerSheetLineCount(item: PreviewItem): number {
  return ANSWER_SHEET_LINES_BY_TYPE[item.q.type ?? ""] ?? 3;
}

/** 估算题项渲染高度：基准 + 题干超首行部分 + 选项行 + 作答留白 */
function estimateHeight(item: PreviewItem, mode: PaperExportMode = "paper"): number {
  const stemLines = Math.max(1, Math.ceil(htmlToMathText(item.q.stem).length / STEM_CHARS_PER_LINE));
  const optionLines = item.options.reduce(
    (sum, text) => sum + Math.max(1, Math.ceil(htmlToMathText(text).length / OPTION_CHARS_PER_LINE)),
    0,
  );
  if (mode === "answer-sheet") {
    const lineHeight = 28;
    return (BASE_HEIGHTS[item.q.type ?? ""] ?? 44) + answerSheetLineCount(item) * lineHeight + 8;
  }
  if (mode === "answer-key") {
    const answerLines = Math.max(1, Math.ceil(htmlToMathText(item.answerContent).length / STEM_CHARS_PER_LINE));
    const analysisLines = Math.max(0, Math.ceil(htmlToMathText(item.q.analysis).length / STEM_CHARS_PER_LINE));
    return 46 + answerLines * LINE_HEIGHT + analysisLines * LINE_HEIGHT + 8;
  }
  const objectiveAnswerHeight = item.options.length ? 22 : 0;
  return (BASE_HEIGHTS[item.q.type ?? ""] ?? 44) + (stemLines - 1) * LINE_HEIGHT
    + optionLines * LINE_HEIGHT + item.answerHeight + objectiveAnswerHeight + 14;
}

const headerBlockHeight = computed(() => (hasHeaderContent.value ? HEADER_HEIGHT_RICH : HEADER_HEIGHT_DEFAULT));

/** 当前实际渲染模式：导出时可以临时覆盖 */
const exportModeOverride = ref<PaperExportMode | null>(null);
const exportAnswersOverride = ref<Record<string, string> | null>(null);
const exportScaleOverride = ref<number | null>(null);

const activeMode = computed<PaperExportMode>(() => exportModeOverride.value ?? props.mode);
const activeAnswers = computed<Record<string, string>>(() => exportAnswersOverride.value ?? props.answers);

/** 多页切分：按估算高度装箱，超出当前页可容纳高度就新起一页；空卷也返回一页 */
const pages = computed<PreviewItem[][]>(() => {
  const items = props.questions.map(buildItem);
  const limit = paperHeight.value - PAGE_PADDING - FOOTER_HEIGHT;
  const firstPageStart = PAGE_PADDING + headerBlockHeight.value + 12;
  const laterPageStart = PAGE_PADDING + 12;

  const result: PreviewItem[][] = [];
  let current: PreviewItem[] = [];
  let used = firstPageStart;

  for (const item of items) {
    const height = estimateHeight(item, activeMode.value);
    if (current.length > 0 && used + height > limit) {
      result.push(current);
      current = [];
      used = laterPageStart;
    }
    current.push(item);
    used += height;
  }
  result.push(current);
  return result;
});

/* ==================== 自适应缩放 ==================== */

const viewportRef = ref<HTMLElement | null>(null);
const viewportWidth = ref(0);
let observer: ResizeObserver | null = null;

/**
 * 等比缩放：先按宽度自适应（fitWidth 优先，否则用自身容器宽度），再叠加手动 zoom。
 *
 * <p>不按高度缩放：A4 在 96dpi 下高约 1123px，塞进几百像素高的容器会缩到 20%~30%，
 * 文字不可读。外层容器负责纵向滚动即可。</p>
 */
const scale = computed(() => {
  if (exportScaleOverride.value !== null) {
    return exportScaleOverride.value;
  }
  const available = props.fitWidth > 0 ? props.fitWidth : viewportWidth.value;
  const fit = (() => {
    if (available <= 0) {
      return 1;
    }
    const usable = available - 24;
    if (usable >= paperWidth.value) {
      return 1;
    }
    return Math.max(MIN_SCALE, usable / paperWidth.value);
  })();
  return Math.min(MAX_SCALE, fit * props.zoom);
});

/** 总页数；空卷也返回 1 */
const pageCount = computed(() => pages.value.length);

/** 外层占位盒尺寸：缩放后纸张的实际占位 */
const slotStyle = computed(() => ({
  width: `${paperWidth.value * scale.value}px`,
  height: `${paperHeight.value * scale.value}px`,
}));

/** 纸张本体：按原始像素排版，用 transform 缩放 */
const pageStyle = computed(() => ({
  width: `${paperWidth.value}px`,
  height: `${paperHeight.value}px`,
  transform: `scale(${scale.value})`,
}));

// 页数与缩放倍率供调用方显示（如工具栏的「共 N 页」与缩放百分比）
defineExpose({ pageCount, scale, exportA4Images });

/** 导出所有 A4 页为 PNG，逐页触发下载 */
async function exportA4Images(options: {
  mode?: PaperExportMode;
  answers?: Record<string, string>;
  filename?: string;
  /** 导出画布倍率；2 约为 1588×2246 A4 图片 */
  scale?: number;
} = {}): Promise<void> {
  const mode = options.mode ?? activeMode.value;
  const filename = options.filename || props.header.name || "paper";
  exportModeOverride.value = mode;
  exportAnswersOverride.value = options.answers ?? activeAnswers.value;
  exportScaleOverride.value = 1;
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  try {
    const pageEls = Array.from(viewportRef.value?.querySelectorAll(".pp-page") ?? []);
    if (!pageEls.length) {
      throw new Error("没有可导出的纸张页面");
    }
    const scale = options.scale ?? 2;
    const html2canvas = (await import("html2canvas")).default;
    const blobs: Blob[] = [];
    for (let i = 0; i < pageEls.length; i += 1) {
      const canvas = await html2canvas(pageEls[i] as HTMLElement, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error(`第 ${i + 1} 页导出失败`);
      }
      blobs.push(blob);
    }
    const safeBase = filename.replace(/[\\/:*?"<>|]+/g, "-").trim() || "paper";
    blobs.forEach((blob, i) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeBase}-${mode}-page-${i + 1}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  } finally {
    exportModeOverride.value = null;
    exportAnswersOverride.value = null;
    exportScaleOverride.value = null;
    await nextTick();
  }
}

onMounted(() => {
  const el = viewportRef.value;
  if (!el || typeof ResizeObserver === "undefined") {
    return;
  }
  observer = new ResizeObserver((entries) => {
    viewportWidth.value = entries[0]?.contentRect.width ?? 0;
  });
  observer.observe(el);
  viewportWidth.value = el.clientWidth;
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

// fitWidth 变化时不需要重算容器宽度；questions 变化只影响分页
watch(() => props.fitWidth, () => {
  if (props.fitWidth > 0) {
    viewportWidth.value = 0;
  }
});
</script>

<style scoped>
.pp-viewport {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 必须显式撑满父容器：调用方（如组卷页的 .preview-viewport）是
     align-items:center 的 flex 列，不写 width 时本节点会被收缩成「内容宽度」，
     而内容宽度又随缩放变化 —— 会给下方 ResizeObserver 的自适应缩放喂出正反馈环
     （放大→纸张变宽→量到的可用宽度变大→再放大），表现为点「适应宽度」不复位。
     这里以父容器的确定宽度为准，观测值才稳定。 */
  width: 100%;
  /* 可见溢出交给外层滚动；这里不裁切，否则超出容器的纸张会被切掉 */
  overflow: visible;
}

.pp-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pp-slot {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.pp-page {
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

.pp-header {
  flex-shrink: 0;
  text-align: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e6eb;
  margin-bottom: 12px;
}

.pp-header__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}

.pp-header__title.is-classic {
  font-family: "Songti SC", "SimSun", serif;
  letter-spacing: 3px;
}

.pp-header__title.is-modern {
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  letter-spacing: 1px;
  text-align: left;
}

.pp-header__title.is-simple {
  font-weight: 500;
  letter-spacing: 6px;
  color: #4b5563;
}

.pp-header__title.is-exam {
  letter-spacing: 4px;
  border-bottom: 3px double #1f2329;
  padding-bottom: 6px;
}

.pp-header__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.pp-header__rich {
  font-size: 14px;
}

.pp-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pp-body__empty {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.pp-question__stem {
  font-size: 13.5px;
  line-height: 1.65;
}

.pp-question__no {
  font-weight: 700;
  margin-right: 4px;
}

.pp-question__score {
  margin-left: 6px;
  font-size: 12px;
  color: #6b7280;
}

.pp-question__empty {
  color: #9ca3af;
}

.pp-question__options {
  margin-top: 4px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pp-option {
  font-size: 13px;
  line-height: 1.6;
}

.pp-option__letter {
  font-weight: 600;
  margin-right: 4px;
}

.pp-question__answer {
  margin-top: 6px;
  border: 1px dashed #d0d3d9;
  border-radius: 4px;
}

.pp-answer__written {
  padding: 8px 12px;
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "SimSun", serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
}

.pp-question__objective-answer {
  margin-top: 5px;
  padding-left: 18px;
  font-size: 13px;
  color: #444;
  letter-spacing: 1px;
}

.pp-question__answered-choice {
  margin-top: 4px;
  padding-left: 18px;
  font-size: 13px;
}

.pp-question__answered-label {
  margin-right: 4px;
  color: #6b7280;
}

.pp-answer-sheet {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pp-answer-sheet__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e6eb;
}

.pp-answer-sheet__no {
  width: 30px;
  font-weight: 700;
  font-size: 13px;
  line-height: 1.5;
}

.pp-answer-sheet__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.pp-answer-sheet__line {
  height: 19px;
  border-bottom: 1px solid #c0c4cc;
}

.pp-answer-sheet__type {
  flex-shrink: 0;
  font-size: 11px;
  color: #6b7280;
  line-height: 24px;
}

.pp-answer-key {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pp-answer-key__row {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e6eb;
}

.pp-answer-key__no {
  width: 30px;
  font-weight: 700;
  font-size: 13px;
  line-height: 1.6;
}

.pp-answer-key__main {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
}

.pp-answer-key__answer {
  display: flex;
  gap: 6px;
}

.pp-answer-key__analysis {
  margin-top: 4px;
  padding-left: 34px;
  color: #4b5563;
}

.pp-answer-key__label {
  flex-shrink: 0;
  font-weight: 700;
  color: #1f2329;
}

.pp-answer-key__empty {
  color: #9ca3af;
}

.pp-footer {
  flex-shrink: 0;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e6eb;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.pp-footer__rich {
  margin-bottom: 4px;
}

.pp-footer__page {
  letter-spacing: 1px;
}

/* 页面之间的留缝 + 页码 */
.pp-gap {
  margin: 14px 0;
  padding: 2px 14px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border: 1px dashed var(--el-border-color);
}
</style>
