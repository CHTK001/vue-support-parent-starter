<template>
  <div class="editor-panel">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="editor-toolbar__left">
        <!-- 模式切换按钮 -->
        <div class="mode-switcher">
          <ElTooltip content="编辑模式" placement="bottom">
            <ElButton
              :type="editorMode === 'editor' ? 'primary' : ''"
              size="small"
              @click="editorMode = 'editor'"
            >
              <IconifyIconOnline icon="ep:edit" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="UI 模式" placement="bottom">
            <ElButton
              :type="editorMode === 'ui' ? 'primary' : ''"
              size="small"
              @click="editorMode = 'ui'"
            >
              <IconifyIconOnline icon="ep:grid" />
            </ElButton>
          </ElTooltip>
          <ElTooltip content="分栏模式" placement="bottom">
            <ElButton
              :type="editorMode === 'split' ? 'primary' : ''"
              size="small"
              @click="editorMode = 'split'"
            >
              <IconifyIconOnline icon="ep:column" />
            </ElButton>
          </ElTooltip>
        </div>
        <span class="editor-path">
          <ElIcon><Document /></ElIcon>
          {{ activeConfigPath || '/etc/nginx/nginx.conf' }}
        </span>
      </div>
      <div class="editor-toolbar__right">
        <!-- UI 模式下显示表单模式切换 -->
        <template v-if="editorMode === 'ui'">
          <ElTooltip content="表单模式">
            <ElButton :type="formMode ? 'primary' : ''" size="small" @click="toggleFormMode">
              <IconifyIconOnline icon="ep:list" />
            </ElButton>
          </ElTooltip>
        </template>
        <ElTooltip content="语法检查 (nginx -t)">
          <ElButton size="small" :loading="checking" @click="checkConfig">
            <IconifyIconOnline icon="ep:circle-check" />
          </ElButton>
        </ElTooltip>
        <ElButton type="primary" size="small" :loading="saving" @click="saveAndReload">
          <IconifyIconOnline icon="ri:save-2-fill" />
        </ElButton>
      </div>
    </div>

    <!-- 检查结果 -->
    <div
      v-if="checkResult"
      class="check-result"
      :class="checkResult.ok ? 'check-result--ok' : 'check-result--err'"
    >
      <ElIcon>
        <component :is="checkResult.ok ? CircleCheck : Warning" />
      </ElIcon>
      <pre class="check-result__text">{{ checkResult.message }}</pre>
    </div>

    <div class="editor-wrap">
      <div v-if="configLoading" class="editor-loading">
        <ElIcon class="is-loading"><Loading /></ElIcon>
        <span>加载中…</span>
      </div>
      <template v-else>

        <!-- ══ 模式1：编辑模式 ══ -->
        <template v-if="editorMode === 'editor'">
          <div class="editor-with-lines">
            <div class="line-numbers" ref="lineNumbersRef">
              <div v-for="n in lineCount" :key="n" class="line-number">{{ n }}</div>
            </div>
            <textarea
              ref="textareaRef"
              v-model="configContent"
              class="nginx-editor"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              placeholder="选择左侧配置文件进行编辑…"
              @scroll="syncScroll"
              @input="updateLineCount"
            />
          </div>
        </template>

        <!-- ══ 模式2：UI 模式 ══ -->
        <template v-else-if="editorMode === 'ui'">
          <!-- server 卡片列表 -->
          <div v-if="!editingServer && !formMode" class="server-cards-panel">
            <ElScrollbar class="server-cards-scroll">
              <div v-if="!servers.length" class="server-cards-empty">
                <ElEmpty description="暂无站点，点击左侧 + 添加" :image-size="48" />
              </div>
              <div v-else class="server-cards-list">
                <div
                  v-for="(server, si) in servers"
                  :key="si"
                  :ref="(el) => { if (el) serverCardRefs[si] = el as HTMLElement }"
                  class="server-card"
                  :class="{ 'is-active': activeServerIndex === si }"
                >
                  <div class="server-card__header">
                    <div class="server-card__title-row">
                      <ElIcon class="server-card__globe"><Connection /></ElIcon>
                      <span class="server-card__name">{{ server.serverName || '未命名站点' }}</span>
                      <span class="server-card__port">:{{ server.listen || '80' }}</span>
                      <span class="server-card__loc-count">{{ (server.locations || []).length }} locations</span>
                    </div>
                    <div class="server-card__badges">
                      <ElTag v-if="server.sslCertificate" type="success" size="small" class="server-card__ssl-tag">
                        <ElIcon><Lock /></ElIcon> SSL
                      </ElTag>
                    </div>
                  </div>
                  <div v-if="server.root" class="server-card__root">
                    root: {{ server.root }}
                  </div>
                  <div class="server-card__footer">
                    <ElButton type="primary" size="small" @click="emit('open-edit', si)">
                      <ElIcon><EditPen /></ElIcon>编辑
                    </ElButton>
                    <ElButton size="small" @click="emit('add-location', si)">
                      <ElIcon><Plus /></ElIcon>添加映射
                    </ElButton>
                    <ElButton type="danger" plain size="small" @click="emit('delete-server', si)">
                      <ElIcon><Delete /></ElIcon>删除
                    </ElButton>
                  </div>
                </div>
              </div>
            </ElScrollbar>
          </div>

          <!-- server 编辑表单 -->
          <div v-else-if="editingServer && activeServerIndex >= 0" class="form-panel">
            <div class="form-panel__header">
              <span class="form-panel__title">
                <ElIcon><Connection /></ElIcon>
                编辑站点 #{{ activeServerIndex + 1 }}
              </span>
              <div style="display:flex;gap:8px">
                <ElButton size="small" @click="emit('back')">← 返回站点列表</ElButton>
                <ElButton type="primary" size="small" :loading="savingServer" @click="doSaveServer">
                  <ElIcon><Check /></ElIcon>保存并 Reload
                </ElButton>
              </div>
            </div>
            <ElScrollbar class="form-panel__scroll">
              <div class="form-body">
                <div class="form-row">
                  <label class="form-label">监听端口</label>
                  <input v-model="serverForm.listen" class="form-input" placeholder="80 或 443 ssl" />
                </div>
                <div class="form-row">
                  <label class="form-label">域名 (server_name)</label>
                  <input v-model="serverForm.serverName" class="form-input" placeholder="example.com www.example.com" />
                </div>
                <div class="form-row">
                  <label class="form-label">根目录 (root)</label>
                  <input v-model="serverForm.root" class="form-input" placeholder="/var/www/html" />
                </div>
                <div class="form-row">
                  <label class="form-label">默认文件 (index)</label>
                  <input v-model="serverForm.index" class="form-input" placeholder="index.html index.php" />
                </div>
                <div class="form-row">
                  <label class="form-label">SSL 证书</label>
                  <input v-model="serverForm.sslCertificate" class="form-input" placeholder="/etc/ssl/cert.pem" />
                </div>
                <div class="form-row">
                  <label class="form-label">SSL 私钥</label>
                  <input v-model="serverForm.sslCertificateKey" class="form-input" placeholder="/etc/ssl/key.pem" />
                </div>
              </div>
              <div class="form-section-title">Location 映射</div>
              <div class="location-form-list">
                <div
                  v-for="(loc, li) in serverForm.locations"
                  :key="li"
                  class="location-form-item"
                >
                  <div class="location-form-item__head">
                    <span class="location-form-item__path">{{ loc.path || '/' }}</span>
                    <ElTag
                      :type="loc.mode === 'proxy' ? 'primary' : loc.mode === 'static' ? 'success' : loc.mode === 'redirect' ? 'warning' : 'info'"
                      size="small"
                      class="location-mode-tag"
                    >
                      {{ loc.mode === 'proxy' ? '反向代理' : loc.mode === 'static' ? '静态文件' : loc.mode === 'redirect' ? '重定向' : loc.mode === 'custom' ? '自定义' : '反向代理' }}
                    </ElTag>
                    <ElButton :icon="Delete" circle plain size="small" type="danger" @click.stop="emit('delete-location', li)" />
                  </div>
                  <div class="location-form-item__body">
                    <div class="form-row-inline">
                      <label>路径</label>
                      <input v-model="loc.path" class="form-input" placeholder="/" />
                    </div>
                    <div class="form-row-inline">
                      <label>代理地址</label>
                      <input v-model="loc.proxyPass" class="form-input" placeholder="http://127.0.0.1:8080" />
                    </div>
                    <div class="form-row-inline">
                      <label>根目录</label>
                      <input v-model="loc.root" class="form-input" placeholder="/var/www/html" />
                    </div>
                    <div class="form-row-inline">
                      <label>try_files</label>
                      <input v-model="loc.tryFiles" class="form-input" placeholder="$uri $uri/ =404" />
                    </div>
                    <NginxLocationSecurityFields :location="loc" />
                  </div>
                </div>
                <div class="location-add-btn" @click="emit('add-location', activeServerIndex)">
                  <ElIcon><Plus /></ElIcon>
                  添加 location 映射
                </div>
              </div>
            </ElScrollbar>
          </div>

          <!-- 表单模式（全局参数） -->
          <div v-else-if="formMode" class="form-panel">
            <div class="form-panel__header">
              <span class="form-panel__title">
                <ElIcon><List /></ElIcon>
                表单模式
              </span>
              <ElButton type="primary" size="small" :loading="saving" @click="applyAndSave">
                <ElIcon><Check /></ElIcon>
                应用并保存
              </ElButton>
            </div>
            <ElScrollbar class="form-panel__scroll">
              <div class="form-body">
                <div class="form-row">
                  <label class="form-label">工作进程数</label>
                  <input v-model="nginxForm.worker_processes" class="form-input" placeholder="auto 或数字" />
                </div>
                <div class="form-row">
                  <label class="form-label">连接数上限</label>
                  <input v-model="nginxForm.worker_connections" class="form-input" type="number" placeholder="1024" />
                </div>
                <div class="form-row">
                  <label class="form-label">错误日志路径</label>
                  <input v-model="nginxForm.error_log_path" class="form-input" placeholder="/var/log/nginx/error.log" />
                </div>
                <div class="form-row">
                  <label class="form-label">日志级别</label>
                  <ElSelect v-model="nginxForm.error_log_level" size="small" class="form-select">
                    <ElOption v-for="lv in ['debug','info','notice','warn','error','crit']" :key="lv" :label="lv" :value="lv" />
                  </ElSelect>
                </div>
                <div class="form-row">
                  <label class="form-label">访问日志</label>
                  <input v-model="nginxForm.access_log" class="form-input" placeholder="/var/log/nginx/access.log" />
                </div>
                <div class="form-row">
                  <label class="form-label">Gzip 压缩</label>
                  <ElSwitch v-model="nginxForm.gzip" active-text="on" inactive-text="off" />
                </div>
                <div class="form-row">
                  <label class="form-label">Keepalive 超时 (s)</label>
                  <NginxUnitInput
                    v-model="nginxForm.keepalive_timeout"
                    :units="timeUnits"
                    default-unit="s"
                    placeholder="65"
                    :min="1"
                  />
                </div>
                <div class="form-row">
                  <label class="form-label">客户端最大请求体</label>
                  <NginxUnitInput
                    v-model="nginxForm.client_max_body_size"
                    :units="sizeUnits"
                    default-unit="m"
                    placeholder="1"
                    :min="1"
                  />
                </div>
              </div>
              <div class="form-hint">表单只覆盖已识别的指令，其他配置保持不变</div>
            </ElScrollbar>
          </div>
        </template>

        <!-- ══ 模式3：分栏模式 ══ -->
        <template v-else-if="editorMode === 'split'">
          <div class="split-panel">
            <!-- 左侧：server 卡片列表 -->
            <div class="split-left">
              <div v-if="!servers.length" class="server-cards-empty">
                <ElEmpty description="暂无站点" :image-size="48" />
              </div>
              <div v-else class="server-cards-list">
                <div
                  v-for="(server, si) in servers"
                  :key="si"
                  class="server-card server-card--clickable"
                  :class="{ 'is-active': splitActiveIndex === si }"
                  @click="onSplitCardClick(si)"
                >
                  <div class="server-card__header">
                    <div class="server-card__title-row">
                      <ElIcon class="server-card__globe"><Connection /></ElIcon>
                      <span class="server-card__name">{{ server.serverName || '未命名站点' }}</span>
                      <span class="server-card__port">:{{ server.listen || '80' }}</span>
                    </div>
                    <div class="server-card__badges">
                      <ElTag v-if="server.sslCertificate" type="success" size="small">SSL</ElTag>
                    </div>
                  </div>
                  <div v-if="server.root" class="server-card__root">
                    root: {{ server.root }}
                  </div>
                  <div class="server-card__loc-count-row">
                    <span class="server-card__loc-count">{{ (server.locations || []).length }} locations</span>
                    <span v-if="splitActiveIndex === si" class="split-jump-hint">↗ 已定位</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：文本编辑器（带行号） -->
            <div class="split-right">
              <div class="editor-with-lines">
                <div class="line-numbers" ref="splitLineNumbersRef">
                  <div
                    v-for="n in lineCount"
                    :key="n"
                    class="line-number"
                    :class="{ 'line-number--highlight': highlightedLine === n - 1 }"
                  >{{ n }}</div>
                </div>
                <textarea
                  ref="splitTextareaRef"
                  v-model="configContent"
                  class="nginx-editor"
                  spellcheck="false"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  placeholder="选择左侧配置文件进行编辑…"
                  @scroll="syncSplitScroll"
                  @input="updateLineCount"
                />
              </div>
            </div>
          </div>
        </template>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Check,
  CircleCheck,
  Connection,
  Delete,
  Document,
  EditPen,
  List,
  Loading,
  Lock,
  Plus,
  Warning,
} from '@element-plus/icons-vue'
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElMessage,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElSwitch,
  ElTag,
  ElTooltip,
} from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  fetchNginxStatus,
  readNginxConfig,
  reloadNginx,
  writeNginxConfig,
  type NginxServerBlock,
} from '../../api/nginx'
import { IconifyIconOnline } from '@repo/components'
import NginxLocationSecurityFields from './NginxLocationSecurityFields.vue'
import NginxUnitInput from './NginxUnitInput.vue'

