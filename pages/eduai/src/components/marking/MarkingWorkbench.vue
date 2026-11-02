<script setup lang="ts">
/**
 * MarkingWorkbench —— 阅卷工作台（管理端 / 老师端共用）
 *
 * <p>此前「阅卷」在管理端（MarkingView）与老师端（TeacherPortalView 阅卷 tab）
 * 各写了一套布局：工具栏、记录列表、详情的排布与容器高度不一致，
 * 老师端还把结果面板塞进固定 560px 的盒子里，出现溢出/裁切等样式问题。
 * 本组件把整套阅卷流程收敛为一处，两端按 {@link mode} 复用同一套 UI 与样式。</p>
 *
 * <p>组成：工具栏（按端裁剪按钮）→ 实时进度（SSE）→ 阅卷记录列表（MarkingTaskTable
 * + 分页）或单份试卷详情（MarkingResultPanel）；提交答题卡 / 上传答卷 / 分数分布
 * 三个弹窗。数据按登录态在后端隔离，本组件不传、也传不了别人的 ID。</p>
 */
import { message } from '@repo/core';
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Reading } from '@element-plus/icons-vue';
import { http } from '@repo/utils';
import { eduaiApi } from '../../api/eduaiApi';
import { failToast } from '../../api/errorText';
import { createPageLoader } from '../../api/pageLoader';
import type {
  EduStudent,
  MarkingProgressVO,
  MarkingResultVO,
  PageResult,
  Paper,
  TeacherMarkingTask,
} from '../../api/types';
import ReButton from '@repo/ui/re-button';
import ReDialog from '@repo/ui/re-dialog';
import ReTag from '@repo/ui/re-tag';
import ReEcharts from '@repo/ui/re-echarts';
import MarkingTaskTable from './MarkingTaskTable.vue';
import MarkingUploadDialog from './MarkingUploadDialog.vue';
import PaperPreview from '../paper/PaperPreview.vue';

const props = withDefaults(
  defineProps<{
    /** 端：admin=管理端（含提交答题卡 / 任务号直达），teacher=老师端（仅上传答卷/记录/详情/分布） */
    mode?: 'admin' | 'teacher';
    /** 学生候选（老师端上传答卷时可从班级学生里选；管理端为空） */
    students?: EduStudent[];
  }>(),
  { mode: 'admin', students: () => [] },
);
const isAdmin = computed(() => props.mode === 'admin');
const router = useRouter();

/* ==================== 视图与列表 ==================== */
const taskId = ref('');
/** 记录列表（工作台现在只有列表一态，详情走独立路由 /edu/marking/detail） */
const tasks = ref<TeacherMarkingTask[]>([]);
const totalCount = ref(0);
const paperOptions = ref<Paper[]>([]);
const scores = ref<Record<string, { ai: number; final: number; finished: boolean }>>({});

/** 记录列表 / 分布图里的试卷名：SELF 卷按 paperId 反查，ANY 卷标「任意卷」，未关联标 — */
const paperNameOf = (row?: TeacherMarkingTask | null) => {
  if (!row) return '—';
  if (row.markingTaskPaperId) {
    const hit = paperOptions.value.find((p) => p.paperId === row.markingTaskPaperId);
    return hit?.paperName ?? `试卷#${row.markingTaskPaperId}`;
  }
  return row.markingTaskMode === 'ANY' ? '任意卷' : '—';
};

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

/** 分页端点是否可用：旧后端没有 /teacher/marking/tasks/page，探测一次后回落列表端点 */
let markingTasksPagedSupported = true;

/**
 * 取一页阅卷任务（ReTable 远端 loader 签名）。
 *
 * <p>对当页已完成任务后台补齐总分快照：后端不冗余存总分，列表里的
 * AI 分 / 老师分要按任务号查一次结果（不阻塞首屏）。</p>
 */
