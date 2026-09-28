<template>
  <div class="page-container">
      <ReTable
        ref="tableRef"
        :loader="loadPapers"
        :params="queryParams"
        :search="searchConfig"
        v-model:search-model="searchModel"
        row-key="paperId"
        v-model:page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        border
        stripe
        @search="commitSearch"
        @search-reset="resetSearch"
        @load-error="pageLoadError"
      >
        <template #toolbar>
          <!-- 组卷只有一个入口：AI 组卷是它的功能之一（弹框内切换组卷方式） -->
          <ReButton type="primary" icon="MagicStick" @click="openCompose">组卷</ReButton>
        </template>
        <ReTableColumn prop="paperId" label="ID" width="80" />
        <ReTableColumn prop="paperName" label="试卷名" min-width="200" />
        <ReTableColumn prop="paperSubject" label="学科" width="100" />
        <ReTableColumn prop="paperGradeLevel" label="学段" width="100" />
        <ReTableColumn prop="paperGrade" label="年级" width="100" />
        <ReTableColumn prop="paperTotalScore" label="总分" width="80" />
        <ReTableColumn prop="paperQuestionCount" label="题数" width="80" />
        <ReTableColumn prop="paperDuration" label="时长(分)" width="100" />
        <ReTableColumn label="来源" width="80">
          <template #default="{ row }">
            <el-tag  :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="状态" width="100">
          <template #default="{ row }">
            <el-tag  :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <ReButton icon="View" :show-text="false" type="primary" @click="openDetail(row)">详情</ReButton>
            <ReButton icon="Edit" :show-text="false" type="warning" @click="openEdit(row)">编辑</ReButton>
            <ReButton icon="EditPen" :show-text="false" type="info" @click="goCompose(row)">组卷</ReButton>
            <ReButton icon="Collection" :show-text="false" type="success" @click="openMarket(row)">题库</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>

    <!-- 组卷对话框：手动 / AI 共用一套卷头配置，AI 方式多出题量与分值 -->
    <el-dialog v-model="createDialogVisible" title="组卷" width="560">
      <el-form :model="createForm" label-width="100">
        <el-form-item label="组卷方式">
          <el-radio-group v-model="composeMode">
            <el-radio value="MANUAL">手动组卷</el-radio>
            <el-radio value="AI">AI 组卷</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="试卷名称" required>
          <el-input v-model="createForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="createForm.subject" placeholder="请输入学科，如 数学" />
        </el-form-item>
        <!--
          学段/年级在 edu_paper 上是 NOT NULL 且无默认值，后端会前置校验。
          这里同步标 required，避免用户以为可留空却拿到建卷失败。
        -->
        <el-form-item label="学段" required>
          <el-select
            v-model="createForm.gradeLevel"
            placeholder="请选择学段"
            style="width: 100%"
            @change="onCreateGradeLevelChange"
          >
            <el-option v-for="opt in GRADE_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-select
            v-model="createForm.grade"
            placeholder="请先选择学段"
            :disabled="!createForm.gradeLevel"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in createGradeOptions" :key="g.gradeId" :label="g.gradeName" :value="g.gradeName" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分">
          <el-input-number v-model="createForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="createForm.difficulty" :max="5" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="createForm.duration" :min="1" :max="600" /> 分钟
        </el-form-item>
        <el-form-item label="组卷模板">
          <el-select v-model="createForm.templateId" placeholder="不使用模板" clearable style="width: 100%">
            <el-option v-for="t in templateOptions" :key="t.templateId" :label="t.templateName" :value="t.templateId" />
          </el-select>
        </el-form-item>
        <template v-if="composeMode === 'AI'">
          <el-form-item label="题目数量">
            <el-input-number v-model="aiQuestionCount" :min="1" :max="200" />
          </el-form-item>
          <el-form-item label="每题分值">
            <el-input-number v-model="aiScorePerQuestion" :min="1" :max="100" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button v-if="composeMode === 'MANUAL'" type="primary" :loading="creating" @click="doCreate">
          创建并组卷
        </el-button>
        <el-button v-else type="primary" :loading="generating" @click="doGenerate">
          生成试卷
        </el-button>
      </template>
    </el-dialog>

    <!-- 题库市场：勾选题目后加入该试卷的购物车 -->
    <QuestionMarketDialog v-model="marketVisible" :paper-id="currentPaperId" @picked="onMarketPicked" />

    <!-- 详情：直接渲染纸张预览，与组卷页中栏同一套排版 -->
    <el-dialog v-model="detailVisible" :title="detail?.paperName" width="900">
      <div v-if="detail" class="detail-preview">
        <div class="detail-preview__meta">
          <span>{{ detail.paperSubject }}</span>
          <span>{{ detail.paperGradeLevel }}{{ detail.paperGrade }}</span>
          <span>{{ detail.paperQuestionCount }} 题</span>
          <span>满分 {{ detail.paperTotalScore }} 分</span>
          <span>时长 {{ detail.paperDuration }} 分</span>
        </div>
        <PaperPreview
          :header="detailHeader"
          :questions="detailQuestions"
          :fit-width="DETAIL_PREVIEW_WIDTH"
          empty-text="该试卷没有题目，请确认题库中已有匹配学科与年级的题目后重新组卷"
        />
      </div>
    </el-dialog>

    <!-- 编辑：改卷头属性（组卷页只管题目与纸张，卷头属性在这里维护） -->
    <el-dialog v-model="editVisible" title="编辑试卷" width="560">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="editForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="editForm.subject" placeholder="请输入学科，如 数学" />
        </el-form-item>
        <el-form-item label="学段" required>
          <el-select v-model="editForm.gradeLevel" placeholder="请选择学段" style="width: 100%"
            @change="onEditGradeLevelChange">
            <el-option v-for="opt in GRADE_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-select
            v-model="editForm.grade"
            placeholder="请先选择学段"
            :disabled="!editForm.gradeLevel"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in editGradeOptions" :key="g.gradeId" :label="g.gradeName" :value="g.gradeName" />
          </el-select>
        </el-form-item>
        <el-form-item label="总分">
          <el-input-number v-model="editForm.totalScore" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="editForm.difficulty" :max="5" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="editForm.duration" :min="1" :max="600" /> 分钟
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="doEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { eduaiApi } from '../api/eduaiApi';
import type { EduGrade, MarketQuestion, Paper, PaperComposePayload, PaperTemplate } from '../api/types';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { ReTableSearchConfig } from '@repo/ui/re-table';
import QuestionMarketDialog from '../components/paper/QuestionMarketDialog.vue';
import PaperPreview from '../components/paper/PaperPreview.vue';
import { usePaperCart, toCartItem, type CartItem } from '../composables/usePaperCart';

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();
const router = useRouter();

