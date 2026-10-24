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
        <div class="ss-panel-table">
          <ReTable
            ref="questionTable"
            :data="currentQuestions"
            :columns="questionColumns"
            engine="element"
            :layout-table="{ height: '100%' }"
            :settings="{ border: false }"
            @row-click="(row: any) => selectRow(row)"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-no="{ row }">
              <span :class="{ 'ss-row-active': Number(row.resultId) === selectedId }">
                {{ row.no || '-' }}
                <el-tag v-if="isUnrecognized(row)" size="small" type="danger" effect="dark"
                  class="ss-unrec-tag" title="OCR 未识别出本题作答，请老师对照卷面处理">待协助</el-tag>
              </span>
            </template>
            <template #col-stem="{ row }">
              <span class="ss-stem">{{ row.stem || '—' }}</span>
            </template>
            <template #col-score="{ row }">
              <span class="ss-ai-score">{{ row.score ?? '-' }}</span>
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
                待协助·请老师补录作答
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
            <template #col-toBank="{ row }">
              <el-button v-if="!isUnrecognized(row)" size="small" type="primary" link @click.stop="openToBank(row)">入题库</el-button>
              <span v-else class="ss-muted" title="未识别出题干，无法入题库">—</span>
            </template>
          </ReTable>
        </div>
        <footer class="ss-actions">
          <el-button type="primary" :disabled="!dirty" :loading="saving" @click="save">保存老师分</el-button>
          <el-button type="success" :disabled="applyAllDisabled" @click="applyAllAi">全部采用AI</el-button>
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

    <ReDialog v-model="bankDialog.visible" title="解析题目加入题库" width="640" top="6vh">
      <el-form label-width="72px" size="small" class="ss-bank-form">
        <div class="ss-bank-row">
          <el-form-item label="题型">
            <el-select v-model="bankDialog.form.questionType" style="width: 100%">
              <el-option label="单选题" value="SINGLE_CHOICE" />
              <el-option label="多选题" value="MULTIPLE_CHOICE" />
              <el-option label="判断题" value="JUDGE" />
              <el-option label="填空题" value="FILL" />
              <el-option label="简答题" value="SHORT_ANSWER" />
              <el-option label="主观题" value="SUBJECTIVE" />
              <el-option label="作文" value="ESSAY" />
            </el-select>
          </el-form-item>
          <el-form-item label="分值">
            <ReInputNumber v-model="bankDialog.form.questionScore" :min="1" :max="100" style="width: 100%" />
          </el-form-item>
        </div>
        <div class="ss-bank-row">
          <el-form-item label="学科">
            <ReInput v-model="bankDialog.form.questionSubject" placeholder="如：数学" />
          </el-form-item>
          <el-form-item label="学段/年级">
            <div class="ss-bank-grade">
              <el-select v-model="bankDialog.form.questionGradeLevel" style="width: 45%">
                <el-option label="小学" value="小学" />
                <el-option label="初中" value="初中" />
                <el-option label="高中" value="高中" />
              </el-select>
              <ReInput v-model="bankDialog.form.questionGrade" placeholder="年级" />
            </div>
          </el-form-item>
        </div>
        <el-form-item label="题干" required>
          <ReInput v-model="bankDialog.form.questionStem" type="textarea" :rows="4" placeholder="解析出的题干（OCR 识别，请核对错字）" />
        </el-form-item>
        <el-form-item label="选项" v-if="bankDialog.form.questionType === 'SINGLE_CHOICE' || bankDialog.form.questionType === 'MULTIPLE_CHOICE'">
          <ReInput v-model="bankDialog.form.questionOptions" type="textarea" :rows="3" placeholder="每行一个选项，如：A. -2" />
        </el-form-item>
        <el-form-item label="标准答案" required>
          <ReInput v-model="bankDialog.form.questionAnswer" type="textarea" :rows="2" placeholder="标准答案（扫描解析给的是「学生作答」，标准答案请老师补写）" />
        </el-form-item>
        <el-form-item label="解析">
          <ReInput v-model="bankDialog.form.questionAnalysis" type="textarea" :rows="2" placeholder="解题思路（可选）" />
        </el-form-item>
        <div v-if="bankDialog.studentAnswer" class="ss-bank-hint">
          学生作答（仅供参考，不入库）：{{ bankDialog.studentAnswer }}
        </div>
        <div class="ss-bank-hint">保存后进入题库（管理员可在题库管理中审核、完善）。</div>
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
import { EditPen } from '@element-plus/icons-vue';

const props = defineProps<{ taskId: string }>();
const emit = defineEmits<{ (e: 'saved'): void }>();

const structure = ref<Record<string, any> | null>(null);
const page = ref(1);
/** 左侧答卷扫描是否显示版面框/题号锚点（版面解析与原始试卷均可用） */
const showMarkers = ref(true);
const mode = ref<'layout' | 'original'>('layout');
const imageUrl = ref('');
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
  { prop: 'toBank', label: '操作', width: 84, slot: 'toBank' },
];

const kpDrawer = ref(false);
const kpKeyword = ref('');
const kpLoading = ref(false);
const kpDetail = ref<any[]>([]);

