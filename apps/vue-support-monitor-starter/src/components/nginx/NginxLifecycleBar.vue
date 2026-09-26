<template>
  <div class="ngx-lifecycle">
    <ReButton size="small" :loading="busy === 'test'" @click="run('test')">
      <template #icon><ReIcon name="CircleCheck" :size="14" /></template>
      校验配置
    </ReButton>

    <ReButton size="small" type="primary" :loading="busy === 'reload'" @click="run('reload')">
      <template #icon><ReIcon name="Refresh" :size="14" /></template>
      重载
    </ReButton>

    <ReButton size="small" :loading="busy === 'restart'" @click="confirmThen('restart')">
      <template #icon><ReIcon name="RefreshRight" :size="14" /></template>
      重启
    </ReButton>

    <ReButton size="small" :loading="busy === 'start'" @click="run('start')">
      <template #icon><ReIcon name="VideoPlay" :size="14" /></template>
      启动
    </ReButton>

    <ReButton size="small" type="danger" :loading="busy === 'stop'" @click="confirmThen('stop')">
      <template #icon><ReIcon name="VideoPause" :size="14" /></template>
      停止
    </ReButton>

    <span class="ngx-tip" :title="tipText">
      <ReIcon name="InfoFilled" :size="12" />
      {{ tipText }}
    </span>

    <!-- 执行结果：把 stdout/stderr 摊开，不让用户猜 -->
    <ReDialog
      v-model="resultVisible"
      :title="resultTitle"
      width="640px"
      :height="420"
      :footer-hidden="false"
      @closed="result = null"
    >
      <div v-if="result" class="ngx-result">
        <div class="ngx-result-head" :class="result.success ? 'is-ok' : 'is-err'">
          <ReIcon :name="result.success ? 'CircleCheck' : 'WarningFilled'" :size="15" />
          <span>{{ result.message }}</span>
        </div>
        <div v-if="result.stdout" class="ngx-result-block">
          <div class="ngx-result-label">标准输出</div>
          <pre class="ngx-result-pre">{{ result.stdout }}</pre>
        </div>
        <div v-if="result.stderr" class="ngx-result-block">
          <div class="ngx-result-label">错误输出</div>
          <pre class="ngx-result-pre is-err">{{ result.stderr }}</pre>
        </div>
        <ReAlert
          v-if="!result.success && !result.stderr"
          type="info"
          title="命令没有返回错误输出。若反复失败，请到「日志」页查看 error 日志确认现场。"
        />
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  reloadNginx,
  restartNginx,
  startNginx,
  stopNginx,
  testNginx,
  type NginxCommandResult,
} from "../../nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
  /** 当前运行状态，RUNNING / STOPPED / UNKNOWN */
  running?: string;
}>();

const emit = defineEmits<{
  /** 任一操作结束后通知父级刷新总览 */
  (e: "changed"): void;
}>();

/** 正在执行的操作 */
const busy = ref("");
/** 最近一次结果 */
const result = ref<NginxCommandResult | null>(null);
const resultVisible = ref(false);

const isRunning = computed(() => props.running === "RUNNING");

/** 操作提示：把"这个按钮现在该点哪个"直接写在按钮旁边 */
const tipText = computed(() => {
  if (!props.datasourceId) {
    return "请先选择数据源";
  }
  if (props.running === "STOPPED") {
    return "当前已停止：点「启动」拉起；「重载」对停止中的实例无效";
  }
  if (props.running === "UNKNOWN") {
    return "未检测到运行中的进程，可能是 SSH 用户无权执行 pgrep";
  }
  return "改了配置先「校验」，通过后「重载」生效；「重启」会中断连接";
});

const resultTitle = computed(() =>
  busy.value ? `${labelOf(busy.value)}结果` : "操作结果",
);

function labelOf(op: string): string {
  return (
    {
      test: "语法检查",
      reload: "重载",
      restart: "重启",
      start: "启动",
      stop: "停止",
    }[op] || op
  );
}

/** 各操作的说明，用于二次确认文案 */
const CONFIRM: Record<string, { title: string; body: string; danger: boolean }> = {
  restart: {
    title: "确认重启 Nginx？",
    body: "重启会先让旧进程处理完手上的请求再退出，然后重新拉起。期间新连接可能短暂失败。",
    danger: false,
  },
  stop: {
    title: "确认停止 Nginx？",
    body: "停止后该主机上的所有站点立即不可访问，且不会自动恢复。确认该主机没有关键流量后再操作。",
    danger: true,
  },
};

async function confirmThen(op: "restart" | "stop") {
  const c = CONFIRM[op];
  if (!c) {
    return;
  }
  try {
    await ElMessageBox.confirm(c.body, c.title, {
      type: c.danger ? "warning" : "info",
      confirmButtonText: `确认${labelOf(op)}`,
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  await run(op);
}

async function run(op: "test" | "reload" | "restart" | "start" | "stop") {
  if (!props.datasourceId) {
    ElMessage.warning("请先选择数据源");
    return;
  }
  busy.value = op;
  const call = {
    test: testNginx,
    reload: reloadNginx,
    restart: restartNginx,
    start: startNginx,
    stop: stopNginx,
  }[op];
  try {
    const r = await call(props.datasourceId);
    result.value = r;
    resultVisible.value = true;
    if (r.success) {
      ElMessage.success(r.message);
    } else {
      ElMessage.error(r.message);
    }
    emit("changed");
  } catch (e) {
    ElMessage.error(`${labelOf(op)}失败：${(e as Error).message}`);
  } finally {
    busy.value = "";
  }
}

defineExpose({
  /** 供父组件在保存配置后触发校验 */
  run,
});
</script>

<style scoped lang="scss">
.ngx-lifecycle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ngx-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngx-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ngx-result-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--el-border-radius-base, 6px);
  font-size: 13px;
  font-weight: 500;

  &.is-ok {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  &.is-err {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
}

.ngx-result-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ngx-result-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngx-result-pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 240px;
  overflow: auto;
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;

  &.is-err {
    color: var(--el-color-danger);
  }
}
</style>
