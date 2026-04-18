<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / IMAGES</small>
        <h1>镜像管理</h1>
        <p>先选择服务器，再查看该服务器的镜像卡片，并支持拉取、导入、导出等核心能力。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="openPullDialog">拉取镜像</el-button>
        <el-button type="primary" @click="openImportDialog">导入镜像</el-button>
      </div>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>筛选条件</strong>
          <p>支持服务器、仓库和关键字筛选。</p>
        </div>
        <el-button :loading="loading" @click="loadImages">刷新</el-button>
      </header>
      <div class="toolbar-grid">
        <el-select
          v-model="selectedServerId"
          filterable
          clearable
          placeholder="请选择服务器"
          @change="handleFilterChange"
        >
          <el-option
            v-for="item in mergedOptions"
            :key="item.serverId"
            :label="`${item.serverName} (${item.host || '-'})`"
            :value="item.serverId"
          />
        </el-select>
        <el-select
          v-model="selectedRegistryId"
          clearable
          filterable
          placeholder="按仓库筛选"
          @change="handleFilterChange"
        >
          <el-option
            v-for="item in registries"
            :key="item.dockerRegistryId"
            :label="item.registryName"
            :value="item.dockerRegistryId"
          />
        </el-select>
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索镜像名、标签、镜像ID"
          @keyup.enter="handleFilterChange"
        />
      </div>
    </article>

    <div v-if="selectedServerId" class="card-grid">
      <article v-for="item in images" :key="item.imageId" class="resource-card">
        <header class="resource-card__header">
          <div>
            <strong>{{ item.imageName || item.imageId }}</strong>
            <p>{{ item.imageTag || "latest" }}</p>
          </div>
          <el-tag size="small" effect="light">{{ item.status || "-" }}</el-tag>
        </header>

        <div class="resource-card__meta">
          <span>镜像ID：{{ item.imageId }}</span>
          <span>大小：{{ formatSize(item.sizeBytes) }}</span>
          <span>仓库：{{ registryName(item.registryId) }}</span>
          <span>创建时间：{{ formatTime(item.createdAt) }}</span>
        </div>

        <div class="resource-card__actions">
          <el-button @click="openExportDialog(item)">导出</el-button>
          <el-button type="primary" @click="goInstall(item)">去安装</el-button>
        </div>
      </article>

      <el-empty v-if="!images.length && !loading" description="当前筛选条件下没有镜像" />
    </div>
    <el-empty v-else description="先选择一台服务器" />

    <el-dialog v-model="pullDialogVisible" title="拉取镜像" width="560px">
      <el-form label-width="100px">
        <el-form-item label="服务器">
          <span>{{ currentServerLabel }}</span>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="pullForm.registryId" clearable style="width: 100%">
            <el-option
              v-for="item in registries"
              :key="item.dockerRegistryId"
              :label="item.registryName"
              :value="item.dockerRegistryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="镜像名">
          <el-input v-model="pullForm.imageName" placeholder="如 nginx 或 harbor.local/library/nginx" />
        </el-form-item>
        <el-form-item label="镜像标签">
          <el-input v-model="pullForm.imageTag" placeholder="latest" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pullDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pulling" @click="submitPull">拉取</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="导入镜像" width="560px">
      <el-form label-width="100px">
        <el-form-item label="归档路径">
          <el-input v-model="importForm.archivePath" placeholder="/data/images/nginx.tar" />
        </el-form-item>
        <el-form-item label="镜像名">
          <el-input v-model="importForm.imageName" />
        </el-form-item>
        <el-form-item label="镜像标签">
          <el-input v-model="importForm.imageTag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImport">导入</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  exportDockerImage,
  importDockerImage,
  listDockerImages,
  listDockerRegistries,
  pullDockerImage,
} from "../api";
import type { DockerImageView, DockerRegistry } from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const pulling = ref(false);
const importing = ref(false);
const selectedServerId = ref<number>();
const selectedRegistryId = ref<number>();
const keyword = ref("");
const images = ref<DockerImageView[]>([]);
const registries = ref<DockerRegistry[]>([]);
const pullDialogVisible = ref(false);
const importDialogVisible = ref(false);

const pullForm = ref({
  registryId: undefined as number | undefined,
  imageName: "",
  imageTag: "latest",
});

const importForm = ref({
  archivePath: "",
  imageName: "",
  imageTag: "latest",
});

const { mergedOptions, loadServers } = useDockerServerSelection();

const currentServerLabel = computed(
  () => mergedOptions.value.find((item) => item.serverId === selectedServerId.value)?.serverName || "-",
);

