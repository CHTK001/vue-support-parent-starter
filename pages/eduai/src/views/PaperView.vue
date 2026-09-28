<template>
  <div class="page-container">
    <el-card shadow="never" class="mt-3 flex-1">
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
            <el-tag size="small" :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <ReButton icon="View" :show-text="false" type="primary" @click="openDetail(row)">详情</ReButton>
            <ReButton icon="EditPen" :show-text="false" type="warning" @click="goCompose(row)">组卷</ReButton>
            <ReButton icon="Collection" :show-text="false" type="success" @click="openMarket(row)">题库</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </el-card>

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
        <el-form-item label="学段">
          <el-select
            v-model="createForm.gradeLevel"
            placeholder="请选择学段"
            style="width: 100%"
            @change="onCreateGradeLevelChange"
          >
            <el-option v-for="opt in GRADE_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="detail?.paperName" width="760">
      <div v-if="detail" class="detail-content">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="学科">{{ detail.paperSubject }}</el-descriptions-item>
          <el-descriptions-item label="学段">{{ detail.paperGradeLevel }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detail.paperGrade }}</el-descriptions-item>
          <el-descriptions-item label="总分">{{ detail.paperTotalScore }}</el-descriptions-item>
          <el-descriptions-item label="题数">{{ detail.paperQuestionCount }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{ detail.paperDuration }} 分</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">题目清单</el-divider>
        <div v-if="!detail.questions?.length" class="text-sm text-el-text-secondary">
          该试卷没有题目，请确认题库中已有匹配学科与年级的题目后重新组卷。
        </div>
        <div v-for="(q, idx) in detail.questions" :key="q.id" class="question-item">
          <div class="question-head">
            <span class="question-no">{{ idx + 1 }}.</span>
            <el-tag size="small" type="info">{{ questionTypeLabel(q.type) }}</el-tag>
            <el-tag size="small" type="warning">{{ q.score ?? '-' }} 分</el-tag>
            <span class="question-id">题目 ID {{ q.id }}</span>
          </div>
          <div class="question-stem">{{ q.stem }}</div>
          <div v-for="(opt, oi) in parseOptions(q.options)" :key="oi" class="question-option">{{ opt }}</div>
          <div class="question-answer">答案：{{ q.answer || '-' }}</div>
          <div v-if="q.analysis" class="question-analysis">解析：{{ q.analysis }}</div>
        </div>
      </div>
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

/** 选项列存的是 JSON 文本，解析不出来时按分隔符兜底展示 */
const parseOptions = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([k, v]) => `${k}. ${v}`);
    }
    return [String(parsed)];
  } catch {
    return String(raw)
      .split(/[\n;；]/)
      .map((s) => s.trim())
      .filter(Boolean);
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
  creating.value = true;
  try {
    const payload: Record<string, unknown> = {
      name: createForm.name.trim(),
      subject: createForm.subject.trim(),
      gradeLevel: createForm.gradeLevel || undefined,
      grade: createForm.grade || undefined,
      totalScore: createForm.totalScore,
      difficulty: createForm.difficulty,
      duration: createForm.duration,
      templateId: createForm.templateId ?? undefined,
    };
    const newId = await eduaiApi.createPaper(payload as unknown as PaperComposePayload);
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
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.detail-content { max-height: 60vh; overflow: auto; }
.question-item { padding: 10px 0; border-bottom: 1px dashed var(--el-border-color-lighter); }
.question-item:last-child { border-bottom: none; }
.question-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.question-no { font-weight: 600; }
.question-id { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }
.question-stem { line-height: 1.6; }
.question-option { padding-left: 20px; font-size: 13px; line-height: 1.7; color: var(--el-text-color-regular); }
.question-answer { padding-left: 20px; margin-top: 4px; font-size: 13px; color: var(--el-color-success); }
.question-analysis { padding-left: 20px; font-size: 12px; color: var(--el-text-color-secondary); }
</style>