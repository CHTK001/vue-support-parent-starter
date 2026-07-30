<template>
  <section class="spider-manage">
    <div class="spider-manage__content">
      <!-- Header -->
      <header class="spider-manage__header">
        <div class="spider-manage__header-left">
          <button type="button" class="spider-manage__back-btn" title="返回总览" @click="toggleManage">
            <el-icon :size="16"><Link /></el-icon>
                  主体网站
                </span>
                <span class="spider-card__field-value">{{ item.spiderSiteHost || '-' }}</span>
              </div>
              <div class="spider-card__field">
                <span class="spider-card__field-header">
                  <el-icon :size="11"><EditPen /></el-icon>
              </button>
              <button type="button" class="spider-card__action-btn" :title="isEnabled(item.spiderStatus) ? '禁用' : '启用'" @click="toggleStatus(item)">
                <el-icon :size="13"><Document /></el-icon>
              </button>
              <button type="button" class="spider-card__action-btn action-btn--danger" title="删除" @click="removeDefinition(item.spiderCode)">
                <el-icon :size="13"><Document /></el-icon>
                  <p>点击左侧数据卡片查看详情</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="poolDialogVisible" class="record-mask" @click.self="closePoolDialog">
          <section class="record-modal">
            <div class="record-modal__surface pool-surface">
              <header class="record-modal__head">
                <div class="record-modal__title-group">
                  <strong>池管理</strong>
                  <span>{{ activePoolType }}</span>
                </div>
                <div class="record-modal__actions">
                  <button type="button" class="record-play-btn" @click="createPool">新增池</button>
                  <button type="button" class="record-close-btn" @click="closePoolDialog">
                    <el-icon :size="18"><Close /></el-icon>
                  </button>
                </div>
              </header>

              <div class="pool-type-switch">
                <button v-for="type in poolTypes" :key="type" type="button" class="record-play-btn" :class="{ 'is-active': type === activePoolType }" @click="switchPoolType(type)">{{ type }}</button>
              </div>

              <div class="record-modal__body">
                <aside class="record-list thin-scroller">
                  <button
                    v-for="pool in spiderPools"
                    :key="pool.spiderPoolCode"
                    type="button"
                    class="record-list__item"
                    :class="{ 'is-active': pool.spiderPoolCode === activePoolCode }"
                    @click="selectPool(pool.spiderPoolCode)"
                  >
                    <strong>{{ pool.spiderPoolName }}</strong>
                    <span>{{ pool.spiderPoolCode }}</span>
                  </button>
                </aside>

                <section class="record-player">
                  <div class="record-player__summary">
                    <div>
                      <span>当前池</span>
                      <strong>{{ activePoolCode || '-' }}</strong>
                    </div>
                    <div class="record-player__summary-actions">
                      <button type="button" class="record-play-btn" :disabled="!activePoolCode" @click="createPoolItem">新增数据项</button>
                      <button type="button" class="record-play-btn" :disabled="!activePoolCode" @click="removePool">删除池</button>
                    </div>
                  </div>

                  <div class="pool-form-grid">
                    <label class="spider-node-panel__item">
                      <span>池编码</span>
                      <input v-model="poolForm.spiderPoolCode" type="text" />
                    </label>
                    <label class="spider-node-panel__item">
                      <span>池名称</span>
                      <input v-model="poolForm.spiderPoolName" type="text" />
                    </label>
                    <label class="spider-node-panel__item pool-form-grid__full">
                      <span>备注</span>
                      <input v-model="poolForm.spiderPoolRemark" type="text" />
                    </label>
                  </div>

                  <div class="spider-manual-task-card__actions">
                    <button type="button" class="spider-toolbar-btn spider-toolbar-btn--primary" @click="savePoolForm">保存池</button>
                  </div>

                  <div class="record-player__timeline thin-scroller">
                    <article
                      v-for="item in spiderPoolItems"
                      :key="`${item.spiderPoolCode}-${item.spiderItemCode}`"
                      class="record-player__event is-played"
                    >
                      <div class="record-player__event-content">
                        <strong>{{ item.spiderItemName }}</strong>
                        <span>{{ item.spiderItemCode }}</span>
                        <textarea v-model="item.spiderItemPayload" rows="6" class="pool-payload-textarea" />
                        <div class="spider-manual-task-card__actions">
                          <button type="button" class="record-play-btn" @click="savePoolItemForm(item)">保存</button>
                          <button type="button" class="record-play-btn" @click="removePoolItem(item)">删除</button>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </Teleport>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import {
  Link,
  EditPen,
  Plus,
  Document,
  Delete,
  Coin,
  Search,
  Refresh,
  FullScreen,
  Close,
} from "@element-plus/icons-vue";
import {
  createSpiderDefinition, deleteSpiderDefinition, listSpiderDefinitions,
  getSpiderExecutionDetail,
  getSpiderExecutionEvents,
  deleteSpiderPool,
  deleteSpiderPoolItem,
  listSpiderParseResults,
  listSpiderPoolItems,
  listSpiderPools,
  listSpiderExecutionRecords,
  runSpiderExecution,
  runSpiderExample,
  saveSpiderPool,
  saveSpiderPoolItem,
  updateSpiderDefinition, updateSpiderDefinitionStatus,
} from "../../../api/spider";
import type {
  SpiderDefinition,
  SpiderExecutionDetailView,
  SpiderExecutionEventView,
  SpiderExecutionRecordView,
  SpiderPool,
  SpiderPoolItem,
  SpiderPoolType,
} from "../../../types/orchestration";