let objectUrl = '';

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
  // 作答是题干（去空位/出处后）的子串；「明显短于题干」或「与题干几乎等长」
  // （OCR 把整行题干当成作答，如判断题）都判未作答
  return s.includes(a) && (a.length <= s.length * 0.92 || Math.abs(a.length - s.length) <= 2);
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
  if (isUnrecognized(q)) return `待协助${q.editScore ? '·' + q.editScore : ''}`;
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
  studentAnswer: '',
  form: {
    questionType: 'FILL',
    questionSubject: '',
    questionGradeLevel: '初中',
    questionGrade: '',
    questionDifficulty: 3,
    questionScore: 5,
    questionStem: '',
    questionOptions: '',
    questionAnswer: '',
    questionAnalysis: '',
  } as Record<string, any>,
});

const guessType = (stem: string): string => {
  if (/[A-DＡ-Ｄ][.、．]/.test(stem) && /[BＢ][.、．]/.test(stem)) return 'SINGLE_CHOICE';
  if (/[√✓×✗]/.test(stem) || /判断/.test(stem)) return 'JUDGE';
  return 'FILL';
};

const splitOptions = (stem: string): { stem: string; options: string } => {
  const lines = stem.split(/[\n；;]+/).map((s) => s.trim()).filter(Boolean);
  const optLines = lines.filter((s) => /^[A-DＡ-Ｄ][.、．]/.test(s));
  if (optLines.length < 2) return { stem, options: '' };
  const kept = lines.filter((s) => !/^[A-DＡ-Ｄ][.、．]/.test(s)).join('\n');
  return { stem: kept || stem, options: optLines.join('\n') };
};

const openToBank = (row: any) => {
  if (isVirtual(row)) {
    message.warning('历史聚合题已按版面拆分展示，暂不能直接入库');
    return;
  }
  const stem = String(row.stem ?? '').trim();
  const split = guessType(stem) === 'SINGLE_CHOICE' ? splitOptions(stem) : { stem, options: '' };
  bankDialog.value.form = {
    questionType: guessType(stem),
    questionSubject: '',
    questionGradeLevel: '初中',
    questionGrade: '',
    questionDifficulty: 3,
    questionScore: Number(row.maxScore) > 0 ? Number(row.maxScore) : 5,
    questionStem: split.stem,
    questionOptions: split.options,
    questionAnswer: '',
    questionAnalysis: '',
  };
  bankDialog.value.studentAnswer = String(row.studentAnswer ?? '').trim();
  bankDialog.value.visible = true;
};

const saveToBank = async () => {
  const f = bankDialog.value.form;
  if (!String(f.questionStem ?? '').trim()) {
    message.warning('题干为空，无法入库');
    return;
  }
  if (!String(f.questionAnswer ?? '').trim()) {
    message.warning('请补写标准答案（学生作答不能当标准答案）');
    return;
  }
  bankDialog.value.saving = true;
  try {
    await eduaiApi.saveQuestion({
      questionType: f.questionType,
      questionSubject: String(f.questionSubject || '未分类'),
      questionGradeLevel: String(f.questionGradeLevel || '初中'),
      questionGrade: String(f.questionGrade || ''),
      questionDifficulty: Number(f.questionDifficulty) || 3,
      questionScore: Number(f.questionScore) || 5,
      questionStem: String(f.questionStem),
      questionOptions: String(f.questionOptions || ''),
      questionAnswer: String(f.questionAnswer),
      questionAnalysis: String(f.questionAnalysis || ''),
      questionSource: '扫描识别',
    } as any);
    message.success('已加入题库（可在题库管理中继续完善）');
    bankDialog.value.visible = false;
  } catch (e) {
    failToast('入题库失败', e);
  } finally {
    bankDialog.value.saving = false;
  }
};

const loadImage = async (taskId: string, p: number) => {
  try {
    const blob = await eduaiApi.getSheetImageBlob(taskId, p);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    imageUrl.value = objectUrl;
  } catch {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }
    imageUrl.value = '';
  }
};

const load = async (taskId: string) => {
  structure.value = null;
  questions.value = [];
  selectedId.value = null;
  dirty.value = false;
  activeLayout.value = -1;
  page.value = 1;
  if (!taskId) return;
  try {
    const data = await eduaiApi.getMarkingStructure(taskId);
    structure.value = data || null;
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
    await loadImage(taskId, 1);
  } catch (e) {
    failToast('获取结构化解析失败', e);
  }
};

watch(
  () => props.taskId,
  (v) => {
    void load(String(v || ''));
  },
  { immediate: true },
);

watch(page, async (p) => {
  activeLayout.value = -1;
  if (props.taskId) await loadImage(props.taskId, p);
});

const save = async () => {
  if (!props.taskId) return;
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
    message.warning('没有需要保存的老师分改动');
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.confirmMarking({ taskId: props.taskId, adjustments });
    message.success('老师批改已保存（AI 分保留）');
    dirty.value = false;
    await load(props.taskId);
    emit('saved');
  } catch (e) {
    failToast('保存失败', e);
  } finally {
    saving.value = false;
  }
};

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
.ss-no-answer { color: var(--el-text-color-placeholder); font-style: italic; }
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