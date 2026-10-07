<script setup lang="ts">
/**
 * 代理（反向代理服务器） —— 管理 http-proxy / tcp-proxy 协议节点
 * 后端端点：/ms/monitor/server/proxies（过滤代理类协议节点），增删改查复用协议服务器节点接口。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchProxyServers, fetchServerProtocols, createServerNode, updateServerNode,
  deleteServerNode, startServerNode, stopServerNode,
  type ServerNodeView, type ServerNodeRequest, type ServerProtocolMeta,
} from "../monitorApi";

/** 代理节点列表 */
const list = ref<ServerNodeView[]>([]);
/** 加载中 */
const loading = ref(false);
/** 协议元数据（用于筛出代理类协议与默认端口/引擎） */
const protocolMetas = ref<ServerProtocolMeta[]>([]);
/** 保存中标记 */
const saving = ref(false);
/** 新增/编辑弹窗 */
const formVisible = ref(false);
/** 编辑中的节点主键，null 表示新增 */
const editingId = ref<number | null>(null);
/** 编辑时缓存的原有 config，保存时作为基底（本表单只覆盖后端地址等已知键） */
const originalConfig = ref<Record<string, unknown>>({});
/** 表单模型 */
const form = reactive({
  name: "",
  protocol: "",
  engine: "jdk",
  host: "0.0.0.0",
  port: 18081,
  backendHost: "",
  backendPort: 8080,
  enabled: 1,
  remark: "",
});

/** 表格列定义 */
const columns = [
  { prop: "name", label: "名称", width: 160 },
  { prop: "protocol", label: "协议", width: 140 },
  { prop: "listen", label: "监听地址", width: 150, slot: "listen" },
  { prop: "backend", label: "后端地址", width: 160, slot: "backend" },
  { prop: "status", label: "运行状态", width: 120, slot: "status" },
  { prop: "url", label: "访问地址", minWidth: 170, slot: "url", showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 170, fixed: "right", slot: "actions" },
];

/**
 * 与后端 isProxyProtocol 同口径：只有这些协议能建，建完才会出现在本列表
 */
const proxyProtocols = computed(() =>
  protocolMetas.value.filter(m => /proxy|socks|tunnel/i.test(m.code ?? "")),
);

/** 协议下拉选项 */
const protocolOptions = computed(() =>
  proxyProtocols.value.map(m => ({ label: m.desc ? `${m.code}（${m.desc}）` : m.code, value: m.code })),
);

/**
 * 协议归一化匹配元数据：后端落库存小写别名（http_proxy），下拉项 value 是 code（HTTP_PROXY），
 * 直接比较命不中，会把 requiresBackend 误判成 false 而丢掉后端地址。
 * @param protocol 节点上的协议值
 */
function matchMeta(protocol?: string): ServerProtocolMeta | undefined {
  const key = (protocol ?? "").toLowerCase().replace(/[_\s]+/g, "-");
  if (!key) return undefined;
  return proxyProtocols.value.find(
    m =>
      m.code?.toLowerCase().replace(/[_\s]+/g, "-") === key ||
      m.alias?.toLowerCase().replace(/[_\s]+/g, "-") === key,
  );
}

/** 当前表单协议的元数据 */
const currentMeta = computed(() => matchMeta(form.protocol));

/** 是否需要填写后端地址（未登记的协议按后端同名规则兜底） */
const requiresBackend = computed(
  () =>
    currentMeta.value?.requiresBackend ??
    /proxy|socks|tunnel/i.test(form.protocol ?? ""),
);

const enabledSwitch = computed({
  get: () => form.enabled === 1,
  set: (v: boolean) => {
    form.enabled = v ? 1 : 0;
  },
});

/**
 * 监听地址 host:port
 * @param row 节点
 */
function listenAddr(row: ServerNodeView): string {
  const host = row.host ?? "0.0.0.0";
  const port = row.port ?? "";
  return port === "" ? host : `${host}:${port}`;
}

/**
 * 后端地址（取自 config.backendHost / backendPort）
 * @param row 节点
 */
function backendAddr(row: ServerNodeView): string {
  const c = row.config ?? {};
  const bh = c["backendHost"] as string | undefined;
  const bp = c["backendPort"] as string | number | undefined;
  if (!bh && bp === undefined) return "—";
  return `${bh ?? ""}${bp !== undefined ? ":" + bp : ""}`;
}

/**
 * 状态样式类
 * @param s 状态值
 */
function statusClass(s?: string): string {
  if (s === "RUNNING") return "status-running";
  if (s === "ERROR") return "status-error";
  return "status-stopped";
}

