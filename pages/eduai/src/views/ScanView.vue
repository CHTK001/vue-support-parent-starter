<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3 flex-wrap">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept="image/*"
        >
          <el-button :icon="Upload" :type="file ? '' : 'primary'">选择图片</el-button>
        </el-upload>
        <el-input v-model="userId" placeholder="用户 ID" clearable style="width: 160px" />
        <el-select v-model="scanType" placeholder="扫描类型" style="width: 140px">
          <el-option label="题目扫描" value="QUESTION" />
          <el-option label="错题扫描" value="WRONGBOOK" />
        </el-select>
        <el-button type="primary" :loading="uploading" :disabled="!file || !userId || !scanType" @click="doUpload">
          上传并 OCR
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <template #header>
        <div class="flex items-center gap-3">
          <el-icon><View /></el-icon>
          <span class="font-semibold">扫描结果</span>
          <el-tag v-if="scanRecord?.status === 1" type="warning">OCR 中</el-tag>
          <el-tag v-if="scanRecord?.status === 2" type="success">分析完成</el-tag>
          <el-tag v-if="scanRecord?.status === 3" type="danger">失败</el-tag>
        </div>
      </template>

      <div v-if="!scanRecord" class="text-center text-gray-400 py-12">
        <el-icon :size="48"><Document /></el-icon>
        <p class="mt-2">请上传图片开始扫描</p>
      </div>

      <div v-else class="space-y-4">
        <div v-if="scanRecord.ocrText" class="border rounded p-3 bg-gray-50">
          <div class="text-xs text-gray-500 mb-1">OCR 识别文本</div>
          <pre class="text-sm whitespace-pre-wrap max-h-40 overflow-auto">{{ scanRecord.ocrText }}</pre>
        </div>

        <div v-if="questions.length" class="space-y-2">
          <div class="text-xs text-gray-500">解析题目（{{ questions.length }} 题）</div>
          <ReTable
            :data="questions"
            border
            stripe
            size="small"
            :toolbar="false"
            :pagination="false"
          >
            <ReTableColumn type="index" label="#" width="50" />
            <ReTableColumn prop="questionType" label="题型" width="130" />
            <ReTableColumn prop="stem" label="题干" min-width="200" show-overflow-tooltip />
            <ReTableColumn prop="answer" label="答案" width="100" />
          </ReTable>
        </div>

        <div v-if="scanRecord.status === 2 && questions.length" class="flex gap-3 mt-4">
          <el-button type="primary" :icon="Promotion" @click="doGenerateQuestions">生成题目</el-button>
          <el-button type="warning" :icon="Warning" @click="doGenerateWrongbook">生成错题</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, Document, View, Promotion, Warning } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { ScanRecord, ScanQuestion } from '../api/types';

const file = ref<File | null>(null);
const userId = ref('');
const scanType = ref('QUESTION');
const uploading = ref(false);
const scanRecord = ref<ScanRecord | null>(null);
const questions = ref<ScanQuestion[]>([]);

const handleFileChange = (f: File[]) => {
  file.value = f[0] || null;
};

const doUpload = async () => {
  if (!file.value || !userId.value || !scanType.value) {
    ElMessage.warning('请选择图片、填写用户 ID 和扫描类型');
    return;
  }
  uploading.value = true;
  try {
    const res = await eduaiApi.uploadScan(file.value, userId.value, scanType.value);
    scanRecord.value = { scanId: res.scanId, userId: userId.value, scanType: scanType.value, status: 1 };
    ElMessage.success(`上传成功，scanId: ${res.scanId}，正在 OCR...`);
    await pollAnalyze(res.scanId);
  } catch (e) {
    ElMessage.error('上传失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    uploading.value = false;
  }
};

const pollAnalyze = async (scanId: number) => {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await eduaiApi.analyzeScan(scanId);
      scanRecord.value = r as ScanRecord;
      if (r.status === 2) {
        ElMessage.success('分析完成');
        questions.value = parseQuestions(r);
        return;
      }
      if (r.status === 3) {
        ElMessage.error('分析失败');
        return;
      }
    } catch {
      // 静默重试
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  ElMessage.error('分析超时');
};

const parseQuestions = (record: ScanRecord): ScanQuestion[] => {
  try {
    const result = JSON.parse(record.analysisResult || '[]');
    return (Array.isArray(result) ? result : []).map((q: any) => ({
      questionType: q.questionType || 'SINGLE_CHOICE',
      stem: q.stem || '',
      options: q.options || [],
      answer: q.answer || '',
      analysis: q.analysis,
    }));
  } catch {
    return [];
  }
};

const doGenerateQuestions = async () => {
  if (!scanRecord.value) return;
  try {
    const res = await eduaiApi.generateQuestion({
      scanId: scanRecord.value.scanId,
      subject: '',
      gradeLevel: '',
      grade: '',
    });
    ElMessage.success(`成功生成 ${res.count} 道题目`);
  } catch (e) {
    ElMessage.error('生成题目失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const doGenerateWrongbook = async () => {
  if (!scanRecord.value) return;
  try {
    const res = await eduaiApi.generateWrongbook(scanRecord.value.scanId);
    ElMessage.success(`成功生成 ${res.count} 道错题`);
  } catch (e) {
    ElMessage.error('生成错题失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};
</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
</style>