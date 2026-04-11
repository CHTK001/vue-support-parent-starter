<template>
  <SoftWorkspace title="安装实例">
    <template #actions>
      <el-tooltip content="刷新实例" placement="top">
        <el-button circle @click="loadInstallations">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="操作记录" placement="top">
        <el-button circle @click="router.push('/soft/records')">
          <IconifyIconOnline icon="ri:file-list-3-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="去安装软件" placement="top">
        <el-button circle type="primary" @click="router.push('/soft/catalog')">
          <IconifyIconOnline icon="ri:download-cloud-2-line" />
        </el-button>
      </el-tooltip>
    </template>

    <article v-if="activeTicket" class="ticket-card">
      <div class="ticket-card__header">
        <div>
          <strong>当前票据 #{{ activeTicket.operationId }}</strong>
          <p>
            {{ activeTicket.operationType }} ·
            {{ operationLatest?.message || activeTicket.operationStatus }}
          </p>
        </div>
        <SoftStatusTag
          :status="operationLatest?.status || activeTicket.operationStatus"
        />
      </div>
      <el-progress
        :percentage="operationLatest?.progressPercent || 0"
        :status="
          operationLatest?.status === 'FAILED'
            ? 'exception'
            : operationLatest?.status === 'SUCCESS'
              ? 'success'
              : undefined
        "
      />
      <div class="ticket-card__meta">
        <span>阶段 {{ operationLatest?.stage || "-" }}</span>
        <span>实例 {{ activeTicket.installationId || "-" }}</span>
      </div>
      <p class="ticket-card__detail">
        {{ operationLatest?.detail || "等待操作输出..." }}
      </p>
      <div class="ticket-card__console">
        <pre>{{ operationConsoleText }}</pre>
      </div>
    </article>

    <el-table v-loading="loading" :data="installations" border>
      <el-table-column
        prop="installationName"
        label="实例名称"
        min-width="150"
      />
      <el-table-column prop="packageName" label="软件" min-width="140" />
      <el-table-column prop="versionName" label="版本" min-width="140" />
      <el-table-column prop="targetName" label="目标" min-width="140" />
      <el-table-column label="安装状态" width="120">
        <template #default="{ row }">
          <SoftStatusTag :status="row.installStatus" />
        </template>
      </el-table-column>
      <el-table-column label="运行状态" width="120">
        <template #default="{ row }">
          <SoftStatusTag :status="row.runtimeStatus" />
        </template>
      </el-table-column>
      <el-table-column
        prop="installPath"
        label="安装路径"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column prop="serviceName" label="服务名" min-width="140" />
      <el-table-column
        prop="lastOperationMessage"
        label="最近操作"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column fixed="right" label="操作" width="320">
        <template #default="{ row }">
          <el-space wrap>
            <el-tooltip content="查看详情" placement="top">
              <el-button
                circle
                :disabled="!row.softPackageId"
                @click="openDetail(row.softPackageId, row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:information-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="启动服务" placement="top">
              <el-button
                circle
                type="success"
                @click="runAction('start', row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="停止服务" placement="top">
              <el-button
                circle
                type="warning"
                @click="runAction('stop', row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:pause-circle-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="重启服务" placement="top">
              <el-button
                circle
                @click="runAction('restart', row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:restart-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="注册服务" placement="top">
              <el-button
                circle
                @click="runAction('register', row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:shield-check-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="检查状态" placement="top">
              <el-button
                circle
                @click="runAction('status', row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:pulse-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="卸载实例" placement="top">
              <el-button
                circle
                type="danger"
                @click="removeInstallation(row.softInstallationId)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </el-tooltip>
          </el-space>
        </template>
      </el-table-column>
    </el-table>
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  getSoftServiceStatus,
  listSoftInstallations,
  listSoftOperationLogs,
  registerSoftService,
  restartSoftService,
  startSoftService,
  stopSoftService,
  uninstallSoftPackage,
  type SoftInstallation,
  type SoftOperationLog,
  type SoftOperationTicket,
} from "../api";
import { useSoftOperationStream } from "../composables/useSoftOperationStream";
import SoftStatusTag from "../components/SoftStatusTag.vue";
import SoftWorkspace from "../components/SoftWorkspace.vue";

const router = useRouter();
const loading = ref(false);
const installations = ref<SoftInstallation[]>([]);
const activeTicket = ref<SoftOperationTicket | null>(null);
let operationPollTimer: number | undefined;

const {
  latest: operationLatestRef,
  lines: operationLinesRef,
  connect: connectOperation,
} = useSoftOperationStream();

const operationLatest = computed(() => operationLatestRef.value);
const operationConsoleText = computed(() => {
  if (operationLinesRef.value.length) {
    return operationLinesRef.value.join("\n");
  }
  return (
    operationLatest.value?.detail ||
    operationLatest.value?.message ||
    "等待操作输出..."
  );
});

