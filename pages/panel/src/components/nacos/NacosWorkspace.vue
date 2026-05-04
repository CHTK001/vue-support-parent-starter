<template>
  <section class="nacos-workspace">
    <ScLayout
      v-model="railTabValue"
      class="nacos-layout"
      left-enabled
      :left-width="300"
      :left-min-width="220"
      :left-max-width="420"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <template #left>
        <div class="left-panel">
          <div class="left-filters">
            <ElSelect
              v-model="activeTenant"
              size="small"
              placeholder="选择命名空间"
              @change="handleTenantChange"
            >
              <ElOption
                v-for="item in namespaces"
                :key="item.namespace || 'public'"
                :label="item.namespaceShowName || item.namespace || 'public'"
                :value="item.namespace || ''"
              />
            </ElSelect>
            <div class="left-filter-row">
              <ElButton size="small" plain @click="namespaceDialogVisible = true">
                新建命名空间
              </ElButton>
              <ElButton
                size="small"
                plain
                type="danger"
                :disabled="!activeTenant"
                @click="handleDeleteNamespace"
              >
                删除命名空间
              </ElButton>
            </div>
            <ElInput
              v-model="keyword"
              clearable
              size="small"
              placeholder="搜索 dataId / group"
              @keyup.enter="loadConfigs"
            >
              <template #prefix><ElIcon><Search /></ElIcon></template>
            </ElInput>
            <div class="left-filter-row">
              <ElInput
                v-model="groupKeyword"
                clearable
                size="small"
                placeholder="过滤 group（可选）"
                @keyup.enter="loadConfigs"
              />
              <ElButton
                :icon="RefreshRight"
                :loading="configsLoading"
                circle
                size="small"
                @click="loadConfigs"
              />
            </div>
          </div>
          <ElScrollbar class="left-scroll">
            <div v-if="configsLoading && !configs.length" class="left-empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>加载配置中…</span>
            </div>
            <div v-else-if="!configs.length" class="left-empty">
              <ElEmpty description="暂无配置" :image-size="52" />
            </div>
            <div v-else class="config-list">
              <button
                v-for="item in configs"
                :key="`${item.group || 'DEFAULT_GROUP'}::${item.dataId}`"
                class="config-item"
                :class="{ 'is-active': isActive(item) }"
                type="button"
                @click="selectConfig(item)"
              >
                <div class="config-item__title">{{ item.dataId }}</div>
                <div class="config-item__meta">
                  <span>{{ item.group || "DEFAULT_GROUP" }}</span>
                  <span>{{ item.type || "TEXT" }}</span>
                </div>
              </button>
            </div>
          </ElScrollbar>
        </div>
      </template>

      <template #default>
        <div class="main-panel">
          <template v-if="railTabValue === 'workspace'">
            <div class="editor-toolbar">
              <div class="editor-toolbar__left">
                <strong>{{ activeConfig.dataId || "未选择配置" }}</strong>
                <span>{{ activeConfig.group || "DEFAULT_GROUP" }}</span>
              </div>
              <div class="editor-toolbar__right">
                <ElInput
                  v-model="activeConfig.type"
                  size="small"
                  placeholder="类型，如 yaml/json/properties"
                  style="width: 220px"
                />
                <ElButton
                  type="danger"
                  plain
                  :disabled="!activeConfig.dataId"
                  @click="handleDeleteConfig"
                >
                  删除
                </ElButton>
                <ElButton
                  plain
                  :disabled="!activeConfig.dataId"
                  @click="cloneDialogVisible = true"
                >
                  克隆
                </ElButton>
                <ElButton
                  type="primary"
                  :loading="saving"
                  :disabled="!activeConfig.dataId"
                  @click="handlePublishConfig"
                >
                  发布
                </ElButton>
              </div>
            </div>
            <div class="editor-content">
              <ElInput
                v-model="activeConfig.content"
                type="textarea"
                :rows="16"
                resize="none"
                placeholder="请选择配置，或在“新建”页创建后编辑。"
              />
            </div>
          </template>

          <template v-else-if="railTabValue === 'create'">
            <div class="create-form">
              <label>
                <span>dataId</span>
                <ElInput v-model="createForm.dataId" placeholder="例如：application.yaml" />
              </label>
              <label>
                <span>group</span>
                <ElInput v-model="createForm.group" placeholder="默认 DEFAULT_GROUP" />
              </label>
              <label>
                <span>类型</span>
                <ElInput v-model="createForm.type" placeholder="例如：yaml" />
              </label>
              <label>
                <span>内容</span>
                <ElInput
                  v-model="createForm.content"
                  type="textarea"
                  :rows="14"
                  placeholder="输入配置内容"
                  resize="none"
                />
              </label>
              <div class="create-actions">
                <ElButton @click="resetCreateForm">重置</ElButton>
                <ElButton type="primary" :loading="saving" @click="handleCreateConfig">
                  创建并发布
                </ElButton>
              </div>
            </div>
          </template>

          <template v-else-if="railTabValue === 'history'">
            <div class="history-panel">
              <div class="history-toolbar">
                <strong>历史版本</strong>
                <ElButton
                  :icon="RefreshRight"
                  circle
                  size="small"
                  :loading="historyLoading"
                  @click="loadHistory"
                />
              </div>
              <ElScrollbar class="history-scroll">
                <div v-if="historyLoading" class="history-empty">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                  <span>加载历史中…</span>
                </div>
                <div v-else-if="!activeConfig.dataId" class="history-empty">
                  <ElEmpty description="请先在左侧选择配置" :image-size="50" />
                </div>
                <div v-else-if="!historyList.length" class="history-empty">
                  <ElEmpty description="暂无历史版本" :image-size="50" />
                </div>
                <div v-else class="history-list">
                  <article
                    v-for="item in historyList"
                    :key="String(item.id || `${item.dataId}-${item.modifiedTime || ''}`)"
                    class="history-item"
                  >
                    <div class="history-item__meta">
                      <span>ID {{ item.id || "-" }}</span>
                      <span>{{ item.modifiedTime || "-" }}</span>
                    </div>
                    <div class="history-item__meta">
                      <span>{{ item.group || "DEFAULT_GROUP" }}</span>
                      <span>{{ item.type || "TEXT" }}</span>
                    </div>
                    <div class="history-item__actions">
                      <ElButton size="small" plain @click="handlePreviewHistory(item)">
                        预览
                      </ElButton>
                      <ElButton
                        size="small"
                        type="warning"
                        :loading="saving"
                        @click="handleRollbackHistory(item)"
                      >
                        回滚
                      </ElButton>
                    </div>
                  </article>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <template v-else>
            <div class="info-panel">
              <div class="info-card">
                <small>当前命名空间</small>
                <strong>{{ activeTenant || "public" }}</strong>
              </div>
              <div class="info-card">
                <small>配置数量</small>
                <strong>{{ configs.length }}</strong>
              </div>
              <div class="info-card">
                <small>命名空间数量</small>
                <strong>{{ namespaces.length }}</strong>
              </div>
            </div>
          </template>
        </div>
      </template>
    </ScLayout>

    <el-dialog v-model="namespaceDialogVisible" title="新建命名空间" width="520px">
      <div class="dialog-grid">
        <label>
          <span>namespaceId</span>
          <ElInput
            v-model="createNamespaceForm.namespaceId"
            placeholder="例如：dev-space"
          />
        </label>
        <label>
          <span>namespaceName</span>
          <ElInput
            v-model="createNamespaceForm.namespaceName"
            placeholder="例如：开发环境"
          />
        </label>
        <label>
          <span>namespaceDesc</span>
          <ElInput
            v-model="createNamespaceForm.namespaceDesc"
            type="textarea"
            :rows="3"
            placeholder="可选描述"
          />
        </label>
      </div>
      <template #footer>
        <ElButton @click="namespaceDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleCreateNamespace">
          创建
        </ElButton>
      </template>
    </el-dialog>

    <el-dialog v-model="cloneDialogVisible" title="克隆配置" width="560px">
      <div class="dialog-grid">
        <label>
          <span>目标命名空间</span>
          <ElSelect v-model="cloneForm.targetTenant" placeholder="默认当前命名空间">
            <ElOption
              v-for="item in namespaces"
              :key="item.namespace || 'public'"
              :label="item.namespaceShowName || item.namespace || 'public'"
              :value="item.namespace || ''"
            />
          </ElSelect>
        </label>
        <label>
          <span>目标 dataId</span>
          <ElInput
            v-model="cloneForm.targetDataId"
            :placeholder="activeConfig.dataId || '请输入目标 dataId'"
          />
        </label>
        <label>
          <span>目标 group</span>
          <ElInput
            v-model="cloneForm.targetGroup"
            placeholder="默认 DEFAULT_GROUP"
          />
        </label>
      </div>
      <template #footer>
        <ElButton @click="cloneDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleCloneConfig">
          克隆
        </ElButton>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyDetailDialogVisible"
      title="历史版本内容"
      width="980px"
    >
      <div class="history-diff-head">
        <ElTag type="info" effect="plain">
          新增 {{ diffStats.added }} 行
        </ElTag>
        <ElTag type="danger" effect="plain">
          删除 {{ diffStats.removed }} 行
        </ElTag>
        <ElTag type="warning" effect="plain">
          变更 {{ diffStats.changed }} 行
        </ElTag>
      </div>
      <div class="history-diff-grid">
        <div class="history-diff-col">
          <div class="history-diff-col__title">当前配置</div>
          <ElScrollbar class="history-diff-scroll">
            <div
              v-for="(row, idx) in diffRows"
              :key="`curr-${idx}`"
              class="history-diff-row"
              :class="{
                'is-added': row.type === 'added',
                'is-removed': row.type === 'removed',
                'is-changed': row.type === 'changed',
              }"
            >
              <span class="history-diff-row__no">{{ row.currentNo || "" }}</span>
              <pre>{{ row.currentText }}</pre>
            </div>
          </ElScrollbar>
        </div>
        <div class="history-diff-col">
          <div class="history-diff-col__title">历史版本</div>
          <ElScrollbar class="history-diff-scroll">
            <div
              v-for="(row, idx) in diffRows"
              :key="`hist-${idx}`"
              class="history-diff-row"
              :class="{
                'is-added': row.type === 'added',
                'is-removed': row.type === 'removed',
                'is-changed': row.type === 'changed',
              }"
            >
              <span class="history-diff-row__no">{{ row.historyNo || "" }}</span>
              <pre>{{ row.historyText }}</pre>
            </div>
          </ElScrollbar>
        </div>
      </div>
      <template #footer>
        <ElButton @click="historyDetailDialogVisible = false">关闭</ElButton>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { Loading, Plus, RefreshRight, Search, SetUp } from "@element-plus/icons-vue";
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElInput,
  ElTag,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElScrollbar,
  ElSelect,
} from "element-plus";
import { computed, markRaw, onMounted, reactive, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  cloneNacosConfig,
  createNacosNamespace,
  deleteNacosNamespace,
  deleteNacosConfig,
  getNacosConfigHistoryDetail,
  getNacosConfig,
  listNacosConfigHistory,
  listNacosConfigs,
  listNacosNamespaces,
  publishNacosConfig,
  rollbackNacosConfig,
  type NacosConfigItem,
  type NacosConfigHistoryItem,
  type NacosNamespaceItem,
} from "../../api/nacos";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "workspace", title: "配置", icon: markRaw(SetUp) },
  { name: "create", title: "新建", icon: markRaw(Plus) },
  { name: "history", title: "历史", icon: markRaw(RefreshRight) },
  { name: "info", title: "概览", icon: markRaw(Search) },
];
const railTabValue = ref("workspace");

