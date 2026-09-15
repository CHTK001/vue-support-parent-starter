<script setup lang="ts">
/**
 * ServerFilter 配置面板 —— 单个过滤器实现的配置页。
 *
 * 「不同实现不同页面」的落地方式：
 *   - 已知实现（file-storage / service-discovery）走各自的专属分区与控件编排；
 *   - 其余实现统一走 schema 驱动的通用表单（boolean → 开关，enum → 下拉，string → 输入框）。
 *   两者的字段来源都是后端 /filters 返回的 params schema，因此新增插件无需改前端。
 *
 * 当所属服务处于运行中时，面板底部提供「热更新参数」——直接调用后端
 * /filters/{index}/params，服务不中断、不重建实例。
 */
import { computed, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import {
  queryDiscoveryInstances,
  listDiscoveryProtocols,
  type DiscoveryInstance,
  type FilterTypeMeta,
  type FilterParamSchema,
} from '../api';
import { hasFilterDetail } from '../utils/filterDetail';

const props = defineProps<{
  /** 插件元数据 */
  meta: FilterTypeMeta | null;
  /** 该实例的过滤器类型 */
  filterType: string;
  /** 当前参数（v-model） */
  modelValue: Record<string, string>;
  /** 所属服务是否运行中（决定能否热更新） */
  live?: boolean;
  /** 热更新进行中 */
  applying?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
  (e: 'apply'): void;
  (e: 'open-detail-page'): void;
}>();

/** 参数 schema */
const schema = computed<FilterParamSchema[]>(() => props.meta?.params ?? []);

/** 是否为文件服务器实现 */
const isFileStorage = computed(() => props.filterType === 'file-storage' || props.filterType === 'fileStorage');

/** 是否为服务发现实现 */
const isDiscovery = computed(() => props.filterType === 'service-discovery');

/** 文件服务器的参数分区（专属页面编排） */
const FILE_STORAGE_SECTIONS: Array<{ title: string; keys: string[] }> = [
  { title: '访问控制', keys: ['openPreview', 'openDownload', 'openRange', 'openRemoteFile', 'openWebjars'] },
  { title: '目录列表页', keys: ['layout', 'layoutType', 'showFormat', 'showSize', 'showTime'] },
  { title: '图片与水印', keys: ['imageFilter', 'watermark', 'openWatermark'] },
];

/** 服务发现的参数分区 */
const DISCOVERY_SECTIONS: Array<{ title: string; keys: string[] }> = [
  { title: '发现源', keys: ['discoveryName', 'scatterId', 'protocol'] },
  { title: '路由与负载', keys: ['routes', 'balance', 'excludeServerId'] },
];

/** 当前渲染分区；非专属实现返回空数组，走平铺 schema 表单 */
const sections = computed(() => {
  if (isFileStorage.value) return FILE_STORAGE_SECTIONS;
  if (isDiscovery.value) return DISCOVERY_SECTIONS;
  return [];
});

/** 已归入分区的字段名，用于平铺表单排除 */
const groupedKeys = computed(() => new Set(sections.value.flatMap(s => s.keys)));

/** 未被分区收纳的字段（专属实现也可能有新增 schema 字段） */
const restFields = computed(() => schema.value.filter(f => !groupedKeys.value.has(f.name)));

/** 按字段名取 schema */
function fieldOf(name: string): FilterParamSchema | undefined {
  return schema.value.find(f => f.name === name);
}

/** 分区内实际存在的字段 */
function fieldsOf(keys: string[]): FilterParamSchema[] {
  return keys.map(k => fieldOf(k)).filter((f): f is FilterParamSchema => !!f);
}

/** 读取参数值（缺省回退 schema 默认值） */
function valueOf(name: string): string {
  const current = props.modelValue?.[name];
  if (current !== undefined && current !== null) return current;
  return fieldOf(name)?.defaultValue ?? '';
}

/** 布尔参数读取 */
function boolOf(name: string): boolean {
  const v = String(valueOf(name)).trim().toLowerCase();
  return v === '' || v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

/** 写入参数 */
function setValue(name: string, value: string) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [name]: value });
}