type DialogMode = "create" | "edit";

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const searchQuery = ref("");
const spiders = ref<SpiderDefinition[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const editingCode = ref("");
const executionDialogVisible = ref(false);
const executionDialogTitle = ref("");
const executionDialogCode = ref("");
const executionLoading = ref(false);
const executionRecords = ref<SpiderExecutionRecordView[]>([]);
const activeExecutionNo = ref("");
const activeExecutionDetail = ref<SpiderExecutionDetailView | null>(null);
const executionEvents = ref<SpiderExecutionEventView[]>([]);
const playbackIndex = ref(-1);
const executionPlaybackTimer = ref<ReturnType<typeof setInterval> | null>(null);
const execRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null);
const poolDialogVisible = ref(false);
const poolTypes: SpiderPoolType[] = ["ACCOUNT", "DATA", "DICTIONARY"];
const activePoolType = ref<SpiderPoolType>("ACCOUNT");
const spiderPools = ref<SpiderPool[]>([]);
const spiderPoolItems = ref<SpiderPoolItem[]>([]);
const activePoolCode = ref("");
const poolForm = ref<SpiderPool>({
  spiderPoolCode: "",
  spiderPoolName: "",
  spiderPoolType: "ACCOUNT",
  spiderPoolStatus: 1,
  spiderPoolRemark: "",
});

const colors = ['var(--el-color-info)','var(--el-color-info)','var(--el-color-info)','var(--el-color-warning)','var(--el-color-primary)','var(--el-color-success)','var(--el-color-info)','var(--el-color-warning)'];
const avatarColor = (code: string) => {
  let h = 0; for (let i = 0; i < code.length; i++) h = ((h << 5) - h) + code.charCodeAt(i);
  return colors[Math.abs(h) % colors.length];
};

const executorType = (item: SpiderDefinition) => (item.spiderExecutorType || 'ONCE').toLowerCase();
const dedupLabel = (s: SpiderDefinition['spiderDedupStrategy']) =>
  ({ URL_FINGERPRINT: 'URL 指纹', NORMALIZED_URL: '规范化 URL', CONTENT_FINGERPRINT: '内容指纹', CUSTOM: '自定义' })[s] || s;
const storageLabel = (s: SpiderDefinition['spiderUrlStorageType']) =>
  ({ DATABASE: '数据库', REDIS: 'Redis', SPI: 'SPI 扩展' })[s] || s;

const execStatusLabel = (s: string) =>
  ({ RUNNING: '运行中', WAIT_MANUAL: '等待人工', SUCCESS: '已完成', FAILED: '失败', WAITING: '等待中', STOPPED: '已停止' })[s] || s;