function blankSearch(): Record<string, unknown> {
  return { subject: '', gradeLevel: '', status: null };
}

const { searchModel, applied, queryParams, commit, reset: resetDraft } =
  useSnapshotSearch<Record<string, unknown>>(blankSearch);

/** 三项筛选均为服务端 PaperQueryDTO 的等值条件 */
const searchConfig: ReTableSearchConfig = {
  title: '试卷检索',
  filters: [
    { key: 'subject', label: '学科', placeholder: '如 计算机' },
    {
      key: 'gradeLevel',
      label: '学段',
      type: 'select',
      options: [
        { label: '小学', value: 'PRIMARY' },
        { label: '初中', value: 'JUNIOR' },
        { label: '高中', value: 'SENIOR' },
        { label: '大学', value: 'UNIVERSITY' },
      ],
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '草稿', value: 0 },
        { label: '已发布', value: 1 },
        { label: '已归档', value: 2 },
      ],
    },
  ],
};

const loadPapers = createPageLoader((page, size) =>
  eduaiApi.pagePapers({
    pageNum: page,
    pageSize: size,
    subject: strParam(applied.value.subject),
    gradeLevel: strParam(applied.value.gradeLevel),
    status: numParam(applied.value.status),
  }),
);

/** 查询：提交草稿并回到第一页 */
const commitSearch = () => {
  commit();
  void tableRef.value?.goto(1);
};

