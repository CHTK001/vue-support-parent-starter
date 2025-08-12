<template>
  <div class="page flex flex-col">
    <!-- 顶部工具栏：搜索 / 类型过滤 / 排序 / 新建 -->
    <div class="toolbar modern-toolbar">
      <div class="left">
        <el-input
          v-model="searchKey"
          placeholder="搜索名称/类型"
          clearable
          class="w-280"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="typeFilter"
          placeholder="全部类型"
          class="w-200 ml-8"
          clearable
        >
          <el-option label="全部类型" value="" />
          <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="sortKey" class="w-160 ml-8">
          <el-option label="按名称排序" value="name" />
          <el-option label="按类型排序" value="type" />
        </el-select>
      </div>
      <div class="right">
        <el-button type="primary" @click="openEdit()">
          <IconifyIconOnline icon="ri:add-line" /> 新建配置
        </el-button>
      </div>
    </div>

    <ScTable
      class="card-grid"
      :loading="loading"
      :url="pageSystemDataSettings"
      :params="queryParams"
      :col-size="4"
      layout="card"
    >
      <template #empty>
        <el-empty description="暂无数据源配置">
          <el-button type="primary" @click="openEdit()">新建配置</el-button>
        </el-empty>
      </template>

      <template #default="{ row: item }">
        <el-card :class="['data-card modern-card', getTypeClass(item.systemDataSettingType)]" shadow="hover">
          <div class="card-header">
            <div class="left">
              <img v-if="item.systemDataSettingIcon" :src="item.systemDataSettingIcon" class="icon icon-img" />
              <div v-else class="icon icon-badge" :data-name="item.systemDataSettingName">
                {{ (item.systemDataSettingName || "D").slice(0, 1).toUpperCase() }}
              </div>
              <div class="title" :title="item.systemDataSettingName">
                {{ item.systemDataSettingName }}
              </div>
            </div>
            <el-tag size="small" :type="getTypeTag(item.systemDataSettingType)">{{ item.systemDataSettingType }}</el-tag>
          </div>
          <div class="card-body">
            <div class="meta-row">
              <IconifyIconOnline
                class="mr-4 text-muted"
                icon="ri:terminal-line"
              />
              <span class="label">控制台</span>
              <span class="value">{{
                item.systemDataSettingConsoleType || "-"
              }}</span>
            </div>
            <div class="meta-row">
              <IconifyIconOnline class="mr-4 text-muted" icon="ri:link-m" />
              <span class="label">地址</span>
              <el-tooltip :content="addressOf(item)" placement="top" :show-after="150">
                <span class="value ellipsis">{{ addressOf(item) }}</span>
              </el-tooltip>
            </div>
          </div>
          <!-- 右下角背景图/图标（45度分割遮罩） -->
          <div class="bg-corner" :style="bgStyle(item)"></div>

          <div class="card-actions" @click.stop>
            <el-button-group>
              <el-tooltip content="打开控制台" placement="top" :show-after="500">
                <el-button size="small" type="primary" @click.stop.prevent="openConsole(item)">
                  <IconifyIconOnline icon="ri:login-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="capOf(item)?.document" content="查看文档" placement="top" :show-after="500">
                <el-button size="small" @click.stop.prevent="viewDocument(item)">
                  <IconifyIconOnline icon="ri:file-text-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑" placement="top" :show-after="500">
                <el-button size="small" @click.stop.prevent="openEdit(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="设置" placement="top" :show-after="500">
                <el-button size="small" type="primary" plain @click.stop.prevent="openSetting(item)">
                  <IconifyIconOnline icon="ri:settings-3-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="capOf(item)?.backup" :content="backupOn[item.systemDataSettingId!] ? '关闭备份' : '开启备份'" placement="top" :show-after="500">
                <el-button size="small" @click.stop.prevent="toggleBackup(item)">
                  <IconifyIconOnline :icon="backupOn[item.systemDataSettingId!] ? 'ri:pause-line' : 'ri:play-line'" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top" :show-after="500">
                <el-button size="small" type="danger" @click.stop.prevent="remove(item)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="isJdbcItem(item)" content="上传驱动" placement="top" :show-after="500">
                <el-upload :auto-upload="false" :show-file-list="false" :on-change="f => onUploadDriver(item, f)">
                  <el-button size="small">
                    <IconifyIconOnline icon="ri:upload-2-line" />
                  </el-button>
                </el-upload>
              </el-tooltip>
            </el-button-group>
          </div>
        </el-card>
      </template>
    </ScTable>

    <EditDialog v-model:visible="showEdit" :model-value="current" @success="load" />
    <el-dialog v-model="showDoc" title="文档" width="80%">
      <iframe :src="docUrl" style="width: 100%; height: 70vh; border: none"></iframe>
    </el-dialog>
    <ConsoleSettingDialog v-model="showSetting" :setting-id="settingId" :setting-type="settingType" @saved="onSavedSetting" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { pageSystemDataSettings, deleteSystemDataSetting, type SystemDataSetting, uploadJdbcDriver, getDocumentHtmlUrl, startBackup, stopBackup, backupStatus } from "@/api/system-data";
