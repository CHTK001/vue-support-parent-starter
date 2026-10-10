<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3 flex-wrap">
        <ReButton type="primary" icon="Promotion" @click="openSubmit">提交答题卡</ReButton>
        <ReButton type="success" icon="Camera" @click="openScan">扫描阅卷</ReButton>
        <el-input v-model="taskId" placeholder="任务号直达（可选）" clearable style="width: 260px" />
        <ReButton icon="Search" @click="openDetail()">查询</ReButton>
        <ReButton v-if="view === 'detail'" icon="Back" @click="backToList">返回记录</ReButton>
      </div>
    </el-card>

    <!-- 实时进度（SSE）：上传后立即显示识别/解析/判分推进，终态自动收起 -->
    <el-card v-if="progress" shadow="never" class="mt-3 progress-card">
      <div class="flex items-center gap-3 flex-wrap">
        <el-tag :type="progressTagType" effect="dark">{{ progressTagText }}</el-tag>
        <span class="font-semibold">{{ progress.stage || '处理中' }}</span>
        <el-tag v-if="progress.total" type="info" size="small">
          {{ progress.doneCount ?? 0 }} / {{ progress.total }} 题
        </el-tag>
        <el-tag :type="streamTagType" size="small" effect="plain">{{ streamTagText }}</el-tag>
        <span class="progress-task-id">taskId: {{ progress.taskId }}</span>
      </div>
      <el-progress
        class="mt-2"
        :percentage="progress.percent ?? 0"
        :indeterminate="progress.percent == null && !progress.finished"
        :status="progress.taskStatus === 3 ? 'exception' : progress.finished ? 'success' : ''"
        :stroke-width="10"
      />
      <el-alert
        v-if="progress.error"
        class="mt-2"
        type="error"
        :closable="false"
        show-icon
        :title="progress.error"
      />
      <div v-if="progress.finished" class="flex justify-end mt-2">
        <ReButton size="small" @click="progress = null">收起</ReButton>
      </div>
    </el-card>

    <!-- AI 阅卷记录：一行 = 一份试卷（试卷为主体，不是题目） -->
    <el-card v-if="view === 'list'" shadow="never" class="mt-3 flex-1 records-card">
      <template #header>
        <div class="flex items-center gap-3 flex-wrap">
          <el-icon><Reading /></el-icon>
          <span class="font-semibold">AI 阅卷记录（试卷）</span>
          <el-tag type="info">{{ totalCount }} 份</el-tag>
          <el-tag type="success" effect="plain">老师总分为最终成绩</el-tag>
          <div class="flex-1" />
          <ReButton icon="Refresh" :loading="refreshing" @click="reloadList">刷新</ReButton>
        </div>
      </template>
      <ReTable
        ref="markingTable"
        :load="markingTasksLoader"
        v-model:total="totalCount"
        row-key="markingTaskId"
        :toolbar="false"
        :pagination="true"
        border
        stripe
        @load-error="pageLoadError"
      >
        <ReTableColumn label="任务号" min-width="230" show-overflow-tooltip>
          <template #default="{ row }"><span class="task-id-cell">{{ row.markingTaskTaskId }}</span></template>
        </ReTableColumn>
        <ReTableColumn label="类型" width="86">
          <template #default="{ row }">
            <el-tag size="small" :type="row.markingTaskMode === 'ANY' ? 'warning' : 'primary'">
              {{ modeLabel(row) }}
            </el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="试卷" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ paperNameOf(row) }}</template>
        </ReTableColumn>
        <ReTableColumn label="学生" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.markingTaskStudentId || '匿名' }}</template>
        </ReTableColumn>
        <ReTableColumn label="状态" width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="taskStatusType(row.markingTaskStatus)">
              {{ taskStatusLabel(row.markingTaskStatus) }}
            </el-tag>
            <span v-if="row.markingTaskStage" class="stage-text">{{ row.markingTaskStage }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="AI 总分" width="90">
          <template #default="{ row }">{{ scoreOf(row)?.ai ?? '—' }}</template>
        </ReTableColumn>
        <ReTableColumn label="老师总分" width="100">
          <template #default="{ row }">
            <b class="final-score">{{ scoreOf(row)?.final ?? '—' }}</b>
          </template>
        </ReTableColumn>
        <ReTableColumn label="时间" min-width="160">
          <template #default="{ row }">{{ row.markingTaskStartTime || row.markingTaskFinishTime || '—' }}</template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="90">
          <template #default="{ row }">
            <ReButton link type="primary" @click="openDetail(row.markingTaskTaskId, row)">查看</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </el-card>

    <!-- 试卷详情：原始试卷 / 版面解析 + AI 分与老师分（老师为主） -->
    <el-card v-else shadow="never" class="mt-3 detail-card">
      <template #header>
        <div class="flex items-center gap-2 flex-wrap">
          <el-icon><Reading /></el-icon>
          <span class="font-semibold">阅卷详情</span>
          <span class="detail-id" :title="selectedTaskId">{{ selectedTaskId }}</span>
          <el-tag v-if="selectedRow" size="small" type="info">{{ modeLabel(selectedRow) }}</el-tag>
          <span v-if="selectedRow?.markingTaskStudentId" class="detail-meta">
            学生：{{ selectedRow.markingTaskStudentId }}
          </span>
          <span v-if="paperNameOf(selectedRow) !== '—'" class="detail-meta">
            试卷：{{ paperNameOf(selectedRow) }}
          </span>
          <el-tag v-if="selectedRow" size="small" :type="taskStatusType(selectedRow.markingTaskStatus)">
            {{ taskStatusLabel(selectedRow.markingTaskStatus) }}
          </el-tag>
          <el-tag v-else-if="selectedScores" size="small" :type="selectedScores.finished ? 'success' : 'warning'">
            {{ selectedScores.finished ? '已完成' : '判分中' }}
          </el-tag>
          <div class="flex-1" />
          <el-tag type="info">AI 总分 {{ selectedScores?.ai ?? '…' }}</el-tag>
          <el-tag type="success" effect="dark">
            老师总分 {{ selectedScores?.final ?? '…' }}（老师为主）
          </el-tag>
        </div>
      </template>
      <div class="detail-body">
        <SheetStructureView
          :key="`${selectedTaskId}:${structureKey}`"
          :task-id="selectedTaskId"
          @saved="onSaved"
        />
      </div>
    </el-card>

    <!-- 提交答题卡对话框 -->
    <ReDialog v-model="submitDialogVisible" title="提交答题卡" width="640">
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
    </ReDialog>

    <!-- 扫描阅卷对话框：上传试卷/答题卡图片，支持自有卷与任意卷两种模式 -->
    <!-- destroy-on-close：关闭即销毁内容，否则 el-upload 内部列表跨开合残留，
         openScan 虽重置 scanForm.files，但下次 on-change 会把旧图同步回来造成串页 -->
    <ReDialog v-model="scanDialogVisible" title="扫描阅卷" width="680" destroy-on-close>
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
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { onMounted, onUnmounted, reactive, ref, computed } from 'vue';

import { Reading } from '@element-plus/icons-vue';
import { http } from '@repo/utils';
import { eduaiApi } from '../api/eduaiApi';
import { createPageLoader, pageLoadError } from '../api/pageLoader';
import { failToast } from '../api/errorText';
import type { MarkingProgressVO, MarkingResultVO, TeacherMarkingTask } from '../api/types';
import ReDialog from "@repo/ui/re-dialog";
import SheetStructureView from '../components/marking/SheetStructureView.vue';

const taskId = ref('');

/* ==================== AI 阅卷记录（试卷为主体） ==================== */
/** ReTable 远端分页：刷新按钮 loading + 表格实例（reload 用） */
const refreshing = ref(false);
const markingTable = ref();
/** 记录总数：ReTable 远端加载后经 v-model:total 回传，用于卡片头部「N 份」 */
const totalCount = ref(0);
/** taskId → 总分快照。AI 总分 = Σ AI 分；老师总分 = Σ (老师分 ?? AI 分)，与后端 totalScore 同口径（老师为主） */
const scores = ref<Record<string, { ai: number; final: number; finished: boolean }>>({});
/** list=记录列表（默认首屏），detail=单份试卷详情 */
const view = ref<'list' | 'detail'>('list');
const selectedTaskId = ref('');
/** 结构刷新令牌：任务判完/改分后递增，让 SheetStructureView 重挂载拿最新结构与图片 */
const structureKey = ref(0);

const modeLabel = (row?: TeacherMarkingTask | null) =>
  row?.markingTaskMode === 'ANY' ? '任意卷' : '自有卷';
const taskStatusLabel = (n?: number) =>
  ({ 0: '排队中', 1: '处理中', 2: '已完成', 3: '失败' })[Number(n ?? 0)] ?? '排队中';
const taskStatusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 2 ? 'success' : code === 3 ? 'danger' : code === 1 ? 'warning' : 'info';
};
/** 详情页头部的任务元数据：从记录行「查看」时带入；任务号直达无行，置 null（详情有 selectedScores 兜底） */
const selectedRow = ref<TeacherMarkingTask | null>(null);
const selectedScores = computed(() => scores.value[selectedTaskId.value] || null);