/** 重置：清空草稿与快照后回第一页 */
const resetSearch = () => {
  resetDraft();
  void tableRef.value?.goto(1);
};

/** 增删改后留在当前页重拉 */
const reload = () => {
  void tableRef.value?.reload();
};

const generating = ref(false);

const detailVisible = ref(false);
const detail = ref<Paper | null>(null);

const QUESTION_TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: '单选题',
  MULTI_CHOICE: '多选题',
  JUDGE: '判断题',
  FILL: '填空题',
  SHORT_ANSWER: '解答题',
};

const questionTypeLabel = (type?: string) => QUESTION_TYPE_LABEL[type || ''] || type || '-';

/** 详情弹框内纸张预览的可用宽度（px），用于等比缩放纸张 */
const DETAIL_PREVIEW_WIDTH = 620;

/**
 * 详情弹框的卷头取值。
 *
 * <p>列表接口返回的是 paper* 前缀字段，详情接口还带 titleStyle / pageSize 等纸张字段，
 * 这里直接透传给 PaperPreview，缺省值由组件内部兜底（A4 纵向 / classic 标题）。</p>
 */
const detailHeader = computed(() => ({
  name: detail.value?.paperName ?? '',
  subject: detail.value?.paperSubject ?? '',
  gradeLevel: detail.value?.paperGradeLevel ?? '',
  grade: detail.value?.paperGrade ?? '',
  pageSize: detail.value?.paperPageSize ?? 'A4',
  pageOrientation: detail.value?.paperPageOrientation ?? 'PORTRAIT',
  titleStyle: detail.value?.paperTitleStyle ?? 'classic',
  header: detail.value?.paperHeader ?? '',
  footer: detail.value?.paperFooter ?? '',
}));

