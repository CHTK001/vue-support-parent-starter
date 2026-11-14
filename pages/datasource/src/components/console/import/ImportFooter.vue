<script setup lang="ts">
/**
 * 导入向导的底部操作条（弹窗态与页面态共用）。
 *
 * <p>把「上一步 / 下一步 / 开始」抽出来，两种外壳就不会各长一套按钮文案 ——
 * 这类分叉最后总会变成「页面里有取消、弹窗里没有」。</p>
 */
import { computed } from "vue";
import ReButton from "@repo/ui/re-button";
import type { ImportWizardCtx } from "./useImportWizard";

const props = defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
  /** 是否显示「关闭」（弹窗态用「取消」，页面态用「返回列表」） */
  closeText?: string;
}>();

const emit = defineEmits<{
  /** 关闭 / 返回 */
  (e: "close"): void;
}>();

/** 提示条的完整文案：模板里会被省略号截断，悬停看这个 */
const hintText = computed(() => {
  const ctx = props.ctx;
  if (ctx.step !== ctx.steps.length - 1) {
    return `第 ${ctx.step + 1} / ${ctx.steps.length} 步`;
  }
  if (ctx.running) return "正在导入，中途可点「中断」停下";
  if (ctx.run.failed) return `本次导入失败：${ctx.run.errorText || "详见日志"}`;
  if (ctx.run.finished) return "本次导入已结束";
  return "点「开始」按当前设置写库";
});

/** 末步失败：提示条换成错误色，且不显示没意义的「重试」以外动作 */
const isFailed = computed(
  () => props.ctx.step === props.ctx.steps.length - 1 && props.ctx.run.failed,
);

/** 上一步 */
function onPrev(): void {
  props.ctx.prev();
}
</script>

<template>
  <div class="iw-footer">
    <ReButton :disabled="ctx.running" @click="emit('close')">{{ closeText || "取消" }}</ReButton>
    <span class="iw-footer-hint" :class="{ 'is-error': isFailed }" :title="hintText">
      <template v-if="ctx.step === ctx.steps.length - 1">
        <template v-if="ctx.running">正在导入，中途可点「中断」停下</template>
        <template v-else-if="ctx.run.failed">本次导入失败：{{ ctx.run.errorText || "详见日志" }}</template>
        <template v-else-if="ctx.run.finished">本次导入已结束</template>
        <template v-else>点「开始」按当前设置写库</template>
      </template>
      <template v-else>第 {{ ctx.step + 1 }} / {{ ctx.steps.length }} 步</template>
    </span>
    <span class="iw-spacer" />
    <ReButton :disabled="ctx.step === 0 || ctx.running" @click="onPrev">上一步</ReButton>
    <ReButton v-if="ctx.step < ctx.steps.length - 1" type="primary" :disabled="!ctx.canGoNext" @click="ctx.next()">
      下一步
    </ReButton>
    <!--
      跑完之后这颗按钮从「开始」变成「完成」并保持可点：
      早前这里做成 finished 即 disabled，成了个看得出、点不动的假主按钮，
      用户只剩左侧「取消」能关窗。
    -->
    <ReButton
      v-else-if="ctx.run.finished"
      type="primary"
      :disabled="ctx.running"
      @click="emit('close')"
    >
      完成
    </ReButton>
    <ReButton
      v-else
      type="primary"
      :loading="ctx.running"
      :disabled="ctx.running"
      @click="ctx.startImport()"
    >
      {{ ctx.run.failed ? "重试" : "开始" }}
    </ReButton>
  </div>
</template>

<style scoped>
.iw-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.iw-footer-hint {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 46%;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iw-footer-hint.is-error {
  color: var(--el-color-danger);
}
.iw-spacer {
  flex: 1;
}
@media (max-width: 560px) {
  .iw-footer-hint {
    display: none;
  }
}
</style>
