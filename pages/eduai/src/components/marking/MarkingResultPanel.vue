<script setup lang="ts">
/**
 * MarkingResultPanel —— 阅卷结果面板（汇总 + 试卷结构视图）
 *
 * 老师端「阅卷」页与管理端阅卷详情共用：
 * 顶部汇总（任务号 / 状态 / AI 总分 / 老师总分 + 「完成」），
 * 下方 SheetStructureView（原始试卷 / 版面解析一体，
 * 改分在版面解析里做）。
 */
import { computed, ref } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { message } from '@repo/core';
import ReTag from '@repo/ui/re-tag';
import ReDialog from '@repo/ui/re-dialog';
import ReConfirmDialog from '../shared/ReConfirmDialog.vue';
import SheetStructureView from './SheetStructureView.vue';
import { eduaiApi } from '../../api/eduaiApi';
import { failToast } from '../../api/errorText';
import type { MarkingFinishPreview, MarkingPreviewQuestion, MarkingResultVO } from '../../api/types';

const props = withDefaults(
  defineProps<{
    /** 任务号：来自路由 query，不等结果接口就能拿到，面板一挂载就能开始拉结构/卷面图 */
    taskId: string;
    /** 单份试卷的阅卷结果（null=还在读） */
    result: MarkingResultVO | null;
    /** 结构视图刷新令牌：任务判完 / 改分后递增，强制重挂载 */
    refreshKey?: number;
    /**
     * 父级已发出的结构请求（详情页与结果接口并发拉取）。
     *
     * <p>传的是 Promise 而不是结果：结构要 2~3s 才回来，用 Promise 能让结构视图
     * 一挂载就接上已经在飞的那次请求，既不用等父级、也不用再发一遍。
     * 为 null 时（工作台内嵌等）结构视图自己拉。</p>
     */
    structurePromise?: Promise<Record<string, any>> | null;
  }>(),
  { result: null, refreshKey: 0, structurePromise: null },
);

const emit = defineEmits<{
  /** 老师分保存成功：父级据此刷新总分与任务列表 */
  (e: "saved"): void;
  /** 阅卷完成（错题已归位）：父级据此刷新 */
  (e: "finished"): void;
}>();

/** AI 总分 / 老师总分：老师总分 = Σ(老师分 ?? AI 分)，老师分为最终成绩（与后端 totalScore 同口径） */
const totals = computed(() => {
  let ai = 0;
  let final = 0;
  for (const r of props.result?.results ?? []) {
    ai += Number(r.score ?? 0);
    final += Number(r.teacherScore ?? r.score ?? 0);
  }
  return { ai, final };
});

/** 统一确认弹窗（不用原生 ElMessageBox：会破坏老师端全屏布局层级） */
const confirmDialog = ref<InstanceType<typeof ReConfirmDialog> | null>(null);
/** 结构视图实例：完成前借它把待存的老师分提交掉 */
const sheetRef = ref<{ saveIfDirty?: () => Promise<boolean> } | null>(null);
/** 完成请求进行中 */
const finishing = ref(false);
/** 撤销请求进行中 */
const undoing = ref(false);
/** 完成预览弹窗可见 */
const previewVisible = ref(false);
/** 完成预览数据 */
const preview = ref<MarkingFinishPreview | null>(null);
/** 预览中被勾选保留（默认全选，剔除 = 取消勾选） */
const previewSelected = ref<Record<number, boolean>>({});
/** 老师是否已点过完成 */
const teacherFinished = computed(() => !!props.result?.teacherFinished);
/**
 * 判分失败（taskStatus=3）。
 *
 * <p>后端的 {@code finished} 对失败任务也返回 true（「判分结束」的口径），
 * 所以不能只看 finished，否则失败的卷子会显示成「已判分」，老师还能点「完成」。</p>
 */
const taskFailed = computed(() => Number(props.result?.taskStatus) === 3);
/** 本卷是否有逐题结果；失败任务的结果行是空的 */
const hasResults = computed(() => (props.result?.results?.length ?? 0) > 0);
/** 判分未结束/失败，或没有逐题结果时不允许完成 */
const canFinish = computed(() => !!props.result?.finished && hasResults.value && !taskFailed.value && !teacherFinished.value);
/** 汇总行状态文案：失败要如实说失败，不能混成「已判分」 */
const statusText = computed(() => {
  if (taskFailed.value) return '判分失败';
  return props.result?.finished ? '已判分' : '判分中';
});
/** 按钮禁用原因（悬停提示，避免老师以为界面坏了） */
const finishHint = computed(() => {
  if (taskFailed.value) return '本卷判分失败，没有可归入错题的结果';
  if (!hasResults.value) return '本卷还没有逐题结果，无法完成';
  if (!props.result?.finished) return '判分还没结束，请稍候';
  return '把本卷判为错的题按最终成绩归入该学生的错题库';
});

