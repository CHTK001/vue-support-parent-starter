<template>
  <div class="sheet-structure">
    <div class="ss-toolbar">
      <el-radio-group v-if="pageCount > 1" v-model="page" size="small">
        <el-radio-button v-for="p in pageCount" :key="p" :value="p">第 {{ p }} 页</el-radio-button>
      </el-radio-group>
      <!-- 原始试卷 / 版面解析：原卷纯看，版面解析做分数复核（老师分为最终成绩） -->
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="layout">版面解析</el-radio-button>
        <el-radio-button value="original">原始试卷</el-radio-button>
      </el-radio-group>
      <div v-if="mode === 'layout'" class="ss-legend">
        <span class="ss-dot ss-correct"></span>正确
        <span class="ss-dot ss-partial"></span>部分分
        <span class="ss-dot ss-wrong"></span>错误
        <span class="ss-tip">点击题号标记可定位到右侧题目</span>
      </div>
      <!-- 卷面识别到的学生（ANY 链路扫描时从卷头「姓名/学号」栏抽取）：与任务学生标识互补 -->
      <div v-if="recognizedStudent" class="ss-student">
        卷面识别：<b>{{ recognizedStudent.name || '（姓名未识别）' }}</b>
        <span v-if="recognizedStudent.no">· 学号 {{ recognizedStudent.no }}</span>
      </div>
    </div>

    <div class="ss-body" :class="{ 'ss-body--original': mode === 'original' }">
      <div class="ss-stage-wrap" ref="stageWrapRef">
        <button
          v-if="pageCount > 1 && page > 1"
          class="ss-nav ss-nav--stage ss-nav--prev"
          title="上一页"
          @click="changePage(page - 1)"
        >
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <button
          v-if="pageCount > 1 && page < pageCount"
          class="ss-nav ss-nav--stage ss-nav--next"
          title="下一页"
          @click="changePage(page + 1)"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>
        <div class="ss-stage">
          <img v-if="imageUrl" ref="imageRef" :src="imageUrl" class="ss-image" alt="答卷" />
          <div v-if="imageUrl && mode === 'layout'" class="ss-overlay">
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

      <div v-if="mode === 'layout'" class="ss-panel">
        <button
          v-if="pageCount > 1 && page > 1"
          class="ss-nav ss-nav--panel ss-nav--prev"
          title="上一页"
          @click="changePage(page - 1)"
        >
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <button
          v-if="pageCount > 1 && page < pageCount"
          class="ss-nav ss-nav--panel ss-nav--next"
          title="下一页"
          @click="changePage(page + 1)"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>
        <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
             原表 height="100%" → :layout-table="{ height: '100%' }"（带 height 即走固定高度分支，
             按规格无需再补 minHeight）；原表没有 border → :settings="{ border: false }"；
             分页/工具栏关闭（原表没有）。 -->
        <ReTable
          ref="questionTable"
          :data="currentQuestions"
          :columns="questionColumns"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :layout-table="{ height: '100%' }"
          :settings="{ border: false }"
          @row-click="(row: any) => selectRow(row)"
        >
          <template #col-no="{ row }">
            <span :class="{ 'ss-row-active': Number(row.resultId) === selectedId }">{{ row.no || '-' }}</span>
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
          <template #col-studentAnswer="{ row }">{{ row.studentAnswer || '—' }}</template>
          <template #col-comment="{ row }">{{ row.comment || '—' }}</template>
          <!-- 老师评语：窄表格列里只放「文本 + 图标」，点图标开专注模式大框编辑，
               避免原来的内联多行 textarea 把每行撑高、挤占版面 -->
          <template #col-editComment="{ row }">
            <div class="ss-comment-cell">
              <span class="ss-comment-text" :title="row.editComment || ''">{{ row.editComment || '—' }}</span>
              <el-icon
                class="ss-comment-edit"
                :class="{ 'ss-comment-edit--filled': !!row.editComment }"
                :title="row.editComment ? '编辑老师评语' : '添加老师评语'"
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
            <el-button size="small" type="primary" link @click.stop="openToBank(row)">入题库</el-button>
          </template>
        </ReTable>
        <div class="ss-actions">
          <el-button type="primary" :disabled="!dirty" :loading="saving" @click="save">保存老师分</el-button>
          <span class="ss-hint">AI 分保留不动，老师分为最终成绩</span>
          <span v-if="selectedQuestion" class="ss-sel">已选中第 {{ selectedQuestion.no }} 题</span>
        </div>
      </div>
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

    <!-- 老师评语专注模式：点表格里的图标弹出独立大框编辑（可留空 = 清空）。
         弹框内只是草稿，点「确定」写回该行，仍随「保存老师分」一起提交，避免误触即时落库。 -->
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

    <!-- 入题库：把扫描解析出的题目预填进编辑框，老师修正后保存（题干/答案来自 OCR，务必核对） -->
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
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

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
/** 老师分保存成功后广播：父级（阅卷记录详情 / 教师端）据此刷新总分 */
const emit = defineEmits<{ (e: 'saved'): void }>();

