<script setup lang="ts">
/**
 * 内网穿透页面（@pages/tunnel）
 *
 * <p><strong>一个页面、一套接口、一条链路。</strong>后端把 ngrok 与 Cloudflare
 * Tunnel 收敛成同一个 SPI（{@code TunnelProvider}）+ 同一个控制器
 * （{@code /ms/tunnel}），提供方只是映射记录上的一个字段。</p>
 *
 * <p>界面按「链路」组织：每条映射渲染成一张横向路由卡，从左到右分别是
 * 本地端口 → 提供方 / 模式 → 公网入口。运行态用卡片左侧色条表达，错误原因
 * 紧贴链路下方，不再把「错误」当成表格里的一列。</p>
 *
 * <p>新增与编辑仍是同一个弹窗，只是入口从卡片底部按钮上移到了链路右侧。</p>
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

/* ==================== 列表与运行态 ==================== */

/**
 * 把异常转成可读文案。
 *
 * @param e 捕获到的异常
 * @returns 提示文案
 */
function errText(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "请求失败";
}

/** 全部映射（不按提供方筛选：提供方已是链路上的一个节点） */
const rows = ref<TunnelView[]>([]);

/** 列表加载态 */
const loading = ref(false);

/** 后端已注册的提供方（下拉与模式选项的唯一来源） */
const providers = ref<TunnelProviderInfo[]>([]);

/** 链路状态：异常优先于运行中，未运行且无错误为已停止 */
type TunnelState = "running" | "error" | "stopped";

/** 状态文案（颜色之外再给一次文字，色弱也能读） */
const STATE_LABELS: Record<TunnelState, string> = {
  running: "运行中",
  error: "异常",
  stopped: "已停止",
};

/**
 * 推导一条映射的展示状态。
 *
 * @param row 映射行
 * @returns 链路状态
 */
function stateOf(row: TunnelView): TunnelState {
  if (row.running) return "running";
  if (row.error) return "error";
  return "stopped";
}

const runningCount = computed(() => rows.value.filter((row) => stateOf(row) === "running").length);
const errorCount = computed(() => rows.value.filter((row) => stateOf(row) === "error").length);
const stoppedCount = computed(() => rows.value.filter((row) => stateOf(row) === "stopped").length);

/** 状态筛选 */
const filter = ref<"all" | TunnelState>("all");

const filters = computed(() => [
  { value: "all" as const, label: "全部", count: rows.value.length },
  { value: "running" as const, label: "在线", count: runningCount.value },
  { value: "error" as const, label: "异常", count: errorCount.value },
  { value: "stopped" as const, label: "已停止", count: stoppedCount.value },
]);

/** 通过筛选并排序后的链路：异常 → 在线 → 已停止，稳定排序 */
const visibleRows = computed(() => {
  const rank: Record<TunnelState, number> = { error: 0, running: 1, stopped: 2 };
  return rows.value
    .filter((row) => filter.value === "all" || stateOf(row) === filter.value)
    .slice()
    .sort((a, b) => rank[stateOf(a)] - rank[stateOf(b)]);
});

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
 * 公网入口（取第一条；多入口时在 title 里给全）。
 *
 * @param row 映射行
 * @returns 公网地址，未启动时为空串
 */
function primaryUrl(row: TunnelView): string {
  return row.publicUrls?.[0] ?? "";
}

/** 供 hover 查看全部公网地址 */
function allUrls(row: TunnelView): string {
  return row.publicUrls?.length ? row.publicUrls.join("\n") : "";
}

/**
 * 复制公网地址（HTTP 场景允许没有 Clipboard API）。
 *
 * @param text 待复制文本
 */
async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    msgSuccess("已复制公网地址");
    return;
  } catch {
    // 退化到 execCommand
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
    msgSuccess("已复制公网地址");
  } catch {
    msgError("复制失败，请手动选择地址");
  }
}

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
 * @param row 链路行
 */