const registryName = (registryId?: number) => {
  if (!registryId) {
    return "未匹配仓库";
  }
  return registries.value.find((item) => item.dockerRegistryId === registryId)?.registryName || "未匹配仓库";
};

const formatTime = (value?: number) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

const formatSize = (value?: number) => {
  if (!value) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const syncRouteQuery = async () => {
  await router.replace({
    path: "/docker/images",
    query: {
      ...(selectedServerId.value ? { serverId: String(selectedServerId.value) } : {}),
      ...(selectedRegistryId.value ? { registryId: String(selectedRegistryId.value) } : {}),
      ...(keyword.value.trim() ? { keyword: keyword.value.trim() } : {}),
    },
  });
};

const loadImages = async () => {
  if (!selectedServerId.value) {
    images.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await listDockerImages({
      serverId: selectedServerId.value,
      registryId: selectedRegistryId.value,
      keyword: keyword.value.trim() || undefined,
    });
    images.value = result.data || [];
  } catch (error: any) {
    message(error?.message || error?.msg || "加载镜像失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = async () => {
  await syncRouteQuery();
  await loadImages();
};

const openPullDialog = () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  pullForm.value = {
    registryId: selectedRegistryId.value,
    imageName: "",
    imageTag: "latest",
  };
  pullDialogVisible.value = true;
};

const openImportDialog = () => {
  if (!selectedServerId.value) {
    message("请先选择服务器", { type: "warning" });
    return;
  }
  importForm.value = {
    archivePath: "",
    imageName: "",
    imageTag: "latest",
  };
  importDialogVisible.value = true;
};

const submitPull = async () => {
  if (!selectedServerId.value || !pullForm.value.imageName.trim()) {
    message("请填写镜像名", { type: "warning" });
    return;
  }
  pulling.value = true;
  try {
    const result = await pullDockerImage({
      serverId: selectedServerId.value,
      registryId: pullForm.value.registryId,
      imageName: pullForm.value.imageName.trim(),
      imageTag: pullForm.value.imageTag || undefined,
    });
    message(result.data.message || "拉取已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
    pullDialogVisible.value = false;
    await loadImages();
  } catch (error: any) {
    message(error?.message || error?.msg || "拉取镜像失败", { type: "error" });
  } finally {
    pulling.value = false;
  }
};

const submitImport = async () => {
  if (!selectedServerId.value || !importForm.value.archivePath.trim()) {
    message("请填写归档路径", { type: "warning" });
    return;
  }
  importing.value = true;
  try {
    const result = await importDockerImage({
      serverId: selectedServerId.value,
      archivePath: importForm.value.archivePath.trim(),
      imageName: importForm.value.imageName || undefined,
      imageTag: importForm.value.imageTag || undefined,
    });
    message(result.data.message || "导入已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
    importDialogVisible.value = false;
    await loadImages();
  } catch (error: any) {
    message(error?.message || error?.msg || "导入镜像失败", { type: "error" });
  } finally {
    importing.value = false;
  }
};

const openExportDialog = async (item: DockerImageView) => {
  if (!selectedServerId.value) {
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt("请输入导出目标路径", "导出镜像", {
      inputPlaceholder: "/data/images/export.tar",
      inputValue: "/data/images/export.tar",
    });
    const result = await exportDockerImage({
      serverId: selectedServerId.value,
      imageId: item.imageId,
      outputPath: value,
    });
    message(result.data.message || "导出已提交", {
      type: result.data.status === "SUCCESS" ? "success" : "warning",
    });
  } catch {
    // 用户取消不提示
  }
};

const goInstall = async (item: DockerImageView) => {
  await router.push({
    path: "/docker/install",
    query: {
      ...(selectedServerId.value ? { serverId: String(selectedServerId.value) } : {}),
      ...(item.registryId ? { registryId: String(item.registryId) } : {}),
      ...(item.imageName ? { imageName: item.imageName } : {}),
      ...(item.imageTag ? { imageTag: item.imageTag } : {}),
    },
  });
};

onMounted(async () => {
  await Promise.all([loadServers(), listDockerRegistries().then((res) => { registries.value = res.data || []; })]);
  selectedServerId.value = route.query.serverId ? Number(route.query.serverId) : undefined;
  selectedRegistryId.value = route.query.registryId ? Number(route.query.registryId) : undefined;
  keyword.value = route.query.keyword ? String(route.query.keyword) : "";
  await loadImages();
});
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

@media (max-width: 960px) {
  .toolbar-grid,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
