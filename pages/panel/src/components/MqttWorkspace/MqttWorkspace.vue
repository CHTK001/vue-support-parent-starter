<template>
  <div class="mqtt-workspace">
    <ScLayout
      left-enabled
      :rail-enabled="false"
      :left-width="280"
      :left-min-width="200"
      :left-max-width="380"
      :left-resizable="true"
    >
      <!-- ============ 左侧面板 ============ -->
      <template #left="{ collapsed }">
        <div class="mqtt-left" :class="{ 'is-collapsed': collapsed }">
          <!-- 连接信息卡片 -->
          <section class="mqtt-left__section">
            <div class="mqtt-info-card">
              <div class="mqtt-info-card__status">
                <span
                  class="mqtt-status-dot"
                  :class="connected ? 'is-online' : 'is-offline'"
                />
                <span class="mqtt-status-text">{{ connected ? '已连接' : '未连接' }}</span>
              </div>
              <div class="mqtt-info-card__body">
                <div class="mqtt-info-row">
                  <span class="mqtt-info-label">Broker</span>
                  <span class="mqtt-info-value mono">{{ brokerInfoData?.serverURI || '-' }}</span>
                </div>
                <div class="mqtt-info-row">
                  <span class="mqtt-info-label">Client ID</span>
                  <span class="mqtt-info-value mono">{{ brokerInfoData?.clientId || '-' }}</span>
                </div>
                <div class="mqtt-info-row" v-if="connectedAt">
                  <span class="mqtt-info-label">已连接</span>
                  <span class="mqtt-info-value">{{ uptimeText }}</span>
                </div>
              </div>
              <div class="mqtt-info-card__stats">
                <div class="mqtt-stat">
                  <span class="mqtt-stat__value">{{ messages.length }}</span>
                  <span class="mqtt-stat__label">消息</span>
                </div>
                <div class="mqtt-stat">
                  <span class="mqtt-stat__value">{{ subscriptions.length }}</span>
                  <span class="mqtt-stat__label">订阅</span>
                </div>
                <div class="mqtt-stat">
                  <span class="mqtt-stat__value">{{ brokerInfoData?.cachedMessageCount || 0 }}</span>
                  <span class="mqtt-stat__label">缓存</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 订阅管理 -->
          <section class="mqtt-left__section mqtt-left__section--grow">
            <div class="mqtt-sub-header">
              <span class="mqtt-sub-header__title">订阅主题</span>
              <ElTag size="small" round v-if="subscriptions.length">{{ subscriptions.length }}</ElTag>
            </div>

            <div class="mqtt-sub-list">
              <div v-if="subsLoading" class="mqtt-sub-list__loading">
                <ElIcon class="is-loading"><Loading /></ElIcon>
                <span>加载中...</span>
              </div>
              <div v-else-if="!subscriptions.length" class="mqtt-sub-list__empty">
                <ElEmpty :image-size="48" description="暂无订阅" />
              </div>
              <template v-else>
                <div
                  v-for="sub in sortedSubscriptions"
                  :key="sub.topic"
                  class="mqtt-sub-item"
                >
                  <span class="mqtt-sub-item__topic mono">{{ sub.topic }}</span>
                  <ElTag
                    size="small"
                    :type="qosTagType(sub.qos)"
                    class="mqtt-sub-item__qos"
                  >Q{{ sub.qos }}</ElTag>
                  <ElButton
                    text
                    size="small"
                    class="mqtt-sub-item__close"
                    @click="handleUnsubscribe(sub.topic)"
                  >
                    <ElIcon><Close /></ElIcon>
                  </ElButton>
                </div>
              </template>
            </div>

            <div class="mqtt-sub-add">
              <ElInput
                v-model="newSubTopic"
                placeholder="输入主题 (支持 + 和 #)"
                size="small"
                class="mqtt-sub-add__input"
                @keyup.enter="handleSubscribe"
              />
              <div class="mqtt-sub-add__row">
                <ElSelect v-model="newSubQos" size="small" style="width:80px">
                  <ElOption :value="0" label="QoS 0" />
                  <ElOption :value="1" label="QoS 1" />
                  <ElOption :value="2" label="QoS 2" />
                </ElSelect>
                <ElButton
                  type="primary"
                  size="small"
                  :loading="subLoading"
                  style="flex:1"
                  @click="handleSubscribe"
                >订阅</ElButton>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- ============ 主区域 ============ -->
      <template #default>
        <div class="mqtt-main">
          <!-- Header -->
          <header class="mqtt-main__header">
            <div class="mqtt-main__header-left">
              <ElTag
                :type="connected ? 'success' : 'danger'"
                size="small"
                effect="dark"
              >{{ connected ? '已连接' : '未连接' }}</ElTag>
              <span class="mqtt-main__broker mono">{{ brokerInfoData?.serverURI || '...' }}</span>
              <span class="mqtt-main__client-id" v-if="brokerInfoData?.clientId">ID: {{ brokerInfoData.clientId }}</span>
            </div>
            <div class="mqtt-main__header-right">
              <ElButton :icon="RefreshRight" circle size="small" :loading="infoLoading" @click="loadBrokerInfo" />
              <ElButton :icon="Close" circle size="small" type="danger" plain @click="$emit('close')" />
            </div>
          </header>

          <!-- 消息流 -->
          <div class="mqtt-main__messages" ref="msgContainerRef">
            <div v-if="msgLoading" class="mqtt-main__loading">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>加载历史消息...</span>
            </div>
            <div v-else-if="!filteredMessages.length" class="mqtt-main__empty">
              <ElEmpty
                :image-size="80"
                :description="filterTopic ? '无匹配消息' : '暂无消息，请先订阅主题'"
              />
            </div>
            <template v-else>
              <div
                v-for="(msg, idx) in filteredMessages"
                :key="msg.id || idx"
                class="mqtt-msg"
                :class="{
                  'mqtt-msg--new': msg._new,
                  'mqtt-msg--expanded': expandedIdx === idx,
                }"
                @click="toggleExpand(idx)"
              >
                <div class="mqtt-msg__head">
                  <span class="mqtt-msg__topic mono">{{ msg.topic }}</span>
                  <span class="mqtt-msg__meta">
                    <ElTag size="small" class="mqtt-msg__qos-tag">Q{{ msg.qos }}</ElTag>
                    <span class="mqtt-msg__time">{{ formatTime(msg.timestamp) }}</span>
                  </span>
                </div>
                <div class="mqtt-msg__body">
                  <pre class="mqtt-msg__payload mono">{{ formatPayload(msg.payload) }}</pre>
                  <span v-if="!isExpanded(idx) && isPayloadLong(msg.payload)" class="mqtt-msg__expand-hint">点击展开</span>
                </div>
              </div>
            </template>
          </div>

          <!-- 主题过滤 -->
          <div class="mqtt-main__filter" v-if="messages.length">
            <ElInput
              v-model="filterTopic"
              placeholder="按主题过滤"
              clearable
              size="small"
              class="mqtt-main__filter-input"
            >
              <template #prefix><ElIcon><Search /></ElIcon></template>
            </ElInput>
            <span class="mqtt-main__filter-count">{{ filteredMessages.length }} / {{ messages.length }}</span>
          </div>

          <!-- 发布区 -->
          <div class="mqtt-main__publish">
            <div class="mqtt-pub-row">
              <ElInput v-model="pubTopic" placeholder="发布主题" class="mqtt-pub-row__topic" size="small" />
              <ElSelect v-model="pubQos" style="width:76px" size="small">
                <ElOption :value="0" label="QoS 0" />
                <ElOption :value="1" label="QoS 1" />
                <ElOption :value="2" label="QoS 2" />
              </ElSelect>
              <ElCheckbox v-model="pubRetain" label="保留" size="small" border />
              <ElButton type="primary" :loading="pubLoading" size="small" @click="handlePublish">发布</ElButton>
            </div>
            <ElInput
              v-model="pubPayload"
              type="textarea"
              :rows="2"
              placeholder="消息内容 (支持 JSON / Text)"
              class="mqtt-pub-row__payload"
            />
          </div>

          <!-- 状态栏 -->
          <footer class="mqtt-main__status-bar">
            <span>{{ messages.length }} 条消息</span>
            <span class="mqtt-main__status-divider">|</span>
            <span>{{ subscriptions.length }} 个订阅</span>
            <span class="mqtt-main__status-divider">|</span>
            <span v-if="brokerInfoData?.serverURI">{{ brokerInfoData.serverURI }}</span>
          </footer>
        </div>
      </template>
    </ScLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Close, Loading, RefreshRight, Search } from "@element-plus/icons-vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchMqttBrokerInfo,
  fetchMqttMessages,
  listMqttSubscriptions,
  publishMqttMessage,
  subscribeMqttTopic,
  unsubscribeMqttTopic,
} from "../../api/mqtt";
import { useSocketService } from "@repo/core";