const props = defineProps<{
  connectionId: string
  activeConfigPath: string
  servers: NginxServerBlock[]
  activeServerIndex: number
  editingServer: boolean
  serverForm: NginxServerBlock
  serverCardRefs: HTMLElement[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'save-server'): void
  (e: 'add-location', si: number): void
  (e: 'delete-location', li: number): void
  (e: 'delete-server', si: number): void
  (e: 'open-edit', si: number): void
  (e: 'config-saved'): void
}>()

// ─── 模式控制 ─────────────────────────────────────────────────────────────────
type EditorMode = 'editor' | 'ui' | 'split'
const editorMode = ref<EditorMode>('ui')

// ─── 编辑器状态 ───────────────────────────────────────────────────────────────
const configContent = ref('')
const configLoading = ref(false)
const saving = ref(false)
const savingServer = ref(false)
const checking = ref(false)
const checkResult = ref<{ ok: boolean; message: string } | null>(null)
const formMode = ref(false)

// ─── 行号相关 ─────────────────────────────────────────────────────────────────
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersRef = ref<HTMLDivElement | null>(null)
const splitTextareaRef = ref<HTMLTextAreaElement | null>(null)
const splitLineNumbersRef = ref<HTMLDivElement | null>(null)
const highlightedLine = ref(-1)

