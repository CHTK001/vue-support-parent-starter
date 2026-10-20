<script setup lang="ts">
/**
 * 服务管理 —— Server 节点编辑抽屉。
 *
 * 三个区段：
 *   1. 基本信息：名称 / 协议（下拉取后端 /protocols，含 Server SPI 动态发现项）/ 引擎 / 监听 / 启用
 *   2. 协议专属配置：按协议动态渲染（代理需 backendHost+backendPort，SIP 需 token，HTTP 走通用传输项）
 *   3. 过滤器编排：左侧 ServerFilter SPI 列表点击加入右侧，支持重复添加、排序、启停、删除；
 *      点击右侧任一插件进入该实现的配置页（不同实现不同页面）
 *
 * 保存提供两种落法：
 *   - 保存：全量替换（运行中的节点会先停止再按新配置重启）
 *   - 保存并热更新：过滤器链就地替换，服务不中断；仅监听参数变更时才自动重启
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import { useRouter } from 'vue-router';
import {
  createServerNode,
  updateServerNode,
  hotUpdateServerNode,
  toggleServerFilter,
  updateServerFilterParams,
  type FilterTypeMeta,
  type ProtocolMeta,
  type ServerFilterDescriptor,
  type ServerNodeView,
} from '../api';
import ScFilterConfigPanel from './ScFilterConfigPanel.vue';
import { resolveFilterDetail } from '../utils/filterDetail';
import {
  buildServerNodePayload,
  validateServerNodeForm,
  type ServerNodeFormModel,
} from '../utils/serverNodeForm';

const props = defineProps<{
  /** 当前编辑的节点；null 表示新增（cloneSource 也为空） */
  node: ServerNodeView | null;
  /** 克隆源（node 为 null 且 cloneSource 有值时走克隆路径） */
  cloneSource?: ServerNodeView | null;
  /** 协议元数据 */
  protocols: ProtocolMeta[];
  /** 插件元数据 */
  filterTypes: FilterTypeMeta[];
  /** 列表中已存在的其他节点名称（用于名称重复校验）；传入空则跳过 */
  existingNames?: string[];
}>();

const emit = defineEmits<{ (e: 'saved'): void }>();

const router = useRouter();
const visible = defineModel<boolean>({ default: false });

/** 是否新建（含克隆）—— node 为空或 node.id 为 0（克隆场景 id 被置零） */
const isCreating = computed(() => !props.node || props.node.id === 0);
/** 是否克隆模式 */
const isClone = computed(() => !props.node && !!props.cloneSource);

/** 抽屉标题（编辑/克隆/插件配置三态） */
const drawerTitle = computed(() => {
  if (view.value !== 'edit') {
    return `插件配置 - ${form.value.filters[activeIndex.value]?.name || ''}`;
  }
  if (isClone.value) return `克隆服务 - ${props.cloneSource?.name || ''}`;
  if (!isCreating.value) return `编辑服务 - ${props.node?.name || ''}`;
  return '新增服务';
});

/** 视图：编辑 / 单个插件配置页 */
const view = ref<'edit' | 'filter'>('edit');
/** 当前配置的过滤器下标 */
const activeIndex = ref(0);
/** 当前配置的过滤器参数草稿 */
const filterParams = ref<Record<string, string>>({});
/** 提交中 */
const submitting = ref(false);
/** 参数热更新中 */
const applying = ref(false);

/** 表单模型 */
const form = ref({
  name: '',
  protocol: 'http',
  engine: 'jdk',
  host: '0.0.0.0',
  port: 18080 as number | null,
  enabled: 1,
  remark: '',
  config: {} as Record<string, any>,
  filters: [] as ServerFilterDescriptor[],
});

/** HTTP 通用传输项 */
const COMMON_FIELDS = [
  { name: 'contextPath', label: '上下文路径', type: 'string', placeholder: '/api' },
  { name: 'charset', label: '字符集', type: 'string', placeholder: 'UTF-8' },
  { name: 'readTimeout', label: '读超时(ms)', type: 'number' },
  { name: 'writeTimeout', label: '写超时(ms)', type: 'number' },
  { name: 'backlog', label: '积压队列', type: 'number' },
  { name: 'maxConnections', label: '最大连接数', type: 'number' },
  { name: 'maxConcurrency', label: '最大并发数', type: 'number' },
  { name: 'maxRequestSize', label: '最大请求体(字节)', type: 'number' },
  { name: 'responseTimeout', label: '响应超时(ms)', type: 'number' },
  { name: 'gzipEnabled', label: '启用 Gzip', type: 'boolean' },
  { name: 'reactor', label: 'Reactor 模式', type: 'boolean' },
];