const parseExecutorConfig = (value?: string) => {
  if (!value) return {} as Record<string, any>;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const isAiEnabled = (item: Pick<SpiderDefinition, "spiderAiEnabled" | "spiderExecutorConfig">) => {
  if (typeof item.spiderAiEnabled === "boolean") return item.spiderAiEnabled;
  if (typeof item.spiderAiEnabled === "number") return item.spiderAiEnabled !== 0;
  const config = parseExecutorConfig(item.spiderExecutorConfig);
  if (typeof config.aiEnabled === "boolean") return config.aiEnabled;
  if (typeof config.aiEnabled === "number") return config.aiEnabled !== 0;
  return true;
};

const filteredSpiders = computed(() => {
  if (!searchQuery.value) return spiders.value;
  const q = searchQuery.value.toLowerCase();
  return spiders.value.filter(s =>
    s.spiderName.toLowerCase().includes(q) ||
    s.spiderCode.toLowerCase().includes(q) ||
    (s.spiderSiteHost || '').toLowerCase().includes(q)
  );
});

const createEmptyForm = () => ({
  spiderCode: "", spiderName: "", spiderEntryUrl: "", spiderSiteHost: "",
  spiderExecutorType: "ONCE" as SpiderDefinition["spiderExecutorType"],
  spiderExecutorRounds: 1, spiderCollectDeepUrl: true, spiderNotifyOnFailure: true,
  spiderDedupStrategy: "URL_FINGERPRINT" as SpiderDefinition["spiderDedupStrategy"],
  spiderUrlStorageType: "DATABASE" as SpiderDefinition["spiderUrlStorageType"],
  spiderUrlStorageSpi: "", spiderStatus: true, spiderAiEnabled: true, spiderExecutorConfig: {} as Record<string, any>,
});

const form = ref(createEmptyForm());

const isEnabled = (status: SpiderDefinition["spiderStatus"]) => status === "ENABLED" || status === 1;

const toPayload = (): SpiderDefinition => ({
  spiderCode: form.value.spiderCode, spiderName: form.value.spiderName,
  spiderEntryUrl: form.value.spiderEntryUrl, spiderSiteHost: form.value.spiderSiteHost,
  spiderExecutorType: form.value.spiderExecutorType,
  spiderExecutorRounds: Number(form.value.spiderExecutorRounds || 1),
  spiderExecutorConfig: JSON.stringify({
    ...(form.value.spiderExecutorConfig || {}),
    aiEnabled: Boolean(form.value.spiderAiEnabled),
  }),
  spiderAiEnabled: form.value.spiderAiEnabled ? 1 : 0,
  spiderCollectDeepUrl: form.value.spiderCollectDeepUrl ? 1 : 0,
  spiderNotifyOnFailure: form.value.spiderNotifyOnFailure ? 1 : 0,
  spiderDedupStrategy: form.value.spiderDedupStrategy,
  spiderUrlStorageType: form.value.spiderUrlStorageType,
  spiderUrlStorageSpi: form.value.spiderUrlStorageSpi || undefined,
  spiderStatus: form.value.spiderStatus ? 1 : 0,
});

const normalizeDefinitions = (items: SpiderDefinition[]) =>
  items.map((item, index) => ({
    ...item,
    spiderId: item.spiderId ?? index + 1,
    spiderAiEnabled: isAiEnabled(item),
  }));

const loadDefinitions = async () => {
  loading.value = true; errorMessage.value = "";
  try { spiders.value = normalizeDefinitions(await listSpiderDefinitions()); }
  catch (e) { errorMessage.value = `接口失败：${String(e)}`; }
  finally { loading.value = false; }
};

const openCreateDialog = () => { dialogMode.value = "create"; editingCode.value = ""; form.value = createEmptyForm(); dialogVisible.value = true; };
const openEditDialog = (item: SpiderDefinition) => {
  dialogMode.value = "edit"; editingCode.value = item.spiderCode;
  form.value = {
    spiderCode: item.spiderCode,
    spiderName: item.spiderName,
    spiderEntryUrl: item.spiderEntryUrl,
    spiderSiteHost: item.spiderSiteHost,
    spiderExecutorType: item.spiderExecutorType,
    spiderExecutorRounds: item.spiderExecutorRounds || 1,
    spiderCollectDeepUrl: item.spiderCollectDeepUrl === true || item.spiderCollectDeepUrl === 1,
    spiderNotifyOnFailure: item.spiderNotifyOnFailure === true || item.spiderNotifyOnFailure === 1,
    spiderDedupStrategy: item.spiderDedupStrategy,
    spiderUrlStorageType: item.spiderUrlStorageType,
    spiderUrlStorageSpi: item.spiderUrlStorageSpi || "",
    spiderStatus: isEnabled(item.spiderStatus),
    spiderAiEnabled: isAiEnabled(item),
    spiderExecutorConfig: parseExecutorConfig(item.spiderExecutorConfig),
  };
  dialogVisible.value = true;
};
const closeDialog = () => { dialogVisible.value = false; submitting.value = false; };
const stopExecutionPlayback = () => {
  if (!executionPlaybackTimer.value) return;
  clearInterval(executionPlaybackTimer.value);
  executionPlaybackTimer.value = null;
};
const closeExecutionDialog = () => {
  stopExecutionPlayback();
  if (execRefreshTimer.value) {
    clearInterval(execRefreshTimer.value);
    execRefreshTimer.value = null;
  }
  executionDialogVisible.value = false;
  executionDialogTitle.value = "";
  executionDialogCode.value = "";
  executionLoading.value = false;
  executionRecords.value = [];
  activeExecutionNo.value = "";
  activeExecutionDetail.value = null;
  executionEvents.value = [];
  playbackIndex.value = -1;
};
const closePoolDialog = () => {
  poolDialogVisible.value = false;
  spiderPools.value = [];
  spiderPoolItems.value = [];
  activePoolCode.value = "";
};
function formatShortTime(t?: string): string {
  if (!t) return "-";
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t.slice(0, 16);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return t.slice(0, 16); }
}
const currentPlaybackEvent = computed(() =>
  playbackIndex.value >= 0 ? executionEvents.value[playbackIndex.value] || null : null
);
const selectExecutionRecord = async (spiderExecutionNo: string) => {
  if (!spiderExecutionNo) return;
  stopExecutionPlayback();
  executionLoading.value = true;
  activeExecutionNo.value = spiderExecutionNo;
  playbackIndex.value = -1;
  try {
    const [detail, events] = await Promise.all([
      getSpiderExecutionDetail(spiderExecutionNo),
      getSpiderExecutionEvents(spiderExecutionNo),
    ]);
    activeExecutionDetail.value = detail;
    executionEvents.value = events;
  } finally {
    executionLoading.value = false;
  }
};
const toggleExecutionPlayback = () => {
  if (!executionEvents.value.length) return;
  if (executionPlaybackTimer.value) {
    stopExecutionPlayback();
    return;
  }
  if (playbackIndex.value >= executionEvents.value.length - 1) {
    playbackIndex.value = -1;
  }
  executionPlaybackTimer.value = setInterval(() => {
    if (playbackIndex.value >= executionEvents.value.length - 1) {
      stopExecutionPlayback();
      return;
    }
    playbackIndex.value += 1;
  }, 900);
};
const openExecutionDialog = async (item: SpiderDefinition) => {
  executionDialogVisible.value = true;
  executionDialogTitle.value = item.spiderName;
  executionDialogCode.value = item.spiderCode;
  executionLoading.value = true;
  executionRecords.value = [];
  activeExecutionNo.value = "";
  activeExecutionDetail.value = null;
  executionEvents.value = [];
  playbackIndex.value = -1;
  stopExecutionPlayback();
  try {
    await refreshExecutionRecords(item.spiderCode);
  } catch (e) {
    errorMessage.value = `加载运行记录失败：${String(e)}`;
  } finally {
    executionLoading.value = false;
  }
  // 自动刷新运行记录列表
  if (execRefreshTimer.value) clearInterval(execRefreshTimer.value);
  execRefreshTimer.value = setInterval(() => {
    refreshExecutionRecords(item.spiderCode).catch(() => undefined);
  }, 10000);
};

