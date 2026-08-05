<template>
  <PanelPage title="告警设置" subtitle="针对 AppKey 的用量/费用/异常告警与通知" :loading="loading">
    <template #actions>
      <el-button v-role="'admin'" type="primary" size="small" plain @click="openCreate">新建规则</el-button>
    </template>

    <el-table :data="rules" stripe>
      <el-table-column prop="name" label="规则名称" min-width="120">
        <template #default="{ row }"><span class="rule-name">{{ row.name }}</span></template>
      </el-table-column>
      <el-table-column label="绑定 AppKey" min-width="130">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.appKeyName || '全部' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型" min-width="90">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ typeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="阈值" min-width="120" align="center">
        <template #default="{ row }">
          <span class="threshold-text">{{ row.threshold }} {{ unitLabel(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="通知渠道" min-width="110">
        <template #default="{ row }">
          <el-tag v-for="ch in row.channels" :key="ch" size="small" effect="plain" class="channel-tag">{{ channelLabel(ch) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="70" align="center">
        <template #default="{ row }">
          <el-switch v-role="'admin'" v-model="row.enabled" size="small" @change="toggleRule(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" align="center">
        <template #default="{ row }">
          <el-button v-role="'admin'" type="primary" size="small" text @click="editRule(row)">编辑</el-button>
          <el-button v-role="'admin'" type="danger" size="small" text @click="deleteRule(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑告警规则' : '新建告警规则'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="规则名称">
          <el-input v-model="form.name" placeholder="如 月度费用预警" />
        </el-form-item>
        <el-form-item label="绑定 AppKey">
          <el-select v-model="form.appKeyId" style="width: 100%">
            <el-option label="全部 AppKey" value="" />
            <el-option v-for="k in allKeys" :key="k.id" :label="k.name" :value="k.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="对话次数" value="chat" />
            <el-option label="Token 用量" value="tokens" />
            <el-option label="费用 (USD)" value="cost" />
            <el-option label="错误率" value="error_rate" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number v-model="form.threshold" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="通知渠道">
          <el-select v-model="form.channels" multiple style="width: 100%">
            <el-option label="邮件" value="email" />
            <el-option label="Webhook" value="webhook" />
            <el-option label="站内信" value="inbox" />
            <el-option label="短信" value="sms" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 告警规则面板
 * 调用 /v2/ai/alerts 与 /v2/ai/app-keys 接口。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { alertsApi, appKeysApi, type Alert, type AppKey } from '../../api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

interface AlertRule extends Omit<Alert, 'channels'> {
  type: 'chat' | 'tokens' | 'cost' | 'error_rate';
  channels: string[];
  appKeyName?: string;
}

const parseTypeFromCondition = (condition: string): AlertRule['type'] => {
  const match = condition?.match(/^(\w+)/);
  if (match) {
    const t = match[1].toLowerCase();
    if (['chat', 'tokens', 'cost', 'error_rate'].includes(t)) return t as AlertRule['type'];
  }
  return 'tokens';
};

const parseChannels = (raw: string | undefined): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return raw ? raw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }
};

const loading = ref(false);
const allKeys = ref<AppKey[]>([]);
const rules = ref<AlertRule[]>([]);
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);
const form = reactive({
  name: '',
  appKeyId: '',
  type: 'tokens' as AlertRule['type'],
  threshold: 100000,
  channels: ['email'] as string[],
  enabled: true,
});

const typeLabel = (t: string) => ({ chat: '对话次数', tokens: 'Token 用量', cost: '费用', error_rate: '错误率' }[t] || t);
const unitLabel = (t: string) => ({ chat: '次', tokens: 'tokens', cost: 'USD', error_rate: '%' }[t] || '');
const channelLabel = (c: string) => ({ email: '邮件', webhook: 'Webhook', inbox: '站内信', sms: '短信' }[c] || c);

const fetchData = async () => {
  loading.value = true;
  try {
    const [alerts, keys] = await Promise.all([alertsApi.list(), appKeysApi.list()]);
    allKeys.value = keys;
    rules.value = (alerts as any[]).map((a) => ({
      ...a,
      type: parseTypeFromCondition(a.condition),
      channels: parseChannels(a.channels),
      appKeyName: keys.find((k) => k.id === a.appKeyId)?.name || '全部',
    }));
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = false;
  editingId.value = 0;
  form.name = '';
  form.appKeyId = '';
  form.type = 'tokens';
  form.threshold = 100000;
  form.channels = ['email'];
  form.enabled = true;
  dialogVisible.value = true;
};

const editRule = (row: AlertRule) => {
  editing.value = true;
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    appKeyId: row.appKeyId,
    type: row.type,
    threshold: row.threshold,
    channels: [...row.channels],
    enabled: row.enabled,
  });
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!form.name.trim()) { ElMessage.warning('请输入规则名称'); return; }
  const payload: any = {
    name: form.name,
    appKeyId: form.appKeyId,
    condition: `${form.type} > ${form.threshold}`,
    enabled: form.enabled,
  };
  try {
    if (editing.value) {
      await alertsApi.update(editingId.value, payload);
      ElMessage.success('已更新');
    } else {
      await alertsApi.create(payload);
      ElMessage.success('已创建');
    }
    dialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error('保存失败');
  }
};

const toggleRule = async (row: AlertRule) => {
  try {
    await alertsApi.toggle(row.id, row.enabled);
    ElMessage.success(`${row.name} 已${row.enabled ? '启用' : '停用'}`);
  } catch {
    row.enabled = !row.enabled;
    ElMessage.error('操作失败');
  }
};

const deleteRule = async (row: AlertRule) => {
  try {
    await ElMessageBox.confirm(`确定删除 "${row.name}" 吗？`, '提示', { type: 'warning' });
    await alertsApi.delete(row.id);
    ElMessage.success('已删除');
    await fetchData();
  } catch {
    // cancelled
  }
};

onMounted(fetchData);
</script>

<style scoped>
.rule-name { font-weight: 500; color: var(--ai-text-primary); }
.threshold-text { font-family: monospace; font-size: 12px; color: var(--ai-text-secondary); }
.channel-tag { margin: 0 2px; }
</style>
