<template>
  <SoftWorkspace title="操作记录">
    <template #actions>
      <el-tooltip content="刷新记录" placement="top">
        <el-button circle @click="loadRecords">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </el-tooltip>
    </template>

    <el-table v-loading="loading" :data="records" border>
      <el-table-column prop="softOperationLogId" label="记录ID" width="100" />
      <el-table-column prop="softInstallationId" label="实例ID" width="100" />
      <el-table-column prop="operationType" label="操作类型" width="150" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <SoftStatusTag :status="row.operationStatus" />
        </template>
      </el-table-column>
      <el-table-column prop="operationStage" label="阶段" width="140" />
      <el-table-column prop="progressPercent" label="进度" width="100" />
      <el-table-column prop="operationMessage" label="执行说明" min-width="240" show-overflow-tooltip />
      <el-table-column prop="startTime" label="开始时间" min-width="170" />
      <el-table-column prop="endTime" label="结束时间" min-width="170" />
      <el-table-column fixed="right" label="操作" width="120">
        <template #default="{ row }">
          <el-tooltip content="查看操作流" placement="top">
            <el-button circle type="primary" @click="openStream(row)">
              <IconifyIconOnline icon="ri:article-line" />
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="drawerVisible" title="操作流" size="46%">
      <div class="record-stream">
        <div class="record-stream__header">
          <div>
            <strong>记录 #{{ currentRecord?.softOperationLogId }}</strong>
            <p>{{ currentRecord?.operationType }} · {{ currentRecord?.operationMessage }}</p>
          </div>
          <SoftStatusTag :status="operationLatest?.status || currentRecord?.operationStatus" />
        </div>

        <el-progress
          :percentage="operationLatest?.progressPercent || currentRecord?.progressPercent || 0"
          :status="operationLatest?.status === 'FAILED' ? 'exception' : operationLatest?.status === 'SUCCESS' ? 'success' : undefined"
        />

        <el-alert
          v-if="streamState.error"
          :title="streamState.error"
          type="error"
          :closable="false"
        />

        <el-scrollbar height="320px" class="record-stream__body">
          <pre>{{ activeOutput }}</pre>
        </el-scrollbar>

        <el-divider>事件历史</el-divider>

        <div class="record-stream__history">
          <article
            v-for="(item, index) in operationEvents"
            :key="`${item.timestamp}-${index}`"
          >
            <header>
              <span>{{ item.event }}</span>
              <SoftStatusTag :status="item.data.status || currentRecord?.operationStatus" />
            </header>
            <p>{{ item.data.detail || item.data.message || item.data.line || "-" }}</p>
          </article>
        </div>
      </div>
    </el-drawer>
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { SoftTopics } from "@repo/core";
import {
  listSoftOperationLogs,
  type SoftRealtimeEnvelope,
  type SoftOperationLog,
} from "../api";
import { useSoftOperationStream } from "../composables/useSoftOperationStream";
import { useSoftSocketService } from "../composables/useSoftSocketService";
import SoftStatusTag from "../components/SoftStatusTag.vue";
import SoftWorkspace from "../components/SoftWorkspace.vue";

const loading = ref(false);
const drawerVisible = ref(false);
const records = ref<SoftOperationLog[]>([]);
const currentRecord = ref<SoftOperationLog | null>(null);
const socket = useSoftSocketService();
const pageLevelUnsubscribers: Array<() => void> = [];
let recordPollTimer: number | undefined;
const {
  state: streamStateRef,
  latest: operationLatestRef,
  events: operationEventsRef,
  lines: operationLinesRef,
  connect,
  disconnect,
} = useSoftOperationStream();

const streamState = computed(() => streamStateRef.value);
const operationLatest = computed(() => operationLatestRef.value);
const operationEvents = computed(() => operationEventsRef.value);