const props = defineProps<{ connectionId: string }>();
defineEmits<{ close: [] }>();

// ── 连接状态 ──────────────────────────────────────────────────
const connected = ref(false);
const brokerInfoData = ref<Record<string, any>>({});
const infoLoading = ref(false);
const connectedAt = ref<number | null>(null);
const uptimeText = ref("--");

let uptimeTimer: ReturnType<typeof setInterval> | null = null;

const startUptimeTimer = () => {
  connectedAt.value = Date.now();
  updateUptime();
  uptimeTimer = setInterval(updateUptime, 1000);
};

const stopUptimeTimer = () => {
  if (uptimeTimer) {
    clearInterval(uptimeTimer);
    uptimeTimer = null;
  }
  connectedAt.value = null;
  uptimeText.value = "--";
};

const updateUptime = () => {
  if (!connectedAt.value) return;
  const elapsed = Math.floor((Date.now() - connectedAt.value) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) {
    uptimeText.value = `${h}时${m}分${s}秒`;
  } else if (m > 0) {
    uptimeText.value = `${m}分${s}秒`;
  } else {
    uptimeText.value = `${s}秒`;
  }
};

// ── 订阅 ──────────────────────────────────────────────────────
const subscriptions = ref<any[]>([]);
const subsLoading = ref(false);
const newSubTopic = ref("");
const newSubQos = ref(1);
const subLoading = ref(false);

