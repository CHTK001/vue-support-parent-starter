<!--
  任务详情弹层：回显 /detail 的完整运行态（含脚本正文与重试/超时策略）。

  自己取数（先用列表行即时回显，再拉一次 /detail 补齐完整字段），把
  「编辑 / 立即触发 / 查看日志」三类动作以事件抛给父组件——真正的写操作与
  动线跳转仍由列表页统一收口，避免同一动作在两处各写一份而分叉。
-->
<script setup lang="ts">
import { ref } from "vue";
import { msgError } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import ReIcon from "@repo/ui/re-icon";
import { getJob } from "../api/jobApi";
import { errText } from "../composables/useCollectView";
import { GLUE_BEAN } from "../constants/jobOptions";
import { alarmTypeText, detailSourceLabel, isFlowRow, isScriptJob, scheduleText } from "../utils/jobFormat";
import { fmtMs } from "../utils/time";
import type { JobRuntime } from "../types/job";

const emit = defineEmits<{
  (e: "edit", job: JobRuntime): void;
  (e: "trigger", job: JobRuntime): void;
  (e: "logs", job: JobRuntime): void;
}>();

const visible = ref(false);
const loading = ref(false);
const detail = ref<JobRuntime | null>(null);

/** 详情：先用列表行即时回显，再取一次 /detail 拿完整字段（含脚本正文与重试/超时策略） */
async function open(job: JobRuntime): Promise<void> {
  detail.value = job;
  visible.value = true;
  loading.value = true;
  try {
    detail.value = (await getJob(job.jobKey)) ?? job;
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

/** 立即触发：先关弹层再抛给父组件走列表同一条派发链，保证台账与作业日志一致 */
function triggerFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  visible.value = false;
  emit("trigger", job);
}

/** 编辑：先关弹层再抛给父组件复用列表的编辑分流（流程行 → 流程调度，外部行 → 任务表单） */
function editFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  visible.value = false;
  emit("edit", job);
}

/** 查看日志：先关弹层再抛给父组件跳转，补齐「任务 → 它的执行历史」这条动线 */
function logsFromDetail(): void {
  const job = detail.value;
  if (!job) {
    return;
  }
  visible.value = false;
  emit("logs", job);
}

defineExpose({ open });
</script>