const namespaces = ref<NacosNamespaceItem[]>([]);
const activeTenant = ref("");
const configs = ref<NacosConfigItem[]>([]);
const configsLoading = ref(false);
const keyword = ref("");
const groupKeyword = ref("");
const saving = ref(false);

const activeConfig = reactive({
  dataId: "",
  group: "DEFAULT_GROUP",
  type: "yaml",
  content: "",
});
const createForm = reactive({
  dataId: "",
  group: "DEFAULT_GROUP",
  type: "yaml",
  content: "",
});
const namespaceDialogVisible = ref(false);
const cloneDialogVisible = ref(false);
const createNamespaceForm = reactive({
  namespaceId: "",
  namespaceName: "",
  namespaceDesc: "",
});
const cloneForm = reactive({
  targetTenant: "",
  targetDataId: "",
  targetGroup: "DEFAULT_GROUP",
});
const historyLoading = ref(false);
const historyList = ref<NacosConfigHistoryItem[]>([]);
const historyDetailDialogVisible = ref(false);
const historyDetailContent = ref("");
const historyCurrentContent = ref("");

type DiffRow = {
  currentNo: number | null;
  historyNo: number | null;
  currentText: string;
  historyText: string;
  type: "same" | "added" | "removed" | "changed";
};

const activeKey = computed(
  () => `${activeConfig.group || "DEFAULT_GROUP"}::${activeConfig.dataId || ""}`
);