const structure = ref<Record<string, any> | null>(null);
const page = ref(1);
/** layout=版面解析（图 + 版面框 + 题目面板），original=原始试卷（纯原图全宽） */
const mode = ref<'layout' | 'original'>('layout');
const imageUrl = ref('');
const activeLayout = ref(-1);
/**
 * 当前选中题（按 resultId 精确到单题，不用题号）：
 * 同一卷面里「填空 2 / 判断 2 / 选择 2」题号都会是「2.」，
 * 按题号选中会让同号锚点全部点亮、定位歧义，因此锚点与行都以 resultId 关联。
 */
const selectedId = ref<number | null>(null);
const dirty = ref(false);
const saving = ref(false);
const questions = ref<any[]>([]);
/** 题目表格实例：双向联动时用它拿 DOM 把选中行滚进可视区 */
const questionTable = ref();

/** 题目表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const questionColumns: ReTableColumn[] = [
  { prop: 'no', label: '题号', width: 56, slot: 'no' },
  { prop: 'score', label: 'AI 分', width: 64, slot: 'score' },
  { prop: 'editScore', label: '老师分', width: 120, slot: 'editScore' },
  { prop: 'studentAnswer', label: '作答', minWidth: 96, showOverflowTooltip: true, slot: 'studentAnswer' },
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

/** 逐页结构（pages 下标从 0 开始，页码从 1 开始） */
const pageCount = computed(() => Number(structure.value?.pageCount || 0));
const currentPage = computed(() => (structure.value?.pages || [])[page.value - 1] || { layout: [], blocks: [] });
const currentLayout = computed(() => currentPage.value.layout || []);
const currentAnchors = computed(() =>
  (structure.value?.questionAnchors || []).filter((a: any) => Number(a.page) === page.value),
);

/**
 * 锚点 ↔ 题目按下标绑定：同号题（「一、二、三」各节都会从 1. 重新编号）不能按题号找题，
 * 否则锚点颜色/徽章永远只反映第一个同号题。同号锚点组内按 y 坐标（卷面从上到下）排序后，
 * 与同号题目序列（判分结果顺序即卷面顺序）一一对应；锚点多于题数时多出的锚点不绑定。
 */
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

/** 历史聚合任务的只读拆分行：负数 resultId 不落库，仅用于展示逐题结构 */
const isVirtual = (row: any) => row?.virtual === true;

/** 卷面识别到的学生（ANY 链路：模型/正则从卷头「姓名/学号」栏抽取） */
const recognizedStudent = computed(() => (structure.value?.recognizedStudent ?? null) as { name?: string; no?: string } | null);

