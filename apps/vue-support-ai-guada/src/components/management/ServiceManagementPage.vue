<template>
  <div class="service-management-page">
    <!-- 左右分栏：左=服务实例+访问日志，右=运行日志（窄屏自动上下堆叠） -->
    <div class="sm-layout">
      <!-- ==================== 左：服务实例 + 访问日志 ==================== -->
      <section class="sm-col sm-col--left">
        <div class="sm-blocks">
          <div class="sm-block">
            <div class="page-header">
              <h3 class="col-title">服务实例</h3>
              <el-button type="primary" size="small" @click="showCreateDialog = true">新建服务实例</el-button>
            </div>

            <div class="panel-card panel-card--fill">
              <el-table :data="instances" v-loading="loading" stripe class="flat-table" height="100%">
                <el-table-column prop="name" label="名称" min-width="130" />
                <el-table-column prop="port" label="端口" width="76" />
                <el-table-column label="协议" min-width="150">
                  <template #default="{ row }">
                    <el-tag v-if="row.enableGpt" size="small" style="margin-right:4px">GPT</el-tag>
                    <el-tag v-if="row.enableCc" size="small" type="success" style="margin-right:4px">CC</el-tag>
                    <el-tag v-if="row.enableGemini" size="small" type="warning">Gemini</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="logUsage" label="记录用量" min-width="96">
                  <template #default="{ row }">
                    <el-tag :type="row.logUsage ? 'success' : 'info'" size="small">
                      {{ row.logUsage ? '开启' : '关闭' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" min-width="92">
                  <template #default="{ row }">
                    <el-tag :type="row.running ? 'success' : 'info'" size="small">
                      {{ row.running ? '运行中' : '已停止' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" min-width="220">
                  <template #default="{ row }">
                    <el-button size="small" @click="toggleInstance(row)">
                      {{ row.running ? '停止' : '启动' }}
                    </el-button>
                    <el-button size="small" @click="goTokens(row)">令牌</el-button>
                    <el-button size="small" type="danger" plain :disabled="row.running"
                      :title="row.running ? '请先停止该服务实例，再删除' : ''"
                      @click="deleteInstance(row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <div class="sm-block">
            <div class="logs-header">
              <h3 class="col-title">访问日志</h3>
              <div class="logs-controls">
                <el-select v-model="logInstanceId" size="small" class="logs-select logs-select--wide" @change="loadLogs">
                  <el-option v-for="i in instances" :key="i.id" :label="i.name + ' (' + i.port + ')'" :value="i.id" />
                </el-select>
                <el-button size="small" @click="loadLogs">
                  <el-icon class="mr-1"><ArrowClockwise24Regular /></el-icon>刷新
                </el-button>
              </div>
            </div>
            <div class="panel-card panel-card--fill">
              <el-table :data="logs" v-loading="logsLoading" size="small" stripe class="flat-table" height="100%">
                <el-table-column prop="callTime" label="时间" min-width="160" />
                <el-table-column prop="endpoint" label="端点" min-width="170" show-overflow-tooltip />
                <el-table-column prop="protocol" label="协议" min-width="84" />
                <el-table-column prop="model" label="模型" min-width="140" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" min-width="76" />
                <el-table-column label="输入/输出" min-width="104">
                  <template #default="{ row }">
                    {{ row.promptTokens ?? 0 }} / {{ row.completionTokens ?? 0 }}
                  </template>
                </el-table-column>
                <el-table-column prop="totalTokens" label="总Token" min-width="94" />
                <el-table-column label="耗时" min-width="94">
                  <template #default="{ row }">{{ formatLatency(row.latency) }}</template>
                </el-table-column>
                <el-table-column prop="clientIp" label="来源IP" min-width="124" />
              </el-table>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== 右：运行日志 ==================== -->
      <section class="sm-col sm-col--right">
        <div class="sm-block">
          <div class="logs-header">
            <h3 class="col-title">运行日志（系统日志）</h3>
            <div class="logs-controls">
              <el-select v-model="runtimeSource" size="small" class="logs-select logs-select--fixed">
                <el-option label="标准输出" value="out" />
                <el-option label="标准错误" value="err" />
              </el-select>
              <el-select v-model.number="runtimeLines" size="small" class="logs-select logs-select--fixed">
                <el-option label="最近 200 行" :value="200" />
                <el-option label="最近 500 行" :value="500" />
                <el-option label="最近 1000 行" :value="1000" />
              </el-select>
              <LTooltip content="自动刷新运行日志" placement="top">
                <el-switch v-model="runtimeAutoRefresh" size="small" />
              </LTooltip>
              <el-button size="small" @click="loadRuntimeLogs">
                <el-icon class="mr-1"><ArrowClockwise24Regular /></el-icon>刷新
              </el-button>
            </div>
          </div>
          <div class="runtime-log-meta" :title="runtimePath" v-if="runtimePath">{{ runtimePath }}</div>
          <div ref="runtimeConsoleRef" class="runtime-console runtime-console--fill" v-loading="runtimeLoading">
            <div v-if="!runtimeLogLines.length && !runtimeLoading" class="runtime-console__empty">暂无日志</div>
            <div v-for="(l, idx) in runtimeLogLines" :key="idx"
                 class="runtime-line" :class="lineLevelClass(l.level)">
              <span class="runtime-line__raw">{{ l.raw }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 新建实例对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建服务实例" width="min(500px, 92vw)" append-to-body>
      <el-form :model="newInstance" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="newInstance.name" placeholder="如：我的AGNES服务" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="newInstance.port" :min="8000" :max="9999" />
        </el-form-item>
        <el-form-item label="协议开关">
          <el-checkbox v-model="newInstance.enableGpt">GPT (OpenAI兼容)</el-checkbox>
          <el-checkbox v-model="newInstance.enableCc">CC (Claude兼容)</el-checkbox>
          <el-checkbox v-model="newInstance.enableGemini">Gemini兼容</el-checkbox>
        </el-form-item>
        <el-form-item label="记录用量">
          <el-switch v-model="newInstance.logUsage" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createInstance">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createClient, v2Http } from '@/framework/context'
import LTooltip from '@/components/ui/LTooltip.vue'
import { ArrowClockwise24Regular } from '@vicons/fluent'

const http = createClient(v2Http, { unwrap: false })
const router = useRouter()

const toBool = (v: any) => v === 1 || v === true
function asList(payload: any, key: string): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload[key])) return payload[key]
  if (payload && Array.isArray(payload.records)) return payload.records
  return []
}
function mapInstance(r: any) {
  return {
    id: r.instanceId ?? r.id,
    name: r.instanceName ?? r.name,
    port: r.port,
    enableGpt: toBool(r.openaiEnabled ?? r.enableGpt),
    enableCc: toBool(r.ccEnabled ?? r.enableCc),
    enableGemini: toBool(r.geminiEnabled ?? r.enableGemini),
    logUsage: toBool(r.recordUsage ?? r.logUsage),
    running: toBool(r.running),
    enabled: toBool(r.enabled ?? 1),
  }
}
function mapLog(r: any) {
  return {
    callTime: r.createTime ?? r.callTime,
    endpoint: r.endpoint,
    protocol: r.protocol,
    model: r.model,
    status: r.status,
    promptTokens: r.promptTokens,
    completionTokens: r.completionTokens,
    totalTokens: r.totalTokens,
    latency: r.latencyMs ?? r.latency,
    clientIp: r.clientIp,
  }
}
function formatLatency(ms: any) {
  if (ms == null) return '-'
  return Number(ms) < 1000 ? ms + 'ms' : (Number(ms) / 1000).toFixed(2) + 's'
}

const loading = ref(false)
const instances = ref<any[]>([])
const showCreateDialog = ref(false)
const logs = ref<any[]>([])
const logsLoading = ref(false)
const logInstanceId = ref('')

const newInstance = ref({
  name: '',
  port: 8790,
  enableGpt: true,
  enableCc: true,
  enableGemini: true,
  logUsage: true
})

async function loadInstances() {
  loading.value = true
  try {
    const res = await http.get('/service/instances')
    instances.value = asList(res.data, 'instances').map(mapInstance)
    if (instances.value.length && !logInstanceId.value) {
      logInstanceId.value = instances.value[0].id
      loadLogs()
    }
  } catch (e: any) {
    ElMessage.error('加载实例失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function createInstance() {
  if (!newInstance.value.name.trim()) {
    ElMessage.warning('请填写实例名称')
    return
  }
  try {
    await http.post('/service/instances', {
      name: newInstance.value.name,
      port: newInstance.value.port,
      openai: newInstance.value.enableGpt,
      cc: newInstance.value.enableCc,
      gemini: newInstance.value.enableGemini,
      recordUsage: newInstance.value.logUsage,
    })
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    newInstance.value = { name: '', port: 8790, enableGpt: true, enableCc: true, enableGemini: true, logUsage: true }
    loadInstances()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + e.message)
  }
}

async function toggleInstance(row: any) {
  try {
    await http.post(`/service/instances/${row.id}/${row.running ? 'stop' : 'start'}`)
    ElMessage.success(row.running ? '已停止' : '已启动')
    loadInstances()
  } catch (e: any) {
    ElMessage.error('操作失败: ' + e.message)
  }
}

async function deleteInstance(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该实例？关联的令牌与访问日志会一并清理。', '提示', { type: 'warning' })
    const res = await http.delete(`/service/instances/${row.id}`)
    const d = res.data || {}
    if (d.ok === false) {
      ElMessage.warning(d.error || '请先停止该服务实例，再删除')
      return
    }
    ElMessage.success('已删除')
    logs.value = []
    logInstanceId.value = ''
    loadInstances()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败: ' + e.message)
  }
}

function goTokens(row: any) {
  router.push({
    name: 'SystemSettings',
    params: { tab: 'service-tokens' },
    query: { instanceId: row.id },
  })
}

async function loadLogs() {
  if (!logInstanceId.value) return
  logsLoading.value = true
  try {
    const res = await http.get('/service/logs', { params: { instanceId: logInstanceId.value, limit: 50 } })
    logs.value = asList(res.data, 'logs').map(mapLog)
  } catch (e: any) {
    ElMessage.error('加载日志失败: ' + e.message)
  } finally {
    logsLoading.value = false
  }
}

// ===== 运行日志（系统日志） =====
const runtimeSource = ref<'out' | 'err'>('out')
const runtimeLines = ref(300)
const runtimeAutoRefresh = ref(false)
const runtimeLoading = ref(false)
const runtimeLogLines = ref<Array<{ raw: string; level: string | null }>>([])
const runtimePath = ref('')
const runtimeConsoleRef = ref<HTMLElement | null>(null)
let runtimeTimer: ReturnType<typeof setInterval> | null = null

function lineLevelClass(level: string | null) {
  if (!level) return 'runtime-line--default'
  const l = level.toLowerCase()
  if (l === 'error' || l === 'fatal') return 'runtime-line--error'
  if (l === 'warn') return 'runtime-line--warn'
  if (l === 'debug' || l === 'trace') return 'runtime-line--debug'
  return 'runtime-line--info'
}

function scrollConsoleToBottom() {
  nextTick(() => {
    const el = runtimeConsoleRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function loadRuntimeLogs() {
  runtimeLoading.value = true
  try {
    const res = await http.get('/service/runtime-logs', {
      params: { source: runtimeSource.value, lines: runtimeLines.value },
    })
    const d = res.data || {}
    runtimeLogLines.value = Array.isArray(d.lines) ? d.lines : []
    runtimePath.value = d.path || ''
    scrollConsoleToBottom()
  } catch (e: any) {
    ElMessage.error('加载运行日志失败: ' + e.message)
  } finally {
    runtimeLoading.value = false
  }
}

function applyAutoRefresh() {
  if (runtimeAutoRefresh.value) {
    if (!runtimeTimer) runtimeTimer = setInterval(loadRuntimeLogs, 3000)
  } else if (runtimeTimer) {
    clearInterval(runtimeTimer)
    runtimeTimer = null
  }
}

watch(runtimeAutoRefresh, applyAutoRefresh)
watch(runtimeSource, loadRuntimeLogs)
watch(runtimeLines, loadRuntimeLogs)

onMounted(() => {
  loadInstances()
  loadRuntimeLogs()
})

onUnmounted(() => {
  if (runtimeTimer) clearInterval(runtimeTimer)
})
</script>

<style scoped>
/* 铺满可用宽度：父级为 flex 容器，本页需显式 width/min-width 才能吃满，
   否则块级 div 会按内容宽度收缩，右侧留白且表格被压缩。 */
.service-management-page {
  padding: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
/* 表格容器窄屏可横向滚动，避免列被挤扁 */
.panel-card {
  background: var(--color-surface, var(--el-bg-color));
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: 18px;
  padding: 14px 16px 12px;
  box-shadow: 0 10px 30px -18px rgba(16, 24, 40, 0.22);
  max-width: 100%;
  overflow-x: auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.col-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ===== 左右分栏：左实例 / 右日志；容器矮于阈值时自动上下堆叠 ===== */
.sm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-width: 0;
}
.sm-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
/* 每栏内部：块级纵向排列，块内内容区自适应高度并内部滚动 */
.sm-blocks,
.sm-col {
  gap: 16px;
}
.sm-block {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 260px;
  min-width: 0;
}
.panel-card--fill {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 12px 8px;
}
.runtime-console--fill {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}

@media (max-width: 1180px) {
  .sm-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .sm-block {
    min-height: 320px;
  }
}

.flat-table { --el-table-border-color: var(--el-border-color-lighter); width: 100%; }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  /* 标题与控件始终同一行：标题不换行，控件整体可压缩 */
  flex-wrap: nowrap;
  margin-bottom: 12px;
}
.logs-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  flex-shrink: 0;
}
.logs-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  /* 下拉与刷新按钮同行，不换行 */
  flex-wrap: nowrap;
  min-width: 0;
}
/* 下拉/选择框：吃掉控件行剩余空间，给足最小宽度，装得下「实例名 (端口)」这类标签 */
.logs-select {
  flex: 1 1 auto;
  width: auto;
  min-width: 108px;
  max-width: 100%;
}
.logs-select--wide {
  flex: 2 1 auto;
  min-width: 156px;
  max-width: 300px;
}
/* 不参与伸缩的固定宽度控件（输出源、行数） */
.logs-select--fixed {
  flex: 0 0 auto;
  min-width: 96px;
  width: auto;
}
/* 窄屏下标题独占一行、控件仍保持同行 */
@media (max-width: 720px) {
  .logs-header {
    flex-wrap: wrap;
  }
  .logs-controls {
    width: 100%;
  }
}

.runtime-log-meta {
  margin: 6px 0 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-monospace, monospace);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}
/* 运行日志：与其它卡片同一套表面语言（surface 底 + 边框 + 18px 圆角 + 阴影），
   内部再嵌一层 console 底色，形成「卡片 + 代码区」两层，与左栏表格卡片视觉一致 */
.runtime-console {
  background: var(--color-surface, var(--el-bg-color));
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: 18px;
  box-shadow: 0 10px 30px -18px rgba(16, 24, 40, 0.22);
  max-height: 440px;
  overflow-y: auto;
  padding: 10px 12px;
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
}
.runtime-console__empty {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 24px 0;
}
.runtime-line {
  white-space: pre-wrap;
  word-break: break-all;
}
.runtime-line__raw {
  color: var(--el-text-color-regular);
}
.runtime-line--error .runtime-line__raw { color: var(--el-color-danger); }
.runtime-line--warn .runtime-line__raw { color: var(--el-color-warning); }
.runtime-line--info .runtime-line__raw { color: var(--el-text-color-regular); }
.runtime-line--debug .runtime-line__raw { color: var(--el-text-color-secondary); }
.runtime-line--default .runtime-line__raw { color: var(--el-text-color-regular); }
.runtime-console::-webkit-scrollbar { width: 8px; }
.runtime-console::-webkit-scrollbar-thumb {
  background: var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: 4px;
}
.runtime-console::-webkit-scrollbar-thumb:hover {
  background: var(--color-surface-hover, var(--el-border-color));
}
.runtime-console::-webkit-scrollbar-track { background: transparent; }
</style>
