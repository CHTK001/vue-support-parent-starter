<template>
  <section class="kafka-workspace">
    <ScLayout
      v-model="railTabValue"
      class="kafka-layout"
      left-enabled
      :left-width="260"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <template #left>
        <div class="left-panel">
          <div class="left-header">
            <strong>{{ selectedTabTitle }}</strong>
          </div>
          <div class="left-hint">Cluster: {{ clusterId }}</div>
          <div class="left-hint">Brokers: {{ brokerCount }}</div>
        </div>
      </template>

      <template #default>
        <div class="main-content">
          <!-- Overview -->
          <template v-if="railTabValue === 'overview'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">集群概览</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="healthLoading" @click="loadHealth" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="healthLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else>
                  <div class="info-grid">
                    <div class="info-card">
                      <span class="info-card__label">Cluster ID</span>
                      <span class="info-card__value">{{ health.clusterId || '-' }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">Broker 数</span>
                      <span class="info-card__value">{{ health.brokerCount ?? '-' }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">Controller</span>
                      <span class="info-card__value">{{ health.controller || '-' }}</span>
                    </div>
                  </div>
                  <div class="section-title">Broker 列表</div>
                  <table v-if="brokers.length" class="data-table">
                    <thead>
                      <tr><th>ID</th><th>Host</th><th>Port</th><th>Rack</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="b in brokers" :key="b.id">
                        <td>{{ b.id }}</td>
                        <td>{{ b.host }}</td>
                        <td>{{ b.port }}</td>
                        <td>{{ b.rack || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- Topics -->
          <template v-else-if="railTabValue === 'topics'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">Topic 列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" :icon="Plus" @click="showCreateTopic = true">创建</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="topicsLoading" @click="loadTopics" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="topicsLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!topics.length" class="panel-empty"><ElEmpty description="暂无 Topic" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>名称</th><th>分区数</th><th>副本数</th><th>内部</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in topics" :key="t.name">
                      <td><a class="topic-link" @click="viewTopicDetail(t.name)">{{ t.name }}</a></td>
                      <td>{{ t.partitions }}</td>
                      <td>{{ t.replicationFactor }}</td>
                      <td>{{ t.internal ? '是' : '否' }}</td>
                      <td>
                        <ElButton size="small" :icon="Delete" @click="handleDeleteTopic(t.name)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- Consumer Groups -->
          <template v-else-if="railTabValue === 'groups'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">消费者组</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="groupsLoading" @click="loadConsumerGroups" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="groupsLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!consumerGroups.length" class="panel-empty"><ElEmpty description="暂无消费者组" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>Group ID</th><th>Simple</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="g in consumerGroups" :key="g.groupId">
                      <td>{{ g.groupId }}</td>
                      <td>{{ g.simple ? '是' : '否' }}</td>
                      <td>
                        <ElButton size="small" @click="viewGroupDetail(g.groupId)">详情</ElButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- Messages -->
          <template v-else-if="railTabValue === 'messages'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">消息消费</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="messagesLoading" @click="loadMessages" />
              </div>
              <div class="message-filters">
                <div class="filter-row">
                  <label>Topic：</label>
                  <ElSelect v-model="messageTopic" filterable placeholder="选择 Topic" style="width: 200px">
                    <ElOption v-for="t in topics" :key="t.name" :label="t.name" :value="t.name" />
                  </ElSelect>
                  <label>分区：</label>
                  <ElInputNumber v-model="messagePartition" :min="-1" :controls="false" style="width: 80px" />
                  <label>Offset：</label>
                  <ElInputNumber v-model="messageOffset" :min="-1" :controls="false" style="width: 80px" />
                  <label>条数：</label>
                  <ElInputNumber v-model="messageLimit" :min="1" :max="500" :controls="false" style="width: 80px" />
                  <ElButton type="primary" size="small" @click="loadMessages">查询</ElButton>
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="messagesLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!messages.length" class="panel-empty"><ElEmpty description="无消息" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>分区</th><th>Offset</th><th>时间戳</th><th>Key</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="msg in messages" :key="`${msg.partition}-${msg.offset}`">
                      <td>{{ msg.partition }}</td>
                      <td class="cell-mono">{{ msg.offset }}</td>
                      <td>{{ formatTimestamp(msg.timestamp) }}</td>
                      <td class="cell-mono">{{ msg.key || '(null)' }}</td>
                      <td class="cell-value">{{ msg.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- Topic Detail Dialog -->
          <ElDialog v-model="topicDetailVisible" title="Topic 详情" width="700px">
            <div v-if="topicDetail" class="detail-body">
              <div class="detail-field"><label>名称</label><span>{{ topicDetail.name }}</span></div>
              <div class="detail-field"><label>Internal</label><span>{{ topicDetail.internal ? '是' : '否' }}</span></div>
              <div class="section-title">分区详情</div>
              <table class="data-table">
                <thead><tr><th>分区</th><th>Leader</th><th>Replicas</th><th>ISR</th></tr></thead>
                <tbody>
                  <tr v-for="p in topicDetail.partitions" :key="p.partition">
                    <td>{{ p.partition }}</td>
                    <td>{{ p.leader }}</td>
                    <td class="cell-mono">{{ (p.replicas || []).join(', ') }}</td>
                    <td class="cell-mono">{{ (p.isr || []).join(', ') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <template #footer><ElButton @click="topicDetailVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Create Topic Dialog -->
          <ElDialog v-model="showCreateTopic" title="创建 Topic" width="450px">
            <div class="dialog-form">
              <label>Topic 名称（必填）</label>
              <ElInput v-model="newTopicName" placeholder="topic-name" />
              <label>分区数</label>
              <ElInputNumber v-model="newTopicPartitions" :min="1" :controls="false" style="width: 100%" />
              <label>副本数</label>
              <ElInputNumber v-model="newTopicReplication" :min="1" :controls="false" style="width: 100%" />
            </div>
            <template #footer>
              <ElButton @click="showCreateTopic = false">取消</ElButton>
              <ElButton type="primary" :loading="creatingTopic" @click="handleCreateTopic">创建</ElButton>
            </template>
          </ElDialog>

          <!-- Group Detail Dialog -->
          <ElDialog v-model="groupDetailVisible" title="消费者组详情" width="650px">
            <div v-if="groupDetail" class="detail-body">
              <div class="detail-field"><label>Group ID</label><span>{{ groupDetail.groupId }}</span></div>
              <div class="detail-field"><label>State</label><span>{{ groupDetail.state }}</span></div>
              <div class="section-title">分区偏移</div>
              <table class="data-table">
                <thead><tr><th>Topic</th><th>分区</th><th>Current Offset</th></tr></thead>
                <tbody>
                  <tr v-for="p in groupDetail.partitions" :key="`${p.topic}-${p.partition}`">
                    <td>{{ p.topic }}</td>
                    <td>{{ p.partition }}</td>
                    <td class="cell-mono">{{ p.currentOffset }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <template #footer><ElButton @click="groupDetailVisible = false">关闭</ElButton></template>
          </ElDialog>
        </div>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import {
  Delete,
  Loading,
  Plus,
  RefreshRight,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElScrollbar,
  ElSelect,
} from "element-plus";
import { computed, markRaw, onMounted, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchKafkaClusterHealth,
  listKafkaBrokers,
  listKafkaTopics,
  createKafkaTopic,
  deleteKafkaTopic,
  fetchKafkaTopicDetail,
  listKafkaConsumerGroups,
  fetchKafkaConsumerGroupDetail,
  consumeKafkaMessages,
} from "../../api/kafka";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "overview", title: "概览", icon: markRaw(RefreshRight) },
  { name: "topics", title: "Topics", icon: markRaw(RefreshRight) },
  { name: "groups", title: "Groups", icon: markRaw(RefreshRight) },
  { name: "messages", title: "消息", icon: markRaw(RefreshRight) },
];
const railTabValue = ref("overview");

const selectedTabTitle = computed(() => {
  const tab = railTabs.find((t) => t.name === railTabValue.value);
  return tab?.title || "Kafka";
});

// Health
const health = ref<Record<string, any>>({});
const brokers = ref<any[]>([]);
const clusterId = ref("");
const brokerCount = ref(0);
const healthLoading = ref(false);

const loadHealth = async () => {
  healthLoading.value = true;
  try {
    const [hRes, bRes] = await Promise.all([
      fetchKafkaClusterHealth(props.connectionId),
      listKafkaBrokers(props.connectionId),
    ]);
    health.value = hRes?.data || {};
    brokers.value = bRes?.data || [];
    clusterId.value = health.value.clusterId || "";
    brokerCount.value = health.value.brokerCount ?? brokers.value.length;
  } catch {
    ElMessage.error("加载集群信息失败");
  } finally {
    healthLoading.value = false;
  }
};

// Topics
const topics = ref<any[]>([]);
const topicsLoading = ref(false);

const loadTopics = async () => {
  topicsLoading.value = true;
  try {
    const res = await listKafkaTopics(props.connectionId);
    topics.value = res?.data || [];
  } catch {
    ElMessage.error("加载 Topic 列表失败");
  } finally {
    topicsLoading.value = false;
  }
};

// Create Topic
const showCreateTopic = ref(false);
const creatingTopic = ref(false);
const newTopicName = ref("");
const newTopicPartitions = ref(1);
const newTopicReplication = ref(1);

const handleCreateTopic = async () => {
  if (!newTopicName.value.trim()) {
    ElMessage.warning("请输入 Topic 名称");
    return;
  }
  creatingTopic.value = true;
  try {
    await createKafkaTopic(props.connectionId, newTopicName.value.trim(), newTopicPartitions.value, newTopicReplication.value);
    ElMessage.success("Topic 已创建");
    showCreateTopic.value = false;
    newTopicName.value = "";
    await loadTopics();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || "创建 Topic 失败");
  } finally {
    creatingTopic.value = false;
  }
};

const handleDeleteTopic = async (name: string) => {
  try {
    await deleteKafkaTopic(props.connectionId, name);
    ElMessage.success("Topic 已删除");
    await loadTopics();
  } catch { ElMessage.error("删除 Topic 失败"); }
};

// Topic Detail
const topicDetailVisible = ref(false);
const topicDetail = ref<any>(null);

const viewTopicDetail = async (name: string) => {
  try {
    const res = await fetchKafkaTopicDetail(props.connectionId, name);
    topicDetail.value = res?.data || null;
    topicDetailVisible.value = true;
  } catch { ElMessage.error("加载 Topic 详情失败"); }
};

// Consumer Groups
const consumerGroups = ref<any[]>([]);
const groupsLoading = ref(false);

const loadConsumerGroups = async () => {
  groupsLoading.value = true;
  try {
    const res = await listKafkaConsumerGroups(props.connectionId);
    consumerGroups.value = res?.data || [];
  } catch {
    ElMessage.error("加载消费者组列表失败");
  } finally {
    groupsLoading.value = false;
  }
};

// Group Detail
const groupDetailVisible = ref(false);
const groupDetail = ref<any>(null);

const viewGroupDetail = async (groupId: string) => {
  try {
    const res = await fetchKafkaConsumerGroupDetail(props.connectionId, groupId);
    groupDetail.value = res?.data || null;
    groupDetailVisible.value = true;
  } catch { ElMessage.error("加载消费者组详情失败"); }
};

// Messages
const messageTopic = ref("");
const messagePartition = ref(-1);
const messageOffset = ref(-1);
const messageLimit = ref(50);
const messages = ref<any[]>([]);
const messagesLoading = ref(false);

const loadMessages = async () => {
  if (!messageTopic.value) {
    ElMessage.warning("请选择 Topic");
    return;
  }
  messagesLoading.value = true;
  try {
    const res = await consumeKafkaMessages(props.connectionId, messageTopic.value, messagePartition.value, messageOffset.value, messageLimit.value);
    messages.value = res?.data || [];
  } catch {
    ElMessage.error("消费消息失败");
  } finally {
    messagesLoading.value = false;
  }
};

const formatTimestamp = (ts: number) => {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("zh-CN");
};

onMounted(() => {
  loadHealth();
  loadTopics();
  loadConsumerGroups();
});
</script>

<style scoped lang="scss">
.kafka-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.kafka-layout { height: 100%; }
.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: #f8fafc;
}
.left-header { font-size: 14px; color: #0f2534; margin-bottom: 4px; }
.left-hint { font-size: 12px; color: #9aacb8; }
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.panel-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(127, 144, 155, 0.12);
  background: rgba(248, 250, 252, 0.9);
}
.panel-header__right { display: flex; align-items: center; gap: 8px; }
.panel-title { font-size: 15px; font-weight: 700; color: #0f2534; }
.panel-scroll { flex: 1; min-height: 0; }
.panel-loading, .panel-empty { display: flex; align-items: center; justify-content: center; padding: 48px; }
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
}
.info-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 14px;
  background: #fff;
}
.info-card__label { font-size: 11px; color: #7a8f9d; }
.info-card__value { font-size: 16px; font-weight: 700; color: #0f2534; line-height: 1; }
.section-title {
  padding: 12px 16px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0f2534;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th {
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #7a8f9d;
    background: rgba(248, 250, 252, 0.9);
    border-bottom: 1px solid rgba(127, 144, 155, 0.12);
    white-space: nowrap;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(127, 144, 155, 0.08);
    color: #1e3a4f;
  }
  tr:hover td { background: rgba(59, 130, 246, 0.04); }
}
.cell-mono { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #4a6070; }
.cell-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: #4a6070;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topic-link { color: #3b82f6; cursor: pointer; text-decoration: none; &:hover { text-decoration: underline; } }
.message-filters {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(127, 144, 155, 0.1);
  background: rgba(248, 250, 252, 0.8);
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  label { font-size: 12px; color: #7a8f9d; white-space: nowrap; }
}
.dialog-form {
  display: grid;
  gap: 12px;
  label { font-size: 12px; color: #60798a; }
}
.detail-body { display: grid; gap: 12px; }
.detail-field {
  display: flex;
  gap: 8px;
  label { font-size: 12px; color: #7a8f9d; font-weight: 600; min-width: 80px; }
  span { font-size: 13px; color: #1e3a4f; }
}
</style>