const loadNamespaces = async () => {
  try {
    const response = await listNacosNamespaces(props.connectionId);
    const payload = response?.data as any;
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];
    namespaces.value = rows;
    if (!activeTenant.value) {
      const first = rows[0];
      activeTenant.value = String(first?.namespace || "");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "加载命名空间失败");
  }
};

const loadConfigs = async () => {
  configsLoading.value = true;
  try {
    const response = await listNacosConfigs(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: keyword.value || undefined,
      group: groupKeyword.value || undefined,
      pageNo: 1,
      pageSize: 200,
    });
    const payload = response?.data as any;
    const rows = Array.isArray(payload?.pageItems)
      ? payload.pageItems
      : Array.isArray(payload?.data?.pageItems)
      ? payload.data.pageItems
      : [];
    configs.value = rows;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载配置列表失败");
  } finally {
    configsLoading.value = false;
  }
};

const isActive = (item: NacosConfigItem) =>
  `${item.group || "DEFAULT_GROUP"}::${item.dataId || ""}` === activeKey.value;

const selectConfig = async (item: NacosConfigItem) => {
  activeConfig.dataId = item.dataId || "";
  activeConfig.group = item.group || "DEFAULT_GROUP";
  activeConfig.type = item.type || "yaml";
  activeConfig.content = "";
  try {
    const response = await getNacosConfig(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId,
      group: activeConfig.group,
    });
    activeConfig.content = String((response?.data as any)?.content || "");
    await loadHistory();
    railTabValue.value = "workspace";
  } catch (error: any) {
    ElMessage.error(error?.message || "读取配置失败");
  }
};