/**
 * 状态文案
 * @param s 状态值
 */
function statusText(s?: string): string {
  if (s === "RUNNING") return "运行中";
  if (s === "ERROR") return "错误";
  return "已停止";
}

/** 把异常还原成可读文案（拦截器以 {code,msg} 纯对象 reject） */
function errText(e: unknown): string {
  const err = e as { msg?: string; message?: string };
  return err?.msg || err?.message || String(e);
}

/** 打开新增弹窗 */
function openCreate(): void {
  editingId.value = null;
  originalConfig.value = {};
  const first = proxyProtocols.value[0];
  Object.assign(form, {
    name: "",
    protocol: first?.code ?? "HTTP_PROXY",
    engine: first?.defaultEngine ?? "jdk",
    host: "0.0.0.0",
    port: first?.defaultPort ?? 18081,
    backendHost: "",
    backendPort: 8080,
    enabled: 1,
    remark: "",
  });
  formVisible.value = true;
}

/**
 * 打开编辑弹窗
 * @param row 节点
 */
function openEdit(row: ServerNodeView): void {
  editingId.value = row.id;
  const c = row.config ?? {};
  originalConfig.value = { ...c };
  const meta = matchMeta(row.protocol);
  Object.assign(form, {
    name: row.name ?? "",
    protocol: meta?.code ?? row.protocol ?? "",
    engine: row.engine ?? "jdk",
    host: row.host ?? "0.0.0.0",
    port: row.port ?? 0,
    backendHost: (c["backendHost"] as string) ?? "",
    backendPort: Number(c["backendPort"] ?? 8080),
    enabled: row.enabled ?? 1,
    remark: row.remark ?? "",
  });
  formVisible.value = true;
}

/** 协议切换时同步默认引擎与端口 */
function onProtocolChange(): void {
  const meta = currentMeta.value;
  if (!meta) return;
  form.engine = meta.defaultEngine || form.engine;
  if (meta.defaultPort) form.port = meta.defaultPort;
}

/** 保存新增/编辑 */
async function saveForm(): Promise<void> {
  if (!form.name.trim()) {
    ElMessage.warning("请填写节点名称");
    return;
  }
  if (!form.protocol) {
    ElMessage.warning("请选择代理协议");
    return;
  }
  if (!form.port) {
    ElMessage.warning("请填写监听端口");
    return;
  }
  if (requiresBackend.value && !form.backendHost.trim()) {
    ElMessage.warning("该协议需要后端地址，请填写后端主机");
    return;
  }
  const config: Record<string, unknown> = { ...originalConfig.value };
  if (requiresBackend.value) {
    config["backendHost"] = form.backendHost.trim();
    config["backendPort"] = form.backendPort;
  }
  const payload: ServerNodeRequest = {
    name: form.name.trim(),
    protocol: form.protocol,
    engine: form.engine || undefined,
    host: form.host.trim() || undefined,
    port: form.port,
    enabled: form.enabled,
    remark: form.remark || undefined,
    config,
  };
  saving.value = true;
  try {
    if (editingId.value == null) {
      await createServerNode(payload);
      ElMessage.success("已新增代理节点");
    } else {
      await updateServerNode(editingId.value, payload);
      ElMessage.success("已保存，运行中的节点已按新配置重启");
    }
    formVisible.value = false;
    await loadList();
  } catch (e) {
    ElMessage.error(`保存失败：${errText(e)}`);
  } finally {
    saving.value = false;
  }
}

/**
 * 删除节点（运行中由后端先停后删）
 * @param row 节点
 */