const sortedSubscriptions = computed(() => {
  return [...subscriptions.value].sort((a, b) => (a.topic || "").localeCompare(b.topic || ""));
});

const qosTagType = (qos: number): "warning" | "success" | "info" => {
  return qos === 2 ? "warning" : qos === 1 ? "success" : "info";
};

// ── 消息 ──────────────────────────────────────────────────────
const messages = ref<any[]>([]);
const msgLoading = ref(false);
const filterTopic = ref("");
const msgContainerRef = ref<HTMLElement | null>(null);
const expandedIdx = ref<number | null>(null);

const filteredMessages = computed(() => {
  if (!filterTopic.value) return messages.value;
  const ft = filterTopic.value.toLowerCase();
  return messages.value.filter((m) => (m.topic || "").toLowerCase().includes(ft));
});

const isExpanded = (idx: number) => expandedIdx.value === idx;

const isPayloadLong = (payload: string) => {
  if (!payload) return false;
  return payload.length > 200;
};

const toggleExpand = (idx: number) => {
  expandedIdx.value = expandedIdx.value === idx ? null : idx;
};

// ── Broker 信息 ──────────────────────────────────────────────
const loadBrokerInfo = async () => {
  infoLoading.value = true;
  try {
    const res = await fetchMqttBrokerInfo(props.connectionId);
    brokerInfoData.value = res?.data || {};
    const wasConnected = connected.value;
    connected.value = brokerInfoData.value?.connected === true;
    if (connected.value && !wasConnected) {
      startUptimeTimer();
    } else if (!connected.value && wasConnected) {
      stopUptimeTimer();
    }
  } catch {
    /* ignore */
  } finally {
    infoLoading.value = false;
  }
};

