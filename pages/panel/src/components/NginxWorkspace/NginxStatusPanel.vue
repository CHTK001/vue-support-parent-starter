<template>
  <div class="status-panel">
    <div class="status-header">
      <span class="status-title">Nginx 运行状态</span>
      <div class="status-header__actions">
        <ElButton size="small" :loading="statusLoading" :icon="RefreshRight" @click="loadStatus">刷新</ElButton>
        <ElButton type="primary" size="small" :loading="reloading" @click="doReload">
          <ElIcon><RefreshRight /></ElIcon>重载
        </ElButton>
        <ElButton type="warning" size="small" :loading="restarting" @click="doRestart">
          <ElIcon><VideoPlay /></ElIcon>重启
        </ElButton>
        <ElButton type="danger" size="small" :loading="stopping" @click="doStop">
          <ElIcon><VideoPause /></ElIcon>停止
        </ElButton>
      </div>
    </div>

    <ElScrollbar class="status-scroll">
      <div v-if="statusLoading" class="status-loading">
        <ElIcon class="is-loading"><Loading /></ElIcon>
      </div>
      <div v-else-if="nginxStatus" class="status-cards">
        <!-- 状态 chips + 基本信息 -->
        <div class="status-card">
          <div class="status-card__title">基本信息</div>
          <div class="status-chips">
            <span class="status-chip" :class="statusIsActive ? 'status-chip--active' : 'status-chip--inactive'">
              <span class="status-chip__dot" />
              {{ statusIsActive ? '运行中' : '已停止' }}
            </span>
            <span class="status-chip status-chip--version">
              <ElIcon><CircleCheck /></ElIcon>
              {{ nginxStatus.version || '—' }}
            </span>
            <span class="status-chip status-chip--pid">
              PID {{ nginxStatus.pid || '—' }}
            </span>
            <span class="status-chip" :class="configTestOk ? 'status-chip--ok' : 'status-chip--fail'">
              配置 {{ configTestOk ? '✓ pass' : '✗ fail' }}
            </span>
          </div>
          <div class="status-card__body">
            <div class="status-row">
              <span class="status-row__label">版本</span>
              <span class="status-row__val status-row__val--mono">{{ nginxStatus.version || '—' }}</span>
            </div>
            <div class="status-row">
              <span class="status-row__label">主进程 PID</span>
              <span class="status-row__val status-row__val--mono">{{ nginxStatus.pid || '—' }}</span>
            </div>
            <div class="status-row">
              <span class="status-row__label">服务状态</span>
              <span class="status-row__val" :class="statusIsActive ? 'status-row__val--active' : 'status-row__val--inactive'">
                {{ statusIsActive ? 'active (running)' : 'inactive / 未知' }}
              </span>
            </div>
            <div class="status-row">
              <span class="status-row__label">配置检查</span>
              <span class="status-row__val" :class="configTestOk ? 'status-row__val--active' : 'status-row__val--inactive'">
                {{ configTestOk ? '通过 (syntax ok)' : '失败' }}
              </span>
            </div>
            <div class="status-row">
              <span class="status-row__label">连接 ID</span>
              <span class="status-row__val status-row__val--mono">{{ props.connectionId }}</span>
            </div>
          </div>
        </div>

        <!-- 配置检查 -->
        <div class="status-card">
          <div class="status-card__title">配置检查 (nginx -t)</div>
          <pre class="status-pre">{{ nginxStatus.configTest }}</pre>
        </div>

        <!-- systemctl status -->
        <div class="status-card">
          <div class="status-card__title">服务状态 (systemctl status)</div>
          <pre class="status-pre">{{ nginxStatus.systemctlStatus }}</pre>
        </div>
      </div>
      <div v-else class="status-empty">
        <ElEmpty description="点击刷新获取状态" :image-size="48" />
      </div>
    </ElScrollbar>
  </div>
</template>

