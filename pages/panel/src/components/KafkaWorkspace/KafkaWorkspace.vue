<template>
  <section class="kafka-workspace">
    <ScLayout
      v-model="railTabValue"
      class="kafka-layout"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="52"
    >
      <template #default>
        <div class="main-content">
          <!-- Overview -->
          <template v-if="railTabValue === 'overview'">
            <div class="kv">
              <div class="kv-header">
                <div class="kv-hleft">
                  <span class="kv-title">集群概览</span>
                  <ElTag size="small" class="kv-badge">{{ clusterId || '...' }}</ElTag>
                  <ElTag size="small" class="kv-badge" type="info">{{ brokerCount }} Brokers</ElTag>
                </div>
                <ElButton :icon="RefreshRight" circle size="small" :loading="healthLoading" @click="loadHealth" />
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="healthLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else>
                  <div class="stats-row">
                    <div class="stat-card">
                      <span class="stat-label">Cluster ID</span>
                      <span class="stat-value mono">{{ health.clusterId || '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">Broker 数</span>
                      <span class="stat-value">{{ health.brokerCount ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">Controller</span>
                      <span class="stat-value mono">{{ health.controller || '-' }}</span>
                    </div>
                  </div>
                  <div class="kv-section">
                    <div class="kv-stitle">Broker 列表</div>
                    <table class="ktable">
                      <thead><tr><th>ID</th><th>Host</th><th>Port</th><th>Rack</th></tr></thead>
                      <tbody>
                        <tr v-for="b in brokers" :key="b.id">
                          <td><ElTag size="small" class="id-tag">{{ b.id }}</ElTag></td>
                          <td class="mono">{{ b.host }}</td>
                          <td class="mono">{{ b.port }}</td>
                          <td>{{ b.rack || '-' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- Topics -->
          <template v-else-if="railTabValue === 'topics'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">Topic 列表</span>
                <div class="kv-hright">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateTopic = true">创建</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="topicsLoading" @click="loadTopics" />
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="topicsLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!topics.length" class="kv-empty"><ElEmpty description="暂无 Topic" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>名称</th><th>分区</th><th>副本</th><th>内部</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="t in topics" :key="t.name">
                      <td><a class="topic-link" @click="viewTopicDetail(t.name)">{{ t.name }}</a></td>
                      <td>{{ t.partitions }}</td>
                      <td>{{ t.replicationFactor }}</td>
                      <td>{{ t.internal ? '是' : '否' }}</td>
                      <td><ElButton size="small" :icon="Delete" text @click="handleDeleteTopic(t.name)" /></td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- Groups -->
          <template v-else-if="railTabValue === 'groups'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">消费者组</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="groupsLoading" @click="loadConsumerGroups" />
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="groupsLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!consumerGroups.length" class="kv-empty"><ElEmpty description="暂无消费者组" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>Group ID</th><th>Simple</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="g in consumerGroups" :key="g.groupId">
                      <td class="mono">{{ g.groupId }}</td>
                      <td>{{ g.simple ? '是' : '否' }}</td>
                      <td><ElButton size="small" type="primary" text @click="viewGroupDetail(g.groupId)">详情</ElButton></td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- Messages -->
          <template v-else-if="railTabValue === 'messages'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">消息消费</span>
                <div class="kv-hright">
                  <ElButton size="small" :icon="Plus" @click="openProduceMessage">发送</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="messagesLoading" @click="loadMessages" />
                </div>
              </div>
              <div class="msg-filters">
                <div class="msg-frow">
                  <ElSelect v-model="messageTopic" filterable placeholder="选择 Topic" class="msg-sel" @change="onMessageTopicChange">
                    <ElOption v-for="t in topics" :key="t.name" :label="t.name" :value="t.name" />
                  </ElSelect>
                  <div class="msg-fgroup">
                    <span class="msg-flabel">分区</span>
                    <ElInputNumber v-model="messagePartition" :min="-1" :controls="false" class="msg-inum" />
                  </div>
                  <div class="msg-fgroup">
                    <span class="msg-flabel">Offset</span>
                    <ElInputNumber v-model="messageOffset" :min="-1" :controls="false" class="msg-inum" />
                  </div>
                  <div class="msg-fgroup">
                    <span class="msg-flabel">条数</span>
                    <ElInputNumber v-model="messageLimit" :min="1" :max="500" :controls="false" class="msg-inum" />
                  </div>
                  <ElButton type="primary" size="small" @click="loadMessages">查询</ElButton>
                </div>
                <div v-if="msgTopicOffsets.length" class="msg-offsets">
                  <span class="msg-ototal">总计 <em>{{ msgTopicTotalCount }}</em> 条</span>
                  <ElTag v-for="op in msgTopicOffsets" :key="op.partition" size="small" class="msg-ochip">P{{ op.partition }}: {{ op.count }}</ElTag>
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="messagesLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!messages.length" class="kv-empty"><ElEmpty description="无消息" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>分区</th><th>Offset</th><th>时间</th><th>Key</th><th>Value</th></tr></thead>
                  <tbody>
                    <tr v-for="msg in messages" :key="`${msg.partition}-${msg.offset}`">
                      <td><ElTag size="small" class="id-tag">{{ msg.partition }}</ElTag></td>
                      <td class="mono">{{ msg.offset }}</td>
                      <td class="mono ts">{{ formatTimestamp(msg.timestamp) }}</td>
                      <td class="mono key">{{ msg.key || '(null)' }}</td>
                      <td class="val">
                        <span v-if="isJson(msg.value)" class="json">{{ formatJson(msg.value) }}</span>
                        <span v-else class="raw">{{ msg.value }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ============ Dialogs ============ -->

          <!-- Topic Detail Dialog -->
          <ElDialog v-model="topicDetailVisible" :title="`${topicDetail?.name || ''}`" class="kafka-dlg" width="75%" top="3vh">
            <div v-if="topicDetail" class="dlg-body">
              <div class="dlg-meta">
                <div class="dlg-mitem"><span class="dlg-ml">分区数</span><span class="dlg-mv">{{ topicDetail.partitions?.length || 0 }}</span></div>
                <div class="dlg-mitem"><span class="dlg-ml">消息总量</span><ElTag type="primary" effect="dark">{{ topicOffsets.reduce((s: number, p: any) => s + (p.count || 0), 0) }}</ElTag></div>
                <div class="dlg-mitem"><span class="dlg-ml">Internal</span><span class="dlg-mv">{{ topicDetail.internal ? '是' : '否' }}</span></div>
              </div>
              <div class="kv-stitle">分区 Offset</div>
              <table class="ktable mini">
                <thead><tr><th>分区</th><th>Leader</th><th>Replicas</th><th>ISR</th><th>Earliest</th><th>Latest</th><th>Count</th></tr></thead>
                <tbody>
                  <tr v-for="(p, idx) in topicDetail.partitions" :key="p.partition">
                    <td><ElTag size="small" class="id-tag">{{ p.partition }}</ElTag></td>
                    <td>{{ p.leader }}</td>
                    <td class="mono">{{ (p.replicas || []).join(', ') }}</td>
                    <td class="mono">{{ (p.isr || []).join(', ') }}</td>
                    <td class="mono">{{ topicOffsets[idx]?.beginningOffset ?? '-' }}</td>
                    <td class="mono">{{ topicOffsets[idx]?.endOffset ?? '-' }}</td>
                    <td><ElTag size="small">{{ topicOffsets[idx]?.count ?? '-' }}</ElTag></td>
                  </tr>
                </tbody>
              </table>
              <div class="kv-stitle" style="margin-top:4px;">队列数据</div>
              <div class="dlg-tbar">
                <span class="dlg-thint">Topic 中的实际业务消息</span>
                <ElButton size="small" :icon="RefreshRight" :loading="topicMsgLoading" @click="loadTopicMessages(topicDetail.name)">刷新</ElButton>
              </div>
              <div v-if="topicMsgLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
              <table v-else-if="topicMessages.length" class="ktable mini">
                <thead><tr><th>分区</th><th>Offset</th><th>时间</th><th>Key</th><th>业务数据</th></tr></thead>
                <tbody>
                  <tr v-for="msg in topicMessages" :key="`${msg.partition}-${msg.offset}`">
                    <td><ElTag size="small" class="id-tag">{{ msg.partition }}</ElTag></td>
                    <td class="mono">{{ msg.offset }}</td>
                    <td class="mono ts">{{ formatTimestamp(msg.timestamp) }}</td>
                    <td class="mono" style="color:#fbbf24;">{{ msg.key || '(null)' }}</td>
                    <td class="val">
                      <span v-if="isJson(msg.value)" class="json">{{ formatJson(msg.value) }}</span>
                      <span v-else class="raw">{{ msg.value }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="kv-empty"><ElEmpty description="暂无数据" :image-size="48" /></div>
            </div>
            <template #footer><ElButton @click="topicDetailVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Create Topic Dialog -->
          <ElDialog v-model="showCreateTopic" title="创建 Topic" class="kafka-dlg" width="420px">
            <div class="dlg-form">
              <label>Topic 名称</label>
              <ElInput v-model="newTopicName" placeholder="topic-name" />
              <label>分区数</label>
              <ElInputNumber v-model="newTopicPartitions" :min="1" :controls="false" style="width:100%" />
              <label>副本数</label>
              <ElInputNumber v-model="newTopicReplication" :min="1" :controls="false" style="width:100%" />
            </div>
            <template #footer>
              <ElButton @click="showCreateTopic = false">取消</ElButton>
              <ElButton type="primary" :loading="creatingTopic" @click="handleCreateTopic">创建</ElButton>
            </template>
          </ElDialog>

          <!-- Group Detail Dialog -->
          <ElDialog v-model="groupDetailVisible" title="消费者组详情" class="kafka-dlg" width="780px">
            <div v-if="groupDetail" class="dlg-body">
              <div class="dlg-meta">
                <div class="dlg-mitem"><span class="dlg-ml">Group ID</span><span class="dlg-mv mono">{{ groupDetail.groupId }}</span></div>
                <div class="dlg-mitem"><span class="dlg-ml">State</span><ElTag :type="groupDetail.state === 'STABLE' ? 'success' : 'warning'" effect="dark">{{ groupDetail.state }}</ElTag></div>
              </div>
              <div class="kv-stitle">分区偏移</div>
              <table class="ktable mini">
                <thead><tr><th>Topic</th><th>分区</th><th>Current</th><th>End</th><th>Lag</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="p in groupDetail.partitions" :key="`${p.topic}-${p.partition}`">
                    <td><a class="topic-link" @click="viewTopicDetail(p.topic)">{{ p.topic }}</a></td>
                    <td><ElTag size="small" class="id-tag">{{ p.partition }}</ElTag></td>
                    <td class="mono">{{ p.currentOffset }}</td>
                    <td class="mono">{{ p.endOffset ?? '-' }}</td>
                    <td><ElTag v-if="p.lag != null" :type="p.lag > 100 ? 'danger' : p.lag > 0 ? 'warning' : 'success'" size="small">{{ p.lag }}</ElTag><span v-else>-</span></td>
                    <td><ElButton size="small" text @click="openResetOffset(groupDetail.groupId, p.topic)">重置</ElButton></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <template #footer><ElButton @click="groupDetailVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Reset Offset Dialog -->
          <ElDialog v-model="resetOffsetVisible" title="重置 Offset" class="kafka-dlg" width="380px">
            <div class="dlg-body">
              <div class="dlg-meta">
                <div class="dlg-mitem"><span class="dlg-ml">Group</span><span class="dlg-mv mono">{{ resetOffsetGroup }}</span></div>
                <div class="dlg-mitem"><span class="dlg-ml">Topic</span><span class="dlg-mv">{{ resetOffsetTopic }}</span></div>
              </div>
              <div class="kv-stitle">策略</div>
              <ElRadioGroup v-model="resetOffsetStrategy">
                <ElRadio value="earliest">重置到最早</ElRadio>
                <ElRadio value="latest">重置到最新</ElRadio>
              </ElRadioGroup>
            </div>
            <template #footer>
              <ElButton @click="resetOffsetVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="resetOffsetLoading" @click="handleResetOffset">确认重置</ElButton>
            </template>
          </ElDialog>

          <!-- Send Message Dialog -->
          <ElDialog v-model="showProduceMessage" title="发送消息" class="kafka-dlg" width="460px">
            <div class="dlg-form">
              <label>Topic</label>
              <ElSelect v-model="produceTopic" filterable style="width:100%">
                <ElOption v-for="t in topics" :key="t.name" :label="t.name" :value="t.name" />
              </ElSelect>
              <label>Key（可选）</label>
              <ElInput v-model="produceKey" placeholder="消息 key" />
              <label>Value</label>
              <ElInput v-model="produceValue" type="textarea" :rows="4" placeholder="消息内容" />
            </div>
            <template #footer>
              <ElButton @click="showProduceMessage = false">取消</ElButton>
              <ElButton type="primary" :loading="produceLoading" @click="handleProduceMessage">发送</ElButton>
            </template>
          </ElDialog>
        </div>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import {
  ChatDotRound,
  Delete,
  Document,
  Loading,
  Odometer,
  Plus,
  RefreshRight,
  UserFilled,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElScrollbar,
  ElSelect,
  ElTag,
  ElTooltip,
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
  fetchKafkaTopicOffsets,
  listKafkaConsumerGroups,
  fetchKafkaConsumerGroupDetail,
  resetKafkaConsumerGroupOffset,
  consumeKafkaMessages,
  produceKafkaMessage,
} from "../../api/kafka";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "overview", title: "概览", icon: markRaw(Odometer) },
  { name: "topics", title: "Topics", icon: markRaw(Document) },
  { name: "groups", title: "Groups", icon: markRaw(UserFilled) },
  { name: "messages", title: "消息", icon: markRaw(ChatDotRound) },
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
    const [detailRes, offsetsRes] = await Promise.all([
      fetchKafkaTopicDetail(props.connectionId, name),
      fetchKafkaTopicOffsets(props.connectionId, name),
    ]);
    topicDetail.value = detailRes?.data || null;
    topicOffsets.value = offsetsRes?.data || [];
    topicDetailVisible.value = true;
    loadTopicMessages(name);
  } catch { ElMessage.error("加载 Topic 详情失败"); }
};

// Topic Offsets
const topicOffsets = ref<any[]>([]);

// Topic Messages (shown in topic detail dialog)
const topicMessages = ref<any[]>([]);
const topicMsgLoading = ref(false);

const loadTopicMessages = async (topicName: string) => {
  topicMsgLoading.value = true;
  try {
    const res = await consumeKafkaMessages(props.connectionId, topicName, -1, -1, 100);
    topicMessages.value = (res?.data || []).reverse();
  } catch {
    ElMessage.error("加载消息数据失败");
  } finally {
    topicMsgLoading.value = false;
  }
};

const isJson = (value: string) => {
  if (!value) return false;
  try { return typeof JSON.parse(value) === "object"; } catch { return false; }
};

const formatJson = (value: string) => {
  try {
    const obj = JSON.parse(value);
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join("  ");
  } catch { return value; }
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
    const detail = res?.data || null;
    if (detail?.partitions?.length) {
      const topicGroups: Record<string, number[]> = {};
      for (const p of detail.partitions) {
        if (!topicGroups[p.topic]) topicGroups[p.topic] = [];
        topicGroups[p.topic].push(p.partition);
      }
      for (const [topic, parts] of Object.entries(topicGroups)) {
        try {
          const offsetsRes = await fetchKafkaTopicOffsets(props.connectionId, topic);
          const offsets = offsetsRes?.data || [];
          for (const op of offsets) {
            const matched = detail.partitions.find((p: any) => p.topic === topic && p.partition === op.partition);
            if (matched) {
              matched.endOffset = op.endOffset;
              matched.lag = Math.max(0, op.endOffset - matched.currentOffset);
            }
          }
        } catch { /* ignore per-topic errors */ }
      }
    }
    groupDetail.value = detail;
    groupDetailVisible.value = true;
  } catch { ElMessage.error("加载消费者组详情失败"); }
};

// Reset Offset
const resetOffsetVisible = ref(false);
const resetOffsetTopic = ref("");
const resetOffsetGroup = ref("");
const resetOffsetStrategy = ref<"earliest" | "latest">("earliest");
const resetOffsetLoading = ref(false);

const openResetOffset = (groupId: string, topicName: string) => {
  resetOffsetGroup.value = groupId;
  resetOffsetTopic.value = topicName;
  resetOffsetStrategy.value = "earliest";
  resetOffsetVisible.value = true;
};

const handleResetOffset = async () => {
  ElMessageBox.confirm(
    `确认将 ${resetOffsetGroup.value} 对 ${resetOffsetTopic.value} 的 offset 重置到 ${resetOffsetStrategy.value}？`,
    "重置确认",
    { type: "warning" },
  ).then(async () => {
    resetOffsetLoading.value = true;
    try {
      await resetKafkaConsumerGroupOffset(
        props.connectionId, resetOffsetGroup.value, resetOffsetTopic.value, resetOffsetStrategy.value,
      );
      ElMessage.success("Offset 已重置");
      resetOffsetVisible.value = false;
      await viewGroupDetail(resetOffsetGroup.value);
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.msg || "重置 offset 失败");
    } finally {
      resetOffsetLoading.value = false;
    }
  }).catch(() => {});
};

// Produce message
const showProduceMessage = ref(false);
const produceTopic = ref("");
const produceKey = ref("");
const produceValue = ref("");
const produceLoading = ref(false);

const openProduceMessage = () => {
  produceTopic.value = messageTopic.value;
  produceKey.value = "";
  produceValue.value = "";
  showProduceMessage.value = true;
};

const handleProduceMessage = async () => {
  if (!produceTopic.value) { ElMessage.warning("请选择 Topic"); return; }
  if (!produceValue.value) { ElMessage.warning("请输入消息内容"); return; }
  produceLoading.value = true;
  try {
    await produceKafkaMessage(props.connectionId, produceTopic.value, produceKey.value, produceValue.value);
    ElMessage.success("消息已发送");
    showProduceMessage.value = false;
    await loadTopicOffsets(produceTopic.value);
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || "发送消息失败");
  } finally {
    produceLoading.value = false;
  }
};

// Topic offsets for message view
const msgTopicOffsets = ref<any[]>([]);
const msgTopicTotalCount = ref(0);

const loadTopicOffsets = async (topicName: string) => {
  if (!topicName) { msgTopicOffsets.value = []; msgTopicTotalCount.value = 0; return; }
  try {
    const res = await fetchKafkaTopicOffsets(props.connectionId, topicName);
    msgTopicOffsets.value = res?.data || [];
    msgTopicTotalCount.value = msgTopicOffsets.value.reduce((sum: number, p: any) => sum + (p.count || 0), 0);
  } catch { msgTopicOffsets.value = []; msgTopicTotalCount.value = 0; }
};

const onMessageTopicChange = (val: string) => {
  messageTopic.value = val;
  loadTopicOffsets(val);
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
    messages.value = (res?.data || []).reverse();
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

<style scoped>
/* ─── Kafka Workspace ─── CSS Variables Modern Theme ─── */
.kafka-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
}
.kafka-layout { height: 100%; }

/* ─── Main Content ─── */
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.kv {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.kv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}
.kv-hleft, .kv-hright { display: flex; align-items: center; gap: 8px; }
.kv-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: .2px;
}
.kv-badge {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 10px;
  border: none;
}
.kv-body { flex: 1; min-height: 0; padding: 0; }
.kv-loading, .kv-empty {
  display: flex; align-items: center; justify-content: center;
  min-height: 200px;
}

/* ─── Stats Cards ─── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}
.stat-card {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;
  transition: transform .2s, box-shadow .2s;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    border-radius: 0 2px 2px 0;
    background: linear-gradient(180deg, var(--el-color-primary), #8b5cf6);
    opacity: .5;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,.08);
  }
}
.stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: .4px;
  font-weight: 600;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

/* ─── Tables ─── */
.ktable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  thead th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-light);
    letter-spacing: .3px;
    white-space: nowrap;
  }
  tbody td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-regular);
    transition: background .12s;
  }
  tbody tr {
    transition: background .12s;
    &:hover td { background: var(--el-color-primary-light-9); }
    &:last-child td { border-bottom: none; }
  }
  &.mini {
    td, th { padding: 7px 10px; font-size: 12px; }
    thead th { font-size: 10px; }
  }
}

