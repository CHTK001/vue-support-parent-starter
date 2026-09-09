<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import { saveHost, detectHost } from '../api';

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
        <ReDescriptionsItem label="内存">
          <ReTag size="small">{{ formatMem(host.serverHostMemoryMb) }}</ReTag>
        </ReDescriptionsItem>
        <ReDescriptionsItem label="磁盘">
          <ReTag size="small">{{ formatDisk(host.serverHostDiskGb) }}</ReTag>
        </ReDescriptionsItem>
      </ReDescriptions>

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
</style>
