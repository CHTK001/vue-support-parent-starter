<template>
  <div class="agents-view">
    <div class="page-header">
      <div>
        <div class="page-title">被控端</div>
        <div class="page-sub">已注册的被控端列表（后端接口接入后实时刷新）</div>
      </div>
      <ReButton type="primary" @click="refresh">刷新</ReButton>
    </div>

    <ReTable :data="agents" :columns="columns" style="width: 100%">
      <template #type="{ row }">
        <ReTag :type="typeTag(row.agentType)" size="small">{{ row.agentType }}</ReTag>
      </template>
      <template #desktop="{ row }">
        <ReTag :type="row.desktopSupported ? 'success' : 'info'" size="small">
          {{ row.desktopSupported ? "支持" : "无桌面" }}
        </ReTag>
      </template>
      <template #status="{ row }">
        <ReTag :type="row.status === '在线' ? 'success' : 'info'" size="small">
          {{ row.status }}
        </ReTag>
      </template>
      <template #action="{ row }">
        <ReButton size="small" type="primary" link @click="gotoRemote(row)">远控</ReButton>
        <ReButton size="small" type="danger" link @click="remove(row)">移除</ReButton>
      </template>
    </ReTable>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";

interface AgentRow {
  id: string;
  agentType: string;
  platform: string;
  desktopSupported: boolean;
  status: string;
  sshHost: string;
}

const router = useRouter();
const agents = ref<AgentRow[]>([]);

const typeTag = (t: string) => (t === "PUSH" ? "warning" : "primary");

const columns = [
  { prop: "id", label: "被控端 ID", minWidth: 140 },
  { prop: "agentType", label: "类型", width: 100, slot: "type" },
  { prop: "platform", label: "平台", width: 110 },
  { prop: "desktopSupported", label: "桌面支持", width: 100, slot: "desktop" },
  { prop: "status", label: "状态", width: 90, slot: "status" },
  { prop: "sshHost", label: "SSH 地址", minWidth: 140 },
  { label: "操作", width: 140, fixed: "right", slot: "action" },
];

/** 刷新（真实后端接口 GET /api/remote/agents） */
const refresh = async () => {
  try {
    const resp = await fetch("/api/remote/agents");
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        agents.value = data;
        ElMessage.success("已刷新");
        return;
      }
    }
  } catch {
    /* 后端不可达 */
  }
  agents.value = [];
  ElMessage.warning("后端不可达，请检查后端服务");
};

const gotoRemote = (row: AgentRow) => {
  router.push({ path: "/remote", query: { agentId: row.id } });
};

const remove = async (row: AgentRow) => {
  agents.value = agents.value.filter((a) => a.id !== row.id);
  try {
    await fetch("/api/remote/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agents.value),
    });
  } catch {
    /* 后端不可达——仅本地 */
  }
  ElMessage.info(`已移除：${row.id}`);
};

onMounted(refresh);
</script>

<style lang="scss" scoped>
.agents-view {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
}

.page-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
</style>