const refreshExecutionRecords = async (spiderCode: string) => {
  if (!spiderCode) return;
  const records = await listSpiderExecutionRecords(spiderCode, undefined, 12);
  // 保持当前选中的记录不变
  const previousActiveNo = activeExecutionNo.value;
  executionRecords.value = records;
  if (records.length && !previousActiveNo) {
    await selectExecutionRecord(records[0].spiderExecutionNo);
  } else if (records.length && previousActiveNo) {
    // 如果当前选中的记录还在列表中，保持选中
    const stillExists = records.some(r => r.spiderExecutionNo === previousActiveNo);
    if (!stillExists) {
      await selectExecutionRecord(records[0].spiderExecutionNo);
    }
  }
};
const parseResultDialogVisible = ref(false);
const parseResultDialogTitle = ref("");
const parseResultDialogCode = ref("");
const parseResults = ref<import("../../../api/spider").SpiderParseResultView[]>([]);
const parseResultLoading = ref(false);
const parseResultPage = ref(1);
const parseResultPageSize = 15;
const prSearchQuery = ref("");
const selectedParseResult = ref<import("../../../api/spider").SpiderParseResultView | null>(null);

const filteredParseResults = computed(() => {
  const q = prSearchQuery.value.toLowerCase().trim();
  if (!q) return parseResults.value;
  return parseResults.value.filter(item => {
    if (item.spiderTargetUrl?.toLowerCase().includes(q)) return true;
    try {
      const payload = JSON.parse(item.spiderResultPayload || "{}");
      return JSON.stringify(payload).toLowerCase().includes(q);
    } catch {
      return false;
    }
  });
});

const parseResultPageTotal = computed(() =>
  Math.max(1, Math.ceil(filteredParseResults.value.length / parseResultPageSize))
);

const paginatedResults = computed(() => {
  const start = (parseResultPage.value - 1) * parseResultPageSize;
  return filteredParseResults.value.slice(start, start + parseResultPageSize);
});

function parsedPayload(item: import("../../../api/spider").SpiderParseResultView): Record<string, any> {
  try { return JSON.parse(item.spiderResultPayload || "{}"); }
  catch { return {}; }
}

function payloadPreview(item: import("../../../api/spider").SpiderParseResultView): Record<string, string> {
  const p = parsedPayload(item);
  const keys = Object.keys(p);
  const preview: Record<string, string> = {};
  let count = 0;
  for (const k of keys) {
    if (count >= 3) break;
    const v = p[k];
    preview[k] = v === null || v === undefined ? '-' : String(v).slice(0, 40);
    count++;
  }
  return preview;
}

function formatJson(item: import("../../../api/spider").SpiderParseResultView): string {
  try {
    return JSON.stringify(JSON.parse(item.spiderResultPayload || "{}"), null, 2);
  } catch {
    return item.spiderResultPayload || '{}';
  }
}

function parsedDepth(item: import("../../../api/spider").SpiderParseResultView): number | null {
  if (item.spiderDepth != null) return item.spiderDepth;
  try {
    const p = JSON.parse(item.spiderResultPayload || "{}");
    if (p.depth != null) return Number(p.depth);
  } catch {}
  return null;
}