const lineCount = computed(() => {
  const lines = configContent.value.split('\n').length
  return Math.max(lines, 1)
})

const updateLineCount = () => {
  // lineCount 是 computed，自动更新，此处保留供 @input 绑定
}

const syncScroll = () => {
  if (lineNumbersRef.value && textareaRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

const syncSplitScroll = () => {
  if (splitLineNumbersRef.value && splitTextareaRef.value) {
    splitLineNumbersRef.value.scrollTop = splitTextareaRef.value.scrollTop
  }
}

// ─── 分栏模式 ─────────────────────────────────────────────────────────────────
const splitActiveIndex = ref(-1)

const findServerLine = (si: number): number => {
  const lines = configContent.value.split('\n')
  let serverCount = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*server\s*\{/.test(lines[i])) {
      if (serverCount === si) return i
      serverCount++
    }
  }
  return 0
}

const jumpToLine = (lineNum: number) => {
  const ta = splitTextareaRef.value
  if (!ta) return
  const lineHeight = 22 // 1.7 * 13px ≈ 22px
  ta.scrollTop = lineNum * lineHeight
  if (splitLineNumbersRef.value) {
    splitLineNumbersRef.value.scrollTop = lineNum * lineHeight
  }
  highlightedLine.value = lineNum
  setTimeout(() => { highlightedLine.value = -1 }, 2000)
}

const onSplitCardClick = (si: number) => {
  splitActiveIndex.value = si
  jumpToLine(findServerLine(si))
}

// ─── 全局参数表单 ─────────────────────────────────────────────────────────────
const nginxForm = reactive({
  worker_processes: 'auto',
  worker_connections: '1024',
  error_log_path: '/var/log/nginx/error.log',
  error_log_level: 'warn',
  access_log: '/var/log/nginx/access.log',
  gzip: false,
  keepalive_timeout: '65s',
  client_max_body_size: '1m',
  server_names_hash_bucket_size: '64',
})

const timeUnits = [
  { label: '秒 (s)', value: 's' },
  { label: '毫秒 (ms)', value: 'ms' },
  { label: '分钟 (m)', value: 'm' },
]

const sizeUnits = [
  { label: 'KB (k)', value: 'k' },
  { label: 'MB (m)', value: 'm' },
  { label: 'GB (g)', value: 'g' },
]

const normalizeNginxUnitValue = (value: string | null | undefined, defaultUnit: string) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const match = raw.match(/^(-?\d+(?:\.\d+)?)([a-zA-Z]+)?$/)
  if (!match) return raw
  const number = match[1]
  const unit = (match[2] || defaultUnit).toLowerCase()
  return `${number}${unit}`
}

