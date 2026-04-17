<template>
  <div class="site-tree-panel">
    <!-- HTTP 站点区域 -->
    <div class="left-section">
      <div class="left-section__header">
        <span class="left-section__title">
          <ElIcon><Grid /></ElIcon>
          HTTP 站点
        </span>
        <div class="left-section__actions">
          <ElTooltip content="添加站点">
            <ElButton :icon="Plus" circle type="primary" size="small" @click="emit('open-add-server')" />
          </ElTooltip>
          <ElTooltip content="刷新">
            <ElButton :icon="RefreshRight" circle size="small" :loading="serversLoading" @click="loadServers" />
          </ElTooltip>
        </div>
      </div>
      <ElScrollbar class="left-section__scroll">
        <div v-if="serversLoading" class="left-empty">
          <ElIcon class="is-loading"><Loading /></ElIcon>
        </div>
        <div v-else-if="!servers.length" class="left-empty">
          <span>暂无站点，点击 + 添加</span>
        </div>
        <div v-else class="server-tree">
          <div v-for="(server, si) in servers" :key="si" class="server-node">
            <!-- server 行 -->
            <div
              class="server-row"
              :class="{ 'is-active': activeServerIndex === si }"
              @click="emit('select-server', si)"
              @mouseenter="hoveredServer = si"
              @mouseleave="hoveredServer = -1"
            >
              <ElIcon
                class="server-row__arrow"
                :class="{ 'is-expanded': expandedServers.has(si) }"
                @click.stop="toggleServer(si)"
              >
                <ArrowRight />
              </ElIcon>
              <ElIcon class="server-row__icon"><Connection /></ElIcon>
              <div class="server-row__info">
                <span class="server-row__name">{{ server.serverName || '未命名' }}</span>
                <span class="server-row__port">:{{ server.listen || '80' }}</span>
              </div>
              <div v-if="hoveredServer === si" class="server-row__actions" @click.stop>
                <ElTooltip content="添加 location">
                  <ElButton :icon="Plus" circle plain size="small" @click="emit('open-add-location', si)" />
                </ElTooltip>
                <ElTooltip content="编辑站点">
                  <ElButton :icon="EditPen" circle plain size="small" @click="emit('open-edit', si)" />
                </ElTooltip>
                <ElTooltip content="删除站点">
                  <ElButton :icon="Delete" circle plain size="small" type="danger" @click="emit('delete-server', si)" />
                </ElTooltip>
              </div>
            </div>

            <!-- location 列表 -->
            <div v-if="expandedServers.has(si)" class="location-list">
              <div
                v-for="(loc, li) in (server.locations || [])"
                :key="li"
                class="location-row"
                @mouseenter="hoveredLocation = `${si}-${li}`"
                @mouseleave="hoveredLocation = ''"
              >
                <ElIcon class="location-row__icon"><Link /></ElIcon>
                <span class="location-row__path">{{ loc.path || '/' }}</span>
                <div v-if="hoveredLocation === `${si}-${li}`" class="location-row__actions" @click.stop>
                  <ElTooltip content="删除">
                    <ElButton :icon="Delete" circle plain size="small" type="danger" />
                  </ElTooltip>
                </div>
              </div>
              <div class="location-add" @click="emit('open-add-location', si)">
                <ElIcon><Plus /></ElIcon>
                <span>添加映射</span>
              </div>
            </div>
          </div>
        </div>
      </ElScrollbar>
    </div>

    <!-- 配置文件区域 -->
    <div class="left-section left-section--config">
      <div class="left-section__header">
        <span class="left-section__title">
          <ElIcon><Setting /></ElIcon>
          配置文件
        </span>
        <div class="left-section__actions">
          <ElTooltip content="新增配置文件">
            <ElButton :icon="Plus" circle size="small" @click="newConfDialogVisible = true" />
          </ElTooltip>
        </div>
      </div>
      <div class="config-tree">
        <div
          v-for="cfg in confFiles"
          :key="cfg.path"
          class="config-tree__item"
          :class="{ 'is-active': activeConfigPath === cfg.path }"
          @click="emit('select-config', cfg.path)"
        >
          <ElIcon class="config-tree__icon"><Document /></ElIcon>
          <span class="config-tree__name">{{ cfg.label }}</span>
        </div>
      </div>
      <!-- 当前活跃文件名 -->
      <div v-if="activeConfigPath" class="active-file-hint">
        <ElIcon><Document /></ElIcon>
        <span>{{ activeConfigPath.split('/').pop() }}</span>
      </div>
    </div>

    <!-- 新增配置文件对话框 -->
    <ElDialog v-model="newConfDialogVisible" title="新增配置文件" width="440px" :close-on-click-modal="false">
      <div class="dialog-form">
        <div class="form-row">
          <label class="form-label">文件名</label>
          <input
            v-model="newConfName"
            class="form-input"
            placeholder="mysite（自动补全路径）"
            @keyup.enter="submitNewConf"
          />
        </div>
        <div class="form-hint">
          将创建：/etc/nginx/conf.d/{{ newConfName || 'xxx' }}.conf
        </div>
      </div>
      <template #footer>
        <ElButton @click="newConfDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creatingConf" @click="submitNewConf">创建</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  Connection,
  Delete,
  Document,
  EditPen,
  Grid,
  Link,
  Loading,
  Plus,
  RefreshRight,
  Setting,
} from '@element-plus/icons-vue'
import {
  ElButton,
  ElDialog,
  ElIcon,
  ElMessage,
  ElScrollbar,
  ElTooltip,
} from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import {
  createNginxConfFile,
  fetchNginxServers,
  listNginxConfFiles,
  type NginxConfFile,
  type NginxServerBlock,
} from '../../api/nginx'

