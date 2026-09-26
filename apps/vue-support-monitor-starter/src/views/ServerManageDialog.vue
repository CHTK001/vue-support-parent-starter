<template>
  <ReDialog v-model="visible" title="协议服务器管理" width="1000px" class="server-mgr-dialog">
    <!-- 工具栏 -->
    <div class="server-mgr-toolbar">
      <ReInput v-model="keyword" placeholder="搜索服务器名称..." size="small" clearable style="width: 200px" @keyup.enter="loadList" />
      <ReButton icon="RefreshRight" size="small" :loading="loading" @click="loadList">刷新</ReButton>
      <ReButton icon="Plus" type="primary" size="small" @click="openCreate">新增服务器</ReButton>
      <span class="server-mgr-count">共 {{ filteredList.length }} 个</span>
    </div>

    <!-- 服务器列表 -->
    <ReTable :data="filteredList" :columns="columns" :loading="loading" size="small" stripe style="height: 380px">
      <template #col-status="{ row }">
        <span :class="['status-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
      </template>
      <template #col-filters="{ row }">
        <span v-if="row.filters?.length" class="filter-count">{{ row.filters.length }} 个过滤器</span>
        <span v-else class="muted">—</span>
      </template>
      <template #col-actions="{ row }">
        <div class="op-cell">
          <ReButton icon="Play" layout="square" size="small" type="success" title="启动" :disabled="row.status === 'RUNNING'" @click="doStart(row)" />
          <ReButton icon="Pause" layout="square" size="small" type="warning" title="停止" :disabled="row.status !== 'RUNNING'" @click="doStop(row)" />
          <ReButton icon="EditPen" layout="square" size="small" title="编辑配置" @click="openEdit(row)" />
          <ReButton icon="Filter" layout="square" size="small" title="过滤器配置" @click="openFilterConfig(row)" />
          <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="doDelete(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 创建/编辑服务器弹窗 -->
    <ReDialog v-model="formVisible" :title="formData.id ? '编辑服务器' : '新增服务器'" width="700px">
      <div class="server-form">
        <ReFormItem label="服务器名称" required>
          <ReInput v-model="formData.name" placeholder="如 fileserver-01" size="small" />
        </ReFormItem>
        <div class="form-row">
          <ReFormItem label="协议类型" required style="flex:1">
            <ReSelect v-model="formData.protocol" size="small" :options="protocolOptions" @change="onProtocolChange" />
          </ReFormItem>
          <ReFormItem label="传输引擎" style="flex:1">
            <ReSelect v-model="formData.engine" size="small" :options="engineOptions" />
          </ReFormItem>
        </div>
        <div class="form-row">
          <ReFormItem label="监听地址" style="flex:1">
            <ReInput v-model="formData.host" placeholder="0.0.0.0" size="small" />
          </ReFormItem>
          <ReFormItem label="监听端口" style="flex:1">
            <ReInputNumber v-model="formData.port" :min="1" :max="65535" size="small" style="width:100%" />
          </ReFormItem>
        </div>
        <ReFormItem label="是否启用">
          <el-switch v-model="enabledSwitch" active-text="启用（随应用拉起）" inactive-text="停用" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="formData.remark" type="textarea" :rows="2" placeholder="可选" size="small" />
        </ReFormItem>

        <!-- 协议专属配置 -->
        <div v-if="proxyFields.length" class="config-section">
          <div class="config-title">协议专属配置</div>
          <div class="form-row" v-for="f in proxyFields" :key="f.key">
            <ReFormItem :label="f.label" :required="f.required" style="flex:1">
              <ReInput v-model="formData.config[f.key]" :placeholder="f.placeholder" size="small" />
            </ReFormItem>
          </div>
        </div>

        <!-- 高级配置（JSON） -->
        <div class="config-section">
          <div class="config-title" @click="showAdvanced = !showAdvanced" style="cursor:pointer">
            高级配置（JSON）<span class="muted">{{ showAdvanced ? '▼' : '▶' }}</span>
          </div>
          <div v-if="showAdvanced">
            <el-input
              v-model="configJson"
              type="textarea"
              :rows="6"
              placeholder='{"contextPath":"/","readTimeout":30000}'
              style="width:100%"
            />
            <div v-if="configError" class="error-text">{{ configError }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="saveForm">保存{{ formData.id ? '（实时生效）' : '' }}</ReButton>
      </template>
    </ReDialog>

    <!-- ServerFilter 配置弹窗 -->
    <ReDialog v-model="filterVisible" :title="`过滤器配置 - ${filterTarget?.name ?? ''}`" width="800px">
      <div class="filter-config">
        <div class="filter-toolbar">
          <span class="muted">为该服务器挂载 ServerFilter 插件，支持实时配置变更</span>
          <ReButton icon="Plus" type="primary" size="small" @click="addFilter">添加过滤器</ReButton>
        </div>
        <ReTable :data="filterList" :columns="filterColumns" size="small" stripe style="height: 300px">
          <template #col-params="{ row }">
            <span class="muted">{{ Object.keys(row.params ?? {}).length }} 项参数</span>
          </template>
          <template #col-actions="{ row, $index }">
            <div class="op-cell">
              <ReButton
                v-if="hasFilterDetail(filterMeta(row.type))"
                icon="View"
                layout="square"
                size="small"
                type="primary"
                :title="filterDetailLabel(row.type)"
                @click="openFilterDetail(row)"
              />
              <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="editFilter(row, $index)" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" title="移除" @click="removeFilter($index)" />
            </div>
          </template>
        </ReTable>
      </div>

      <!-- 过滤器编辑子弹窗 -->
      <ReDialog v-model="filterEditVisible" :title="filterEditIndex >= 0 ? '编辑过滤器' : '添加过滤器'" width="560px">
        <div class="filter-form">
          <ReFormItem label="过滤器名称" required>
            <ReInput v-model="filterForm.name" placeholder="唯一名，如 file-storage" size="small" />
          </ReFormItem>
          <ReFormItem label="过滤器类型" required>
            <ReSelect v-model="filterForm.type" size="small" :options="filterTypeOptions" placeholder="预设别名或 FQCN" />
          </ReFormItem>
          <div class="form-row">
            <ReFormItem label="执行顺序" style="flex:1">
              <ReInputNumber v-model="filterForm.order" :min="0" size="small" style="width:100%" />
            </ReFormItem>
            <ReFormItem label="启用" style="flex:1">
              <el-switch v-model="filterForm.enabled" />
            </ReFormItem>
          </div>
          <div class="config-section">
            <div class="config-title">初始化参数（key=value）</div>
            <div v-for="(val, key) in filterForm.params" :key="key" class="param-row">
              <ReInput v-model="paramKeys[key]" placeholder="参数名" size="small" style="width:45%" />
              <ReInput :model-value="val" @update:model-value="updateParam(key, $event)" placeholder="参数值" size="small" style="width:45%" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" @click="removeParam(key)" />
            </div>
            <ReButton icon="Plus" size="small" plain @click="addParam">添加参数</ReButton>
          </div>
        </div>
        <template #footer>
          <ReButton @click="filterEditVisible = false">取消</ReButton>
          <ReButton type="primary" @click="saveFilter">确定</ReButton>
        </template>
      </ReDialog>

      <template #footer>
        <ReButton @click="filterVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="savingFilters" @click="saveFilters">保存（实时生效）</ReButton>
      </template>
    </ReDialog>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 协议服务器管理弹窗
 *
 * 管理协议服务器节点（RDP/SSH/VNC 等）的增删改查与启停，支持 ServerFilter 插件配置。
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  hasFilterDetail,
  resolveFilterDetail,
} from "@pages/server/src/utils/filterDetail";
import {
  fetchServerNodes, createServerNode, updateServerNode, deleteServerNode,
  startServerNode, stopServerNode, fetchServerProtocols, fetchServerFilterTypes,
  type ServerNodeView, type ServerNodeRequest, type ServerFilterDescriptor,
  type ServerProtocolMeta, type ServerFilterTypeMeta,
} from "../monitorApi";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const visible = computed({ get: () => props.modelValue, set: v => emit("update:modelValue", v) });

