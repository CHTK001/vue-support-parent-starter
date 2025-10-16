<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center gap-3">
      <el-input v-model="q.imageName" placeholder="镜像名称" clearable style="width:220px" @change="reload" />
      <el-input-number v-model="q.serverId" :min="0" placeholder="服务器ID" @change="reload" />
      <el-input-number v-model="q.softId" :min="0" placeholder="软件ID" @change="reload" />
      <el-select v-model="q.status" placeholder="状态" clearable style="width:140px" @change="reload">
        <el-option label="available" value="available" />
        <el-option label="running" value="running" />
        <el-option label="error" value="error" />
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
      row-key="systemSoftImageId"
      :pagination="{ pageSize: 10 }"
    />

    <ScDialog v-model:visible="startVisible" title="创建容器配置(JSON)" width="720px">
      <el-input v-model="createConfigJson" type="textarea" :rows="14" />
      <template #footer>
        <el-button @click="startVisible=false">取消</el-button>
        <el-button type="primary" @click="doCreateContainer">创建</el-button>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const pageUrl = "/api/monitor/system-soft-image/page";
const baseUrl = "/api/monitor/system-soft-image";

const tableRef = ref();
const q = ref<{ imageName?: string; serverId?: number; softId?: number; status?: string }>({});
const tableQuery = computed(() => ({ page: 1, size: 10, ...q.value }));

function reload() { tableRef.value?.reload?.(); }

const columns = [
  { label: "服务器", prop: "systemSoftImageServerName", minWidth: 160 },
  { label: "镜像", prop: "systemSoftImageName", minWidth: 180 },
  { label: "标签", prop: "systemSoftImageTag", width: 120 },
  { label: "大小", prop: "systemSoftImageSize", width: 120 },
  { label: "创建时间", prop: "systemSoftImageCreated", minWidth: 180 },
  { label: "状态", prop: "systemSoftImageStatus", width: 120 },
  {
    label: "操作",
    fixed: "right",
    width: 320,
    slot: ({ row }: any) => (
      <div class="flex gap-2">
        <el-button size="small" type="primary" onClick={() => openStart(row)}>
          <IconifyIconOnline icon="mdi:play-circle" /> 启动容器
        </el-button>
        <el-button size="small" type="danger" plain onClick={() => onRemove(row)}>
          <IconifyIconOnline icon="mdi:trash-can-outline" /> 删除镜像
        </el-button>
      </div>
    )
  }
];

const startVisible = ref(false);
const currentImage = ref<any>();
const createConfigJson = ref<string>(`{\n  \"name\": \"container-1\",\n  \"env\": {},\n  \"ports\": [\n    {\n      \"containerPort\": 80,\n      \"hostPort\": 8080\n    }\n  ],\n  \"volumes\": []\n}`);

function openStart(row: any) {
  currentImage.value = row;
  startVisible.value = true;
}

async function doCreateContainer() {
  try {
    const body = createConfigJson.value ? JSON.parse(createConfigJson.value) : undefined;
    const resp = await fetch(`${baseUrl}/${currentImage.value.systemSoftImageId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const data = await resp.json();
    if (data?.ok || data?.code === 0) {
      ElMessage.success("创建已启动");
      startVisible.value = false;
    } else {
      ElMessage.error(data?.msg || "创建失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "创建失败");
  }
}

async function onRemove(row: any) {
  await ElMessageBox.confirm(`确认删除镜像【${row.systemSoftImageFullName || row.systemSoftImageName}:${row.systemSoftImageTag}】?`, "提示", { type: "warning" });
  const resp = await fetch(`${baseUrl}/${row.systemSoftImageId}/image?force=false`, { method: "DELETE" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("删除成功");
    reload();
  } else {
    ElMessage.error(data?.msg || "删除失败");
  }
}
</script>
