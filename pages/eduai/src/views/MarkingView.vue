<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <ReButton type="primary" icon="Promotion" @click="openSubmit">提交答题卡</ReButton>
        <el-input v-model="taskId" placeholder="已有 taskId 可直接查询" clearable style="width: 260px" />
        <ReButton icon="Search" @click="fetchResult">查询</ReButton>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <template #header>
        <div class="flex items-center gap-3">
          <el-icon><Reading /></el-icon>
          <span class="font-semibold">阅卷结果</span>
          <el-tag v-if="result" :type="result.finished ? 'success' : 'warning'">
            {{ result.finished ? '已完成' : '批改中' }}
          </el-tag>
          <el-tag v-if="result" type="info">总分 {{ result.totalScore }}</el-tag>
          <el-tag v-if="result" type="info">{{ result.results?.length || 0 }} 题</el-tag>
        </div>
      </template>
      <ReTable
        :data="result?.results ?? []"
        :loading="loading"
        row-key="resultId"
        :toolbar="false"
        :pagination="false"
        border
        stripe
        @refresh="fetchResult"
      >
        <ReTableColumn prop="questionId" label="题号" width="120" />
        <ReTableColumn label="AI 得分" width="130">
          <template #default="{ row }">{{ row.score }} / {{ row.maxScore ?? '-' }}</template>
        </ReTableColumn>
        <ReTableColumn prop="comment" label="AI 评语" min-width="240" show-overflow-tooltip />
        <ReTableColumn label="教师修正" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.teacherScore" :min="0" :max="row.maxScore ?? 100" size="small" controls-position="right" />
          </template>
        </ReTableColumn>
        <ReTableColumn label="教师评语" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.teacherComment" size="small" />
          </template>
        </ReTableColumn>
      </ReTable>
      <div v-if="result?.finished" class="flex justify-end mt-3">
        <ReButton type="primary" icon="CircleCheck" :loading="confirming" @click="confirmAdjust">教师确认/修正</ReButton>
      </div>
    </el-card>

    <!-- 提交答题卡对话框 -->
    <el-dialog v-model="submitDialogVisible" title="提交答题卡" width="640">
      <el-form :model="submitForm" label-width="100">
        <el-form-item label="考试 ID" required>
          <el-input-number v-model="submitForm.examId" :min="1" />
        </el-form-item>
        <el-form-item label="学生 ID" required>
          <el-input v-model="submitForm.studentId" />
        </el-form-item>
        <el-form-item label="答题内容">
          <el-input v-model="submitForm.content" type="textarea" :rows="2" placeholder="可选 JSON" />
        </el-form-item>
        <el-form-item label="作答列表">
          <el-button size="small" @click="addAnswer">新增一条</el-button>
          <div v-for="(a, idx) in submitForm.answers" :key="idx" class="answer-row mt-2">
            <el-input-number v-model="a.questionId" :min="1" placeholder="题号" controls-position="right" style="width: 140px" />
            <el-input v-model="a.answer" placeholder="学生答案" class="ml-2" style="width: 320px" />
            <el-button size="small" type="danger" link class="ml-2" @click="submitForm.answers.splice(idx, 1)">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Reading } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { MarkingResultVO } from '../api/types';

const taskId = ref('');
const loading = ref(false);
const result = ref<MarkingResultVO | null>(null);

const submitDialogVisible = ref(false);
const submitting = ref(false);
const submitForm = reactive<{ examId: number; studentId: string; content: string; answers: Array<{ questionId: number; answer: string }> }>({
  examId: 1,
  studentId: '',
  content: '',
  answers: [],
});

const confirming = ref(false);
let pollHandle: any = null;

const addAnswer = () => submitForm.answers.push({ questionId: 1, answer: '' });

const openSubmit = () => {
  submitForm.examId = 1;
  submitForm.studentId = '';
  submitForm.content = '';
  submitForm.answers = [{ questionId: 1, answer: '' }];
  submitDialogVisible.value = true;
};

const doSubmit = async () => {
  if (!submitForm.studentId || submitForm.answers.length === 0) {
    ElMessage.warning('请填写学生 ID 与至少一条作答');
    return;
  }
  submitting.value = true;
  try {
    const newTaskId = await eduaiApi.submitMarking({
      examId: submitForm.examId,
      studentId: submitForm.studentId,
      content: submitForm.content,
      answers: submitForm.answers,
    });
    ElMessage.success(`提交成功，taskId: ${newTaskId}`);
    taskId.value = newTaskId;
    submitDialogVisible.value = false;
    fetchResult();
  } catch (e) {
    ElMessage.error('提交失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    submitting.value = false;
  }
};

const fetchResult = async () => {
  if (!taskId.value) {
    ElMessage.warning('请先提交或输入 taskId');
    return;
  }
  loading.value = true;
  try {
    result.value = await eduaiApi.getMarkingResult(taskId.value);
    if (!result.value?.finished && !pollHandle) {
      pollHandle = setInterval(async () => {
        try {
          const r = await eduaiApi.getMarkingResult(taskId.value);
          result.value = r;
          if (r?.finished) {
            clearInterval(pollHandle);
            pollHandle = null;
          }
        } catch {
          // 静默
        }
      }, 2000);
    }
  } catch (e) {
    ElMessage.error('查询失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const confirmAdjust = async () => {
  if (!result.value) return;
  const adjustments = (result.value.results || []).map((r) => ({
    resultId: r.resultId,
    score: r.teacherScore ?? r.score,
    comment: r.teacherComment ?? r.comment,
  })).filter((a) => a.resultId > 0);
  if (adjustments.length === 0) {
    ElMessage.warning('暂无可确认的结果');
    return;
  }
  confirming.value = true;
  try {
    await eduaiApi.confirmMarking({ taskId: taskId.value, adjustments });
    ElMessage.success('教师确认已提交');
    await fetchResult();
  } catch (e) {
    ElMessage.error('确认失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    confirming.value = false;
  }
};

onMounted(() => {});
onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle);
});
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.answer-row { display: flex; align-items: center; }
</style>