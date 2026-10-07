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
      <el-tabs v-model="resultTab" class="result-tabs">
        <el-tab-pane label="结果列表" name="table">
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
            <ReTableColumn label="题号" width="120">
              <template #default="{ row }">{{ row.no || row.questionId }}</template>
            </ReTableColumn>
            <ReTableColumn prop="studentAnswer" label="学生作答" min-width="220" show-overflow-tooltip />
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
        </el-tab-pane>
        <el-tab-pane label="同版式解析" name="structure" lazy>
          <SheetStructureView v-if="taskId" :task-id="taskId" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 提交答题卡对话框 -->
    <el-dialog v-model="submitDialogVisible" title="提交答题卡" width="640">
      <el-form :model="submitForm" label-width="100">
        <el-form-item label="考试 ID" required>
          <el-select
            v-model="submitForm.examId"
            filterable
            clearable
            placeholder="选择考试（决定可用题号与判分口径）"
            style="width: 100%"
            @change="onSubmitExamChange"
          >
            <el-option v-for="e in examOptions" :key="e.examId" :label="examLabel(e)" :value="e.examId" />
          </el-select>
          <div v-if="examOptions.length === 0" class="tip-text">未查到考试，请先在「考试管理」创建考试</div>
        </el-form-item>
        <el-form-item label="学生 ID" required>
          <el-input v-model="submitForm.studentId" />
        </el-form-item>
        <el-form-item label="答题内容">
          <el-input v-model="submitForm.content" type="textarea" :rows="2" placeholder="可选，须为合法 JSON，如 {&quot;1&quot;:&quot;北京&quot;}" />
        </el-form-item>
        <el-form-item label="作答列表">
          <el-button @click="addAnswer">新增一条</el-button>
          <div v-for="(a, idx) in submitForm.answers" :key="idx" class="answer-row mt-2">
            <el-select
              v-model="a.questionId"
              filterable
              placeholder="题号"
              style="width: 160px"
              :disabled="questionOptions.length === 0"
            >
              <el-option v-for="q in questionOptions" :key="q.id" :label="questionLabel(q)" :value="q.id" />
            </el-select>
            <el-input v-model="a.answer" placeholder="学生答案" class="ml-2" style="width: 300px" />
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
import { failToast } from '../api/errorText';
import type { MarkingResultVO } from '../api/types';
import SheetStructureView from '../components/marking/SheetStructureView.vue';

const taskId = ref('');
const loading = ref(false);
const result = ref<MarkingResultVO | null>(null);
const resultTab = ref('table');

const submitDialogVisible = ref(false);
const submitting = ref(false);
const submitForm = reactive<{ examId: number | null; studentId: string; content: string; answers: Array<{ questionId: number | null; answer: string }> }>({
  examId: null,
  studentId: '',
  content: '',
  answers: [],
});
/** 可选考试：此前 examId 写死 1，库里没有 1 号考试（或它没关联试卷）时提交必 400 */
const examOptions = ref<Array<{ examId: number; examName: string; examPaperId?: number }>>([]);
/** 当前所选考试试卷上的题号集合：作答题号只能从这里选，否则后端「不在试卷上」直接拒绝 */
const questionOptions = ref<Array<{ id: number; questionNo?: string; stem: string }>>([]);

const examLabel = (e: { examId: number; examName: string }) => `${e.examName}（#${e.examId}）`;
const questionLabel = (q: { id: number; questionNo?: string; stem: string }) =>
  `${q.questionNo || q.id}　${(q.stem || '').replace(/\s+/g, '').slice(0, 14)}`;

/** 拉取考试列表：打开提交弹窗时调用，保证下拉里都是真实存在的考试 */
const loadExams = async () => {
  try {
    const page = await eduaiApi.pageExams({ page: 1, pageSize: 200 });
    const rows = page?.data ?? page?.records ?? [];
    examOptions.value = rows.map((e) => ({ examId: e.examId, examName: e.examName, examPaperId: e.examPaperId }));
  } catch {
    examOptions.value = [];
  }
};

/**
 * 切换考试后重载该卷题号并把作答里的题号收敛到新卷上。
 *
 * <p>不重载的话，上一场考试的题号留在作答列表里，后端 validateExamPaper
 * 会以「题目 X 不在试卷上」400 拒绝——用户看到的就是莫名其妙的失败。</p>
 */
const onSubmitExamChange = async (examId: number | null) => {
  questionOptions.value = [];
  if (!examId) {
    return;
  }
  try {
    const exam = examOptions.value.find((e) => e.examId === examId);
    if (!exam?.examPaperId) {
      ElMessage.warning('该考试未关联试卷，无法提交答题卡');
      submitForm.answers = [];
      return;
    }
    const paper = await eduaiApi.getPaper(exam.examPaperId);
    questionOptions.value = (paper?.questions ?? []).map((q) => ({ id: q.id, questionNo: q.questionNo, stem: q.stem }));
  } catch (e) {
    failToast('加载试卷题号失败', e);
    return;
  }
  const validIds = new Set(questionOptions.value.map((q) => q.id));
  submitForm.answers = submitForm.answers.filter((a) => a.questionId != null && validIds.has(a.questionId));
  if (submitForm.answers.length === 0) {
    const first = questionOptions.value[0];
    submitForm.answers = [{ questionId: first ? first.id : null, answer: '' }];
  }
};

