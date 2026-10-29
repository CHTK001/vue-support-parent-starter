<template>
  <div class="sheet-structure">
    <header class="ss-toolbar">
      <div class="ss-toolbar__left">
        <span class="ss-eyebrow">阅卷详情</span>
        <el-radio-group v-model="mode" size="small" class="ss-mode">
          <el-radio-button value="layout">版面解析</el-radio-button>
          <el-radio-button value="original">原始试卷</el-radio-button>
        </el-radio-group>
        <div v-if="recognizedStudent" class="ss-student">
          卷面识别：<b>{{ recognizedStudent.name || '（姓名未识别）' }}</b>
          <span v-if="recognizedStudent.no">· 学号 {{ recognizedStudent.no }}</span>
        </div>
      </div>
      <div v-if="pageCount > 1" class="ss-pager">
        <el-button size="small" :disabled="page <= 1" @click="changePage(-1)">上一页</el-button>
        <span class="ss-pager__text">第 {{ page }} / {{ pageCount }} 页</span>
        <el-button size="small" :disabled="page >= pageCount" @click="changePage(1)">下一页</el-button>
      </div>
    </header>

    <div v-if="mode === 'layout'" class="ss-legend">
      <span class="ss-dot ss-correct"></span>正确
      <span class="ss-dot ss-partial"></span>部分分
      <span class="ss-dot ss-wrong"></span>错误
      <span class="ss-tip">点击卷面题号可定位右侧题目，点击表格行可定位卷面位置</span>
    </div>

    <div class="ss-body" :class="{ 'ss-body--original': mode === 'original' }">
      <section class="ss-stage-card">
        <div class="ss-stage-head">
          <div>
            <strong>答卷扫描</strong>
            <span class="ss-muted">{{ mode === 'layout' ? '版面解析' : '原始试卷' }}</span>
          </div>
          <div class="ss-stage-actions">
            <el-switch
              v-model="showMarkers"
              size="small"
              inline-prompt
              active-text="标记"
              inactive-text="隐藏"
            />
            <span class="ss-stage-page">第 {{ page }} / {{ pageCount || 1 }} 页</span>
          </div>
        </div>
        <div class="ss-stage-viewport" ref="stageWrapRef">
          <button
            v-if="pageCount > 1 && page > 1"
            class="ss-nav ss-nav--stage ss-nav--prev"
            title="上一页"
            @click="changePage(-1)"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <button
            v-if="pageCount > 1 && page < pageCount"
            class="ss-nav ss-nav--stage ss-nav--next"
            title="下一页"
            @click="changePage(1)"
          >
            <el-icon><ArrowRight /></el-icon>
          </button>
          <div class="ss-stage">
            <img v-if="imageUrl" ref="imageRef" :src="imageUrl" class="ss-image" alt="答卷" />
            <div v-if="imageUrl && showMarkers" class="ss-overlay">
              <div
                v-for="(b, i) in currentLayout"
                :key="'layout-' + i"
                class="ss-layout"
                :class="{ 'ss-layout-active': activeLayout === i }"
                :style="boxStyle(b)"
                @click="activeLayout = activeLayout === i ? -1 : i"
              >
                <span class="ss-layout-label">{{ b.label }}</span>
              </div>
              <div
                v-for="a in boundAnchors"
                :key="'anchor-' + a.page + '-' + a.no + '-' + a.x + '-' + a.y"
                class="ss-anchor"
                :class="[anchorClass(a), { 'ss-anchor-selected': isAnchorSelected(a) }]"
                :style="boxStyle(a)"
                @click="selectAnchor(a)"
              >
                <span class="ss-badge">{{ anchorText(a) }}</span>
              </div>
            </div>
            <div v-if="!imageUrl && imageLoading" class="ss-image-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              正在加载答卷图片…
            </div>
            <el-empty v-else-if="!imageUrl" description="未取到答卷图片" :image-size="80" />
          </div>
        </div>
      </section>

      <aside v-if="mode === 'layout'" class="ss-panel">
        <div class="ss-panel-head">
          <div>
            <strong>题目解析</strong>
            <span class="ss-muted">{{ currentQuestions.length }} / {{ questions.length }} 题</span>
          </div>
          <div v-if="pageCount > 1" class="ss-panel-pager">
            <el-button link size="small" :disabled="page <= 1" @click="changePage(-1)">
              <el-icon><ArrowLeft /></el-icon>上一页
            </el-button>
            <el-button link size="small" :disabled="page >= pageCount" @click="changePage(1)">
              下一页<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-loading="structureLoading" class="ss-panel-table">
          <ReTable
            ref="questionTable"
            :data="currentQuestions"
            :columns="questionColumns"
            engine="element"
            row-key="resultId"
            :table-id="`edu-sheet-${taskId}`"
            :show-selection="isExternalPaper"
            :layout-table="{ fill: true }"
            :settings="{ border: false }"
            @row-click="(row: any) => selectRow(row)"
            @selection-change="onQuestionSelectionChange"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-no="{ row }">
              <span :class="{ 'ss-row-active': Number(row.resultId) === selectedId }">
                {{ row.no || '-' }}
                <el-tag v-if="isUnrecognized(row)" size="small" :type="unrecTagType"
                  effect="dark" class="ss-unrec-tag" :title="unrecTagTitle">
                  {{ unrecLabel }}
                </el-tag>
              </span>
            </template>
            <template #col-stem="{ row }">
              <span class="ss-stem">{{ row.stem || '—' }}</span>
            </template>
            <template #col-score="{ row }">
              <span class="ss-ai-score">
                {{ row.score ?? '-' }}{{ row.maxScore != null && row.maxScore !== '' ? `/${row.maxScore}` : '' }}
              </span>
            </template>
            <template #col-editScore="{ row }">
              <ReInputNumber
                v-model="row.editScore"
                :min="0"
                :max="row.maxScore ?? 100"
                :disabled="isVirtual(row)"
                controls-position="right"
                size="small"
                @update:model-value="onScoreChange(row)"
              />
            </template>
            <template #col-studentAnswer="{ row }">
              <span v-if="isUnrecognized(row)" class="ss-unrec-answer" :title="row.comment">
                {{ unrecLabel }}·请老师补录作答
              </span>
              <span v-else-if="isBlankAnswer(row)" class="ss-no-answer">未作答</span>
              <span v-else>{{ row.studentAnswer }}</span>
            </template>
            <template #col-standardAnswer="{ row }">
              <span class="ss-standard-answer">{{ row.standardAnswer || '—' }}</span>
            </template>
            <template #col-comment="{ row }">{{ row.comment || '—' }}</template>
            <template #col-editComment="{ row }">
              <div class="ss-comment-cell">
                <span class="ss-comment-text" :title="row.editComment || ''">{{ row.editComment || '—' }}</span>
                <el-button size="small" type="primary" link :disabled="isVirtual(row) || !row.score && !row.comment" @click.stop="applyAi(row)">采用AI</el-button>
                <el-icon
                  class="ss-comment-edit"
                  :class="{ 'ss-comment-edit--filled': !!row.editComment }"
                  :title="row.editComment ? '编辑老师评语' : '添加老师评语（真实老师填写）'"
                  @click.stop="openCommentEditor(row)"
                >
                  <EditPen />
                </el-icon>
              </div>
            </template>
            <template #col-knowledgePoints="{ row }">
              <template v-if="kpList(row).length">
                <ReTag
                  v-for="kp in kpList(row)"
                  :key="kp.id"
                  size="small"
                  class="ss-kp"
                  @click.stop="openKp(kp)"
                >{{ kp.name }}</ReTag>
              </template>
              <span v-else class="ss-muted">无</span>
            </template>
          </ReTable>
        </div>
        <footer class="ss-actions">
          <el-button type="primary" :disabled="!dirty" :loading="saving" @click="save()">保存老师分</el-button>
          <el-button type="success" :disabled="applyAllDisabled" @click="applyAllAi">全部采用AI</el-button>
          <el-button
            v-if="isExternalPaper"
            :disabled="bankSelection.length === 0"
            @click="openBankDialog"
          >
            加入题库{{ bankSelection.length ? `（${bankSelection.length}）` : '' }}
          </el-button>
          <span class="ss-hint">AI 分保留不动，老师分为最终成绩</span>
          <span v-if="selectedQuestion" class="ss-sel">已选中第 {{ selectedQuestion.no }} 题</span>
        </footer>
      </aside>
    </div>

    <ReDrawer v-model="kpDrawer" title="知识点详情" size="360px">
      <div v-if="kpLoading" class="ss-muted">加载中…</div>
      <template v-else>
        <div class="ss-kp-key">查询：{{ kpKeyword }}</div>
        <div v-if="kpDetail.length === 0" class="ss-muted">未找到该知识点的详情（知识点库为空或未建立关联）</div>
        <ul v-else class="ss-kp-list">
          <li v-for="k in kpDetail" :key="k.id ?? k.name">
            <div class="ss-kp-name">{{ k.name }}</div>
            <div class="ss-kp-desc">{{ k.description || k.subject || '' }}</div>
          </li>
        </ul>
      </template>
    </ReDrawer>

    <ReDialog v-model="commentEditor.visible" :title="commentEditorTitle" width="560px" top="10vh">
      <ReInput
        ref="commentInputRef"
        v-model="commentEditor.draft"
        type="textarea"
        :rows="9"
        maxlength="200"
        show-word-limit
        placeholder="写给学生/存档的老师评语（可留空）"
      />
      <div class="ss-comment-dialog-tip">
        AI 评语：{{ commentEditor.row?.comment || '—' }}
      </div>
      <template #footer>
        <el-button @click="commentEditor.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmCommentEditor">确定</el-button>
      </template>
    </ReDialog>

    <ReDialog v-model="bankDialog.visible" title="外来卷题目加入题库" width="820" top="5vh">
      <div class="ss-bank-scope">
        已选 {{ bankDialog.rows.length }} 题（外来卷无标准答案：老师补写的按填写入库；
        <b>未补写的题只有本次判满分才会用学生作答作为标准答案</b>，判错的题需补写答案）。
      </div>
      <el-form label-width="72px" size="small" class="ss-bank-form">
        <div class="ss-bank-row">
          <el-form-item label="学科" required>
            <ReInput v-model="bankDialog.form.questionSubject" placeholder="如：语文" />
          </el-form-item>
          <el-form-item label="学段/年级" required>
            <div class="ss-bank-grade">
              <el-select v-model="bankDialog.form.questionGradeLevel" style="width: 45%">
                <el-option label="小学" value="小学" />
                <el-option label="初中" value="初中" />
                <el-option label="高中" value="高中" />
                <el-option label="大学" value="大学" />
              </el-select>
              <ReInput v-model="bankDialog.form.questionGrade" placeholder="年级，如 五年级" />
            </div>
          </el-form-item>
        </div>
        <div class="ss-bank-row">
          <el-form-item label="难度">
            <ReInputNumber v-model="bankDialog.form.questionDifficulty" :min="1" :max="5" style="width: 100%" />
          </el-form-item>
          <el-form-item label="分值">
            <ReInputNumber
              v-model="bankDialog.form.questionScore"
              :min="0"
              :max="100"
              style="width: 100%"
              placeholder="留 0 用本次满分"
            />
          </el-form-item>
        </div>
        <div class="ss-bank-list">
          <div v-for="(row, i) in bankDialog.rows" :key="row.resultId" class="ss-bank-item">
            <div class="ss-bank-item__head">
              <span class="ss-bank-item__no">第 {{ displayNo(row.no) }} 题</span>
              <el-tag size="small" :type="row.fullScore ? 'success' : 'warning'">
                {{ row.fullScore ? '本次判满分' : `本次 ${row.editScore}/${row.maxScore || '-'} 分` }}
              </el-tag>
              <span class="ss-bank-item__type">{{ typeLabel(guessType(row.stem || '')) }}</span>
              <el-button
                v-if="row.fullScore && !bankDialog.answers[row.resultId]"
                size="small"
                link
                type="primary"
                @click="fillStudentAnswer(i)"
              >用学生作答</el-button>
            </div>
            <div class="ss-bank-item__stem">{{ row.stem || '—' }}</div>
            <div class="ss-bank-item__answer-row">
              <ReInput
                v-model="bankDialog.answers[row.resultId]"
                type="textarea"
                :rows="2"
                :placeholder="row.fullScore
                  ? '标准答案（不填则用本次学生作答，学生作答：' + (row.studentAnswer || '空') + '）'
                  : '标准答案（必填：本题本次判错，学生作答不能当标准答案）'"
              />
            </div>
            <div v-if="!row.fullScore && !String(bankDialog.answers[row.resultId] ?? '').trim()" class="ss-bank-item__tip">
              本题本次判错，未补写答案将跳过入库
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="bankDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="bankDialog.saving" @click="saveToBank">保存入题库</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { eduaiApi } from '../../api/eduaiApi';
import { failToast } from '../../api/errorText';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import ReInputNumber from "@repo/ui/re-input-number";
import ReInput from "@repo/ui/re-input";
import ReDrawer from "@repo/ui/re-drawer";
import ReTag from "@repo/ui/re-tag";
import ReDialog from "@repo/ui/re-dialog";
import { EditPen, Loading } from '@element-plus/icons-vue';

