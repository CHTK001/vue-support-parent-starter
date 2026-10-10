<template>
  <div class="usage-config">
    <el-alert type="info" :closable="false" show-icon class="usage-intro">
      配置用量记录、定时聚合、时间轮调度与显示单位；保存后实时生效。
    </el-alert>

    <!-- 用量统计 -->
    <SettingsCard title="用量统计">
      <SettingsRow v-for="item in switchItems" :key="item.field"
        :label="item.label" :description="item.desc">
        <el-switch v-model="item.value" />
      </SettingsRow>
    </SettingsCard>

    <!-- 聚合与调度 -->
    <SettingsCard title="聚合与调度">
      <SettingsRow label="定时聚合间隔" description="最小 60 秒，默认 3600（1 小时）" control-width="140">
        <el-input-number v-model="byField('usage_report_interval').value"
          :min="60" :step="60" controls-position="right" />
      </SettingsRow>
      <SettingsRow label="Provider 白名单" description="逗号分隔数据源，留空 = 全部启用" control-width="240">
        <el-input v-model="byField('usage_sync_providers').value" placeholder="留空 = 全部" clearable />
      </SettingsRow>
    </SettingsCard>

    <!-- 单位设置 -->
    <SettingsCard title="单位设置">
      <SettingsRow label="货币单位" description="用量管理页所有费用显示的货币" control-width="200">
        <el-select v-model="byField('usage_currency').value">
          <el-option v-for="opt in byField('usage_currency').options"
            :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="货币自动换算" description="开启后切换货币按汇率换算金额，关闭则仅切换符号">
        <el-switch v-model="byField('usage_currency_auto_convert').value" />
      </SettingsRow>
      <template v-if="byField('usage_currency_auto_convert').value">
        <SettingsRow label="美元汇率 (CNY / USD)" description="1 美元可兑换的人民币数量" control-width="150">
          <el-input-number v-model="byField('usage_rate_usd').value"
            :min="0.01" :step="0.1" :precision="3" controls-position="right" />
        </SettingsRow>
        <SettingsRow label="欧元汇率 (CNY / EUR)" description="1 欧元可兑换的人民币数量" control-width="150">
          <el-input-number v-model="byField('usage_rate_eur').value"
            :min="0.01" :step="0.1" :precision="3" controls-position="right" />
        </SettingsRow>
      </template>
      <SettingsRow label="Token 显示量级" description="自动缩写（K/M/B）或完整数值" control-width="200">
        <el-select v-model="byField('usage_token_scale').value">
          <el-option v-for="opt in byField('usage_token_scale').options"
            :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </SettingsRow>
    </SettingsCard>

    <!-- 数据同步 -->
    <SettingsCard title="数据同步">
      <div class="sync-wrap">
        <el-alert v-if="syncAllProgress.running"
          :title="`全量回填进行中：已处理 ${syncAllProgress.processed} / ${syncAllProgress.total}（${syncAllProgress.percent}%）`"
          :type="syncAllProgress.error ? 'error' : 'info'" :closable="false" show-icon />
        <div class="sync-actions">
          <el-button type="primary" :loading="syncAllLoading" @click="handleSyncAll">
            {{ syncAllProgress.running ? '全量回填进行中…' : '立即全量同步' }}
          </el-button>
          <el-button v-if="syncAllProgress.running" @click="handleCancelSyncAll">取消</el-button>
        </div>
      </div>
    </SettingsCard>

    <div class="actions-bar">
      <el-button @click="load">重置</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { usageApi } from '@/services/javaApi';
import SettingsCard from './SettingsCard.vue';
import SettingsRow from './SettingsRow.vue';

interface SettingSchema {
  field: string;
  label: string;
  valueType: 'BOOLEAN' | 'NUMBER' | 'STRING';
  type: 'switch' | 'number' | 'text' | 'select';
  value: any;
  desc?: string;
  options?: { value: string; label: string }[];
}

