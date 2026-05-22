<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="容器网络"
    width="600px"
  >
    <template #header>
      <div class="cn-header">
        <span class="cn-header__title">容器网络</span>
        <span class="cn-header__subtitle">{{ containerName || containerId?.substring(0, 12) }}</span>
      </div>
    </template>

    <!-- Connected networks -->
    <div class="cn-section">
      <div class="cn-section__title">已连接的网络</div>
      <div v-if="!connectedNetworks.length" class="cn-empty">暂无已连接网络</div>
      <div v-else>
        <ElTag
          v-for="net in connectedNetworks"
          :key="net.id"
          closable
          :disable-transitions="true"
          @close="handleDisconnect(net.id, net.name)"
          style="margin: 4px;"
        >
          {{ net.name }} ({{ net.driver }})
        </ElTag>
      </div>
    </div>

    <!-- Available networks -->
    <div class="cn-section">
      <div class="cn-section__title">连接网络</div>
      <div class="cn-connect-row">
        <ElSelect v-model="selectedNetwork" placeholder="选择网络" filterable style="flex:1">
          <ElOption v-for="net in availableNetworks" :key="net.id" :label="net.name" :value="net.id">
            <span>{{ net.name }}</span>
            <span class="cn-opt-hint"> ({{ net.driver }})</span>
          </ElOption>
        </ElSelect>
        <ElButton type="primary" :loading="connecting" :disabled="!selectedNetwork" @click="handleConnect">连接</ElButton>
      </div>
    </div>

    <template #footer>
      <ElButton :icon="RefreshRight" :loading="loading" @click="loadNetworks">刷新网络</ElButton>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElButton, ElDialog, ElMessage, ElMessageBox, ElOption, ElSelect, ElTag } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import * as dockerApi from "../../api/docker";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
  containerId: string;
  containerName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

const loading = ref(false);
const connecting = ref(false);
const allNetworks = ref<any[]>([]);
const connectedNetworkIds = ref<Set<string>>(new Set());
const selectedNetwork = ref("");

const connectedNetworks = computed(() => allNetworks.value.filter(n => connectedNetworkIds.value.has(n.id)));
const availableNetworks = computed(() => allNetworks.value.filter(n => !connectedNetworkIds.value.has(n.id)));

const loadNetworks = async () => {
  loading.value = true;
  try {
    const [netRes, inspectRes] = await Promise.all([
      dockerApi.listDockerNetworks(props.connectionId),
      dockerApi.inspectDockerContainer(props.connectionId, props.containerId),
    ]);
    allNetworks.value = netRes?.data || [];

    // Extract connected network IDs from container inspect
    const netSettings = inspectRes?.data?.NetworkSettings?.Networks;
    if (netSettings) {
      connectedNetworkIds.value = new Set(Object.keys(netSettings));
    } else {
      connectedNetworkIds.value = new Set();
    }
  } catch { /* ignore */ }
  finally { loading.value = false; }
};

const handleConnect = async () => {
  if (!selectedNetwork.value) return;
  connecting.value = true;
  try {
    await dockerApi.connectContainerToDockerNetwork(props.connectionId, selectedNetwork.value, props.containerId);
    ElMessage.success("已连接到网络");
    connectedNetworkIds.value.add(selectedNetwork.value);
    selectedNetwork.value = "";
    await loadNetworks();
  } catch { ElMessage.error("连接失败"); }
  finally { connecting.value = false; }
};

const handleDisconnect = async (netId: string, netName: string) => {
  try {
    await ElMessageBox.confirm(`确定断开网络 ${netName}？`, "确认");
    await dockerApi.disconnectContainerFromDockerNetwork(props.connectionId, netId, props.containerId);
    ElMessage.success("已断开");
    connectedNetworkIds.value.delete(netId);
  } catch { /* cancelled */ }
};

watch(() => props.visible, (v) => { if (v) loadNetworks(); });
</script>

<style scoped>
.cn-header { display: flex; align-items: center; gap: 10px; }
.cn-header__title { font-size: 15px; font-weight: 600; }
.cn-header__subtitle { font-size: 13px; color: var(--el-text-color-secondary); }

.cn-section { margin-bottom: 20px; }
.cn-section__title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--el-text-color-secondary); }
.cn-empty { font-size: 12px; color: var(--el-text-color-placeholder); padding: 8px 0; }

.cn-connect-row { display: flex; gap: 8px; align-items: center; }
.cn-opt-hint { color: var(--el-text-color-placeholder); font-size: 12px; }
</style>