// ── 订阅管理 ─────────────────────────────────────────────────
const loadSubscriptions = async () => {
  subsLoading.value = true;
  try {
    const res = await listMqttSubscriptions(props.connectionId);
    subscriptions.value = res?.data || [];
  } catch {
    /* ignore */
  } finally {
    subsLoading.value = false;
  }
};

const handleSubscribe = async () => {
  const topic = newSubTopic.value.trim();
  if (!topic) {
    ElMessage.warning("请输入主题");
    return;
  }
  subLoading.value = true;
  try {
    await subscribeMqttTopic(props.connectionId, topic, newSubQos.value);
    ElMessage.success(`已订阅 ${topic}`);
    newSubTopic.value = "";
    await loadSubscriptions();
  } catch (e: any) {
    ElMessage.error(e?.message || "订阅失败");
  } finally {
    subLoading.value = false;
  }
};

const handleUnsubscribe = async (topic: string) => {
  try {
    await unsubscribeMqttTopic(props.connectionId, topic);
    await loadSubscriptions();
  } catch (e: any) {
    ElMessage.error(e?.message || "取消订阅失败");
  }
};

// ── 消息 ─────────────────────────────────────────────────────
const loadMessages = async () => {
  msgLoading.value = true;
  try {
    const res = await fetchMqttMessages(props.connectionId, undefined, 100);
    messages.value = (res?.data || []).map((m: any) => ({ ...m, _new: false }));
    await scrollToBottom();
  } catch {
    /* ignore */
  } finally {
    msgLoading.value = false;
  }
};

const handlePublish = async () => {
  if (!pubTopic.value.trim()) {
    ElMessage.warning("请输入发布主题");
    return;
  }
  pubLoading.value = true;
  try {
    await publishMqttMessage(
      props.connectionId,
      pubTopic.value.trim(),
      pubPayload.value,
      pubQos.value,
    );
    ElMessage.success("已发布");
  } catch (e: any) {
    ElMessage.error(e?.message || "发布失败");
  } finally {
    pubLoading.value = false;
  }
};

// ── 格式化 ───────────────────────────────────────────────────
const formatPayload = (payload: string) => {
  if (!payload) return "";
  if (payload.length > 10000) {
    return payload.substring(0, 10000) + "\n... (截断)";
  }
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
};

const formatTime = (ts: string) => {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  } catch {
    return ts;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (msgContainerRef.value) {
    msgContainerRef.value.scrollTop = msgContainerRef.value.scrollHeight;
  }
};

// ── 发布 ─────────────────────────────────────────────────────
const pubTopic = ref("test/topic");
const pubPayload = ref('{"hello": "world"}');
const pubQos = ref(0);
const pubRetain = ref(false);
const pubLoading = ref(false);

// ── Socket.IO 实时消息 ──────────────────────────────────────
let unsubMqttMessage: (() => void) | null = null;

onMounted(async () => {
  await loadBrokerInfo();
  if (connected.value) startUptimeTimer();
  await Promise.all([loadSubscriptions(), loadMessages()]);

  const svc = useSocketService();
  if (svc) {
    unsubMqttMessage = svc.subscribe("MQTT", "MESSAGE", (msg: any) => {
      const data = msg?.data;
      if (!data || data.connectionId !== props.connectionId) return;
      messages.value = [
        {
          topic: data.topic,
          payload: data.payload,
          qos: data.qos,
          timestamp: data.timestamp,
          _new: true,
        },
        ...messages.value,
      ];
      scrollToBottom();
    });
  }
});

onUnmounted(() => {
  unsubMqttMessage?.();
  stopUptimeTimer();
});
</script>

<style lang="scss" scoped>
.mqtt-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

// ── Left Panel ──────────────────────────────────────────────
.mqtt-left {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
  overflow: hidden;

  &__section {
    flex-shrink: 0;

    &--grow {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }
}

// ── Connection Info Card ────────────────────────────────────
.mqtt-info-card {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    font-weight: 600;
    font-size: 13px;
  }

  &__body {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
}

.mqtt-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-online {
    background: #67c23a;
    box-shadow: 0 0 6px rgba(103, 194, 58, 0.5);
  }

  &.is-offline {
    background: #f56c6c;
    box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
  }
}

