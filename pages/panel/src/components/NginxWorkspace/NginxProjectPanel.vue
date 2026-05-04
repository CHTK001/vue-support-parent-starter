<template>
  <div class="project-panel">
    <div class="project-panel__body">
      <ProjectContainerServicePanel
        v-if="servicePanelMode && servicePanelProjectId"
        :project-id="servicePanelProjectId"
        :project-name="servicePanelProjectName"
        :server-summary="serverSummary"
        :remote-api="projectApi"
      />
      <div v-else-if="connecting" class="project-panel__loading">
        <ElIcon class="is-loading"><Loading /></ElIcon>
        <span>正在建立项目管理连接…</span>
      </div>
      <div v-else-if="connectError" class="project-panel__error">
        <ElEmpty :description="connectError" :image-size="60">
          <ElButton type="primary" @click="doConnect">重试</ElButton>
        </ElEmpty>
      </div>
      <ServerRemoteProjectPanel
        v-else-if="projectApi"
        :api="projectApi"
        title="应用项目"
        :sys-project-id="resolvedSysProjectId || undefined"
        :host="host"
        :port="port"
        :username="username"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ProjectContainerServicePanel,
  ServerRemoteProjectPanel,
  createProjectRemoteApi,
  resolveProjectRemoteTarget,
  type RemoteApi,
} from '@pages/project'

const props = defineProps<{
  connectionId: string   // Nginx SSH connectionId（用于获取连接信息）
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
}>()

const connecting = ref(false)
const connectError = ref('')
const projectApi = ref<RemoteApi | null>(null)
const resolvedSysProjectId = ref<number | null>(null)
const query = new URLSearchParams(window.location.search)

const isTruthyQueryFlag = (value: unknown) =>
  ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase())

const servicePanelMode = computed(() =>
  isTruthyQueryFlag(query.get("nginxServicePanel")),
)
const servicePanelProjectId = computed(() => {
  const querySysProjectId = Number(query.get("sysProjectId") || 0)
  if (Number.isInteger(querySysProjectId) && querySysProjectId > 0) {
    return querySysProjectId
  }
  return resolvedSysProjectId.value || null
})
const servicePanelProjectName = computed(() =>
  String(query.get("projectName") || query.get("projectId") || "").trim(),
)
const serverSummary = computed(() => {
  const host = String(props.host || "").trim() || "-"
  const port = Number(props.port || 0) > 0 ? `:${props.port}` : ""
  const username = String(props.username || "").trim() || "-"
  return `${username}@${host}${port}`
})

const parseSysProjectId = (value: unknown): number | null => {
  const text = String(value ?? '').trim()
  if (!text || text.includes('<')) {
    return null
  }
  const id = Number(text)
  return Number.isInteger(id) && id > 0 ? id : null
}

const buildEndpoint = () => {
  const host = String(props.host || '').trim()
  if (!host) {
    return ''
  }
  const port = Number(props.port || 0)
  return port > 0 ? `ssh://${host}:${port}` : `ssh://${host}`
}

const doConnect = async () => {
  if (servicePanelMode.value && servicePanelProjectId.value) {
    resolvedSysProjectId.value = Number(servicePanelProjectId.value)
    projectApi.value = createProjectRemoteApi(Number(servicePanelProjectId.value))
    connecting.value = false
    connectError.value = ''
    return
  }
  connecting.value = true
  connectError.value = ''
  try {
    const endpoint = buildEndpoint()
    if (!endpoint) {
      throw new Error('缺少主机地址')
    }
    const res = await resolveProjectRemoteTarget(endpoint)
    const sysProjectId = parseSysProjectId(res?.data)
    if (!sysProjectId) {
      throw new Error('远程项目映射异常：未返回有效项目ID，请检查 /v2/project/remote/resolve 接口或代理配置')
    }
    resolvedSysProjectId.value = sysProjectId
    projectApi.value = createProjectRemoteApi(sysProjectId)
  } catch (e: any) {
    connectError.value = '连接失败: ' + (e?.message ?? '')
  } finally {
    connecting.value = false
  }
}

onMounted(doConnect)

onUnmounted(() => {
  projectApi.value = null
  resolvedSysProjectId.value = null
})
</script>

<style scoped lang="scss">
.project-panel {
  height: 100%;
  min-height: 0;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 22%),
    linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
  border-radius: 16px;
  border: 1px solid rgba(123, 142, 154, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.project-panel__body {
  height: 100%;
}

/* ── Dark Mode ── */
:global(html.dark) {
  .project-panel {
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 22%),
      linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
    border-color: rgba(148, 163, 184, 0.08);
  }
}
</style>
