<template>
  <ScDrawer
    v-model="visible"
    size="min(90vw, 1440px)"
    destroy-on-close
    append-to-body
    class="server-project-drawer"
    :title="hostName ? `${hostName} · 项目管理` : '项目管理'"
    @open="onOpen"
    @close="onClose"
  >
    <div class="server-project-drawer__body">
      <div v-if="connecting" class="server-project-drawer__loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在建立连接…</span>
      </div>
      <div v-else-if="connectError" class="server-project-drawer__error">
        <el-empty :description="connectError" :image-size="80">
          <ScButton type="primary" @click="onOpen">重试</ScButton>
        </el-empty>
      </div>
      <ServerRemoteProjectPanel
        v-else-if="projectApi"
        :api="projectApi"
        :title="hostName ? `${hostName} 应用项目` : '应用项目'"
      />
      <el-empty v-else description="请选择服务器后再打开项目管理" />
    </div>
  </ScDrawer>
</template>

<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";
import { ElButton, ElEmpty, ElIcon } from "element-plus";
import { computed, ref } from "vue";
import { connectServerProject, createServerProjectApi, disconnectServerProject, type RemoteApi } from "../api/remote";
import { ServerRemoteProjectPanel } from "..";
import type { ServerHost } from "../api";

const props = defineProps<{
  modelValue: boolean;
  hostName: string;
  host?: ServerHost | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const connecting = ref(false);
const connectError = ref("");
const projectApi = ref<RemoteApi | null>(null);
let connectionId = "";

const onOpen = async () => {
  if (!props.host) return;
  connecting.value = true;
  connectError.value = "";
  projectApi.value = null;
  try {
    const res = await connectServerProject({
      serverType: props.host.serverType || "SSH",
      host: props.host.host || "",
      port: props.host.port ?? 22,
      username: props.host.username || "root",
      password: props.host.password,
      privateKey: props.host.privateKey,
      osType: props.host.osType,
    });
    connectionId = res?.data ?? "";
    projectApi.value = createServerProjectApi(connectionId);
  } catch (e: any) {
    connectError.value = "连接失败: " + (e?.message ?? "未知错误");
  } finally {
    connecting.value = false;
  }
};

const onClose = () => {
  if (connectionId) {
    disconnectServerProject(connectionId).catch(() => {});
    connectionId = "";
  }
  projectApi.value = null;
  connectError.value = "";
};
</script>

<style scoped lang="scss">
.server-project-drawer__body {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.server-project-drawer__loading,
.server-project-drawer__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;

  .el-icon {
    font-size: 32px;
  }
}
</style>