const props = defineProps<{
  taskId: string;
  /**
   * 父级已发出的结构请求（详情页与结果接口并发拉取）。
   *
   * <p>传的是 Promise：结构要 2~3s 才回来，结构视图一挂载就能接上已经在飞的
   * 那次请求，既不用等父级把数据拿全，也不用自己再发一遍（网关单次往返 1.4s）。
   * 为 null 时（工作台内嵌等没有父级的场景）走自己的请求。</p>
   */
  structurePromise?: Promise<Record<string, any>> | null;
}>();
const emit = defineEmits<{ (e: 'saved'): void }>();

const structure = ref<Record<string, any> | null>(null);
const page = ref(1);
/** 左侧答卷扫描是否显示版面框/题号锚点（版面解析与原始试卷均可用） */
const showMarkers = ref(true);
const mode = ref<'layout' | 'original'>('layout');
const imageUrl = ref('');
/** 结构数据加载中（只锁右侧题目表格，不挡整页） */
const structureLoading = ref(false);
/** 卷面图加载中（只锁左侧图片区，避免提前显示「未取到答卷图片」） */
const imageLoading = ref(false);
const activeLayout = ref(-1);
const selectedId = ref<number | null>(null);
const dirty = ref(false);
const saving = ref(false);
const questions = ref<any[]>([]);
const questionTable = ref();

