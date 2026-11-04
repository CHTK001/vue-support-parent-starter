<script setup lang="ts">
/**
 * 内网穿透页面（@pages/tunnel）
 *
 * <p><strong>一个页面、一套接口。</strong>后端把 ngrok 与 Cloudflare Tunnel
 * 收敛成同一个 SPI（{@code TunnelProvider}）+ 同一个控制器（{@code /ms/tunnel}），
 * 提供方只是映射记录上的一个字段；因此这里不再按提供方分页签、也不再有
 * 「一个提供方一个工作台组件」的副本。</p>
 *
 * <p>界面只有两件事：</p>
 * <ul>
 *   <li>一张 {@code ReTable} 卡片列表 —— 台账（名称 / 端口 / 模式 / 域名）
 *       与运行态（是否在线、公网地址、最近错误）放在同一张卡片里；</li>
 *   <li>一个「新增」弹窗 —— 弹窗内选提供方，模式选项随提供方联动。</li>
 * </ul>
 *
 * <p>刻意去掉的东西：SSE 实时流（改成操作后重新拉一次列表，链路更短、
 * 也不会出现「流断了状态就一直不刷新」）、编辑抽屉（并入同一个弹窗）。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import type { ReCardField, ReTableColumn } from "@repo/ui/re-table";
import {
  createTunnel,
  deleteTunnel,
  listTunnelProviders,
  listTunnels,
  startTunnel,
  stopTunnel,
  updateTunnel,
} from "../api/tunnelApi";
import type { TunnelMode, TunnelProvider, TunnelProviderInfo, TunnelRecord, TunnelView } from "../api/types";

/** 组件名固定：宿主 keep-alive 按组件名（不是路由名）登记缓存 */
defineOptions({ name: "TunnelPage" });

/** 模式中文名；后端只回模式标识，展示文案由页面统一给 */
const MODE_LABELS: Record<string, string> = {
  http: "HTTP 转发",
  tcp: "TCP 转发",
  tls: "TLS 隧道",
  quick: "Quick Tunnel（免账号）",
  named: "Named Tunnel（需 Token）",
};

/**
 * 模式展示名。
 *
 * @param mode 模式标识
 * @returns 展示文案，未登记的模式原样返回
 */
function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}

/* ==================== 列表 ==================== */

/**
 * 把异常转成可读文案。
 *
 * @param e 捕获到的异常
 * @returns 提示文案
 */
function errText(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "请求失败";
}

/** 全部映射（不按提供方筛选：提供方已是卡片上的一行字） */
const rows = ref<TunnelView[]>([]);

/** 列表加载态 */
const loading = ref(false);

/** 后端已注册的提供方（下拉与模式选项的唯一来源） */
const providers = ref<TunnelProviderInfo[]>([]);

/** 在线条数 */
const runningCount = computed(() => rows.value.filter((row) => row.running).length);

/**
 * 提供方展示名。
 *
 * @param name 提供方标识
 * @returns 展示名，未注册时退回标识本身
 */
function providerLabel(name: string): string {
  return providers.value.find((item) => item.name === name)?.displayName ?? name;
}

/**
 * 公网地址文案。
 *
 * @param row 映射行
 * @returns 有地址时用空格连接，未启动时给出提示语
 */
function publicUrlText(row: Record<string, unknown>): string {
  const urls = row.publicUrls as string[] | undefined;
  return urls && urls.length ? urls.join("  ") : "启动后分配";
}

/** 表格列：卡片字段优先用 layoutCard.fields，这份列定义保证列设置与表格视图有依据 */
const columns = computed<ReTableColumn[]>(() => [
  { prop: "name", label: "名称", minWidth: 160 },
  { prop: "provider", label: "提供方", width: 150 },
  { prop: "localPort", label: "本地端口", width: 110 },
  { prop: "mode", label: "模式", width: 130 },
  { prop: "running", label: "状态", width: 100 },
  { prop: "publicUrls", label: "公网地址", minWidth: 240 },
]);

/** 卡片字段：标题 = 名称，副标题 = 提供方，其余按「端口 / 域名 / 公网地址 / 错误」排列 */
const cardFields = computed<ReCardField[]>(() => [
  { prop: "name", title: true },
  { prop: "provider", desc: true, render: (row) => providerLabel(String(row.provider ?? "")) },
  { prop: "running", type: "tag", render: (row) => (row.running ? "运行中" : "已停止") },
  { prop: "mode", type: "tag", render: (row) => modeLabel(String(row.mode ?? "")) },
  { prop: "localPort", label: "本地端口", render: (row) => `127.0.0.1:${row.localPort ?? "—"}` },
  { prop: "domain", label: "域名", render: (row) => String(row.domain || "—") },
  { prop: "publicUrls", label: "公网地址", render: (row) => publicUrlText(row) },
  { prop: "error", label: "错误", render: (row) => String(row.error || "—") },
]);

