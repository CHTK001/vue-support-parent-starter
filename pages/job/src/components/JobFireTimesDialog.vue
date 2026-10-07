<!--
  后续执行时间点预览弹层：只对 cron 任务开放，时间由与服务端同源的 CronExpression 算出。
-->
<script setup lang="ts">
import { ref } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import { CronExpression } from "@repo/utils";
import type { JobRuntime } from "../types/job";
import { fmtFireTime } from "../utils/jobFormat";

const visible = ref(false);
const title = ref("");
const fireTimes = ref<Date[]>([]);
const errorText = ref("");

/**
 * 打开「后续执行时间点」弹层。
 *
 * <p>只对 cron 任务有意义：固定延迟 / 固定频率的下一拍取决于上一拍实际完成时刻，
 * 事先算不出来，所以那两类任务不给这个按钮。</p>
 *
 * <p>时间直接用 @repo/utils 的 {@link CronExpression} 算——它是服务端
 * {@code com.chua.common.support.task.scheduler.CronExpression} 的逐行镜像，
 * 与保存后调度器实际触发的口径一致，不必为此加后端接口。</p>
 *
 * @param job 台账行
 */
function open(job: JobRuntime): void {
  const expression = String(job.scheduleTime ?? "").trim();
  title.value = job.jobName || job.jobKey || "";
  fireTimes.value = [];
  errorText.value = "";
  if (!expression) {
    errorText.value = "该任务没有填写调度配置";
    visible.value = true;
    return;
  }
  try {
    fireTimes.value = new CronExpression(expression).getFireTimes(5, new Date());
    if (!fireTimes.value.length) {
      // 能解析但永不匹配（如 0 0 9 30 2 *）——与 ReCron 预览、后端校验同一口径
      errorText.value = "该表达式算不出后续触发时间";
    }
  } catch (error) {
    errorText.value = `表达式无法解析：${String((error as Error)?.message ?? error)}`;
  }
  visible.value = true;
}

defineExpose({ open });
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="`后续 5 次执行时间${title ? ' · ' + title : ''}`"
    width="480px"
    footer-hidden
  >
    <div class="job-fire-times">
      <ol v-if="fireTimes.length" class="job-fire-times__list">
        <li v-for="(time, index) in fireTimes" :key="index">
          <span class="job-fire-times__seq">{{ index + 1 }}</span>
          <span class="job-fire-times__time">{{ fmtFireTime(time) }}</span>
        </li>
      </ol>
      <p v-else class="job-fire-times__empty">{{ errorText || "暂无数据" }}</p>
      <p class="job-fire-times__note">
        由与服务端同一套解析引擎算出，保存后的实际触发时间与此一致；台账行的「下次触发」只显示最近一次。
      </p>
    </div>
  </ReDialog>
</template>

<style scoped>
/* 后续执行时间点预览：序号 + 等宽时间，5 行高度稳定不跳动 */
.job-fire-times__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-fire-times__list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  /* 原写死 8px，对应 koi 的 --el-radius-md */
  border-radius: var(--el-radius-md, 8px);
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.job-fire-times__seq {
  flex: none;
  width: 20px;
  height: 20px;
  /* 原写死 9999px，对应 koi 的 --el-radius-full */
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}

.job-fire-times__time {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.job-fire-times__empty {
  margin: 0;
  font-size: 13px;
  color: var(--el-color-danger);
}

.job-fire-times__note {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>