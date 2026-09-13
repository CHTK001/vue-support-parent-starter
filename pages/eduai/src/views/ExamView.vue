<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-button type="primary" :icon="Plus" @click="openCreate">新建考试</el-button>
        <el-input v-model="keyword" placeholder="考试名称" clearable style="width: 200px" />
        <el-button :icon="Search" @click="reload">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="examId" label="ID" width="80" />
        <el-table-column prop="examName" label="考试名" min-width="220" />
        <el-table-column prop="examPaperId" label="试卷ID" width="100" />
        <el-table-column prop="examClassId" label="班级" width="120" />
        <el-table-column prop="examStartTime" label="开始时间" width="180" />
        <el-table-column prop="examEndTime" label="结束时间" width="180" />
        <el-table-column prop="examDuration" label="时长(分)" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="examStatusType(row.examStatus)">{{ examStatusLabel(row.examStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除考试 ${row.examName}?`" @confirm="remove(row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.examId ? '编辑考试' : '新建考试'" width="560">
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { Exam } from '../api/types';

const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const list = ref<Exam[]>([]);

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Exam>>({});

const reload = async () => {
  loading.value = true;
  try {
    const res = await eduaiApi.pageExams({ page: pageNo.value, pageSize: pageSize.value });
    list.value = ((res?.data ?? []) as Exam[]).filter((it: any) => !keyword.value || (it.examName || '').includes(keyword.value));
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const reset = () => {
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
  reset();
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
    await eduaiApi.deleteExam(row.examId);
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

onMounted(reload);
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
</style>