// ─── 配置加载 ─────────────────────────────────────────────────────────────────
const loadConfig = async (path: string) => {
  configLoading.value = true
  checkResult.value = null
  try {
    const res = await readNginxConfig(props.connectionId, path)
    configContent.value = res?.data ?? ''
  } catch (e: any) {
    ElMessage.error('读取配置失败: ' + (e?.message ?? ''))
  } finally {
    configLoading.value = false
  }
}

const checkConfig = async () => {
  checking.value = true
  checkResult.value = null
  try {
    const res = await fetchNginxStatus(props.connectionId)
    const configTest = (res?.data as any)?.configTest ?? ''
    const ok = configTest.includes('syntax is ok') || configTest.includes('test is successful')
    checkResult.value = { ok, message: configTest }
  } catch (e: any) {
    checkResult.value = { ok: false, message: e?.message ?? '检查失败' }
  } finally {
    checking.value = false
  }
}

const saveAndReload = async () => {
  if (!props.activeConfigPath) return
  saving.value = true
  try {
    await writeNginxConfig(props.connectionId, props.activeConfigPath, configContent.value)
    const res = await reloadNginx(props.connectionId)
    const result = res?.data as any
    if (result?.success) ElMessage.success('保存并 Reload 成功')
    else ElMessage.warning('已保存，Reload 输出: ' + (result?.output ?? ''))
    emit('config-saved')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message ?? ''))
  } finally {
    saving.value = false
  }
}