/** 写入布尔参数 */
function setBool(name: string, value: boolean) {
  setValue(name, value ? 'true' : 'false');
}

/** 枚举候选值 */
function optionsOf(field: FilterParamSchema): Array<{ label: string; value: string }> {
  const options = field.options;
  if (options?.length) return options.map(o => ({ label: o, value: o }));
  return [];
}

/** 已配置项数量（与默认值不同的参数） */
const configuredCount = computed(() =>
  schema.value.filter(f => {
    const v = props.modelValue?.[f.name];
    return v !== undefined && v !== null && String(v) !== String(f.defaultValue ?? '');
  }).length,
);

function onApply() {
  if (!props.live) {
    message.info('服务未运行，参数将随下次启动生效');
    return;
  }
  emit('apply');
}

// ===== 发现服务专属：实例查询（service-discovery 的独立接口 /ms/monitor/discovery）=====
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

/** 服务标识：默认取插件 routes 参数里配置的服务名 */
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

onMounted(() => {
  if (isDiscovery.value) {
    loadDiscoveryProtocols();
    syncUriSpecFromRoutes();
  }
});

watch(isDiscovery, next => {
  if (next) {
    loadDiscoveryProtocols();
    syncUriSpecFromRoutes();
  }
});
</script>

<template>
  <div class="filter-config">
    <!-- 插件头部 -->
    <div class="fc-head panel">
      <div class="fc-title">
        <ReTag size="small" :type="meta?.spi ? 'success' : 'primary'">{{ meta?.spi ? 'SPI 插件' : '内置预设' }}</ReTag>
        <span class="fc-name">{{ filterType }}</span>
        <ReTag v-if="meta?.group" size="small" type="info">{{ meta.group }}</ReTag>
      </div>
      <div class="fc-desc">{{ meta?.desc || '未找到该插件的元数据，按通用参数渲染' }}</div>
      <div v-if="meta?.require" class="fc-require">前提：{{ meta.require }}</div>
      <div class="fc-meta">
        <span class="dim">共 {{ schema.length }} 个参数，已调整 {{ configuredCount }} 项</span>
        <ReButton
          v-if="hasFilterDetail(meta)"
          show-text
          icon="TopRight"
          type="primary"
          size="small"
          @click="emit('open-detail-page')"
        >{{ meta?.detailLabel || '查看详情' }}</ReButton>
      </div>
    </div>

    <!-- 专属实现：分区表单 -->
    <template v-if="sections.length">
      <div v-for="section in sections" :key="section.title" class="fc-section panel">
        <div class="fc-section-title">{{ section.title }}</div>
        <div class="fc-grid">
          <div v-for="field in fieldsOf(section.keys)" :key="field.name" class="fc-field">
            <div class="fc-label">
              <span>{{ field.name }}</span>
              <span class="fc-hint">{{ field.desc }}</span>
            </div>
            <ReSwitch v-if="field.type === 'boolean'" :model-value="boolOf(field.name)" @change="(v: any) => setBool(field.name, !!v)" />
            <ReSelect
              v-else-if="field.type === 'enum' && optionsOf(field).length"
              :model-value="valueOf(field.name)"
              :data="optionsOf(field)"
              size="small"
              style="width: 100%"
              @change="(v: any) => setValue(field.name, String(v))"
            />
            <ReInput
              v-else
              :model-value="valueOf(field.name)"
              size="small"
              :placeholder="field.desc || field.name"
              @update:model-value="(v: any) => setValue(field.name, String(v ?? ''))"
            />
          </div>
        </div>
      </div>

      <!-- 专属实现中未被分区的补充字段 -->
      <div v-if="restFields.length" class="fc-section panel">
        <div class="fc-section-title">其它参数</div>
        <div class="fc-grid">
          <div v-for="field in restFields" :key="field.name" class="fc-field">
            <div class="fc-label">
              <span>{{ field.name }}</span>
              <span class="fc-hint">{{ field.desc }}</span>
            </div>
            <ReSwitch v-if="field.type === 'boolean'" :model-value="boolOf(field.name)" @change="(v: any) => setBool(field.name, !!v)" />
            <ReInput
              v-else
              :model-value="valueOf(field.name)"
              size="small"
              @update:model-value="(v: any) => setValue(field.name, String(v ?? ''))"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 通用实现：schema 驱动的平铺表单 -->
    <div v-else class="fc-section panel">
      <div class="fc-section-title">参数配置</div>
      <div v-if="!schema.length" class="fc-empty">
        该插件未声明参数 schema，可直接保存；如需传参请改用「ServerFilter 全限定类名」并在参数中补充。
      </div>
      <div v-else class="fc-grid">
        <div v-for="field in schema" :key="field.name" class="fc-field">
          <div class="fc-label">
            <span>{{ field.name }}</span>
            <span class="fc-hint">{{ field.desc }}</span>
          </div>
          <ReSwitch v-if="field.type === 'boolean'" :model-value="boolOf(field.name)" @change="(v: any) => setBool(field.name, !!v)" />
          <ReSelect
            v-else-if="field.type === 'enum' && optionsOf(field).length"
            :model-value="valueOf(field.name)"
            :data="optionsOf(field)"
            size="small"
            style="width: 100%"
            @change="(v: any) => setValue(field.name, String(v))"
          />
          <ReInput
            v-else
            :model-value="valueOf(field.name)"
            size="small"
            :placeholder="field.desc || field.name"
            @update:model-value="(v: any) => setValue(field.name, String(v ?? ''))"
          />
        </div>
      </div>
    </div>

    <!-- 发现服务专属：实时实例视图（独立接口 /ms/monitor/discovery） -->
    <div v-if="isDiscovery" class="fc-section panel">
      <div class="fc-section-title">服务实例（实时查询）</div>
      <div class="fc-query">
        <ReSelect
          v-model="discoveryProtocol"
          placeholder="发现协议"
          clearable
          :data="discoveryProtocols.map(p => ({ label: p, value: p }))"
          size="small"
          style="width: 160px"
        />
        <ReInput
          v-model="discoveryUriSpec"
          placeholder="服务标识（如 order-service）"
          clearable
          size="small"
          style="width: 240px"
        />
        <ReButton show-text icon="Search" size="small" :loading="discoveryLoading" @click="loadDiscoveryInstances">查询实例</ReButton>
        <span v-if="discoveryMessage && discoveryMessage !== 'ok'" class="dim">{{ discoveryMessage }}</span>
      </div>
      <ReTable
        :data="discoveryInstances"
        :loading="discoveryLoading"
        size="small"
        border
        :pagination="false"
        :toolbar="false"
        empty-text="暂无实例（请确认发现服务已启用，或调整协议 / 服务标识）"
        style="margin-top: 10px"
      >
        <ReTableColumn prop="host" label="主机" min-width="140" show-overflow-tooltip />
        <ReTableColumn prop="port" label="端口" width="80" />
        <ReTableColumn label="协议" width="90">
          <template #default="{ row }"><ReTag size="small">{{ row.protocol }}</ReTag></template>
        </ReTableColumn>
        <ReTableColumn prop="weight" label="权重" width="70" />
        <ReTableColumn prop="env" label="环境" width="90" />
        <ReTableColumn prop="uriSpec" label="服务标识" min-width="130" show-overflow-tooltip />
        <ReTableColumn label="实例 ID" min-width="150" show-overflow-tooltip>
          <template #default="{ row }"><span class="mono">{{ row.id || '-' }}</span></template>
        </ReTableColumn>
      </ReTable>
    </div>

    <!-- 热更新 -->
    <div class="fc-actions">
      <ReButton
        show-text
        icon="Lightning"
        type="primary"
        size="small"
        :loading="applying"
        @click="onApply"
      >热更新参数</ReButton>
      <span class="dim">运行中调用过滤器 updateConfig 就地生效，服务不中断；未运行时随下次启动生效</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fc-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fc-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fc-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.fc-require {
  font-size: 12px;
  color: var(--warning-600, #b88230);
}
.fc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.fc-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid var(--brand-500);
  line-height: 1.2;
}
.fc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 20px;
}
.fc-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
}
.fc-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.fc-label > span:first-child {
  font-size: 13px;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.fc-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}
.fc-empty {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.7;
}
.fc-query {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.fc-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