/** 代理专属字段 */
const PROXY_FIELDS = [
  { name: 'backendHost', label: '后端地址', type: 'string', placeholder: '127.0.0.1' },
  { name: 'backendPort', label: '后端端口', type: 'number' },
];

/** SIP 专属字段 */
const SIP_FIELDS = [
  { name: 'token', label: '认证令牌', type: 'string' },
  { name: 'dataPlaneMode', label: '数据平面模式', type: 'string', placeholder: 'tcp / udp' },
];

/** 当前协议元数据 */
const currentProtocol = computed<ProtocolMeta | undefined>(() =>
  props.protocols.find(p => p.alias === form.value.protocol),
);

/** 是否代理类协议 */
const isProxy = computed(() => !!currentProtocol.value?.requiresBackend);

/** 是否 SIP 协议 */
const isSip = computed(() => form.value.protocol === 'sip');

/** 协议专属字段集合（按协议类型动态过滤，不再对所有协议展示全部 11 项通用字段） */
const protocolFields = computed(() => {
  const fields: Array<{ name: string; label: string; type: string; placeholder?: string }> = [];
  const alias = form.value.protocol;
  const meta = currentProtocol.value;
  if (isProxy.value) fields.push(...PROXY_FIELDS);
  if (isSip.value) fields.push(...SIP_FIELDS);
  // HTTP 类协议展示通用传输配置
  if (alias === 'http' || alias === 'https' || alias === 'http2') {
    fields.push(...COMMON_FIELDS);
  }
  // 后端下发了 params schema 时追加协议自定义扩展字段
  if (meta?.params?.length) {
    for (const p of meta.params) {
      if (!fields.some(f => f.name === p.name)) {
        fields.push({ name: p.name, label: p.name, type: p.type ?? 'string', placeholder: p.desc });
      }
    }
  }
  return fields;
});

/**
 * 引擎候选 —— 由后端下发（Server SPI 实际注册名），前端不硬编码。
 *
 * HTTP 一个实现注册多个引擎名（jdk/jdk-http、nio/nio-http、aio/aio-http/iocp），
 * 候选集合随 SPI 注册表变化；其余协议只有自身这一个引擎。
 */
const engineOptions = computed(() => {
  const meta = currentProtocol.value;
  const engines = meta?.engines?.length ? meta.engines : [meta?.defaultEngine || 'jdk'];
  return engines.map(v => ({ label: v, value: v }));
});

/** 插件分组标题 */
const GROUP_LABELS: Record<string, string> = {
  storage: '存储',
  discovery: '服务发现',
  routing: '路由',
  proxy: '代理',
  security: '安全',
  generic: '通用',
};

/** 左侧可用插件按分组归集 */
const filterGroups = computed(() => {
  const groups = new Map<string, FilterTypeMeta[]>();
  props.filterTypes.forEach(f => {
    const key = f.group || 'generic';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  });
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: GROUP_LABELS[key] || key,
    items,
  }));
});

/** 左侧搜索 */
const pickerKeyword = ref('');

/**
 * 自定义 ServerFilter 全限定类名。
 *
 * <p>元数据里 group=custom 那条是「任意 ServerFilter 实现」的入口，它的
 * {@code type} 只是一句说明（"ServerFilter 全限定类名"），直接当类型下发后端
 * 会构造失败。必须由用户填真实 FQCN，再以它作为 type/name。</p>
 */
const customFilterType = ref('');

/** 是否为「自定义实现」入口 */
function isCustomPickerItem(meta: FilterTypeMeta) {
  return meta.group === 'custom' || meta.type === 'ServerFilter 全限定类名';
}

/** 粗校验 Java 全限定类名（至少两段、每段是合法标识符） */
function isQualifiedClassName(value: string) {
  return /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/.test(value.trim());
}

/** 过滤后的左侧插件 */
function groupItems(items: FilterTypeMeta[]) {
  const kw = pickerKeyword.value.trim().toLowerCase();
  if (!kw) return items;
  return items.filter(i => `${i.type} ${i.desc}`.toLowerCase().includes(kw));
}