const scoreOfResult = (res: MarkingResultVO | null | undefined) => {
  let ai = 0;
  let final = 0;
  for (const r of res?.results ?? []) {
    ai += Number(r.score ?? 0);
    final += Number(r.teacherScore ?? r.score ?? 0);
  }
  return { ai, final, finished: !!res?.finished };
};

/** 拉取单任务结果并回填总分快照；返回结果供调用方判断终态 */
const fillScore = async (id: string): Promise<MarkingResultVO | null> => {
  if (!id) return null;
  try {
    const res = await eduaiApi.getMarkingResult(id);
    scores.value = { ...scores.value, [id]: scoreOfResult(res) };
    return res;
  } catch {
    return null;
  }
};

/** 取一页阅卷任务；对当页已完成任务后台补齐总分快照（与旧 loadTasks 同口径，不阻塞首屏） */
const fetchMarkingPage = async (page: number, pageSize: number) => {
  const res = await eduaiApi.pageTeacherMarkingTasks({ pageNum: page, pageSize });
  const rows = (res?.data ?? res?.records ?? []) as TeacherMarkingTask[];
  void Promise.all(
    rows
      .filter((t) => Number(t.markingTaskStatus) === 2 && t.markingTaskTaskId && !scores.value[t.markingTaskTaskId])
      .map((t) => fillScore(t.markingTaskTaskId)),
  );
  return res;
};
/** ReTable 远端分页 loader（createPageLoader 负责合并重复请求、映射 total/data） */
const markingTasksLoader = createPageLoader<TeacherMarkingTask>(fetchMarkingPage);
/** 刷新记录列表：触发表格 reload，并驱动刷新按钮 loading */
const reloadList = async () => {
  refreshing.value = true;
  try {
    await markingTable.value?.reload();
  } finally {
    refreshing.value = false;
  }
};