/** 详情弹框的题目列表：按 order 升序，与组卷页画布顺序一致 */
const detailQuestions = computed(() =>
  [...(detail.value?.questions ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((q) => ({
      questionId: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options,
      score: q.score,
      paperQuestionNo: q.questionNo,
    })),
);

/* ---------- 编辑试卷 ---------- */

const editVisible = ref(false);
const editing = ref(false);
const editTargetId = ref<number | null>(null);

/** 编辑弹框表单；打开时按行数据回填 */
const editForm = reactive({
  name: '',
  subject: '',
  gradeLevel: '',
  grade: '',
  totalScore: 100,
  difficulty: 3,
  duration: 60,
});

/**
 * 年级下拉：按所选学段的中文标签过滤。
 *
 * <p>与新建弹框共用同一份维度数据（eduaiApi.dimensionDropdown），
 * 避免为编辑再拉一次接口。</p>
 */
const editGradeOptions = computed(() => {
  const label = GRADE_LEVEL_OPTIONS.find((o) => o.value === editForm.gradeLevel)?.label;
  if (!label) {
    return [];
  }
  return createGrades.value.filter((g) => g.gradeLevel === label);
});

/** 切换学段后原年级可能不属于新学段，先清空 */
const onEditGradeLevelChange = () => {
  editForm.grade = '';
};

/** 打开编辑弹框：用列表行已有值回填，年级下拉按所选学段过滤 */
const openEdit = (row: Paper) => {
  editTargetId.value = row.paperId;
  editForm.name = row.paperName ?? '';
  editForm.subject = row.paperSubject ?? '';
  editForm.gradeLevel = gradeLevelToCode(row.paperGradeLevel);
  editForm.grade = row.paperGrade ?? '';
  editForm.totalScore = row.paperTotalScore ?? 100;
  editForm.difficulty = row.paperDifficulty ?? 3;
  editForm.duration = row.paperDuration ?? 60;
  editVisible.value = true;
};

/** 提交编辑：字段名与后端 PaperComposeUpdateDTO 逐字一致，不能写成 paper* 前缀 */
const doEdit = async () => {
  if (editTargetId.value == null) {
    return;
  }
  if (!editForm.name.trim()) {
    ElMessage.warning('请填写试卷名称');
    return;
  }
  if (!editForm.subject.trim()) {
    ElMessage.warning('请填写学科');
    return;
  }
  if (!editForm.gradeLevel) {
    ElMessage.warning('请选择学段');
    return;
  }
  if (!editForm.grade) {
    ElMessage.warning('请选择年级');
    return;
  }
  editing.value = true;
  try {
    const payload: PaperComposePayload = {
      name: editForm.name.trim(),
      subject: editForm.subject.trim(),
      gradeLevel: editForm.gradeLevel,
      grade: editForm.grade,
      totalScore: editForm.totalScore,
      difficulty: editForm.difficulty,
      duration: editForm.duration,
    };
    await eduaiApi.updatePaper(editTargetId.value, payload);
    ElMessage.success('保存成功');
    editVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    editing.value = false;
  }
};

/** 组卷：跳到组卷页并带上该试卷 ID */
const goCompose = (row: Paper) => {
  void router.push({
    path: '/eduai/paper-compose',
    query: { paperId: String(row.paperId) },
  });
};

/** 打开组卷弹框（手动/AI 共用）；手动沿用 openCreate 的默认值填充 */
const openCompose = () => {
  composeMode.value = 'MANUAL';
  openCreate();
};

const doGenerate = async () => {
  if (!createForm.name || !createForm.subject || !createForm.grade) {
    ElMessage.warning('请填写试卷名称/学科/年级');
    return;
  }
  generating.value = true;
  try {
    const paperId = await eduaiApi.generatePaper({
      name: createForm.name,
      subject: createForm.subject,
      gradeLevel: createForm.gradeLevel,
      grade: createForm.grade,
      questionCount: aiQuestionCount.value,
      scorePerQuestion: aiScorePerQuestion.value,
      duration: createForm.duration,
      knowledgePointIds: [],
      typeConfigs: [],
    });
    ElMessage.success(`生成成功，试卷 ID: ${paperId}`);
    createDialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('AI 组卷失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    generating.value = false;
  }
};

/* ==================== 新建试卷 ==================== */

/** 学段码值与中文标签；后端 gradeLevel 落库为中文，筛选年级前必须先码值转 label */
const GRADE_LEVEL_OPTIONS = [
  { value: 'PRIMARY', label: '小学' },
  { value: 'JUNIOR', label: '初中' },
  { value: 'SENIOR', label: '高中' },
  { value: 'UNIVERSITY', label: '大学' },
  { value: 'OTHER', label: '其他' },
];

/**
 * 库里存的学段中文名 → 接口/下拉用的码值。
 *
 * <p>列表行的 paperGradeLevel 是后端落库的中文名，回填到以码值绑定的下拉前必须转换；
 * 认不出的值原样返回，避免把历史脏数据清空。</p>
 *
 * @param label 库里的学段值（中文名或已经是码值）
 * @returns 对应码值；无法识别时返回入参本身
 */
const gradeLevelToCode = (label?: string): string => {
  if (!label) {
    return '';
  }
  return GRADE_LEVEL_OPTIONS.find((o) => o.value === label || o.label === label)?.value ?? label;
};

const createDialogVisible = ref(false);
const creating = ref(false);
/** 组卷方式：AI 组卷是「组卷」按钮的一个功能分支，与手动共用卷头配置 */
const composeMode = ref<'MANUAL' | 'AI'>('MANUAL');
const aiQuestionCount = ref(20);
const aiScorePerQuestion = ref(5);
const createGrades = ref<EduGrade[]>([]);
const templateOptions = ref<PaperTemplate[]>([]);
const createForm = reactive({
  name: '',
  subject: '',
  gradeLevel: '',
  grade: '',
  totalScore: 100,
  difficulty: 3,
  duration: 60,
  templateId: undefined as number | undefined,
});

/** 年级下拉：按所选学段的中文标签过滤（后端 gradeLevel 是中文，不是码值） */
const createGradeOptions = computed(() => {
  const label = GRADE_LEVEL_OPTIONS.find((o) => o.value === createForm.gradeLevel)?.label;
  if (!label) {
    return [];
  }
  return createGrades.value.filter((g) => g.gradeLevel === label);
});

/** 切换学段后原年级可能不属于新学段，先清空 */
const onCreateGradeLevelChange = () => {
  createForm.grade = '';
};

/** 打开新建弹框时拉取年级与启用中的模板 */
const loadCreateOptions = async () => {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    createGrades.value = Array.isArray(drop?.grades) ? drop.grades : [];
  } catch {
    createGrades.value = [];
  }
  try {
    const res = await eduaiApi.getPaperTemplatePage({ pageNum: 1, pageSize: 100 });
    const list = (res?.data ?? []) as PaperTemplate[];
    templateOptions.value = list.filter((t) => Number(t.templateStatus ?? 1) === 1);
  } catch {
    templateOptions.value = [];
  }
};

const openCreate = () => {
  Object.assign(createForm, {
    name: '',
    subject: '',
    gradeLevel: '',
    grade: '',
    totalScore: 100,
    difficulty: 3,
    duration: 60,
    templateId: undefined,
  });
  createDialogVisible.value = true;
  void loadCreateOptions();
};

/** 建卷：POST /v2/edu/paper（PaperComposeUpdateDTO 短字段），成功后跳组卷页 */
const doCreate = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请填写试卷名称');
    return;
  }
  if (!createForm.subject.trim()) {
    ElMessage.warning('请填写学科');
    return;
  }
  // 学段/年级为后端必填（edu_paper 对应列 NOT NULL 无默认值）
  if (!createForm.gradeLevel) {
    ElMessage.warning('请选择学段');
    return;
  }
  if (!createForm.grade) {
    ElMessage.warning('请选择年级');
    return;
  }
  creating.value = true;
  try {
    const payload: PaperComposePayload = {
      name: createForm.name.trim(),
      subject: createForm.subject.trim(),
      gradeLevel: createForm.gradeLevel || undefined,
      grade: createForm.grade || undefined,
      totalScore: createForm.totalScore,
      difficulty: createForm.difficulty,
      duration: createForm.duration,
      templateId: createForm.templateId ?? undefined,
    };
    const newId = await eduaiApi.createPaper(payload);
    ElMessage.success('创建成功，正在进入组卷页');
    createDialogVisible.value = false;
    void router.push({ path: '/eduai/paper-compose', query: { paperId: String(newId) } });
  } catch (e) {
    ElMessage.error('创建失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    creating.value = false;
  }
};

/* ==================== 题库市场（加入购物车） ==================== */

const marketVisible = ref(false);
const currentPaperId = ref<number | null>(null);
/** 购物车按试卷维度：currentPaperId 变化即切换目标试卷 */
const { addMany } = usePaperCart(currentPaperId);

const openMarket = (row: Paper) => {
  currentPaperId.value = row.paperId;
  marketVisible.value = true;
};

/**
 * QuestionMarketDialog 的勾选结果：题库市场字段名与购物车条目不同，
 * 这里显式映射后写入购物车。
 */
const onMarketPicked = (list: MarketQuestion[]) => {
  // 统一走共享映射（含分值兜底），避免各处各写一遍、并防止缺分值落成 0 分
  const items: CartItem[] = list.map((q) => toCartItem(q));
  const added = addMany(items);
  ElMessage.success(`已加入购物车 ${added} 题`);
};

const openDetail = async (row: Paper) => {
  try {
    detail.value = await eduaiApi.getPaper(row.paperId);
    detailVisible.value = true;
  } catch (e) {
    ElMessage.error('加载详情失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const paperStatusType = (n?: number) =>
  ({ 1: 'success', 2: 'info', 0: 'warning' } as Record<number, string>)[n ?? 0] || 'info';
const paperStatusLabel = (n?: number) =>
  ({ 1: '已发布', 2: '已归档', 0: '草稿' } as Record<number, string>)[n ?? 0] || '-';


</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; }

/* 详情：纸张预览 + 顶部元信息行 */
.detail-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 68vh;
  overflow-y: auto;
}

.detail-preview__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  width: 100%;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>