const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const savingFilters = ref(false);
const keyword = ref("");
const serverList = ref<ServerNodeView[]>([]);
const protocolMetas = ref<ServerProtocolMeta[]>([]);
const filterTypeMetas = ref<ServerFilterTypeMeta[]>([]);

const filteredList = computed(() => {
  if (!keyword.value) return serverList.value;
  const kw = keyword.value.toLowerCase();
  return serverList.value.filter(s =>
    s.name?.toLowerCase().includes(kw) || s.protocol?.toLowerCase().includes(kw)
  );
});

const columns = [
  { prop: "name", label: "名称", width: 160 },
  { prop: "protocolDesc", label: "协议", width: 100 },
  { prop: "host", label: "地址", width: 120 },
  { prop: "port", label: "端口", width: 70 },
  { prop: "status", label: "状态", width: 100, slot: "status" },
  { prop: "filters", label: "过滤器", width: 100, slot: "filters" },
  { prop: "serverUrl", label: "访问地址", minWidth: 160, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 220, fixed: "right", slot: "actions" },
];

const filterColumns = [
  { prop: "name", label: "名称", width: 140 },
  { prop: "type", label: "类型", width: 180 },
  { prop: "order", label: "顺序", width: 70 },
  { prop: "enabled", label: "启用", width: 70, formatter: (r: any) => r.enabled === false ? "否" : "是" },
  { prop: "params", label: "参数", width: 100, slot: "params" },
  { prop: "actions", label: "操作", width: 140, slot: "actions" },
];