const questionColumns: ReTableColumn[] = [
  { prop: 'no', label: '题号', width: 56, slot: 'no' },
  { prop: 'stem', label: '题目', minWidth: 150, showOverflowTooltip: true, slot: 'stem' },
  { prop: 'score', label: 'AI 分', width: 64, slot: 'score' },
  { prop: 'editScore', label: '老师分', width: 120, slot: 'editScore' },
  { prop: 'studentAnswer', label: '学生作答', minWidth: 110, showOverflowTooltip: true, slot: 'studentAnswer' },
  { prop: 'standardAnswer', label: '标准答案', minWidth: 110, showOverflowTooltip: true, slot: 'standardAnswer' },
  { prop: 'comment', label: 'AI 评语', minWidth: 130, showOverflowTooltip: true, slot: 'comment' },
  { prop: 'editComment', label: '老师评语', minWidth: 170, slot: 'editComment' },
  { prop: 'knowledgePoints', label: '知识点', minWidth: 130, slot: 'knowledgePoints' },
];

const kpDrawer = ref(false);
const kpKeyword = ref('');
const kpLoading = ref(false);
const kpDetail = ref<any[]>([]);

let objectUrl = '';
/** 卷面图请求序号：切任务/翻页后旧响应作废，避免把上一份卷子贴到新任务上 */
let imageSeq = 0;
/** 已加载成功的卷面图标识（taskId#page） */
let imageLoadedKey = '';
/** 正在加载的卷面图标识：同一张图不重复发请求 */
let imagePendingKey = '';

const pageCount = computed(() => Number(structure.value?.pageCount || 0));
const currentPage = computed(() => (structure.value?.pages || [])[page.value - 1] || { layout: [], blocks: [] });
const currentLayout = computed(() => currentPage.value.layout || []);
const currentAnchors = computed(() =>
  (structure.value?.questionAnchors || []).filter((a: any) => Number(a.page) === page.value),
);
const currentQuestions = computed(() => {
  const ids = new Set<string>();
  for (const a of currentAnchors.value) {
    const no = String(a.no ?? '').trim().replace(/[.、．]\s*$/, '');
    if (no) ids.add(no);
  }
  if (ids.size === 0) return [];
  const seen = new Set<number>();
  return questions.value.filter((q) => {
    const no = String(q.no ?? '').trim().replace(/[.、．]\s*$/, '');
    if (!no || !ids.has(no) || seen.has(Number(q.resultId))) return false;
    seen.add(Number(q.resultId));
    return true;
  });
});
const changePage = (delta: number) => {
  const next = Math.min(Math.max(page.value + delta, 1), pageCount.value);
  if (next !== page.value) page.value = next;
};

/**
 * 键盘导航：
 *  - ← / →  （无修饰键）直接切换上一页 / 下一页；
 *  - Alt+↑ / Alt+↓ 在当前页题目里上下移动选中行（数据已在后端按 account 作用域过滤，
 *    教师端只能在本人可见的任务题目内切换，不越权）。
 * 焦点在输入框/文本域/下拉等可编辑控件时不抢键盘（避免干扰老师分/评语录入）。
 */
const isEditableTarget = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