function depthLabel(depth: number | null): string {
  if (depth === 0) return '列表页/种子页';
  if (depth === 1) return '第一层详情页';
  if (depth === 2) return '第二层子页';
  if (depth != null) return '第' + depth + '层';
  return '未知';
}

const openParseResultDialog = async (item: SpiderDefinition) => {
  parseResultDialogVisible.value = true;
  parseResultDialogTitle.value = item.spiderName;
  parseResultDialogCode.value = item.spiderCode;
  parseResultLoading.value = true;
  parseResults.value = [];
  parseResultPage.value = 1;
  try {
    parseResults.value = await listSpiderParseResults(item.spiderCode, undefined, 100);
  } catch (e) {
    errorMessage.value = `加载采集数据失败：${String(e)}`;
  } finally {
    parseResultLoading.value = false;
  }
};
const closeParseResultDialog = () => {
  parseResultDialogVisible.value = false;
  parseResultDialogTitle.value = "";
  parseResultDialogCode.value = "";
  parseResults.value = [];
  prSearchQuery.value = "";
  selectedParseResult.value = null;
};

const navigateToReplay = () => {
  if (!activeExecutionDetail.value) return;
  const code = activeExecutionDetail.value.spiderDefinitionCode;
  const no = activeExecutionDetail.value.spiderExecutionNo;
  if (!code || !no) return;
  // 导航到编排页，附带 replayExecutionNo 参数
  navigateToOrchestration({ spiderCode: code }, { replayExecutionNo: no });
};

const loadPools = async () => {
  spiderPools.value = await listSpiderPools(activePoolType.value);
  const nextCode = spiderPools.value.some(item => item.spiderPoolCode === activePoolCode.value)
    ? activePoolCode.value
    : spiderPools.value[0]?.spiderPoolCode || "";
  activePoolCode.value = nextCode;
  if (nextCode) {
    spiderPoolItems.value = await listSpiderPoolItems(nextCode);
    const pool = spiderPools.value.find(item => item.spiderPoolCode === nextCode);
    if (pool) poolForm.value = { ...pool };
  } else {
    spiderPoolItems.value = [];
    poolForm.value = {
      spiderPoolCode: "",
      spiderPoolName: "",
      spiderPoolType: activePoolType.value,
      spiderPoolStatus: 1,
      spiderPoolRemark: "",
    };
  }
};
const openPoolDialog = async () => {
  poolDialogVisible.value = true;
  await loadPools();
};
const switchPoolType = async (type: SpiderPoolType) => {
  activePoolType.value = type;
  await loadPools();
};
const selectPool = async (spiderPoolCode: string) => {
  activePoolCode.value = spiderPoolCode;
  const pool = spiderPools.value.find(item => item.spiderPoolCode === spiderPoolCode);
  if (pool) {
    poolForm.value = { ...pool };
  }
  spiderPoolItems.value = await listSpiderPoolItems(spiderPoolCode);
};
const createPool = () => {
  activePoolCode.value = "";
  spiderPoolItems.value = [];
  poolForm.value = {
    spiderPoolCode: "",
    spiderPoolName: "",
    spiderPoolType: activePoolType.value,
    spiderPoolStatus: 1,
    spiderPoolRemark: "",
  };
};
const savePoolForm = async () => {
  poolForm.value.spiderPoolType = activePoolType.value;
  const saved = await saveSpiderPool(poolForm.value);
  activePoolCode.value = saved.spiderPoolCode;
  await loadPools();
};
const removePool = async () => {
  if (!activePoolCode.value) return;
  await deleteSpiderPool(activePoolCode.value);
  await loadPools();
};
const createPoolItem = () => {
  if (!activePoolCode.value) return;
  spiderPoolItems.value = [
    ...spiderPoolItems.value,
    {
      spiderPoolCode: activePoolCode.value,
      spiderItemCode: `item-${Date.now()}`,
      spiderItemName: "新数据项",
      spiderItemType: activePoolType.value,
      spiderItemPayload: activePoolType.value === "ACCOUNT"
        ? JSON.stringify({ username: "", password: "", cookieJson: "" }, null, 2)
        : JSON.stringify({}, null, 2),
      spiderSortNum: spiderPoolItems.value.length * 10,
      spiderItemStatus: 1,
    },
  ];
};
const savePoolItemForm = async (item: SpiderPoolItem) => {
  await saveSpiderPoolItem(item);
  spiderPoolItems.value = await listSpiderPoolItems(activePoolCode.value);
};
const removePoolItem = async (item: SpiderPoolItem) => {
  await deleteSpiderPoolItem(item.spiderPoolCode, item.spiderItemCode);
  spiderPoolItems.value = await listSpiderPoolItems(activePoolCode.value);
};

