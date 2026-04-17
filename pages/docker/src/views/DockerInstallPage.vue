<template>
  <div class="docker-install-page">
    <el-card shadow="never" class="install-card">
      <template #header>
        <div class="card-header">
          <span>Docker 安装向导（起步版）</span>
          <div class="header-actions">
            <el-button link type="primary" @click="showGuide = true">
              查看首次安装说明
            </el-button>
          </div>
        </div>
      </template>

      <el-form label-width="120px">
        <el-form-item label="目标服务器">
          <el-select
            v-model="selectedServerIds"
            multiple
            filterable
            clearable
            placeholder="请选择服务器（来源：@pages/server + docker后台）"
            style="width: 100%"
          >
            <el-option
              v-for="item in mergedOptions"
              :key="item.serverId"
              :label="`${item.serverName} (${item.host || '-'})`"
              :value="item.serverId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="同步任务">
          <div class="sync-box">
            <el-tag v-if="imageSync" type="info">
              镜像同步: {{ imageSync.enabled ? "已启用" : "未启用" }}
            </el-tag>
            <el-tag v-if="containerSync" type="info">
              容器同步: {{ containerSync.enabled ? "已启用" : "未启用" }}
            </el-tag>
            <el-button size="small" @click="refreshSyncSchedules">刷新同步任务状态</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <DockerInstallGuideDialog v-model:visible="showGuide" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getDockerSyncSchedule } from "../api";
import type { DockerSyncScheduleView } from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";
import DockerInstallGuideDialog from "./components/DockerInstallGuideDialog.vue";

/**
 * 安装页面起步实现：
 * - 展示服务器选择来源；
 * - 展示同步任务状态；
 * - 接入首次安装说明弹框。
 */
const selectedServerIds = ref<number[]>([]);
const showGuide = ref(false);
const imageSync = ref<DockerSyncScheduleView | null>(null);
const containerSync = ref<DockerSyncScheduleView | null>(null);

const { mergedOptions, loadServers } = useDockerServerSelection();

const refreshSyncSchedules = async () => {
  const [imageRes, containerRes] = await Promise.all([
    getDockerSyncSchedule("images"),
    getDockerSyncSchedule("containers"),
  ]);
  imageSync.value = imageRes.data;
  containerSync.value = containerRes.data;
};

onMounted(async () => {
  await loadServers();
  await refreshSyncSchedules();
});
</script>

<style scoped lang="scss">
.docker-install-page {
  padding: 16px;
}

.install-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.sync-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