/** 已选插件数量统计 */
const selectedCount = computed(() => form.value.filters.length);

// ===== 打开抽屉时同步表单 =====
watch(visible, open => {
  if (!open) return;
  view.value = 'edit';
  pickerKeyword.value = '';
  const n = props.node ?? props.cloneSource;
  if (n) {
    form.value = {
      name: n.name,
      protocol: n.protocol,
      engine: n.engine || 'jdk',
      host: n.host || '0.0.0.0',
      port: n.port ?? null,
      enabled: n.enabled ?? 1,
      remark: n.remark || '',
      config: { ...(n.config || {}) },
      filters: (n.filters || []).map(f => ({ ...f, params: { ...(f.params || {}) } })),
    };
    // 克隆时给名称加后缀引导用户改名
    if (isClone.value) {
      form.value.name = `${n.name}-clone`;
    }
  } else {
    const first = props.protocols[0];
    form.value = {
      name: '',
      protocol: first?.alias || 'http',
      engine: first?.defaultEngine || 'jdk',
      host: '0.0.0.0',
      port: first?.defaultPort ?? 18080,
      enabled: 1,
      remark: '',
      config: {},
      filters: [],
    };
  }
});

/** 切换协议时同步引擎与默认端口 */
watch(
  () => form.value.protocol,
  (next, prev) => {
    if (next === prev) return;
    const meta = props.protocols.find(p => p.alias === next);
    form.value.engine = meta?.defaultEngine || 'jdk';
    if (!form.value.port || form.value.port === props.protocols.find(p => p.alias === prev)?.defaultPort) {
      form.value.port = meta?.defaultPort ?? null;
    }
  },
);

/** 读取协议配置项 */
function configValue(name: string) {
  return form.value.config?.[name] ?? '';
}

/** 写入协议配置项 */
function setConfig(name: string, value: any) {
  const next = { ...(form.value.config || {}) };
  if (value === '' || value === null || value === undefined) {
    delete next[name];
  } else {
    next[name] = value;
  }
  form.value.config = next;
}

// ===== 过滤器编排 =====
/** 生成同服务内唯一的过滤器名 */
function uniqueName(base: string) {
  const used = new Set(form.value.filters.map(f => f.name));
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/** 新增一个过滤器实例（支持重复添加同一实现） */
function addFilter(meta: FilterTypeMeta) {
  // 自定义实现入口：类型取用户填写的 FQCN，而不是元数据里那句说明
  const custom = isCustomPickerItem(meta);
  const resolvedType = custom ? customFilterType.value.trim() : meta.type;
  if (custom) {
    if (!isQualifiedClassName(resolvedType)) {
      message.warning('请先填写 ServerFilter 的全限定类名（如 com.chua.xxx.MyFilter）');
      return;
    }
    if (form.value.filters.some(f => f.type === resolvedType)) {
      message.warning(`该实现已在链上：${resolvedType}`);
      return;
    }
  }
  const base = resolvedType.includes('.') ? resolvedType.split('.').pop() || resolvedType : resolvedType;
  const name = uniqueName(base);
  const params: Record<string, string> = {};
  (meta.params || []).forEach(p => {
    if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
      params[p.name] = String(p.defaultValue);
    }
  });
  const nextOrder = form.value.filters.length
    ? Math.max(...form.value.filters.map(f => f.order ?? 100)) + 10
    : 100;
  form.value.filters.push({
    name,
    type: resolvedType,
    order: nextOrder,
    enabled: true,
    params,
  });
  if (custom) {
    customFilterType.value = '';
  }
  message.success(`已添加插件 ${name}`);
}

/** 移除 */
function removeFilter(index: number) {
  const target = form.value.filters[index];
  form.value.filters.splice(index, 1);
  message.success(`已移除插件 ${target?.name ?? ''}`);
}

/** 上移 / 下移 */
function moveFilter(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= form.value.filters.length) return;
  const list = form.value.filters;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  // 重排 order，保证与列表顺序一致
  list.forEach((f, i) => {
    f.order = 100 + i * 10;
  });
}

/** 启用开关（编辑态仅改草稿） */
function toggleDraft(index: number, enabled: boolean) {
  const f = form.value.filters[index];
  if (f) f.enabled = enabled;
}

/** 进入某个过滤器的配置页 */
function openFilterConfig(index: number) {
  const f = form.value.filters[index];
  if (!f) return;
  activeIndex.value = index;
  filterParams.value = { ...(f.params || {}) };
  view.value = 'filter';
}

