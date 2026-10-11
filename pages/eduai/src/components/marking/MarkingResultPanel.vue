<script setup lang="ts">
/**
 * MarkingResultPanel —— 阅卷结果面板（汇总 + 试卷结构视图）
 *
 * 老师端「阅卷」页与管理端阅卷详情共用：
 * 顶部汇总（任务号 / 状态 / AI 总分 / 老师总分），
 * 下方 SheetStructureView（原始试卷 / 版面解析一体，
 * 改分在版面解析里做）。
 */
import { computed } from 'vue';
import ReTag from '@repo/ui/re-tag';
import SheetStructureView from './SheetStructureView.vue';
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
</script>

<template>
  <div v-if="result" class="mr-panel">
    <div class="mr-sum">
      试卷记录 · 任务 {{ result.taskId }} ·
      状态 {{ result.finished ? '已判分' : '判分中' }} ·
      AI 总分 <b>{{ totals.ai }}</b> ·
      老师总分 <b>{{ totals.final }}</b>
      <ReTag size="small" type="success">老师分为最终成绩</ReTag>
    </div>
    <SheetStructureView
      :key="`${result.taskId}:${refreshKey}`"
      :task-id="result.taskId"
      @saved="emit('saved')"
    />
  </div>
  <div v-else class="mr-empty">选择左侧任务查看阅卷结果</div>
</template>

<style scoped>
.mr-sum {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}
.mr-sum b {
  color: var(--el-color-primary);
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