/**
 * 完成前先把老师改的分落库。
 *
 * <p>「完成」是页面上最显眼的按钮，老师改完分往往直接点它；
 * 此前这条路只调 finishMarking、不提交老师分，重开页面分数就回到 AI 分。</p>
 *
 * @returns 是否已确保老师分已保存（false 时中止完成，避免用旧分登记错题）
 */
async function ensureScoresSaved(): Promise<boolean> {
  try {
    const ok = await sheetRef.value?.saveIfDirty?.();
    return ok !== false;
  } catch (e) {
    failToast('保存老师分失败', e);
    return false;
  }
}

/**
 * 阅卷完成：先拉预览弹窗，老师可取消勾选剔除部分题，再确认归入错题本。
 *
 * <p>完成是幂等动作，重复点击不会重复累加错题次数；
 * 未识别到学生时后端会拒绝，并提示先设置学生。</p>
 */
async function finish(): Promise<void> {
  const taskId = props.taskId;
  if (!taskId) {
    return;
  }
  // 先落库老师分：预览里的最终成绩与错题登记都以它为准
  if (!(await ensureScoresSaved())) {
    return;
  }
  finishing.value = true;
  let previewed = false;
  try {
    const data = await eduaiApi.previewFinishMarking(taskId);
    preview.value = data;
    const selected: Record<number, boolean> = {};
    for (const q of data.questions ?? []) {
      selected[q.questionId] = q.wrong; // 默认勾选将登记的题；非错题本就登记不了
    }
    previewSelected.value = selected;
    previewVisible.value = true;
    previewed = true;
  } catch (e) {
    message.warning('完成预览加载失败，将按全部判定登记：' + (e instanceof Error ? e.message : String(e)));
  } finally {
    finishing.value = false;
  }
  if (previewed) {
    return; // 等待预览弹窗确认后由 confirmPreviewFinish 真正完成
  }
  const okFallback = await confirmDialog.value?.open(
    '完成阅卷后，本卷判为错的题会按最终成绩（老师分优先）归入该学生的错题库。同一份卷重复完成不会重复计数。确定完成吗？',
    { title: '阅卷完成', danger: false },
  );
  if (!okFallback) {
    return;
  }
  finishing.value = true;
  try {
    const res = await eduaiApi.finishMarking(taskId);
    if (res?.alreadyFinished) {
      message.info('该卷此前已完成过，本次未重复登记错题');
    } else {
      message.success(`阅卷完成：已归入学生错题库 ${res?.wrongCount ?? 0} 题`);
      if ((res?.failedCount ?? 0) > 0) {
        message.warning(`有 ${res?.failedCount ?? 0} 道题登记失败，请稍后在错题库页面查看`);
      }
    }
    emit('finished');
  } catch (finishErr) {
    failToast('完成失败', finishErr);
  } finally {
    finishing.value = false;
  }
}

/** 预览弹窗确认：收集未勾选的题做剔除，再调用完成 */
async function confirmPreviewFinish(): Promise<void> {
  const taskId = props.taskId;
  if (!taskId || !preview.value) {
    return;
  }
  const excluded = preview.value.questions
    .filter((q) => !previewSelected.value[q.questionId])
    .map((q) => q.questionId);
  previewVisible.value = false;
  // 弹窗开着时老师仍可能在结构视图里改分，确认前再兜一次
  if (!(await ensureScoresSaved())) {
    return;
  }
  finishing.value = true;
  try {
    const res = await eduaiApi.finishMarking(taskId, excluded);
    if (res?.alreadyFinished) {
      message.info('该卷此前已完成过，本次未重复登记错题');
    } else {
      message.success(`阅卷完成：已归入学生错题库 ${res?.wrongCount ?? 0} 题${excluded.length ? `，剔除 ${excluded.length} 题` : ''}`);
      if ((res?.failedCount ?? 0) > 0) {
        message.warning(`有 ${res?.failedCount ?? 0} 道题登记失败，请稍后在错题库页面查看`);
      }
    }
    emit('finished');
  } catch (e) {
    failToast('完成失败', e);
  } finally {
    finishing.value = false;
  }
}

/** 预览里排除已掌握的题（勾选框左右切换） */
function togglePreviewQuestion(question: MarkingPreviewQuestion): void {
  previewSelected.value[question.questionId] = !previewSelected.value[question.questionId];
}

/** 撤销完成：删除本任务的错题记录，复位完成状态 */
async function undoFinish(): Promise<void> {
  const taskId = props.taskId;
  if (!taskId) return;
  const ok = await confirmDialog.value?.open(
    '撤销完成后，该任务的错题记录将被全部移除，确定撤销吗？',
    { title: '撤销完成', danger: true },
  );
  if (!ok) return;
  undoing.value = true;
  try {
    const res = await eduaiApi.unfinishMarking(taskId);
    message.success(`已撤销完成：移出错题库 ${res?.removed ?? 0} 题`);
    emit('finished');
  } catch (e) {
    failToast('撤销失败', e);
  } finally {
    undoing.value = false;
  }
}
</script>