// 协议/引擎选项
const protocolOptions = computed(() =>
  protocolMetas.value.map((p) => ({
    label: p.desc ? `${p.code}（${p.desc}）` : p.code,
    value: p.code,
  })),
);
const engineOptions = [
  { label: "JDK（默认）", value: "jdk" },
  { label: "NIO", value: "nio" },
  { label: "AIO", value: "aio" },
];

// 代理协议专属字段
const proxyFields = computed(() => {
  const p = formData.value.protocol?.toLowerCase();
  if (p?.includes("proxy")) {
    return [
      { key: "backendHost", label: "后端地址", required: true, placeholder: "如 127.0.0.1" },
      { key: "backendPort", label: "后端端口", required: true, placeholder: "如 8080" },
    ];
  }
  if (p === "sip") {
    return [{ key: "token", label: "令牌", required: false, placeholder: "缺省使用框架默认令牌" }];
  }
  return [];
});

// 创建/编辑表单
const formVisible = ref(false);
const formData = ref<any>({ id: null, name: "", protocol: "http", engine: "jdk", host: "0.0.0.0", port: 8080, enabled: 1, remark: "", config: {}, filters: [] });
const enabledSwitch = computed({ get: () => formData.value.enabled === 1, set: v => formData.value.enabled = v ? 1 : 0 });
const showAdvanced = ref(false);
const configError = ref("");
const configJson = computed({
  get: () => JSON.stringify(formData.value.config ?? {}, null, 2),
  set: v => {
    try { formData.value.config = JSON.parse(v); configError.value = ""; }
    catch { configError.value = "JSON 格式错误"; }
  },
});

/**
 * 打开新建服务器节点弹窗
 */
function openCreate() {
  formData.value = { id: null, name: "", protocol: "http", engine: "jdk", host: "0.0.0.0", port: 8080, enabled: 1, remark: "", config: {}, filters: [] };
  showAdvanced.value = false;
  formVisible.value = true;
}

/**
 * 打开编辑服务器节点弹窗
 * @param row 节点行
 */
function openEdit(row: ServerNodeView) {
  formData.value = { ...row, config: { ...row.config }, filters: [...(row.filters ?? [])] };
  showAdvanced.value = false;
  formVisible.value = true;
}

/**
 * 协议切换时重置默认端口
 */
function onProtocolChange() {
  const meta = protocolMetas.value.find(p => p.code === formData.value.protocol);
  if (meta?.defaultPort && !formData.value.port) formData.value.port = meta.defaultPort;
}