const onKeydown = (e: KeyboardEvent) => {
  if (isEditableTarget(e)) return;
  // Alt+方向键：上下切换题目行
  if (e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    const list = currentQuestions.value;
    if (!list.length) return;
    const idx = list.findIndex((q) => Number(q.resultId) === selectedId.value);
    const nextIdx = e.key === 'ArrowDown'
      ? (idx < 0 ? 0 : (idx + 1) % list.length)
      : (idx < 0 ? list.length - 1 : (idx - 1 + list.length) % list.length);
    selectRow(list[nextIdx]);
    return;
  }
  // 左右方向键：翻页
  if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
    if (e.key === 'ArrowLeft' && page.value > 1) {
      e.preventDefault();
      changePage(-1);
    } else if (e.key === 'ArrowRight' && page.value < pageCount.value) {
      e.preventDefault();
      changePage(1);
    }
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown, true));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown, true);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

const boundAnchors = computed(() =>
  currentAnchors.value.map((a: any) => {
    const same = currentAnchors.value
      .filter((x: any) => String(x.no) === String(a.no))
      .sort((p: any, q: any) => Number(p.y) - Number(q.y));
    const qs = questions.value.filter((q) => String(q.no) === String(a.no));
    const idx = same.indexOf(a);
    return { ...a, bound: idx >= 0 ? (qs[idx] ?? null) : null };
  }),
);
const selectedQuestion = computed(() =>
  selectedId.value == null ? null : questions.value.find((q) => Number(q.resultId) === selectedId.value) ?? null,
);

const isVirtual = (row: any) => row?.virtual === true;

/** 识别失败占位行：OCR 有题号锚点但无作答结果，后端补行待老师协助 */
const isUnrecognized = (row: any) => row?.unrecognized === true;

/** 卷型：自有卷 SELF（有题库可核对）vs 外来卷 ANY（无题库，靠人工判分） */
const markingMode = computed(() => String(structure.value?.mode || '').toUpperCase());

/**
 * 识别失败标记按卷型区分效果：
 * - SELF 自有卷：橙色「待协助」——题库有题，请核对题号
 * - ANY  外来卷：红色「人工判分」——无题库对照，请老师人工判分
 */
const isExternalPaper = computed(() => markingMode.value === 'ANY');
const unrecLabel = computed(() => (isExternalPaper.value ? '人工判分' : '待协助'));
const unrecTagType = computed(() => (isExternalPaper.value ? 'danger' : 'warning'));
const unrecTagTitle = computed(() =>
  isExternalPaper.value
    ? 'OCR 未识别出本题（外来卷无题库可核对），请老师按卷面人工判分'
    : 'OCR 未识别出本题，请对照题库核对题号后补录',
);

/** 题目/作答文本统一净化：去括号对、书名号、引号、下划线空位与全半角标点、空白，只留核心字 */
const normalizeCore = (s: string) =>
  String(s || '')
    .replace(/[（(][^（）()]*[）)]/g, '')
    .replace(/[《》「」『』“”‘’]/g, '')
    .replace(/[\s\u3000_＿，。、；：？！,.;:?!·-]/g, '')
    .trim();

/** 判断题作答是否含判定符号（对/错/√/×/T/F 等） */
const hasJudgeSymbol = (s: string) => /[对错√×✓✗TFtf]/.test(s);

/** 是否未作答：作答为空，或作答经净化后与题干（同样净化）重合 —— OCR 把题目行当成作答的兜底 */
const isBlankAnswer = (row: any) => {
  const ans = String(row?.studentAnswer ?? '').replace(/\s+/g, '').trim();
  if (!ans) return true;
  // 简短但明确的作答形态直接算「已作答」：选择题单字母、判断题判定符号等。
  // 不能套用下面的「题干覆盖」启发式——选择题的正确字母必然出现在题干选项里、
  // 判断题干常含「对/错」字样，套用会把真实作答误标成「未作答」。
  if (/^[A-DＡ-Ｄ]$/.test(ans)) return false;
  if (/^(对|错|√|×|✓|✗|T|F|正确|错误)$/i.test(ans)) return false;
  const stem = String(row?.stem ?? '').replace(/\s+/g, '').trim();
  if (!stem) return false;
  const a = normalizeCore(ans);
  if (!a) return true;
  const s = normalizeCore(stem);
  if (!s) return false;
  // 判断题：作答净化为整行题干（无判定符号）→ 未作答
  if (/判断|正误/.test(s) && !hasJudgeSymbol(a)) {
    return true;
  }
  // 题干（去空位/出处后）覆盖作答：
  //  - 与题干几乎等长（|差|≤2）→ 整行题干被 OCR 当成作答，判未作答；
  //  - 作答是题干子串但「明显短于题干」→ 只对 ≥4 字的片段生效（如 OCR 抄了"下列词语中"）。
  //    1~3 字的短作答是真实答案（填空"黄山"、选答字母等），不在此列。
  if (!s.includes(a)) return false;
  if (Math.abs(a.length - s.length) <= 2) return true;
  if (a.length < 4) return false;
  return a.length <= s.length * 0.92;
};

/** 卷头栏位标签词（后端识别兜底后仍可能落库的服务端数据，前端同样不当作真实姓名） */
const HEADER_LABEL_WORDS = new Set(['姓名', '班级', '学号', '性别', '学校', '年级', '考试', '科目', '考场', '座位', '准考证']);

const recognizedStudent = computed(() => {
  const raw = (structure.value?.recognizedStudent ?? null) as { name?: string; no?: string } | null;
  if (!raw) return null;
  const name = String(raw.name || '').trim();
  const no = String(raw.no || '').trim();
  if (HEADER_LABEL_WORDS.has(name) || !name) {
    // 姓名栏空白/识别到栏位名：视为未识别，学号仍可展示
    return { name: '', no: no || (raw.no as any) };
  }
  return raw;
});

const boxStyle = (b: any) => ({
  left: `${(Number(b.x) || 0) * 100}%`,
  top: `${(Number(b.y) || 0) * 100}%`,
  width: `${(Number(b.width) || 0) * 100}%`,
  height: `${(Number(b.height) || 0) * 100}%`,
});