<script setup lang="ts">
import {
  CircleCheck,
  Loading,
  RefreshRight,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue'
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElMessage,
  ElScrollbar,
} from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import {
  fetchNginxStatus,
  reloadNginx,
  restartNginx,
  stopNginx,
  type NginxStatusResult,
} from '../../api/nginx'

const props = defineProps<{ connectionId: string }>()

const nginxStatus = ref<NginxStatusResult | null>(null)
const statusLoading = ref(false)
const reloading = ref(false)
const restarting = ref(false)
const stopping = ref(false)

const statusIsActive = computed(() => {
  const s = nginxStatus.value?.systemctlStatus ?? ''
  return s.includes('active (running)')
})

const configTestOk = computed(() => {
  const s = nginxStatus.value?.configTest ?? ''
  return s.includes('syntax is ok') || s.includes('test is successful')
})

const loadStatus = async () => {
  statusLoading.value = true
  try {
    const res = await fetchNginxStatus(props.connectionId)
    nginxStatus.value = (res?.data as any) ?? null
  } catch (e: any) {
    ElMessage.error('获取状态失败: ' + (e?.message ?? ''))
  } finally {
    statusLoading.value = false
  }
}

const doReload = async () => {
  reloading.value = true
  try {
    const res = await reloadNginx(props.connectionId)
    const result = res?.data as any
    if (result?.success) ElMessage.success('Reload 成功')
    else ElMessage.warning('Reload 输出: ' + (result?.output ?? ''))
    await loadStatus()
  } catch (e: any) {
    ElMessage.error('Reload 失败: ' + (e?.message ?? ''))
  } finally {
    reloading.value = false
  }
}

const doRestart = async () => {
  restarting.value = true
  try {
    const res = await restartNginx(props.connectionId)
    const result = res?.data as any
    ElMessage[result?.success ? 'success' : 'warning']('Restart: ' + (result?.output ?? ''))
    await loadStatus()
  } catch (e: any) {
    ElMessage.error('Restart 失败: ' + (e?.message ?? ''))
  } finally {
    restarting.value = false
  }
}

const doStop = async () => {
  stopping.value = true
  try {
    const res = await stopNginx(props.connectionId)
    const result = res?.data as any
    ElMessage[result?.success ? 'success' : 'warning']('Stop: ' + (result?.output ?? ''))
    await loadStatus()
  } catch (e: any) {
    ElMessage.error('Stop 失败: ' + (e?.message ?? ''))
  } finally {
    stopping.value = false
  }
}

onMounted(loadStatus)
</script>

<style scoped lang="scss">
.status-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f8fafc;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.status-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-scroll { flex: 1; min-height: 0; }

.status-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #94a3b8;
}

.status-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.status-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.status-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}

.status-card__title {
  padding: 10px 14px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.8);
}

.status-card__body { padding: 10px 14px; }

.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;

  &--active { background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.25); }
  &--inactive { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }
  &--version { background: rgba(99, 102, 241, 0.1); color: #4f46e5; border: 1px solid rgba(99, 102, 241, 0.2); font-family: 'JetBrains Mono', monospace; }
  &--pid { background: rgba(148, 163, 184, 0.12); color: #475569; border: 1px solid rgba(148, 163, 184, 0.2); font-family: 'JetBrains Mono', monospace; }
  &--ok { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
  &--fail { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2); }
}

.status-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);

  &:last-child { border-bottom: none; }
}

.status-row__label {
  flex-shrink: 0;
  width: 120px;
  font-size: 12px;
  color: #64748b;
}

.status-row__val {
  flex: 1;
  font-size: 13px;
  color: #1e293b;

  &--mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  &--active { color: #059669; font-weight: 600; }
  &--inactive { color: #dc2626; font-weight: 600; }
}

.status-pre {
  margin: 0;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f8fafc;
  max-height: 240px;
  overflow-y: auto;
}
</style>