async function saveForm() {
  if (!formData.value.name?.trim()) { ElMessage.error("请输入服务器名称"); return; }
  if (!formData.value.protocol) { ElMessage.error("请选择协议类型"); return; }
  saving.value = true;
  try {
    const payload: ServerNodeRequest = {
      name: formData.value.name,
      protocol: formData.value.protocol,
      engine: formData.value.engine,
      host: formData.value.host,
      port: formData.value.port,
      enabled: formData.value.enabled,
      remark: formData.value.remark,
      config: formData.value.config,
      filters: formData.value.filters,
    };
    if (formData.value.id) {
      await updateServerNode(formData.value.id, payload);
      ElMessage.success("更新成功，配置已实时生效");
    } else {
      await createServerNode(payload);
      ElMessage.success("创建成功");
    }
    formVisible.value = false;
    loadList();
  } catch (e: any) {
    ElMessage.error(`保存失败：${e?.message ?? e}`);
  } finally {
    saving.value = false;
  }
}

// 启停删
async function doStart(row: ServerNodeView) {
  try { await startServerNode(row.id!); ElMessage.success("已启动"); loadList(); }
  catch (e: any) { ElMessage.error(`启动失败：${e?.message ?? e}`); }
}
async function doStop(row: ServerNodeView) {
  try { await stopServerNode(row.id!); ElMessage.success("已停止"); loadList(); }
  catch (e: any) { ElMessage.error(`停止失败：${e?.message ?? e}`); }
}
async function doDelete(row: ServerNodeView) {
  try {
    await ElMessageBox.confirm(`确认删除服务器「${row.name}」？将先停止运行实例再删除定义。`, "删除确认", { type: "warning" });
    await deleteServerNode(row.id!);
    ElMessage.success("已删除");
    loadList();
  } catch { /* cancelled */ }
}

// ServerFilter 配置
const filterVisible = ref(false);
const filterEditVisible = ref(false);
const filterTarget = ref<ServerNodeView | null>(null);
const filterList = ref<ServerFilterDescriptor[]>([]);
const filterEditIndex = ref(-1);
const filterForm = ref<any>({ name: "", type: "", order: 100, enabled: true, params: {} });
const paramKeys = ref<Record<string, string>>({});
const filterTypeOptions = computed(() =>
  filterTypeMetas.value
    .filter((f) => f.group !== "custom")
    .map((f) => ({
      label: f.desc ? `${f.type}（${f.desc}）` : f.type,
      value: f.type,
    })),
);

/**
 * 按过滤器类型取插件元数据（后端 /filters 下发，含深度查看入口信息）
 * @param type 过滤器类型
 */
function filterMeta(type?: string): ServerFilterTypeMeta | undefined {
  if (!type) return undefined;
  return filterTypeMetas.value.find(m => m.type === type);
}

/**
 * 深度查看按钮文案
 * @param type 过滤器类型
 */
function filterDetailLabel(type?: string): string {
  return filterMeta(type)?.detailLabel || "查看详情";
}

/**
 * 打开某个过滤器的深度查看页。
 *
 * node 型由插件自身 HTTP 服务托管，新窗口直开节点地址；route 型由本应用托管，
 * 必须先校验路由已注册，否则跳进死链。
 * @param row 过滤器配置
 */
function openFilterDetail(row: ServerFilterDescriptor) {
  const target = resolveFilterDetail(filterMeta(row.type), row, filterTarget.value);
  if (!target) return;
  if (target.kind === "node") {
    window.open(target.url, "_blank", "noopener");
    return;
  }
  if (target.kind === "unavailable") {
    ElMessage.info(target.reason);
    return;
  }
  if (!router.resolve(target.path).matched.length) {
    ElMessage.info(`当前应用未接入该插件的深度查看页（${target.path}）`);
    return;
  }
  router.push(target.path);
}

/**
 * 打开 ServerFilter 配置面板
 * @param row 节点行
 */
function openFilterConfig(row: ServerNodeView) {
  filterTarget.value = row;
  filterList.value = [...(row.filters ?? [])];
  filterVisible.value = true;
}

/**
 * 新增一条 ServerFilter
 */
function addFilter() {
  filterEditIndex.value = -1;
  filterForm.value = { name: "", type: "", order: 100, enabled: true, params: {} };
  paramKeys.value = {};
  filterEditVisible.value = true;
}

/**
 * 编辑 ServerFilter
 * @param row 过滤器
 * @param index 下标
 */
function editFilter(row: ServerFilterDescriptor, index: number) {
  filterEditIndex.value = index;
  filterForm.value = { ...row, params: { ...row.params } };
  paramKeys.value = {};
  Object.keys(row.params ?? {}).forEach(k => paramKeys.value[k] = k);
  filterEditVisible.value = true;
}

