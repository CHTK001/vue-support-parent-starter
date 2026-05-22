<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="卷详情"
    width="600px"
  >
    <div v-if="loading" class="vi-loading"><ElIcon class="is-loading"><Loading /></ElIcon> 加载中...</div>
    <div v-else-if="!volume" class="vi-empty">暂无数据</div>
    <template v-else>
      <ElDescriptions :column="1" border size="small">
        <ElDescriptionsItem label="名称">{{ volume.Name || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="驱动">{{ volume.Driver || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="挂载点"><code class="vi-mono">{{ volume.Mountpoint || '-' }}</code></ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">{{ volume.CreatedAt || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="作用域">{{ volume.Scope || '-' }}</ElDescriptionsItem>
      </ElDescriptions>

      <ElDescriptions v-if="hasLabels" title="标签" :column="1" border size="small" style="margin-top:12px">
        <ElDescriptionsItem v-for="(v, k) in volume.Labels" :key="k" :label="k + ''">{{ displayVal(v) }}</ElDescriptionsItem>
      </ElDescriptions>

      <ElDescriptions v-if="hasOptions" title="选项" :column="1" border size="small" style="margin-top:12px">
        <ElDescriptionsItem v-for="(v, k) in volume.Options" :key="k" :label="k + ''">{{ displayVal(v) }}</ElDescriptionsItem>
      </ElDescriptions>
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
  volumeName: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

const volume = ref<any>(null);
const loading = ref(false);

const hasLabels = computed(() => volume.value?.Labels && Object.keys(volume.value.Labels).length > 0);
const hasOptions = computed(() => volume.value?.Options && Object.keys(volume.value.Options).length > 0);

const displayVal = (v: unknown): string => v != null ? String(v) : '-';

const loadVolume = async () => {
  if (!props.volumeName) return;
  loading.value = true;
  try {
    const res = await dockerApi.inspectDockerVolume(props.connectionId, props.volumeName);
    volume.value = res?.data || null;
  } catch {
    ElMessage.error("获取卷详情失败");
    volume.value = null;
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, (v) => { if (v) loadVolume(); });
</script>

<style scoped>
.vi-loading, .vi-empty { text-align: center; padding: 60px 0; color: var(--el-text-color-secondary); }
.vi-mono { font-family: "Cascadia Code", "Fira Code", monospace; font-size: 12px; }
</style>