/** 当前配置页的插件元数据 */
const activeFilterType = computed(() => form.value.filters[activeIndex.value]?.type
  || form.value.filters[activeIndex.value]?.name
  || '');
const activeMeta = computed<FilterTypeMeta | null>(() =>
  props.filterTypes.find(f => f.type === activeFilterType.value) || null,
);

/** 返回编辑视图（回写参数草稿） */
function backToEdit(commit = true) {
  if (commit) {
    const f = form.value.filters[activeIndex.value];
    if (f) f.params = { ...filterParams.value };
  }
  view.value = 'edit';
}

/** 该服务是否运行中 */
const isLive = computed(() => props.node?.status === 'RUNNING');

/** 热更新当前过滤器参数（需节点已存在） */
async function applyFilterParams() {
  const node = props.node;
  if (!node) {
    message.info('服务尚未创建，参数将随创建一并提交');
    backToEdit();
    return;
  }
  const f = form.value.filters[activeIndex.value];
  if (f) f.params = { ...filterParams.value };
  applying.value = true;
  try {
    await updateServerFilterParams(node.id, activeIndex.value, filterParams.value);
    message.success('过滤器参数已热更新，服务未中断');
    emit('saved');
    backToEdit(false);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    applying.value = false;
  }
}

/**
 * 打开插件深度查看页（不同实现不同页面）。
 *
 * node 型（如 file-storage）的深度页面由插件自身 HTTP 服务托管，但表单态尚未保存/启动、
 * 拿不到节点地址，因此只给出提示；保存启动后可从服务详情页打开。
 * route 型（如 service-discovery）由宿主应用托管，校验路由存在后跳转。
 */
function openFilterDetailPage() {
  const target = resolveFilterDetail(activeMeta.value, form.value.filters[activeIndex.value], null);
  if (!target) {
    message.info('该插件未提供深度查看页');
    return;
  }
  if (target.kind === 'unavailable') {
    message.info(target.reason);
    return;
  }
  if (target.kind === 'node') {
    window.open(target.url, '_blank', 'noopener');
    return;
  }
  // 宿主应用可能未挂载目标页面，先校验路由再跳，避免死链
  if (!router.resolve(target.path).matched.length) {
    message.info(`当前应用未接入该插件的深度查看页（${target.path}）`);
    return;
  }
  visible.value = false;
  router.push(target.path);
}

// ===== 提交 =====
/** 表单校验（规则集中在 utils/serverNodeForm，便于单测） */
function validate() {
  const result = validateServerNodeForm(form.value as ServerNodeFormModel, {
    requiresBackend: isProxy.value,
  }, props.existingNames);
  if (!result.ok) {
    message.warning(result.message || '表单校验未通过');
    return false;
  }
  return true;
}

/** 组装请求体（规则集中在 utils/serverNodeForm，便于单测） */
function buildPayload() {
  return buildServerNodePayload(form.value as ServerNodeFormModel);
}

/** 失败响应里是否带已落库的节点（后端常见「已保存但启动失败」场景） */
function hasPersistedNode(e: unknown): boolean {
  const data = (e as Error & { data?: unknown })?.data;
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if ('id' in d) return true;
  // 热更新失败响应把节点放在 data.node 里（如监听参数改坏后返回
  // { node: {...}, hotApplied, restarted, ... }），同样表示已落库。
  const nested = d.node;
  return !!nested && typeof nested === 'object' && 'id' in (nested as Record<string, unknown>);
}

/** 保存（全量替换） */
async function submit() {
  if (!validate()) return;
  submitting.value = true;
  try {
    if (!isCreating.value) {
      await updateServerNode(props.node!.id, buildPayload());
      message.success('已保存，运行中的实例已按新配置重启');
    } else {
      await createServerNode(buildPayload());
      message.success('已创建');
    }
    emit('saved');
    visible.value = false;
  } catch (e) {
    message.error((e as Error).message);
    // 后端可能返回 success=false 但 data 已是落库节点（例如监听参数导致
    // 启动失败）。此时仍要刷新列表并关闭抽屉，否则用户既看不到异常节点，
    // 也没法点详情/编辑/删除去排查。
    if (hasPersistedNode(e)) {
      emit('saved');
      visible.value = false;
    }
  } finally {
    submitting.value = false;
  }
}

