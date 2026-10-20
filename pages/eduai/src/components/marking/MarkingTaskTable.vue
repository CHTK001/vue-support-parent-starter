<script setup lang="ts">
/**
 * MarkingTaskTable —— 阅卷任务记录表（老师端 / 管理端共用）
 *
 * 列：任务号 / 类型 / 试卷 / 学生 / 状态 / AI 总分 / 老师总分 / 创建时间 / 操作。
 * 类型与状态走 ReTag；总分快照由父组件补齐——
 * 已完成的任务后端不冗余存总分，列表按任务号
 * 查一次结果再交给本组件展示。
 */
import { computed, ref } from 'vue';
import ReButton from '@repo/ui/re-button';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn, ReTableLoader } from '@repo/ui/re-table';
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
    /** 是否显示多选框（批量完成/撤销用） */
    selectable?: boolean;
    /**
     * 远程分页加载器（ReTable 的 :loader）。传了就走 ReTable 自带的分页与刷新，
     * 父组件不再自己写「刷新」按钮与 el-pagination —— 否则一个页面两套分页。
     */
    loader?: ReTableLoader;
    /** 记录总数（ReTable 远端分页回传，用于卡片头部「N 份」） */
    total?: number;
  }>(),
  { papers: () => [], scores: () => ({}), loading: false, selectable: false, loader: undefined, total: 0 },
);

/** ReTable 的 data 约定 Record<string, unknown>[]（与 StudentManageView 同口径） */
const tableData = computed(() => props.tasks as unknown as Record<string, unknown>[]);

const emit = defineEmits<{
  (e: 'view', task: TeacherMarkingTask): void;
  /** 多选变化（批量操作用；未勾选时传空数组） */
  (e: 'selection-change', rows: TeacherMarkingTask[]): void;
  /** 远端加载后回传总数，父级卡片头部「N 份」由 ReTable 的 update:total 驱动 */
  (e: 'update:total', total: number): void;
}>();

/** ReTable 实例：remote loader 模式下刷新/翻页交给它自己，父级增删改后可主动 reload */
const tableRef = ref<{ reload: () => Promise<void> } | null>(null);

defineExpose({
  reload: () => tableRef.value?.reload(),
});

const columns: ReTableColumn[] = [
  { prop: 'markingTaskTaskId', label: '任务号', minWidth: 190, showOverflowTooltip: true },
  { prop: 'markingTaskMode', label: '类型', width: 80, slot: 'mode' },
  { prop: 'taskPaper', label: '试卷', minWidth: 140, showOverflowTooltip: true, slot: 'paper' },
  { prop: 'taskStudent', label: '学生', width: 130, slot: 'student' },
  { prop: 'markingTaskStatus', label: '状态', width: 90, slot: 'status' },
  { prop: 'taskAiScore', label: 'AI 总分', width: 80, slot: 'aiScore' },
  { prop: 'taskFinalScore', label: '老师总分', width: 90, slot: 'finalScore' },
  { prop: 'teacherFinished', label: '完成', width: 90, slot: 'teacherFinished' },
  { prop: 'markingTaskStartTime', label: '创建时间', minWidth: 150 },
  { prop: 'taskActions', label: '操作', width: 64, slot: 'actions' },
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

/**
 * 学生列拆分：姓名（主行）与学号（副标题）。
 *
 * <p>姓名由后端补齐（答题卡卷面识别的姓名优先，其次按学号查学生档案）。
 * 匿名阅卷时后端把学号兜底成 {@code anonymous}、也没有姓名，此时姓名位
 * 直接显示该标识，学号副行不渲染，避免出现两行一样的「anonymous」。</p>
 */
const studentNo = (task: TeacherMarkingTask): string => (task.markingTaskStudentId ?? '').trim();

const studentName = (task: TeacherMarkingTask): string => {
  // 姓名是后端在实体上补的非库字段，api/types.ts 为只读文件不追加声明，按扩展字段宽松取值
  const name = String((task as unknown as Record<string, unknown>).markingTaskStudentName ?? '').trim();
  return name || studentNo(task) || '匿名';
};

const scoreOf = (task: TeacherMarkingTask) =>
  task.markingTaskTaskId ? props.scores[task.markingTaskTaskId] ?? null : null;
</script>

<template>
  <!--
    两种数据形态共用一套列：
      - 传 loader：远程分页，ReTable 自带分页器与工具栏刷新按钮（父级不再自己写）
      - 只传 tasks：本地数据（老师端按 limit 拉全量再排序的场景）
  -->
  <ReTable
    ref="tableRef"
    :data="tableData"
    :loader="loader"
    :total="total"
    :page-size="10"
    :page-sizes="[10, 20, 50, 100]"
    :columns="columns"
    size="small"
    engine="element"
    :pagination="!!loader"
    :toolbar="!!loader"
    :loading="loading"
    :show-selection="selectable"
    :row-key="(row: Record<string, unknown>) => (row as unknown as TeacherMarkingTask).markingTaskTaskId"
    border
    stripe
    @update:total="emit('update:total', $event)"
    @selection-change="emit('selection-change', ($event as Record<string, unknown>[]) as unknown as TeacherMarkingTask[])"
  >
    <template #col-mode="{ row }">
      <ReTag size="small" type="primary">{{ modeLabel(row as TeacherMarkingTask) }}</ReTag>
    </template>
    <template #col-paper="{ row }">{{ paperName(row as TeacherMarkingTask) }}</template>
    <template #col-student="{ row }">
      <!-- 姓名为主、学号作副标题：老师扫一眼先认人，要核对学号再看第二行。
           匿名阅卷（后端兜底 anonymous）没有姓名，此时主行直接显示该标识。 -->
      <span class="mt-student">
        <span class="mt-student__name">{{ studentName(row as TeacherMarkingTask) }}</span>
        <span v-if="studentNo(row as TeacherMarkingTask)" class="mt-student__no">
          {{ studentNo(row as TeacherMarkingTask) }}
        </span>
      </span>
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
    <template #col-teacherFinished="{ row }">
      <template v-if="(row as TeacherMarkingTask).markingTaskTeacherFinished">
        <ReTag size="small" type="info">已完成</ReTag>
      </template>
      <template v-else>
        <ReTag size="small" type="info" plain>待完成</ReTag>
      </template>
    </template>
    <template #col-actions="{ row }">
      <ReButton
        layout="square"
        type="primary"
        icon="View"
        tip="查看"
        @click.stop="emit('view', row as TeacherMarkingTask)"
      />
    </template>
  </ReTable>
</template>

<style scoped>
.mt-final {
  color: var(--el-color-primary);
}
/* 学生列：姓名主行 + 学号副标题（副行小一档、弱化色，行高由内容决定） */
.mt-student {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.mt-student__name {
  color: var(--el-text-color-regular);
}
.mt-student__no {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