/** 归一化坐标 → 百分比定位；版面区域与题号锚点共用 */
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
/** 锚点外观跟随「绑定题」的得分状态，无绑定题才退回 unknown */
const anchorClass = (a: any) => {
  const q = a.bound;
  if (!q) return 'ss-anchor-unknown';
  return scoreClass(q).replace('ss-score-', 'ss-anchor-');
};
const anchorText = (a: any) => {
  const q = a.bound;
  return q ? `${q.editScore}` : '?';
};
const isAnchorSelected = (a: any) =>
  a.bound != null && selectedId.value != null && Number(a.bound.resultId) === selectedId.value;

const kpList = (row: any): Array<{ id: any; name: string; description?: string }> => {
  // 后端已把知识点 id 解析成 {id,name,description}，直接渲染名称、点开即出描述。
  const list = row?.knowledgePoints;
  if (Array.isArray(list) && list.length) return list;
  // 兼容仅返回 id 串的旧结构：退化成显示 id，仍可点击
  const raw = row?.knowledgePointIds;
  if (raw === null || raw === undefined || raw === '') return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,，\s]+/);
  return arr.filter(Boolean).map((x) => ({ id: x, name: String(x) }));
};

const selectRow = (row: any) => {
  if (!row) return;
  selectedId.value = Number(row.resultId) || null;
  // 双向联动：把对应表格行滚进可视区
  void scrollToRow(selectedId.value);
};

/** 锚点点击：优先选中绑定题；锚点没绑定到题（版面多识别）时退化选第一个同号题 */
const selectAnchor = (a: any) => {
  const q = a.bound ?? questions.value.find((x) => String(x.no) === String(a.no));
  if (!q) return;
  selectedId.value = Number(q.resultId) || null;
  void scrollToRow(selectedId.value);
};

