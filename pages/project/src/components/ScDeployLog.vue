<script setup lang="ts">
/**
 * 部署日志抽屉（展示项目的操作历史）
 * 组件约定：全量使用 Re 组件体系。
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { getDeployLogs } from '../api';

const props = defineProps<{ visible: boolean; projectId: number | null; projectName: string }>();
const emit = defineEmits<{ 'update:visible': [v: boolean] }>();

/**
 * ReDrawer 的 v-model 契约是 `modelValue`（内部 `defineModel<boolean>()`），不是 `visible`。
 * `v-model="props.visible"` 会导致关闭无法回写父组件 → 抽屉第二次打不开、日志不刷新。
 * 用 computed 代理双向桥接。
 */
const drawerVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

const logs = ref<any[]>([]);
const loading = ref(false);
const actionFilter = ref('');

const actionFilters = [
  { label: '全部', value: '' },
  { label: '部署', value: 'DEPLOY' },
  { label: '升级', value: 'UPGRADE' },
  { label: '启动', value: 'START' },
  { label: '停止', value: 'STOP' },
];

watch(() => props.visible, v => { if (v && props.projectId) load(); });

/**
 * ⚠️ 必须补 onMounted：父组件（`ScProjectList.openDeployLog`）在**同一个 tick** 里
 * 同时置 `deployLogProject`（触发 `v-if` 挂载）与 `deployLogVisible = true`，
 * 所以本组件**挂载时 `props.visible` 已经是 true** → 上面的 watch 不产生变化、永不触发
 * → 表现为「第一次打开部署日志抽屉，列表恒为空（只有空态）」，关掉再开才加载。
 * 注意这类缺陷不会被「开→关→再开」的验收发现 —— 它只看抽屉有没有打开。
 */
onMounted(() => { if (props.visible && props.projectId) load(); });

async function load() {
  if (!props.projectId) return;
  loading.value = true;
  try {
    logs.value = await getDeployLogs(props.projectId, actionFilter.value || undefined);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function statusClass(s: string) {
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAIL') return 'danger';
  if (s === 'RUNNING') return 'warning';
  return 'info';
}
function statusLabel(s: string) {
  if (s === 'SUCCESS') return '成功';
  if (s === 'FAIL') return '失败';
  if (s === 'RUNNING') return '进行中';
  return s;
}
function actionLabel(a: string) {
  const map: Record<string, string> = { DEPLOY: '部署', UPGRADE: '升级', START: '启动', STOP: '停止', RESTART: '重启' };
  return map[a] || a;
}
function fmtTime(v: string | null) {
  return v || '-';
}
function fmtCost(ms: number | null) {
  if (ms == null) return '-';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}

const outputVisible = ref(false);
const selectedOutput = ref<{ text: string; error: string | null }>({ text: '', error: null });

function showOutput(row: any) {
  selectedOutput.value = { text: row.msProjectDeployLogOutput || '(无输出)', error: row.msProjectDeployLogError };
  outputVisible.value = true;
}
</script>

<template>
  <ReDrawer
    v-model="drawerVisible"
    :title="`${props.projectName} - 部署日志`"
    :size="680"
  >
    <div style="padding:0 4px">
      <div style="display:flex;gap:8px;margin-bottom:14px;align-items:center">
        <ReRadioGroup v-model="actionFilter" size="small" @change="load">
          <ReRadioButton v-for="f in actionFilters" :key="f.value" :value="f.value">{{ f.label }}</ReRadioButton>
        </ReRadioGroup>
        <ReButton icon="Refresh" :show-text="false" title="刷新" size="small" @click="load" />
      </div>

      <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-tertiary)">加载中...</div>

      <div v-else-if="logs.length===0" class="empty-state" style="padding:32px">
        <div class="empty-ico">📋</div>
        <div class="empty-text">暂无操作日志</div>
      </div>

      <ReTable v-else :data="logs" stripe size="small"
        :pagination="false" :toolbar="false" empty-text="暂无操作日志">
        <ReTableColumn label="操作" width="80">
          <template #default="{ row }">
            <ReTag size="small" type="info">{{ actionLabel(row.msProjectDeployLogAction) }}</ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="主机" prop="msProjectDeployLogHostName" min-width="110" show-overflow-tooltip />
        <ReTableColumn label="版本" prop="msProjectDeployLogVersion" min-width="100" show-overflow-tooltip />
        <ReTableColumn label="状态" width="80">
          <template #default="{ row }">
            <ReTag :type="statusClass(row.msProjectDeployLogStatus)" size="small">
              {{ statusLabel(row.msProjectDeployLogStatus) }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="耗时" width="70">
          <template #default="{ row }">
            <span class="dim">{{ fmtCost(row.msProjectDeployLogCostMs) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="时间" width="160">
          <template #default="{ row }">
            <span class="dim">{{ fmtTime(row.msProjectDeployLogStartTime) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="输出" width="60" fixed="right">
          <template #default="{ row }">
            <ReButton link icon="View" :show-text="false" title="查看输出" @click="showOutput(row)" />
          </template>
        </ReTableColumn>
      </ReTable>
    </div>

    <!-- 输出详情抽屉 -->
    <ReDrawer v-model="outputVisible" title="执行输出" :size="540">
      <div class="log-output">{{ selectedOutput.text }}</div>
      <div v-if="selectedOutput.error" class="log-output log-error" style="margin-top:12px">{{ selectedOutput.error }}</div>
    </ReDrawer>
  </ReDrawer>
</template>

<style scoped>
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-tertiary);
}
.empty-ico { font-size: 32px; opacity: 0.4; }
.log-output {
  max-height: 400px; overflow: auto; padding: 12px;
  font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; line-height: 1.6;
  color: var(--text-primary); background: color-mix(in srgb, var(--bg-page) 70%, #000 12%);
  border: 1px solid var(--border-subtle); border-radius: 8px; white-space: pre-wrap; word-break: break-all;
}
.log-error { color: var(--status-error); }
.dim { color: var(--text-tertiary); }
</style>