const fetchMarkingPage = async (pageNo: number, pageSizeNo: number): Promise<PageResult<TeacherMarkingTask>> => {
  let rows: TeacherMarkingTask[] = [];
  let total = 0;
  if (markingTasksPagedSupported) {
    try {
      const res = await eduaiApi.pageTeacherMarkingTasks({
        pageNum: pageNo,
        pageSize: pageSizeNo,
        teacherFinished: finishFilter.value,
      });
      rows = (res.data ?? res.records ?? []) as TeacherMarkingTask[];
      total = Number(res.total ?? rows.length);
    } catch {
      // 线上后端可能还没有分页端点（返回 404）：探测失败后回落到更早的列表端点做客户端分页
      markingTasksPagedSupported = false;
    }
  }
  if (!markingTasksPagedSupported) {
    const all = (await eduaiApi.teacherMarkingTasks(100)) as TeacherMarkingTask[];
    total = all.length;
    const start = (pageNo - 1) * pageSizeNo;
    rows = all.slice(start, start + pageSizeNo);
  }
  void Promise.all(
    rows
      .filter((t) => Number(t.markingTaskStatus) === 2 && t.markingTaskTaskId && !scores.value[t.markingTaskTaskId])
      .map((t) => fillScore(t.markingTaskTaskId)),
  );
  tasks.value = rows;
  return { pageNo, pageSize: pageSizeNo, total, totalPages: Math.max(1, Math.ceil(total / pageSizeNo)), data: rows };
};

/** ReTable 远端分页 loader（createPageLoader 负责合并重复请求、映射 total/data） */
const markingTasksLoader = createPageLoader<TeacherMarkingTask>(fetchMarkingPage);

/** 阅卷列表「完成状态」筛选（0=待完成, 1=已完成） */
const finishFilter = ref<0 | 1 | undefined>(undefined);

/** 切换完成状态筛选后刷新列表 */
const onFinishFilterChange = () => {
  void markingTaskTableRef.value?.reload();
};

/** MarkingTaskTable 实例：任务终态 / 新任务提交后主动刷新，ReTable 自己管分页和刷新按钮 */
const markingTaskTableRef = ref<{ reload: () => Promise<void> } | null>(null);

/* ==================== 批量操作 ==================== */
const selectedTasks = ref<TeacherMarkingTask[]>([]);
const batchFinishing = ref(false);
const batchUndoing = ref(false);

/** ReTable 多选变化 */
const onSelectionChange = (rows: TeacherMarkingTask[]) => {
  selectedTasks.value = rows ?? [];
};

/** 批量完成：只处理未完成的、已判分且有学生的任务 */
const batchFinish = async () => {
  const ids = selectedTasks.value
    .filter((t) => !t.markingTaskTeacherFinished)
    .map((t) => t.markingTaskTaskId)
    .filter(Boolean) as string[];
  if (!ids.length) {
    message.warning('请先勾选未完成的阅卷任务');
    return;
  }
  batchFinishing.value = true;
  try {
    const results = await eduaiApi.batchFinishMarking(ids);
    const ok = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    message.success(`批量完成 ${ok} 个任务${fail ? `，${fail} 个失败` : ''}`);
    selectedTasks.value = [];
    void markingTaskTableRef.value?.reload();
  } catch (e) {
    failToast('批量完成失败', e);
  } finally {
    batchFinishing.value = false;
  }
};

/** 批量撤销：只处理已完成的 */
const batchUnfinish = async () => {
  const ids = selectedTasks.value
    .filter((t) => t.markingTaskTeacherFinished)
    .map((t) => t.markingTaskTaskId)
    .filter(Boolean) as string[];
  if (!ids.length) {
    message.warning('请先勾选已完成的阅卷任务');
    return;
  }
  batchUndoing.value = true;
  try {
    const results = await eduaiApi.batchUnfinishMarking(ids);
    const ok = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    message.success(`批量撤销 ${ok} 个任务${fail ? `，${fail} 个失败` : ''}`);
    selectedTasks.value = [];
    void markingTaskTableRef.value?.reload();
  } catch (e) {
    failToast('批量撤销失败', e);
  } finally {
    batchUndoing.value = false;
  }
};