<template>
  <div class="mr-panel">
    <div class="mr-sum">
      <template v-if="result">
        试卷记录 · 任务 {{ result.taskId }} ·
        状态 {{ statusText }} ·
        AI 总分 <b>{{ totals.ai }}</b> ·
        老师总分 <b>{{ totals.final }}</b>
        <ReTag size="small" type="success">老师分为最终成绩</ReTag>
        <ReTag v-if="taskFailed" size="small" type="danger">判分失败</ReTag>
        <span class="mr-spacer" />
        <ReTag v-if="teacherFinished" size="small" type="info">已完成</ReTag>
        <el-tooltip v-if="teacherFinished" content="撤销后错题记录将被移除" placement="top">
          <el-button size="small" type="warning" :loading="undoing" @click="undoFinish">
            撤销完成
          </el-button>
        </el-tooltip>
        <el-tooltip v-else :content="finishHint" placement="top">
          <span class="mr-finish-wrap">
            <el-button
              size="small"
              type="primary"
              :loading="finishing"
              :disabled="!canFinish"
              @click="finish"
            >
              完成
            </el-button>
          </span>
        </el-tooltip>
      </template>
      <template v-else>
        <span class="mr-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在读取阅卷结果…
        </span>
        <span class="mr-spacer" />
      </template>
    </div>
    <!-- 结构视图不等结果接口：任务号一到就挂载，结构/卷面图各自异步到货 -->
    <SheetStructureView
      v-if="taskId"
      :key="`${taskId}:${refreshKey}`"
      ref="sheetRef"
      :task-id="taskId"
      :structure-promise="structurePromise"
      @saved="emit('saved')"
    />
    <ReConfirmDialog ref="confirmDialog" />

    <!-- 完成预览：列出将登记的题目与得分率，老师可勾选剔除 -->
    <ReDialog
      v-model="previewVisible"
      title="阅卷完成预览"
      width="720px"
      :close-on-click-modal="false"
    >
      <div class="mr-preview-tip">
        本次按判错阈值将登记 <b>{{ preview?.wrongCount ?? 0 }}</b> 道错题。
        <template v-if="preview?.wrongRate != null">
          判错口径：得分率
          <b>{{ preview.wrongRate > 0 ? '< ' + Math.round(preview.wrongRate * 100) + '%' : '为 0%（仅 0 分判错）' }}</b>。
        </template>
        取消勾选可剔除不想进错题本的题目（例如得分率压线或存疑的主观题）。
      </div>
      <div v-if="preview?.questions?.length" class="mr-preview-list">
        <div
          v-for="q in preview.questions"
          :key="q.questionId"
          class="mr-preview-row"
          :class="{ 'mr-preview-row--muted': !q.wrong }"
        >
          <el-checkbox
            :model-value="!!previewSelected[q.questionId]"
            :disabled="!q.wrong"
            @change="togglePreviewQuestion(q)"
          />
          <span class="mr-preview-score">
            {{ q.finalScore }}/{{ q.maxScore }} · {{ Math.round((q.scoreRate ?? 0) * 100) }}%
          </span>
          <span class="mr-preview-stem">{{ q.stem || `题目 #${q.questionId}` }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">取消</el-button>
        <el-button type="primary" :loading="finishing" @click="confirmPreviewFinish">确认完成</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.mr-sum {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-bg-color) 74%, var(--el-color-primary) 4%);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  box-shadow: 0 0 18px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  margin-bottom: 10px;
}
.mr-sum b {
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
.mr-spacer {
  flex: 1;
}
/* 汇总行占位：结果接口还没回来时只转这一行，不挡下面的结构视图 */
.mr-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}
.mr-empty {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 结果面板根：铺满父级定高容器（老师端 .tp-mark__sheet 560px）；
   汇总行固定高度，结构视图占满剩余空间内部滚动 */
.mr-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.mr-panel .sheet-structure {
  flex: 1;
  min-height: 0;
}
/* 禁用状态的 button 不派发鼠标事件，tooltip 必须挂在外层包裹上 */
.mr-finish-wrap {
  display: inline-block;
}
.mr-preview-tip {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 10px;
}
.mr-preview-tip b {
  color: var(--el-color-primary);
}
.mr-preview-list {
  max-height: 46vh;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.mr-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.mr-preview-row:last-child {
  border-bottom: none;
}
.mr-preview-row--muted {
  opacity: 0.55;
}
.mr-preview-score {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.mr-preview-stem {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}
</style>
