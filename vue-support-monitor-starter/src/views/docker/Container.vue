<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center gap-3">
      <el-input v-model="q.containerName" placeholder="容器名称" clearable style="width:220px" @change="reload" />
      <el-input-number v-model="q.serverId" :min="0" placeholder="服务器ID" @change="reload" />
      <el-input-number v-model="q.softId" :min="0" placeholder="软件ID" @change="reload" />
      <el-select v-model="q.status" placeholder="状态" clearable style="width:140px" @change="reload">
        <el-option label="RUNNING" value="RUNNING" />
        <el-option label="STOPPED" value="STOPPED" />
        <el-option label="PAUSED" value="PAUSED" />
      </el-select>
      <el-button @click="reload">
        <IconifyIconOnline icon="mdi:refresh" /> 刷新
      </el-button>
    </div>

    <ScTable
      ref="tableRef"
      :url="pageUrl"
      :query="tableQuery"
      :columns="columns"
      row-key="systemSoftContainerId"
      :pagination="{ pageSize: 10 }"
    />

    <!-- 日志查看 -->
    <ScDialog v-model:visible="logVisible" title="容器日志" width="900px">
      <log-view :logs="logs" style="height:520px" />
      <template #footer>
        <el-button @click="logVisible=false">关闭</el-button>
        <el-button type="primary" @click="refreshLogs">刷新</el-button>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const pageUrl = "/api/monitor/system-soft-container/page";
const baseUrl = "/api/monitor/system-soft-container";

const tableRef = ref();
const q = ref<{ containerName?: string; serverId?: number; softId?: number; status?: string }>({});
const tableQuery = computed(() => ({ page: 1, size: 10, ...q.value }));

function reload() { tableRef.value?.reload?.(); }

const columns = [
  { label: "容器", prop: "systemSoftContainerName", minWidth: 180 },
  { label: "服务器ID", prop: "systemServerId", width: 120 },
  { label: "软件ID", prop: "systemSoftId", width: 120 },
  { label: "状态", prop: "systemSoftContainerStatus", width: 120 },
  { label: "镜像", prop: "systemSoftContainerImage", minWidth: 200 },
  {
    label: "操作",
    fixed: "right",
    width: 420,
    slot: ({ row }: any) => (
      <div class="flex gap-2">
        <el-button size="small" type="success" plain onClick={() => onStart(row)}>
          <IconifyIconOnline icon="mdi:play" /> 启动
        </el-button>
        <el-button size="small" type="warning" plain onClick={() => onStop(row)}>
          <IconifyIconOnline icon="mdi:pause" /> 停止
        </el-button>
        <el-button size="small" type="primary" plain onClick={() => onRestart(row)}>
          <IconifyIconOnline icon="mdi:restart" /> 重启
        </el-button>
        <el-button size="small" onClick={() => openLogs(row)}>
          <IconifyIconOnline icon="mdi:script-text" /> 日志
        </el-button>
        <el-button size="small" type="danger" plain onClick={() => onRemove(row)}>
          <IconifyIconOnline icon="mdi:trash-can-outline" /> 删除
        </el-button>
      </div>
    )
  }
];

async function onStart(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftContainerId}/start`, { method: "POST" });
  const data = await resp.json();
  data?.ok || data?.code === 0 ? ElMessage.success("启动成功") : ElMessage.error(data?.msg || "启动失败");
  reload();
}
async function onStop(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftContainerId}/stop`, { method: "POST" });
  const data = await resp.json();
  data?.ok || data?.code === 0 ? ElMessage.success("停止成功") : ElMessage.error(data?.msg || "停止失败");
  reload();
}
async function onRestart(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftContainerId}/restart`, { method: "POST" });
  const data = await resp.json();
  data?.ok || data?.code === 0 ? ElMessage.success("重启成功") : ElMessage.error(data?.msg || "重启失败");
  reload();
}
async function onRemove(row: any) {
  await ElMessageBox.confirm(`确认删除容器【${row.systemSoftContainerName}】?`, "提示", { type: "warning" });
  const resp = await fetch(`${baseUrl}/${row.systemSoftContainerId}/container?force=false`, { method: "DELETE" });
  const data = await resp.json();
  data?.ok || data?.code === 0 ? ElMessage.success("删除成功") : ElMessage.error(data?.msg || "删除失败");
  reload();
}

const logVisible = ref(false);
const currentContainer = ref<any>();
const logs = ref<string>("");
function openLogs(row: any) {
  currentContainer.value = row;
  logVisible.value = true;
  refreshLogs();
}
async function refreshLogs() {
  if (!currentContainer.value) return;
  const resp = await fetch(`${baseUrl}/${currentContainer.value.systemSoftContainerId}/logs?lines=500`);
  const data = await resp.json();
  logs.value = data?.data || "";
}
</script>