const schema = reactive<SettingSchema[]>([
  { field: 'enable_usage_analysis', label: '用量统计开关', valueType: 'BOOLEAN', type: 'switch', value: true, desc: '关闭后跳过定时同步与聚合' },
  { field: 'enable_usage_recorder', label: '会话用量统计开关', valueType: 'BOOLEAN', type: 'switch', value: true, desc: '关闭后不记录每次调用到明细表' },
  { field: 'enable_connector_usage', label: '连接器聊天用量开关', valueType: 'BOOLEAN', type: 'switch', value: false, desc: '开启后连接器 AI 回复计入用量统计' },
  { field: 'usage_timewheel_enabled', label: '后台时间轮调度', valueType: 'BOOLEAN', type: 'switch', value: false, desc: '开启后用量同步改用时间轮调度' },
  { field: 'usage_report_interval', label: '定时聚合间隔', valueType: 'NUMBER', type: 'number', value: 3600 },
  { field: 'usage_sync_providers', label: 'Provider 白名单', valueType: 'STRING', type: 'text', value: '' },
  {
    field: 'usage_currency', label: '货币单位', valueType: 'STRING', type: 'select', value: 'CNY',
    options: [
      { value: 'CNY', label: '人民币 ¥ (CNY)' },
      { value: 'USD', label: '美元 $ (USD)' },
      { value: 'EUR', label: '欧元 € (EUR)' },
    ],
  },
  {
    field: 'usage_token_scale', label: 'Token 显示量级', valueType: 'STRING', type: 'select', value: 'auto',
    options: [
      { value: 'auto', label: '自动缩写（K / M / B）' },
      { value: 'raw', label: '完整数值' },
    ],
  },
  { field: 'usage_currency_auto_convert', label: '货币自动换算', valueType: 'BOOLEAN', type: 'switch', value: true, desc: '开启后切换货币按汇率换算金额' },
  { field: 'usage_rate_usd', label: '美元汇率', valueType: 'NUMBER', type: 'number', value: 7.1 },
  { field: 'usage_rate_eur', label: '欧元汇率', valueType: 'NUMBER', type: 'number', value: 7.8 },
]);

const switchItems = computed(() => schema.filter((i) => i.type === 'switch' && i.field !== 'usage_currency_auto_convert'));
function byField(field: string) {
  return schema.find((i) => i.field === field)!;
}

const saving = ref(false);

function coerce(item: SettingSchema, raw: any) {
  if (item.valueType === 'BOOLEAN') return String(raw) === 'true';
  if (item.valueType === 'NUMBER') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : item.value;
  }
  return raw == null ? '' : String(raw);
}

async function load() {
  try {
    const res = await usageApi.config();
    const list = res?.data || res;
    if (Array.isArray(list)) {
      for (const row of list) {
        const item = schema.find((i) => i.field === row.field);
        if (item) item.value = coerce(item, row.value);
      }
    }
  } catch (e: any) {
    message.error('加载用量配置失败：' + (e?.message || e));
  }
}

async function save() {
  saving.value = true;
  try {
    const fields = schema.map((item) => ({
      field: item.field,
      value: item.value,
      valueType: item.valueType,
      description: item.desc || '',
    }));
    await usageApi.updateConfig({ fields });
    message.success('用量配置已保存');
    await load();
  } catch (e: any) {
    message.error('保存用量配置失败：' + (e?.message || e));
  } finally {
    saving.value = false;
  }
}

// ===== 手动全量同步（SSE） =====
const syncAllLoading = ref(false);
const syncAllProgress = reactive({
  running: false, total: 0, processed: 0, percent: 0, error: '',
});
let es: EventSource | null = null;

function closeEventSource() {
  if (es) {
    es.close();
    es = null;
  }
}

async function handleSyncAll() {
  if (syncAllProgress.running) return;
  syncAllLoading.value = true;
  try {
    await usageApi.syncAll();
    Object.assign(syncAllProgress, {
      running: true, total: 0, processed: 0, percent: 0, error: '',
    });
    closeEventSource();
    es = new EventSource('/v2/usage/task-status/stream');
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.total) syncAllProgress.total = d.total;
        if (d.processed != null) syncAllProgress.processed = d.processed;
        if (d.total) syncAllProgress.percent = Math.min(100, Math.round((d.processed / d.total) * 100));
        if (d.status === 'done' || d.status === 'completed' || d.status === 'cancelled') {
          syncAllProgress.running = false;
          closeEventSource();
          message.success(d.status === 'cancelled' ? '全量回填已取消' : '全量回填完成');
        }
        if (d.status === 'failed' || d.error) {
          syncAllProgress.running = false;
          syncAllProgress.error = d.error || '任务失败';
          closeEventSource();
          message.error('全量回填失败：' + (d.error || ''));
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      if (syncAllProgress.running) {
        syncAllProgress.running = false;
        closeEventSource();
      }
    };
  } catch (e: any) {
    message.error('触发全量同步失败：' + (e?.message || e));
  } finally {
    syncAllLoading.value = false;
  }
}

async function handleCancelSyncAll() {
  try {
    await usageApi.cancelSyncAll();
    message.success('已请求取消全量回填');
  } catch (e: any) {
    message.error('取消失败：' + (e?.message || e));
  }
}

onMounted(load);
onBeforeUnmount(closeEventSource);
</script>

<style scoped>
.usage-intro { margin-bottom: 18px; }

.sync-wrap { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.sync-actions { display: flex; gap: 12px; }

.actions-bar { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
</style>
