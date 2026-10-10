<template>
  <div class="conn-page">
    <div class="conn-head">
      <div>
        <h2 class="conn-title">{{ t('settings.connection.title') }}</h2>
        <p class="conn-sub">{{ t('settings.connection.desc') }}</p>
      </div>
      <el-button type="primary" @click="startNew">{{ t('settings.connection.newConnection') }}</el-button>
    </div>

    <!-- 连接列表 -->
    <div v-if="connections.length > 0" class="conn-grid">
      <div v-for="conn in connections" :key="conn.id" class="conn-card">
        <div class="conn-card-top">
          <div class="conn-card-id">
            <span class="conn-avatar">{{ conn.name.charAt(0).toUpperCase() }}</span>
            <div class="min-w-0">
              <div class="conn-card-name">{{ conn.name }}</div>
              <div class="conn-card-type">SSH</div>
            </div>
          </div>
          <div class="conn-card-ops">
            <el-button text @click="editConn(conn)">{{ t('common.edit') }}</el-button>
            <el-button text type="danger" @click="deleteConn(conn.id)">{{ t('common.delete') }}</el-button>
          </div>
        </div>
        <div class="conn-card-line">{{ conn.config.username }}@{{ conn.config.host }}:{{ conn.config.port || 22 }}</div>
        <div class="conn-card-line">{{ conn.config.path }}</div>
      </div>
    </div>

    <SettingsCard v-else flush>
      <div class="conn-empty">
        <p class="conn-empty-main">{{ t('settings.connection.noConnections') }}</p>
        <p class="conn-empty-sub">{{ t('settings.connection.noConnectionsDesc') }}</p>
      </div>
    </SettingsCard>

    <!-- 新建/编辑：分步向导 -->
    <LDialog v-model="editing" width="640px" :close-on-click-modal="false" append-to-body class="conn-dialog">
      <div class="wiz" style="height: 480px;">
        <!-- 步骤导航 -->
        <div class="wiz-steps">
          <div v-for="(step, i) in stepLabels" :key="i" class="wiz-step"
            :class="currentStep === i ? 'is-active' : currentStep > i ? 'is-done' : ''">
            <span class="wiz-dot">
              <el-icon v-if="currentStep > i"><Check /></el-icon>
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="wiz-step-label">{{ step }}</span>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="wiz-content">
          <!-- Step 0 配置 -->
          <div v-if="currentStep === 0" class="wiz-pane">
            <div class="pane-head">
              <h3 class="pane-title">{{ t('settings.connection.fillConfig') }}</h3>
              <p class="pane-sub">{{ t('settings.connection.fillConfigDesc') }}</p>
            </div>

            <div>
              <label class="f-label">{{ t('settings.connection.connectionName') }} <span class="req">*</span></label>
              <el-input v-model="editName" placeholder="my-server" />
            </div>

            <div class="flex gap-3 items-end">
              <div class="flex-1 min-w-0">
                <label class="f-label">Host <span class="req">*</span></label>
                <el-input v-model="editConfig.host" placeholder="192.168.1.100" />
              </div>
              <div style="width: 110px;">
                <label class="f-label">Port</label>
                <el-input-number v-model="editConfig.port" :min="1" :max="65535" controls-position="right"
                  style="width: 110px;" />
              </div>
            </div>

            <div class="flex gap-3 items-end">
              <div class="flex-1 min-w-0">
                <label class="f-label">Username <span class="req">*</span></label>
                <el-input v-model="editConfig.username" placeholder="root" />
              </div>
              <div style="width: 130px;">
                <label class="f-label">Auth</label>
                <el-select v-model="editConfig.authMethod" style="width: 130px;">
                  <el-option :label="t('settings.connection.connectionName') === '连接名称' ? '密码' : 'Password'" value="password" />
                  <el-option :label="t('settings.connection.connectionName') === '连接名称' ? '私钥' : 'Private Key'" value="privateKey" />
                </el-select>
              </div>
            </div>

            <div v-if="editConfig.authMethod === 'password'">
              <label class="f-label">{{ t('settings.connection.connectionName') === '连接名称' ? '密码' : 'Password' }}</label>
              <el-input v-model="editConfig.password" type="password" show-password />
            </div>
            <div v-if="editConfig.authMethod === 'privateKey'">
              <label class="f-label">{{ t('settings.connection.connectionName') === '连接名称' ? '私钥内容' : 'Private Key' }}</label>
              <el-input v-model="editConfig.privateKey" type="textarea" :rows="6"
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEpAIBAAKCAQEA...&#10;-----END RSA PRIVATE KEY-----" />
              <div class="f-hint">请粘贴完整的私钥内容，包括 BEGIN/END 标记</div>
            </div>

            <!-- 权限模式 -->
            <div>
              <label class="f-label">{{ t('settings.connection.permTitle') }}</label>
              <SegmentedToggle :model-value="editConfig.perm ?? ''" :options="permOptions"
                @update:model-value="editConfig.perm = String($event)" />
              <div class="f-hint">{{ t('settings.connection.permDesc') }}</div>
            </div>
          </div>

          <!-- Step 1 测试 -->
          <div v-if="currentStep === 1" class="wiz-pane">
            <div class="flex items-center gap-3">
              <div v-if="testing" class="state-spinner"></div>
              <div v-else-if="testResult?.success" class="state-ok"><el-icon><Check /></el-icon></div>
              <div v-else-if="testResult" class="state-bad"><el-icon><Close /></el-icon></div>
              <div class="flex-1 min-w-0">
                <p v-if="testing" class="state-line">
                  {{ t('settings.connection.testing') }} {{ editConfig.username }}@{{ editConfig.host }}:{{ editConfig.port }}...
                </p>
                <p v-else-if="testResult?.success" class="state-line state-line-ok">{{ t('settings.connection.sshConnected') }}</p>
                <p v-else-if="testResult" class="state-line state-line-bad">{{ t('settings.connection.sshFailed') }}</p>
              </div>
            </div>
            <div v-if="testLog || testing" class="term">
              <pre class="term-pre">{{ testLog || 'Connecting...' }}</pre>
              <span v-if="testing" class="term-cursor"></span>
            </div>
          </div>

          <!-- Step 2 部署 -->
          <div v-if="currentStep === 2" class="wiz-pane">
            <div class="flex items-center gap-3">
              <div v-if="deploying" class="state-spinner"></div>
              <div v-else-if="deployResult?.success" class="state-ok"><el-icon><Check /></el-icon></div>
              <div v-else-if="deployResult" class="state-bad"><el-icon><Close /></el-icon></div>
              <div class="flex-1 min-w-0">
                <h3 class="pane-title">{{ t('settings.connection.deployTitle') }}</h3>
                <p class="pane-sub">{{ t('settings.connection.deployDesc') }}</p>
                <p v-if="deploying" class="state-line mt-1">{{ t('settings.connection.deploying') }}</p>
                <p v-else-if="deployResult?.success && deployResult?.installed" class="state-line state-line-ok mt-1">{{ t('settings.connection.deployInstalled') }}</p>
                <p v-else-if="deployResult?.success" class="state-line state-line-ok mt-1">{{ t('settings.connection.deploySuccess') }}</p>
                <p v-else-if="deployResult" class="state-line state-line-bad mt-1">{{ t('settings.connection.deployFailed') }}</p>
              </div>
            </div>
            <div ref="deployLogBox" v-if="deployLog || deploying" class="term log-scroll">
              <pre class="term-pre">{{ deployLog || 'Deploying...' }}</pre>
              <span v-if="deploying" class="term-cursor"></span>
            </div>
          </div>

          <!-- Step 3 选目录 -->
          <div v-if="currentStep === 3" class="wiz-pane">
            <div class="pane-head">
              <h3 class="pane-title">{{ t('settings.connection.browseTitle') }}</h3>
              <p class="pane-sub">{{ t('settings.connection.browseDesc') }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <el-input v-model="browserPath" placeholder="/" @keyup.enter="navigateBrowser" />
              <el-button :loading="browserLoading" @click="navigateBrowser">{{ t('settings.connection.goTo') }}</el-button>
            </div>
            <div class="fb">
              <div class="fb-up" :class="browserPath === '/' ? 'is-disabled' : ''" @click="goUp">
                <el-icon class="fb-up-ico"><Top /></el-icon>
                <span>{{ t('settings.connection.goUp') }}</span>
              </div>
              <div class="fb-list">
                <div v-if="browserLoading" class="fb-info">{{ t('settings.connection.loading') }}</div>
                <div v-else-if="browserEntries.length === 0" class="fb-info">{{ t('settings.connection.emptyDir') }}</div>
                <div v-for="entry in browserEntries" :key="entry.name" class="fb-entry"
                  @click="entry.isDirectory ? enterDir(entry.name) : null">
                  <el-icon v-if="entry.isDirectory" class="fb-ico fb-ico-dir"><Folder /></el-icon>
                  <el-icon v-else class="fb-ico fb-ico-file"><Document /></el-icon>
                  <span :class="entry.isDirectory ? 'fb-name' : 'fb-file-name'">{{ entry.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="wiz-footer">
            <el-button v-if="currentStep > 0" text @click="currentStep--">{{ t('settings.connection.prev') }}</el-button>
            <span v-else></span>
            <div class="flex gap-2">
              <el-button v-if="currentStep === 0" type="primary"
                :disabled="!editConfig.host || !editConfig.username || !editName.trim()" @click="goToTest">
                {{ t('settings.connection.next') }}
              </el-button>
              <el-button v-if="currentStep === 1 && !testing" :disabled="!editConfig.host" @click="testConn">
                {{ t('settings.connection.retest') }}
              </el-button>
              <el-button v-if="currentStep === 1 && testResult?.success" type="primary" @click="goToDeploy">
                {{ t('settings.connection.next') }}
              </el-button>
              <el-button v-if="currentStep === 2 && !deploying" :disabled="!testResult?.success" @click="deployConn">
                {{ t('settings.connection.deployRetry') }}
              </el-button>
              <el-button v-if="currentStep === 2 && deployResult?.success" type="primary" @click="goToBrowse">
                {{ t('settings.connection.next') }}
              </el-button>
              <el-button v-if="currentStep === 3" type="primary" :loading="saving" @click="saveConn">
                {{ t('settings.connection.save') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, Top, Folder, Document } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import LDialog from '@/components/ui/LDialog.vue'
import SegmentedToggle from '../ui/SegmentedToggle.vue'
import SettingsCard from './SettingsCard.vue'
import { apiService } from '@/services/ApiService'

const { t } = useI18n()

// 部署轮询取消
let deployPollingCancelled = false
let activeDeployJobId: string | null = null
function cancelDeployPolling() {
  deployPollingCancelled = true
  const jobId = activeDeployJobId
  activeDeployJobId = null
  if (jobId) {
    apiService.cancelDeploy(jobId).catch(() => {})
  }
}
onUnmounted(() => cancelDeployPolling())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cancelDeployPolling)
}

interface ConnectionConfig {
  host: string
  port: number
  username: string
  authMethod: 'password' | 'privateKey'
  password?: string
  privateKey?: string
  path: string
  /** 权限模式：workspace / readonly，缺省按 workspace 处理 */
  perm: string
}

interface Connection {
  id: string
  name: string
  config: ConnectionConfig
}

interface DirEntry {
  name: string
  isDirectory: boolean
  size: number
}

const connections = ref<Connection[]>([])
const editing = ref(false)
const editConnId = ref<string | null>(null)
const editName = ref('')
const editConfig = ref<ConnectionConfig>({
  host: '', port: 22, username: 'root', authMethod: 'password', password: '', privateKey: '', path: '', perm: 'workspace'
})
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// 权限模式
const permOptions = computed(() => [
  { value: 'workspace', label: t('settings.connection.permWorkspace') },
  { value: 'readonly', label: t('settings.connection.permReadonly') },
  { value: 'unrestricted', label: t('settings.connection.permUnrestricted') },
])
const saving = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; error?: string; log?: string } | null>(null)
const testLog = ref('')
const deploying = ref(false)
const deployResult = ref<{ success: boolean; installed: boolean; version: string; log: string[] } | null>(null)
const deployLog = ref('')

const stepLabels = computed(() => [
  t('settings.connection.stepConfig'),
  t('settings.connection.stepTest'),
  t('settings.connection.stepDeploy'),
  t('settings.connection.stepBrowse'),
])
const currentStep = ref(0)

const browserPath = ref('/')
const browserEntries = ref<DirEntry[]>([])
const browserLoading = ref(false)

async function loadData() {
  try {
    // 后端 ConnectionConfig 的 authMethod 是字面量联合，与本地同名字面量不互相赋值；
    // 字段结构一致，这里以接口返回类型为准，避免两套定义漂移
    connections.value = (await apiService.getConnections()) as unknown as Connection[]
  } catch (e) {
    console.error('Failed to load connections:', e)
  }
}
loadData()

function startNew() {
  editing.value = true
  editConnId.value = null
  editName.value = ''
  editConfig.value = { host: '', port: 22, username: 'root', authMethod: 'password', password: '', privateKey: '', path: '', perm: 'workspace' }
  testResult.value = null
  testLog.value = ''
  deployResult.value = null
  deployLog.value = ''
  currentStep.value = 0
}

function editConn(conn: Connection) {
  editing.value = true
  editConnId.value = conn.id
  editName.value = conn.name
  editConfig.value = { ...conn.config, perm: conn.config.perm || 'workspace' }
  testResult.value = null
  testLog.value = ''
  deployResult.value = null
  deployLog.value = ''
  currentStep.value = 0
}

async function goToTest() {
  currentStep.value = 1
  await testConn()
}

async function testConn() {
  testing.value = true
  testResult.value = null
  testLog.value = ''
  try {
    const result = await apiService.testConnection(editConfig.value)
    testResult.value = result
    testLog.value = result.log || ''
  } catch (e: any) {
    testResult.value = { success: false, error: e.message || String(e) }
    testLog.value = e.message || String(e)
  } finally {
    testing.value = false
  }
}

async function goToDeploy() {
  currentStep.value = 2
  await deployConn()
}

async function deployConn() {
  deploying.value = true
  deployResult.value = null
  deployLog.value = ''
  deployPollingCancelled = false
  try {
    const { jobId } = await apiService.deployConnection(editConfig.value)
    activeDeployJobId = jobId
    while (!deployPollingCancelled) {
      const state = await apiService.getDeployLog(jobId)
      deployLog.value = state.log?.join('\n') || ''
      if (state.done) {
        activeDeployJobId = null
        deployResult.value = state.result || { success: false, installed: false, version: '', log: state.log || [] }
        break
      }
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (e: any) {
    deployResult.value = { success: false, installed: false, version: '', log: [e.message || String(e)] }
    deployLog.value = e.message || String(e)
  } finally {
    deploying.value = false
  }
}

async function goToBrowse() {
  currentStep.value = 3
  browserPath.value = editConfig.value.path || `/home/${editConfig.value.username}`
  await navigateBrowser()
}

async function navigateBrowser() {
  browserLoading.value = true
  try {
    browserEntries.value = await apiService.browsePath(editConfig.value, browserPath.value)
  } catch {
    browserEntries.value = []
  } finally {
    browserLoading.value = false
  }
}

function enterDir(name: string) {
  const current = browserPath.value.endsWith('/') ? browserPath.value : browserPath.value + '/'
  browserPath.value = current + name
  navigateBrowser()
}

function goUp() {
  if (browserPath.value === '/') return
  const parts = browserPath.value.replace(/\/$/, '').split('/')
  parts.pop()
  browserPath.value = parts.join('/') || '/'
  navigateBrowser()
}

async function saveConn() {
  editConfig.value.path = browserPath.value
  if (!editName.value.trim()) { ElMessage.warning(t('settings.connection.nameRequired')); return }
  saving.value = true
  try {
    if (editConnId.value) {
      await apiService.updateConnection(editConnId.value, {
        name: editName.value, config: editConfig.value
      })
    } else {
      await apiService.createConnection(editName.value, editConfig.value)
    }
    await loadData()
    editing.value = false
    ElMessage.success(t('common.saveSuccess'))
  } catch (e: any) {
    ElMessage.error(t('common.saveFailed') + ': ' + (e.message || String(e)))
  } finally {
    saving.value = false
  }
}

async function deleteConn(id: string) {
  try {
    await apiService.deleteConnection(id)
    connections.value = connections.value.filter(c => c.id !== id)
    ElMessage.success(t('common.deleteSuccess'))
  } catch (e: any) {
    ElMessage.error(t('common.deleteFailed') + ': ' + (e.message || String(e)))
  }
}
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 颜色一律走 --el-*。原文件混用了 --color-surface* / --el-* 两层，
      且 --color-surface* 的第一层定义在未被引入的 style.css 里（一直在吃
      内层兜底）。统一收敛到 refactor.css 已经映射好的 --el-*。
   2. 卡片不加投影；.conn-card:hover 的投影属 koi 允许的第二类（悬浮反馈），
      只把写死 rgba(0,0,0,.07) 换成从正文色派生的色相。
   3. 终端面板是「固定深色」的工具窗口（模拟终端），刻意保持深色，
      它的 #14161a / #cbd5e1 属于功能性固定配色，不参与主题换肤。
   4. 圆角、过渡统一取 --el-radius-* / --el-transition-duration-fast 令牌。
   ============================================================================ */
:deep(.conn-dialog .l-dialog__body) { padding: 0; }

/* ===== 顶部 ===== */
.conn-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.conn-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--el-text-color-primary); }
.conn-sub { margin: 5px 0 0; font-size: 13px; color: var(--el-text-color-secondary); }

/* ===== 卡片网格 ===== */
.conn-grid {
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
.conn-card {
  /* 原值 14px：不属六档，14 距 lg(12px) 与 xl(16px) 各 2px，
     取 lg 档（连接卡片是页面内网格卡片，与 ReCard 同档） */
  padding: 14px; border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease, border-color var(--el-transition-duration-fast, 0.2s) ease;
}
/* hover 浮起：koi 允许的第二类投影。原值 0 6px 20px rgba(0,0,0,.07)
   是纯黑投影（深色模式下会变成脏边），改为从正文色派生 */
.conn-card:hover {
  border-color: var(--el-border-color);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
}
.conn-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.conn-card-id { display: flex; align-items: center; gap: 10px; min-width: 0; }
.conn-avatar {
  width: 34px; height: 34px;
  /* 原值 10px：不属六档，10 距 sm(6px) 与 md(8px) 中 md 更近（差 2px），取 md */
  border-radius: var(--el-radius-md, 8px); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
  color: var(--el-color-primary); background: var(--el-color-primary-light-9);
}
.conn-card-name { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.conn-card-type { font-size: 11px; color: var(--el-text-color-secondary); }
.conn-card-ops { display: flex; flex-shrink: 0; }
.conn-card-line { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conn-card-line + .conn-card-line { margin-top: 2px; }

.conn-empty { padding: 56px 0; text-align: center; }
.conn-empty-main { margin: 0; font-size: 14px; color: var(--el-text-color-regular); }
.conn-empty-sub { margin: 6px 0 0; font-size: 12.5px; color: var(--el-text-color-secondary); }

/* ===== 向导 ===== */
.wiz { display: flex; }
.wiz-steps { flex-shrink: 0; padding: 18px 20px 18px 18px; display: flex; flex-direction: column; gap: 22px; border-right: 1px solid var(--el-border-color-lighter); }
.wiz-step { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--el-text-color-secondary); white-space: nowrap; }
.wiz-dot {
  width: 22px; height: 22px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: var(--el-fill-color-light); color: var(--el-text-color-secondary);
}
.wiz-step.is-active { color: var(--el-text-color-primary); font-weight: 600; }
.wiz-step.is-active .wiz-dot { background: var(--el-color-primary); color: var(--el-color-white); }
.wiz-step.is-done { color: var(--el-color-success); }
.wiz-step.is-done .wiz-dot { background: var(--el-color-success); color: var(--el-color-white); }
.wiz-step-label { line-height: 1; }

.wiz-content { flex: 1; min-width: 0; padding: 20px 22px; display: flex; flex-direction: column; }
.wiz-pane { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; }
.pane-head { display: flex; flex-direction: column; gap: 3px; }
.pane-title { margin: 0; font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.pane-sub { margin: 0; font-size: 12.5px; color: var(--el-text-color-secondary); }

.f-label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500; color: var(--el-text-color-secondary); }
.req { color: var(--el-color-danger); }
.f-hint { margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }

/* 状态 */
.state-spinner {
  width: 32px; height: 32px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px); flex-shrink: 0;
  border: 3px solid var(--el-border-color-lighter);
  border-top-color: var(--el-text-color-regular);
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.state-ok, .state-bad {
  width: 32px; height: 32px;
  /* 原值 50%（正圆）→ full 档 */
  border-radius: var(--el-radius-full, 9999px); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.state-ok { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.state-bad { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.state-line { margin: 0; font-size: 13px; color: var(--el-text-color-regular); }
.state-line-ok { color: var(--el-color-success); font-weight: 600; }
.state-line-bad { color: var(--el-color-danger); font-weight: 600; }

/* 终端（固定深色）
   刻意不参与主题换肤：这是模拟真实终端的工具窗口，必须始终是深底浅字，
   否则「部署日志」在浅色主题下会变成一块浅底浅字、完全读不了。
   故这里的 #14161a / #cbd5e1 / #3f444d 属于功能性固定配色，不是遗漏的令牌化项。 */
.term {
  flex: 1; min-height: 120px;
  /* 原值 10px：不属六档，取最近的 md(8px) */
  border-radius: var(--el-radius-md, 8px); padding: 12px;
  background: #14161a; overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.term-pre { margin: 0; font-size: 12px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; }
.term-cursor { display: inline-block; width: 7px; height: 15px; background: var(--el-color-success); vertical-align: middle; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.log-scroll { scrollbar-width: thin; scrollbar-color: #3f444d #14161a; }
.log-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.log-scroll::-webkit-scrollbar-track { background: #14161a; }
/* 原值 4px → xs 档 */
.log-scroll::-webkit-scrollbar-thumb { background: #3f444d; border-radius: var(--el-radius-xs, 4px); }

/* 文件浏览 */
.fb { flex: 1; min-height: 0; display: flex; flex-direction: column; border: 1px solid var(--el-border-color-lighter); border-radius: var(--el-radius-md, 8px); overflow: hidden; }
.fb-up {
  display: flex; align-items: center; gap: 8px; padding: 9px 12px; flex-shrink: 0;
  font-size: 12.5px; color: var(--el-text-color-regular); cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.fb-up:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.fb-up:hover { background: var(--el-fill-color-light); }
.fb-up.is-disabled { opacity: 0.4; pointer-events: none; }
.fb-up-ico { color: var(--el-text-color-secondary); }
.fb-list { flex: 1; min-height: 0; overflow: auto; }
.fb-info { padding: 30px 0; text-align: center; font-size: 13px; color: var(--el-text-color-secondary); }
.fb-entry {
  display: flex; align-items: center; gap: 9px; padding: 8px 12px;
  cursor: pointer; font-size: 13px; outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.fb-entry:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.fb-entry:hover { background: var(--el-fill-color-light); }
.fb-ico { font-size: 16px; flex-shrink: 0; }
.fb-ico-dir { color: var(--el-color-warning); }
.fb-ico-file { color: var(--el-text-color-secondary); }
.fb-name { font-weight: 600; color: var(--el-text-color-primary); }
.fb-file-name { color: var(--el-text-color-secondary); }

.wiz-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; margin-top: auto; flex-shrink: 0; }

/* 尊重系统「减少动态效果」偏好。
   .state-spinner（测试/部署进行中）与 .term-cursor（打字光标）关掉动画后
   都不再有任何动态反馈，但二者的状态同时由同行文字承载
   （testing / deploying 文案 + 日志在持续追加），故不额外补静态样式。 */
@media (prefers-reduced-motion: reduce) {
  .conn-card,
  .fb-up,
  .fb-entry {
    transition: none;
  }
  .state-spinner,
  .term-cursor {
    animation: none;
  }
}
</style>