/** 把选中题对应的表格行滚动到可视区（el-table 内部滚动容器） */
const scrollToRow = async (id: number | null) => {
  if (id == null) return;
  await nextTick();
  const index = questions.value.findIndex((q) => Number(q.resultId) === id);
  if (index < 0) return;
  const root = (questionTable.value as any)?.$el as HTMLElement | undefined;
  const rows = root?.querySelectorAll('.el-table__body tbody tr');
  rows?.[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
};

/** 老师分改动即标脏：只有动过的行才进保存载荷（AI 分永远不被覆盖） */
const onScoreChange = (row: any) => {
  row.dirty = Number(row.editScore ?? 0) !== Number(row.origScore ?? 0)
    || String(row.editComment ?? '').trim() !== String(row.origComment ?? '').trim();
  dirty.value = questions.value.some((q) => q.dirty);
};

/** 老师评语改动同样标脏：分数与评语任一变化都算该行有改动 */
const onCommentChange = (row: any) => {
  row.dirty = Number(row.editScore ?? 0) !== Number(row.origScore ?? 0)
    || String(row.editComment ?? '').trim() !== String(row.origComment ?? '').trim();
  dirty.value = questions.value.some((q) => q.dirty);
};

/**
 * 老师评语专注模式编辑：表格列只展示文本 + 图标，点图标弹出独立大框。
 * 弹框里是草稿（draft），点「确定」才写回该行；写回后只标脏、不落库，
 * 与老师分一起走「保存老师分」提交。
 */
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

/** 确定：草稿写回行 → 标脏；清空（空串）同样写回，保存时后端按「显式空串」清空评语 */
const confirmCommentEditor = () => {
  const { row, draft } = commentEditor.value;
  if (row) {
    row.editComment = draft;
    onCommentChange(row);
  }
  commentEditor.value.visible = false;
};

const openKp = (kp: any) => {
  // 名称与描述已随结构返回，无需再按 id 反查（按 id 搜关键字搜不到，点开会是空的）
  kpKeyword.value = kp?.name || '';
  kpDetail.value = kp ? [kp] : [];
  kpDrawer.value = true;
  kpLoading.value = false;
};

/* ==================== 解析题目入题库 ==================== */
const bankDialog = ref({
  visible: false,
  saving: false,
  /** 来源题的作答（只展示提醒核对，不入库——入库的是「标准答案」栏） */
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

/** 按解析出的题干粗猜题型：有 A./B. 选项→单选，√/× →判断，其余→填空 */
const guessType = (stem: string): string => {
  if (/[A-DＡ-Ｄ][.、．]/.test(stem) && /[BＢ][.、．]/.test(stem)) return 'SINGLE_CHOICE';
  if (/[√✓×✗]/.test(stem) || /判断/.test(stem)) return 'JUDGE';
  return 'FILL';
};

/** 从选项行拼 questionOptions（每行一个），题干里剥掉选项尾巴避免重复 */
const splitOptions = (stem: string): { stem: string; options: string } => {
  const lines = stem.split(/[\n；;]+/).map((s) => s.trim()).filter(Boolean);
  const optLines = lines.filter((s) => /^[A-DＡ-Ｄ][.、．]/.test(s));
  if (optLines.length < 2) return { stem, options: '' };
  const kept = lines.filter((s) => !/^[A-DＡ-Ｄ][.、．]/.test(s)).join('\n');
  return { stem: kept || stem, options: optLines.join('\n') };
};

/** 打开入题库弹框：预填解析结果，标准答案留空由老师补（学生作答不是标准答案） */
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

/** 保存入题库：走题库正常新增（questionSource 标记「扫描识别」便于溯源） */
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
    // 老师分初值 = 已有老师分，否则回落 AI 分；origScore 记初值做脏判断。
    // 老师评语初值 = 已有老师评语，否则回落 AI 评语（只做展示初值，保存时仍显式提交）。
    questions.value = (data?.questions || []).map((q: any) => {
      const initial = Number(q.teacherScore ?? q.score ?? 0);
      const initialComment = String(q.teacherComment ?? q.comment ?? '');
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
    .filter((q) => q.dirty && Number(q.resultId) > 0)
    .map((q) => {
      const item: { resultId: number; score: number; comment?: string } = {
        resultId: Number(q.resultId),
        // 只回传分数、不传评语：后端「不传评语 = 不改评语」，
        // 只有老师分（或评语）动过的行才进载荷，避免覆盖其他行
        score: Number(q.editScore ?? 0),
      };
      // 评语改动才带 comment（含「清空评语」——显式空串即清空，后端 != null 判定覆盖）
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

onUnmounted(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<style scoped>
.sheet-structure {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;
}
.ss-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ss-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
/* 卷面识别学生提示（工具栏右侧） */
.ss-student {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.ss-student b { color: var(--el-color-primary); }
/* 入题库弹框 */
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

.ss-body {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  padding-top: 12px;
}
/* 原始试卷模式：没有右侧题目面板，原图占满整行 */
.ss-body--original .ss-stage-wrap { flex: 1 1 auto; }
.ss-stage-wrap {
  flex: 0 0 46%;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base);
  background: var(--el-fill-color-blank);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 8px;
}
.ss-stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
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
/* 选中锚点：放大 + 高亮描边，与右侧题目表行联动 */
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

.ss-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ss-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}
.ss-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-sel { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-ai-score { color: var(--el-text-color-secondary); font-weight: 600; }
.ss-score-correct { color: var(--el-color-success); font-weight: 600; }
.ss-score-partial { color: var(--el-color-warning); font-weight: 600; }
.ss-score-wrong { color: var(--el-color-danger); font-weight: 600; }
.ss-row-active { color: var(--el-color-primary); font-weight: 600; }
.ss-kp { margin-right: 4px; cursor: pointer; }
.ss-muted { color: var(--el-text-color-placeholder); font-size: 12px; }
/* 老师评语列：文本 + 专注编辑图标（窄列不再放多行输入框，行高更稳） */
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
/* 专注编辑弹框里的 AI 评语参考 */
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
</style>
