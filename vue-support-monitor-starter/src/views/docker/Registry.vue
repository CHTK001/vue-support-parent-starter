<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold flex items-center gap-2">
        <IconifyIconOnline icon="ri:docker-fill" /> 软件仓库
      </h2>
      <el-button v-role="'admin'" type="primary" @click="openEdit()">
        <IconifyIconOnline icon="mdi:plus" /> 新增仓库
      </el-button>
    </div>

    <ScTable
      ref="tableRef"
      :url="registryPageUrl"
      :query="query"
      :columns="columns"
      row-key="systemSoftRegistryId"
      :pagination="{ pageSize: 10 }"
    />

    <ScDialog v-model:visible="editVisible" title="仓库配置" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="systemSoftRegistryName">
          <el-input v-model="form.systemSoftRegistryName" placeholder="如: DockerHub" />
        </el-form-item>
        <el-form-item label="类型" prop="systemSoftRegistryType">
          <el-select v-model="form.systemSoftRegistryType" placeholder="选择仓库类型">
            <el-option label="DockerHub" value="dockerhub" />
            <el-option label="Harbor" value="harbor" />
            <el-option label="Aliyun" value="aliyun" />
            <el-option label="GitHub" value="github" />
            <el-option label="GCR" value="gcr" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="systemSoftRegistryUrl">
          <el-input v-model="form.systemSoftRegistryUrl" placeholder="https://registry.example.com" />
        </el-form-item>
        <el-form-item label="用户名" prop="systemSoftRegistryUsername">
          <el-input v-model="form.systemSoftRegistryUsername" />
        </el-form-item>
        <el-form-item label="密码" prop="systemSoftRegistryPassword">
          <el-input v-model="form.systemSoftRegistryPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.systemSoftRegistryEnable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

const registryPageUrl = "/v1/system/soft/registry/page";
const baseUrl = "/v1/system/soft/registry";

const tableRef = ref();
const query = reactive({ page: 1, size: 10 });

const columns = [
  { label: "名称", prop: "systemSoftRegistryName", minWidth: 180 },
  { label: "类型", prop: "systemSoftRegistryType", width: 120 },
  { label: "地址", prop: "systemSoftRegistryUrl", minWidth: 220 },
  {
    label: "默认",
    prop: "systemSoftRegistryDefault",
    width: 80,
    formatter: (_: any, __: any, row: any) => (row.systemSoftRegistryDefault ? "是" : "否")
  },
  {
    label: "启用",
    prop: "systemSoftRegistryEnable",
    width: 80,
    formatter: (_: any, __: any, row: any) => (row.systemSoftRegistryEnable ? "是" : "否")
  },
  {
    label: "操作",
    fixed: "right",
    width: 360,
    slot: ({ row }: any) => (
      <div class="flex gap-2">
        <el-button size="small" onClick={() => onSync(row)}>
          <IconifyIconOnline icon="mdi:sync" /> 同步
        </el-button>
        <el-button size="small" onClick={() => onTest(row)}>
          <IconifyIconOnline icon="mdi:lan-connect" /> 测试
        </el-button>
        <el-button size="small" type="success" plain onClick={() => onSetDefault(row)}>
          <IconifyIconOnline icon="mdi:star" /> 设为默认
        </el-button>
        <el-button v-role="'admin'" size="small" type="primary" plain onClick={() => openEdit(row)}>
          <IconifyIconOnline icon="mdi:pencil" /> 编辑
        </el-button>
        <el-button v-role="'admin'" size="small" type="danger" plain onClick={() => onDelete(row)}>
          <IconifyIconOnline icon="mdi:delete-outline" /> 删除
        </el-button>
      </div>
    )
  }
];

const editVisible = ref(false);
const formRef = ref();
const form = reactive<any>({
  systemSoftRegistryId: undefined,
  systemSoftRegistryName: "",
  systemSoftRegistryType: "dockerhub",
  systemSoftRegistryUrl: "",
  systemSoftRegistryUsername: "",
  systemSoftRegistryPassword: "",
  systemSoftRegistryEnable: true
});

const rules = {
  systemSoftRegistryName: [{ required: true, message: "必填", trigger: "blur" }],
  systemSoftRegistryType: [{ required: true, message: "必选", trigger: "change" }],
  systemSoftRegistryUrl: [{ required: true, message: "必填", trigger: "blur" }]
};

function reload() {
  tableRef.value?.reload?.();
}

function openEdit(row?: any) {
  if (row) Object.assign(form, row);
  else Object.assign(form, { systemSoftRegistryId: undefined, systemSoftRegistryType: "dockerhub", systemSoftRegistryEnable: true });
  editVisible.value = true;
}

async function onSubmit() {
  try {
    await formRef.value?.validate();
    const method = form.systemSoftRegistryId ? "PUT" : "POST";
    const url = form.systemSoftRegistryId ? `${baseUrl}/${form.systemSoftRegistryId}` : baseUrl;
    const resp = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await resp.json();
    if (data?.ok || data?.code === 0) {
      ElMessage.success("保存成功");
      editVisible.value = false;
      reload();
    } else {
      ElMessage.error(data?.msg || "保存失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  }
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除仓库【${row.systemSoftRegistryName}】?`, "提示", { type: "warning" });
  const resp = await fetch(`${baseUrl}/${row.systemSoftRegistryId}`, { method: "DELETE" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("删除成功");
    reload();
  } else {
    ElMessage.error(data?.msg || "删除失败");
  }
}

async function onSetDefault(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftRegistryId}/default`, { method: "POST" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("设置成功");
    reload();
  } else {
    ElMessage.error(data?.msg || "设置失败");
  }
}

async function onSync(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftRegistryId}/sync`, { method: "POST" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("已触发同步");
  } else {
    ElMessage.error(data?.msg || "同步失败");
  }
}

async function onTest(row: any) {
  const resp = await fetch(`${baseUrl}/${row.systemSoftRegistryId}/test`, { method: "POST" });
  const data = await resp.json();
  if (data?.ok || data?.code === 0) {
    ElMessage.success("连接正常");
  } else {
    ElMessage.error(data?.msg || "连接失败");
  }
}
</script>

<style scoped>
</style>
