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

        filterable
        style="width: 320px"
        placeholder="选择要备份的配置文件"
      >
        <ReOption v-for="f in files" :key="f.path" :value="f.path" :label="f.path" />
      </ReSelect>
      <ReButton :loading="backing" :disabled="!configPath" @click="doBackup">
        <template #icon><ReIcon name="CopyDocument" :size="13" /></template>
        立即备份
      </ReButton>
      <ReButton :loading="loading" @click="load">
        <template #icon><ReIcon name="Refresh" :size="13" /></template>
        刷新列表
      </ReButton>
      <span class="ngb-count">共 {{ backups.length }} 个备份</span>
    </div>

    <div class="ngb-list">
      <!-- 首次加载用骨架屏占位。每处 ReSkeleton 都必须显式写 loading：
           ReSkeleton 把该 prop 默认值设成了 false，而 el-skeleton 的语义是
           loading=true 才显示骨架，少写这个 prop 就是「元素在、但一片空白」。 -->
      <div v-if="loading && !loaded" class="ngb-skel" aria-busy="true" aria-label="备份列表加载中">
        <div v-for="i in 4" :key="i" class="ngb-skel-item">
          <ReSkeleton loading animated :rows="0" class="ngb-skel-icon" />
          <div class="ngb-skel-body">
            <ReSkeleton loading animated :rows="2" />
          </div>
        </div>
      </div>
      <template v-else>
        <ReEmptyState v-if="!backups.length" description="还没有备份。保存配置时会自动创建。" />
        <div v-for="b in backups" :key="b.name" class="ngb-item">
          <ReIcon name="DocumentCopy" :size="14" />
          <div class="ngb-info">
            <div class="ngb-name mono" :title="b.path">{{ b.name }}</div>
            <div class="ngb-meta">
              {{ b.mtime || "—" }} · {{ formatSize(b.size) }}
              <span v-if="b.reason"> · {{ b.reason }}</span>
            </div>
          </div>
          <ReButton text :loading="previewing === b.name" @click="openPreview(b)">
            <template #icon><ReIcon name="View" :size="13" /></template>
            查看
          </ReButton>
          <ReButton text :loading="restoring === b.name" @click="openRestore(b)">
            <template #icon><ReIcon name="RefreshLeft" :size="13" /></template>
            回退到此版本
          </ReButton>
        </div>
      </template>
    </div>

    <!-- 内容预览 + 与当前配置的差异 + 下载 -->
    <ReDialog v-model="previewVisible" :title="`备份内容 · ${previewName || ''}`" width="900px" :height="560">
      <ReTab v-model="previewTab" :tabs="PREVIEW_TABS" class="ngb-preview">
        <template #content>
          <div class="ngb-preview-bar">
            <span class="ngb-preview-meta">
              {{ previewMeta }}
            </span>
            <ReButton size="small" :loading="downloading" @click="downloadBackup">
              <template #icon><ReIcon name="Download" :size="13" /></template>
              下载
            </ReButton>
          </div>
          <pre v-if="previewLoading" class="ngb-preview-body ngx-mono">{{ previewText || "读取中…" }}</pre>
          <ReEmptyState
            v-else-if="!previewText"
            description="备份内容为空，或文件已被清理"
            :image-size="70"
          />
          <pre v-else class="ngb-preview-body ngx-mono">{{ previewText }}</pre>
        </template>

        <template #diff>
          <div class="ngb-preview-bar">
            <ReSelect
              v-model="diffTarget"
              filterable
              style="width: 340px"
              placeholder="选择要对比的当前配置文件"
            >
              <ReOption v-for="f in files" :key="f.path" :value="f.path" :label="f.path" />
            </ReSelect>
            <ReButton size="small" :loading="diffLoading" :disabled="!diffTarget" @click="loadDiff">
              <template #icon><ReIcon name="Refresh" :size="13" /></template>
              对比
            </ReButton>
            <span v-if="diffResult" class="ngb-preview-meta">
              新增 <b class="ngb-add">{{ diffResult.added }}</b> 行 ·
              删除 <b class="ngb-del">{{ diffResult.removed }}</b> 行
            </span>
          </div>
          <ReAlert
            v-if="!diffTarget"
            type="info"
            title="先选一个当前的配置文件，才能看出这份备份改了哪些地方"
          />
          <pre v-else-if="diffLoading" class="ngb-preview-body ngx-mono">对比中…</pre>
          <ReEmptyState
            v-else-if="!diffResult"
            :description="diffHint"
            :image-size="70"
          />
          <ReAlert
            v-else-if="diffResult.added === 0 && diffResult.removed === 0"
            type="success"
            title="与当前文件完全一致"
          />
          <pre v-else class="ngb-preview-body ngb-diff ngx-mono"><span
            v-for="(l, i) in diffRows"
            :key="i"
            :class="l.cls"
          >{{ l.text }}</span></pre>
        </template>
      </ReTab>
      <template #footer>
        <!-- 自己给 footer：ReDialog 不给就会渲染默认的「确定 / 取消」，
             在一个纯预览弹窗里那两颗按钮毫无意义，还容易被误点。 -->
        <ReButton @click="previewVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

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
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ReSkeleton from "@repo/ui/re-skeleton";
import {
  backupNginxConfig,
  fetchNginxBackupContent,
  fetchNginxBackupDiff,
  fetchNginxBackups,
  fetchNginxConfigFiles,
  restoreNginxBackup,
  type NginxBackup,
  type NginxBackupDiff,
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

/** 首屏是否已渲染过真实内容：骨架屏只在首次出现，之后刷新不再整页闪 */
const loaded = ref(false);

// ---------- 内容预览 / 对比 / 下载 ----------

/** 预览弹窗的页签定义。ReTab 用 tabs 数组 + 具名插槽，不是 el-tabs 的 pane 子组件 */
const PREVIEW_TABS = [
  { name: "content", label: "内容预览" },
  { name: "diff", label: "与当前配置对比" }
];

const previewVisible = ref(false);
const previewTab = ref("content");
const previewName = ref("");
const previewText = ref("");
const previewLoading = ref(false);
const previewing = ref("");
const downloading = ref(false);
const diffTarget = ref("");
const diffLoading = ref(false);
const diffResult = ref<NginxBackupDiff | null>(null);

/**
 * 对比页签的提示文案。
 *
 * <p>「没有可对比的配置文件」要和「还没点对比」区分开：前者说明
 * {@code files} 是空的（数据源没列出任何 .conf），后者是正常待操作状态。
 * 混成一句话会让人以为是按钮坏了。</p>
 */
const diffHint = computed(() =>
  files.value.length === 0
    ? "该数据源没有取到任何 .conf 配置文件，无法对比。请先在「配置」页签确认连接。"
    : "点「对比」查看这个备份和当前文件的差异"
);

/** 预览头部那行元信息：文件名 / 时间 / 大小 */
const previewMeta = computed(() => {
  const b = backups.value.find((x) => x.name === previewName.value);
  if (!b) {
    return previewName.value;
  }
  return `${b.mtime || "时间未知"} · ${formatSize(b.size)}`;
});

/**
 * 把 diff 行序列转成可着色的行。
 *
 * <p>不用整段文本渲染：那样没法逐行加底色，几十行 diff 混成一片根本看不出改了哪里。
 * 后端已给每行加了 {@code +}/{@code -}/双空格 前缀，这里只剥掉前缀并保留行尾，
 * 不能再 trim——配置里行尾空格是有意义的。</p>
 */
const diffRows = computed(() =>
  (diffResult.value?.lines || []).map((raw) => {
    if (raw.startsWith("+")) {
      return { cls: "el-diff-add", text: raw };
    }
    if (raw.startsWith("-")) {
      return { cls: "el-diff-del", text: raw };
    }
    return { cls: "el-diff-eq", text: raw };
  })
);

/**
 * 打开备份内容预览。
 *
 * <p>内容与 diff 分开按需拉：两个都拉会让弹窗打开瞬间等两趟 SSH，
 * 而多数人只关心其中一个。</p>
 *
 * @param b 备份条目
 */
async function openPreview(b: NginxBackup) {
  previewName.value = b.name;
  previewText.value = "";
  diffResult.value = null;
  previewTab.value = "content";
  // 还没选过对比目标时，默认选当前下拉里选中的配置文件
  diffTarget.value = configPath.value || files.value[0]?.path || "";
  previewVisible.value = true;
  previewing.value = b.name;
  try {
    previewText.value = await fetchNginxBackupContent(props.datasourceId, b.name);
  } catch (e) {
    ElMessage.error(`读取备份内容失败：${(e as Error).message}`);
  } finally {
    previewLoading.value = false;
    previewing.value = "";
  }
}

/**
 * 把备份内容下载到本地。
 *
 * <p>后端只提供文本接口，Blob 转换放在前端：少一个需要做
 * Content-Disposition 文件名转义的二进制接口，中文/下划线文件名在两处都容易出错。</p>
 */
function downloadBackup() {
  if (!previewText.value) {
    return;
  }
  downloading.value = true;
  try {
    const blob = new Blob([previewText.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = previewName.value || "nginx-backup.bak";
    a.click();
    // 必须延后 revoke，不能紧跟 click 释放。
    // 立即 revoke 时浏览器还没开始取 Blob，下载会失败并退化成「导航到 blob: 地址」，
    // 表现就是页面被刷掉（实测踩过，报错形如 waiting for navigation to finish）。
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10_000);
  } finally {
    downloading.value = false;
  }
}

/** 拉取并展示 diff */
async function loadDiff() {
  if (!previewName.value || !diffTarget.value) {
    return;
  }
  diffLoading.value = true;
  diffResult.value = null;
  try {
    diffResult.value = await fetchNginxBackupDiff(
      props.datasourceId,
      previewName.value,
      diffTarget.value
    );
  } catch (e) {
    ElMessage.error(`对比失败：${(e as Error).message}`);
  } finally {
    diffLoading.value = false;
  }
}

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
    // 无论成功失败都算首屏结束：失败时要显示「读取失败」而不是永远停在骨架上
    loaded.value = true;
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

/* ============ 首屏骨架屏 ============ */
/* 与真实 .ngb-item 同一套排版（图标 + 两行文字 + 右侧按钮位），
   这样数据到达时列表不会整体位移。 */
.ngb-skel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ngb-skel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
}

.ngb-skel-icon {
  flex: 0 0 auto;
  width: 14px;
}

.ngb-skel-body {
  flex: 1 1 auto;
  min-width: 0;
}

/* el-skeleton 自带的 item 背景在本主题下过淡，覆盖动画两色才看得见。
   覆盖变量而不是 background-image，是为了保住 shimmer 动画。 */
.ngb-skel :deep(.el-skeleton) {
  --el-skeleton-animation-bg-color: var(--el-fill-color);
  --el-skeleton-animation-to-color: var(--el-fill-color-light);
}

/* ============ 内容预览 / 对比 ============ */
.ngb-preview-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.ngb-preview-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngb-add {
  color: var(--el-color-success);
}

.ngb-del {
  color: var(--el-color-danger);
}

.ngb-preview-body {
  max-height: 380px;
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  line-height: 1.65;
  white-space: pre;
  tab-size: 2;
}

/* diff 逐行着色。统一用极淡的底色而不是左边框：
   配置里一行可能很长，边框会被长行拉出很粗的一条。 */
.ngb-diff :deep(.el-diff-add),
.ngb-diff :deep(.el-diff-del) {
  display: block;
  padding: 0 6px;
}

.ngb-diff :deep(.el-diff-add) {
  background: var(--el-color-success-light-9);
}

.ngb-diff :deep(.el-diff-del) {
  background: var(--el-color-danger-light-9);
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
