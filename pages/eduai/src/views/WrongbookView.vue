<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input v-model="filter.studentId" placeholder="学生 ID" clearable style="width: 160px" />
        <el-input v-model="filter.subject" placeholder="学科" clearable style="width: 160px" />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button type="success" :icon="MagicStick" @click="generateReview">生成复习卷</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3 flex-1">
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="wrongQuestionId" label="ID" width="80" />
        <el-table-column prop="wrongQuestionStudentId" label="学生" width="120" />
        <el-table-column prop="wrongQuestionQuestionId" label="题目ID" width="120" />
        <el-table-column prop="wrongQuestionWrongCount" label="错次" width="80" />
        <el-table-column label="掌握度" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.wrongQuestionMasteryLevel" :max="2" />
          </template>
        </el-table-column>
        <el-table-column prop="wrongQuestionLastWrongTime" label="最近错误" width="180" />
        <el-table-column prop="wrongQuestionReviewCount" label="复习次数" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="updateMastery(row)">更新掌握度</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="reviewVisible" title="复习卷生成结果" width="520">
      <div class="text-sm">
        已为当前学生挑选 {{ reviewQuestionIds.length }} 道错题用于复习（题目 ID：{{ reviewQuestionIds.join('、') || '无' }}）。
      </div>
      <template #footer>
        <el-button @click="reviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick, Search } from '@element-plus/icons-vue';
import { eduaiApi } from '../api/eduaiApi';
import type { WrongQuestion } from '../api/types';

const filter = reactive({ studentId: '', subject: '' });
const loading = ref(false);
const list = ref<WrongQuestion[]>([]);

const reviewVisible = ref(false);
const reviewQuestionIds = ref<number[]>([]);

const reload = async () => {
  loading.value = true;
  try {
    const res = await eduaiApi.listWrongQuestions({
      studentId: filter.studentId || undefined,
      subject: filter.subject || undefined,
    });
    list.value = (res?.data ?? []) as WrongQuestion[];
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
};

const updateMastery = async (row: WrongQuestion) => {
  try {
    await eduaiApi.updateMastery(row.wrongQuestionId, row.wrongQuestionMasteryLevel ?? 0);
    ElMessage.success('已更新');
  } catch (e) {
    ElMessage.error('更新失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const generateReview = async () => {
  if (!filter.studentId) {
    ElMessage.warning('请输入学生 ID');
    return;
  }
  try {
    const questionIds = await eduaiApi.reviewWrongbook({ studentId: filter.studentId });
    reviewQuestionIds.value = Array.isArray(questionIds) ? questionIds : [];
    reviewVisible.value = true;
  } catch (e) {
    ElMessage.error('生成失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

onMounted(reload);
</script>

<style scoped>
.page-container { padding: 16px; height: 100%; display: flex; flex-direction: column; }
.toolbar :deep(.el-card__body) { padding: 12px 16px; }
</style>