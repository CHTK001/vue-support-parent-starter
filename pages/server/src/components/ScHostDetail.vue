<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import { saveHost, detectHost, scanPorts } from '../api';

/**
 * 主机详情抽屉（Sc 项目组件）
 * 基本信息 + 硬件规格（后台探测，只读展示）+ 主机级系统设置。
 */

/** 抽屉可见性（v-model） */
const visible = defineModel<boolean>({ required: true });

const props = defineProps<{ host: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'updated'): void }>();

/** 探测加载态 */
const detecting = ref(false);

/** 系统设置保存态 */
const saving = ref(false);

/** 系统设置表单（主机级） */
const cfgForm = reactive({
  serverHostOnlineEnabled: true,
  serverHostOnlineInterval: 60,
  serverHostCollectEnabled: false,
  serverHostCollectMode: 'SCHEDULED',
  serverHostCollectInterval: 3600,
  serverHostAgentEnabled: false,
  serverHostRemoteEnabled: true,
  serverHostDelayEnabled: false,
  serverHostDelayInterval: 60,
});

/** 采集方式选项 */
const collectModes = [
  { value: 'SCHEDULED', label: '定时 SSH 采集' },
  { value: 'AGENT', label: 'Agent 主动上报' },
  { value: 'HTTP', label: 'HTTP 接口拉取' },
  { value: 'PROMETHEUS', label: 'Prometheus 拉取' },
];

watch(
  () => props.host,
  (h) => {
    if (h) {
      cfgForm.serverHostOnlineEnabled = h.serverHostOnlineEnabled !== 0;
      cfgForm.serverHostOnlineInterval = h.serverHostOnlineInterval ?? 60;
      cfgForm.serverHostCollectEnabled = h.serverHostCollectEnabled === 1;
      cfgForm.serverHostCollectMode = h.serverHostCollectMode || 'SCHEDULED';
      cfgForm.serverHostCollectInterval = h.serverHostCollectInterval ?? 3600;
      cfgForm.serverHostAgentEnabled = h.serverHostAgentEnabled === 1;
      cfgForm.serverHostRemoteEnabled = h.serverHostRemoteEnabled !== 0;
      cfgForm.serverHostDelayEnabled = h.serverHostDelayEnabled === 1;
      cfgForm.serverHostDelayInterval = h.serverHostDelayInterval ?? 60;
    }
  },
  { immediate: true },
);

