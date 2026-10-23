<template>
  <div class="page-container">
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
      <ReTableColumn prop="wrongQuestionStudentId" label="学生" />
      <ReTableColumn prop="wrongQuestionQuestionId" label="题目ID" />
      <ReTableColumn prop="wrongQuestionWrongCount" label="错次" />
      <ReTableColumn label="订正" width="80">
        <template #default="{ row }">
          <ReTag v-if="row.wrongQuestionCorrected" size="small" type="success">已订正</ReTag>
          <ReTag v-else size="small" type="info" plain>未订正</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="掌握度" >
        <template #default="{ row }">
          <el-rate v-model="row.wrongQuestionMasteryLevel" :max="2" />
        </template>
      </ReTableColumn>
      <ReTableColumn prop="wrongQuestionLastWrongTime" label="最近错误" />
      <ReTableColumn prop="wrongQuestionReviewCount" label="复习次数" />
      <ReTableColumn label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <ReButton icon="Histogram" :show-text="false" type="primary" @click="openSources(row)">溯源</ReButton>
          <ReButton
            v-if="!row.wrongQuestionCorrected"
            icon="CircleCheck"
            :show-text="false"
            type="success"
            @click="markCorrected(row)"
          >订正</ReButton>
          <ReButton icon="Refresh" :show-text="false" @click="updateMastery(row)">更新掌握度</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog v-model="sourceVisible" :title="sourceTitle" width="560">
      <el-table v-if="sourceRows.length" :data="sourceRows" size="small" border>
        <el-table-column prop="sourceTaskId" label="来源任务" min-width="200" />
        <el-table-column prop="sourceTaskTime" label="完成时间" min-width="150">
          <template #default="{ row }">{{ row.sourceTaskTime || '—' }}</template>
        </el-table-column>
        <el-table-column prop="paperName" label="试卷" min-width="120">
          <template #default="{ row }">{{ row.paperName || '任意卷' }}</template>
        </el-table-column>
      </el-table>
      <div v-else class="text-sm">未查到该题的来源任务（历史数据未记录来源）。</div>
    </ReDialog>

    <ReDialog v-model="reviewVisible" title="复习卷生成结果" width="520">
      <div class="text-sm">
        已为当前学生挑选 {{ reviewQuestionIds.length }} 道错题用于复习（题目 ID：{{ reviewQuestionIds.join('、') || '无' }}）。
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref } from 'vue';

import { eduaiApi } from '../api/eduaiApi';
import type { WrongQuestion, WrongSource } from '../api/types';
import { createPageLoader, numParam, pageLoadError, strParam, useSnapshotSearch } from '../api/pageLoader';
import type { ReTableSearchConfig } from '@repo/ui/re-table';
import ReDialog from "@repo/ui/re-dialog";

const pageNo = ref(1);
const pageSize = ref(20);
const tableRef = ref();

const reviewVisible = ref(false);
const reviewQuestionIds = ref<number[]>([]);

/** 溯源弹窗 */
const sourceVisible = ref(false);
const sourceRows = ref<WrongSource[]>([]);
const sourceTitle = ref('');

/** 打开某错题的溯源列表 */
const openSources = async (row: WrongQuestion) => {
  try {
    const rows = await eduaiApi.wrongSources(row.wrongQuestionId);
    sourceRows.value = Array.isArray(rows) ? rows : [];
    sourceTitle.value = `题目 #${row.wrongQuestionQuestionId} 的来源任务`;
    sourceVisible.value = true;
  } catch (e) {
    message.error('溯源查询失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

/** 一键订正 */
const markCorrected = async (row: WrongQuestion) => {
  try {
    await eduaiApi.markCorrected(row.wrongQuestionId);
    message.success('已标记为已订正');
    reload();
  } catch (e) {
    message.error('订正失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

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
    message.success('已更新');
    reload();
  } catch (e) {
    message.error('更新失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const generateReview = async () => {
  const studentId = strParam(applied.value.studentId);
  if (!studentId) {
    message.warning('请先填写学生 ID 并查询');
    return;
  }
  try {
    const questionIds = await eduaiApi.reviewWrongbook({ studentId });
    reviewQuestionIds.value = Array.isArray(questionIds) ? questionIds : [];
    reviewVisible.value = true;
  } catch (e) {
    message.error('生成失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};
</script>

<style scoped>
.page-container {  height: 100%; display: flex; flex-direction: column; }
</style>