import { useRouter } from "vue-router";
import EditDialog from "./modules/EditDialog.vue";
import ConsoleSettingDialog from "./modules/ConsoleSettingDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";

const loading = ref(false);
const list = ref<SystemDataSetting[]>([]);
const router = useRouter();
const capMap = ref<
  Record<number, { backup?: boolean; document?: boolean; file?: boolean }>
>({});
const backupOn = ref<Record<number, boolean>>({});
const showDoc = ref(false)
const docUrl = ref('')

const showEdit = ref(false);
const current = ref<SystemDataSetting | null>(null);

const showSetting = ref(false)
const settingId = ref<number | null>(null)
const settingType = ref<string | undefined>(undefined)


// 过滤与排序
const searchKey = ref("");
const typeFilter = ref<string | "">("");
const sortKey = ref<"name" | "type">("name");

const typeOptions = computed(
  () =>
    Array.from(
      new Set(list.value.map((i) => i.systemDataSettingType).filter(Boolean))
    ) as string[]
);

// 交给 ScTable 处理分页与过滤，这里保留 options 构建
const queryParams = ref({ current: 1, size: 20, name: "", type: "" })
watch([searchKey, typeFilter], () => {
  queryParams.value = { ...queryParams.value, current: 1, name: searchKey.value, type: typeFilter.value || "" }
})

function getTypeTag(type?: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  const t = (type || '').toLowerCase()
  if (t.includes('jdbc') || t.includes('sql')) { return 'success' }
  if (t.includes('redis')) { return 'warning' }
  if (t.includes('zk') || t.includes('zookeeper')) { return 'info' }
  return 'info'
}

function addressOf(i: SystemDataSetting) {
  return (
    i.systemDataSettingServer ||
    (i.systemDataSettingHost
      ? `${i.systemDataSettingHost}:${i.systemDataSettingPort || ""}`
      : "-")
  )
}

function getTypeClass(type?: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('jdbc') || t.includes('sql')) { return 'is-jdbc' }
  if (t.includes('redis')) { return 'is-redis' }
  if (t.includes('zk') || t.includes('zookeeper')) { return 'is-zk' }
  return 'is-default'
}

function isJdbcItem(row: SystemDataSetting) {
  const type = (row.systemDataSettingType || '').toLowerCase()
  const url = (row.systemDataSettingServer || '').toLowerCase()
  return type.includes('jdbc') || type.includes('sql') || url.startsWith('jdbc:')
}

async function load() {
  loading.value = true;
  try {
    const res = await pageSystemDataSettings({ current: 1, size: 20 })
    if (res?.success) {
      list.value = (res.data?.records as any[]) || []
    }
  } finally {
    loading.value = false;
  }
}

function openEdit(row?: SystemDataSetting) {
  current.value = row ? { ...row } : (null as any);
  showEdit.value = true;
}

function openConsole(row: SystemDataSetting) {
  const type = (row.systemDataSettingType || "").toLowerCase();
  if (
    type.includes("jdbc") ||
    type.includes("sql") ||
    (row.systemDataSettingServer || "").toLowerCase().startsWith("jdbc:")
  ) {
    router.push({
      name: "dataJdbcConsoleFull",
      query: { id: row.systemDataSettingId },
    });
    return;
  }
  if (type.includes("redis")) {
    router.push({
      name: "dataRedisConsoleFull",
      query: { id: row.systemDataSettingId },
    });
    return;
  }
  if (type.includes("zk") || type.includes("zookeeper")) {
    router.push({
      name: "dataZookeeperConsoleFull",
      query: { id: row.systemDataSettingId },
    });
    return;
  }
}


function openSetting(row: SystemDataSetting) {
  settingId.value = row.systemDataSettingId as number
  settingType.value = row.systemDataSettingType
  showSetting.value = true
}

function onSavedSetting() {
  ElMessage.success('已保存控制台设置')
}

async function remove(row: SystemDataSetting) {
  await ElMessageBox.confirm(`确定删除 ${row.systemDataSettingName}?`, "提示", {
    type: "warning",
  });
  const res = await deleteSystemDataSetting(row.systemDataSettingId as number);
  if (res?.success) {
    ElMessage.success("已删除");
    load();
  }
}

function viewDocument(row: SystemDataSetting) {
  docUrl.value = getDocumentHtmlUrl(row.systemDataSettingId as number)
  showDoc.value = true
}

async function toggleBackup(row: SystemDataSetting) {
  const id = row.systemDataSettingId as number
  const on = backupOn.value[id]
  const res = on ? await stopBackup(id) : await startBackup(id)
  if (!res?.success) { ElMessage.error(res?.msg || '操作失败'); return }
  backupOn.value[id] = !on
}