function formatMem(mb?: number | null): string {
  if (!mb) return '-';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function formatDisk(gb?: number | null): string {
  if (!gb) return '-';
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb} GB`;
}

/**
 * 使用率展示文案（空 显示 未知，非法 显示 未知）
 *
 * @param value 使用率百分比
 * @returns 展示文案
 */
function usageText(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '未知';
  return `${Number(value).toFixed(1)}%`;
}

/**
 * 使用率告警色：>=90 危险，>=70 警告，否则正常
 *
 * @param value 使用率百分比
 * @returns 标签类型
 */
function usageType(value?: number | null): 'danger' | 'warning' | 'success' {
  if (value === null || value === undefined || Number.isNaN(value)) return 'info' as any;
  if (value >= 90) return 'danger';
  if (value >= 70) return 'warning';
  return 'success';
}

/**
 * 网卡信息展示：JSON 数组转 "名称 ip" 列表
 *
 * @returns 展示文案
 */
const networksText = computed(() => {
  const raw = props.host?.serverHostNetworks;
  if (!raw) return '-';
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return '-';
    return arr.map((n: any) => `${n?.name ?? '?'} ${n?.ip ?? ''}`.trim()).join('；');
  } catch {
    return '-';
  }
});

/**
 * 硬件探测：SSH 采集后刷新详情展示
 */
async function onDetect(): Promise<void> {
  if (!props.host?.id) return;
  detecting.value = true;
  try {
    const updated = await detectHost(props.host.id);
    message.success('硬件探测成功');
    emit('updated');
    // 探测结果通过父组件刷新后回传
  } catch (e) {
    message.error((e as Error).message || '硬件探测失败');
  } finally {
    detecting.value = false;
  }
}

/** 端口扫描加载态 */
const scanning = ref(false);

/** 端口扫描结果项 */
interface PortItem {
  port: string;
  protocol?: string;
  service?: string;
}

/** 解析端口扫描 JSON */
const parsedPorts = computed(() => {
  const raw = props.host?.serverHostPorts;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr as PortItem[] : [];
  } catch {
    return [];
  }
});

/** 端口展示文案：22/tcp ssh */
function portText(p: PortItem): string {
  const parts = [`${p.port}${p.protocol ? '/' + p.protocol : ''}`];
  if (p.service) parts.push(p.service);
  return parts.join(' ');
}

/**
 * 端口扫描（Rust 原生实现，全量 TCP 扫描）
 */
async function onScanPorts(): Promise<void> {
  if (!props.host?.id) return;
  scanning.value = true;
  message.info('正在扫描端口，全量扫描可能需要几分钟 …', { duration: 0 });
  try {
    const updated = await scanPorts(props.host.id);
    message.closeAll();
    message.success(updated?.msg || '端口扫描完成');
    emit('updated');
  } catch (e) {
    message.closeAll();
    message.error((e as Error).message || '端口扫描失败');
  } finally {
    scanning.value = false;
  }
}

/**
 * 保存主机级系统设置
 */
async function onSaveConfig(): Promise<void> {
  if (!props.host?.id) return;
  saving.value = true;
  try {
    await saveHost(props.host.id, {
      serverHostOnlineEnabled: cfgForm.serverHostOnlineEnabled ? 1 : 0,
      serverHostOnlineInterval: cfgForm.serverHostOnlineInterval,
      serverHostCollectEnabled: cfgForm.serverHostCollectEnabled ? 1 : 0,
      serverHostCollectMode: cfgForm.serverHostCollectMode,
      serverHostCollectInterval: cfgForm.serverHostCollectInterval,
      serverHostAgentEnabled: cfgForm.serverHostAgentEnabled ? 1 : 0,
      serverHostRemoteEnabled: cfgForm.serverHostRemoteEnabled ? 1 : 0,
      serverHostDelayEnabled: cfgForm.serverHostDelayEnabled ? 1 : 0,
      serverHostDelayInterval: cfgForm.serverHostDelayInterval,
    });
    message.success('系统设置已保存，采集/检测已动态调整');
    emit('updated');
  } catch (e) {
    message.error((e as Error).message || '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="`主机详情 - ${host?.serverHostName || ''}`"
    :size="640"
    direction="rtl"
    close-only
    :footer-hidden="true"
  >
    <template #content>
      <div v-if="host" class="host-detail">
      <!-- 基本信息 -->
      <ReDescriptions :column="2" border size="small">
        <ReDescriptionsItem label="主机名称">{{ host.serverHostName }}</ReDescriptionsItem>
        <ReDescriptionsItem label="主机编码">{{ host.serverHostCode || '-' }}</ReDescriptionsItem>
        <ReDescriptionsItem label="主机地址">{{ host.serverHostAddress }}</ReDescriptionsItem>
        <ReDescriptionsItem label="SSH端口">{{ host.serverHostPort }}</ReDescriptionsItem>
        <ReDescriptionsItem label="系统类型">{{ host.serverHostOsType }}</ReDescriptionsItem>
        <ReDescriptionsItem label="系统版本">{{ host.serverHostOsVersion || '-' }}</ReDescriptionsItem>
        <ReDescriptionsItem label="在线状态">
          <ReTag :type="host.serverHostOnline === 1 ? 'success' : host.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ host.serverHostOnline === 1 ? '在线' : host.serverHostOnline === 0 ? '离线' : '未知' }}
          </ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="最近延迟">
          <ReTag v-if="host.serverHostDelayMs === null || host.serverHostDelayMs === undefined" size="small" type="info">未检测</ReTag>
          <ReTag v-else :type="host.serverHostDelayMs < 0 ? 'danger' : host.serverHostDelayMs <= 50 ? 'success' : 'warning'" size="small">
            {{ host.serverHostDelayMs < 0 ? '不可达' : `${host.serverHostDelayMs} ms` }}
          </ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="公网IP">{{ host.serverHostPublicIp || '-' }}</ReDescriptionsItem>
        <ReDescriptionsItem label="内网IP">{{ host.serverHostPrivateIp || '-' }}</ReDescriptionsItem>
        <ReDescriptionsItem label="探针标识">
          <ReText size="small" type="info">{{ host.serverHostAgentKey || '-' }}</ReText>
        </ReDescriptionsItem>
      </ReDescriptions>

      <!-- 硬件规格：后台探测结果，只读展示 -->
      <ReDivider content-position="left">
        硬件规格
        <ReButton show-text icon="Cpu" type="primary" size="small" :loading="detecting" @click="onDetect">重新探测</ReButton>
      </ReDivider>
      <ReDescriptions :column="3" border size="small">
        <ReDescriptionsItem label="CPU 核心">
          <ReTag size="small">{{ host.serverHostCpuCores ?? '-' }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="CPU 使用率">
          <ReTag size="small" :type="usageType(host.serverHostCpuUsage)">{{ usageText(host.serverHostCpuUsage) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="内存">
          <ReTag size="small">{{ formatMem(host.serverHostMemoryMb) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="内存使用率">
          <ReTag size="small" :type="usageType(host.serverHostMemUsage)">{{ usageText(host.serverHostMemUsage) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="磁盘">
          <ReTag size="small">{{ formatDisk(host.serverHostDiskGb) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="磁盘使用率">
          <ReTag size="small" :type="usageType(host.serverHostDiskUsage)">{{ usageText(host.serverHostDiskUsage) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="GPU 卡数">
          <ReTag size="small">{{ host.serverHostGpuCount ?? '-' }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="GPU 型号">
          <ReText size="small" type="info">{{ host.serverHostGpuModel || '-' }}</ReText>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="网卡">
          <ReText size="small" type="info">{{ networksText }}</ReText>
        </ReDescriptionsItem>
      </ReDescriptions>

      <!-- 端口扫描结果 -->
      <ReDivider content-position="left">
        端口扫描
        <ReButton show-text icon="Search" type="primary" size="small" :loading="scanning" @click="onScanPorts">扫描端口</ReButton>
      </ReDivider>
      <div v-if="parsedPorts.length" class="detail-ports">
        <ReTag
          v-for="p in parsedPorts"
          :key="p.port"
          size="small"
          type="info"
          class="detail-port-tag"
        >{{ portText(p) }}</ReTag>
      </div>
      <ReText v-else-if="host.serverHostPorts" size="small" type="info">未发现开放端口</ReText>
      <ReText v-else size="small" type="info">
        尚未扫描（{{ host.serverHostLastPortScanTime ? '上次扫描：' + host.serverHostLastPortScanTime : '点击右上角扫描' }}）
      </ReText>

      <!-- 主机级系统设置 -->
      <ReDivider content-position="left">系统设置（本主机）</ReDivider>
      <ReForm label-width="140px" label-position="left">
        <ReDivider content-position="left">在离线检测</ReDivider>
        <ReFormItem label="启用自动检测">
          <ReSwitch v-model="cfgForm.serverHostOnlineEnabled" />
        </ReFormItem>
        <ReFormItem label="检测间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostOnlineInterval" :min="5" :max="86400" style="width: 180px" />
        </ReFormItem>

        <ReDivider content-position="left">硬件采集</ReDivider>
        <ReFormItem label="启用采集">
          <ReSwitch v-model="cfgForm.serverHostCollectEnabled" />
        </ReFormItem>
        <ReFormItem label="采集方式">
          <ReSelect v-model="cfgForm.serverHostCollectMode" :data="collectModes" style="width: 220px" />
        </ReFormItem>
        <ReFormItem label="采集间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostCollectInterval" :min="10" :max="86400" style="width: 180px" />
        </ReFormItem>

        <ReDivider content-position="left">Agent 与远控</ReDivider>
        <ReFormItem label="Agent 上报">
          <ReSwitch v-model="cfgForm.serverHostAgentEnabled" />
        </ReFormItem>
        <ReFormItem label="启用远控">
          <ReSwitch v-model="cfgForm.serverHostRemoteEnabled" />
        </ReFormItem>

        <ReDivider content-position="left">延迟检测</ReDivider>
        <ReFormItem label="启用延迟检测">
          <ReSwitch v-model="cfgForm.serverHostDelayEnabled" />
        </ReFormItem>
        <ReFormItem label="检测间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostDelayInterval" :min="5" :max="86400" style="width: 180px" />
        </ReFormItem>
        <ReFormItem label="最近延迟">
          <ReText v-if="host.serverHostDelayMs !== null && host.serverHostDelayMs >= 0" type="primary" size="small">
            {{ host.serverHostDelayMs }} ms
          </ReText>
          <ReText v-else type="info" size="small">未检测</ReText>
        </ReFormItem>

        <ReFormItem>
          <ReButton show-text icon="Check" type="primary" :loading="saving" @click="onSaveConfig">保存设置</ReButton>
        </ReFormItem>
      </ReForm>
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.host-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.detail-ports {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-port-tag {
  font-variant-numeric: tabular-nums;
}
</style>
