<template>
  <div class="project-panel">
    <div class="project-panel__body">
      <div v-if="connecting" class="project-panel__loading">
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
import { onMounted, onUnmounted, ref } from 'vue'
import {
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
}

.project-panel__body {
  height: 100%;
}
</style>