async function onUploadDriver(row: SystemDataSetting, fileEvent: any) {
  try {
    const raw = fileEvent?.raw as File
    if (!raw) { return }
    if (!row.systemDataSettingId) {
      ElMessage.warning('请先保存配置再上传驱动')
      return
    }
    const res = await uploadJdbcDriver(row.systemDataSettingId, raw)
    if (!res?.success) { ElMessage.error(res?.msg || '上传失败'); return }
    ElMessage.success('上传成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  }
}

function capOf(item: any) {
  if (!item) return {}
  return { backup: item.capabilitiesBackup, document: item.capabilitiesDocument, file: item.capabilitiesFile }
}

function bgStyle(item: SystemDataSetting) {
  const img = item.systemDataSettingImageUrl || item.systemDataSettingIcon
  return img ? { backgroundImage: `url(${img})` } : {}
}

onMounted(load);
onMounted(async () => {
  // 初始化备份状态（可按需批量拉取，这里逐个）
  // 简化处理：进入页面后不主动轮询，点击时即时切换
})
</script>

<style scoped>
.page {
  padding: 16px;
  background:
    radial-gradient(1600px 500px at 10% -20%, rgba(14,165,233,0.06), rgba(14,165,233,0)),
    radial-gradient(1400px 480px at 110% 0%, rgba(59,130,246,0.06), rgba(59,130,246,0)),
    var(--el-bg-color-page);
  min-height: 100%;
}

/* 顶部工具栏 */
.modern-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.modern-toolbar .left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.w-280 {
  width: 280px;
}
.w-200 {
  width: 200px;
}
.w-160 {
  width: 160px;
}
.ml-8 {
  margin-left: 8px;
}

/* 栅格与卡片 */
.card-grid {
  --gap: 16px;
}
.modern-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  background: linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,1) 40%);
  position: relative;
}
/* 左侧绿色条 */
.modern-card::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #10b981; /* emerald-500 */
}
.modern-card.is-jdbc::before { background: radial-gradient(220px 110px at 10% 0%, rgba(14,165,233,0.10), transparent 60%); }
.modern-card.is-redis::before { background: radial-gradient(220px 110px at 10% 0%, rgba(244,63,94,0.10), transparent 60%); }
.modern-card.is-zk::before { background: radial-gradient(220px 110px at 10% 0%, rgba(99,102,241,0.10), transparent 60%); }
.modern-card.is-default::before { background: radial-gradient(220px 110px at 10% 0%, rgba(100,116,139,0.08), transparent 60%); }
.modern-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(240px 120px at 10% 0%, rgba(14,165,233,0.08), transparent 60%);
  pointer-events: none;
}
.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-5);
}
/* 常驻基础阴影 */
.modern-card { box-shadow: 0 4px 14px rgba(17, 24, 39, 0.06); }

/* 右下角45度背景区 */
.bg-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 46%;
  height: 46%;
  background-size: cover;
  background-position: center;
  opacity: 0.12;
  clip-path: polygon(54% 0, 100% 0, 100% 100%, 0 100%);
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 0;
}
.card-header .left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.icon { width: 36px; height: 36px; }
.icon-img { border-radius: 10px; object-fit: cover; }
.icon-badge {
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0ea5e9;
  background: radial-gradient(120px 80px at 10% 10%, rgba(14,165,233,0.18), rgba(14,165,233,0.06));
}
.title {
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-body {
  padding: 12px 14px 0;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  line-height: 22px;
}
.meta-row .label {
  width: 60px;
  color: var(--el-text-color-regular);
}
.meta-row .value {
  flex: 1;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ellipsis { display: inline-block; max-width: 100%; }

.card-actions {
  margin-top: 12px;
  padding: 8px 14px 14px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modern-card:hover .card-actions { opacity: 1; transform: translateY(0); }

.card-actions :deep(.el-button-group) {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card-actions :deep(.el-button-group .el-button) { border: none; }
.card-actions :deep(.el-button-group .el-button:not(:last-child)) { border-right: 1px solid var(--el-border-color-lighter); }

/* 按钮风格系统 */
.btn-solid-primary {
  --btn-bg: var(--el-color-primary);
  --btn-bg-hover: var(--el-color-primary-light-3);
  --btn-text: #fff;
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
}
.btn-solid-primary:hover { background: var(--btn-bg-hover); color: #fff; }

.btn-soft {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}
.btn-soft:hover { background: var(--el-fill-color); }

.btn-soft-danger {
  background: rgba(244, 63, 94, 0.06);
  color: var(--el-color-danger);
  border: 1px solid rgba(244, 63, 94, 0.18);
}
.btn-soft-danger:hover { background: rgba(244, 63, 94, 0.1); }

/* 空状态 */
.empty-wrap {
  padding: 60px 0;
}

/* 小色彩辅助 */
.text-muted {
  color: var(--el-text-color-secondary);
}
.mr-4 {
  margin-right: 4px;
}
</style>