/** 保存并热更新（过滤器链就地替换，服务不中断） */
async function submitHot() {
  if (!validate()) return;
  const payload = buildPayload();
  // 克隆或未保存节点：无热更新语义，退化为创建
  if (isCreating.value) {
    submitting.value = true;
    try {
      await createServerNode(payload);
      message.success('已创建');
      emit('saved');
      visible.value = false;
    } catch (e) {
      message.error((e as Error).message);
      if (hasPersistedNode(e)) {
        emit('saved');
        visible.value = false;
      }
    } finally {
      submitting.value = false;
    }
    return;
  }
  submitting.value = true;
  try {
    const result = await hotUpdateServerNode(props.node!.id, payload);
    if (result?.restarted) {
      message.warning(result.message || '监听参数变更，已自动重启节点');
    } else if (result?.hotApplied) {
      message.success(result.message || '已热更新，服务未中断');
    } else {
      message.info(result?.message || '定义已保存');
    }
    emit('saved');
    visible.value = false;
  } catch (e) {
    message.error((e as Error).message);
    // 热更新把监听参数改成无法启动的值时，后端同样可能返回已落库的
    // ERROR 节点（保存成功、重启失败）。保持和新建一致：刷新列表、关闭
    // 抽屉，让异常节点可继续详情/编辑/启停/删除。
    if (hasPersistedNode(e)) {
      emit('saved');
      visible.value = false;
    }
  } finally {
    submitting.value = false;
  }
}

/** 热切换已保存节点上的过滤器启停 */
async function toggleLive(index: number, enabled: boolean) {
  const node = props.node;
  if (!node || node.status !== 'RUNNING') return;
  try {
    await toggleServerFilter(node.id, index, enabled);
    message.success(`过滤器已${enabled ? '启用' : '停用'}（热生效）`);
    emit('saved');
  } catch (e) {
    message.error((e as Error).message);
  }
}
</script>