/** 导出成绩单 CSV：当前页已加载的任务 + 总分快照（缺失的按任务补齐一次结果） */
const exportingScore = ref(false);
const exportScoreCsv = async () => {
  const rows = tasks.value ?? [];
  if (!rows.length) {
    message.warning('当前没有可导出的阅卷记录');
    return;
  }
  exportingScore.value = true;
  try {
    const missing = rows.filter((t) => t.markingTaskTaskId && !scores.value[t.markingTaskTaskId]);
    if (missing.length) {
      await Promise.all(missing.map((t) => fillScore(t.markingTaskTaskId)));
    }
    const header = ['任务号', '学生', '试卷', '类型', '任务状态', '完成状态', 'AI 总分', '老师总分'];
    const lines = rows.map((t) => {
      const s = scores.value[t.markingTaskTaskId] ?? { ai: 0, final: 0, finished: false };
      const statusText =
        t.markingTaskStatus === 2 ? '已完成' : t.markingTaskStatus === 3 ? '失败' : t.markingTaskStatus === 1 ? '处理中' : '排队中';
      return [
        t.markingTaskTaskId || '',
        t.markingTaskStudentId || '',
        paperNameOf(t),
        t.markingTaskMode || '',
        statusText,
        t.markingTaskTeacherFinished ? '已登记错题' : '待登记',
        s.ai,
        s.final,
      ];
    });
    const csv =
      '\uFEFF' +
      [header, ...lines]
        .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `阅卷成绩单-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    message.success(`已导出 ${rows.length} 条阅卷成绩`);
  } catch (e) {
    failToast('导出成绩单失败', e);
  } finally {
    exportingScore.value = false;
  }
};

/** 试卷下拉/记录列表展示共用：分值与试卷名都按试卷回数据库取 */
const loadPapers = async () => {
  try {
    const res = await eduaiApi.pagePapers({ pageNum: 1, pageSize: 100 });
    paperOptions.value = (res?.data ?? res?.records ?? []) as Paper[];
  } catch {
    paperOptions.value = [];
  }
};

/**
 * 打开一份试卷的详情（记录行「查看」或任务号直达）。
 * 进入即重挂载结构视图拿最新数据；未判完的任务顺带挂上 SSE 实时进度。
 */
/**
 * 记录行「查看」：跳转独立详情页 /edu/marking/detail?taskId=...
 *
 * <p>详情不再是工作台内的一个视图状态，而是标签栏里的独立一页：
 * 记录列表与检索状态都留在上一页，老师端/管理端看到的版式也统一。
 * 详情页自身负责取结果与结构，本页只负责把用户送到那里。</p>
 */
const onView = (row: TeacherMarkingTask) => {
  const target = (row.markingTaskTaskId ?? '').trim();
  if (!target) {
    message.warning('该任务没有任务号，无法查看详情');
    return;
  }
  openDetailWindow(target);
};

/** 内置卷（自有卷）点击试卷名 → 直接打开试卷模板（组卷页，与试卷列表「组卷」同入口） */
const onOpenPaperTemplate = (row: TeacherMarkingTask) => {
  const paperId = row.markingTaskPaperId;
  if (paperId == null) {
    message.warning('该任务未关联内置试卷，无法打开卷面模板');
    return;
  }
  void router.push({
    path: '/eduai/paper-compose',
    query: { paperId: String(paperId) },
  });
};

/* ==================== 阅卷下载试卷 ==================== */
const downloadPaper = ref<Paper | null>(null);
const downloadPaperRef = ref<{
  exportA4Images?: (options?: {
    mode?: string;
    answers?: Record<string, string>;
    filename?: string;
    scale?: number;
  }) => Promise<void>;
} | null>(null);
const downloadingPaper = ref(false);

/** 下载试卷对应的卷头，与 PaperView 详情保持一致 */
const downloadPaperHeader = computed(() => ({
  paperId: downloadPaper.value?.paperId ?? '',
  name: downloadPaper.value?.paperName ?? '',
  subject: downloadPaper.value?.paperSubject ?? '',
  gradeLevel: downloadPaper.value?.paperGradeLevel ?? '',
  grade: downloadPaper.value?.paperGrade ?? '',
  pageSize: downloadPaper.value?.paperPageSize ?? 'A4',
  pageOrientation: downloadPaper.value?.paperPageOrientation ?? 'PORTRAIT',
  titleStyle: downloadPaper.value?.paperTitleStyle ?? 'classic',
  header: downloadPaper.value?.paperHeader ?? '',
  footer: downloadPaper.value?.paperFooter ?? '',
}));

/** 下载试卷对应的题目，按 order 升序，与 PaperView 详情保持一致 */
const downloadPaperQuestions = computed(() =>
  [...(downloadPaper.value?.questions ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((q) => ({
      questionId: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options,
      score: q.score,
      paperQuestionNo: q.questionNo,
      answer: q.answer,
      analysis: q.analysis,
    })),
);

/** 阅卷记录行「下载试卷」：拉试卷详情 → 隐藏 PaperPreview 渲染 → 导出 A4 PNG 到本地 */
const onDownloadPaper = async (row: TeacherMarkingTask) => {
  const paperId = row.markingTaskPaperId;
  if (paperId == null) {
    message.warning('该任务未关联内置试卷，无法下载试卷');
    return;
  }
  if (downloadingPaper.value) return;
  downloadingPaper.value = true;
  downloadPaper.value = null;
  try {
    const detail = await eduaiApi.getPaper(paperId);
    downloadPaper.value = detail;
    await nextTick();
    await downloadPaperRef.value?.exportA4Images?.({
      mode: 'paper',
      filename: detail.paperName || `试卷${paperId}`,
    });
    message.success(`已下载试卷 ${detail.paperName || paperId}`);
  } catch (e) {
    failToast('下载试卷失败', e);
  } finally {
    downloadPaper.value = null;
    downloadingPaper.value = false;
  }
};

/** 「任务号直达 → 查询」：同样开独立窗口看这份试卷 */
const onQuery = () => {
  const target = taskId.value.trim();
  if (!target) {
    message.warning('请输入任务号，或从阅卷记录里选择一份试卷');
    return;
  }
  openDetailWindow(target);
};

/**
 * 打开「阅卷详情」站内标签页（专注看一份试卷）。
 *
 * <p>为什么不再用 {@code window.open}：新开浏览器标签要重新 bootstrap 整个 SPA，
 * 实测经网关要 4.3s，比详情数据本身（2.9s）还慢。改成站内标签页后，
 * 应用已经跑起来了，只剩数据请求，首屏从 ~7s 降到 1s 级。</p>
 *
 * <p>标签按 path 去重，换卷子只改 query —— 连点十份卷子也只有一个「阅卷详情」标签，
 * 组件内部 watch taskId 重新加载，不会堆一屏标签。</p>
 */
const openDetailWindow = (taskId: string) => {
  void router.push({ path: '/edu/marking/detail', query: { taskId } });
};

/* ==================== 实时进度（SSE） ==================== */
const progress = ref<MarkingProgressVO | null>(null);
const streamState = ref<'idle' | 'connecting' | 'open' | 'error'>('idle');
let progressClient: { close: () => void } | null = null;
let progressTaskId = '';
let pollHandle: any = null;

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

const stopProgressStream = () => {
  progressClient?.close();
  progressClient = null;
  progressTaskId = '';
  streamState.value = 'idle';
};

const stopPolling = () => {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
};

/** 任务到终态的统一收尾：刷新总分快照与记录列表 */
const onTaskFinished = (id: string) => {
  void fillScore(id);
  void markingTaskTableRef.value?.reload();
};

/** 轮询兜底：SSE 连不上时才启用 */
const startPolling = (id: string) => {
  if (pollHandle || !id) return;
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

const applyProgress = async (p: MarkingProgressVO) => {
  if (p.taskId && p.taskId !== taskId.value.trim()) return; // 旧任务的尾帧，丢弃
  progress.value = p;
  if (p.finished) {
    stopProgressStream();
    onTaskFinished(p.taskId || taskId.value.trim());
  }
};

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
        if (p && typeof p === 'object') void applyProgress(p);
      },
      onError: () => {
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

/* ==================== 扫描阅卷 / 上传答卷 ==================== */
const scanDialogVisible = ref(false);
const scanning = ref(false);

const openScan = async () => {
  scanDialogVisible.value = true;
  await loadPapers();
};

/**
 * 上传弹窗（共享组件）回调：组装 FormData 提交扫描任务。
 * 随后连 SSE 实时进度（连不上时 onError 降级 2s 轮询），并直接进入这份试卷的详情。
 */
const onScanStart = async (payload: {
  mode: 'SELF' | 'ANY';
  paperId: number | null;
  studentId: string;
  maxScore: number;
  files: File[];
}) => {
  scanning.value = true;
  try {
    const form = new FormData();
    payload.files.forEach((f) => form.append('file', f));
    form.append('mode', payload.mode);
    if (payload.paperId != null) {
      form.append('paperId', String(payload.paperId));
    } else {
      form.append('maxScore', String(payload.maxScore));
    }
    if (payload.studentId) {
      form.append('studentId', payload.studentId);
    }
    const newTaskId = await eduaiApi.scanMarking(form);
    message.success('已提交，正在识别与判分…');
    scanDialogVisible.value = false;
    progress.value = null;
    stopPolling();
    startProgressStream(newTaskId);
    await markingTaskTableRef.value?.reload();
    // 上传后直接开这份试卷的详情窗口（独立窗口，不打断记录列表）
    openDetailWindow(newTaskId);
  } catch (e) {
    failToast('扫描阅卷失败', e);
  } finally {
    scanning.value = false;
  }
};

/* ==================== 分数分布 ==================== */
const distDialogVisible = ref(false);
const distLoading = ref(false);
const distRateOption = ref<Record<string, any> | null>(null);
const distScoreOption = ref<Record<string, any> | null>(null);
const distExcluded = ref(0);

/** 打开分数分布弹窗：按「老师总分 / 卷面满分」算得分率直方图 + 各卷总分对比 */
const openDistribution = async () => {
  distDialogVisible.value = true;
  distLoading.value = true;
  distRateOption.value = null;
  distScoreOption.value = null;
  let excluded = 0;
  try {
    const all = (await eduaiApi.teacherMarkingTasks(100)) as TeacherMarkingTask[];
    const finished = all.filter((t) => Number(t.markingTaskStatus) === 2 && t.markingTaskTaskId);
    const buckets = [0, 0, 0, 0, 0];
    const barNames: string[] = [];
    const barScores: number[] = [];
    for (let i = 0; i < finished.length; i += 8) {
      const chunk = finished.slice(i, i + 8);
      const results = await Promise.all(
        chunk.map((t) => eduaiApi.getMarkingResult(t.markingTaskTaskId).catch(() => null)),
      );
      results.forEach((res, j) => {
        if (!res?.results?.length) return;
        let final = 0;
        let max = 0;
        for (const r of res.results) {
          final += Number(r.teacherScore ?? r.score ?? 0);
          max += Number(r.maxScore ?? 0);
        }
        const isDirty = max > 1000 || final > 1000 || (max > 0 && final > max);
        if (isDirty) {
          excluded += 1;
          return;
        }
        const label = `${paperNameOf(chunk[j])}${chunk[j].markingTaskStudentId ? `·${chunk[j].markingTaskStudentId}` : ''}`;
        barNames.push(label);
        barScores.push(final);
        if (max > 0) {
          const rate = Math.min(0.999, Math.max(0, final / max));
          buckets[Math.floor(rate * 5)] += 1;
        }
      });
    }
    distExcluded.value = excluded;
    if (barScores.length === 0) return;
    distRateOption.value = {
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 16, top: 32, bottom: 28 },
      xAxis: { type: 'category', data: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: '份数', type: 'bar', barWidth: '46%', data: buckets,
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top' },
      }],
    };
    distScoreOption.value = {
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 16, top: 32, bottom: 70 },
      xAxis: { type: 'category', data: barNames, axisLabel: { rotate: 30, overflow: 'truncate' } },
      yAxis: { type: 'value' },
      series: [{
        name: '老师总分', type: 'bar', data: barScores,
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        label: { show: barScores.length <= 20, position: 'top' },
      }],
    };
  } catch (e) {
    failToast('加载分数分布失败', e);
    distDialogVisible.value = false;
  } finally {
    distLoading.value = false;
  }
};

/* ==================== 提交答题卡（管理端） ==================== */
const submitDialogVisible = ref(false);
const submitting = ref(false);
const submitForm = reactive<{
  examId: number | null;
  studentId: string;
  content: string;
  answers: Array<{ questionId: number | null; answer: string }>;
}>({ examId: null, studentId: '', content: '', answers: [] });
const examOptions = ref<Array<{ examId: number; examName: string; examPaperId?: number }>>([]);
const questionOptions = ref<Array<{ id: number; questionNo?: string; stem: string }>>([]);

const examLabel = (e: { examId: number; examName: string }) => `${e.examName}（#${e.examId}）`;
const questionLabel = (q: { id: number; questionNo?: string; stem: string }) =>
  `${q.questionNo || q.id}　${(q.stem || '').replace(/\s+/g, '').slice(0, 14)}`;

const loadExams = async () => {
  try {
    const res = await eduaiApi.pageExams({ page: 1, pageSize: 200 });
    const rows = res?.data ?? res?.records ?? [];
    examOptions.value = rows.map((e) => ({ examId: e.examId, examName: e.examName, examPaperId: e.examPaperId }));
  } catch {
    examOptions.value = [];
  }
};

/** 切换考试后重载该卷题号并把作答里的题号收敛到新卷上（卷外题号后端会 400） */
const onSubmitExamChange = async (examId: number | null) => {
  questionOptions.value = [];
  if (!examId) return;
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
  // 答题内容是可选 JSON：留空不下发空串（库上有 JSON 约束），填了必须是合法 JSON
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
    const newTaskId = await eduaiApi.submitMarking({ examId, studentId, content: content || undefined, answers });
    message.success(`提交成功，taskId: ${newTaskId}`);
    submitDialogVisible.value = false;
    openDetailWindow(newTaskId);
  } catch (e) {
    failToast('提交失败', e);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  void loadPapers();
});
onUnmounted(() => {
  stopPolling();
  stopProgressStream();
});
</script>

<template>
  <div class="marking-workbench" :class="`marking-workbench--${mode}`">
    <el-card shadow="never" class="mw-toolbar">
      <div class="mw-row">
        <ReButton v-if="isAdmin" type="primary" icon="Promotion" @click="openSubmit">提交答题卡</ReButton>
        <ReButton type="success" icon="Camera" @click="openScan">
          {{ isAdmin ? '扫描阅卷' : '上传答卷阅卷' }}
        </ReButton>
        <ReButton icon="TrendCharts" @click="openDistribution">分数分布</ReButton>
        <template v-if="isAdmin">
          <el-input v-model="taskId" placeholder="任务号直达（可选）" clearable style="width: 260px" />
          <ReButton icon="Search" @click="onQuery">查询</ReButton>
        </template>
        <span v-if="!isAdmin" class="mw-hint">
          支持拖拽图片或点击选择；自有卷按题号取分，任意卷手动给总分；学生可留空匿名阅卷
        </span>
      </div>
    </el-card>

    <!-- 实时进度（SSE）：上传后立即显示识别/解析/判分推进，终态自动收起 -->
    <el-card v-if="progress" shadow="never" class="mt-3 mw-progress">
      <div class="mw-row">
        <ReTag :type="progressTagType" effect="dark">{{ progressTagText }}</ReTag>
        <span class="mw-strong">{{ progress.stage || '处理中' }}</span>
        <ReTag v-if="progress.total" type="info" size="small">
          {{ progress.doneCount ?? 0 }} / {{ progress.total }} 题
        </ReTag>
        <ReTag :type="streamTagType" size="small" effect="plain">{{ streamTagText }}</ReTag>
        <span class="mw-task-id">taskId: {{ progress.taskId }}</span>
      </div>
      <el-progress
        class="mt-2"
        :percentage="progress.percent ?? 0"
        :indeterminate="progress.percent == null && !progress.finished"
        :status="progress.taskStatus === 3 ? 'exception' : progress.finished ? 'success' : ''"
        :stroke-width="10"
      />
      <el-alert v-if="progress.error" class="mt-2" type="error" :closable="false" show-icon :title="progress.error" />
      <div v-if="progress.finished" class="mw-row mw-row--end mt-2">
        <ReButton size="small" @click="progress = null">收起</ReButton>
      </div>
    </el-card>

    <!-- 阅卷记录：一行 = 一份试卷（试卷为主体，不是题目）。
         详情走独立路由 /edu/marking/detail（标签栏新开一页），此处不再内嵌详情 -->
    <el-card shadow="never" class="mt-3 mw-records">
      <template #header>
        <div class="mw-row">
          <el-icon><Reading /></el-icon>
          <span class="mw-strong">AI 阅卷记录（试卷）</span>
          <ReTag type="info">{{ totalCount }} 份</ReTag>
          <ReTag type="success" effect="plain">老师总分为最终成绩</ReTag>
          <span class="mw-spacer" />
          <el-select
            v-model="finishFilter"
            size="small"
            style="width: 120px"
            @change="onFinishFilterChange"
          >
            <el-option :value="undefined" label="全部" />
            <el-option :value="0" label="待完成" />
            <el-option :value="1" label="已完成" />
          </el-select>
        </div>
      </template>
      <div class="mw-batch-bar">
        <span v-if="selectedTasks.length" class="mw-batch-count">已选 {{ selectedTasks.length }} 个任务</span>
        <el-button size="small" type="success" :disabled="batchFinishing" :loading="batchFinishing" @click="batchFinish">
          批量完成
        </el-button>
        <el-button size="small" type="warning" :disabled="batchUndoing" :loading="batchUndoing" @click="batchUnfinish">
          批量撤销
        </el-button>
        <span class="mw-spacer" />
        <ReButton size="small" icon="Download" :loading="exportingScore" @click="exportScoreCsv">导出成绩单</ReButton>
      </div>
      <MarkingTaskTable
        ref="markingTaskTableRef"
        v-model:total="totalCount"
        :loader="markingTasksLoader"
        :tasks="tasks"
        :papers="paperOptions"
        :scores="scores"
        selectable
        @view="onView"
        @paper="onDownloadPaper"
        @paper-template="onOpenPaperTemplate"
        @selection-change="onSelectionChange"
      />
    </el-card>

    <!-- 下载试卷：隐藏 PaperPreview，按卷头/题目渲染后导出 A4 PNG 到本地（不占布局） -->
    <div
      v-if="downloadPaper"
      aria-hidden="true"
      class="mw-paper-download-stage"
    >
      <PaperPreview
        ref="downloadPaperRef"
        :header="downloadPaperHeader"
        :questions="downloadPaperQuestions"
        :fit-width="760"
      />
    </div>

    <!-- 提交答题卡对话框（管理端） -->
    <ReDialog v-if="isAdmin" v-model="submitDialogVisible" title="提交答题卡" width="640">
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
          <div v-if="examOptions.length === 0" class="mw-tip">未查到考试，请先在「考试管理」创建考试</div>
        </el-form-item>
        <el-form-item label="学生 ID" required>
          <el-input v-model="submitForm.studentId" />
        </el-form-item>
        <el-form-item label="答题内容">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="2"
            placeholder='可选，须为合法 JSON，如 {"1":"北京"}'
          />
        </el-form-item>
        <el-form-item label="作答列表">
          <el-button @click="addAnswer">新增一条</el-button>
          <div v-for="(a, idx) in submitForm.answers" :key="idx" class="mw-answer-row mt-2">
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

    <!-- 上传答卷阅卷：独立弹窗，支持拖拽与点击（阅卷系统共享组件） -->
    <MarkingUploadDialog
      v-model="scanDialogVisible"
      :papers="paperOptions"
      :students="students"
      :submitting="scanning"
      @start="onScanStart"
    />

    <!-- 分数分布：已完成任务的得分率区间 + 各卷总分对比 -->
    <ReDialog v-model="distDialogVisible" title="阅卷分数分布" width="880">
      <div v-loading="distLoading" class="mw-dist">
        <div v-if="distExcluded > 0" class="mw-dist__note">
          已排除 {{ distExcluded }} 份历史脏数据（满分/总分异常或总分超过满分），不参与统计。
        </div>
        <div class="mw-dist__block">
          <div class="mw-dist__title">得分率分布（老师分为准，满分取卷面题分合计）</div>
          <ReEcharts v-if="distRateOption" :option="distRateOption" style="height: 260px" />
          <el-empty v-else-if="!distLoading" description="暂无已完成任务" :image-size="60" />
        </div>
        <div v-if="distScoreOption" class="mw-dist__block">
          <div class="mw-dist__title">各卷总分对比（老师总分）</div>
          <ReEcharts :option="distScoreOption" style="height: 280px" />
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
/* 下载试卷的隐藏渲染层：放到视口外，避免空滚动条也避免被页面样式影响 */
.mw-paper-download-stage {
  position: fixed;
  left: -10000px;
  top: 0;
  width: 800px;
  pointer-events: none;
  opacity: 0;
}
/* 管理端铺满路由视口并内部滚动；老师端嵌在 tab 里时高度自适应内容 */
.marking-workbench {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.marking-workbench--admin {
  height: 100%;
}
.mw-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.mw-row--end {
  justify-content: flex-end;
}
.mw-strong {
  font-weight: 600;
}
.mw-toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
.mw-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mw-task-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}
/* 记录卡片：撑满剩余高度，表格内部滚动 */
.mw-records {
  min-height: 240px;
  display: flex;
  flex-direction: column;
}
.mw-records :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.mw-tip {
  font-size: 12px;
  color: var(--el-color-warning);
  line-height: 1.6;
}
.mw-answer-row {
  display: flex;
  align-items: center;
}
/* 分数分布弹窗 */
.mw-dist {
  min-height: 240px;
}
.mw-dist__block + .mw-dist__block {
  margin-top: 12px;
}
.mw-dist__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}
.mw-dist__note {
  font-size: 12px;
  color: var(--el-color-warning);
  margin-bottom: 8px;
}
/* 批量操作条 */
.mw-batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.mw-batch-count {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 600;
}
.mw-spacer {
  flex: 1;
}
</style>