const confirming = ref(false);
let pollHandle: any = null;
/** 当前轮询对应的 taskId：切换任务时必须先停掉上一个任务的轮询 */
let pollTaskId = '';

/** 停掉轮询（切任务、离开页面、任务已完成时都要走这里） */
const stopPolling = () => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
  pollTaskId = '';
};

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
    failToast('扫描阅卷失败', e);
  } finally {
    scanning.value = false;
  }
};

/** 题号下拉有值时优先取第一题，避免写死 1 号题（卷上没有 1 号题时后端会 400） */
const addAnswer = () =>
  submitForm.answers.push({ questionId: questionOptions.value[0]?.id ?? null, answer: '' });

const openSubmit = async () => {
  submitForm.examId = null;
  submitForm.studentId = '';
  submitForm.content = '';
  submitForm.answers = [];
  questionOptions.value = [];
  submitDialogVisible.value = true;
  await loadExams();
};

const doSubmit = async () => {
  const studentId = submitForm.studentId.trim();
  if (!studentId || submitForm.answers.length === 0) {
    ElMessage.warning('请填写学生 ID 与至少一条作答');
    return;
  }
  // 题号必须来自所选考试的试卷：后端 validateExamPaper 会拒绝卷外题号，
  // 这里提前拦下并给出可读提示，而不是甩一个 400。
  const examId = submitForm.examId;
  if (!examId) {
    ElMessage.warning('请选择考试');
    return;
  }
  const validIds = new Set(questionOptions.value.map((q) => q.id));
  const picked = submitForm.answers.filter((a) => a.questionId != null && validIds.has(a.questionId));
  if (questionOptions.value.length === 0 || picked.length !== submitForm.answers.length) {
    ElMessage.warning('作答里有不在该考试试卷上的题号，请重新选择');
    return;
  }
  const answers = picked.map((a) => ({ questionId: a.questionId as number, answer: a.answer }));
  // 答题内容是可选 JSON：留空时**不能**下发空串——数据库 answer_sheet_content
  // 上有 JSON 合法性约束，'' 会让后端 500「数据校验失败」。填了但不是合法 JSON 同理。
  const content = submitForm.content.trim();
  if (content) {
    try {
      JSON.parse(content);
    } catch {
      ElMessage.warning('答题内容必须是合法 JSON（例如 {"1":"北京"}），请检查后重试');
      return;
    }
  }
  submitting.value = true;
  try {
    const newTaskId = await eduaiApi.submitMarking({
      examId,
      studentId,
      content: content || undefined,
      answers,
    });
    ElMessage.success(`提交成功，taskId: ${newTaskId}`);
    taskId.value = newTaskId;
    submitDialogVisible.value = false;
    fetchResult();
  } catch (e) {
    failToast('提交失败', e);
  } finally {
    submitting.value = false;
  }
};

const fetchResult = async () => {
  const id = taskId.value.trim();
  if (!id) {
    ElMessage.warning('请先提交或输入 taskId');
    return;
  }
  // 切到别的 taskId 时，先停掉上一个任务的轮询：否则旧任务的轮询会在 2 秒后
  // 拿旧数据覆盖 result，页面显示成另一个任务的结果（教师会据此判错分）。
  if (id !== pollTaskId) stopPolling();
  loading.value = true;
  try {
    const r = await eduaiApi.getMarkingResult(id);
    if (id !== taskId.value.trim()) return; // 响应回来时用户已切走，丢弃
    result.value = r;
    if (!r?.finished && !pollHandle) {
      pollTaskId = id;
      pollHandle = setInterval(async () => {
        if (id !== taskId.value.trim()) {
          stopPolling();
          return;
        }
        try {
          const rr = await eduaiApi.getMarkingResult(id);
          if (id !== taskId.value.trim()) return;
          result.value = rr;
          if (rr?.finished) stopPolling();
        } catch {
          // 静默
        }
      }, 2000);
    }
  } catch (e) {
    // 查询失败时必须清掉旧结果：taskId 已是新值而表格还留着上一个任务的分，
    // 教师会把上一份成绩当成这次的结果
    if (id === taskId.value.trim()) {
      stopPolling();
      result.value = null;
    }
    failToast('查询失败', e);
  } finally {
    loading.value = false;
  }
};

const confirmAdjust = async () => {
  if (!result.value) return;
  const adjustments = (result.value.results || []).map((r) => ({
    resultId: r.resultId,
    score: r.teacherScore ?? r.score,
    // 教师没写评语就不传该字段（后端视为「不改评语」），否则会把 AI 评语写进「教师评语」列
    comment: r.teacherComment ?? undefined,
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
    failToast('确认失败', e);
  } finally {
    confirming.value = false;
  }
};

onMounted(() => {});
onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.answer-row { display: flex; align-items: center; }
.tip-text { font-size: 12px; color: var(--el-color-warning); line-height: 1.6; }
</style>