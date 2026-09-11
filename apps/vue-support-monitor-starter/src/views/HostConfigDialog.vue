<script setup lang="ts">
/**
 * 主机「更多」配置弹窗（表格行操作入口）
 * mode:
 *  - online —— 在离线检测（serverHostOnlineEnabled / serverHostOnlineInterval）
 *  - metric —— 指标采集（serverHostCollectMode / serverHostCollectInterval / serverHostAgentEnabled）
 *  - delay  —— 延迟检测（serverHostDelayEnabled / serverHostDelayInterval，RTT 由后台 delayTick 回写）
 * 三类检测均由后台 HostOnlineScheduler 驱动，保存走 saveHost。
 */
import { ref, computed, watch } from "vue";
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
  serverHostDelayEnabled?: number;
  serverHostDelayInterval?: number;
  serverHostDelayMs?: number | null;
  serverHostLastDelayTime?: string | null;
}

type Mode = "online" | "metric" | "delay";
const MODE_TITLE: Record<Mode, string> = {
  online: "在离线检测",
  metric: "指标采集",
  delay: "延迟检测",
};

const props = defineProps<{
  modelValue: boolean;
  host: Host | null;
  mode: Mode;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

const saving = ref(false);
const form = ref({
  // 在离线
  serverHostOnlineEnabled: 1,
  serverHostOnlineInterval: 60,
  // 指标
  serverHostCollectMode: "SCHEDULED",
  serverHostCollectInterval: 3600,
  serverHostAgentEnabled: 0,
  // 延迟
  serverHostDelayEnabled: 1,
  serverHostDelayInterval: 60,
});

/** 当前延迟（只读展示，后台 delayTick 回写） */
const lastDelayMs = ref<number | null | undefined>(undefined);

const collectModes = [
  { label: "定时采集", value: "SCHEDULED" },
  { label: "Agent采集", value: "AGENT" },
  { label: "HTTP采集", value: "HTTP" },
  { label: "Prometheus采集", value: "PROMETHEUS" },
];

const title = computed(() => `${MODE_TITLE[props.mode]} · ${props.host?.serverHostName ?? ""}`);

function fillFrom(source: Partial<Host>): void {
  form.value = {
    serverHostOnlineEnabled: source.serverHostOnlineEnabled ?? 1,
    serverHostOnlineInterval: source.serverHostOnlineInterval ?? 60,
    serverHostCollectMode: source.serverHostCollectMode || "SCHEDULED",
    serverHostCollectInterval: source.serverHostCollectInterval ?? 3600,
    serverHostAgentEnabled: source.serverHostAgentEnabled ?? 0,
    serverHostDelayEnabled: source.serverHostDelayEnabled ?? 1,
    serverHostDelayInterval: source.serverHostDelayInterval ?? 60,
  };
  lastDelayMs.value = source.serverHostDelayMs;
}

watch(() => [props.modelValue, props.mode] as const, async ([v]) => {
  if (!v || !props.host) return;
  // 行数据先填充；详情接口返回后覆盖为最新值
  fillFrom(props.host);
  lastDelayMs.value = props.host.serverHostDelayMs;
  try {
    const full = (await getHost(props.host.id)) as Partial<Host> | undefined;
    if (full && props.modelValue) fillFrom(full);
  } catch { /* 保留行数据 */ }
});

async function save(): Promise<void> {
  if (!props.host) return;
  saving.value = true;
  try {
    await saveHost(props.host.id, { ...props.host, ...form.value } as Partial<Host>);
    ElMessage.success(`${MODE_TITLE[props.mode]}已保存`);
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
  <ReDialog :model-value="props.modelValue" @update:model-value="emit('update:modelValue', $event)" :title="title" width="420px" :close-on-click-modal="false">
    <ReForm v-if="props.mode === 'online'" :model="form" label-position="top">
      <ReFormItem label="在离线检测">
        <ReSwitch layout="square" v-model="form.serverHostOnlineEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
      <ReFormItem label="检测间隔(秒)">
        <ReInputNumber v-model="form.serverHostOnlineInterval" :min="10" :max="3600" :step="10" style="width:100%" />
      </ReFormItem>
      <p class="hint">后台按间隔 TCP 探测主机端口，不可达自动标记离线。</p>
    </ReForm>

    <ReForm v-else-if="props.mode === 'metric'" :model="form" label-position="top">
      <ReFormItem label="采集方式">
        <ReSelect v-model="form.serverHostCollectMode" size="small" style="width:100%" :options="collectModes" />
      </ReFormItem>
      <ReFormItem label="采集间隔(秒)">
        <ReInputNumber v-model="form.serverHostCollectInterval" :min="60" :max="86400" :step="60" style="width:100%" />
      </ReFormItem>
      <ReFormItem v-if="form.serverHostCollectMode === 'AGENT'" label="Agent上报">
        <ReSwitch layout="square" v-model="form.serverHostAgentEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
      <p class="hint">后台按采集方式（定时/Agent/HTTP/Prometheus）周期抓取主机硬件指标。</p>
    </ReForm>

    <ReForm v-else :model="form" label-position="top">
      <ReFormItem label="延迟检测">
        <ReSwitch layout="square" v-model="form.serverHostDelayEnabled" :active-value="1" :inactive-value="0" />
      </ReFormItem>
      <ReFormItem label="检测间隔(秒)">
        <ReInputNumber v-model="form.serverHostDelayInterval" :min="10" :max="3600" :step="10" style="width:100%" />
      </ReFormItem>
      <ReFormItem label="最近延迟">
        <div class="delay-view">
          <b v-if="lastDelayMs == null">—</b>
          <b v-else-if="lastDelayMs < 0" class="bad">不可达</b>
          <b v-else>{{ lastDelayMs }} ms</b>
          <span v-if="props.host?.serverHostLastDelayTime" class="dim">（{{ props.host.serverHostLastDelayTime }}）</span>
        </div>
      </ReFormItem>
      <p class="hint">后台按间隔 TCP 建连测 RTT，结果回写「最近延迟」列。</p>
    </ReForm>

    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton type="primary" :loading="saving" icon="Check" :show-text="true" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
.hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-tertiary, #9aa0b4);
  line-height: 1.5;
}
.delay-view {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}
.delay-view .bad {
  color: var(--danger, #f56c6c);
}
.delay-view .dim {
  color: var(--text-tertiary, #9aa0b4);
  font-size: 12px;
}
</style>
