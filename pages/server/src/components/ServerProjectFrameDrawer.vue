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
import {
  ServerRemoteProjectPanel,
  createProjectRemoteApi,
  resolveProjectRemoteTarget,
  type RemoteApi,
} from "@pages/project";
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

const parseSysProjectId = (value: unknown): number | null => {
  const text = String(value ?? "").trim();
  if (!text || text.includes("<")) {
    return null;
  }
  const id = Number(text);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const onOpen = async () => {
  if (!props.host) return;
  connecting.value = true;
  connectError.value = "";
  projectApi.value = null;
  try {
    const host = String(props.host.host || "").trim();
    if (!host) {
      throw new Error("主机地址为空");
    }
    const port = Number(props.host.port ?? 22);
    const endpoint = port > 0 ? `ssh://${host}:${port}` : `ssh://${host}`;
    const res = await resolveProjectRemoteTarget(endpoint);
    const sysProjectId = parseSysProjectId(res?.data);
    if (!sysProjectId) {
      throw new Error(
        "远程项目映射异常：未返回有效项目ID，请检查 /v2/project/remote/resolve 接口或代理配置",
      );
    }
    projectApi.value = createProjectRemoteApi(sysProjectId);
  } catch (e: any) {
    connectError.value = "连接失败: " + (e?.message ?? "未知错误");
  } finally {
    connecting.value = false;
  }
};

const onClose = () => {
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
  overflow: hidden;
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
