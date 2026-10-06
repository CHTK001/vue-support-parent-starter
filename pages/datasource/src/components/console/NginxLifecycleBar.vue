<template>
  <div class="ngx-lifecycle">
    <ReButton  :loading="busy === 'test'" @click="run('test')">
      <template #icon><ReIcon name="CircleCheck" :size="14" /></template>
      校验配置
    </ReButton>

    <!-- 生命周期按钮按真实状态显示：停止中的实例不该出现「重载/重启/停止」，
         运行中的实例不该出现「启动」。原来 5 个按钮无条件全渲染，且
         isRunning 算了却没用上。UNKNOWN 视为「未运行」，保留「启动」兜底。 -->
    <ReButton
      v-if="canReload"
      
      type="primary"
      :loading="busy === 'reload'"
      @click="run('reload')"
    >
      <template #icon><ReIcon name="Refresh" :size="14" /></template>
      重载
    </ReButton>

    <ReButton v-if="canRestart"  :loading="busy === 'restart'" @click="confirmThen('restart')">
      <template #icon><ReIcon name="RefreshRight" :size="14" /></template>
      重启
    </ReButton>

    <ReButton v-if="canStart"  :loading="busy === 'start'" @click="run('start')">
      <template #icon><ReIcon name="VideoPlay" :size="14" /></template>
      启动
    </ReButton>

    <ReButton
      v-if="canStop"
      
      type="danger"
      :loading="busy === 'stop'"
      @click="confirmThen('stop')"
    >
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

    <!-- 权限/托管告警：只在「停止或启动没能生效」时出现。
         这两种情况用户点一次按钮看不出来，只会以为按钮坏了，
         所以把原因和修法直接摆出来，而不是等他自己去翻日志。 -->
    <ReAlert
      v-if="blockedHint"
      class="ngx-perm-alert"
      type="warning"
      :title="blockedHint.title"
      :description="blockedHint.detail"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import { ReAlert } from "@repo/ui/re-kit";
import {
  reloadNginx,
  restartNginx,
  startNginx,
  stopNginx,
  testNginx,
  type NginxCommandResult,
} from "../../api/nginx/api";

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

/* 各操作的可用性：完全由 running 决定，避免出现「点得动但必然失败」的按钮。
   reload / restart / stop 需要一个活着的 master 进程；
   start 只在没跑起来时才有意义（STOPPED 明确停止、UNKNOWN 没探到进程）。 */
const canReload = computed(() => isRunning.value);
const canRestart = computed(() => isRunning.value);
const canStop = computed(() => isRunning.value);
const canStart = computed(() => !isRunning.value);

/** 操作提示：把"这个按钮现在该点哪个"直接写在按钮旁边 */
const tipText = computed(() => {
  if (!props.datasourceId) {
    return "请先选择数据源";
  }
  if (props.running === "STOPPED") {
    return "当前已停止：只有「启动」可用，拉起后再校验与重载";
  }
  if (props.running === "UNKNOWN") {
    return "未检测到运行中的进程（可能是 SSH 用户无权 pgrep）：可先「启动」";
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

/**
 * 「停止/启动没能生效」的告警。
 *
 * <p>这类情况点一次按钮看不出来：按钮不报错、弹窗也只是干巴巴一句
 * 「已发送停止信号」，用户只会以为按钮坏了。真正的原因有两个，都得说清楚：</p>
 *
 * <ol>
 *   <li><b>缺少 sudo 权限</b>：nginx 由 systemd 托管时，停止必须走
 *       {@code systemctl stop}，那要改系统级服务状态。数据源的 SSH 用户
 *       （如 {@code kali}）默认没有免密 sudo，于是只能退回发信号，
 *       而单元配了 {@code Restart=always} 会把 nginx 立刻拉回——
 *       表现为「停了但没停住」。</li>
 *   <li><b>托管者自动重启</b>：权限没问题，但单元配了自动重启策略。</li>
 * </ol>
 *
 * <p>只根据后端返回的文案判定，不自己猜——后端已经如实写明了原因，
 * 这里只负责把它翻译成人能照着做的步骤。</p>
 */
const blockedHint = computed<{ title: string; detail: string } | null>(() => {
  const r = result.value;
  if (!r) {
    return null;
  }
  const text = `${r.message || ""} ${r.stderr || ""}`;
  // 权限不足：sudo 被拒 / 需要交互式认证
  if (/sudo|permission denied|access denied|requires interactive|not permitted/i.test(text)) {
    return {
      title: "停止/启动未生效：SSH 用户缺少 systemctl 的免密 sudo 权限",
      detail:
        `nginx 由 systemd 托管时，启停必须走 systemctl（那是系统级操作），`
        + `而数据源配置的 SSH 用户没有免密权限，控制台只能退回发信号的方式；`
        + `若该单元配了 Restart=always，nginx 会被立刻拉回，表现为「停了没停住」。`
        + `修复：在目标主机上为该用户加一条限定的免密规则，例如 `
        + `echo 'kali ALL=(root) NOPASSWD: /usr/bin/systemctl start,stop,restart ngx-console' | sudo tee /etc/sudoers.d/ngx-console，`
        + `并执行 sudo chmod 0440 /etc/sudoers.d/ngx-console。`
        + `只放行这一个单元的启停即可，不要图省事写 NOPASSWD: ALL。`,
    };
  }
  // 权限没问题，是托管者把它拉回来了
  if (/仍未退出|尚未退出|Restart=always|进程管理器|守护/.test(text)) {
    return {
      title: "停止未生效：nginx 被进程管理器自动拉回",
      detail:
        `控制台已经成功向 nginx 发出停止信号，但托管它的 systemd 单元配了自动重启`
        + `（Restart=always 之类），几秒后就把 nginx 重新拉起了——所以接口只能如实`
        + `报告「已发信号但未退出」，而不是谎报成功。`
        + `两种处理：① 保持崩溃自愈，给控制台的 SSH 用户加该单元的免密 systemctl 权限`
        + `（见后端日志）；② 完全交给控制台管，把该单元改为 Restart=no。`,
    };
  }
  return null;
});

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

/* 告警独占一行：.ngx-lifecycle 是 flex 容器，不换行会被挤到按钮右边，
   而正文是一整段可照着做的操作步骤，挤在一行里根本读不下去 */
.ngx-perm-alert {
  flex-basis: 100%;
  margin-top: 8px;

  :deep(.el-alert__description) {
    line-height: 1.7;
    word-break: break-word;
  }
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
  font-variant-numeric: tabular-nums;
  white-space: pre-wrap;
  word-break: break-all;

  &.is-err {
    color: var(--el-color-danger);
  }
}
</style>
