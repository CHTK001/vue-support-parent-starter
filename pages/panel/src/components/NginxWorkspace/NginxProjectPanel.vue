<template>
  <div class="project-panel">
    <div class="project-panel__toolbar">
      <span class="project-panel__title">
        <ElIcon><FolderOpened /></ElIcon>
        项目管理
      </span>
      <span class="project-panel__sub">通过 SSH 管理远程服务器上的应用项目</span>
    </div>
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
      <ServerRemoteProjectPanel v-else-if="projectApi" :api="projectApi" title="应用项目" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened, Loading } from '@element-plus/icons-vue'
import { ElButton, ElEmpty, ElIcon } from 'element-plus'
import { onMounted, onUnmounted, ref } from 'vue'
import { connectServerProject, createServerProjectApi, disconnectServerProject, type RemoteApi } from '@pages/server'

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
let projectConnectionId = ''

const doConnect = async () => {
  connecting.value = true
  connectError.value = ''
  try {
    const res = await connectServerProject({
      serverType: 'SSH',
      host: props.host,
      port: props.port,
      username: props.username,
      password: props.password,
      privateKey: props.privateKey,
    })
    projectConnectionId = res?.data ?? ''
    projectApi.value = createServerProjectApi(projectConnectionId)
  } catch (e: any) {
    connectError.value = '连接失败: ' + (e?.message ?? '')
  } finally {
    connecting.value = false
  }
}

onMounted(doConnect)

onUnmounted(() => {
  if (projectConnectionId) {
    disconnectServerProject(projectConnectionId).catch(() => {})
  }
})
</script>

<style scoped lang="scss">
.project-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f1f5f9;
}

.project-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.project-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;

  .el-icon {
    font-size: 18px;
    color: #6366f1;
  }
}

.project-panel__sub {
  font-size: 13px;
  color: #94a3b8;
}

.project-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
