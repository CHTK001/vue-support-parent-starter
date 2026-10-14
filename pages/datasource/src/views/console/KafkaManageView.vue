<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Coin" :size="18" class="dsm-title-icon dsm-kafka-icon" />
        <span class="dsm-title">Kafka 消息队列管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton
          layout="square"
          tip="能力声明"
          icon="Setting"
          data-testid="kafka-btn-capability"
          :loading="capabilityLoading"
          @click="loadCapability"
        />
        <ReButton
          layout="square"
          tip="测试连接"
          icon="Connection"
          data-testid="kafka-btn-test"
          :disabled="!source"
          :loading="testing"
          @click="testConnection"
        />
        <ReButton
          layout="square"
          tip="刷新"
          icon="Refresh"
          data-testid="kafka-btn-refresh"
          :loading="loading"
          @click="refresh"
        />
        <ReButton
          layout="square"
          type="primary"
          tip="只读查询"
          icon="Search"
          data-testid="kafka-btn-query"
          :disabled="!source"
          @click="activeTab = 'query'"
        />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div v-if="!gap" class="dsm-body">
      <div class="dsm-content">
        <div class="dsm-info-card re-surface">
          <div class="dsm-info-row">
            <span class="dsm-info-label">数据源</span>
            <span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 9092}` : "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">能力</span>
            <span class="dsm-info-value">{{ capabilityText }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">集群 ID</span>
            <span class="dsm-info-value mono">{{ testResult.version || "未测试" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接详情</span>
            <span class="dsm-info-value">{{ testResult.detail || "未测试" }}</span>
          </div>
        </div>

        <div class="dsm-tabs">
          <button
            type="button"
            class="dsm-tab"
            :class="{ active: activeTab === 'topics' }"
            data-testid="kafka-tab-topics"
            @click="activeTab = 'topics'"
          >
            <ReIcon name="Collection" size="12" />
            <span>主题列表</span>
          </button>
          <button
            type="button"
            class="dsm-tab"
            :class="{ active: activeTab === 'query' }"
            data-testid="kafka-tab-query"
            @click="activeTab = 'query'"
          >
            <ReIcon name="Search" size="12" />
            <span>只读查询</span>
          </button>
        </div>

        <div v-if="activeTab === 'topics'" class="dsm-section">
          <div class="dsm-section-title">
            {{ topNodeLabel }}（{{ topics.length }}）
            <div class="dsm-section-actions">
              <ReButton text @click="loadTopics">
                <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
              </ReButton>
            </div>
          </div>
          <ReTable
            :data="topics"
            :columns="topicColumns"
            :loading="loading"
            :pagination="false"
            stripe
            border
            height="320px"
            @row-click="selectTopic"
          >
            <template #col-label="{ row }">
              <span class="mono">{{ (row as KafkaTreeNode).label }}</span>
            </template>
            <template #col-actions="{ row }">
              <ReButton text type="primary" @click="selectTopic(row)">
                <template #icon><ReIcon name="FolderOpened" size="12" /></template>分区
              </ReButton>
            </template>
          </ReTable>
          <ReEmpty v-if="!loading && topics.length === 0" description="未读取到 Topic，可先执行只读查询 topics" />
        </div>

        <div v-if="activeTab === 'topics' && activeTopic" class="dsm-section">
          <div class="dsm-section-title">
            {{ childNodeLabel }} - {{ activeTopic }}
            <div class="dsm-section-actions">
              <ReButton text @click="loadChildren(activeTopic)">
                <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
              </ReButton>
            </div>
          </div>
          <ReTable
            :data="children"
            :columns="childColumns"
            :loading="loading"
            :pagination="false"
            stripe
            border
            height="240px"
          />
        </div>

        <div v-if="activeTab === 'query'" class="dsm-query-area">
          <div class="dsm-query-toolbar">
            <ReInput
              v-model="queryExpression"
              :placeholder="queryPlaceholder"
              class="dsm-query-input"
              data-testid="kafka-query-expression"
              @keyup.enter="executeQuery"
            />
            <ReButton
              type="primary"
              :loading="queryLoading"
              data-testid="kafka-btn-execute"
              @click="executeQuery"
            >
              <template #icon><ReIcon name="VideoPlay" size="12" /></template>执行
            </ReButton>
          </div>
          <ReAlert v-if="capability?.queryDescription" type="info" :closable="false" :title="capability.queryDescription" class="dsm-query-hint" />
          <div class="dsm-query-result">
            <div class="dsm-query-header">
              查询结果
              <span v-if="queryResult" class="dsm-query-meta">
                {{ queryResult.rowCount }} 行 · {{ queryResult.executionTimeMs }} ms
                <span v-if="queryResult.truncated" class="dsm-query-warn">
                  已截断，服务端共 {{ queryResult.totalRows }} 行，请加 limit 或收窄条件
                </span>
              </span>
            </div>
            <ReTable
              v-if="queryResult && queryResult.columns.length > 0"
              :data="queryResult.rows"
              :columns="queryColumns"
              stripe
              border
              :layout-table="{ height: '360px' }"
            />
            <ReEmpty v-else :description="queryEmptyText" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Kafka 管理页
 *
 * <p>只消费宿主通用中间件 SPI 契约（/ms/monitor/middleware/**），不在前端写死
 * 旧版 Kafka 专属接口。Kafka 能力包未安装时后端返回「功能未开放」，页面展示原因；
 * 已安装但当前环境没有真实 Broker 时，能力声明与优雅失败仍可验收。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { ReAlert } from "@repo/ui/re-kit";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReTable from "@repo/ui/re-table";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  fetchKafkaCapability,
  fetchKafkaChildren,
  fetchKafkaTopNodes,
  queryKafka,
  testKafkaConnection,
  type KafkaCapability,
  type KafkaQueryResult,
  type KafkaTreeNode,
} from "../../api/kafkaManageApi";

defineOptions({ name: "KafkaManageView" });

const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();

const capability = ref<KafkaCapability | null>(null);
const capabilityLoading = ref(false);
const topics = ref<KafkaTreeNode[]>([]);
const children = ref<KafkaTreeNode[]>([]);
const activeTopic = ref("");
const loading = ref(false);
const testing = ref(false);
const queryLoading = ref(false);
const activeTab = ref<"topics" | "query">("topics");
const queryExpression = ref("topics");
const queryResult = ref<KafkaQueryResult | null>(null);
const testResult = ref<{ version: string; detail: string }>({ version: "", detail: "" });

const topNodeLabel = computed(() => capability.value?.topNodeLabel || "主题");
const childNodeLabel = computed(() => capability.value?.childNodeLabel || "分区");
const queryPlaceholder = computed(
  () => capability.value?.queryHint || "输入查询：topics / brokers / groups / describe <topic> / preview <topic>",
);

const capabilityText = computed(() => {
  const c = capability.value;
  if (!c) return "未加载";
  const parts: string[] = [];
  if (c.topNodeSupported) parts.push("主题浏览");
  if (c.childNodeSupported) parts.push("分区浏览");
  if (c.querySupported) parts.push("只读查询");
  if (c.documentSupported) parts.push("消息详情");
  return parts.join(" / ");
});

const topicColumns = [
  { prop: "label", label: "主题", minWidth: 220, slot: "col-label" },
  { prop: "comment", label: "说明", minWidth: 120 },
  { prop: "estimatedCount", label: "条目数", width: 100 },
  { prop: "actions", label: "操作", width: 110, fixed: "right" as const, slot: "col-actions" },
];

const childColumns = [
  { prop: "label", label: "分区", minWidth: 180 },
  { prop: "key", label: "节点标识", minWidth: 220 },
  { prop: "comment", label: "说明", minWidth: 180 },
];

const queryColumns = computed(() =>
  (queryResult.value?.columns || []).map(c => ({ prop: c, label: c, minWidth: 140 })),
);

const queryEmptyText = computed(() =>
  queryResult.value?.message
    ? `查询未返回数据：${queryResult.value.message}`
    : "执行查询后显示结果",
);

function showError(error: unknown, api: string) {
  const msg = String((error as Error)?.message ?? error ?? "");
  if (/功能未开放/.test(msg)) {
    gap.value = msg;
    return;
  }
  if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
    gap.value = `后端未提供 ${api}（HTTP 404），本页无真实数据可显示`;
    return;
  }
  gap.value = `调用 ${api} 失败：${msg || "未知错误"}`;
}

async function loadCapability() {
  capabilityLoading.value = true;
  try {
    capability.value = await fetchKafkaCapability();
    if (source.value && !gap.value) ready();
  } catch (e) {
    showError(e, "/ms/monitor/middleware/capability");
  } finally {
    capabilityLoading.value = false;
  }
}

async function loadTopics() {
  if (!datasourceId.value) return;
  loading.value = true;
  try {
    topics.value = (await fetchKafkaTopNodes(datasourceId.value)) || [];
    if (source.value && !gap.value) ready();
  } catch (e) {
    showError(e, "/ms/monitor/middleware/nodes");
  } finally {
    loading.value = false;
  }
}

async function loadChildren(topic: string) {
  if (!datasourceId.value) return;
  loading.value = true;
  try {
    children.value = (await fetchKafkaChildren(topic, datasourceId.value)) || [];
  } catch (e) {
    showError(e, "/ms/monitor/middleware/children");
  } finally {
    loading.value = false;
  }
}

function selectTopic(row: KafkaTreeNode) {
  activeTopic.value = row.key;
  loadChildren(row.key);
}

async function testConnection() {
  if (!datasourceId.value) return;
  testing.value = true;
  try {
    const res = await testKafkaConnection(datasourceId.value);
    testResult.value = { version: res.version, detail: res.detail };
    if (res.connected) {
      message.success(`Kafka 连接正常${res.detail ? `：${res.detail}` : ""}`);
    } else {
      message.error(`Kafka 连接失败：${res.message}`);
    }
  } catch (e) {
    showError(e, "/ms/monitor/middleware/test");
  } finally {
    testing.value = false;
  }
}

async function executeQuery() {
  const expression = queryExpression.value.trim();
  if (!expression) {
    message.warning("请输入查询表达式");
    return;
  }
  if (!datasourceId.value) return;
  queryLoading.value = true;
  try {
    const res = await queryKafka(expression, datasourceId.value);
    queryResult.value = res;
    if (res.message) message.error(res.message);
    else if (source.value && !gap.value) ready();
  } catch (e) {
    showError(e, "/ms/monitor/middleware/query");
  } finally {
    queryLoading.value = false;
  }
}

async function refresh() {
  await loadCapability();
  await loadTopics();
  if (activeTopic.value) await loadChildren(activeTopic.value);
}

onMounted(async () => {
  await bind("kafka");
  await loadCapability();
  if (datasourceId.value) {
    await loadTopics();
  }
});
</script>

<style scoped lang="scss">
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dsm-toolbar-left,
.dsm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.dsm-kafka-icon {
  color: #333;
}

.dsm-body {
  display: flex;
  flex: 1;
  gap: 6px;
  overflow: hidden;
}

.dsm-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  overflow: auto;
}

.dsm-info-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 20px;
  padding: 14px 16px;
}

.dsm-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsm-info-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-info-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.dsm-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.dsm-tab.active {
  color: var(--brand-600);
  border-bottom-color: var(--brand-500);
  font-weight: 600;
}

.dsm-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsm-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-section-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dsm-query-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-query-input {
  flex: 1;
  max-width: 760px;
}

.dsm-query-hint {
  margin: 0;
}

.dsm-query-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsm-query-header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 24px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-query-meta {
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-query-warn {
  color: var(--status-warning);
}
</style>