<template>
  <ReDialog v-model="visible" title="任务详情" width="980px" top="5vh" footer-hidden>
    <div v-loading="loading" class="job-detail">
      <div v-if="detail" class="job-detail__alert" :class="isFlowRow(detail) ? 'is-warn' : ''">
        <el-icon><InfoFilled /></el-icon>
        <span v-if="isFlowRow(detail)">
          这是一条采集流程的调度镜像行：画布结构与 cron 以采集流程为准，改名/改期请走「编辑流程调度」或流程设计页。
        </span>
        <span v-else>
          这是调度中心自行登记的外部任务：配置以本行为准，执行器需与任务键同名才会被领取。
        </span>
        <el-icon class="job-detail__alert-arrow"><ArrowDown /></el-icon>
      </div>

      <div v-if="detail" class="job-detail__grid">
        <section class="job-detail__card">
          <h3>基本信息</h3>
          <dl class="job-detail__list">
            <div><dt>任务键</dt><dd class="job-detail__mono job-detail__link">{{ detail.jobKey }}</dd></div>
            <div><dt>任务名称</dt><dd>{{ detail.jobName || "—" }}</dd></div>
            <div><dt>业务编号</dt><dd class="job-detail__mono job-detail__link">{{ detail.jobNo || "—" }}</dd></div>
            <div><dt>分组</dt><dd>{{ detail.group || "—" }}</dd></div>
            <div><dt>调度</dt><dd class="job-detail__mono">{{ scheduleText(detail) }}</dd></div>
            <div>
              <dt>状态</dt>
              <dd>
                <ReTag :type="detail.enabled ? 'success' : 'info'" effect="solid" dot>
                  {{ detail.enabled ? "启用" : "停用" }}
                </ReTag>
              </dd>
            </div>
            <div>
              <dt>分发</dt>
              <dd>{{ detail.dispatchMode === "REMOTE" ? "远程" : "本地" }}</dd>
            </div>
          </dl>
        </section>

        <section class="job-detail__card">
          <h3>执行配置</h3>
          <dl class="job-detail__list">
            <div class="job-detail__row-wide">
              <dt>处理器</dt>
              <dd class="job-detail__handler">
                <span class="job-detail__mono job-detail__link">{{ detail.jobKey }}</span>
                <span class="job-detail__plus">+</span>
                <ReTag :type="isScriptJob(detail) ? 'primary' : detail.handlerRegistered ? 'success' : 'danger'" effect="solid" dot>
                  {{ isScriptJob(detail) ? "代码片段任务" : detail.handlerRegistered ? "已注册" : "未注册" }}
                </ReTag>
                <span class="job-detail__mono">{{ detail.glueType || GLUE_BEAN }}</span>
              </dd>
            </div>
            <div v-if="isScriptJob(detail)" class="job-detail__row-wide">
              <dt>{{ detailSourceLabel(detail) }}</dt>
              <dd><pre class="job-detail__code">{{ detail.glueSource || "—" }}</pre></dd>
            </div>
            <div class="job-detail__row-wide">
              <dt>执行参数</dt>
              <dd><pre class="job-detail__code job-detail__code--param">{{ detail.executeParam || "—" }}</pre></dd>
            </div>
          </dl>
        </section>

        <section class="job-detail__card">
          <h3>策略与告警</h3>
          <dl class="job-detail__list">
            <div><dt>失败重试</dt><dd>{{ detail.failRetry ?? 0 }} 次<span v-if="Number(detail.failRetry ?? 0) > 0"> · 间隔 {{ detail.retryInterval ? `${detail.retryInterval}s` : "立即" }}</span></dd></div>
            <div><dt>执行超时</dt><dd>{{ detail.executeTimeout ? `${detail.executeTimeout}s` : "不限" }}</dd></div>
            <div><dt>错过策略</dt><dd>{{ detail.misfireStrategy === "FIRE_ONCE_NOW" ? "补跑一次" : "不补跑" }}</dd></div>
            <div><dt>失败告警</dt><dd>{{ alarmTypeText(detail.alarmType, detail.alarmEmail) }}<span v-if="detail.alarmEmail" class="job-detail__mono"> · {{ detail.alarmEmail }}</span></dd></div>
            <div><dt>最近触发</dt><dd class="job-detail__num">{{ fmtMs(detail.lastFireTime) }}</dd></div>
            <div><dt>下次触发</dt><dd class="job-detail__num">{{ detail.enabled ? fmtMs(detail.nextFireTime) : "—" }}</dd></div>
          </dl>
        </section>
      </div>

      <div v-if="detail" class="job-detail__footer">
        <ReButton size="default" plain icon="Tickets" @click="logsFromDetail">查看日志</ReButton>
        <ReButton size="default" plain icon="Edit" @click="editFromDetail">
          {{ isFlowRow(detail) ? "编辑流程调度" : "编辑任务" }}
        </ReButton>
        <ReButton
          size="default"
          type="primary"
          icon="VideoPlay"
          :disabled="detail.enabled !== true"
          :title="detail.enabled === true ? '立即触发一次' : '任务已停用，请先启用调度'"
          @click="triggerFromDetail"
        >
          {{ isFlowRow(detail) ? "立即运行" : "立即触发" }}
        </ReButton>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
/*
  .job-detail* 整段从 JobView.vue 原样搬来。
  scoped 样式不跨组件继承，所以每张卡片的类都在本文件自带一份，
  不再依赖 JobView 的样式表。
 */
.job-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-detail__alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-lighter));
  border-radius: var(--el-radius-md);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color-overlay));
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
}

.job-detail__alert > .el-icon:first-child {
  flex: 0 0 auto;
  color: var(--el-color-primary);
  font-size: 20px;
}

.job-detail__alert.is-warn {
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color-overlay));
}

.job-detail__alert-arrow {
  margin-left: auto;
  color: var(--el-text-color-primary);
}

.job-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  align-items: start;
}

.job-detail__card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-color-primary);
  border-radius: var(--el-radius-lg);
  background: var(--el-bg-color-overlay);
}

.job-detail__card h3 {
  margin: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.job-detail__list {
  margin: 0;
  padding: 0 16px 8px;
}

.job-detail__list > div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 44px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.job-detail__list > div:last-child {
  border-bottom: 0;
}

.job-detail__list dt {
  color: var(--el-text-color-regular);
  font-size: 13px;
  white-space: nowrap;
}

.job-detail__list dd {
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.job-detail__mono,
.job-detail__num {
  font-family: var(--cc-font-num);
  font-variant-numeric: tabular-nums;
}

.job-detail__link {
  color: var(--el-color-primary);
}

.job-detail__handler {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.job-detail__plus {
  color: var(--el-text-color-regular);
}

.job-detail__code {
  max-height: 240px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border-radius: var(--el-radius-md);
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
  font-family: var(--cc-font-num);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.job-detail__code--param {
  min-height: 44px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.job-detail__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

@media (max-width: 760px) {
  .job-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>