/** 卡片容器外观：三列栅格、悬浮阴影 */
const cardLayout = computed(() => ({
  columns: 3,
  minWidth: 300,
  gap: 14,
  hoverable: true,
  fields: cardFields.value,
}));

/** 拉列表 */
async function reload() {
  loading.value = true;
  try {
    rows.value = await listTunnels();
  } catch (e) {
    msgError(errText(e));
  } finally {
    loading.value = false;
  }
}

/** 拉提供方清单（后端没部署时这里会失败，页面给出可重试的提示） */
async function reloadProviders() {
  try {
    providers.value = await listTunnelProviders();
  } catch (e) {
    msgError(`提供方加载失败：${errText(e)}`);
  }
}

onMounted(() => {
  void reloadProviders();
  void reload();
});

/* ==================== 启停 / 删除 ==================== */

/**
 * 启停切换：运行中则停止，否则启动。
 *
 * @param row 卡片行
 */
async function onToggle(row: Record<string, unknown>) {
  const view = row as unknown as TunnelView;
  const action = view.running ? "停止" : "启动";
  try {
    if (view.running) {
      await stopTunnel(view.id);
    } else {
      await startTunnel(view.id);
    }
    msgSuccess(`${action}成功`);
  } catch (e) {
    msgError(`${action}失败：${errText(e)}`);
  }
  await reload();
}

/**
 * 删除映射（先确认）。
 *
 * @param row 卡片行
 */