const submitForm = async () => {
  if (!form.value.spiderCode || !form.value.spiderName || !form.value.spiderEntryUrl) { errorMessage.value = "编码、名称、主入口不能为空"; return; }
  submitting.value = true; errorMessage.value = "";
  try {
    const p = toPayload();
    dialogMode.value === "create" ? await createSpiderDefinition(p) : await updateSpiderDefinition(editingCode.value, p);
    closeDialog(); await loadDefinitions();
  } catch (e) { errorMessage.value = `保存失败：${String(e)}`; }
  finally { submitting.value = false; }
};

const removeDefinition = async (spiderCode: string) => {
  if (!window.confirm(`确认删除 ${spiderCode} 吗？`)) return;
  try { await deleteSpiderDefinition(spiderCode); await loadDefinitions(); }
  catch (e) { errorMessage.value = `删除失败：${String(e)}`; }
};

const toggleStatus = async (item: SpiderDefinition) => {
  try { await updateSpiderDefinitionStatus(item.spiderCode, isEnabled(item.spiderStatus) ? 0 : 1); await loadDefinitions(); }
  catch (e) { errorMessage.value = `状态更新失败：${String(e)}`; }
};

const navigateToOrchestration = inject<(item: { spiderId?: number | null; spiderCode: string }, extraParams?: Record<string, string>) => void>('navigateToOrchestration')
  || ((item, extraParams) => {
    const qs = new URLSearchParams({ spiderCode: item.spiderCode, ...extraParams }).toString();
    window.location.hash = `/spider/orchestration?${qs}`;
  });
const toggleManage = inject<() => void>('toggleManage')
  || (() => { window.location.hash = '/spider/home'; });

const runningCode = ref("");

const runSpider = async (item: SpiderDefinition) => {
  // 已运行中：跳转到编排页查看
  if (item.spiderLatestExecutionStatus === 'RUNNING') {
    navigateToOrchestration(item);
    return;
  }
  if (runningCode.value) return;
  runningCode.value = item.spiderCode;
  try {
    const result = await runSpiderExample(item.spiderCode);
    const executionNo = result?.spiderExecutionNo;
    errorMessage.value = `✅ 已启动 ${item.spiderName}`;
    // 自动跳转到监控页面，只显示本次运行
    openMonitor(item, executionNo);
  } catch (e) {
    errorMessage.value = `运行失败：${String(e)}`;
  } finally {
    runningCode.value = "";
  }
};

const openMonitor = (item: SpiderDefinition, executionNo?: string) => {
  const qs = new URLSearchParams({ code: item.spiderCode });
  if (executionNo) qs.set("executionNo", executionNo);
  window.open(`/?spiderTab=monitor&${qs.toString()}`, '_blank');
};

onMounted(() => { loadDefinitions(); });
onBeforeUnmount(() => {
  stopExecutionPlayback();
  if (execRefreshTimer.value) clearInterval(execRefreshTimer.value);
});
</script>

<style scoped lang="scss">
.spider-manage {
  background: var(--el-bg-color);
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

.spider-manage__content {
  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ── Header ──────────────────────────────────
.spider-manage__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.spider-manage__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spider-manage__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    color: var(--el-color-primary);
  }
}

.spider-manage__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.spider-manage__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  gap: 4px;
}

.spider-manage__count {
  color: var(--el-color-primary);
  font-weight: 600;
}

// ── Actions ─────────────────────────────────
.spider-manage__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spider-manage__search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-placeholder);
  transition: border-color 0.2s;

  &:focus-within {
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }

  input {
    width: 160px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    font-size: 13px;
    outline: none;
    &::placeholder { color: var(--el-text-color-placeholder); }
  }
}

.spider-manage__icon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    color: var(--el-color-primary);
  }

  &.is-spinning svg { animation: spin 1s linear infinite; }
}

.spider-manage__create-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: var(--el-color-primary);
  color: var(--el-bg-color);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  }
}

// ── Error ───────────────────────────────────
.spider-manage__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 15%, transparent);
  color: var(--el-color-danger);
  font-size: 13px;
}

// ── Skeleton ────────────────────────────────
.skeleton-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-alt);
}

.skeleton-card__shimmer {
  position: absolute;
  inset: 0;
  background: var(--el-fill-color-light);
  opacity: 0.3;
  animation: shimmer 2s infinite alternate;
}

.skeleton-box {
  background: color-mix(in srgb, var(--el-border-color) 60%, transparent);
  border-radius: 6px;
}

// ── Cards Grid ──────────────────────────────
.spider-manage__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

// ── Card ────────────────────────────────────
.spider-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: spider-card-in 0.4s ease both;
  animation-delay: calc(var(--i) * 0.05s);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
  }

  &:hover .spider-card__actions {
    opacity: 1;
  }
}

@keyframes spider-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

// ── Card Top ────────────────────────────────
.spider-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.spider-card__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.spider-card__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-bg-color);
}

.spider-card__info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.spider-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-card__code {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
}