const scoreClass = (row: any) => {
  const s = Number(row.editScore ?? 0);
  const m = Number(row.maxScore ?? 0);
  if (m > 0 && s >= m) return 'ss-score-correct';
  if (s <= 0) return 'ss-score-wrong';
  return 'ss-score-partial';
};
const anchorClass = (a: any) => {
  const q = a.bound;
  if (isUnrecognized(q)) return 'ss-anchor-unrec';
  if (!q) return 'ss-anchor-unknown';
  return scoreClass(q).replace('ss-score-', 'ss-anchor-');
};
const anchorText = (a: any) => {
  const q = a.bound;
  const answer = String(a.answer ?? '').trim().replace(/\s+/g, ' ');
  const brief = answer.length > 8 ? `${answer.slice(0, 8)}…` : answer;
  if (isUnrecognized(q)) return `${unrecLabel.value}${q.editScore ? '·' + q.editScore : ''}`;
  return q ? `${q.editScore}·${brief || '—'}` : '?';
};
const isAnchorSelected = (a: any) =>
  a.bound != null && selectedId.value != null && Number(a.bound.resultId) === selectedId.value;

const kpList = (row: any): Array<{ id: any; name: string; description?: string }> => {
  const list = row?.knowledgePoints;
  if (Array.isArray(list) && list.length) return list;
  const raw = row?.knowledgePointIds;
  if (raw === null || raw === undefined || raw === '') return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,，\s]+/);
  return arr.filter(Boolean).map((x) => ({ id: x, name: String(x) }));
};

const selectRow = (row: any) => {
  if (!row) return;
  selectedId.value = Number(row.resultId) || null;
  void scrollToRow(selectedId.value);
};

const selectAnchor = (a: any) => {
  const q = a.bound ?? questions.value.find((x) => String(x.no) === String(a.no));
  if (!q) return;
  selectedId.value = Number(q.resultId) || null;
  void scrollToRow(selectedId.value);
};