<template>
  <ReDrawer
    v-model="visible"
    :title="drawerTitle"
    :size="view === 'edit' ? 1000 : 760"
    direction="rtl"
    close-only
    :footer-hidden="true"
  >
    <template #content>
      <!-- ============ 编辑视图 ============ -->
      <div v-if="view === 'edit'" class="server-form">
        <ReForm label-width="110px" label-position="right">
          <ReDivider content-position="left">基本信息</ReDivider>
          <ReFormItem label="服务名称" required>
            <ReInput v-model="form.name" placeholder="如 fileserver-01" />
          </ReFormItem>
          <ReFormItem label="协议类型" required>
            <ReSelect v-model="form.protocol" :data="protocols.map(p => ({ label: `${p.alias}${p.spi ? '（SPI）' : ''} - ${p.desc}`, value: p.alias }))" filterable style="width: 100%" />
            <div v-if="currentProtocol" class="form-hint">
              默认端口 {{ currentProtocol.defaultPort ?? '-' }} · 默认引擎 {{ currentProtocol.defaultEngine ?? '-' }}
              <span v-if="currentProtocol.spi" class="spi-badge">Server SPI 动态协议</span>
            </div>
          </ReFormItem>
          <ReFormItem label="传输引擎">
            <ReSelect v-model="form.engine" :data="engineOptions" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="监听地址">
            <ReInput v-model="form.host" placeholder="0.0.0.0" />
          </ReFormItem>
          <ReFormItem label="监听端口" required>
            <ReInputNumber v-model="form.port" :min="1" :max="65535" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="自动启用">
            <ReSwitch :model-value="form.enabled === 1" @change="(v: any) => (form.enabled = v ? 1 : 0)" />
            <span class="form-hint" style="margin-left: 10px">启用后随应用启动自动拉起</span>
          </ReFormItem>
          <ReFormItem label="备注">
            <ReInput v-model="form.remark" type="textarea" :rows="2" placeholder="用途说明" />
          </ReFormItem>

          <ReDivider content-position="left">协议配置</ReDivider>
          <div class="cfg-grid">
            <div v-for="field in protocolFields" :key="field.name" class="cfg-field">
              <span class="cfg-label">{{ field.label }}</span>
              <ReSwitch
                v-if="field.type === 'boolean'"
                :model-value="String(configValue(field.name)).toLowerCase() === 'true' || String(configValue(field.name)) === '1'"
                @change="(v: any) => setConfig(field.name, v ? 'true' : 'false')"
              />
              <ReInputNumber
                v-else-if="field.type === 'number'"
                :model-value="configValue(field.name) === '' ? undefined : Number(configValue(field.name))"
                :min="0"

                style="width: 100%"
                @update:model-value="(v: any) => setConfig(field.name, v)"
              />
              <ReInput
                v-else
                :model-value="String(configValue(field.name))"

                :placeholder="field.placeholder || ''"
                @update:model-value="(v: any) => setConfig(field.name, v)"
              />
            </div>
          </div>

          <ReDivider content-position="left">
            过滤器编排
            <span class="form-hint" style="margin-left: 8px">已挂载 {{ selectedCount }} 个插件，同一实现可重复添加</span>
          </ReDivider>
        </ReForm>

        <!-- 左选右加 -->
        <div class="picker">
          <!-- 左侧：可用插件 -->
          <div class="picker-col picker-left">
            <div class="picker-head">
              <span>可用插件</span>
              <ReInput v-model="pickerKeyword" placeholder="搜索" clearable prefix-icon="Search" style="width: 130px" />
            </div>
            <div class="picker-body">
              <div v-for="group in filterGroups" :key="group.key" class="picker-group">
                <template v-if="groupItems(group.items).length">
                  <div class="picker-group-title">{{ group.label }}</div>
                  <div
                    v-for="item in groupItems(group.items)"
                    :key="item.type"
                    class="picker-item"
                    role="button"
                    tabindex="0"
                    @click="addFilter(item)"
                    @keydown.enter.prevent="addFilter(item)"
                    @keydown.space.prevent="addFilter(item)"
                  >
                    <div class="pi-main">
                      <span class="pi-type">{{ item.type }}</span>
                      <span class="pi-desc">{{ item.desc }}</span>
                      <!-- 自定义实现：必须由用户填真实 FQCN，否则后端拿到的是一句说明文字 -->
                      <div v-if="isCustomPickerItem(item)" class="pi-custom" @click.stop @keydown.stop>
                        <ReInput
                          v-model="customFilterType"
                          placeholder="com.example.MyServerFilter"
                          clearable
                          style="width: 100%"
                        />
                      </div>
                    </div>
                    <ReTag :type="item.spi ? 'success' : 'primary'">{{ item.spi ? 'SPI' : '预设' }}</ReTag>
                    <Plus class="pi-add" />
                  </div>
                </template>
              </div>
              <div v-if="!filterTypes.length" class="picker-empty">未获取到插件元数据</div>
            </div>
          </div>

          <!-- 右侧：已挂载 -->
          <div class="picker-col picker-right">
            <div class="picker-head">
              <span>已挂载插件</span>
              <span class="dim">{{ selectedCount }} 个</span>
            </div>
            <div class="picker-body">
              <div v-if="!form.filters.length" class="picker-empty">
                点击左侧插件添加到此处；点击条目可打开该实现的配置页
              </div>
              <div
                v-for="(f, index) in form.filters"
                :key="f.name"
                class="selected-item"
                :class="{ 'is-off': f.enabled === false }"
                role="button"
                tabindex="0"
                @click="openFilterConfig(index)"
                @keydown.enter.prevent="openFilterConfig(index)"
                @keydown.space.prevent="openFilterConfig(index)"
              >
                <div class="si-order">{{ index + 1 }}</div>
                <div class="si-main">
                  <div class="si-name">
                    {{ f.name }}
                    <ReTag v-if="f.type && f.type !== f.name" type="info">{{ f.type }}</ReTag>
                  </div>
                  <div class="si-meta">
                    <span class="dim">order {{ f.order ?? 100 }}</span>
                    <span class="dim">·</span>
                    <span class="dim">{{ Object.keys(f.params || {}).length }} 个参数</span>
                    <ReTag :type="f.enabled === false ? 'info' : 'success'">
                      {{ f.enabled === false ? '已停用' : '已启用' }}
                    </ReTag>
                  </div>
                </div>
                <!-- 整行可点进配置页，箭头是唯一的可点提示：原先只有 cursor:pointer 暗示 -->
                <ArrowRight class="si-go" aria-hidden="true" />
                <div class="si-ops" @click.stop>
                  <ReSwitch
                    :model-value="f.enabled !== false"
                    @change="(v: any) => { toggleDraft(index, !!v); toggleLive(index, !!v); }"
                  />
                  <span class="si-ops-line" aria-hidden="true" />
                  <ReButton icon="Setting" layout="square" type="primary" tip="配置该插件" @click="openFilterConfig(index)" />
                  <ReButton icon="Top" layout="square" tip="上移一位" :disabled="index === 0" @click="moveFilter(index, -1)" />
                  <ReButton
                    icon="Bottom"
                    layout="square"
                    tip="下移一位"
                    :disabled="index === form.filters.length - 1"
                    @click="moveFilter(index, 1)"
                  />
                  <ReButton icon="Delete" layout="square" type="danger" tip="从链上移除" @click="removeFilter(index)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="form-actions">
          <ReButton show-text icon="Check" type="primary" :loading="submitting" @click="submit">保存</ReButton>
          <ReButton show-text icon="Lightning" :loading="submitting" @click="submitHot">
            {{ isCreating ? '创建并启动' : '保存并热更新' }}
          </ReButton>
          <ReButton show-text icon="Close" @click="visible = false">取消</ReButton>
          <span class="dim">热更新会就地替换过滤器链，服务不中断；仅监听地址/端口/引擎变更时才重启</span>
        </div>
      </div>

      <!-- ============ 单个插件配置页 ============ -->
      <div v-else class="filter-page">
        <div class="filter-page-bar">
          <ReButton show-text icon="ArrowLeft" @click="backToEdit()">返回编排</ReButton>
          <span class="dim">第 {{ activeIndex + 1 }} 个插件 · {{ form.filters[activeIndex]?.name }}</span>
        </div>
        <ScFilterConfigPanel
          v-model="filterParams"
          :meta="activeMeta"
          :filter-type="activeFilterType"
          :live="isLive"
          :applying="applying"
          @apply="applyFilterParams"
          @open-detail-page="openFilterDetailPage"
        />
      </div>
    </template>
  </ReDrawer>