const doSaveServer = () => {
  emit('save-server')
}

// ─── 表单模式 ─────────────────────────────────────────────────────────────────
const parseConfigToForm = () => {
  const c = configContent.value
  const get = (key: string) => {
    const m = c.match(new RegExp(`^\\s*${key}\\s+([^;\\n]+);`, 'm'))
    return m ? m[1].trim() : null
  }
  const wp = get('worker_processes')
  if (wp) nginxForm.worker_processes = wp
  const wc = get('worker_connections')
  if (wc) nginxForm.worker_connections = wc
  const el = c.match(/^\s*error_log\s+(\S+)\s*(\S+)?;/m)
  if (el) { nginxForm.error_log_path = el[1]; nginxForm.error_log_level = el[2] ?? 'warn' }
  const al = get('access_log')
  if (al) nginxForm.access_log = al.split(/\s+/)[0]
  const gz = get('gzip')
  if (gz) nginxForm.gzip = gz === 'on'
  const kt = get('keepalive_timeout')
  if (kt) nginxForm.keepalive_timeout = normalizeNginxUnitValue(kt, 's')
  const cmbs = get('client_max_body_size')
  if (cmbs) nginxForm.client_max_body_size = normalizeNginxUnitValue(cmbs, 'm')
  const snhbs = get('server_names_hash_bucket_size')
  if (snhbs) nginxForm.server_names_hash_bucket_size = snhbs
}

