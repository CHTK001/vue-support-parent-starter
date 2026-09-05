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
    ElMessage.success('系统设置已保存，采集/检测已动态调整');
    emit('updated');
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败');
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
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="主机名称">{{ host.serverHostName }}</el-descriptions-item>
        <el-descriptions-item label="主机编码">{{ host.serverHostCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="主机地址">{{ host.serverHostAddress }}</el-descriptions-item>
        <el-descriptions-item label="SSH端口">{{ host.serverHostPort }}</el-descriptions-item>
        <el-descriptions-item label="系统类型">{{ host.serverHostOsType }}</el-descriptions-item>
        <el-descriptions-item label="系统版本">{{ host.serverHostOsVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">
          <el-tag :type="host.serverHostOnline === 1 ? 'success' : host.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ host.serverHostOnline === 1 ? '在线' : host.serverHostOnline === 0 ? '离线' : '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="公网IP">{{ host.serverHostPublicIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内网IP">{{ host.serverHostPrivateIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="探针标识">
          <el-text size="small" type="info">{{ host.serverHostAgentKey || '-' }}</el-text>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 硬件规格：后台探测结果，只读展示 -->
      <el-divider content-position="left">
        硬件规格
        <ReButton layout="square" icon="Cpu" type="primary" size="small" :loading="detecting" @click="onDetect">重新探测</ReButton>
      </el-divider>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="CPU 核心">
          <el-tag size="small">{{ host.serverHostCpuCores ?? '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="内存">
          <el-tag size="small">{{ formatMem(host.serverHostMemoryMb) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="磁盘">
          <el-tag size="small">{{ formatDisk(host.serverHostDiskGb) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 主机级系统设置 -->
      <el-divider content-position="left">系统设置（本主机）</el-divider>
      <el-form label-width="140px" label-position="left">
        <el-divider content-position="left">在离线检测</el-divider>
        <el-form-item label="启用自动检测">
          <el-switch v-model="cfgForm.serverHostOnlineEnabled" />
        </el-form-item>
        <el-form-item label="检测间隔(秒)">
          <el-input-number v-model="cfgForm.serverHostOnlineInterval" :min="5" :max="86400" style="width: 180px" />
        </el-form-item>

        <el-divider content-position="left">硬件采集</el-divider>
        <el-form-item label="启用采集">
          <el-switch v-model="cfgForm.serverHostCollectEnabled" />
        </el-form-item>
        <el-form-item label="采集方式">
          <ReSelect v-model="cfgForm.serverHostCollectMode" style="width: 220px">
            <el-option v-for="m in collectModes" :key="m.value" :label="m.label" :value="m.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="采集间隔(秒)">
          <el-input-number v-model="cfgForm.serverHostCollectInterval" :min="10" :max="86400" style="width: 180px" />
        </el-form-item>

        <el-divider content-position="left">Agent 与远控</el-divider>
        <el-form-item label="Agent 上报">
          <el-switch v-model="cfgForm.serverHostAgentEnabled" />
        </el-form-item>
        <el-form-item label="启用远控">
          <el-switch v-model="cfgForm.serverHostRemoteEnabled" />
        </el-form-item>

        <el-form-item>
          <ReButton layout="square" icon="Check" type="primary" :loading="saving" @click="onSaveConfig">保存设置</ReButton>
        </el-form-item>
      </el-form>
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
.host-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
}
</style>