// ── Status Pills ────────────────────────────
.spider-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.spider-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--el-bg-color-alt);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color);
}

.spider-card__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.pill--on {
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent);
  color: var(--el-color-success);
  .spider-card__pill-dot { background: var(--el-color-success); }
}

.pill--off {
  background: color-mix(in srgb, var(--el-text-color-placeholder) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-text-color-placeholder) 20%, transparent);
  color: var(--el-text-color-secondary);
  .spider-card__pill-dot { background: var(--el-text-color-placeholder); }
}

.pill--exec-running {
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 20%, transparent);
  color: var(--el-color-warning-dark-2);
  .spider-card__pill-dot { background: var(--el-color-warning); }
}

.pill--exec-success {
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent);
  color: var(--el-color-success);
  .spider-card__pill-dot { background: var(--el-color-success); }
}

.pill--exec-failed {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-danger) 20%, transparent);
  color: var(--el-color-danger);
  .spider-card__pill-dot { background: var(--el-color-danger); }
}

.pill--exec-waiting {
  background: color-mix(in srgb, var(--el-text-color-placeholder) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-text-color-placeholder) 20%, transparent);
  color: var(--el-text-color-secondary);
  .spider-card__pill-dot { background: var(--el-text-color-placeholder); }
}

.pill--exec-unknown {
  display: none;
}

// ── Card Body ───────────────────────────────
.spider-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spider-card__fields {
  display: grid;
  gap: 6px;
}

.spider-card__field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
}

.spider-card__field-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  font-size: 12px;
}

.spider-card__field-value {
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--url {
    color: var(--el-color-primary);
    font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
    font-size: 11px;
  }
}

// ── Tags ────────────────────────────────────
.spider-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.spider-card__tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: var(--el-bg-color-alt);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color);
}

.tag--ai {
  background: color-mix(in srgb, var(--el-color-info) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-info) 15%, transparent);
  color: var(--el-color-info);
}

.tag--spi {
  background: color-mix(in srgb, var(--el-color-info) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-info) 15%, transparent);
  color: var(--el-color-info);
}

.tag--code {
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 15%, transparent);
  color: var(--el-color-warning-dark-2);
}

.tag--neutral {
  // default style
}

// ── Card Footer ─────────────────────────────
.spider-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color);
}

.spider-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spider-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

// ── Action Buttons ──────────────────────────
.spider-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.spider-card__action-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--el-bg-color-alt);
    color: var(--el-text-color-secondary);
  }
}

.action-btn--danger:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger);
}

.action-btn--prime:hover {
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  color: var(--el-color-success);
}

.action-btn--warn:hover {
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  color: var(--el-color-warning-dark-2);
}

// ── Empty ───────────────────────────────────
.spider-manage__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

// ── Dialog ──────────────────────────────────
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--el-text-color-primary) 40%, transparent);
}

.dialog {
  width: min(520px, 100%);
  padding: 24px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  box-shadow: 0 20px 60px color-mix(in srgb, var(--el-text-color-primary) 20%, transparent);
}

.dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dialog__title-group {
  display: grid;
  gap: 4px;
}

.dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.dialog__desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.dialog__close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--el-text-color-regular);
    border-color: var(--el-border-color-light);
  }
}

.dialog__body {
  padding: 20px 0;
}

.dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.fld {
  display: grid;
  gap: 5px;
}

.fld__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fld input, .fld select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-regular);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &::placeholder { color: var(--el-text-color-placeholder); }
}

.fld select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.dialog__switches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.sw {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-alt);
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover { border-color: var(--el-border-color-light); }

  .sw__info {
    display: grid;
    gap: 2px;
    strong { font-size: 12px; color: var(--el-text-color-primary); }
    small { font-size: 10px; color: var(--el-text-color-placeholder); }
  }
}

.sw__toggle {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-border-color) 80%, transparent);
  transition: background 0.25s;

  &.on {
    background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    .sw__knob {
      transform: translateX(14px);
      background: var(--el-color-primary);
    }
  }
}

.sw__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// ── General Buttons ────────────────────────
.dbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &--ghost {
    background: var(--el-bg-color-bg);
    color: var(--el-text-color-secondary);
    border-color: var(--el-border-color);
    &:hover {
      border-color: var(--el-border-color-light);
      color: var(--el-text-color-regular);
    }
  }

  &--prime {
    background: var(--el-color-primary);
    color: var(--el-bg-color);
    border: none;
    &:hover {
      opacity: 0.9;
      box-shadow: 0 2px 12px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}

.dbtn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: var(--el-bg-color);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// ── Execution Record Dialog ─────────────────
.record-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--el-text-color-primary) 40%, transparent);
}

.record-modal {
  width: min(1100px, 100%);
  max-height: min(85vh, 900px);
}

.record-modal__surface {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 20px 60px color-mix(in srgb, var(--el-text-color-primary) 20%, transparent);
  overflow: hidden;
}

.record-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color);
}

