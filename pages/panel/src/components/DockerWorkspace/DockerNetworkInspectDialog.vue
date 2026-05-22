<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="网络详情"
    width="600px"
  >
    <template #header>
      <div class="ni-header">
        <span class="ni-header__title">网络详情</span>
        <span class="ni-header__subtitle">{{ networkName || networkId?.substring(0, 12) }}</span>
      </div>
    </template>

    <div v-if="loading" class="ni-loading"><ElIcon class="is-loading"><Loading /></ElIcon> 加载中...</div>
    <div v-else-if="!network" class="ni-empty">暂无数据</div>
    <template v-else>
      <ElDescriptions :column="1" border size="small">
        <ElDescriptionsItem label="名称">{{ network.Name || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="ID"><code class="ni-mono">{{ network.Id || '-' }}</code></ElDescriptionsItem>
        <ElDescriptionsItem label="驱动">{{ network.Driver || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="作用域">{{ network.Scope || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="子网">{{ network.IPAM?.Config?.[0]?.Subnet || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="网关">{{ network.IPAM?.Config?.[0]?.Gateway || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="内部">{{ network.Internal ? '是' : '否' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="可附加">{{ network.Attachable ? '是' : '否' }}</ElDescriptionsItem>
      </ElDescriptions>

      <!-- Connected containers -->
      <div v-if="hasContainers" class="ni-section">
        <div class="ni-section__title">已连接的容器 ({{ containerCount }})</div>
        <div v-for="(v, k) in network.Containers" :key="k" class="ni-container-item">
          <span class="ni-container-name">{{ v.Name }}</span>
          <code class="ni-container-ip">{{ v.IPv4Address || '-' }}</code>
          <span class="ni-container-mac">{{ v.MacAddress || '' }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElButton, ElDescriptions, ElDescriptionsItem, ElDialog, ElIcon, ElMessage } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import * as dockerApi from "../../api/docker";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
  networkId: string;
  networkName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

const network = ref<any>(null);
const loading = ref(false);

const hasContainers = computed(() => network.value?.Containers && Object.keys(network.value.Containers).length > 0);
const containerCount = computed(() => network.value?.Containers ? Object.keys(network.value.Containers).length : 0);

const loadNetwork = async () => {
  if (!props.networkId) return;
  loading.value = true;
  try {
    const res = await dockerApi.inspectDockerNetwork(props.connectionId, props.networkId);
    network.value = res?.data || null;
  } catch {
    ElMessage.error("获取网络详情失败");
    network.value = null;
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, (v) => { if (v) loadNetwork(); });
</script>

<style scoped>
.ni-header { display: flex; align-items: center; gap: 10px; }
.ni-header__title { font-size: 15px; font-weight: 600; }
.ni-header__subtitle { font-size: 13px; color: var(--el-text-color-secondary); }
.ni-loading, .ni-empty { text-align: center; padding: 60px 0; color: var(--el-text-color-secondary); }
.ni-mono { font-family: "Cascadia Code", "Fira Code", monospace; font-size: 11px; word-break: break-all; }
.ni-section { margin-top: 16px; }
.ni-section__title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.ni-container-item {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 10px; border-radius: 4px;
  background: var(--el-fill-color-light);
  margin-bottom: 4px; font-size: 12px;
}
.ni-container-name { font-weight: 500; flex: 1; }
.ni-container-ip { font-family: "Cascadia Code", "Fira Code", monospace; color: var(--el-color-primary); }
.ni-container-mac { font-family: "Cascadia Code", "Fira Code", monospace; color: var(--el-text-color-secondary); font-size: 11px; }
</style>
