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
          <ReButton type="success" icon="MagicStick" @click="openGenerate">AI 组卷</ReButton>
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
        <ReTableColumn label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <ReButton icon="View" :show-text="false" type="primary" @click="openDetail(row)">详情</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </el-card>

    <!-- AI 组卷对话框 -->
    <el-dialog v-model="genDialogVisible" title="AI 智能组卷" width="560">
      <el-form :model="genForm" label-width="100">
        <el-form-item label="试卷名称" required>
          <el-input v-model="genForm.name" />
        </el-form-item>
        <el-form-item label="学科" required>
          <el-input v-model="genForm.subject" />
        </el-form-item>
        <el-form-item label="学段">
          <el-select v-model="genForm.gradeLevel" style="width: 100%">
            <el-option label="不限" value="" />
            <el-option label="小学" value="PRIMARY" />
            <el-option label="初中" value="JUNIOR" />
            <el-option label="高中" value="SENIOR" />
            <el-option label="大学" value="UNIVERSITY" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" required>
          <el-input v-model="genForm.grade" />
        </el-form-item>
        <el-form-item label="题目数量">
          <el-input-number v-model="genForm.questionCount" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="每题分值">
          <el-input-number v-model="genForm.scorePerQuestion" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="知识点 ID">
          <el-input v-model="genForm.knowledgePointIdsText" placeholder="逗号分隔" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="genForm.duration" :min="10" :max="600" /> 分钟
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="doGenerate">生成</el-button>
      </template>
    </el-dialog>

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
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { eduaiApi } from '../api/eduaiApi';
import type { Paper } from '../api/types';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { ReTableSearchConfig } from '@repo/ui/re-table';

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();

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

const genDialogVisible = ref(false);
const generating = ref(false);
const genForm = reactive<any>({
  name: '',
  subject: '',
  gradeLevel: '',
  grade: '',
  questionCount: 20,
  scorePerQuestion: 5,
  knowledgePointIdsText: '',
  duration: 90,
});

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

const openGenerate = () => {
  Object.assign(genForm, {
    name: '',
    subject: '',
    gradeLevel: '',
    grade: '',
    questionCount: 20,
    scorePerQuestion: 5,
    knowledgePointIdsText: '',
    duration: 90,
  });
  genDialogVisible.value = true;
};

const doGenerate = async () => {
  if (!genForm.name || !genForm.subject || !genForm.grade) {
    ElMessage.warning('请填写名称/学科/年级');
    return;
  }
  const kpIds = (genForm.knowledgePointIdsText || '')
    .split(/[,，]/)
    .map((s: string) => Number(s.trim()))
    .filter((n: number) => !Number.isNaN(n));
  generating.value = true;
  try {
    const paperId = await eduaiApi.generatePaper({
      name: genForm.name,
      subject: genForm.subject,
      gradeLevel: genForm.gradeLevel,
      grade: genForm.grade,
      questionCount: genForm.questionCount,
      scorePerQuestion: genForm.scorePerQuestion,
      duration: genForm.duration,
      knowledgePointIds: kpIds,
      typeConfigs: [],
    });
    ElMessage.success(`生成成功，试卷 ID: ${paperId}`);
    genDialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('AI 组卷失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    generating.value = false;
  }
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