const handlePublishConfig = async () => {
  if (!activeConfig.dataId.trim()) {
    ElMessage.warning("请先选择配置");
    return;
  }
  saving.value = true;
  try {
    await publishNacosConfig(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId.trim(),
      group: (activeConfig.group || "DEFAULT_GROUP").trim(),
      content: activeConfig.content || "",
      type: activeConfig.type || undefined,
    });
    ElMessage.success("配置发布成功");
    await loadConfigs();
  } catch (error: any) {
    ElMessage.error(error?.message || "配置发布失败");
  } finally {
    saving.value = false;
  }
};

const handleDeleteConfig = async () => {
  if (!activeConfig.dataId.trim()) {
    ElMessage.warning("请先选择配置");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除配置 ${activeConfig.group}/${activeConfig.dataId} 吗？`,
      "删除确认",
      {
        type: "warning",
      }
    );
    saving.value = true;
    await deleteNacosConfig(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId.trim(),
      group: (activeConfig.group || "DEFAULT_GROUP").trim(),
    });
    ElMessage.success("配置删除成功");
    activeConfig.dataId = "";
    activeConfig.group = "DEFAULT_GROUP";
    activeConfig.type = "yaml";
    activeConfig.content = "";
    await loadConfigs();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "配置删除失败");
    }
  } finally {
    saving.value = false;
  }
};

const handleCreateNamespace = async () => {
  if (!createNamespaceForm.namespaceId.trim()) {
    ElMessage.warning("namespaceId 不能为空");
    return;
  }
  if (!createNamespaceForm.namespaceName.trim()) {
    ElMessage.warning("namespaceName 不能为空");
    return;
  }
  saving.value = true;
  try {
    await createNacosNamespace(props.connectionId, {
      namespaceId: createNamespaceForm.namespaceId.trim(),
      namespaceName: createNamespaceForm.namespaceName.trim(),
      namespaceDesc: createNamespaceForm.namespaceDesc || undefined,
    });
    ElMessage.success("命名空间创建成功");
    namespaceDialogVisible.value = false;
    createNamespaceForm.namespaceId = "";
    createNamespaceForm.namespaceName = "";
    createNamespaceForm.namespaceDesc = "";
    await loadNamespaces();
  } catch (error: any) {
    ElMessage.error(error?.message || "命名空间创建失败");
  } finally {
    saving.value = false;
  }
};

const handleDeleteNamespace = async () => {
  if (!activeTenant.value) {
    ElMessage.warning("请先选择命名空间");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除命名空间 ${activeTenant.value} 吗？`,
      "删除确认",
      { type: "warning" }
    );
    saving.value = true;
    await deleteNacosNamespace(props.connectionId, {
      namespaceId: activeTenant.value,
    });
    ElMessage.success("命名空间删除成功");
    activeTenant.value = "";
    await loadNamespaces();
    await loadConfigs();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "命名空间删除失败");
    }
  } finally {
    saving.value = false;
  }
};