/* ─── Links ─── */
.topic-link {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: color .15s;
  &:hover {
    color: var(--el-color-primary-light-3);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

/* ─── Message Filters ─── */
.msg-filters {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  background: var(--el-fill-color-lighter);
}
.msg-frow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.msg-sel { width: 200px; }
.msg-fgroup {
  display: flex;
  align-items: center;
  gap: 4px;
}
.msg-flabel { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 600; white-space: nowrap; }
.msg-inum { width: 76px; }
.msg-offsets {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.msg-ototal {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  em { font-style: normal; color: var(--el-color-primary); font-weight: 700; }
}
.msg-ochip {
  font-family: "JetBrains Mono", "Fira Code", monospace !important;
  font-size: 10px !important;
}

/* ─── Shared ─── */
.mono { font-family: "JetBrains Mono", "Fira Code", monospace; font-size: .92em; }
.mono.ts { font-size: .85em; white-space: nowrap; color: var(--el-text-color-secondary); }
.mono.key { color: #d97706; font-weight: 600; }
.val {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: .92em;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  .json { color: var(--el-color-success); font-weight: 500; }
  .raw { color: var(--el-text-color-regular); }
}
.id-tag {
  font-family: "JetBrains Mono", "Fira Code", monospace !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  border: none;
}
.kv-section { margin-top: 0; }
.kv-stitle {
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  letter-spacing: .4px;
}

/* ─── Dialogs ─── */
:deep(.kafka-dlg) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
  }
  .el-dialog__header {
    padding: 20px 24px 0;
    .el-dialog__title { font-size: 17px; font-weight: 700; }
  }
  .el-dialog__body { padding: 18px 24px; }
  .el-dialog__footer {
    padding: 0 24px 18px;
    border-top: 1px solid var(--el-border-color-light);
    padding-top: 14px;
  }
}
.dlg-body { display: grid; gap: 14px; }
.dlg-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
}
.dlg-mitem {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dlg-ml {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .3px;
}
.dlg-mv {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.dlg-tbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dlg-thint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: 1;
}
.dlg-form {
  display: grid;
  gap: 10px;
  label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 600; }
}

/* ─── Scrollbar ─── */
:deep(.kv-body .el-scrollbar__bar.is-vertical) { width: 4px; }
:deep(.kv-body .el-scrollbar__thumb) { background: var(--el-border-color-darker); border-radius: 4px; }
</style>