const formatEventTime = (value?: string | number) => {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const isFinishedStatus = (status?: string) => status === "SUCCESS" || status === "FAILED";

const sortRecords = (items: SoftOperationLog[]) =>
  [...items].sort(
    (left, right) => (Number(right.softOperationLogId) || 0) - (Number(left.softOperationLogId) || 0),
  );

const mergeOutput = (current: string | undefined, append: string | undefined) => {
  if (!append) {
    return current;
  }
  if (!current) {
    return append;
  }
  return current.includes(append) ? current : `${current}\n${append}`;
};

const upsertRecord = (patch: SoftOperationLog) => {
  if (!patch.softOperationLogId) {
    return;
  }
  const index = records.value.findIndex(
    item => item.softOperationLogId === patch.softOperationLogId,
  );
  if (index < 0) {
    records.value = sortRecords([patch, ...records.value]);
  } else {
    const current = records.value[index];
    const next = {
      ...current,
      ...patch,
      operationOutput: mergeOutput(current.operationOutput, patch.operationOutput),
      detailMessage: patch.detailMessage || current.detailMessage,
      operationMessage: patch.operationMessage || current.operationMessage,
      startTime: current.startTime || patch.startTime,
      endTime: patch.endTime || current.endTime,
    };
    records.value = records.value.map((item, itemIndex) => (itemIndex === index ? next : item));
  }
  if (currentRecord.value?.softOperationLogId === patch.softOperationLogId) {
    currentRecord.value = {
      ...currentRecord.value,
      ...patch,
      operationOutput: mergeOutput(currentRecord.value.operationOutput, patch.operationOutput),
      detailMessage: patch.detailMessage || currentRecord.value.detailMessage,
      operationMessage: patch.operationMessage || currentRecord.value.operationMessage,
      startTime: currentRecord.value.startTime || patch.startTime,
      endTime: patch.endTime || currentRecord.value.endTime,
    };
  }
};

const handleRealtimeRecord = (message: unknown) => {
  const envelope = message as SoftRealtimeEnvelope;
  const operationId = Number(envelope.data?.operationId || envelope.dataId || 0);
  if (!operationId) {
    return;
  }
  const status = envelope.data?.status;
  const eventTime = formatEventTime(envelope.timestamp);
  upsertRecord({
    softOperationLogId: operationId,
    softInstallationId: envelope.data?.installationId,
    operationType: envelope.data?.operationType,
    operationStatus: status,
    operationStage: envelope.data?.stage,
    progressPercent: envelope.data?.progressPercent,
    operationMessage: envelope.data?.message,
    detailMessage: envelope.data?.detail || envelope.data?.message,
    operationOutput: envelope.data?.line || envelope.data?.detail,
    startTime: eventTime,
    endTime: isFinishedStatus(status) ? eventTime : undefined,
  });
};

const bindRecordRealtime = () => {
  while (pageLevelUnsubscribers.length) {
    pageLevelUnsubscribers.pop()?.();
  }
  [
    SoftTopics.EVENTS.OPERATION_UPDATE,
    SoftTopics.EVENTS.INSTALL_PROGRESS,
    SoftTopics.EVENTS.INSTALL_LOG,
  ].forEach(eventName => {
    pageLevelUnsubscribers.push(
      socket.subscribe(SoftTopics.MODULE, eventName, handleRealtimeRecord),
    );
  });
};

const activeOutput = computed(() => {
  if (operationLinesRef.value.length) {
    return operationLinesRef.value.join("\n");
  }
  return (
    operationLatest.value?.detail ||
    operationLatest.value?.message ||
    currentRecord.value?.operationOutput ||
    "等待服务器推送操作事件..."
  );
});

const loadRecords = async () => {
  loading.value = true;
  try {
    const result = await listSoftOperationLogs();
    records.value = sortRecords(result.data || []);
    if (currentRecord.value?.softOperationLogId) {
      currentRecord.value =
        records.value.find(item => item.softOperationLogId === currentRecord.value?.softOperationLogId) || currentRecord.value;
    }
  } finally {
    loading.value = false;
  }
};

const clearRecordPoller = () => {
  if (recordPollTimer) {
    window.clearInterval(recordPollTimer);
    recordPollTimer = undefined;
  }
};

const startRecordPoller = () => {
  clearRecordPoller();
  recordPollTimer = window.setInterval(() => {
    if (!document.hidden) {
      void loadRecords();
    }
  }, 3000);
};

const openStream = (row: SoftOperationLog) => {
  currentRecord.value = row;
  drawerVisible.value = true;
  if (row.softOperationLogId) {
    connect(row.softOperationLogId);
  }
};

watch(drawerVisible, (visible) => {
  if (!visible) {
    disconnect();
    currentRecord.value = null;
  }
});

watch(
  () => operationLatest.value?.finished,
  async (finished) => {
    if (finished) {
      await loadRecords();
    }
  },
);

onMounted(loadRecords);
onMounted(bindRecordRealtime);
onMounted(startRecordPoller);
onUnmounted(() => {
  clearRecordPoller();
  while (pageLevelUnsubscribers.length) {
    pageLevelUnsubscribers.pop()?.();
  }
});
</script>

<style scoped lang="scss">
.record-stream {
  display: grid;
  gap: 16px;
}

.record-stream__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.record-stream__header strong,
.record-stream__header p {
  display: block;
  margin: 0;
}

.record-stream__header p {
  color: #64748b;
  margin-top: 6px;
}

.record-stream__body {
  padding: 18px;
  border-radius: 18px;
  background: #020617;
  color: #dbeafe;
}

.record-stream__body pre {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.record-stream__history {
  display: grid;
  gap: 12px;
}

.record-stream__history article {
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.86);
}

.record-stream__history header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.record-stream__history p {
  margin: 0;
  color: #475569;
}
</style>