/**
 * 删除 ServerFilter
 * @param index 下标
 */
function removeFilter(index: number) {
  filterList.value.splice(index, 1);
}

/**
 * 新增过滤器参数
 */
function addParam() {
  const key = `param${Object.keys(filterForm.value.params).length + 1}`;
  filterForm.value.params[key] = "";
  paramKeys.value[key] = key;
}

/**
 * 更新过滤器参数
 * @param oldKey 参数键
 * @param val 参数值
 */
function updateParam(oldKey: string | number, val: string) {
  filterForm.value.params[String(oldKey)] = val;
}

/**
 * 删除过滤器参数
 * @param key 参数键
 */
function removeParam(key: string | number) {
  const k = String(key);
  delete filterForm.value.params[k];
  delete paramKeys.value[k];
}

/**
 * 保存 ServerFilter 配置
 */
function saveFilter() {
  if (!filterForm.value.name?.trim()) { ElMessage.error("请输入过滤器名称"); return; }
  // 同步 paramKeys 到 params 的 key
  const newParams: Record<string, string> = {};
  Object.entries(filterForm.value.params).forEach(([k, v]) => {
    const realKey = paramKeys.value[k] ?? k;
    newParams[realKey] = v as string;
  });
  filterForm.value.params = newParams;
  if (filterEditIndex.value >= 0) {
    filterList.value[filterEditIndex.value] = { ...filterForm.value };
  } else {
    filterList.value.push({ ...filterForm.value });
  }
  filterEditVisible.value = false;
}

async function saveFilters() {
  if (!filterTarget.value) return;
  savingFilters.value = true;
  try {
    const payload: ServerNodeRequest = {
      name: filterTarget.value.name,
      protocol: filterTarget.value.protocol,
      engine: filterTarget.value.engine,
      host: filterTarget.value.host,
      port: filterTarget.value.port,
      enabled: filterTarget.value.enabled,
      remark: filterTarget.value.remark,
      config: filterTarget.value.config,
      filters: filterList.value,
    };
    await updateServerNode(filterTarget.value.id!, payload);
    ElMessage.success("过滤器配置已保存，实时生效");
    filterVisible.value = false;
    loadList();
  } catch (e: any) {
    ElMessage.error(`保存失败：${e?.message ?? e}`);
  } finally {
    savingFilters.value = false;
  }
}

// 状态展示
function statusClass(s?: string) {
  if (s === "RUNNING") return "status-running";
  if (s === "ERROR") return "status-error";
  return "status-stopped";
}
/**
 * 节点状态文案
 * @param s 状态值
 */
function statusText(s?: string) {
  if (s === "RUNNING") return "运行中";
  if (s === "ERROR") return "错误";
  return "已停止";
}

async function loadList() {
  loading.value = true;
  try {
    [serverList.value, protocolMetas.value, filterTypeMetas.value] = await Promise.all([
      fetchServerNodes(),
      fetchServerProtocols().catch(() => []),
      fetchServerFilterTypes().catch(() => []),
    ]);
  } catch (e: any) {
    ElMessage.error(`加载失败：${e?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

watch(visible, v => { if (v) loadList(); });
</script>

<style scoped>
.server-mgr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.server-mgr-count { margin-left: auto; font-size: 12px; color: var(--tel-text-muted, #94a3b8); }
.op-cell { display: flex; gap: 4px; }
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.status-running { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
.status-stopped { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
.status-error { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.filter-count { font-size: 12px; color: var(--tel-text-secondary, #cbd5e1); }
.muted { color: var(--tel-text-muted, #94a3b8); font-size: 12px; }
.server-form { display: flex; flex-direction: column; gap: 4px; }
.form-row { display: flex; gap: 12px; }
.config-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle, rgba(148,163,184,0.12)); }
.config-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #e2e8f0); margin-bottom: 8px; }
.error-text { color: #f87171; font-size: 12px; margin-top: 4px; }
.filter-config { display: flex; flex-direction: column; gap: 10px; }
.filter-toolbar { display: flex; justify-content: space-between; align-items: center; }
.param-row { display: flex; gap: 6px; margin-bottom: 6px; align-items: center; }
</style>