const openDetail = (softPackageId?: number, installationId?: number) => {
  if (!softPackageId || !installationId) {
    return;
  }
  router.push(`/soft/detail/${softPackageId}?installationId=${installationId}`);
};

const isFinishedStatus = (status?: string) =>
  status === "SUCCESS" || status === "FAILED";

const clearOperationPoller = () => {
  if (operationPollTimer) {
    window.clearTimeout(operationPollTimer);
    operationPollTimer = undefined;
  }
};

const syncOperationRecord = (record?: SoftOperationLog | null) => {
  if (!record?.softOperationLogId) {
    return false;
  }
  operationLatestRef.value = {
    operationId: record.softOperationLogId,
    installationId: record.softInstallationId,
    operationType: record.operationType,
    status: record.operationStatus,
    stage: record.operationStage,
    progressPercent: record.progressPercent,
    message: record.operationMessage,
    detail:
      record.detailMessage || record.operationOutput || record.operationMessage,
    line: record.operationOutput,
    finished: isFinishedStatus(record.operationStatus),
  };
  return true;
};

const pollOperationRecord = async (operationId: number, remaining = 6) => {
  clearOperationPoller();
  if (remaining <= 0) {
    return;
  }
  try {
    const result = await listSoftOperationLogs();
    const record = (result.data || []).find(
      (item) => item.softOperationLogId === operationId,
    );
    if (
      syncOperationRecord(record) &&
      isFinishedStatus(record?.operationStatus)
    ) {
      await loadInstallations();
      return;
    }
  } finally {
    if (remaining > 1 && !operationLatestRef.value?.finished) {
      operationPollTimer = window.setTimeout(() => {
        void pollOperationRecord(operationId, remaining - 1);
      }, 1200);
    }
  }
};

const loadInstallations = async () => {
  loading.value = true;
  try {
    const result = await listSoftInstallations();
    installations.value = result.data || [];
  } finally {
    loading.value = false;
  }
};

const trackTicket = (
  ticket?: SoftOperationTicket | null,
  successText?: string,
) => {
  clearOperationPoller();
  activeTicket.value = ticket || null;
  operationLatestRef.value = ticket?.operationId
    ? {
        operationId: ticket.operationId,
        installationId: ticket.installationId,
        operationType: ticket.operationType,
        status: ticket.operationStatus,
        progressPercent: 0,
        message: ticket.operationStatus,
        detail: ticket.operationStatus,
        finished: false,
      }
    : null;
  if (ticket?.operationId) {
    connectOperation(ticket.operationId);
    void pollOperationRecord(ticket.operationId);
  }
  message(
    ticket?.operationId
      ? `${successText || "操作已提交"} #${ticket.operationId}`
      : successText || "操作已提交",
    { type: "success" },
  );
};

const runAction = async (
  type: "start" | "stop" | "restart" | "register" | "status",
  installationId?: number,
) => {
  if (!installationId) {
    return;
  }
  if (type === "status") {
    const result = await getSoftServiceStatus(installationId);
    trackTicket(result.data, "状态检查已提交");
  } else if (type === "start") {
    const result = await startSoftService(installationId);
    trackTicket(result.data, "启动命令已提交");
  } else if (type === "stop") {
    const result = await stopSoftService(installationId);
    trackTicket(result.data, "停止命令已提交");
  } else if (type === "restart") {
    const result = await restartSoftService(installationId);
    trackTicket(result.data, "重启命令已提交");
  } else {
    const result = await registerSoftService(installationId);
    trackTicket(result.data, "服务注册命令已提交");
  }
};

const removeInstallation = async (installationId?: number) => {
  if (!installationId) {
    return;
  }
  await ElMessageBox.confirm(
    "卸载会直接执行软件卸载脚本且不保留旧 soft 兼容记录。确认继续？",
    "卸载实例",
    {
      type: "warning",
    },
  );
  const result = await uninstallSoftPackage(installationId);
  trackTicket(result.data, "卸载命令已提交");
};

watch(
  () => operationLatest.value?.finished,
  async (finished) => {
    if (finished) {
      clearOperationPoller();
      await loadInstallations();
    }
  },
);

onMounted(loadInstallations);
onUnmounted(clearOperationPoller);
</script>

<style scoped lang="scss">
.ticket-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid rgba(14, 165, 233, 0.18);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(240, 249, 255, 0.92),
    rgba(226, 232, 240, 0.84)
  );
}

.ticket-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.ticket-card__header strong,
.ticket-card__header p {
  display: block;
  margin: 0;
}

.ticket-card__header p {
  color: #64748b;
  margin-top: 6px;
}

.ticket-card__detail {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.ticket-card__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 13px;
}

.ticket-card__console {
  padding: 16px;
  border-radius: 18px;
  background: #020617;
  color: #dbeafe;
}

.ticket-card__console pre {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}
</style>
