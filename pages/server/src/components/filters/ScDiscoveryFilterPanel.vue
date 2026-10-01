<script setup lang="ts">
/**
 * ServerFilter 专用配置面板 —— ServiceDiscoveryServerFilter（服务发现）。
 *
 * 除了参数分区，还提供「服务实例（实时查询）」视图：走该插件自己的接口
 * /ms/monitor/discovery/{protocols,services}，与参数表单解耦，可反复查询。
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import {
  queryDiscoveryInstances,
  listDiscoveryProtocols,
  type DiscoveryInstance,
  type FilterTypeMeta,
  type FilterParamSchema,
} from '../../api';
import ScFilterFieldRow from './ScFilterFieldRow.vue';

const props = defineProps<{
  /** 插件元数据 */
  meta: FilterTypeMeta | null;
  /** 该实例的过滤器类型 */
  filterType: string;
  /** 当前参数（v-model） */
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
}>();

/** 参数分区（字段名来自后端 schema） */
const SECTIONS: Array<{ title: string; keys: string[] }> = [
  { title: '发现源', keys: ['discoveryName', 'scatterId', 'protocol'] },
  { title: '路由与负载', keys: ['routes', 'balance', 'excludeServerId'] },
];

const schema = computed(() => props.meta?.params ?? []);
const groupedKeys = computed(() => new Set(SECTIONS.flatMap(s => s.keys)));

function fieldsOf(keys: string[]): FilterParamSchema[] {
  return keys
    .map(k => schema.value.find(f => f.name === k))
    .filter((f): f is FilterParamSchema => Boolean(f));
}

const restFields = computed(() => schema.value.filter(f => !groupedKeys.value.has(f.name)));

function set(name: string, value: string) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}

// ===== 实时实例查询 =====

/** 可选发现协议 */
const discoveryProtocols = ref<string[]>([]);
/** 查询协议 */
const discoveryProtocol = ref('');
/** 查询服务标识 */
const discoveryUriSpec = ref('');
/** 查询中 */
const discoveryLoading = ref(false);
/** 查询结果 */
const discoveryInstances = ref<DiscoveryInstance[]>([]);
/** 结果说明（未启用 / 参数缺失等） */
const discoveryMessage = ref('');

/** 拉取已启用协议 */
async function loadDiscoveryProtocols() {
  try {
    discoveryProtocols.value = (await listDiscoveryProtocols()) ?? [];
    if (!discoveryProtocol.value && discoveryProtocols.value.length) {
      discoveryProtocol.value = discoveryProtocols.value[0];
    }
  } catch {
    discoveryProtocols.value = [];
  }
}

/** 默认取 routes 参数里第一个 `name=uri` 的服务标识 */
function syncUriSpecFromRoutes() {
  const routes = props.modelValue?.routes;
  if (!routes) return;
  const first = String(routes).split(/[,;\n]/).map(s => s.trim()).filter(Boolean)[0];
  if (!first) return;
  const idx = first.indexOf('=');
  if (idx > 0 && idx < first.length - 1) {
    discoveryUriSpec.value = first.substring(idx + 1).trim();
  }
}

/** 按协议 + 服务标识查询实例 */
async function loadDiscoveryInstances() {
  if (!discoveryProtocol.value && !discoveryUriSpec.value.trim()) {
    message.warning('请至少填写发现协议或服务标识');
    return;
  }
  discoveryLoading.value = true;
  try {
    const result = await queryDiscoveryInstances(
      discoveryProtocol.value || undefined,
      discoveryUriSpec.value.trim() || undefined,
    );
    discoveryInstances.value = result?.instances ?? [];
    discoveryMessage.value = result?.message ?? '';
    if (!discoveryInstances.value.length && discoveryMessage.value && discoveryMessage.value !== 'ok') {
      message.info(discoveryMessage.value);
    }
  } catch (e) {
    discoveryInstances.value = [];
    message.error((e as Error).message);
  } finally {
    discoveryLoading.value = false;
  }
}

onMounted(() => {
  loadDiscoveryProtocols();
  syncUriSpecFromRoutes();
});

// routes 变化时同步服务标识（仅在当前值为空或与上一次推导不同时覆盖）
watch(
  () => props.modelValue?.routes,
  () => syncUriSpecFromRoutes(),
);
</script>

<template>
  <div class="fc-panels">
    <div v-for="section in SECTIONS" :key="section.title" class="fc-section panel">
      <div class="fc-section-title">{{ section.title }}</div>
      <div class="fc-grid">
        <ScFilterFieldRow
          v-for="field in fieldsOf(section.keys)"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </div>
    </div>

    <div v-if="restFields.length" class="fc-section panel">
      <div class="fc-section-title">其它参数</div>
      <div class="fc-grid">
        <ScFilterFieldRow
          v-for="field in restFields"
          :key="field.name"
          :field="field"
          :value="modelValue?.[field.name]"
          @update="(v: string) => set(field.name, v)"
        />
      </div>
    </div>

    <div class="fc-section panel">
      <div class="fc-section-title">服务实例（实时查询）</div>
      <div class="fc-query">
        <ReSelect
          v-model="discoveryProtocol"
          placeholder="发现协议"
          clearable
          :data="discoveryProtocols.map(p => ({ label: p, value: p }))"
          style="width: 160px"
        />
        <ReInput
          v-model="discoveryUriSpec"
          placeholder="服务标识（如 order-service）"
          clearable
          style="width: 240px"
        />
        <ReButton show-text icon="Search" :loading="discoveryLoading" @click="loadDiscoveryInstances">
          查询实例
        </ReButton>
        <span v-if="discoveryMessage && discoveryMessage !== 'ok'" class="dim">{{ discoveryMessage }}</span>
      </div>
      <ReTable
        :data="discoveryInstances"
        :loading="discoveryLoading"
        border
        :pagination="false"
        :toolbar="false"
        empty-text="暂无实例（请确认发现服务已启用，或调整协议 / 服务标识）"
        style="margin-top: 10px"
      >
        <ReTableColumn prop="host" label="主机" min-width="140" show-overflow-tooltip />
        <ReTableColumn prop="port" label="端口" width="80" />
        <ReTableColumn label="协议" width="90">
          <template #default="{ row }">
            <ReTag>{{ row.protocol }}</ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="weight" label="权重" width="70" />
        <ReTableColumn prop="env" label="环境" width="90" />
        <ReTableColumn prop="uriSpec" label="服务标识" min-width="130" show-overflow-tooltip />
        <ReTableColumn label="实例 ID" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono">{{ row.id || '-' }}</span>
          </template>
        </ReTableColumn>
      </ReTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fc-panels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fc-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  line-height: 1.2;
}
.fc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 20px;
}
.fc-query {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dim {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, monospace;
}
</style>
