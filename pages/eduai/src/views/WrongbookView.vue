<template>
  <div class="page-container">
    <el-card shadow="never" class="mt-3 flex-1">
      <ReTable
        ref="tableRef"
        :loader="loadWrong"
        :params="queryParams"
        :search="searchConfig"
        v-model:search-model="searchModel"
        row-key="wrongQuestionId"
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
          <ReButton type="success" icon="MagicStick" @click="generateReview">生成复习卷</ReButton>
        </template>
        <ReTableColumn prop="wrongQuestionId" label="ID" width="80" />
        <ReTableColumn prop="wrongQuestionStudentId" label="学生" width="120" />
        <ReTableColumn prop="wrongQuestionQuestionId" label="题目ID" width="120" />
        <ReTableColumn prop="wrongQuestionWrongCount" label="错次" width="80" />
        <ReTableColumn label="掌握度" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.wrongQuestionMasteryLevel" :max="2" />
          </template>
        </ReTableColumn>
        <ReTableColumn prop="wrongQuestionLastWrongTime" label="最近错误" width="180" />
        <ReTableColumn prop="wrongQuestionReviewCount" label="复习次数" width="100" />
        <ReTableColumn label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <ReButton icon="Refresh" :show-text="false" type="primary" @click="updateMastery(row)">更新掌握度</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { eduaiApi } from '../api/eduaiApi';
import type { WrongQuestion } from '../api/types';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { ReTableSearchConfig } from '@repo/ui/re-table';

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();

const reviewVisible = ref(false);
const reviewQuestionIds = ref<number[]>([]);

function blankSearch(): Record<string, unknown> {
  return { studentId: '', subject: '', masteryLevel: null };
}

const { searchModel, applied, queryParams, commit, reset: resetDraft } =
  useSnapshotSearch<Record<string, unknown>>(blankSearch);

/** 三项均为服务端 WrongQueryDTO 的等值条件；掌握度口径见 edu_wrong_question DDL */
const searchConfig: ReTableSearchConfig = {
  title: '错题检索',
  filters: [
    { key: 'studentId', label: '学生 ID', placeholder: '如 stu_001' },
    { key: 'subject', label: '学科', placeholder: '如 计算机' },
    {
      key: 'masteryLevel',
      label: '掌握度',
      type: 'select',
      options: [
        { label: '未掌握', value: 0 },
        { label: '部分掌握', value: 1 },
        { label: '已掌握', value: 2 },
      ],
    },
  ],
};

const loadWrong = createPageLoader((page, size) =>
  eduaiApi.listWrongQuestions({
    pageNum: page,
    pageSize: size,
    studentId: strParam(applied.value.studentId),
    subject: strParam(applied.value.subject),
    masteryLevel: numParam(applied.value.masteryLevel),
  }),
);

/** 查询：提交草稿并回到第一页 */
const commitSearch = () => {
  commit();
  void tableRef.value?.goto(1);
};

/** 重置：清空草稿与快照后回第一页 */
const resetSearch = () => {
  resetDraft();
  void tableRef.value?.goto(1);
};

/** 掌握度改完留在当前页重拉 */
const reload = () => {
  void tableRef.value?.reload();
};

const updateMastery = async (row: WrongQuestion) => {
  try {
    await eduaiApi.updateMastery(row.wrongQuestionId, row.wrongQuestionMasteryLevel ?? 0);
    ElMessage.success('已更新');
    reload();
  } catch (e) {
    ElMessage.error('更新失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const generateReview = async () => {
  const studentId = strParam(applied.value.studentId);
  if (!studentId) {
    ElMessage.warning('请先填写学生 ID 并查询');
    return;
  }
  try {
    const questionIds = await eduaiApi.reviewWrongbook({ studentId });
    reviewQuestionIds.value = Array.isArray(questionIds) ? questionIds : [];
    reviewVisible.value = true;
  } catch (e) {
    ElMessage.error('生成失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};
</script>

<style scoped>
.page-container {  height: 100%; display: flex; flex-direction: column; }
</style>