const applyFormToConfig = () => {
  let c = configContent.value
  const replace = (key: string, val: string) => {
    const re = new RegExp(`(^\\s*${key}\\s+)[^;\\n]+(;)`, 'm')
    if (re.test(c)) c = c.replace(re, `$1${val}$2`)
    else c = c.replace(/(http\s*\{[\s\S]*?)(^\s*\})/m, `$1    ${key} ${val};\n$2`)
  }
  replace('worker_processes', nginxForm.worker_processes)
  replace('worker_connections', nginxForm.worker_connections)
  const elRe = /^(\s*error_log\s+)\S+(\s*\S*)(;)/m
  if (elRe.test(c)) c = c.replace(elRe, `$1${nginxForm.error_log_path} ${nginxForm.error_log_level}$3`)
  else c = c.replace(/(http\s*\{[\s\S]*?)(^\s*\})/m, `$1    error_log ${nginxForm.error_log_path} ${nginxForm.error_log_level};\n$2`)
  replace('access_log', nginxForm.access_log)
  replace('gzip', nginxForm.gzip ? 'on' : 'off')
  replace('keepalive_timeout', nginxForm.keepalive_timeout || '65s')
  replace('client_max_body_size', nginxForm.client_max_body_size || '1m')
  replace('server_names_hash_bucket_size', nginxForm.server_names_hash_bucket_size)
  configContent.value = c
  ElMessage.success('表单已应用到配置')
}

const toggleFormMode = () => {
  if (!formMode.value) parseConfigToForm()
  formMode.value = !formMode.value
}

const applyAndSave = async () => {
  applyFormToConfig()
  await saveAndReload()
}

watch(() => props.activeConfigPath, (path) => {
  if (path) loadConfig(path)
})

onMounted(() => {
  if (props.activeConfigPath) loadConfig(props.activeConfigPath)
})
</script>

<style scoped lang="scss">
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f172a;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.96);
  border-bottom: 1px solid rgba(99, 102, 241, 0.18);
  flex-shrink: 0;
}

.editor-toolbar__left,
.editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 10px;
  border-right: 1px solid rgba(99, 102, 241, 0.2);
  margin-right: 4px;
}

.editor-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #94a3b8;

  .el-icon { color: #6366f1; }
}

.check-result {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);

  .el-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

  &--ok { background: rgba(16, 185, 129, 0.1); .el-icon { color: #10b981; } }
  &--err { background: rgba(239, 68, 68, 0.1); .el-icon { color: #ef4444; } }
}

.check-result__text {
  margin: 0;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-all;
}

.editor-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #64748b;
  font-size: 13px;
}

/* ── 行号编辑器 ── */
.editor-with-lines {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.line-numbers {
  width: 40px;
  flex-shrink: 0;
  background: #0a1120;
  border-right: 1px solid rgba(99, 102, 241, 0.12);
  overflow: hidden;
  padding: 16px 0;
  box-sizing: border-box;
  user-select: none;
}

.line-number {
  height: 22px;
  line-height: 22px;
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #475569;
  text-align: right;
  padding-right: 8px;
  box-sizing: border-box;
  transition: color 0.15s, background 0.15s;

  &--highlight {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
  }
}

.nginx-editor {
  flex: 1;
  padding: 16px;
  box-sizing: border-box;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 22px;
  border: none;
  outline: none;
  resize: none;
  tab-size: 4;

  &::placeholder { color: #334155; }

  &::-webkit-scrollbar { width: 6px; height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 3px; }
}

/* ── 分栏模式 ── */
.split-panel {
  display: grid;
  grid-template-columns: 360px 1fr;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.split-left {
  border-right: 1px solid rgba(99, 102, 241, 0.18);
  overflow-y: auto;
  background: #f1f5f9;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.25); border-radius: 2px; }
}

.split-right {
  display: flex;
  flex-direction: column;
  background: #0f172a;
  min-height: 0;
}

.server-card__loc-count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px 10px;
}

.split-jump-hint {
  font-size: 11px;
  color: #6366f1;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(4px); }
  to { opacity: 1; transform: translateX(0); }
}

.server-card--clickable {
  cursor: pointer;
}

/* ── 卡片列表 ── */
.server-cards-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f1f5f9;
}

.server-cards-scroll { height: 100%; }

.server-cards-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 0;
}

.server-cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.server-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;

  &:hover {
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12), 0 4px 20px rgba(99, 102, 241, 0.12);
  }
}

.server-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.7);
}

