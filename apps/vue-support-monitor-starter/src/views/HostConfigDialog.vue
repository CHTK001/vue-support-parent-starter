<script setup lang="ts">
/**
 * 主机采集配置弹窗（表格行操作「更多」入口）
 * 硬件采集与检测：采集方式/采集间隔/在离线检测/检测间隔/远控开关/Agent上报
 */
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import { saveHost, getHost } from "@pages/server/src/api";
/** 主机字段（与 AssetsView.Host 保持一致——跨 .vue 文件类型导入解析不可靠，独立声明） */
interface Host {
  id: number;
  serverHostName: string;
  serverHostCollectMode?: string;
  serverHostCollectInterval?: number;
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostAgentEnabled?: number;
  serverHostRemoteEnabled?: number;
}

const props = defineProps<{
  modelValue: boolean;
  host: Host | null;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

const saving = ref(false);
const form = ref<{
  serverHostCollectMode: string;
  serverHostCollectInterval: number;
  serverHostOnlineEnabled: number;
  serverHostOnlineInterval: number;
  serverHostRemoteEnabled: number;
  serverHostAgentEnabled: number;
}>({
  serverHostCollectMode: "SCHEDULED",
  serverHostCollectInterval: 3600,
  serverHostOnlineEnabled: 1,
  serverHostOnlineInterval: 60,
  serverHostRemoteEnabled: 1,
  serverHostAgentEnabled: 0,
});

const collectModes = [
  { label: "定时采集", value: "SCHEDULED" },
  { label: "Agent采集", value: "AGENT" },
  { label: "HTTP采集", value: "HTTP" },
  { label: "Prometheus采集", value: "PROMETHEUS" },
];

watch(() => props.modelValue, async (v) => {
  if (!v || !props.host) return;
  // 行数据先填充；详情接口返回后覆盖为最新值
  form.value = {
    serverHostCollectMode: props.host.serverHostCollectMode || "SCHEDULED",
    serverHostCollectInterval: props.host.serverHostCollectInterval ?? 3600,
    serverHostOnlineEnabled: props.host.serverHostOnlineEnabled ?? 1,
    serverHostOnlineInterval: props.host.serverHostOnlineInterval ?? 60,
    serverHostRemoteEnabled: props.host.serverHostRemoteEnabled ?? 1,
    serverHostAgentEnabled: props.host.serverHostAgentEnabled ?? 0,
  };
  try {
    const full = (await getHost(props.host.id)) as Partial<Host> | undefined;
    if (full && props.modelValue) {
      form.value = {
        serverHostCollectMode: full.serverHostCollectMode || "SCHEDULED",
        serverHostCollectInterval: full.serverHostCollectInterval ?? 3600,
        serverHostOnlineEnabled: full.serverHostOnlineEnabled ?? 1,
        serverHostOnlineInterval: full.serverHostOnlineInterval ?? 60,
        serverHostRemoteEnabled: full.serverHostRemoteEnabled ?? 1,
        serverHostAgentEnabled: full.serverHostAgentEnabled ?? 0,
      };
    }
  } catch { /* 保留行数据 */ }
});

async function save(): Promise<void> {
  if (!props.host) return;
  saving.value = true;
  try {
    await saveHost(props.host.id, { ...props.host, ...form.value } as Partial<Host>);
    ElMessage.success("采集配置已保存");
    emit("update:modelValue", false);
    emit("saved");
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDialog :model-value="props.modelValue" @update:model-value="emit('update:modelValue', $event)" :title="'采集配置 · ' + (props.host?.serverHostName ?? '')" width="440px" :close-on-click-modal="false">
    <ReForm :model="form" label-position="top">
      <ReFormItem label="采集方式">
        <ReSelect v-model="form.serverHostCollectMode" size="small" style="width:100%" :options="collectModes" />
      </ReFormItem>
      <ReFormItem label="采集间隔(秒)">
        <ReInputNumber v-model="form.serverHostCollectInterval" :min="60" :max="86400" :step="60" style="width:100%" />
      </ReFormItem>
      <ReFormItem label="在离线检测">
        <ReSwitch layout="square" v-model="form.serverHostOnlineEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
      <ReFormItem label="检测间隔(秒)">
        <ReInputNumber v-model="form.serverHostOnlineInterval" :min="10" :max="3600" :step="10" style="width:100%" />
      </ReFormItem>
      <ReFormItem label="远控开关">
        <ReSwitch layout="square" v-model="form.serverHostRemoteEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
      <ReFormItem v-if="form.serverHostCollectMode === 'AGENT'" label="Agent上报">
        <ReSwitch layout="square" v-model="form.serverHostAgentEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton type="primary" :loading="saving" icon="Check" :show-text="true" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>
