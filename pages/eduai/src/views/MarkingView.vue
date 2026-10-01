<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <ReButton type="primary" icon="Promotion" @click="openSubmit">提交答题卡</ReButton>
        <ReButton type="success" icon="Camera" @click="openScan">扫描阅卷</ReButton>
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
            <el-input-number v-model="row.teacherScore" :min="0" :max="row.maxScore ?? 100" controls-position="right" />
          </template>
        </ReTableColumn>
        <ReTableColumn label="教师评语" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.teacherComment" />
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
          <el-button @click="addAnswer">新增一条</el-button>
          <div v-for="(a, idx) in submitForm.answers" :key="idx" class="answer-row mt-2">
            <el-input-number v-model="a.questionId" :min="1" placeholder="题号" controls-position="right" style="width: 140px" />
            <el-input v-model="a.answer" placeholder="学生答案" class="ml-2" style="width: 320px" />
            <el-button type="danger" link class="ml-2" @click="submitForm.answers.splice(idx, 1)">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 扫描阅卷对话框：上传试卷/答题卡图片，支持自有卷与任意卷两种模式 -->
    <el-dialog v-model="scanDialogVisible" title="扫描阅卷" width="680">
      <el-form :model="scanForm" label-width="110">
        <el-form-item label="试卷类型" required>
          <el-radio-group v-model="scanForm.mode">
            <el-radio-button value="SELF">自有卷（题库有记录）</el-radio-button>
            <el-radio-button value="ANY">任意卷（外来试卷）</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scanForm.mode === 'SELF'" label="试卷" required>
          <el-select v-model="scanForm.paperId" placeholder="选择试卷（按题号取准确分值）" style="width: 100%" filterable>
            <el-option v-for="p in paperOptions" :key="p.paperId" :label="p.paperName" :value="p.paperId" />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="每题满分">
          <el-input-number v-model="scanForm.maxScore" :min="1" :max="150" />
          <span class="text-xs text-gray-400 ml-2">任意卷题库无记录，由模型自行判定</span>
        </el-form-item>
        <el-form-item label="学生 ID">
          <el-input v-model="scanForm.studentId" placeholder="留空则记为匿名" />
        </el-form-item>
        <el-form-item label="试卷图片（可多张）" required>
          <el-upload
            :auto-upload="false"
            multiple
            :limit="20"
            accept="image/*"
            :on-change="onScanFileChange"
            :on-remove="onScanFileRemove"
            list-type="picture"
          >
            <el-button icon="Upload">选择图片（可多选）</el-button>
          </el-upload>
          <div class="text-xs text-gray-400">一份试卷通常跨多页，请按页序选择，最多 20 张</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scanDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="scanning" @click="doScan">开始阅卷</el-button>
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

/** 扫描阅卷：模式选择（SELF 自有卷 / ANY 任意卷）、可选试卷、图片文件（可多张，按页序） */
const scanDialogVisible = ref(false);
const scanning = ref(false);
const paperOptions = ref<Array<{ paperId: number; paperName: string }>>([]);
const scanForm = reactive<{
  mode: 'SELF' | 'ANY';
  paperId: number | undefined;
  studentId: string;
  maxScore: number;
  files: File[];
}>({
  mode: 'SELF',
  paperId: undefined,
  studentId: '',
  maxScore: 5,
  files: [],
});

const openScan = async () => {
  scanForm.mode = 'SELF';
  scanForm.paperId = undefined;
  scanForm.studentId = '';
  scanForm.maxScore = 5;
  scanForm.files = [];
  scanDialogVisible.value = true;
  // 自有卷需要选择试卷：分值与标准答案都按试卷题号回数据库取
  try {
    const page = await eduaiApi.pagePapers({ pageNum: 1, pageSize: 100 });
    // PageResult 的主数组字段是 data（records 为兼容保留），二者取其一
    const rows = page?.data ?? page?.records ?? [];
    paperOptions.value = rows.map((p) => ({ paperId: p.paperId, paperName: p.paperName }));
  } catch {
    paperOptions.value = [];
  }
};

/** el-upload 的 change 回调：保存当前列表的原始 File（多张按页序），提交时再组 FormData */
const onScanFileChange = (_uploadFile: any, uploadFiles: any[]) => {
  scanForm.files = (uploadFiles ?? []).map((f) => f?.raw as File).filter(Boolean) as File[];
};

/** 移除某张图片后同步列表（否则被移除的图片仍会被提交） */
const onScanFileRemove = (_uploadFile: any, uploadFiles: any[]) => {
  scanForm.files = (uploadFiles ?? []).map((f) => f?.raw as File).filter(Boolean) as File[];
};

const doScan = async () => {
  if (!scanForm.files.length) {
    ElMessage.warning('请先选择试卷图片');
    return;
  }
  if (scanForm.mode === 'SELF' && !scanForm.paperId) {
    ElMessage.warning('自有卷必须选择试卷（用于按题号取准确分值）');
    return;
  }
  scanning.value = true;
  try {
    const form = new FormData();
    // 同名 file 字段重复提交即多张；后端按提交顺序（页序）接收
    scanForm.files.forEach((f) => form.append('file', f));
    form.append('mode', scanForm.mode);
    if (scanForm.mode === 'SELF' && scanForm.paperId) {
      form.append('paperId', String(scanForm.paperId));
    } else {
      form.append('maxScore', String(scanForm.maxScore));
    }
    if (scanForm.studentId) {
      form.append('studentId', scanForm.studentId);
    }
    const newTaskId = await eduaiApi.scanMarking(form);
    ElMessage.success('已提交，正在识别与判分…');
    taskId.value = newTaskId;
    scanDialogVisible.value = false;
    // 判分在服务端逐题调模型（每题数秒），必须轮询等待，不能只读一次
    await fetchResult();
  } catch (e) {
    ElMessage.error('扫描阅卷失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    scanning.value = false;
  }
};

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
.page-container { height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.answer-row { display: flex; align-items: center; }
</style>