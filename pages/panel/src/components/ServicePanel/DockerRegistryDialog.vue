<template>
  <div class="docker-registry">
    <div class="registry-header">
      <h4>Docker 仓库管理</h4>
      <ElButton type="primary" size="small" @click="openAddDialog">
        + 新增仓库
      </ElButton>
    </div>

    <div v-if="loading" class="registry-loading">
      <ElSkeleton :rows="3" animated />
    </div>

    <ElTable v-else :data="registries" style="width: 100%" stripe>
      <ElTableColumn prop="registryName" label="仓库名称" min-width="140" />
      <ElTableColumn prop="registryUrl" label="URL" min-width="180">
        <template #default="{ row }">
          <code style="font-size:12px">{{ row.registryUrl }}</code>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="namespace" label="命名空间" width="120" />
      <ElTableColumn prop="defaultFlag" label="默认" width="80" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.defaultFlag === 1" size="small" type="success">是</ElTag>
          <ElTag v-else size="small" type="info">否</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="enabled" label="状态" width="80" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.enabled === 1" size="small" type="success">启用</ElTag>
          <ElTag v-else size="small" type="danger">禁用</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="160" align="center">
        <template #default="{ row }">
          <ElButton size="small" text type="primary" @click="openEditDialog(row)">编辑</ElButton>
          <ElButton size="small" text type="danger" @click="handleDelete(row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- Add/Edit Dialog -->
    <ElDialog
      v-model="formVisible"
      :title="editingId ? '编辑仓库' : '新增仓库'"
      width="540px"
      :close-on-click-modal="false"
    >
      <ElForm ref="formRef" :model="form" label-width="100px" label-position="top">
        <ElFormItem label="仓库名称" prop="registryName" required>
          <ElInput v-model="form.registryName" placeholder="如 Docker Hub" />
        </ElFormItem>
        <ElFormItem label="URL" prop="registryUrl" required>
          <ElInput v-model="form.registryUrl" placeholder="如 https://registry.docker.io" />
        </ElFormItem>
        <ElFormItem label="命名空间">
          <ElInput v-model="form.namespace" placeholder="如 library / mycompany" />
        </ElFormItem>
        <ElFormItem label="用户名">
          <ElInput v-model="form.username" placeholder="登录用户名（可选）" />
        </ElFormItem>
        <ElFormItem label="密码">
          <ElInput v-model="form.password" type="password" placeholder="登录密码（可选）" />
        </ElFormItem>
        <ElFormItem label="默认仓库">
          <ElSwitch v-model="form.defaultFlag" :active-value="1" :inactive-value="0" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import {
  fetchRegistryList,
  createRegistry,
  updateRegistry,
  deleteRegistry,
  type DockerRegistry,
} from "../../api/software";

const loading = ref(false);
const registries = ref<DockerRegistry[]>([]);
const formVisible = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);

const form = ref<Partial<DockerRegistry>>({
  registryName: "",
  registryUrl: "",
  namespace: "",
  username: "",
  password: "",
  defaultFlag: 0,
  enabled: 1,
});

const loadRegistries = async () => {
  loading.value = true;
  try {
    const res = await fetchRegistryList();
    if (res.code === "00000") {
      registries.value = res.data || [];
    }
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  editingId.value = null;
  form.value = { registryName: "", registryUrl: "", namespace: "", username: "", password: "", defaultFlag: 0, enabled: 1 };
  formVisible.value = true;
};

const openEditDialog = (row: DockerRegistry) => {
  editingId.value = row.id || null;
  form.value = { ...row };
  formVisible.value = true;
};

const handleSave = async () => {
  if (!form.value.registryName?.trim() || !form.value.registryUrl?.trim()) {
    ElMessage.warning("请填写仓库名称和 URL");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      const res = await updateRegistry(editingId.value, form.value);
      if (res.code === "00000") {
        ElMessage.success("更新成功");
      } else {
        ElMessage.error(res.msg || "更新失败");
        return;
      }
    } else {
      const res = await createRegistry(form.value as any);
      if (res.code === "00000") {
        ElMessage.success("创建成功");
      } else {
        ElMessage.error(res.msg || "创建失败");
        return;
      }
    }
    formVisible.value = false;
    loadRegistries();
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: DockerRegistry) => {
  try {
    await ElMessageBox.confirm(`确定删除仓库「${row.registryName}」？`, "确认删除", { type: "warning" });
    const res = await deleteRegistry(row.id!);
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      loadRegistries();
    }
  } catch { /* cancelled */ }
};

onMounted(() => {
  loadRegistries();
});
</script>

<style scoped>
.docker-registry {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.registry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.registry-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.registry-loading {
  padding: 20px;
}
</style>