/**
 * 打开一份试卷的详情（记录行「查看」或任务号直达）。
 * 进入即重挂载结构视图拿最新数据；未判完的任务顺带挂上 SSE 实时进度。
 */
const openDetail = async (id?: string, row?: TeacherMarkingTask) => {
  const target = (id ?? '').trim() || taskId.value.trim();
  if (!target) {
    message.warning('请输入任务号，或从阅卷记录里选择一份试卷');
    return;
  }
  taskId.value = target;
  selectedTaskId.value = target;
  selectedRow.value = row ?? null;
  view.value = 'detail';
  structureKey.value += 1;
  const res = await fillScore(target);
  if (res && !res.finished) {
    if (progressTaskId !== target) startProgressStream(target);
  } else if (res?.finished && progress.value?.taskId === target) {
    progress.value = null;
  }
};

const backToList = () => {
  view.value = 'list';
  void reloadList();
};

/** 老师分保存成功：刷新该卷总分与记录列表（详情视图由 SheetStructureView 自身重载） */
const onSaved = () => {
  void fillScore(selectedTaskId.value);
  void reloadList();
};

/* ==================== 考试 / 作答（提交答题卡弹窗） ==================== */
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
      message.warning('该考试未关联试卷，无法提交答题卡');
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

let pollHandle: any = null;
/** 当前轮询对应的 taskId：切换任务时必须先停掉上一个任务的轮询 */
let pollTaskId = '';

/** 实时进度（SSE）：上传后立即可见，不必等整单判完 */
const progress = ref<MarkingProgressVO | null>(null);
/** SSE 连接状态，界面显示「实时中 / 重连中」 */
const streamState = ref<'idle' | 'connecting' | 'open' | 'error'>('idle');
/** 进度流句柄（切任务 / 离开页面必须关，否则旧流会把新任务的进度写回来） */
let progressClient: { close: () => void } | null = null;
let progressTaskId = '';