const handleCloneConfig = async () => {
  if (!activeConfig.dataId.trim()) {
    ElMessage.warning("请先选择源配置");
    return;
  }
  if (!cloneForm.targetDataId.trim()) {
    ElMessage.warning("目标 dataId 不能为空");
    return;
  }
  saving.value = true;
  try {
    await cloneNacosConfig(props.connectionId, {
      sourceTenant: activeTenant.value || undefined,
      sourceDataId: activeConfig.dataId.trim(),
      sourceGroup: (activeConfig.group || "DEFAULT_GROUP").trim(),
      targetTenant: cloneForm.targetTenant || activeTenant.value || undefined,
      targetDataId: cloneForm.targetDataId.trim(),
      targetGroup: (cloneForm.targetGroup || "DEFAULT_GROUP").trim(),
      type: activeConfig.type || undefined,
    });
    ElMessage.success("配置克隆成功");
    cloneDialogVisible.value = false;
    cloneForm.targetTenant = "";
    cloneForm.targetDataId = "";
    cloneForm.targetGroup = "DEFAULT_GROUP";
    await loadConfigs();
  } catch (error: any) {
    ElMessage.error(error?.message || "配置克隆失败");
  } finally {
    saving.value = false;
  }
};

const loadHistory = async () => {
  if (!activeConfig.dataId.trim()) {
    historyList.value = [];
    return;
  }
  historyLoading.value = true;
  try {
    const response = await listNacosConfigHistory(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId.trim(),
      group: (activeConfig.group || "DEFAULT_GROUP").trim(),
      pageNo: 1,
      pageSize: 50,
    });
    const payload = response?.data as any;
    const rows = Array.isArray(payload?.pageItems)
      ? payload.pageItems
      : Array.isArray(payload?.historyList)
      ? payload.historyList
      : Array.isArray(payload?.data?.pageItems)
      ? payload.data.pageItems
      : [];
    historyList.value = rows;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载历史版本失败");
  } finally {
    historyLoading.value = false;
  }
};

const handlePreviewHistory = async (item: NacosConfigHistoryItem) => {
  const historyId = String(item.id || "");
  if (!historyId) {
    ElMessage.warning("该历史记录缺少版本 ID");
    return;
  }
  historyLoading.value = true;
  try {
    const response = await getNacosConfigHistoryDetail(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId.trim(),
      group: (activeConfig.group || "DEFAULT_GROUP").trim(),
      historyId,
    });
    historyDetailContent.value = String((response?.data as any)?.content || "");
    historyCurrentContent.value = activeConfig.content || "";
    historyDetailDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || "加载历史详情失败");
  } finally {
    historyLoading.value = false;
  }
};

const diffRows = computed<DiffRow[]>(() => {
  const currentLines = String(historyCurrentContent.value || "").split("\n");
  const historyLines = String(historyDetailContent.value || "").split("\n");
  const maxLen = Math.max(currentLines.length, historyLines.length);
  const rows: DiffRow[] = [];
  for (let index = 0; index < maxLen; index += 1) {
    const currentExists = index < currentLines.length;
    const historyExists = index < historyLines.length;
    const currentText = currentExists ? currentLines[index] : "";
    const historyText = historyExists ? historyLines[index] : "";
    let type: DiffRow["type"] = "same";
    if (currentExists && !historyExists) {
      type = "added";
    } else if (!currentExists && historyExists) {
      type = "removed";
    } else if (currentText !== historyText) {
      type = "changed";
    }
    rows.push({
      currentNo: currentExists ? index + 1 : null,
      historyNo: historyExists ? index + 1 : null,
      currentText,
      historyText,
      type,
    });
  }
  return rows;
});