.record-modal__title-group {
  display: grid;
  gap: 3px;

  strong {
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.record-modal__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-play-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
    color: var(--el-color-primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.record-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-border-color-light);
    color: var(--el-text-color-regular);
  }
}

.record-modal__body {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
}

.record-list {
  min-height: 0;
  padding: 12px;
  display: grid;
  align-content: start;
  gap: 6px;
  border-right: 1px solid var(--el-border-color);
  overflow: auto;
}

.record-list__item {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-border-color);
    background: var(--el-bg-color-alt);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.record-list__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
}

.record-list__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.exec-status--running .record-list__dot { background: var(--el-color-warning); animation: pulse-dot 1.5s ease-in-out infinite; }
.exec-status--running { color: var(--el-color-warning); }
.exec-status--success .record-list__dot { background: var(--el-color-success); }
.exec-status--success { color: var(--el-color-success); }
.exec-status--failed .record-list__dot { background: var(--el-color-danger); }
.exec-status--failed { color: var(--el-color-danger); }
.exec-status--waiting .record-list__dot { background: var(--el-text-color-placeholder); }
.exec-status--waiting { color: var(--el-text-color-placeholder); }
.exec-status--unknown .record-list__dot { background: var(--el-text-color-secondary); }
.exec-status--unknown { color: var(--el-text-color-secondary); }

.record-list__id {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
}

.record-list__time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes spider-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Record Player ───────────────────────────
.record-player {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
}

.record-player__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color-alt);

  > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  strong, span {
    font-size: 12px;
    color: var(--el-text-color-primary);
  }

  span {
    color: var(--el-text-color-placeholder);
  }
}

.record-player__spotlight {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 15%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);

  > span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--el-color-primary);
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }

  small {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.record-player__timeline {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 8px;
}

.record-player__event {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-alt);
  transition: all 0.15s;

  &.is-played {
    border-color: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  }
}

.record-player__event-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 5px;
  background: color-mix(in srgb, var(--el-color-primary) 60%, white);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.record-player__event-content {
  display: grid;
  gap: 3px;

  strong {
    font-size: 12px;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  small {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

// ── Pool ────────────────────────────────────
.pool-surface {
  display: flex;
  flex-direction: column;
}

.pool-type-switch {
  display: flex;
  gap: 8px;
  padding: 0 20px 14px;

  .record-play-btn.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.pool-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pool-form-grid__full {
  grid-column: 1 / -1;
}

.record-player__summary-actions {
  display: flex;
  gap: 8px;
}

.pool-payload-textarea {
  width: 100%;
  min-height: 140px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-primary);
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  }
}

// ── Parse Result ────────────────────────────
.parse-result-modal .record-modal__surface {
  width: min(1150px, 92vw);
  height: 78vh;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
}

.pr-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pr-list {
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--el-border-color);
}

.pr-detail {
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    gap: 8px;
  }
}

.pr-card {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--el-bg-color-alt);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  }

  &.is-selected {
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  }
}

.pr-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pr-card__idx {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
}

.pr-card__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.pr-card__depth {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding: 1px 5px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.pr-card__url {
  font-size: 12px;
  color: var(--el-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.pr-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pr-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  color: var(--el-text-color-secondary);
  max-width: 100%;
  overflow: hidden;
}

.pr-tag__key {
  font-weight: 600;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.pr-tag__val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pr-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-bg);
  color: var(--el-text-color-placeholder);

  input {
    width: 150px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    font-size: 12px;
    outline: none;
    &::placeholder { color: var(--el-text-color-placeholder); }
  }
}

.pr-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.pr-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.pr-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  button {
    width: 26px;
    height: 26px;
    border: 1px solid var(--el-border-color);
    border-radius: 5px;
    background: transparent;
    color: var(--el-text-color-primary);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
      color: var(--el-color-primary);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
}

.pr-detail__section {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &--grow {
    flex: 1;
    min-height: 0;
  }
}

.pr-detail__url {
  font-size: 12px;
  color: var(--el-color-primary);
  word-break: break-all;
  line-height: 1.5;
}

.pr-detail__time {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.pr-detail__json {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, var(--el-bg-color));
  border: 1px solid var(--el-border-color);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  overflow: auto;
  max-height: 100%;
  white-space: pre;

  code { font-family: inherit; }
}

// ── Responsive ──────────────────────────────
@media (max-width: 980px) {
  .record-modal__body {
    grid-template-columns: 1fr;
  }

  .record-list {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color);
  }

  .pool-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .spider-manage__content { padding: 16px; }
  .spider-manage__header { flex-direction: column; align-items: flex-start; }
  .spider-manage__actions { width: 100%; flex-wrap: wrap; }
  .spider-manage__search input { width: 100px; }
  .spider-manage__grid { grid-template-columns: 1fr; }
  .dialog__grid, .dialog__switches { grid-template-columns: 1fr; }
}
</style>