.mqtt-status-text {
  color: var(--el-text-color-primary);
}

.mqtt-info-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mqtt-info-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.mqtt-info-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  word-break: break-all;

  &.mono {
    font-family: "Cascadia Code", "Fira Code", monospace;
    font-size: 11px;
  }
}

.mqtt-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  text-align: center;

  & + & {
    border-left: 1px solid var(--el-border-color-extra-light);
  }

  &__value {
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;
  }

  &__label {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

// ── Subscription Panel ──────────────────────────────────────
.mqtt-sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 0 2px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.mqtt-sub-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;

  &__loading,
  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80px;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.mqtt-sub-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: default;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);

    .mqtt-sub-item__close {
      opacity: 1;
    }
  }

  &__topic {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__qos {
    flex-shrink: 0;
    font-size: 10px;
    padding: 0 5px;
    height: 18px;
    line-height: 18px;
  }

  &__close {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
    color: var(--el-text-color-secondary);
    padding: 0;

    &:hover {
      color: var(--el-color-danger);
    }

    :deep(.el-icon) {
      font-size: 14px;
    }
  }
}

.mqtt-sub-add {
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-extra-light);
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__input {
    :deep(.el-input__wrapper) {
      background: var(--el-fill-color-blank);
    }
  }

  &__row {
    display: flex;
    gap: 6px;
  }
}

// ── Main Area ───────────────────────────────────────────────
.mqtt-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    background: var(--el-fill-color-lighter);
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  &__broker {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__client-id {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    display: none;

    @media (min-width: 960px) {
      display: inline;
    }
  }

  // ── Message Feed ──────────────────────────────────────────
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 8px;
    color: var(--el-text-color-secondary);
  }

  // ── Filter ────────────────────────────────────────────────
  &__filter {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    background: var(--el-fill-color-lighter);

    &-input {
      flex: 1;
    }

    &-count {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  // ── Publish ───────────────────────────────────────────────
  &__publish {
    border-top: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    background: var(--el-fill-color-lighter);
  }

  // ── Status Bar ────────────────────────────────────────────
  &__status-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 16px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    border-top: 1px solid var(--el-border-color-extra-light);
    flex-shrink: 0;
    background: var(--el-bg-color);
  }

  &__status-divider {
    color: var(--el-border-color-lighter);
  }
}

// ── Message Item ────────────────────────────────────────────
.mqtt-msg {
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &--new {
    animation: msg-fade-in 0.4s ease-out;
  }

  &--expanded .mqtt-msg__payload {
    max-height: none;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__topic {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  &__qos-tag {
    font-size: 10px;
    padding: 0 4px;
    height: 18px;
    line-height: 18px;
  }

  &__time {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__body {
    position: relative;
  }

  &__payload {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--el-text-color-regular);
    max-height: 60px;
    overflow: hidden;
  }

  &__expand-hint {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 11px;
    color: var(--el-color-primary);
    background: linear-gradient(to left, var(--el-bg-color) 60%, transparent);
    padding: 0 4px 0 16px;
  }
}

@keyframes msg-fade-in {
  from {
    background: var(--el-color-primary-light-9);
    opacity: 0.6;
  }
  to {
    background: transparent;
    opacity: 1;
  }
}

// ── Publish Row ─────────────────────────────────────────────
.mqtt-pub-row {
  display: flex;
  gap: 6px;
  padding: 6px 16px;
  align-items: center;

  &__topic {
    flex: 1;
  }

  &__payload {
    padding: 0 16px 6px;
  }
}

// ── Dark Mode ────────────────────────────────────────────────
:global(html.dark) {
  .mqtt-info-card {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color-lighter);
  }

  .mqtt-sub-item:hover {
    background: var(--el-fill-color-light);
  }

  .mqtt-msg {
    &--new {
      @keyframes msg-fade-in-dark {
        from {
          background: rgba(0, 184, 148, 0.12);
          opacity: 0.6;
        }
        to {
          background: transparent;
          opacity: 1;
        }
      }
      animation: msg-fade-in-dark 0.4s ease-out;
    }
  }
}
</style>
