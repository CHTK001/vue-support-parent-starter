<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / REGISTRIES</small>
        <h1>仓库管理</h1>
        <p>用于记录镜像仓库基础信息，供安装、检索和镜像筛选复用。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadRegistries">刷新</el-button>
        <el-button type="primary" @click="openEditor()">新增仓库</el-button>
      </div>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>按名称、编码、地址检索仓库记录。</p>
        </div>
      </header>
      <div class="toolbar-grid">
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索名称、编码、地址"
          @keyup.enter="loadRegistries"
        />
        <el-select v-model="enabled" clearable placeholder="启用状态" @change="loadRegistries">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </div>
    </article>

    <div class="card-grid">
      <article v-for="item in registries" :key="item.dockerRegistryId" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.registryName }}</strong>
            <p>{{ item.registryCode || "未配置编码" }}</p>
          </div>
          <div class="status-tags">
            <el-tag size="small" effect="light" :type="item.enabled === false ? 'info' : 'success'">
              {{ item.enabled === false ? "停用" : "启用" }}
            </el-tag>
            <el-tag v-if="item.defaultRegistry" size="small" effect="light" type="warning">
              默认
            </el-tag>
          </div>
        </header>

        <div class="resource-card__meta">
          <span>地址：{{ item.registryUrl || "-" }}</span>
          <span>命名空间：{{ item.namespace || "-" }}</span>
          <span>账号：{{ item.username || "-" }}</span>
          <span>备注：{{ item.description || "-" }}</span>
        </div>

        <div class="resource-card__actions">
          <el-button @click="openEditor(item)">编辑</el-button>
          <el-button type="danger" plain @click="removeRegistry(item)">删除</el-button>
        </div>
      </article>

      <el-empty v-if="!registries.length && !loading" description="当前没有仓库记录" />
    </div>

    <el-dialog v-model="editorVisible" :title="editingId ? '编辑仓库' : '新增仓库'" width="640px">
      <el-form label-width="110px">
        <el-form-item label="仓库名称">
          <el-input v-model="form.registryName" placeholder="Harbor / Docker Hub / 私有仓库" />
        </el-form-item>
        <el-form-item label="仓库编码">
          <el-input v-model="form.registryCode" placeholder="registry-harbor" />
        </el-form-item>
        <el-form-item label="仓库地址">
          <el-input v-model="form.registryUrl" placeholder="https://harbor.example.com" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="form.namespace" placeholder="library / team-a" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="访问令牌">
          <el-input v-model="form.token" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="默认仓库">
          <el-switch v-model="form.defaultRegistry" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRegistry">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  createDockerRegistry,
  deleteDockerRegistry,
  listDockerRegistries,
  updateDockerRegistry,
} from "../api";
import type { DockerRegistry } from "../types";

const loading = ref(false);
const saving = ref(false);
const editorVisible = ref(false);
const editingId = ref<number>();
const keyword = ref("");
const enabled = ref<boolean>();
const registries = ref<DockerRegistry[]>([]);

const form = reactive<DockerRegistry>({
  registryName: "",
  registryCode: "",
  registryUrl: "",
  namespace: "",
  username: "",
  password: "",
  token: "",
  defaultRegistry: false,
  enabled: true,
  description: "",
});

const resetForm = () => {
  editingId.value = undefined;
  form.registryName = "";
  form.registryCode = "";
  form.registryUrl = "";
  form.namespace = "";
  form.username = "";
  form.password = "";
  form.token = "";
  form.defaultRegistry = false;
  form.enabled = true;
  form.description = "";
  form.metadataJson = "";
};

const loadRegistries = async () => {
  loading.value = true;
  try {
    const result = await listDockerRegistries({
      keyword: keyword.value.trim() || undefined,
      enabled: enabled.value,
    });
    registries.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载仓库失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const openEditor = (item?: DockerRegistry) => {
  resetForm();
  if (item?.dockerRegistryId) {
    editingId.value = item.dockerRegistryId;
    Object.assign(form, item);
  }
  editorVisible.value = true;
};

const saveRegistry = async () => {
  if (!form.registryName?.trim()) {
    message("仓库名称不能为空", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    const payload: DockerRegistry = {
      ...form,
      registryName: form.registryName.trim(),
      registryCode: form.registryCode?.trim() || undefined,
      registryUrl: form.registryUrl?.trim() || undefined,
      namespace: form.namespace?.trim() || undefined,
      username: form.username?.trim() || undefined,
      description: form.description?.trim() || undefined,
    };
    if (editingId.value) {
      await updateDockerRegistry(editingId.value, payload);
    } else {
      await createDockerRegistry(payload);
    }
    message("仓库保存成功", { type: "success" });
    editorVisible.value = false;
    await loadRegistries();
  } catch (error: any) {
    message(error?.message || error?.msg || "仓库保存失败", { type: "error" });
  } finally {
    saving.value = false;
  }
};

const removeRegistry = async (item: DockerRegistry) => {
  if (!item.dockerRegistryId) {
    return;
  }
  await ElMessageBox.confirm(`确认删除仓库【${item.registryName}】吗？`, "删除仓库", {
    type: "warning",
  });
  try {
    await deleteDockerRegistry(item.dockerRegistryId);
    message("仓库已删除", { type: "success" });
    await loadRegistries();
  } catch (error: any) {
    message(error?.message || error?.msg || "仓库删除失败", { type: "error" });
  }
};

onMounted(loadRegistries);
</script>

<style scoped lang="scss">
.docker-page-shell {
  display: grid;
  gap: 18px;
}

.page-hero,
.panel-card,
.resource-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.page-hero,
.panel-card__header,
.resource-card__header,
.resource-card__actions,
.hero-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.toolbar-grid,
.card-grid {
  display: grid;
  gap: 14px;
}

.toolbar-grid {
  grid-template-columns: minmax(0, 1.3fr) minmax(180px, 0.7fr);
}

.card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resource-card__meta {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.status-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .toolbar-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
