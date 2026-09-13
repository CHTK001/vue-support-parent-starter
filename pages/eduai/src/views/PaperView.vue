<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="filter.subject" placeholder="学科" clearable style="width: 140px" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button type="success" :icon="MagicStick" @click="openGenerate">AI 组卷</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <el-table v-loading="loading" :data="papers" border stripe>
        <el-table-column prop="paperId" label="ID" width="80" />
        <el-table-column prop="paperName" label="试卷名" min-width="200" />
        <el-table-column prop="paperSubject" label="学科" width="100" />
        <el-table-column prop="paperGradeLevel" label="学段" width="100" />
        <el-table-column prop="paperGrade" label="年级" width="100" />
        <el-table-column prop="paperTotalScore" label="总分" width="80" />
        <el-table-column prop="paperQuestionCount" label="题数" width="80" />
        <el-table-column prop="paperDuration" label="时长(分)" width="100" />
        <el-table-column label="来源" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.paperSource === 'AI' ? 'success' : 'info'">{{ row.paperSource }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="paperStatusType(row.paperStatus)">{{ paperStatusLabel(row.paperStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
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
    <el-dialog v-model="detailVisible" :title="detail?.paperName" width="640">
      <div v-if="detail" class="detail-content">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="学科">{{ detail.paperSubject }}</el-descriptions-item>
          <el-descriptions-item label="学段">{{ detail.paperGradeLevel }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detail.paperGrade }}</el-descriptions-item>
          <el-descriptions-item label="总分">{{ detail.paperTotalScore }}</el-descriptions-item>
          <el-descriptions-item label="题数">{{ detail.paperQuestionCount }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{ detail.paperDuration }} 分</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <div class="text-sm text-el-text-secondary">AI 组卷完成后，会将每道题的题干、选项、答案写入关联表。</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick, Search } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { Paper } from '../api/types';

const filter = reactive({ subject: '' });
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const papers = ref<Paper[]>([]);

const genDialogVisible = ref(false);
const generating = ref(false);
const genForm = reactive<any>({
  name: '',
  subject: '',
  gradeLevel: 'PRIMARY',
  grade: '',
  questionCount: 20,
  scorePerQuestion: 5,
  knowledgePointIdsText: '',
  duration: 90,
});

const detailVisible = ref(false);
const detail = ref<Paper | null>(null);

const reload = async () => {
  loading.value = true;
  try {
    const res = await eduaiApi.pagePapers({
      pageNum: pageNo.value,
      pageSize: pageSize.value,
      subject: filter.subject || undefined,
    });
    papers.value = (res?.data ?? []) as Paper[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const openGenerate = () => {
  Object.assign(genForm, {
    name: '',
    subject: '',
    gradeLevel: 'PRIMARY',
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

onMounted(reload);
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.detail-content { max-height: 480px; overflow: auto; }
</style>