<script setup lang="ts">
/**
 * MarkingTaskTable —— 阅卷任务记录表（老师端 / 管理端共用）
 *
 * 列：任务号 / 类型 / 试卷 / 学生 / 状态 / AI 总分 / 老师总分 / 创建时间 / 操作。
 * 类型与状态走 ReTag；总分快照由父组件补齐——
 * 已完成的任务后端不冗余存总分，列表按任务号
 * 查一次结果再交给本组件展示。
 */
import { computed } from 'vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import ReTag from '@repo/ui/re-tag';
import type { Paper, TeacherMarkingTask } from '../../api/types';

const props = withDefaults(
  defineProps<{
    tasks: TeacherMarkingTask[];
    /** 试卷列表（SELF 卷按 paperId 反查名称） */
    papers: Paper[];
    /** 任务号 → 总分快照 */
    scores: Record<string, { ai: number; final: number }>;
    loading?: boolean;
  }>(),
  { papers: () => [], scores: () => ({}), loading: false },
);

/** ReTable 的 data 约定 Record<string, unknown>[]（与 StudentManageView 同口径） */
const tableData = computed(() => props.tasks as unknown as Record<string, unknown>[]);

const emit = defineEmits<{
  (e: 'view', task: TeacherMarkingTask): void;
}>();

const columns: ReTableColumn[] = [
  { prop: 'markingTaskTaskId', label: '任务号', minWidth: 190, showOverflowTooltip: true },
  { prop: 'markingTaskMode', label: '类型', width: 80, slot: 'mode' },
  { prop: 'taskPaper', label: '试卷', minWidth: 140, showOverflowTooltip: true, slot: 'paper' },
  { prop: 'taskStudent', label: '学生', width: 110, showOverflowTooltip: true, slot: 'student' },
  { prop: 'markingTaskStatus', label: '状态', width: 90, slot: 'status' },
  { prop: 'taskAiScore', label: 'AI 总分', width: 80, slot: 'aiScore' },
  { prop: 'taskFinalScore', label: '老师总分', width: 90, slot: 'finalScore' },
  { prop: 'markingTaskStartTime', label: '创建时间', minWidth: 150 },
  { prop: 'taskActions', label: '操作', width: 80, slot: 'actions' },
];

const modeLabel = (task: TeacherMarkingTask) =>
  task.markingTaskMode === 'ANY' ? '任意卷' : '自有卷';

const paperName = (task: TeacherMarkingTask): string => {
  if (task.markingTaskPaperId) {
    const hit = props.papers.find((p) => p.paperId === task.markingTaskPaperId);
    return hit?.paperName ?? `试卷#${task.markingTaskPaperId}`;
  }
  return task.markingTaskMode === 'ANY' ? '任意卷' : '—';
};

const STATUS_LABEL: Record<number, string> = {
  0: '排队中',
  1: '处理中',
  2: '已完成',
  3: '失败',
};
const STATUS_TYPE: Record<number, 'info' | 'warning' | 'success' | 'danger'> = {
  0: 'info',
  1: 'warning',
  2: 'success',
  3: 'danger',
};
const statusLabel = (task: TeacherMarkingTask) =>
  STATUS_LABEL[Number(task.markingTaskStatus) ?? 0] ?? '排队中';
const statusType = (task: TeacherMarkingTask) =>
  STATUS_TYPE[Number(task.markingTaskStatus) ?? 0] ?? 'info';

const scoreOf = (task: TeacherMarkingTask) =>
  task.markingTaskTaskId ? props.scores[task.markingTaskTaskId] ?? null : null;
</script>

<template>
  <ReTable
    :data="tableData"
    :columns="columns"
    size="small"
    engine="element"
    :pagination="false"
    :toolbar="false"
    :loading="loading"
  >
    <template #col-mode="{ row }">
      <ReTag size="small" type="primary">{{ modeLabel(row as TeacherMarkingTask) }}</ReTag>
    </template>
    <template #col-paper="{ row }">{{ paperName(row as TeacherMarkingTask) }}</template>
    <template #col-student="{ row }">
      {{ (row as TeacherMarkingTask).markingTaskStudentId || '匿名' }}
    </template>
    <template #col-status="{ row }">
      <ReTag size="small" :type="statusType(row as TeacherMarkingTask)">
        {{ statusLabel(row as TeacherMarkingTask) }}
      </ReTag>
    </template>
    <template #col-aiScore="{ row }">{{ scoreOf(row as TeacherMarkingTask)?.ai ?? '—' }}</template>
    <template #col-finalScore="{ row }">
      <b class="mt-final">{{ scoreOf(row as TeacherMarkingTask)?.final ?? '—' }}</b>
    </template>
    <template #col-actions="{ row }">
      <el-button link type="primary" @click.stop="emit('view', row as TeacherMarkingTask)">
        查看
      </el-button>
    </template>
  </ReTable>
</template>

<style scoped>
.mt-final {
  color: var(--el-color-primary);
}
</style>