const diffStats = computed(() => {
  let added = 0;
  let removed = 0;
  let changed = 0;
  diffRows.value.forEach((row) => {
    if (row.type === "added") {
      added += 1;
    } else if (row.type === "removed") {
      removed += 1;
    } else if (row.type === "changed") {
      changed += 1;
    }
  });
  return { added, removed, changed };
});

const handleRollbackHistory = async (item: NacosConfigHistoryItem) => {
  const historyId = String(item.id || "");
  if (!historyId) {
    ElMessage.warning("该历史记录缺少版本 ID");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认回滚到历史版本 ${historyId} 吗？`,
      "回滚确认",
      { type: "warning" }
    );
    saving.value = true;
    await rollbackNacosConfig(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: activeConfig.dataId.trim(),
      group: (activeConfig.group || "DEFAULT_GROUP").trim(),
      historyId,
      type: activeConfig.type || undefined,
    });
    ElMessage.success("回滚成功");
    await selectConfig({
      dataId: activeConfig.dataId,
      group: activeConfig.group,
      type: activeConfig.type,
    });
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "回滚失败");
    }
  } finally {
    saving.value = false;
  }
};

const resetCreateForm = () => {
  createForm.dataId = "";
  createForm.group = "DEFAULT_GROUP";
  createForm.type = "yaml";
  createForm.content = "";
};

const handleCreateConfig = async () => {
  if (!createForm.dataId.trim()) {
    ElMessage.warning("dataId 不能为空");
    return;
  }
  saving.value = true;
  try {
    await publishNacosConfig(props.connectionId, {
      tenant: activeTenant.value || undefined,
      dataId: createForm.dataId.trim(),
      group: (createForm.group || "DEFAULT_GROUP").trim(),
      content: createForm.content || "",
      type: createForm.type || undefined,
    });
    ElMessage.success("配置创建成功");
    activeConfig.dataId = createForm.dataId.trim();
    activeConfig.group = (createForm.group || "DEFAULT_GROUP").trim();
    activeConfig.type = createForm.type || "yaml";
    activeConfig.content = createForm.content || "";
    railTabValue.value = "workspace";
    resetCreateForm();
    await loadConfigs();
  } catch (error: any) {
    ElMessage.error(error?.message || "配置创建失败");
  } finally {
    saving.value = false;
  }
};

const handleTenantChange = async () => {
  activeConfig.dataId = "";
  activeConfig.content = "";
  historyList.value = [];
  await loadConfigs();
};

onMounted(async () => {
  await loadNamespaces();
  await loadConfigs();
});
</script>

<style scoped lang="scss">
.nacos-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.nacos-layout {
  height: 100%;
}

.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-right: 1px solid rgba(127, 144, 155, 0.14);
  background: rgba(248, 250, 252, 0.92);
}

.left-filters {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid rgba(127, 144, 155, 0.12);
  background: #fff;
}

.left-filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.left-scroll {
  flex: 1;
  min-height: 0;
}

.left-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 12px;
  color: #90a3b0;
  font-size: 12px;
}

.config-list {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.config-item {
  display: grid;
  gap: 5px;
  width: 100%;
  text-align: left;
  padding: 10px;
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.16s ease;
}

.config-item:hover {
  border-color: rgba(59, 130, 246, 0.36);
  background: rgba(59, 130, 246, 0.06);
}

.config-item.is-active {
  border-color: rgba(59, 130, 246, 0.44);
  background: rgba(59, 130, 246, 0.1);
}

.config-item__title {
  color: #0f2534;
  font-size: 13px;
  font-weight: 700;
  word-break: break-all;
}

.config-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #648090;
  font-size: 11px;
}

.main-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 14px;
  box-sizing: border-box;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.editor-toolbar__left {
  display: grid;
  gap: 4px;
}

.editor-toolbar__left strong {
  color: #0f2534;
  font-size: 16px;
}

.editor-toolbar__left span {
  color: #6a8493;
  font-size: 12px;
}

.editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-content {
  flex: 1;
  min-height: 0;
}

.editor-content :deep(.el-textarea),
.editor-content :deep(.el-textarea__inner) {
  height: 100%;
}

.editor-content :deep(.el-textarea__inner) {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.65;
}

.create-form {
  display: grid;
  gap: 12px;
}

.create-form label {
  display: grid;
  gap: 6px;
}

.create-form label span {
  color: #60798a;
  font-size: 12px;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}

.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-toolbar strong {
  color: #0f2534;
  font-size: 15px;
}

.history-scroll {
  flex: 1;
  min-height: 0;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 12px;
  color: #8fa4b3;
  font-size: 12px;
}

.history-list {
  display: grid;
  gap: 8px;
  padding: 8px;
}

.history-item {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 10px;
  background: #fff;
}

.history-item__meta {
  display: flex;
  justify-content: space-between;
  color: #6b8595;
  font-size: 12px;
}

.history-item__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.info-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.info-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 12px;
  background: #fff;
}

.info-card small {
  color: #7690a0;
  font-size: 11px;
}

.info-card strong {
  color: #0f2534;
  font-size: 24px;
  line-height: 1;
}

.dialog-grid {
  display: grid;
  gap: 10px;
}

.dialog-grid label {
  display: grid;
  gap: 6px;
}

.dialog-grid label span {
  color: #60798a;
  font-size: 12px;
}

.history-diff-head {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.history-diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.history-diff-col {
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 10px;
  overflow: hidden;
}

.history-diff-col__title {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(127, 144, 155, 0.12);
  background: rgba(248, 250, 252, 0.9);
  color: #516879;
  font-size: 12px;
  font-weight: 600;
}

.history-diff-scroll {
  max-height: 58vh;
}

.history-diff-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: start;
  border-bottom: 1px solid rgba(127, 144, 155, 0.08);
}

.history-diff-row__no {
  padding: 6px 8px;
  color: #8ca0ad;
  font-size: 11px;
  text-align: right;
  border-right: 1px solid rgba(127, 144, 155, 0.08);
}

.history-diff-row pre {
  margin: 0;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.history-diff-row.is-added {
  background: rgba(34, 197, 94, 0.08);
}

.history-diff-row.is-removed {
  background: rgba(239, 68, 68, 0.08);
}

.history-diff-row.is-changed {
  background: rgba(245, 158, 11, 0.1);
}

/* ── Dark Mode ── */
:global(html.dark) {
  .left-panel {
    background: rgba(15, 23, 42, 0.85);
    border-right-color: rgba(148, 163, 184, 0.08);
  }

  .left-filters {
    background: rgba(15, 23, 42, 0.7);
    border-bottom-color: rgba(148, 163, 184, 0.06);
  }

  .left-empty {
    color: #64748b;
  }

  .config-item {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);

    &:hover {
      border-color: rgba(59, 130, 246, 0.3);
      background: rgba(59, 130, 246, 0.08);
    }

    &.is-active {
      border-color: rgba(59, 130, 246, 0.4);
      background: rgba(59, 130, 246, 0.12);
    }
  }

  .config-item__title {
    color: #e2e8f0;
  }

  .config-item__meta {
    color: #64748b;
  }

  .editor-toolbar__left strong {
    color: #e2e8f0;
  }

  .editor-toolbar__left span {
    color: #64748b;
  }

  .create-form label span {
    color: #94a3b8;
  }

  .history-toolbar strong {
    color: #e2e8f0;
  }

  .history-empty {
    color: #64748b;
  }

  .history-item {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .history-item__meta {
    color: #64748b;
  }

  .info-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .info-card small {
    color: #64748b;
  }

  .info-card strong {
    color: #e2e8f0;
  }

  .dialog-grid label span {
    color: #94a3b8;
  }

  .history-diff-col {
    border-color: rgba(148, 163, 184, 0.08);
  }

  .history-diff-col__title {
    background: rgba(15, 23, 42, 0.7);
    border-bottom-color: rgba(148, 163, 184, 0.06);
    color: #94a3b8;
  }

  .history-diff-row {
    border-bottom-color: rgba(148, 163, 184, 0.06);
  }

  .history-diff-row__no {
    color: #64748b;
    border-right-color: rgba(148, 163, 184, 0.06);
  }

  .history-diff-row pre {
    color: #cbd5e1;
  }

  .history-diff-row.is-added {
    background: rgba(34, 197, 94, 0.1);
  }

  .history-diff-row.is-removed {
    background: rgba(239, 68, 68, 0.1);
  }

  .history-diff-row.is-changed {
    background: rgba(245, 158, 11, 0.12);
  }
}
</style>