async function onToggle(row: TunnelView) {
  const action = row.running ? "停止" : "启动";
  try {
    if (row.running) {
      await stopTunnel(row.id);
    } else {
      await startTunnel(row.id);
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
 * @param row 链路行
 */
async function onDelete(row: TunnelView) {
  try {
    await ElMessageBox.confirm(`删除后该映射的配置会随之移除，确定删除「${row.name || row.id}」？`, "删除映射", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteTunnel(row.id);
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
 * @param row 链路行
 */
function openEdit(row: TunnelView) {
  editing.value = row;
  form.value = {
    provider: row.provider,
    name: row.name ?? "",
    localPort: String(row.localPort ?? 8080),
    mode: row.mode ?? "",
    domain: row.domain ?? "",
    remoteAddress: row.remoteAddress ?? "",
    basicAuth: row.basicAuth ?? "",
    authtoken: row.authtoken ?? "",
    token: row.token ?? "",
    autoStart: Boolean(row.autoStart),
    enabled: row.enabled !== false,
    remark: row.remark ?? "",
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
        <h2 class="tunnel-page__title">隧道链路</h2>
        <p class="tunnel-page__hint">
          共 {{ rows.length }} 条 · 在线 {{ runningCount }} 条 · 异常 {{ errorCount }} 条
          <span class="tunnel-page__hint-flow">本地端口 → 提供方 → 公网入口</span>
        </p>
      </div>
      <div class="tunnel-page__actions">
        <div class="tunnel-page__filters" role="group" aria-label="按状态筛选">
          <button
            v-for="item in filters"
            :key="item.value"
            type="button"
            class="tunnel-page__filter"
            :class="{ 'is-active': filter === item.value }"
            :aria-pressed="filter === item.value"
            @click="filter = item.value"
          >
            {{ item.label }}<span class="tunnel-page__filter-count">{{ item.count }}</span>
          </button>
        </div>
        <ReButton icon="Refresh" :loading="loading" @click="reload">刷新</ReButton>
        <ReButton icon="Plus" type="primary" @click="openCreate">新增</ReButton>
      </div>
    </header>

    <p v-if="!providers.length" class="tunnel-page__warn">
      后端没有返回任何提供方：请确认监控服务已引入内网穿透模块，并且
      <code>/ms/tunnel</code> 可访问。
    </p>

    <section
      class="tunnel-routes"
      :class="{ 'is-loading': loading }"
      aria-label="隧道链路列表"
    >
      <p v-if="loading && !rows.length" class="tunnel-page__loading">正在加载隧道…</p>

      <article
        v-for="row in visibleRows"
        :key="row.id"
        class="tunnel-route"
        :class="`tunnel-route--${stateOf(row)}`"
        :title="row.remark || row.name"
        @click="openEdit(row)"
      >
        <div class="tunnel-route__local">
          <div class="tunnel-route__name">
            <i class="tunnel-route__dot"></i>
            <span class="tunnel-route__title-text">{{ row.name || row.id }}</span>
            <span class="tunnel-route__state" :class="`tunnel-route__state--${stateOf(row)}`">
              {{ STATE_LABELS[stateOf(row)] }}
            </span>
            <span v-if="row.enabled === false" class="tunnel-route__badge">已禁用</span>
          </div>
          <b class="tunnel-route__port">{{ row.localPort }}</b>
          <span class="tunnel-route__local-hint">本地 127.0.0.1</span>
        </div>

        <div class="tunnel-route__flow">
          <span class="tunnel-route__tag">{{ providerLabel(row.provider) }}</span>
          <span class="tunnel-route__tag tunnel-route__tag--mode">{{ modeLabel(row.mode) }}</span>
          <span class="tunnel-route__line" aria-hidden="true"></span>
        </div>

        <div class="tunnel-route__public">
          <span class="tunnel-route__label">公网入口</span>
          <span v-if="primaryUrl(row)" class="tunnel-route__url" :title="allUrls(row)">
            <span class="tunnel-route__url-text">{{ primaryUrl(row) }}</span>
            <button
              type="button"
              class="tunnel-route__copy"
              title="复制公网地址"
              @click.stop="copyText(primaryUrl(row))"
            >
              复制
            </button>
          </span>
          <span v-else class="tunnel-route__url tunnel-route__url--empty">
            {{ row.enabled === false ? "启用后才能启动" : row.error ? "未分配" : "启动后由提供方分配" }}
          </span>
        </div>

        <div class="tunnel-route__actions" @click.stop>
          <ReButton
            v-if="!row.running"
            size="small"
            plain
            type="success"
            icon="VideoPlay"
            :disabled="row.enabled === false"
            @click="onToggle(row)"
          >
            {{ row.error ? "重试" : "启动" }}
          </ReButton>
          <ReButton
            v-else
            size="small"
            plain
            type="warning"
            icon="VideoPause"
            @click="onToggle(row)"
          >
            停止
          </ReButton>
          <ReButton size="small" plain icon="Edit" @click="openEdit(row)">编辑</ReButton>
          <ReButton size="small" plain type="danger" icon="Delete" @click="onDelete(row)">删除</ReButton>
        </div>

        <p v-if="row.error" class="tunnel-route__error">
          <span class="tunnel-route__error-dot" aria-hidden="true">!</span>
          {{ row.error }}
        </p>

        <div class="tunnel-route__meta">
          <span v-if="row.domain">域名 {{ row.domain }}</span>
          <span v-if="row.remoteAddress">远程 {{ row.remoteAddress }}</span>
          <span v-if="row.autoStart">自动启动</span>
          <span v-if="row.remark">{{ row.remark }}</span>
        </div>
      </article>

      <p
        v-if="!loading && !visibleRows.length"
        class="tunnel-page__empty"
      >
        <template v-if="rows.length">当前筛选下没有链路，换一个状态看看</template>
        <template v-else>还没有映射：点右上角「新增」，选一个提供方填上本地端口即可</template>
      </p>
    </section>

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

        <div class="tunnel-form__section">基本</div>

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

        <div class="tunnel-form__row">
          <div class="tunnel-form__item">
            <span class="tunnel-form__label"><i class="req">*</i>本地端口</span>
            <ReInput v-model="form.localPort" type="number" placeholder="如 8080" />
            <span class="tunnel-form__hint">映射到 127.0.0.1 的这个端口</span>
          </div>

          <div class="tunnel-form__item">
            <span class="tunnel-form__label"><i class="req">*</i>模式</span>
            <ReSelect v-model="form.mode" :data="modeOptions" :clearable="false" placeholder="选择模式" />
            <span class="tunnel-form__hint">模式决定下面要填哪些参数</span>
          </div>
        </div>

        <div v-if="showDomain || showRemoteAddress || showBasicAuth || showAuthtoken || showToken" class="tunnel-form__section">
          连接
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

        <div class="tunnel-form__section">运行</div>

        <div class="tunnel-form__row">
          <div class="tunnel-form__item tunnel-form__item--inline">
            <span class="tunnel-form__label">自动启动</span>
            <ReSwitch v-model="form.autoStart" />
            <span class="tunnel-form__hint">应用启动时自动拉起</span>
          </div>

          <div class="tunnel-form__item tunnel-form__item--inline">
            <span class="tunnel-form__label">启用</span>
            <ReSwitch v-model="form.enabled" />
            <span class="tunnel-form__hint">关闭后不允许启动</span>
          </div>
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

/* ========== 头部 ========== */
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

.tunnel-page__hint-flow {
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-placeholder);
}

.tunnel-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 状态筛选：轻量分段控件 */
.tunnel-page__filters {
  display: inline-flex;
  padding: 2px;
  gap: 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.tunnel-page__filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.tunnel-page__filter:hover {
  color: var(--el-color-primary);
}

.tunnel-page__filter.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tunnel-page__filter-count {
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 400;
  text-align: center;
}

.tunnel-page__filter.is-active .tunnel-page__filter-count {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.tunnel-page__warn {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 6px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

/* ========== 链路列表 ========== */
.tunnel-routes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 16px;
  overflow-y: auto;
}

.tunnel-routes.is-loading {
  opacity: 0.75;
}

.tunnel-route {
  position: relative;
  display: grid;
  grid-template-columns: 190px minmax(150px, 1fr) minmax(220px, 300px) auto;
  grid-template-areas:
    "local flow public actions"
    "error error error error"
    "meta meta meta meta";
  align-items: center;
  column-gap: 14px;
  row-gap: 6px;
  padding: 12px 14px 10px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}

.tunnel-route:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 3px 12px rgba(64, 158, 255, 0.08);
}

.tunnel-route--running {
  border-left-color: var(--el-color-success);
}

/* 异常链路只加重左侧色条，避免整卡飘红盖过「异常原因」本身 */
.tunnel-route--error {
  border-left-color: var(--el-color-danger);
}

.tunnel-route--stopped {
  border-left-color: var(--el-border-color);
}

.tunnel-route__local {
  grid-area: local;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.tunnel-route__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tunnel-route__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: var(--el-border-color-darker);
}

.tunnel-route--running .tunnel-route__dot {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px var(--el-color-success-light-9);
}

.tunnel-route--error .tunnel-route__dot {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px var(--el-color-danger-light-9);
}

.tunnel-route__title-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tunnel-route__badge {
  flex: 0 0 auto;
  padding: 0 5px;
  border-radius: 4px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  font-size: 10px;
  line-height: 16px;
}

/* 状态：文字 + 底色，颜色只作辅助 */
.tunnel-route__state {
  flex: 0 0 auto;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.tunnel-route__state--running {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.tunnel-route__state--error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.tunnel-route__port {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tunnel-route__local-hint {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.tunnel-route__flow {
  grid-area: flow;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.tunnel-route__tag {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.tunnel-route__tag--mode {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

.tunnel-route__line {
  flex: 1 1 auto;
  min-width: 24px;
  height: 1px;
  background-image: repeating-linear-gradient(
    90deg,
    var(--el-text-color-placeholder) 0 5px,
    transparent 5px 10px
  );
  position: relative;
}

.tunnel-route__line::after {
  content: "";
  position: absolute;
  right: 0;
  top: -3px;
  border-left: 5px solid var(--el-text-color-placeholder);
  border-top: 3.5px solid transparent;
  border-bottom: 3.5px solid transparent;
}

.tunnel-route__public {
  grid-area: public;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tunnel-route__label {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.tunnel-route__url {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 5px;
  background: var(--el-fill-color-lighter);
}

.tunnel-route__url--empty {
  border-style: dashed;
  background: transparent;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.tunnel-route__url-text {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.tunnel-route__copy {
  flex: 0 0 auto;
  padding: 0 4px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 11px;
  line-height: 18px;
  cursor: pointer;
}

.tunnel-route__copy:hover {
  background: var(--el-color-primary-light-9);
}

.tunnel-route__actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.tunnel-route__error {
  grid-area: error;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 0 0;
  padding: 6px 8px;
  border-radius: 5px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 11.5px;
  line-height: 1.5;
}

.tunnel-route__error-dot {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
}

.tunnel-route__meta {
  grid-area: meta;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.tunnel-page__empty,
.tunnel-page__loading {
  margin: 4px 0;
  padding: 28px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
  text-align: center;
}

/* ========== 弹窗表单 ========== */
.tunnel-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tunnel-form__section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
}

.tunnel-form__section::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}

.tunnel-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tunnel-form__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
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

@media (max-width: 960px) {
  .tunnel-route {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "local actions"
      "flow flow"
      "public public"
      "error error"
      "meta meta";
    row-gap: 8px;
  }

  .tunnel-route__line {
    display: none;
  }

  .tunnel-route__public {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .tunnel-page {
    padding: 12px 12px 0;
  }

  .tunnel-page__actions {
    width: 100%;
    justify-content: space-between;
  }

  .tunnel-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
