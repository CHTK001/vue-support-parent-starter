<template>
  <div class="ngb">
    <ReAlert type="info" class="ngb-alert">
      <template #title>
        每次保存配置前都会自动备份到
        <code>/var/log/nginx-console-backup</code>
        。这里可以查看历史备份并回退。回退本身也会先备份当前内容，所以这一步是可逆的。
      </template>
    </ReAlert>

    <div class="ngb-bar">
      <ReSelect
        v-model="configPath"
        size="small"
        filterable
        style="width: 320px"
        placeholder="选择要备份的配置文件"
      >
        <ReOption v-for="f in files" :key="f.path" :value="f.path" :label="f.path" />
      </ReSelect>
      <ReButton size="small" :loading="backing" :disabled="!configPath" @click="doBackup">
        <template #icon><ReIcon name="CopyDocument" :size="13" /></template>
        立即备份
      </ReButton>
      <ReButton size="small" :loading="loading" @click="load">
        <template #icon><ReIcon name="Refresh" :size="13" /></template>
        刷新列表
      </ReButton>
      <span class="ngb-count">共 {{ backups.length }} 个备份</span>
    </div>

    <div class="ngb-list" v-loading="loading">
      <ReEmptyState v-if="!backups.length && !loading" description="还没有备份。保存配置时会自动创建。" />
      <div v-for="b in backups" :key="b.name" class="ngb-item">
        <ReIcon name="DocumentCopy" :size="14" />
        <div class="ngb-info">
          <div class="ngb-name mono" :title="b.path">{{ b.name }}</div>
          <div class="ngb-meta">
            {{ b.mtime || "—" }} · {{ formatSize(b.size) }}
            <span v-if="b.reason"> · {{ b.reason }}</span>
          </div>
        </div>
        <ReButton size="small" :loading="restoring === b.name" @click="openRestore(b)">
          <template #icon><ReIcon name="RefreshLeft" :size="13" /></template>
          回退到此版本
        </ReButton>
      </div>
    </div>

    <!-- 回退确认：显式给出还原目标，避免路径含下划线时反推错位置 -->
    <ReDialog v-model="restoreVisible" title="从备份回退配置" width="640px" :height="440">
      <div v-if="pending" class="ngb-restore">
        <ReAlert type="warning">
          <template #title>
            备份文件名把路径分隔符换成了下划线，所以原始路径<strong>无法可靠反推</strong>。
            请确认要还原到哪个文件——填错会把配置写到别的站点上去。
          </template>
        </ReAlert>
        <ReForm label-width="110px">
          <ReFormItem label="备份文件">
            <div class="mono ngx-break">{{ pending.name }}</div>
          </ReFormItem>
          <ReFormItem label="备份时间">
            <div>{{ pending.mtime || "未知" }} · {{ formatSize(pending.size) }}</div>
          </ReFormItem>
          <ReFormItem label="还原到" required>
            <ReSelect
              v-model="restoreTarget"
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入目标 .conf 绝对路径"
            >
              <ReOption v-for="f in files" :key="f.path" :value="f.path" :label="f.path" />
            </ReSelect>
            <div class="ngb-hint">
              默认选中 {{ configPath || "（未选择）" }}，因为它是当前正在编辑的文件。
            </div>
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton @click="restoreVisible = false">取消</ReButton>
        <ReButton type="danger" :loading="restoring === pending?.name" :disabled="!restoreTarget" @click="doRestore">
          确认回退
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  backupNginxConfig,
  fetchNginxBackups,
  fetchNginxConfigFiles,
  restoreNginxBackup,
  type NginxBackup,
  type NginxConfigFile,
} from "../../nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
}>();

const emit = defineEmits<{
  (e: "changed"): void;
}>();

const backups = ref<NginxBackup[]>([]);
const files = ref<NginxConfigFile[]>([]);
const configPath = ref("");
const loading = ref(false);
const backing = ref(false);
const restoring = ref("");
const restoreVisible = ref(false);
const pending = ref<NginxBackup | null>(null);
const restoreTarget = ref("");

async function load() {
  if (!props.datasourceId) {
    return;
  }
  loading.value = true;
  try {
    const [b, f] = await Promise.allSettled([
      fetchNginxBackups(props.datasourceId),
      fetchNginxConfigFiles(props.datasourceId),
    ]);
    backups.value = b.status === "fulfilled" ? b.value || [] : [];
    files.value = f.status === "fulfilled" ? f.value || [] : [];
    if (!configPath.value && files.value.length) {
      configPath.value = files.value[0].path;
    }
    if (b.status === "rejected") {
      ElMessage.error(`读取备份列表失败：${(b.reason as Error).message}`);
    }
  } finally {
    loading.value = false;
  }
}

async function doBackup() {
  if (!props.datasourceId || !configPath.value) {
    return;
  }
  backing.value = true;
  try {
    const r = await backupNginxConfig(props.datasourceId, configPath.value, "手动备份");
    ElMessage.success(`已备份到 ${r.path}`);
    await load();
  } catch (e) {
    ElMessage.error(`备份失败：${(e as Error).message}`);
  } finally {
    backing.value = false;
  }
}

async function doRestore() {
  if (!props.datasourceId || !pending.value || !restoreTarget.value) {
    return;
  }
  const b = pending.value;
  try {
    await ElMessageBox.confirm(
      `将用备份 ${b.name} 覆盖 ${restoreTarget.value}。回退前会自动再备份一次当前内容，因此这一步可以撤销。`,
      "确认回退配置？",
      { type: "warning", confirmButtonText: "确认回退", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  restoring.value = b.name;
  try {
    const r = await restoreNginxBackup(props.datasourceId, b.name, restoreTarget.value);
    if (r.success) {
      ElMessage.success(r.message);
    } else {
      ElMessage.error(r.message);
    }
    restoreVisible.value = false;
    await load();
    emit("changed");
  } catch (e) {
    ElMessage.error(`回退失败：${(e as Error).message}`);
  } finally {
    restoring.value = "";
  }
}

function openRestore(b: NginxBackup) {
  pending.value = b;
  restoreTarget.value = configPath.value || b.path.replace(/\.[^.]+\.bak$/, ".conf");
  restoreVisible.value = true;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) {
    return "—";
  }
  const units = ["B", "KB", "MB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

watch(() => props.datasourceId, load);
onMounted(load);

defineExpose({ load });
</script>

<style scoped lang="scss">
.ngb {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.ngb-alert {
  margin: 0;

  code {
    padding: 0 4px;
    border-radius: 3px;
    background: var(--el-fill-color);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
}

.ngb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ngb-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.ngb-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  background: var(--el-bg-color);
}

.ngb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  transition: background-color var(--el-transition-duration, 0.15s) ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.ngb-info {
  flex: 1;
  min-width: 0;
}

.ngb-name {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ngb-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}

.ngb-restore {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ngb-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.ngx-break {
  word-break: break-all;
}
</style>
