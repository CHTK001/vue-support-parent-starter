<template>
  <div class="soft-detail">
    <div class="header">
      <el-button @click="$router.back()">
        <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
        返回
      </el-button>
      <div class="title">
        {{ soft?.systemSoftName }}
        <span class="code">（{{ soft?.systemSoftCode }}）</span>
      </div>
      <div class="spacer" />
      <el-button type="primary" @click="openAddVersion">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        新增版本
      </el-button>
    </div>

    <el-descriptions v-if="soft" :column="3" border size="small" class="mb-3">
      <el-descriptions-item label="分类">{{ soft.systemSoftCategory }}</el-descriptions-item>
      <el-descriptions-item label="镜像">{{ soft.systemSoftImage }}</el-descriptions-item>
      <el-descriptions-item label="标签">
        <span v-for="tag in (soft.systemSoftTags || '').split(',').filter(Boolean)" :key="tag" class="tag">{{ tag }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="说明" :span="3">{{ soft.systemSoftDesc }}</el-descriptions-item>
    </el-descriptions>

    <el-card>
      <template #header>
        <div class="card-header"><span>版本信息</span></div>
      </template>
      <el-table :data="versionList" stripe>
        <el-table-column prop="version" label="版本" width="160" />
        <el-table-column prop="imageTag" label="镜像标签" width="220" />
        <el-table-column prop="downloadUrl" label="下载地址" />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openInstall(row)">安装</el-button>
            <el-button size="small" type="danger" @click="openUninstall(row)">卸载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="installVisible" title="安装软件" width="600px" destroy-on-close>
      <el-form :model="installForm">
        <el-form-item label="选择服务器">
          <el-select v-model="installForm.serverIds" multiple style="width: 100%" filterable placeholder="选择服务器">
            <el-option v-for="s in serverOptions" :key="s.id" :label="s.name + '(' + s.host + ')'" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装方式">
          <el-select v-model="installForm.method" placeholder="选择安装方式">
            <el-option label="Docker CLI" value="DOCKER_CLI" />
            <el-option label="Compose" value="COMPOSE" />
            <el-option label="Swarm" value="SWARM" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数(JSON)">
          <el-input v-model="installForm.params" type="textarea" :rows="6" placeholder='{"env":["TZ=Asia/Shanghai"],"ports":["8080:80"]}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="installVisible = false">取消</el-button>
        <el-button type="primary" :loading="installing" @click="doInstall">安装</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { message } from "@repo/utils";
import { getSoftVersionPageList, type SystemSoft, type SystemSoftVersion, installSoft } from "@/api/soft";
import { getServerPageList } from "@/api/server";

const route = useRoute();
const softId = Number(route.params.id);
const soft = ref<SystemSoft | null>(null);
const versionList = ref<SystemSoftVersion[]>([]);
const serverOptions = ref<any[]>([]);

const installVisible = ref(false);
const installing = ref(false);
const installForm = ref<{ systemSoftId: number; systemSoftVersionId?: number; serverIds: number[]; method?: string; params?: string }>({
  systemSoftId: softId,
  serverIds: [],
  method: "DOCKER_CLI",
  params: ""
});

const loadSoft = async () => {
  // 详情字段暂时以 card 页传参或后续新增详情接口
};

const loadVersions = async () => {
  const res = await getSoftVersionPageList({ page: 1, pageSize: 100, systemSoftId: softId });
  if (res.code === "00000") {
    versionList.value = res.data.records || [];
  }
};

const loadServers = async () => {
  const res = await getServerPageList({ page: 1, pageSize: 1000 });
  if (res.code === "00000") {
    const data = (res.data as any).data || res.data.records || [];
    serverOptions.value = data.map((it: any) => ({ id: it.id || it.monitorSysGenServerId, name: it.name || it.monitorSysGenServerName, host: it.host || it.monitorSysGenServerHost }));
  }
};

const openAddVersion = () => message.info("后续提供新增版本弹窗");

const openInstall = (row: SystemSoftVersion) => {
  installForm.value.systemSoftVersionId = row.systemSoftVersionId!;
  installVisible.value = true;
};

const openUninstall = (row: SystemSoftVersion) => {
  message.info("后续支持卸载");
};

const doInstall = async () => {
  if (!installForm.value.systemSoftVersionId || installForm.value.serverIds.length === 0) {
    return message.warning("请选择版本与服务器");
  }
  try {
    installing.value = true;
    const res = await installSoft({
      systemSoftId: softId,
      systemSoftVersionId: installForm.value.systemSoftVersionId!,
      serverIds: installForm.value.serverIds,
      method: installForm.value.method,
      params: installForm.value.params
    });
    if (res.code === "00000") {
      message.success("安装请求已提交");
      installVisible.value = false;
    }
  } finally {
    installing.value = false;
  }
};

onMounted(async () => {
  await loadSoft();
  await loadVersions();
  await loadServers();
});
</script>

<style scoped>
.soft-detail {
  padding: 16px;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.header .title {
  font-size: 16px;
  font-weight: 600;
}
.header .title .code {
  margin-left: 6px;
  color: #888;
  font-weight: 400;
}
.header .spacer {
  flex: 1;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tag {
  margin-right: 6px;
}
</style>