const scrollToRow = async (id: number | null) => {
  if (id == null) return;
  await nextTick();
  const index = questions.value.findIndex((q) => Number(q.resultId) === id);
  if (index < 0) return;
  const root = (questionTable.value as any)?.$el as HTMLElement | undefined;
  const rows = root?.querySelectorAll('.el-table__body tbody tr');
  rows?.[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

const onScoreChange = (row: any) => {
  row.dirty = Number(row.editScore ?? 0) !== Number(row.origScore ?? 0)
    || String(row.editComment ?? '').trim() !== String(row.origComment ?? '').trim();
  dirty.value = questions.value.some((q) => q.dirty);
};

const onCommentChange = (row: any) => {
  row.dirty = Number(row.editScore ?? 0) !== Number(row.origScore ?? 0)
    || String(row.editComment ?? '').trim() !== String(row.origComment ?? '').trim();
  dirty.value = questions.value.some((q) => q.dirty);
};

/** 一键采用 AI 判分：把 AI 分与 AI 评语落到老师分与老师评语，待保存 */
const applyAi = (row: any) => {
  if (isVirtual(row)) {
    message.warning('历史聚合题不能一键采用 AI 判分');
    return;
  }
  row.editScore = Number(row.score ?? 0);
  row.editComment = String(row.comment ?? '');
  row.dirty = true;
  dirty.value = questions.value.some((q) => q.dirty);
  message.success(`已采用 AI 判分：第 ${row.no || '?'} 题`);
};

/** 是否有可批量采用的 AI 判分（非历史聚合、且 AI 分或评语不为空） */
const applyAllDisabled = computed(() =>
  !questions.value.some((q) => !isVirtual(q) && (Number(q.score ?? 0) > 0 || String(q.comment ?? '').trim() !== '')),
);

/** 全部采用 AI 判分：把当前试卷所有可用 AI 分/评语一次性落到老师分/评语 */
const applyAllAi = () => {
  const targets = questions.value.filter(
    (q) => !isVirtual(q) && (Number(q.score ?? 0) > 0 || String(q.comment ?? '').trim() !== ''),
  );
  if (targets.length === 0) {
    message.info('当前没有可采用的 AI 判分');
    return;
  }
  for (const row of targets) {
    row.editScore = Number(row.score ?? 0);
    row.editComment = String(row.comment ?? '');
    row.dirty = true;
  }
  dirty.value = true;
  message.success(`已为 ${targets.length} 道题采用 AI 判分`);
};

const commentEditor = ref<{ visible: boolean; row: any; draft: string }>({ visible: false, row: null, draft: '' });
const commentInputRef = ref();
const commentEditorTitle = computed(() => {
  const no = String(commentEditor.value.row?.no ?? '').replace(/[.、．]\s*$/, '').trim();
  return no ? `老师评语 · 第 ${no} 题` : '老师评语';
});

const openCommentEditor = async (row: any) => {
  if (isVirtual(row)) {
    message.warning('历史聚合题已按版面拆分展示，暂不能单独写评语');
    return;
  }
  commentEditor.value = { visible: true, row, draft: String(row.editComment ?? '') };
  await nextTick();
  (commentInputRef.value?.$el as HTMLElement | undefined)?.querySelector('textarea')?.focus();
};

const confirmCommentEditor = () => {
  const { row, draft } = commentEditor.value;
  if (row) {
    row.editComment = draft;
    onCommentChange(row);
  }
  commentEditor.value.visible = false;
};

const openKp = (kp: any) => {
  kpKeyword.value = kp?.name || '';
  kpDetail.value = kp ? [kp] : [];
  kpDrawer.value = true;
  kpLoading.value = false;
};

const bankDialog = ref({
  visible: false,
  saving: false,
  rows: [] as any[],
  form: {
    questionSubject: '',
    questionGradeLevel: '初中',
    questionGrade: '',
    questionDifficulty: 3,
    questionScore: 0,
  } as Record<string, any>,
  /** resultId → 老师补写的标准答案 */
  answers: {} as Record<number, string>,
});

/** 题号展示：去掉 OCR 带出的结尾「.」「、」等分隔符（`1.` → `1`） */
const displayNo = (no: unknown): string =>
  String(no ?? '')
    .trim()
    .replace(/[.、．:：]+$/, '')
    .trim() || '?';

/** 题型中文名（表单里给老师看，题库落库题型由服务端按题干特征推断） */
const typeLabel = (type: string): string => {
  const map: Record<string, string> = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    JUDGE: '判断题',
    FILL: '填空题',
    SHORT_ANSWER: '简答题',
    SUBJECTIVE: '主观题',
    ESSAY: '作文',
  };
  return map[type] ?? type;
};

const guessType = (stem: string): string => {
  if (/[A-DＡ-Ｄ][.、．]/.test(stem) && /[BＢ][.、．]/.test(stem)) return 'SINGLE_CHOICE';
  if (/[√✓×✗]/.test(stem) || /判断/.test(stem)) return 'JUDGE';
  if (/_|＿|（\s*）|\(\s*\)/.test(stem)) return 'FILL';
  return 'SHORT_ANSWER';
};

/**
 * 勾选变化计数：ReTable 按 rowKey 跨页记住勾选，勾选状态本身由表格持有，
 * 这里只需要一个 tick 触发 computed 重算。
 */
const selectionTick = ref(0);

/** 当前勾选的题目（跨页合并；表格的 getSelectedRows 已按 resultId 去重） */
const bankSelection = computed<any[]>(() => {
  void selectionTick.value;
  const rows = ((questionTable.value as any)?.getSelectedRows?.() ?? []) as any[];
  // 只保留「非识别失败且有题干」的行：识别失败的题没有题干，入库只会造脏数据
  return rows.filter((r) => !isUnrecognized(r) && String(r?.stem ?? '').trim());
});

/**
 * 表格勾选变化：只推进 tick，勾选集合以表格为准（含翻页前已勾的行）。
 */
const onQuestionSelectionChange = () => {
  selectionTick.value += 1;
};

/** 本次是否判满分（未补写答案时，只有判满分的题才敢用学生作答当标准答案） */
const isFullScore = (row: any) => {
  const max = Number(row?.maxScore ?? 0);
  const score = Number(row?.editScore ?? row?.score ?? 0);
  return max > 0 && score >= max;
};

const openBankDialog = () => {
  if (!bankSelection.value.length) {
    message.warning('请先在题目列表左侧勾选要加入题库的题目');
    return;
  }
  bankDialog.value.rows = bankSelection.value.map((row) => ({ ...row, fullScore: isFullScore(row) }));
  bankDialog.value.answers = {};
  bankDialog.value.form = {
    questionSubject: '',
    questionGradeLevel: '初中',
    questionGrade: '',
    questionDifficulty: 3,
    questionScore: 0,
  };
  bankDialog.value.visible = true;
};

/** 用该题本次的学生作答填成标准答案（仅判满分的题建议这样做） */
const fillStudentAnswer = (index: number) => {
  const row = bankDialog.value.rows[index];
  if (!row) return;
  bankDialog.value.answers[row.resultId] = String(row.studentAnswer ?? '').trim();
};

const saveToBank = async () => {
  const f = bankDialog.value.form;
  const rows = bankDialog.value.rows;
  if (!rows.length) {
    message.warning('没有要入库的题目');
    return;
  }
  if (!String(f.questionSubject ?? '').trim()) {
    message.warning('请填写学科');
    return;
  }
  if (!String(f.questionGrade ?? '').trim()) {
    message.warning('请填写年级');
    return;
  }
  bankDialog.value.saving = true;
  try {
    const answers: Record<number, string> = {};
    for (const row of rows) {
      const text = String(bankDialog.value.answers[row.resultId] ?? '').trim();
      if (text) answers[row.resultId] = text;
    }
    const res = await eduaiApi.addMarkingToBank(props.taskId, {
      resultIds: rows.map((r) => Number(r.resultId)),
      questionSubject: String(f.questionSubject).trim(),
      questionGradeLevel: String(f.questionGradeLevel || '初中'),
      questionGrade: String(f.questionGrade).trim(),
      questionDifficulty: Number(f.questionDifficulty) || 3,
      questionScore: Number(f.questionScore) > 0 ? Number(f.questionScore) : undefined,
      answers,
    });
    const parts = [`成功 ${res?.successCount ?? 0} 题`];
    if (res?.duplicateCount) parts.push(`题库已有 ${res.duplicateCount} 题`);
    if (res?.failedCount) parts.push(`失败 ${res.failedCount} 题`);
    const needAnswer = res?.needAnswerNos ?? [];
    const errors = res?.errors ?? [];
    if ((res?.successCount ?? 0) > 0) {
      message.success(`已加入题库：${parts.join('，')}`);
    } else if (res?.duplicateCount) {
      message.info(`这 ${res.duplicateCount} 题题库里已经有了，没有新增`);
    }
    if (needAnswer.length) {
      message.warning(`第 ${needAnswer.join('、')} 题本次判错且未补答案，需补写标准答案后再提交`);
    }
    if (errors.length) {
      message.warning(`部分题目未入库：${errors.slice(0, 3).join('；')}${errors.length > 3 ? ' …' : ''}`);
    }
    // 还缺答案或有失败时保持弹窗打开：老师刚补写的内容不能丢，补完直接再点一次保存，
    // 已入库的题会被「题库已有」跳过，不会重复。
    if (needAnswer.length || errors.length) {
      return;
    }
    bankDialog.value.visible = false;
    // 入库完成后清空勾选：避免老师下次打开弹窗时又提交一遍已入库的题
    (questionTable.value as any)?.clearAllSelection?.();
    selectionTick.value += 1;
  } catch (e) {
    failToast('入题库失败', e);
  } finally {
    bankDialog.value.saving = false;
  }
};

const loadImage = async (taskId: string, p: number) => {
  const key = `${taskId}#${p}`;
  if (!taskId || key === imageLoadedKey || key === imagePendingKey) {
    return;
  }
  const seq = ++imageSeq;
  imagePendingKey = key;
  imageLoading.value = true;
  try {
    // 缩略图变体：后端按最长边缩到 ~900px 的灰度 PNG。
    // 左边栏实际显示宽度只有 600~700px，用原图等于多传一倍字节
    // （实测 73KB → 约 30KB，经网关省 1s 以上），版面框是归一化坐标，缩放不影响叠加。
    const blob = await eduaiApi.getSheetImageBlob(taskId, p, 'thumb');
    // 期间切了任务或翻页：这次结果已经过期，直接丢掉
    if (seq !== imageSeq) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    imageUrl.value = objectUrl;
    imageLoadedKey = key;
  } catch {
    if (seq !== imageSeq) return;
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }
    imageUrl.value = '';
    imageLoadedKey = '';
  } finally {
    if (imagePendingKey === key) {
      imagePendingKey = '';
    }
    // 只有「当前这次」请求能关掉占位：切任务后旧请求的 finally 不能把新任务的加载态抹掉
    if (seq === imageSeq) {
      imageLoading.value = false;
    }
  }
};