/** 进度状态标签：处理中 / 已完成 / 失败 */
const progressTagType = computed<'primary' | 'success' | 'danger'>(() => {
  const s = progress.value?.taskStatus;
  if (s === 3) return 'danger';
  if (s === 2) return 'success';
  return 'primary';
});
const progressTagText = computed(() => {
  const s = progress.value?.taskStatus;
  if (s === 3) return '失败';
  if (s === 2) return '已完成';
  if (s === 1) return '处理中';
  return '排队中';
});
/** 流状态标签：实时中 / 连接中 / 重连中（SSE 不可用时提示已降级轮询） */
const streamTagType = computed<'success' | 'info' | 'warning'>(() => {
  if (streamState.value === 'open') return 'success';
  if (streamState.value === 'error') return 'warning';
  return 'info';
});
const streamTagText = computed(() => {
  if (streamState.value === 'open') return '实时推送中';
  if (streamState.value === 'connecting') return '连接中';
  if (streamState.value === 'error') return '实时不可用，已降级轮询';
  return '已断开';
});

/** 停掉进度流（切任务、离开页面、任务终态时都要走这里） */
const stopProgressStream = () => {
  progressClient?.close();
  progressClient = null;
  progressTaskId = '';
  streamState.value = 'idle';
};

/** 任务到终态的统一收尾：刷新总分、重挂结构视图、刷新记录列表 */
const onTaskFinished = (id: string) => {
  void fillScore(id);
  structureKey.value += 1;
  void reloadList();
};

/** 轮询兜底：SSE 连不上时才启用（原路径保留，代理掐流后页面不会停在半途） */
const startPolling = (id: string) => {
  if (pollHandle || !id) return;
  pollTaskId = id;
  pollHandle = setInterval(async () => {
    if (id !== taskId.value.trim()) {
      stopPolling();
      return;
    }
    try {
      const rr = await eduaiApi.getMarkingResult(id);
      if (id !== taskId.value.trim()) return;
      scores.value = { ...scores.value, [id]: scoreOfResult(rr) };
      if (rr?.finished) {
        stopPolling();
        onTaskFinished(id);
      }
    } catch {
      // 静默
    }
  }, 2000);
};

/** 收到一帧进度：刷新进度条；终态则收流并收尾 */
const applyProgress = async (p: MarkingProgressVO) => {
  if (p.taskId && p.taskId !== taskId.value.trim()) return; // 旧任务的尾帧，丢弃
  progress.value = p;
  if (p.finished) {
    stopProgressStream();
    onTaskFinished(p.taskId || taskId.value.trim());
  }
};

/** 建立进度流：上传拿到 taskId 后立刻连，逐帧刷新 */
const startProgressStream = (id: string) => {
  stopProgressStream();
  progressTaskId = id;
  streamState.value = 'connecting';
  progressClient = http()
    .get(eduaiApi.markingProgressStreamUrl(id))
    .sse<MarkingProgressVO>({
      onOpen: () => {
        streamState.value = 'open';
      },
      onMessage: (ev) => {
        streamState.value = 'open';
        const p = ev.data as MarkingProgressVO | null;
        if (p && typeof p === 'object') {
          void applyProgress(p);
        }
      },
      onError: () => {
        // SSE 不可用（网络 / 代理掐流）：退回 2s 轮询，教师仍能看到结果
        streamState.value = 'error';
        progressClient = null;
        progressTaskId = '';
        startPolling(id);
      },
      onClose: () => {
        if (streamState.value !== 'error') streamState.value = 'idle';
      },
      maxReconnectAttempts: 3,
      reconnectInterval: 2000,
    });
};

/** 停掉轮询（切任务、离开页面、任务已完成时都要走这里） */
const stopPolling = () => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
  pollTaskId = '';
};

/* ==================== 扫描阅卷 ==================== */
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

/** 试卷下拉/记录列表展示共用：分值与试卷名都按试卷回数据库取 */
const loadPapers = async () => {
  try {
    const page = await eduaiApi.pagePapers({ pageNum: 1, pageSize: 100 });
    // PageResult 的主数组字段是 data（records 为兼容保留），二者取其一
    const rows = page?.data ?? page?.records ?? [];
    paperOptions.value = rows.map((p) => ({ paperId: p.paperId, paperName: p.paperName }));
  } catch {
    paperOptions.value = [];
  }
};

