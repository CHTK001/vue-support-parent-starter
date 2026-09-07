<template>
  <div class="agents-view">
    <div class="page-header">
      <div>
        <div class="page-title">被控端</div>
        <div class="page-sub">已注册的被控端列表（后端接口接入后实时刷新）</div>
      </div>
      <el-button type="primary" @click="refresh">刷新</el-button>
    </div>

    <el-table :data="agents" border stripe style="width: 100%">
      <el-table-column prop="id" label="被控端 ID" min-width="140" />
      <el-table-column prop="agentType" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.agentType)" size="small">{{ row.agentType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="platform" label="平台" width="110" />
      <el-table-column prop="desktopSupported" label="桌面支持" width="100">
        <template #default="{ row }">
          <el-tag :type="row.desktopSupported ? 'success' : 'info'" size="small">
            {{ row.desktopSupported ? "支持" : "无桌面" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '在线' ? 'success' : 'info'" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sshHost" label="SSH 地址" min-width="140" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="gotoRemote(row)">
            远控
          </el-button>
          <el-button size="small" type="danger" link @click="remove(row)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

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

/** 刷新（当前为示例数据；后端接口由 #5 接入后改为 fetch） */
const refresh = () => {
  agents.value = [
    {
      id: "shell-agent1",
      agentType: "SHELL",
      platform: "Linux",
      desktopSupported: false,
      status: "在线",
      sshHost: "124.221.230.112:22",
    },
    {
      id: "push-agent1",
      agentType: "PUSH",
      platform: "Windows",
      desktopSupported: true,
      status: "在线",
      sshHost: "-",
    },
  ];
  ElMessage.success("已刷新（示例数据）");
};

const gotoRemote = (row: AgentRow) => {
  router.push({ path: "/remote", query: { agentId: row.id } });
};

const remove = (row: AgentRow) => {
  agents.value = agents.value.filter((a) => a.id !== row.id);
  ElMessage.info(`已移除（本地示例）：${row.id}`);
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