const load = async (taskId: string, external: Promise<Record<string, any>> | null = null) => {
  structure.value = null;
  questions.value = [];
  selectedId.value = null;
  dirty.value = false;
  activeLayout.value = -1;
  page.value = 1;
  selectionTick.value = 0;
  if (!taskId) return;
  structureLoading.value = true;
  // 卷面图是本页最慢的一步（实测经网关 5 秒以上，结构化数据只要 1~2 秒）。
  // 两件事并发发出去，总耗时取较慢的那个，而不是相加；旧任务的在途图片请求
  // 由 imageSeq 作废，不会把上一份卷子贴到新任务上。
  void loadImage(taskId, 1);
  try {
    // 父级已经在飞的请求直接接上（结构 2~3s 才回来，等父级把数据拿全再传就白等一轮）；
    // 没有父级请求时（工作台内嵌）自己拉。
    const data = external
      ? await external.catch(() => null)
      : await eduaiApi.getMarkingStructure(taskId);
    if (!data) {
      throw new Error('结构数据为空');
    }
    structure.value = data;
    questions.value = (data?.questions || []).map((q: any) => {
      const initial = Number(q.teacherScore ?? q.score ?? 0);
      // 老师评语只取真实老师已填写的值；AI 评语留在「AI 评语」列，不回落成老师评语。
      // 老师未填写时保持空白（表格显示 —），由真实老师来填。
      const initialComment = String(q.teacherComment ?? '');
      return {
        ...q,
        editScore: initial,
        origScore: initial,
        editComment: initialComment,
        origComment: initialComment,
        dirty: false,
      };
    });
    // 勾选按 tableId 存在 sessionStorage：换任务/刷新后重进本页会带着上次的勾选，
    // 让「加入题库（N）」显示老师看不见的旧选择。清空必须在表格吃进新数据之前做，
    // 否则表格会先从存档里恢复勾选。
    (questionTable.value as any)?.clearAllSelection?.();
    selectionTick.value += 1;
  } catch (e) {
    failToast('获取结构化解析失败', e);
  } finally {
    structureLoading.value = false;
  }
};

watch(
  () => [props.taskId, props.structurePromise] as const,
  ([v, sp]) => {
    // 结构请求随任务号一起换：父级给了就直接接上它，省掉一次网关往返
    void load(String(v || ''), (sp as Promise<Record<string, any>> | null) ?? null);
  },
  { immediate: true },
);

watch(page, async (p) => {
  activeLayout.value = -1;
  if (props.taskId) await loadImage(props.taskId, p);
});

/**
 * 保存老师分。
 *
 * @param silent 静默模式：没有改动时不提示（供「完成」前自动保存调用）
 * @returns 是否已确保老师分落库（true=已保存或本来就没有改动）
 */
const save = async (silent = false): Promise<boolean> => {
  if (!props.taskId) return false;
  const adjustments = questions.value
    .filter((q) => {
      if (!q.dirty) return false;
      // 常规行：已有结果行才有保存意义；识别失败占位行 resultId<=0 也要补录
      if (isUnrecognized(q)) return true;
      return Number(q.resultId) > 0;
    })
    .map((q) => {
      const item: { resultId: number; score: number; comment?: string; no?: string } = {
        resultId: isUnrecognized(q) ? -1 : Number(q.resultId),
        score: Number(q.editScore ?? 0),
      };
      // 识别失败补录：带上题号，后端据此新建结果行
      if (isUnrecognized(q)) {
        item.no = String(q.no ?? '').replace(/\s+$/g, '');
      }
      const comment = String(q.editComment ?? '').trim();
      if (comment !== String(q.origComment ?? '').trim()) {
        item.comment = comment;
      }
      return item;
    });
  if (!adjustments.length) {
    if (!silent) {
      message.warning('没有需要保存的老师分改动');
    }
    return true;
  }
  saving.value = true;
  try {
    await eduaiApi.confirmMarking({ taskId: props.taskId, adjustments });
    message.success('老师批改已保存（AI 分保留）');
    dirty.value = false;
    // 保存后不再带外部结构：父级那份是保存前的快照，必须拉一次新的
    await load(props.taskId);
    emit('saved');
    return true;
  } catch (e) {
    failToast('保存失败', e);
    return false;
  } finally {
    saving.value = false;
  }
};

/**
 * 「完成阅卷」前确保老师分已落库。
 *
 * <p>此前「完成」只调 finishMarking，老师改的分从未提交，
 * 重开页面自然回到 AI 分——这是「改完又还原」的根因之一。</p>
 */
const saveIfDirty = async (): Promise<boolean> => {
  if (!dirty.value) return true;
  return save(true);
};

defineExpose({ save, saveIfDirty, hasDirty: () => dirty.value });

</script>

<style scoped>
.sheet-structure {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 460px;
  gap: 10px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}