.server-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.server-card__globe { font-size: 16px; color: #6366f1; flex-shrink: 0; }

.server-card__name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-card__port {
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #6366f1;
  font-weight: 600;
  flex-shrink: 0;
  background: rgba(99, 102, 241, 0.08);
  padding: 2px 7px;
  border-radius: 6px;
}

.server-card__loc-count {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
  background: rgba(148, 163, 184, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.server-card__badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.server-card__ssl-tag { display: inline-flex; align-items: center; gap: 3px; }

.server-card__root {
  padding: 8px 16px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: #64748b;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.server-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

/* ── 表单面板 ── */
.form-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.form-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  flex-shrink: 0;
}

.form-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;

  .el-icon { color: #6366f1; font-size: 15px; }
}

.form-panel__scroll { flex: 1; min-height: 0; }

.form-body { padding: 8px 0; }

.form-row {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  gap: 12px;

  &:last-child { border-bottom: none; }
}

.form-label {
  flex-shrink: 0;
  width: 160px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.form-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.14s, box-shadow 0.14s;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: #fff;
  }
}

.form-select { flex: 1; }

.form-hint {
  padding: 12px 20px 16px;
  font-size: 11.5px;
  color: #94a3b8;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  margin-top: 4px;
}

.form-section-title {
  padding: 10px 20px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  margin-top: 8px;
}

.location-form-list {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-form-item {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  transition: border-color 0.14s;

  &:hover { border-color: rgba(99, 102, 241, 0.3); }
}

.location-form-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(248, 250, 252, 0.9);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.location-form-item__path {
  font-size: 12px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: #4f46e5;
}

.location-mode-tag { margin-left: 6px; }

.location-form-item__body {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row-inline {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    flex-shrink: 0;
    width: 80px;
    font-size: 12px;
    color: #64748b;
  }

  .form-input { flex: 1; height: 26px; font-size: 12px; }
}

.location-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: 1.5px dashed rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;
  transition: all 0.14s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}

// ── Dark Mode ──
:global(html.dark) {
  .split-left {
    background: rgba(15, 23, 42, 0.88);
    border-right-color: rgba(99, 102, 241, 0.15);
  }

  .server-cards-panel {
    background: rgba(15, 23, 42, 0.88);
  }

  .server-card {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.12);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    &:hover {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
    }
    &.is-active {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 20px rgba(99, 102, 241, 0.15);
    }
  }
  .server-card__header {
    background: rgba(15, 23, 42, 0.5);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .server-card__name { color: #e2e8f0; }
  .server-card__port { color: #a5b4fc; background: rgba(99, 102, 241, 0.15); }
  .server-card__loc-count { color: #64748b; background: rgba(148, 163, 184, 0.1); }
  .server-card__root {
    color: #94a3b8;
    background: rgba(15, 23, 42, 0.3);
    border-bottom-color: rgba(148, 163, 184, 0.06);
  }
  .server-card--clickable .server-card__loc-count-row { color: #94a3b8; }

  .form-panel {
    background: rgba(15, 23, 42, 0.92);
  }
  .form-panel__header {
    background: rgba(15, 23, 42, 0.6);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }
  .form-panel__title { color: #e2e8f0; .el-icon { color: #818cf8; } }
  .form-label { color: #94a3b8; }
  .form-input {
    background: rgba(15, 23, 42, 0.5);
    border-color: rgba(148, 163, 184, 0.2);
    color: #e2e8f0;
    &:focus {
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      background: rgba(15, 23, 42, 0.7);
    }
  }
  .form-row { border-bottom-color: rgba(148, 163, 184, 0.06); }
  .form-hint { color: #64748b; border-top-color: rgba(148, 163, 184, 0.1); }
  .form-section-title { color: #64748b; border-top-color: rgba(148, 163, 184, 0.08); }

  .location-form-item {
    background: rgba(15, 23, 42, 0.4);
    border-color: rgba(148, 163, 184, 0.12);
    &:hover { border-color: rgba(99, 102, 241, 0.3); }
  }
  .location-form-item__head {
    background: rgba(15, 23, 42, 0.4);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }
  .location-form-item__path { color: #a5b4fc; }

  .form-row-inline label { color: #64748b; }

  .location-add-btn {
    color: #64748b;
    border-color: rgba(148, 163, 184, 0.2);
    &:hover {
      color: #a5b4fc;
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.06);
    }
  }
}
</style>