</template>

<style scoped lang="scss">
/* 本文件原先整套用 pages/server/src/styles/tokens.css 的私有令牌（--text-* / --bg-*
   / --border-subtle / --brand-* / --shadow-card / --transition-base），而那份 tokens.css
   只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。已统一改走 EP 语义令牌。 */
.server-form,
.filter-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 抽屉内表单科技感：字段行悬浮高亮 */
.server-form :deep(.el-form-item) {
  border-radius: var(--el-radius-md);
  padding: 4px 8px;
  transition: background-color 0.2s ease;
  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 3%, transparent);
  }
}
.form-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
.spi-badge {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: var(--el-radius-xs, 4px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}
.cfg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px 24px;
  padding: 0 0 8px;
}
.cfg-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cfg-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* 左选右加 */
.picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 300px;
}
.picker-col {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  background: var(--el-bg-color);
}
.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 380px;
}
.picker-group-title {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  padding: 4px 6px;
  letter-spacing: 0.3px;
}
.picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  outline: none;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
  &:hover {
    border-color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
    transform: translateX(3px);
    box-shadow: 0 0 12px color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  }
}
.pi-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pi-type {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: var(--el-text-color-primary);
}
.pi-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pi-add {
  width: 14px;
  height: 14px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.picker-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
.selected-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 0 12px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
  }
  &:focus-visible {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}
.selected-item.is-off {
  opacity: 0.62;
}
.si-order {
  width: 22px;
  height: 22px;
  /* 22px 正圆：50% 与 full 档(9999px) 等价，统一到令牌 */
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.si-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
/* 进入配置页的方向箭头：默认淡灰，悬停/聚焦时转主色并右移，
   用 150-300ms 的 transform 过渡而不是 scale，避免图标抖动 */
.si-go {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.selected-item:hover .si-go,
.selected-item:focus-visible .si-go {
  color: var(--el-color-primary);
  transform: translateX(2px);
}
.si-name {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}
.si-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}
.si-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
/* 竖线分隔「启停开关」与「结构操作」：两类动作语义不同，混排时用户会误把开关当删除类 */
.si-ops-line {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--el-border-color-lighter);
  flex-shrink: 0;
}
.form-actions,
.filter-page-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 10px;
  position: relative;
  /* 顶部科技感渐变光带 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--el-color-primary-light-5) 30%,
      var(--el-color-primary) 50%,
      var(--el-color-primary-light-5) 70%,
      transparent 100%);
    opacity: 0.6;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .picker-item,
  .selected-item {
    transition: none;
  }
}
</style>