/** 记录列表里的试卷名：SELF 卷按 paperId 反查，ANY 卷标「任意卷」，未关联标 — */
const paperNameOf = (row?: TeacherMarkingTask | null) => {
  if (!row) return '—';
  if (row.markingTaskPaperId) {
    const hit = paperOptions.value.find((p) => p.paperId === row.markingTaskPaperId);
    return hit?.paperName ?? `试卷#${row.markingTaskPaperId}`;
  }
  return row.markingTaskMode === 'ANY' ? '任意卷' : '—';
};
const scoreOf = (row?: TeacherMarkingTask | null) =>
  row?.markingTaskTaskId ? scores.value[row.markingTaskTaskId] || null : null;

const openScan = async () => {
  scanForm.mode = 'SELF';
  scanForm.paperId = undefined;
  scanForm.studentId = '';
  scanForm.maxScore = 5;
  scanForm.files = [];
  scanDialogVisible.value = true;
  // 自有卷需要选择试卷：分值与标准答案都按试卷题号回数据库取
  await loadPapers();
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
    message.warning('请先选择试卷图片');
    return;
  }
  if (scanForm.mode === 'SELF' && !scanForm.paperId) {
    message.warning('自有卷必须选择试卷（用于按题号取准确分值）');
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
    message.success('已提交，正在识别与判分…');
    scanDialogVisible.value = false;
    // SSE 实时进度：建连后逐帧刷新阶段与百分比，终态自动收流并收尾；
    // 连不上时 startProgressStream 的 onError 会降级到 2s 轮询
    progress.value = null;
    stopPolling();
    startProgressStream(newTaskId);
    await reloadList();
    // 上传后直接进这份试卷的详情：记录列表已含该行，判完即见原卷与分数
    await openDetail(newTaskId);
  } catch (e) {
    failToast('扫描阅卷失败', e);
  } finally {
    scanning.value = false;
  }
};

/* ==================== 提交答题卡 ==================== */
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
    message.warning('请填写学生 ID 与至少一条作答');
    return;
  }
  // 题号必须来自所选考试的试卷：后端 validateExamPaper 会拒绝卷外题号，
  // 这里提前拦下并给出可读提示，而不是甩一个 400。
  const examId = submitForm.examId;
  if (!examId) {
    message.warning('请选择考试');
    return;
  }
  const validIds = new Set(questionOptions.value.map((q) => q.id));
  const picked = submitForm.answers.filter((a) => a.questionId != null && validIds.has(a.questionId));
  if (questionOptions.value.length === 0 || picked.length !== submitForm.answers.length) {
    message.warning('作答里有不在该考试试卷上的题号，请重新选择');
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
      message.warning('答题内容必须是合法 JSON（例如 {"1":"北京"}），请检查后重试');
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
    message.success(`提交成功，taskId: ${newTaskId}`);
    submitDialogVisible.value = false;
    await openDetail(newTaskId);
  } catch (e) {
    failToast('提交失败', e);
  } finally {
    submitting.value = false;
  }
};

/**
 * 进入页面先落「阅卷记录」列表（试卷为主体，一行一份卷）。
 * 记录本身即数据，不再出现空表；试卷名下拉同步加载供记录展示。
 */
onMounted(() => {
  // 记录列表由 ReTable 的 :load 远端 loader 首屏自动加载，无需在此手动拉取
  void loadPapers();
});
onUnmounted(() => {
  stopPolling();
  stopProgressStream();
});
</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
.answer-row { display: flex; align-items: center; }
.tip-text { font-size: 12px; color: var(--el-color-warning); line-height: 1.6; }
.progress-task-id { font-size: 12px; color: var(--el-text-color-secondary); font-family: monospace; }
.task-id-cell { font-family: monospace; font-size: 12px; }
.stage-text { font-size: 12px; color: var(--el-text-color-secondary); margin-left: 6px; }
.final-score { color: var(--el-color-primary); font-size: 15px; }
/* 记录卡片：撑满剩余高度，表格内部滚动 */
.records-card { min-height: 240px; display: flex; flex-direction: column; }
.records-card :deep(.el-card__body) { flex: 1; min-height: 0; display: flex; flex-direction: column; }
/* 详情卡片：结构视图按视口留足高度，整页可滚动兜底 */
.detail-card { display: flex; flex-direction: column; }
.detail-card :deep(.el-card__body) { display: flex; flex-direction: column; }
.detail-body { height: calc(100vh - 300px); min-height: 440px; }
.detail-id { font-family: monospace; font-size: 12px; color: var(--el-text-color-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-meta { font-size: 13px; color: var(--el-text-color-regular); }
</style>