async function onDelete(row: Record<string, unknown>) {
  const view = row as unknown as TunnelView;
  try {
    await ElMessageBox.confirm(`删除后该映射的配置会随之移除，确定删除「${view.name || view.id}」？`, "删除映射", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteTunnel(view.id);
    msgSuccess("已删除");
    await reload();
  } catch (e) {
    msgError(`删除失败：${errText(e)}`);
  }
}

/* ==================== 新增 / 编辑弹窗 ==================== */

/** 表单模型：端口用字符串承载，避免输入中途被 Number 化后丢字 */
interface TunnelForm {
  provider: string;
  name: string;
  localPort: string;
  mode: string;
  domain: string;
  remoteAddress: string;
  basicAuth: string;
  authtoken: string;
  token: string;
  autoStart: boolean;
  enabled: boolean;
  remark: string;
}

/**
 * 空白表单。
 *
 * <p>默认选中第一个「可用」的提供方，没有可用的就退到第一个 —— 让用户至少
 * 看到后端注册了什么，而不是面对一个空下拉。</p>
 *
 * @returns 表单初值
 */
function emptyForm(): TunnelForm {
  const first = providers.value.find((item) => item.available) ?? providers.value[0];
  return {
    provider: first?.name ?? "",
    name: "",
    localPort: "8080",
    mode: first?.defaultMode ?? "",
    domain: "",
    remoteAddress: "",
    basicAuth: "",
    authtoken: "",
    token: "",
    autoStart: false,
    enabled: true,
    remark: "",
  };
}

/** 弹窗显隐 */
const visible = ref(false);

/** 编辑目标；为空表示新增 */
const editing = ref<TunnelView | null>(null);

/** 保存中 */
const saving = ref(false);

/** 表单 */
const form = ref<TunnelForm>(emptyForm());

/** 当前表单选中的提供方描述 */
const activeProvider = computed<TunnelProviderInfo | undefined>(() =>
  providers.value.find((item) => item.name === form.value.provider),
);

/** 提供方下拉选项：不可用的标注出来并禁用，避免点下去才失败 */
const providerOptions = computed(() =>
  providers.value.map((item) => ({
    label: item.available ? item.displayName : `${item.displayName}（当前环境不可用）`,
    value: item.name,
    disabled: !item.available,
  })),
);

/** 模式下拉选项：随提供方联动（ngrok 是 http/tcp/tls，cloudflared 是 quick/named） */
const modeOptions = computed(() =>
  (activeProvider.value?.modes ?? []).map((mode) => ({ label: modeLabel(mode), value: mode })),
);

/** 切提供方时把模式拉回该提供方的默认值（原模式不属于新提供方时） */
watch(
  () => form.value.provider,
  () => {
    const info = activeProvider.value;
    if (!info) return;
    if (!info.modes.includes(form.value.mode)) {
      form.value.mode = info.defaultMode;
    }
  },
);

/** 域名只对 http / tls / named 有意义（quick、tcp 由提供方自行分配） */
const showDomain = computed(() => ["http", "tls", "named"].includes(form.value.mode));

/** 远程地址是 ngrok tcp 模式的目标（形如 1.tcp.ngrok.io:20000） */
const showRemoteAddress = computed(() => form.value.provider === "ngrok" && form.value.mode === "tcp");

/** Basic 认证只作用于 ngrok 的 http 隧道 */
const showBasicAuth = computed(() => form.value.provider === "ngrok" && form.value.mode === "http");

/** ngrok authtoken（缺省时后端还会读全局配置与环境变量） */
const showAuthtoken = computed(() => form.value.provider === "ngrok");

/** Cloudflare 命名隧道 Token */
const showToken = computed(() => form.value.provider === "cloudflared" && form.value.mode === "named");

/** 打开「新增」 */
function openCreate() {
  editing.value = null;
  form.value = emptyForm();
  visible.value = true;
}

/**
 * 打开「编辑」。
 *
 * <p>提供方不可变更：映射归属哪个提供方决定它会被哪个实现加载，
 * 后端 {@code update} 也会强制沿用原提供方。</p>
 *
 * @param row 卡片行
 */
function openEdit(row: Record<string, unknown>) {
  const view = row as unknown as TunnelView;
  editing.value = view;
  form.value = {
    provider: view.provider,
    name: view.name ?? "",
    localPort: String(view.localPort ?? 8080),
    mode: view.mode ?? "",
    domain: view.domain ?? "",
    remoteAddress: view.remoteAddress ?? "",
    basicAuth: view.basicAuth ?? "",
    authtoken: view.authtoken ?? "",
    token: view.token ?? "",
    autoStart: Boolean(view.autoStart),
    enabled: view.enabled !== false,
    remark: view.remark ?? "",
  };
  visible.value = true;
}

/**
 * 提交前的前端校验（与后端 {@code TunnelInputs} 同口径，先挡一遍省一次往返）。
 *
 * @returns 通过时返回 null，否则返回提示文案
 */
function validate(): string | null {
  if (!form.value.provider) {
    return "请选择提供方";
  }
  const port = Number(form.value.localPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return "本地端口必须是 1 - 65535 之间的整数";
  }
  if (!form.value.mode) {
    return "请选择隧道模式";
  }
  if (showRemoteAddress.value && !form.value.remoteAddress.trim()) {
    return "tcp 模式必须填写远程地址";
  }
  if (showToken.value && !form.value.token.trim()) {
    return "named 模式必须填写 Cloudflare 隧道 Token";
  }
  return null;
}

/** 保存（新增或更新） */
async function save() {
  const invalid = validate();
  if (invalid) {
    msgError(invalid);
    return;
  }
  const payload: TunnelRecord = {
    id: editing.value?.id ?? "",
    provider: form.value.provider as TunnelProvider,
    name: form.value.name.trim(),
    localPort: Number(form.value.localPort),
    mode: form.value.mode as TunnelMode,
    domain: form.value.domain.trim(),
    remoteAddress: form.value.remoteAddress.trim(),
    basicAuth: form.value.basicAuth.trim(),
    authtoken: form.value.authtoken.trim(),
    token: form.value.token.trim(),
    metadata: editing.value?.metadata ?? "",
    autoStart: form.value.autoStart,
    enabled: form.value.enabled,
    remark: form.value.remark.trim(),
    createdAt: editing.value?.createdAt ?? 0,
    updatedAt: editing.value?.updatedAt ?? 0,
  };
  saving.value = true;
  try {
    if (editing.value) {
      await updateTunnel(editing.value.id, payload);
      msgSuccess("已保存");
    } else {
      await createTunnel(payload);
      msgSuccess("已新增");
    }
    visible.value = false;
    await reload();
  } catch (e) {
    msgError(`保存失败：${errText(e)}`);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="tunnel-page">
    <header class="tunnel-page__head">
      <div class="tunnel-page__intro">
        <h2 class="tunnel-page__title">隧道列表</h2>
        <p class="tunnel-page__hint">
          共 {{ rows.length }} 条 · 在线 {{ runningCount }} 条 ·
          提供方由后端 SPI 注册，新增时选择；同一条记录只属于一个提供方
        </p>
      </div>
      <div class="tunnel-page__actions">
        <ReButton icon="Refresh" :loading="loading" @click="reload">刷新</ReButton>
        <ReButton icon="Plus" type="primary" @click="openCreate">新增</ReButton>
      </div>
    </header>

    <ReTable
      class="tunnel-page__table"
      table-id="tunnel-list"
      :loading="loading"
      :data="rows"
      :columns="columns"
      layout="card"
      :layout-switch="false"
      :layout-persist="false"
      :layout-card="cardLayout"
      :pagination="false"
      row-key="id"
      empty-text="还没有映射：点右上角「新增」，选一个提供方填上本地端口即可"
      @row-click="openEdit"
    >
      <!-- 卡片底部操作条：卡片其余内容由 layoutCard.fields 渲染，这里只补按钮 -->
      <template #card="{ row }">
        <div class="tunnel-card__actions">
          <ReButton
            size="small"
            plain
            :type="row.running ? 'warning' : 'success'"
            :icon="row.running ? 'VideoPause' : 'VideoPlay'"
            @click.stop="onToggle(row)"
          >
            {{ row.running ? "停止" : "启动" }}
          </ReButton>
          <ReButton size="small" plain icon="Edit" @click.stop="openEdit(row)">编辑</ReButton>
          <ReButton size="small" plain type="danger" icon="Delete" @click.stop="onDelete(row)">删除</ReButton>
        </div>
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="editing ? '编辑映射' : '新增映射'"
      :width="560"
      :close-on-click-modal="false"
    >
      <div class="tunnel-form">
        <p v-if="!providers.length" class="tunnel-form__warn">
          后端没有返回任何提供方：请确认已经部署 <code>/ms/tunnel</code>，并引入了
          spring-support-ngrok-starter 或 spring-support-cloudflared-starter。
        </p>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>提供方</span>
          <ReSelect
            v-model="form.provider"
            :data="providerOptions"
            :clearable="false"
            :disabled="Boolean(editing)"
            placeholder="选择提供方"
          />
          <span class="tunnel-form__hint">
            {{ editing ? "提供方不可变更：它决定这条记录由哪个实现加载" : "引入哪个提供方 starter，这里就有哪一项" }}
          </span>
        </div>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label">名称</span>
          <ReInput v-model="form.name" maxlength="64" :placeholder="`留空自动命名（${form.provider}-${form.localPort}）`" />
        </div>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>本地端口</span>
          <ReInput v-model="form.localPort" type="number" placeholder="如 8080" />
          <span class="tunnel-form__hint">映射到 127.0.0.1 的这个端口</span>
        </div>

        <div class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>模式</span>
          <ReSelect v-model="form.mode" :data="modeOptions" :clearable="false" placeholder="选择模式" />
        </div>

        <div v-if="showDomain" class="tunnel-form__item">
          <span class="tunnel-form__label">域名</span>
          <ReInput v-model="form.domain" placeholder="可选，留空由提供方分配" />
        </div>

        <div v-if="showRemoteAddress" class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>远程地址</span>
          <ReInput v-model="form.remoteAddress" placeholder="如 1.tcp.ngrok.io:20000" />
        </div>

        <div v-if="showBasicAuth" class="tunnel-form__item">
          <span class="tunnel-form__label">Basic 认证</span>
          <ReInput v-model="form.basicAuth" placeholder="user:password，可选" />
        </div>

        <div v-if="showAuthtoken" class="tunnel-form__item">
          <span class="tunnel-form__label">authtoken</span>
          <ReInput v-model="form.authtoken" placeholder="留空则用 plugin.ngrok.authtoken 或环境变量" />
        </div>

        <div v-if="showToken" class="tunnel-form__item">
          <span class="tunnel-form__label"><i class="req">*</i>隧道 Token</span>
          <ReInput v-model="form.token" placeholder="Cloudflare Zero Trust 隧道 Token" />
        </div>

        <div class="tunnel-form__item tunnel-form__item--inline">
          <span class="tunnel-form__label">自动启动</span>
          <ReSwitch v-model="form.autoStart" />
          <span class="tunnel-form__hint">应用启动时自动拉起这条映射</span>
        </div>

        <div class="tunnel-form__item tunnel-form__item--inline">
          <span class="tunnel-form__label">启用</span>
          <ReSwitch v-model="form.enabled" />
          <span class="tunnel-form__hint">关闭后不会自动启动，也不允许手动启动</span>
        </div>

        <div class="tunnel-form__item tunnel-form__item--stack">
          <span class="tunnel-form__label">备注</span>
          <ReInput v-model="form.remark" type="textarea" :rows="2" maxlength="200" placeholder="可选" />
        </div>
      </div>

      <template #footer="{ cancel }">
        <ReButton @click="cancel">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.tunnel-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px 16px 0;
  box-sizing: border-box;
  background: var(--el-bg-color);
}

.tunnel-page__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tunnel-page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tunnel-page__hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.tunnel-page__actions {
  display: flex;
  gap: 8px;
}

/* 表格吃满剩余高度，卡片区自己滚 */
.tunnel-page__table {
  flex: 1 1 auto;
  min-height: 0;
}

.tunnel-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tunnel-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tunnel-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tunnel-form__item--inline {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tunnel-form__item--inline .tunnel-form__label {
  min-width: 68px;
}

.tunnel-form__item--stack {
  align-items: stretch;
}

.tunnel-form__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.tunnel-form__label .req {
  margin-right: 2px;
  font-style: normal;
  color: var(--el-color-danger);
}

.tunnel-form__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.tunnel-form__warn {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 6px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}
</style>
