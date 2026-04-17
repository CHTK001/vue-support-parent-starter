<template>
  <div class="docker-install-page">
    <el-card shadow="never" class="install-card">
      <template #header>
        <div class="card-header">
          <span>Docker 安装向导（起步版）</span>
          <div class="header-actions">
            <el-button :loading="syncingImages" @click="runSync('images')">
              手动同步镜像
            </el-button>
            <el-button :loading="syncingContainers" @click="runSync('containers')">
              手动同步容器
            </el-button>
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
import { message } from "@repo/utils";
import { getDockerSyncSchedule, runDockerSync } from "../api";
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
const syncingImages = ref(false);
const syncingContainers = ref(false);

const { mergedOptions, loadServers } = useDockerServerSelection();

const refreshSyncSchedules = async () => {
  const [imageRes, containerRes] = await Promise.all([
    getDockerSyncSchedule("images"),
    getDockerSyncSchedule("containers"),
  ]);
  imageSync.value = imageRes.data;
  containerSync.value = containerRes.data;
};

/**
 * 手动触发同步，当前服务器选择会透传给后端。
 */
const runSync = async (scope: "images" | "containers") => {
  const loadingRef = scope === "images" ? syncingImages : syncingContainers;
  loadingRef.value = true;
  try {
    const result = await runDockerSync(scope, {
      serverIds: selectedServerIds.value.length ? selectedServerIds.value : undefined,
      deleteAbsent: false,
    });
    message(
      `${scope === "images" ? "镜像" : "容器"}同步完成，服务器 ${result.data.serverCount} 台，新增 ${result.data.createdCount}，更新 ${result.data.updatedCount}`,
      { type: "success" },
    );
    await refreshSyncSchedules();
  } catch (error: any) {
    message(error?.message || error?.msg || "同步失败", { type: "error" });
  } finally {
    loadingRef.value = false;
  }
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
