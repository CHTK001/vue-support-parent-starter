<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import ReSectionHead from '@repo/ui/re-section-head';
import ReEmpty from '@repo/ui/re-empty';
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

<!--
  Modernized template（koi 令牌）
  · 视口：#actions（含在离线检测间隔）+ 4 张统计卡（状态 / CPU / 内存 / 磁盘迷你环）
  · 内容：主机信息 / 硬件规格 / 端口扫描 / 系统设置 四张卡片网格
  · 所有绑定（cfgForm / parsedPorts / usageType / networksText / on* 回调）与原模板同名同义
-->
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
        <!-- ===== 区段头部 ===== -->
        <ReSectionHead title="主机详情" :description="`${host.serverHostAddress}:${host.serverHostPort} · ${host.serverHostOsType || '未知系统'}`">
          <template #actions>
            <div class="head-actions">
              <ReButton
                icon="Cpu"
                type="primary"
                size="small"
                :loading="detecting"
                @click="onDetect"
              >重新探测</ReButton>
              <ReButton
                icon="Search"
                type="primary"
                size="small"
                :loading="scanning"
                @click="onScanPorts"
              >扫描端口</ReButton>
            </div>
          </template>
        </ReSectionHead>

        <!-- ===== 统计卡：状态 + CPU / 内存 / 磁盘 迷你环 ===== -->
        <div class="stats-grid">
          <div
            class="stat-card"
            :style="{ '--accent': host.serverHostOnline === 1 ? 'var(--pulse-online)' : host.serverHostOnline === 0 ? 'var(--pulse-offline)' : 'var(--pulse-unknown)' }"
          >
            <div class="stat-label">在线状态</div>
            <div class="stat-value">
              <span
                class="pdot"
                :class="host.serverHostOnline === 1 ? 'pdot-online' : host.serverHostOnline === 0 ? 'pdot-offline' : 'pdot-unknown'"
              />
              {{ host.serverHostOnline === 1 ? '在线' : host.serverHostOnline === 0 ? '离线' : '未知' }}
            </div>
            <div class="stat-trend">
              <ReTag
                v-if="host.serverHostDelayMs !== null && host.serverHostDelayMs !== undefined"
                :type="host.serverHostDelayMs < 0 ? 'danger' : host.serverHostDelayMs <= 50 ? 'success' : 'warning'"
                size="small"
              >{{ host.serverHostDelayMs < 0 ? '不可达' : `${host.serverHostDelayMs} ms` }}</ReTag>
              <span v-else class="muted">延迟未检测</span>
            </div>
          </div>

          <div class="stat-card" style="--accent: var(--metric-cpu)">
            <div class="stat-label">CPU</div>
            <div class="stat-body">
              <div
                class="mini-ring"
                :style="{ '--pct': `${Number(host.serverHostCpuUsage) || 0}%`, '--ring-color': 'var(--metric-cpu)' }"
              >
                <span class="mini-ring__val">{{ host.serverHostCpuUsage === null || host.serverHostCpuUsage === undefined || Number.isNaN(host.serverHostCpuUsage) ? '-' : Math.round(host.serverHostCpuUsage) + '%' }}</span>
              </div>
              <div class="stat-meta">
                <span class="stat-meta__main">{{ host.serverHostCpuCores ?? '-' }} 核</span>
                <span class="stat-meta__sub">{{ usageText(host.serverHostCpuUsage) }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card" style="--accent: var(--metric-mem)">
            <div class="stat-label">内存</div>
            <div class="stat-body">
              <div
                class="mini-ring"
                :style="{ '--pct': `${Number(host.serverHostMemUsage) || 0}%`, '--ring-color': 'var(--metric-mem)' }"
              >
                <span class="mini-ring__val">{{ host.serverHostMemUsage === null || host.serverHostMemUsage === undefined || Number.isNaN(host.serverHostMemUsage) ? '-' : Math.round(host.serverHostMemUsage) + '%' }}</span>
              </div>
              <div class="stat-meta">
                <span class="stat-meta__main">{{ formatMem(host.serverHostMemoryMb) }}</span>
                <span class="stat-meta__sub">{{ usageText(host.serverHostMemUsage) }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card" style="--accent: var(--metric-disk)">
            <div class="stat-label">磁盘</div>
            <div class="stat-body">
              <div
                class="mini-ring"
                :style="{ '--pct': `${Number(host.serverHostDiskUsage) || 0}%`, '--ring-color': 'var(--metric-disk)' }"
              >
                <span class="mini-ring__val">{{ host.serverHostDiskUsage === null || host.serverHostDiskUsage === undefined || Number.isNaN(host.serverHostDiskUsage) ? '-' : Math.round(host.serverHostDiskUsage) + '%' }}</span>
              </div>
              <div class="stat-meta">
                <span class="stat-meta__main">{{ formatDisk(host.serverHostDiskGb) }}</span>
                <span class="stat-meta__sub">{{ usageText(host.serverHostDiskUsage) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 卡片网格 ===== -->
        <div class="card-grid">
          <!-- 主机信息 -->
          <section class="detail-card">
            <header class="detail-card__head">
              <h4 class="detail-card__title">主机信息</h4>
            </header>
            <ReDescriptions :column="2" border size="small" class="detail-card__body">
              <ReDescriptionsItem label="主机名称">{{ host.serverHostName }}</ReDescriptionsItem>
              <ReDescriptionsItem label="主机编码">{{ host.serverHostCode || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="主机地址">{{ host.serverHostAddress }}</ReDescriptionsItem>
              <ReDescriptionsItem label="SSH端口">{{ host.serverHostPort }}</ReDescriptionsItem>
              <ReDescriptionsItem label="系统类型">{{ host.serverHostOsType }}</ReDescriptionsItem>
              <ReDescriptionsItem label="系统版本">{{ host.serverHostOsVersion || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="公网IP">{{ host.serverHostPublicIp || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="内网IP">{{ host.serverHostPrivateIp || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="探针标识">
                <span class="mono-text">{{ host.serverHostAgentKey || '-' }}</span>
              </ReDescriptionsItem>
            </ReDescriptions>
          </section>

          <!-- 硬件规格 -->
          <section class="detail-card">
            <header class="detail-card__head">
              <h4 class="detail-card__title">硬件规格</h4>
              <ReButton icon="Cpu" type="primary" size="small" :loading="detecting" @click="onDetect">重新探测</ReButton>
            </header>
            <ReDescriptions :column="2" border size="small" class="detail-card__body">
              <ReDescriptionsItem label="CPU 核心">{{ host.serverHostCpuCores ?? '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="CPU 使用率">
                <ReTag :type="usageType(host.serverHostCpuUsage)" size="small">{{ usageText(host.serverHostCpuUsage) }}</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="内存">{{ formatMem(host.serverHostMemoryMb) }}</ReDescriptionsItem>
              <ReDescriptionsItem label="内存使用率">
                <ReTag :type="usageType(host.serverHostMemUsage)" size="small">{{ usageText(host.serverHostMemUsage) }}</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="磁盘">{{ formatDisk(host.serverHostDiskGb) }}</ReDescriptionsItem>
              <ReDescriptionsItem label="磁盘使用率">
                <ReTag :type="usageType(host.serverHostDiskUsage)" size="small">{{ usageText(host.serverHostDiskUsage) }}</ReTag>
              </ReDescriptionsItem>
              <ReDescriptionsItem label="GPU 卡数">{{ host.serverHostGpuCount ?? '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="GPU 型号">{{ host.serverHostGpuModel || '-' }}</ReDescriptionsItem>
              <ReDescriptionsItem label="网卡" :span="2">
                <span class="networks-text">{{ networksText }}</span>
              </ReDescriptionsItem>
            </ReDescriptions>
          </section>

          <!-- 端口扫描 -->
          <section class="detail-card">
            <header class="detail-card__head">
              <h4 class="detail-card__title">端口扫描</h4>
              <ReButton icon="Search" type="primary" size="small" :loading="scanning" @click="onScanPorts">扫描端口</ReButton>
            </header>
            <div class="detail-card__body">
              <div v-if="parsedPorts.length" class="detail-ports">
                <ReTag v-for="p in parsedPorts" :key="p.port" type="info" size="small" round class="detail-port-tag">{{ portText(p) }}</ReTag>
              </div>
              <ReEmpty v-else-if="host.serverHostPorts" description="未发现开放端口" :image-size="60" />
              <ReEmpty
                v-else
                :description="host.serverHostLastPortScanTime ? `尚未扫描 · 上次扫描：${host.serverHostLastPortScanTime}` : '尚未扫描，点击「扫描端口」开始'"
                :image-size="60"
              />
            </div>
          </section>

          <!-- 系统设置（本主机） -->
          <section class="detail-card detail-card--config">
            <header class="detail-card__head">
              <h4 class="detail-card__title">系统设置（本主机）</h4>
              <ReButton icon="Check" type="primary" size="small" :loading="saving" @click="onSaveConfig">保存设置</ReButton>
            </header>
            <ReForm label-width="140px" label-position="left" class="detail-card__body cfg-form">
              <div class="cfg-group">
                <span class="cfg-group__title">在离线检测</span>
                <ReFormItem label="启用自动检测">
                  <ReSwitch v-model="cfgForm.serverHostOnlineEnabled" size="small" />
                </ReFormItem>
                <ReFormItem label="检测间隔(秒)">
                  <ReInputNumber v-model="cfgForm.serverHostOnlineInterval" size="small" :min="5" :max="86400" class="cfg-num" />
                </ReFormItem>
              </div>

              <div class="cfg-group">
                <span class="cfg-group__title">硬件采集</span>
                <ReFormItem label="启用采集">
                  <ReSwitch v-model="cfgForm.serverHostCollectEnabled" size="small" />
                </ReFormItem>
                <ReFormItem label="采集方式">
                  <ReSelect v-model="cfgForm.serverHostCollectMode" size="small" :data="collectModes" class="cfg-select" />
                </ReFormItem>
                <ReFormItem label="采集间隔(秒)">
                  <ReInputNumber v-model="cfgForm.serverHostCollectInterval" size="small" :min="10" :max="86400" class="cfg-num" />
                </ReFormItem>
              </div>

              <div class="cfg-group">
                <span class="cfg-group__title">Agent 与远控</span>
                <ReFormItem label="Agent 上报">
                  <ReSwitch v-model="cfgForm.serverHostAgentEnabled" size="small" />
                </ReFormItem>
                <ReFormItem label="启用远控">
                  <ReSwitch v-model="cfgForm.serverHostRemoteEnabled" size="small" />
                </ReFormItem>
              </div>

              <div class="cfg-group">
                <span class="cfg-group__title">延迟检测</span>
                <ReFormItem label="启用延迟检测">
                  <ReSwitch v-model="cfgForm.serverHostDelayEnabled" size="small" />
                </ReFormItem>
                <ReFormItem label="检测间隔(秒)">
                  <ReInputNumber v-model="cfgForm.serverHostDelayInterval" size="small" :min="5" :max="86400" class="cfg-num" />
                </ReFormItem>
                <ReFormItem label="最近延迟">
                  <span v-if="host.serverHostDelayMs !== null && host.serverHostDelayMs >= 0" class="delay-is-ok">{{ host.serverHostDelayMs }} ms</span>
                  <span v-else class="muted">未检测</span>
                </ReFormItem>
              </div>
            </ReForm>
          </section>
        </div>
      </div>

      <!-- 无主机（抽屉已打开但未选中数据） -->
      <ReEmpty v-else description="暂无主机数据" class="detail-empty" />
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
/* ============================================================
   主机详情抽屉：koi 令牌 · 卡片网格 · 迷你环
   —— 无硬编码色值，无 --el-* 直写
   ============================================================ */
.host-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 8px;
}

/* ===== 操作按钮（ReButton 自带 margin: 0 4px，清零后统一走 gap） ===== */
.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.head-actions :deep(.el-button),
.detail-card__head :deep(.el-button) {
  margin: 0;
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--border-default);
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
  min-height: 20px;
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.stat-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-meta__main {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-meta__sub {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ===== 迷你环图（conic-gradient） ===== */
.mini-ring {
  --ring-size: 44px;
  position: relative;
  flex-shrink: 0;
  width: var(--ring-size);
  height: var(--ring-size);
  border-radius: 50%;
  background: conic-gradient(var(--ring-color, var(--brand-500)) var(--pct, 0%), var(--bg-fill) 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内圈挖空 + 数字 */
.mini-ring::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--bg-container);
}

.mini-ring__val {
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* ===== 卡片网格 ===== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  align-items: start;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
}

.detail-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
}

.detail-card--config {
  grid-column: 1 / -1;
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.detail-card__title {
  position: relative;
  margin: 0;
  padding-left: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.detail-card__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: var(--brand-500);
  transform: translateY(-50%);
}

.detail-card__body {
  min-width: 0;
}

/* ===== 描述列表 ===== */
.detail-card :deep(.el-descriptions__label) {
  color: var(--text-secondary);
  font-weight: 500;
  background: var(--bg-fill);
}

.detail-card :deep(.el-descriptions__content) {
  color: var(--text-primary);
  font-weight: 500;
}

.detail-card :deep(.el-descriptions__body) {
  background: transparent;
}

.detail-card :deep(.el-descriptions__cell),
.detail-card :deep(.el-descriptions__table) {
  border-color: var(--border-subtle);
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.networks-text {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-word;
}

.muted {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== 端口标签 ===== */
.detail-ports {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-port-tag {
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-sm) !important;
  margin: 0 !important;
}

/* ===== 系统设置分组 ===== */
.cfg-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.cfg-form :deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-size: 12px;
}

.cfg-group {
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  transition: border-color 0.2s var(--ease-out);
}

.cfg-group:hover {
  border-color: var(--border-default);
}

.cfg-group + .cfg-group {
  margin-top: 12px;
}

.cfg-group__title {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}

.cfg-num {
  width: 160px;
}

.cfg-select {
  width: 200px;
}

.delay-is-ok {
  font-size: 12px;
  font-weight: 600;
  color: var(--status-success);
  font-variant-numeric: tabular-nums;
}

/* ===== 空状态 ===== */
.detail-empty {
  padding: 48px 0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .detail-card--config {
    grid-column: auto;
  }

  .detail-card {
    padding: 14px;
  }

  .stat-card {
    padding: 12px;
  }

  .cfg-form :deep(.el-form-item) {
    flex-direction: column;
    align-items: flex-start;
  }

  .cfg-form :deep(.el-form-item__label) {
    justify-content: flex-start;
    padding-right: 0;
    margin-bottom: 4px;
  }

  .cfg-num,
  .cfg-select {
    width: 100%;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .detail-card,
  .cfg-group {
    animation: none;
    transition: none;
    transform: none;
  }

  .stat-card:hover {
    transform: none;
  }
}
</style>
