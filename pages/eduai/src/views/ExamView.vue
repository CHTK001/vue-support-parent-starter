<template>
  <div class="page-container">
    <el-card shadow="never" class="mt-3 flex-1">
      <ReTable
        ref="tableRef"
        :loader="loadExams"
        :params="queryParams"
        :search="searchConfig"
        v-model:search-model="searchModel"
        row-key="examId"
        v-model:page="pageNo"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        border
        stripe
        @search="commitSearch"
        @search-reset="resetSearch"
        @load-error="pageLoadError"
      >
        <template #toolbar>
          <ReButton type="primary" icon="Plus" @click="openCreate">新建考试</ReButton>
        </template>
        <ReTableColumn prop="examId" label="ID" width="80" />
        <ReTableColumn prop="examName" label="考试名" min-width="220" />
        <ReTableColumn prop="examPaperId" label="试卷ID" width="100" />
        <ReTableColumn prop="examClassId" label="班级" width="120" />
        <ReTableColumn prop="examStartTime" label="开始时间" width="180" />
        <ReTableColumn prop="examEndTime" label="结束时间" width="180" />
        <ReTableColumn prop="examDuration" label="时长(分)" width="100" />
        <ReTableColumn label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="examStatusType(row.examStatus)">{{ examStatusLabel(row.examStatus) }}</el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="180" fixed="right" align="right">
          <template #default="{ row }">
            <ReButton icon="Edit" :show-text="false" type="primary" @click="openEdit(row)">编辑</ReButton>
            <ReButton icon="Delete" :show-text="false" type="danger" @click="remove(row)">删除</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </el-card>

    <ReDialog v-model="dialogVisible" :title="form.examId ? '编辑考试' : '新建考试'" width="560">
      <el-form :model="form" label-width="100">
        <el-form-item label="考试名" required>
          <el-input v-model="form.examName" />
        </el-form-item>
        <el-form-item label="试卷ID" required>
          <el-input-number v-model="form.examPaperId" :min="1" />
        </el-form-item>
        <el-form-item label="班级">
          <el-input v-model="form.examClassId" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.examStartTime" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.examEndTime" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(分)">
          <el-input-number v-model="form.examDuration" :min="10" :max="600" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { eduaiApi } from '../api/eduaiApi';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { Exam } from '../api/types';
import type { ReTableSearchConfig } from '@repo/ui/re-table';
import ReDialog from "@repo/ui/re-dialog";

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();

const EXAM_STATUS_OPTIONS = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已结束', value: 2 },
];

/** 内置搜索区字段：三项都是服务端 pageQuery 真实支持的条件 */
const searchConfig: ReTableSearchConfig = {
  title: '考试检索',
  filters: [
    { key: 'examName', label: '考试名称', placeholder: '名称关键字' },
    { key: 'examClassId', label: '班级', placeholder: '班级标识' },
    { key: 'examStatus', label: '状态', type: 'select', options: EXAM_STATUS_OPTIONS },
  ],
};

function blankSearch(): Record<string, unknown> {
  return { examName: '', examClassId: '', examStatus: null };
}

const { searchModel, applied, queryParams, commit, reset: resetDraft } = useSnapshotSearch<Record<string, unknown>>(blankSearch);

/** 筛选交给服务端：本地过滤只能过滤当前页，总条数与翻页都会是错的 */
const loadExams = createPageLoader((page, size) =>
  eduaiApi.pageExams({
    page,
    pageSize: size,
    examName: strParam(applied.value.examName),
    examClassId: strParam(applied.value.examClassId),
    examStatus: numParam(applied.value.examStatus),
  }),
);

/** 增删改后留在当前页重拉 */
const reload = () => {
  void tableRef.value?.reload();
};

/** 查询：提交草稿并回到第一页（停在旧页码会让筛选看起来没生效） */
const commitSearch = () => {
  commit();
  void tableRef.value?.goto(1);
};

/** 重置：清空草稿与快照后重查 */
const resetSearch = () => {
  resetDraft();
  void tableRef.value?.goto(1);
};

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Exam>>({});

const resetForm = () => {
  Object.assign(form, {
    examId: undefined,
    examName: '',
    examPaperId: 1,
    examClassId: '',
    examStartTime: '',
    examEndTime: '',
    examDuration: 90,
    examStatus: 0,
  });
};

const openCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (row: Exam) => {
  Object.assign(form, row);
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.examName || !form.examPaperId) {
    ElMessage.warning('请填写考试名与试卷ID');
    return;
  }
  saving.value = true;
  try {
    if (form.examId) {
      await eduaiApi.updateExam(form);
    } else {
      await eduaiApi.createExam(form);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    reload();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

const remove = async (row: Exam) => {
  try {
    await ElMessageBox.confirm(`确认删除考试 ${row.examName}？`, "删除考试", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteExam(row.examId);
    if (!ok) {
      // 后端返回 false（未实际删掉任何行）时不能报成功，否则列表与提示会自相矛盾
      ElMessage.error(`删除失败: 考试 ${row.examName} 未被删除，请刷新后重试`);
      return;
    }
    ElMessage.success('已删除');
    reload();
  } catch (e) {
    ElMessage.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const examStatusType = (n?: number) =>
  ({ 1: 'warning', 2: 'info', 0: 'success' } as Record<number, string>)[n ?? 0] || 'info';
const examStatusLabel = (n?: number) =>
  ({ 1: '进行中', 2: '已结束', 0: '未开始' } as Record<number, string>)[n ?? 0] || '-';

</script>

<style scoped>
.page-container { height: 100%; display: flex; flex-direction: column; }
</style>