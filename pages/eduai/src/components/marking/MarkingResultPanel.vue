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
import { message } from '@repo/core';
import ReTag from '@repo/ui/re-tag';
import ReConfirmDialog from '../shared/ReConfirmDialog.vue';
import SheetStructureView from './SheetStructureView.vue';
import { eduaiApi } from '../../api/eduaiApi';
import { failToast } from '../../api/errorText';
import type { MarkingResultVO } from '../../api/types';

const props = withDefaults(
  defineProps<{
    /** 单份试卷的阅卷结果（null=未选择） */
    result: MarkingResultVO | null;
    /** 结构视图刷新令牌：任务判完 / 改分后递增，强制重挂载 */
    refreshKey?: number;
  }>(),
  { result: null, refreshKey: 0 },
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
/** 完成请求进行中 */
const finishing = ref(false);
/** 老师是否已点过完成 */
const teacherFinished = computed(() => !!props.result?.teacherFinished);
/** 判分未结束（还在判分/失败）时不允许完成 */
const canFinish = computed(() => !!props.result?.finished && !teacherFinished.value);

/**
 * 阅卷完成：把本卷判为错的题按最终分归入该学生的错题库。
 *
 * <p>完成是幂等动作，重复点击不会重复累加错题次数；
 * 未识别到学生时后端会拒绝，并提示先设置学生。</p>
 */
async function finish(): Promise<void> {
  const taskId = props.result?.taskId;
  if (!taskId) {
    return;
  }
  const ok = await confirmDialog.value?.open(
    '完成阅卷后，本卷判为错的题会按最终成绩（老师分优先）归入该学生的错题库。同一份卷重复完成不会重复计数。确定完成吗？',
    { title: '阅卷完成', danger: false },
  );
  if (!ok) {
    return;
  }
  finishing.value = true;
  try {
    const res = await eduaiApi.finishMarking(taskId);
    if (res?.alreadyFinished) {
      message.info('该卷此前已完成过，本次未重复登记错题');
    } else {
      message.success(`阅卷完成：已归入学生错题库 ${res?.wrongCount ?? 0} 题`);
    }
    emit('finished');
  } catch (e) {
    failToast('完成失败', e);
  } finally {
    finishing.value = false;
  }
}
</script>

<template>
  <div v-if="result" class="mr-panel">
    <div class="mr-sum">
      试卷记录 · 任务 {{ result.taskId }} ·
      状态 {{ result.finished ? '已判分' : '判分中' }} ·
      AI 总分 <b>{{ totals.ai }}</b> ·
      老师总分 <b>{{ totals.final }}</b>
      <ReTag size="small" type="success">老师分为最终成绩</ReTag>
      <span class="mr-spacer" />
      <ReTag v-if="teacherFinished" size="small" type="info">已完成</ReTag>
      <el-button
        v-else
        size="small"
        type="primary"
        :loading="finishing"
        :disabled="!canFinish"
        @click="finish"
      >
        完成
      </el-button>
    </div>
    <SheetStructureView
      :key="`${result.taskId}:${refreshKey}`"
      :task-id="result.taskId"
      @saved="emit('saved')"
    />
    <ReConfirmDialog ref="confirmDialog" />
  </div>
  <div v-else class="mr-empty">选择左侧任务查看阅卷结果</div>
</template>

<style scoped>
.mr-sum {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}
.mr-sum b {
  color: var(--el-color-primary);
}
.mr-spacer {
  flex: 1;
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
</style>