const props = defineProps<{
  connectionId: string
  activeServerIndex: number
  activeConfigPath: string
}>()

const emit = defineEmits<{
  (e: 'select-server', si: number): void
  (e: 'open-edit', si: number): void
  (e: 'open-add-location', si: number): void
  (e: 'delete-server', si: number): void
  (e: 'select-config', path: string): void
  (e: 'open-add-server'): void
  (e: 'refresh'): void
}>()

// ─── 内部状态 ─────────────────────────────────────────────────────────────────
const servers = ref<NginxServerBlock[]>([])
const serversLoading = ref(false)
const expandedServers = ref(new Set<number>())
const hoveredServer = ref(-1)
const hoveredLocation = ref('')
const confFiles = ref<NginxConfFile[]>([])

// 新增配置文件
const newConfDialogVisible = ref(false)
const newConfName = ref('')
const creatingConf = ref(false)

// ─── 数据加载 ─────────────────────────────────────────────────────────────────
const loadServers = async () => {
  serversLoading.value = true
  try {
    const res = await fetchNginxServers(props.connectionId, props.activeConfigPath)
    servers.value = (res?.data ?? []) as NginxServerBlock[]
  } catch (e: any) {
    ElMessage.error('解析站点失败: ' + (e?.message ?? ''))
  } finally {
    serversLoading.value = false
  }
}

const loadConfFiles = async () => {
  try {
    const res = await listNginxConfFiles(props.connectionId)
    confFiles.value = res?.data ?? []
  } catch { /* 静默 */ }
}

const toggleServer = (si: number) => {
  if (expandedServers.value.has(si)) expandedServers.value.delete(si)
  else expandedServers.value.add(si)
}

const submitNewConf = async () => {
  if (!newConfName.value.trim()) {
    ElMessage.warning('请输入文件名')
    return
  }
  const path = `/etc/nginx/conf.d/${newConfName.value.trim()}.conf`
  creatingConf.value = true
  try {
    await createNginxConfFile(props.connectionId, path)
    ElMessage.success('配置文件已创建')
    newConfDialogVisible.value = false
    newConfName.value = ''
    await loadConfFiles()
    emit('select-config', path)
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e?.message ?? ''))
  } finally {
    creatingConf.value = false
  }
}

watch(() => props.activeConfigPath, loadServers)

onMounted(async () => {
  await Promise.all([loadServers(), loadConfFiles()])
})

// 暴露给父组件调用刷新
defineExpose({ loadServers, loadConfFiles })
</script>

<style scoped lang="scss">
.site-tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
}

.left-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);

  &--config {
    flex: 0 0 auto;
    border-bottom: none;
    max-height: 220px;
  }
}

.left-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 6px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.left-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  .el-icon {
    font-size: 13px;
    color: #6366f1;
  }
}

.left-section__actions {
  display: flex;
  gap: 4px;
}

.left-section__scroll {
  flex: 1;
  min-height: 0;
}

.left-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 12px;
  color: #94a3b8;
  font-size: 12px;
}

/* ── 站点树 ── */
.server-tree {
  padding: 4px 0;
}

.server-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  margin: 1px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.14s ease;
  position: relative;

  &:hover { background: rgba(99, 102, 241, 0.08); }

  &.is-active {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.14), rgba(99, 102, 241, 0.06));
    color: #4f46e5;
    font-weight: 600;
  }
}

.server-row__arrow {
  font-size: 11px;
  color: #94a3b8;
  transition: transform 0.18s;
  flex-shrink: 0;
  cursor: pointer;

  &.is-expanded { transform: rotate(90deg); }
}

.server-row__icon {
  font-size: 14px;
  color: #6366f1;
  flex-shrink: 0;
}

.server-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
  overflow: hidden;
}

.server-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-row__port {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}

.server-row__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.location-list {
  padding-left: 28px;
  border-left: 2px solid rgba(99, 102, 241, 0.15);
  margin-left: 18px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  margin: 1px 4px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: rgba(16, 185, 129, 0.07); }
}

.location-row__icon {
  font-size: 12px;
  color: #10b981;
  flex-shrink: 0;
}

.location-row__path {
  flex: 1;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-row__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.location-add {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  margin: 2px 4px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 11.5px;
  color: #94a3b8;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  transition: all 0.12s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}

/* ── 配置文件树 ── */
.config-tree {
  padding: 4px 0 8px;
  overflow-y: auto;
  max-height: 160px;
}

.config-tree__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  margin: 1px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #475569;
  transition: background 0.14s ease;

  &:hover { background: rgba(99, 102, 241, 0.07); }

  &.is-active {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    font-weight: 600;
  }
}

.config-tree__icon {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.config-tree__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* ── 当前活跃文件提示 ── */
.active-file-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin: 4px 6px 6px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.18);
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: #4f46e5;
  font-weight: 600;
  overflow: hidden;

  .el-icon { font-size: 12px; flex-shrink: 0; }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ── 对话框表单 ── */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-label {
  flex-shrink: 0;
  width: 80px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.form-input {
  flex: 1;
  height: 32px;
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

.form-hint {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  padding: 4px 0 0 92px;
}
</style>