async function removeOne(row: ServerNodeView): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除代理节点「${row.name}」？运行中的节点会先停止。`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteServerNode(row.id!);
    ElMessage.success("已删除");
    await loadList();
  } catch (e) {
    ElMessage.error(`删除失败：${errText(e)}`);
  }
}

/**
 * 启动节点
 * @param row 节点
 */
async function doStart(row: ServerNodeView) {
  try {
    await startServerNode(row.id!);
    ElMessage.success("已启动");
    await loadList();
  } catch (e) {
    ElMessage.error(`启动失败：${errText(e)}`);
  }
}

/**
 * 停止节点
 * @param row 节点
 */
async function doStop(row: ServerNodeView) {
  try {
    await stopServerNode(row.id!);
    ElMessage.success("已停止");
    await loadList();
  } catch (e) {
    ElMessage.error(`停止失败：${errText(e)}`);
  }
}

/**
 * 加载代理节点列表
 */
async function loadList() {
  loading.value = true;
  try {
    list.value = (await fetchProxyServers()) ?? [];
  } catch (e) {
    ElMessage.error(`加载失败：${errText(e)}`);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadList();
  try {
    protocolMetas.value = (await fetchServerProtocols()) ?? [];
  } catch {
    protocolMetas.value = [];
  }
});
</script>

<template>
  <div class="px proxy-server-page">
    <ReSectionHead description="反向代理节点（HTTP_PROXY / TCP_PROXY / SOCKS 等），支持增删改查与启停">
      <template #title>代理（反向代理服务器）</template>
      <template #actions>
        <ReButton icon="Plus" :show-text="true" @click="openCreate">新增代理节点</ReButton>
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="loadList">
          刷新
        </ReButton>
      </template>
    </ReSectionHead>

    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">反向代理节点</span></template>
      <ReEmpty
        v-if="!list.length && !loading"
        description="暂无反向代理节点，点击右上角「新增代理节点」创建 HTTP_PROXY / TCP_PROXY 节点"
        :image-size="80"
        style="padding: 24px 0"
      />
      <ReTable
        v-else
        :data="list"
        :columns="columns"
        :loading="loading"

        stripe
        table-id="proxy-server-list"
      >
        <template #col-listen="{ row }">
          <span class="mono">{{ listenAddr(row) }}</span>
        </template>
        <template #col-backend="{ row }">
          <span class="mono">{{ backendAddr(row) }}</span>
        </template>
        <template #col-status="{ row }">
          <el-tooltip v-if="row.error" :content="row.error" placement="top">
            <span :class="['status-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
          </el-tooltip>
          <span v-else :class="['status-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
        </template>
        <template #col-url="{ row }">
          <a v-if="row.serverUrl && row.status === 'RUNNING'" :href="row.serverUrl" target="_blank" rel="noopener" class="mono link">
            {{ row.serverUrl }}
          </a>
          <span v-else class="text-secondary">—</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Play" layout="square" type="success" title="启动" :disabled="row.status === 'RUNNING'" @click="doStart(row)" />
            <ReButton icon="Pause" layout="square" type="warning" title="停止" :disabled="row.status !== 'RUNNING'" @click="doStop(row)" />
            <ReButton icon="EditPen" layout="square" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="removeOne(row)" />
          </div>
        </template>
      </ReTable>
    </ReCard>

    <!-- 新增/编辑代理节点 -->
    <ReDialog
      v-model="formVisible"
      :title="editingId == null ? '新增代理节点' : '编辑代理节点'"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="node-form">
        <ReFormItem label="节点名称" required>
          <ReInput v-model="form.name" placeholder="如 内网 HTTP 代理" />
        </ReFormItem>
        <ReFormItem label="代理协议" required>
          <ReSelect v-model="form.protocol" style="width:100%" :options="protocolOptions" @change="onProtocolChange" />
        </ReFormItem>
        <ReFormItem label="监听主机">
          <ReInput v-model="form.host" placeholder="0.0.0.0 表示全部网卡" />
        </ReFormItem>
        <ReFormItem label="监听端口" required>
          <ReInputNumber v-model="form.port" :min="1" :max="65535" style="width:100%" />
        </ReFormItem>
        <template v-if="requiresBackend">
          <ReFormItem label="后端主机" required>
            <ReInput v-model="form.backendHost" placeholder="如 127.0.0.1" />
          </ReFormItem>
          <ReFormItem label="后端端口">
            <ReInputNumber v-model="form.backendPort" :min="1" :max="65535" style="width:100%" />
          </ReFormItem>
        </template>
        <ReFormItem label="引擎">
          <ReInput v-model="form.engine" placeholder="缺省 jdk" />
        </ReFormItem>
        <ReFormItem label="启用">
          <el-switch v-model="enabledSwitch" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.remark" placeholder="可选" />
        </ReFormItem>
        <p class="muted">保存后节点按新配置重建监听端口，运行中的节点会先停止再启动。</p>
      </div>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="saveForm">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.px { display: flex; flex-direction: column; gap: 14px; }
.mono { font-family: monospace; font-size: 12px; }
.muted { color: var(--text-secondary); font-size: 12px; }
.op-cell { display: flex; gap: 4px; }
.link { color: var(--el-color-primary); text-decoration: none; }
.text-secondary { color: var(--text-secondary); }
.node-form { display: flex; flex-direction: column; gap: 10px; }
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.status-running { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.status-stopped { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.15); }
.status-error { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
</style>
