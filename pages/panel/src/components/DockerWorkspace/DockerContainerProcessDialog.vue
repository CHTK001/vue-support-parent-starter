<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="容器进程"
    width="800px"
  >
    <template #header>
      <div class="cp-header">
        <span class="cp-header__title">容器进程</span>
        <span class="cp-header__subtitle">{{ containerName || containerId?.substring(0, 12) }}</span>
        <div class="cp-header__right">
          <ElInput v-model="psArgs" size="small" placeholder="ps 参数" style="width: 100px; margin-right: 8px;" />
          <ElButton size="small" type="primary" :icon="RefreshRight" :loading="loading" @click="fetchProcesses">刷新</ElButton>
        </div>
      </div>
    </template>

    <div v-if="loading" class="cp-loading"><ElIcon class="is-loading"><Loading /></ElIcon> 加载中...</div>
    <div v-else-if="!processes.length" class="cp-empty">暂无进程数据</div>
    <ElTable v-else :data="processes" size="small" stripe height="420px">
      <ElTableColumn v-for="col in columns" :key="col.key" :prop="col.key" :label="col.label" :width="col.width" min-width="80" show-overflow-tooltip />
    </ElTable>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElButton, ElDialog, ElIcon, ElInput, ElTable, ElTableColumn } from "element-plus";
import { Loading, RefreshRight } from "@element-plus/icons-vue";
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
const psArgs = ref("aux");
const processes = ref<any[]>([]);
const columns = ref<{ key: string; label: string; width?: string }[]>([]);

const fetchProcesses = async () => {
  loading.value = true;
  try {
    const res = await dockerApi.fetchDockerContainerProcesses(props.connectionId, props.containerId, psArgs.value);
    const data: any = res?.data;
    if (data?.Titles && data?.Processes) {
      columns.value = (data.Titles as string[]).map((t: string) => ({ key: t, label: t }));
      processes.value = (data.Processes as string[][]).map((row: string[]) => {
        const obj: Record<string, string> = {};
        (data.Titles as string[]).forEach((t, i) => { obj[t] = row[i] || ""; });
        return obj;
      });
    } else {
      processes.value = [];
    }
  } catch { processes.value = []; }
  finally { loading.value = false; }
};

watch(() => props.visible, (v) => { if (v) fetchProcesses(); });
</script>

<style scoped>
.cp-header { display: flex; align-items: center; gap: 10px; width: 100%; }
.cp-header__title { font-size: 15px; font-weight: 600; white-space: nowrap; }
.cp-header__subtitle { font-size: 13px; color: var(--el-text-color-secondary); }
.cp-header__right { margin-left: auto; display: flex; align-items: center; }
.cp-loading, .cp-empty { text-align: center; padding: 60px 0; color: var(--el-text-color-secondary); }
</style>