.ss-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.ss-toolbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}
.ss-eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.08em;
}
.ss-mode .el-radio-button__inner {
  font-size: 12px;
}
.ss-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
}
.ss-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.ss-correct { background: var(--el-color-success); }
.ss-partial { background: var(--el-color-warning); }
.ss-wrong { background: var(--el-color-danger); }
.ss-tip { margin-left: 8px; }
.ss-student {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.ss-student b { color: var(--el-color-primary); }
.ss-pager {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ss-pager__text {
  min-width: 76px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.ss-body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(360px, 44%) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
}
.ss-body--original {
  grid-template-columns: 1fr;
}
.ss-stage-card,
.ss-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}
.ss-stage-head,
.ss-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ss-stage-head strong,
.ss-panel-head strong {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.ss-stage-head > div,
.ss-panel-head > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.ss-stage-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ss-stage-actions .el-switch {
  --el-switch-on-color: var(--el-color-primary);
}
.ss-stage-page {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.ss-stage-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12px;
  background:
    linear-gradient(45deg, var(--el-fill-color-lighter) 25%, transparent 25%),
    linear-gradient(-45deg, var(--el-fill-color-lighter) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--el-fill-color-lighter) 75%),
    linear-gradient(-45deg, transparent 75%, var(--el-fill-color-lighter) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-color: var(--el-fill-color-blank);
}
.ss-stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
  align-self: flex-start;
  box-shadow: 0 8px 24px -15px rgba(0, 0, 0, 0.35);
}
.ss-image {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}
/* 卷面图占位：与图片同区，给出与真实图片接近的宽高，避免加载完成时页面跳动 */
.ss-image-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 520px;
  max-width: 100%;
  height: 340px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
}
.ss-overlay {
  position: absolute;
  inset: 0;
}
.ss-layout {
  position: absolute;
  border: 1px solid var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  opacity: 0.35;
  cursor: pointer;
  transition: opacity 0.15s;
}
.ss-layout-active {
  opacity: 0.75;
  border-color: var(--el-color-primary);
}
.ss-layout-label {
  position: absolute;
  top: -2px;
  left: 0;
  font-size: 10px;
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  padding: 0 2px;
}
.ss-anchor {
  position: absolute;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  min-height: 14px;
}
.ss-anchor .ss-badge {
  font-size: 11px;
  line-height: 1;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  white-space: nowrap;
}
.ss-anchor-correct { background: color-mix(in srgb, var(--el-color-success) 22%, transparent); border: 1px solid var(--el-color-success); }
.ss-anchor-partial { background: color-mix(in srgb, var(--el-color-warning) 22%, transparent); border: 1px solid var(--el-color-warning); }
.ss-anchor-wrong { background: color-mix(in srgb, var(--el-color-danger) 22%, transparent); border: 1px solid var(--el-color-danger); }
.ss-anchor-unknown { background: color-mix(in srgb, var(--el-text-color-secondary) 18%, transparent); border: 1px dashed var(--el-text-color-secondary); }
.ss-anchor-unrec { background: color-mix(in srgb, var(--el-color-warning) 30%, transparent); border: 1px solid var(--el-color-warning); box-shadow: inset 0 0 0 1px color-mix(in srgb, #fff 55%, transparent); }
.ss-anchor-selected {
  z-index: 2;
  transform: scale(1.25);
  box-shadow: 0 0 0 2px var(--el-bg-color), 0 0 10px var(--el-color-primary);
  opacity: 1 !important;
  border-style: solid;
}
.ss-anchor-correct .ss-badge { background: var(--el-color-success); }
.ss-anchor-partial .ss-badge { background: var(--el-color-warning); }
.ss-anchor-wrong .ss-badge { background: var(--el-color-danger); }
.ss-anchor-unknown .ss-badge { background: var(--el-text-color-secondary); }
.ss-anchor-unrec .ss-badge { background: var(--el-color-warning); animation: ss-unrec-pulse 1.6s ease-in-out infinite; }
@keyframes ss-unrec-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
.ss-nav {
  position: absolute;
  z-index: 3;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  box-shadow: 0 4px 14px -8px rgba(0, 0, 0, 0.28);
}
.ss-nav:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.ss-nav--prev { left: 10px; }
.ss-nav--next { right: 10px; }

.ss-panel-head {
  flex: none;
}
.ss-panel-table {
  flex: 1;
  min-height: 0;
}
.ss-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}
.ss-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-sel { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-ai-score { color: var(--el-text-color-secondary); font-weight: 600; }
.ss-standard-answer { color: var(--el-color-success); font-weight: 500; }
.ss-unrec-tag { margin-left: 6px; vertical-align: 1px; }
.ss-unrec-answer { color: var(--el-color-warning); font-weight: 600; }
.ss-no-answer { color: var(--el-text-color-placeholder); font-style: italic; font-size: 12px; }
.ss-score-correct { color: var(--el-color-success); font-weight: 600; }
.ss-score-partial { color: var(--el-color-warning); font-weight: 600; }
.ss-score-wrong { color: var(--el-color-danger); font-weight: 600; }
.ss-row-active { color: var(--el-color-primary); font-weight: 600; }
.ss-kp { margin-right: 4px; cursor: pointer; }
.ss-muted { color: var(--el-text-color-placeholder); font-size: 12px; }

.ss-comment-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ss-comment-text {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.ss-comment-edit {
  flex: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  border-radius: 4px;
  color: var(--el-text-color-placeholder);
  transition: color 0.15s, background-color 0.15s;
}
.ss-comment-edit:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.ss-comment-edit--filled {
  color: var(--el-color-primary);
}
.ss-comment-dialog-tip {
  margin-top: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  word-break: break-word;
}
.ss-kp-key { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.ss-kp-list { list-style: none; padding: 0; margin: 0; }
.ss-kp-list li { padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.ss-kp-name { font-weight: 600; }
.ss-kp-desc { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-bank-row { display: flex; gap: 12px; }
.ss-bank-row .el-form-item { flex: 1; }
.ss-bank-grade { display: flex; gap: 8px; width: 100%; }
.ss-bank-scope {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 12px;
  line-height: 1.6;
}
.ss-bank-list {
  max-height: 52vh;
  overflow-y: auto;
  padding-right: 4px;
}
.ss-bank-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.ss-bank-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.ss-bank-item__no { font-weight: 600; }
.ss-bank-item__type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 3px;
  padding: 0 5px;
}
.ss-bank-item__stem {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 8px;
}
.ss-bank-item__answer-row { margin-bottom: 4px; }
.ss-bank-item__tip { font-size: 12px; color: var(--el-color-warning); }
.ss-bank-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 6px 10px;
  margin: 4px 0;
}

@media (max-width: 1100px) {
  .ss-body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(420px, 58%) minmax(320px, 42%);
  }
  .ss-stage-viewport {
    align-items: center;
  }
  .ss-stage {
    max-height: 100%;
  }
}
</style>