<script setup lang="ts">
/**
 * 隧道 / 反向隧道工作台 —— 表格 + 新增弹框
 *
 * <p>正向隧道 = 把本地端口转发到远端（{@code ssh -L}）；反向隧道 = 把远端端口
 * 转发回本地（{@code ssh -R}），常用于「外网机器连不回内网」的救场。</p>
 *
 * <p>用户要求：两端都用<b>表格</b>展示，新增走顶部「新增」按钮 + 弹框表单，
 * 而不是把表单永久摊在页面上 —— 隧道是「建好就在后台跑」的东西，
 * 日常动作是看列表和启停，不是一直改参数。</p>
 *
 * <p>表格列：隧道名称 / 方向 / 协议 / 转发路径 / 中转主机 / 状态 / 速率 / 操作。
 * 除「操作」外全部可按列排序（点同列切升降序，点别列重来；空值沉底）。</p>
 *
 * <p>数据走后端真实接口（{@code /ms/server/host/{id}/tunnel}）：列表 / 建立 /
 * 启停 / 删除全量真连；建立与启停依赖受控主机的 SSH 登录身份。
 * 「生成 ssh 命令」在弹框里，按当前填的参数算出可粘到本地终端的命令。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref, watch } from "vue";
import { message } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import { createTunnel, delTunnel, generateSshCommand, listTunnels, updateTunnelState } from "../../api";

const props = defineProps<{
  /** 当前上下文主机 id（隧道接口路径参数；0 表示无上下文 → 空态） */
  hostId: number;
  /** 当前上下文主机名（展示用） */
  hostName: string;
  /** 渲染方向：forward 只显示正向、reverse 只显示反向、both 双向（兼容旧用法） */
  mode?: "forward" | "reverse" | "both";
}>();

const mode = computed<"forward" | "reverse" | "both">(() => props.mode ?? "both");
/** 面板自身的建立方向（both 时按正向建，弹框里可改） */
const panelDir = computed<"forward" | "reverse">(() => (mode.value === "reverse" ? "reverse" : "forward"));
/** 标题 */
const title = computed(() =>
  mode.value === "reverse" ? "反向隧道" : mode.value === "forward" ? "隧道（正向）" : "隧道 · 反向隧道");

/** 无有效主机上下文（不应调接口） */
const noHost = computed(() => !props.hostId);

/* ==================== 真实接口 ==================== */

interface Tunnel {
  id: number;
  name: string;
  dir: "forward" | "reverse";
  proto: string;
  status: "running" | "stopped" | "fail";
  /** 正向: 本地端口→目标:端口；反向: 远端端口→本地:端口 */
  from: string;
  to: string;
  via: string;
  rate?: string;
}

/** 隧道列表 */
const tunnels = ref<Tunnel[]>([]);
const loading = ref(false);
const busyKey = ref("");

/** 加载中（无主机上下文不调接口） */
async function refresh(): Promise<void> {
  if (noHost.value) {
    tunnels.value = [];
    return;
  }
  loading.value = true;
  try {
    tunnels.value = (await listTunnels(props.hostId)) as Tunnel[];
  } catch (e: any) {
    message.error("读取隧道失败: " + (e?.message ?? e));
  } finally {
    loading.value = false;
  }
}

/** 当前方向过滤后的隧道 */
const shown = computed(() =>
  mode.value === "both"
    ? tunnels.value
    : tunnels.value.filter((t) => t.dir === mode.value));

/** 当前方向隧道数（页头计数） */
const count = computed(() => shown.value.length);
const activeCount = computed(() => shown.value.filter((t) => t.status === "running").length);

function dirLabel(d: Tunnel["dir"]): string {
  return d === "forward" ? "正向" : "反向";
}
const dirTone = (d: Tunnel["dir"]) => (d === "forward" ? "lb-info" : "lb-brand");
const statusTone = (s: Tunnel["status"]) => (s === "running" ? "lb-ok" : s === "fail" ? "lb-bad" : "lb-mute");
const statusLabel = (s: Tunnel["status"]) => (s === "running" ? "运行中" : s === "fail" ? "连接失败" : "已停止");

/* ==================== 排序 ==================== */

type SortKey = "name" | "dir" | "proto" | "path" | "via" | "status" | "rate";

/** 排序列（默认「名称」升序） */
const sortKey = ref<SortKey>("name");
const sortAsc = ref(true);

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "隧道名称" },
  { key: "dir", label: "方向" },
  { key: "proto", label: "协议" },
  { key: "path", label: "转发路径" },
  { key: "via", label: "中转主机" },
  { key: "status", label: "状态" },
  { key: "rate", label: "速率" },
];

/** 状态排序权重（运行中在前） */
const STATUS_WEIGHT: Record<Tunnel["status"], number> = { running: 0, stopped: 1, fail: 2 };

/** 速率单位 → 倍数（后端给的是 "1.4 MB/s" 这类带单位的字符串） */
const RATE_UNIT: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

/**
 * 速率字符串转字节数，用于排序。
 *
 * <p>不能直接 parseFloat 比大小：那样 "320 KB/s"（0.31 MB/s）会被当成 320，
 * 排到 "1.4 MB/s" 前面。这里按单位换算成字节，单位缺失时按 B 处理。</p>
 *
 * @param rate 形如 "1.4 MB/s" / "320 KB/s"
 * @returns 每秒字节数
 */
function rateToBytes(rate: string): number {
  const m = /^([\d.]+)\s*([KMGT]?B)/i.exec(rate.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 0;
  return n * (RATE_UNIT[m[2].toUpperCase()] ?? 1);
}

/**
 * 某行在指定列上的可比较值。
 *
 * <p>空值返回 null：不论升序降序都沉底，避免「没有速率」的隧道跑到列表最上面。</p>
 *
 * @param t   隧道行
 * @param key 列
 * @returns 可比较值；空值为 null
 */
function sortValue(t: Tunnel, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return t.name || null;
    case "dir":
      return t.dir === "forward" ? 0 : 1;
    case "proto":
      return t.proto || null;
    case "path":
      return t.from && t.to ? `${t.from} → ${t.to}` : null;
    case "via":
      return t.via || null;
    case "status":
      return STATUS_WEIGHT[t.status] ?? null;
    case "rate":
      return t.rate || null;
    default:
      return null;
  }
}

/** 排序点击：同列切向，异列从升序重来 */
function toggleSort(key: SortKey): void {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

/** 排好序的行 */
const sorted = computed<Tunnel[]>(() => {
  const key = sortKey.value;
  const dir = sortAsc.value ? 1 : -1;
  return [...shown.value].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    const sa = String(va);
    const sb = String(vb);
    // 速率形如 "1.2 MB/s"：先换算成字节再比，否则 "320 KB/s" 会排到 "1.4 MB/s" 前面
    if (key === "rate") {
      const na = rateToBytes(sa);
      const nb = rateToBytes(sb);
      if (na !== nb) return (na - nb) * dir;
      return 0;
    }
    return sa.localeCompare(sb, "zh-CN") * dir;
  });
});

/* ==================== 启停 / 删除 ==================== */

/** 切换运行态（真实接口；启动失败后端会把状态标为 fail） */
async function toggleStatus(t: Tunnel): Promise<void> {
  if (noHost.value) return;
  const next: "RUNNING" | "STOPPED" = t.status === "running" ? "STOPPED" : "RUNNING";
  busyKey.value = `state-${t.id}`;
  try {
    const updated = await updateTunnelState(props.hostId, t.id, next);
    const idx = tunnels.value.findIndex((x) => x.id === t.id);
    if (idx >= 0) tunnels.value[idx] = { ...t, ...updated };
  } catch (e: any) {
    // 启动失败后端会把状态标为 fail
    const idx = tunnels.value.findIndex((x) => x.id === t.id);
    if (idx >= 0) tunnels.value[idx] = { ...t, status: "fail" };
    message.error((e?.message ?? e) || "切换失败");
  } finally {
    busyKey.value = "";
  }
}

/** 删除隧道（真实接口） */
async function removeTunnel(t: Tunnel): Promise<void> {
  if (noHost.value) return;
  busyKey.value = `del-${t.id}`;
  try {
    await delTunnel(props.hostId, t.id);
    tunnels.value = tunnels.value.filter((x) => x.id !== t.id);
    message.success(`已删除 ${t.name || `#${t.id}`}`);
  } catch (e: any) {
    message.error((e?.message ?? e) || "删除失败");
  } finally {
    busyKey.value = "";
  }
}

/* ==================== 新增弹框 ==================== */

const createVisible = ref(false);

/** 表单默认参数（按方向给一套能直接用的示例值） */
function defaultsFor(dir: "forward" | "reverse") {
  return dir === "forward"
    ? {
        listen: "127.0.0.1",
        port: "3306",
        targetHost: "10.0.2.15",
        targetPort: "3306",
        backHost: "192.168.1.21",
        backPort: "3000",
      }
    : {
        listen: "0.0.0.0",
        port: "8080",
        targetHost: "10.0.2.15",
        targetPort: "3306",
        backHost: "192.168.1.21",
        backPort: "3000",
      };
}

const form = ref({
  name: "",
  dir: "forward" as "forward" | "reverse",
  listen: "127.0.0.1",
  port: "3306",
  targetHost: "10.0.2.15",
  targetPort: "3306",
  backHost: "192.168.1.21",
  backPort: "3000",
  identity: "",
});

/** 表单方向切换 → 套用该方向的默认监听/端口（避免正向的值漏到反向里） */
watch(
  () => form.value.dir,
  (dir) => {
    const d = defaultsFor(dir);
    form.value.listen = d.listen;
    form.value.port = d.port;
  },
);

/** 打开新增弹框（方向跟随当前面板） */
function openCreate(): void {
  const dir = panelDir.value;
  const d = defaultsFor(dir);
  form.value = { name: "", dir, identity: "", ...d };
  sshCommand.value = null;
  commandError.value = "";
  createVisible.value = true;
}

/** 端口合法性（建立与生成命令共用） */
function portError(raw: string): string | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 65535) return `无效的端口：${raw}`;
  return undefined;
}

/** 生成并缓存 ssh 命令（ssh -L / ssh -R），用于在本地终端验证同一条隧道 */
const sshCommand = ref<string | null>(null);
const commandError = ref("");

async function onGenerateCommand(): Promise<void> {
  if (noHost.value) return;
  const port = portError(form.value.port);
  if (port) { commandError.value = port; return; }
  busyKey.value = "cmd";
  commandError.value = "";
  sshCommand.value = null;
  try {
    const { command } = await generateSshCommand(props.hostId, { ...form.value });
    sshCommand.value = command;
  } catch (e: any) {
    commandError.value = (e?.message ?? e) || "生成命令失败";
  } finally {
    busyKey.value = "";
  }
}

/** 复制命令行到剪贴板，粘贴到本地终端即可拉起隧道 */
async function copyCommand(): Promise<void> {
  const cmd = sshCommand.value;
  if (!cmd) return;
  try {
    await navigator.clipboard.writeText(cmd);
    message.success("命令已复制，粘贴到本地终端即可拉起隧道");
  } catch {
    message.warning("复制失败，请手动全选复制");
  }
}

/** 建立隧道（真实接口，dir 取表单选择） */
async function submitCreate(): Promise<void> {
  if (noHost.value) return;
  if (!form.value.name.trim()) {
    message.warning("请填写隧道名称");
    return;
  }
  const port = portError(form.value.port);
  if (port) { message.warning(port); return; }
  busyKey.value = "create";
  try {
    const dir = form.value.dir;
    const payload = dir === "forward"
      ? {
          name: form.value.name.trim(),
          dir,
          listen: form.value.listen,
          port: form.value.port,
          targetHost: form.value.targetHost,
          targetPort: form.value.targetPort,
          identity: form.value.identity,
        }
      : {
          name: form.value.name.trim(),
          dir,
          listen: form.value.listen,
          port: form.value.port,
          backHost: form.value.backHost,
          backPort: form.value.backPort,
          identity: form.value.identity,
        };
    const created = await createTunnel(props.hostId, payload);
    tunnels.value = [...tunnels.value, created as Tunnel];
    createVisible.value = false;
    message.success("隧道已建立（stopped），点「启动」生效");
  } catch (e: any) {
    message.error((e?.message ?? e) || "建立失败");
  } finally {
    busyKey.value = "";
  }
}

onMounted(refresh);
</script>

<template>
  <div class="tu">
    <!-- 页头：标题 + 主机 + 统计 + 新增 / 刷新 -->
    <div class="tu-head">
      <span class="tu-title">{{ title }}</span>
      <span class="lb-pill lb-pill--plain">{{ hostName || "未绑定主机" }}</span>
      <span class="lb-pill" :class="activeCount ? 'lb-ok' : 'lb-mute'">
        {{ activeCount }} 运行中 · 共 {{ count }}
      </span>
      <span class="lb-spacer" />
      <span class="lb-dim tu-hint">
        {{ mode === 'reverse' ? '远端端口 → 本机' : mode === 'forward' ? '本机端口 → 远端' : '正向：本机→远端 · 反向：远端→本机' }}
      </span>
      <button type="button" class="lb-btn" :disabled="loading" title="刷新" @click="refresh">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
      <button type="button" class="lb-btn is-primary" :disabled="noHost" title="新增隧道" @click="openCreate">
        <ReIcon name="Plus" :size="11" />新增
      </button>
    </div>

    <!-- 隧道表格 -->
    <section class="lb-pane tu-pane">
      <div class="tu-table" v-loading="loading">
        <!-- 表头 -->
        <div class="tu-row tu-row--head">
          <button
            v-for="c in COLUMNS"
            :key="c.key"
            type="button"
            class="tu-th"
            :class="[`is-${c.key}`, { 'is-sorted': sortKey === c.key }]"
            :title="`按${c.label}排序`"
            @click="toggleSort(c.key)"
          >
            <span>{{ c.label }}</span>
            <ReIcon
              v-if="sortKey === c.key"
              :name="sortAsc ? 'Top' : 'Bottom'"
              :size="10"
              class="tu-th__arrow"
            />
          </button>
          <div class="tu-th is-ops">操作</div>
        </div>

        <!-- 空态 -->
        <div v-if="!sorted.length && !loading" class="lb-empty">
          <ReIcon name="Connection" :size="22" />
          <b>还没有隧道</b>
          <span>点右上角「新增」建立一条{{ mode === 'reverse' ? '反向' : mode === 'forward' ? '正向' : '正向 / 反向' }}隧道，建好后点「启动」生效。</span>
        </div>

        <!-- 数据行 -->
        <div v-for="t in sorted" :key="t.id" class="tu-row">
          <div class="tu-cell is-name">
            <i class="lb-dot" :class="statusTone(t.status)" />
            <span class="tu-name">{{ t.name || `隧道 #${t.id}` }}</span>
          </div>
          <div class="tu-cell is-dir">
            <span class="lb-pill" :class="dirTone(t.dir)">{{ dirLabel(t.dir) }}</span>
          </div>
          <div class="tu-cell is-proto">
            <span class="lb-pill lb-pill--plain">{{ t.proto || '—' }}</span>
          </div>
          <div
            class="tu-cell is-path lb-mono"
            :title="t.from && t.to ? `${t.from} → ${t.to}` : ''"
          >
            <template v-if="t.from && t.to">
              <span class="tu-path__from">{{ t.from }}</span>
              <span class="tu-path__to">
                <ReIcon name="ArrowRight" :size="9" class="tu-path__arrow" />{{ t.to }}
              </span>
            </template>
            <span v-else class="lb-dim">—</span>
          </div>
          <div class="tu-cell is-via">
            <span v-if="t.via" class="lb-mono tu-ellipsis" :title="t.via">{{ t.via }}</span>
            <span v-else class="lb-dim">—</span>
          </div>
          <div class="tu-cell is-status">
            <span class="lb-pill" :class="statusTone(t.status)">{{ statusLabel(t.status) }}</span>
          </div>
          <div class="tu-cell is-rate lb-mono">
            <span v-if="t.rate">{{ t.rate }}</span>
            <span v-else class="lb-dim">—</span>
          </div>
          <div class="tu-cell is-ops">
            <button
              type="button"
              class="lb-btn"
              :class="t.status === 'running' ? 'is-bad' : 'is-primary'"
              :disabled="busyKey === `state-${t.id}`"
              @click="toggleStatus(t)"
            >
              <ReIcon :name="t.status === 'running' ? 'VideoPause' : 'VideoPlay'" :size="11" />
              {{ t.status === 'running' ? '停止' : '启动' }}
            </button>
            <button type="button" class="lb-btn is-bad" :disabled="busyKey === `del-${t.id}`" title="删除" @click="removeTunnel(t)">
              <ReIcon name="Delete" :size="11" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 新增弹框 -->
    <ReDialog
      v-model="createVisible"
      :title="form.dir === 'forward' ? '新增隧道（正向 · ssh -L）' : '新增反向隧道（ssh -R）'"
      width="560px"
      confirm-text="建立"
      ok-text="建立"
      cancel-text="取消"
      :confirm-loading="busyKey === 'create'"
      :footer-hidden="false"
      @ok="submitCreate"
      @cancel="createVisible = false"
    >
      <div class="tu-form">
        <label class="tu-field">
          <span>隧道名称</span>
          <input v-model="form.name" class="tu-input" placeholder="如：开发库直连" />
        </label>

        <!-- both 模式下才允许在弹框里选方向 -->
        <label v-if="mode === 'both'" class="tu-field">
          <span>方向</span>
          <select v-model="form.dir" class="tu-input">
            <option value="forward">正向（本机端口 → 远端）</option>
            <option value="reverse">反向（远端端口 → 本机）</option>
          </select>
        </label>

        <div class="tu-grid2">
          <label class="tu-field">
            <span>{{ form.dir === 'forward' ? '本机监听地址' : '远端监听地址' }}</span>
            <input v-model="form.listen" class="tu-input tu-mono" />
          </label>
          <label class="tu-field">
            <span>监听端口</span>
            <input v-model="form.port" class="tu-input tu-mono" />
          </label>
        </div>

        <div v-if="form.dir === 'forward'" class="tu-grid2">
          <label class="tu-field">
            <span>目标主机</span>
            <input v-model="form.targetHost" class="tu-input tu-mono" />
          </label>
          <label class="tu-field">
            <span>目标端口</span>
            <input v-model="form.targetPort" class="tu-input tu-mono" />
          </label>
        </div>
        <div v-else class="tu-grid2">
          <label class="tu-field">
            <span>回流主机</span>
            <input v-model="form.backHost" class="tu-input tu-mono" />
          </label>
          <label class="tu-field">
            <span>回流端口</span>
            <input v-model="form.backPort" class="tu-input tu-mono" />
          </label>
        </div>

        <label class="tu-field">
          <span>登录身份</span>
          <input v-model="form.identity" class="tu-input" placeholder="默认凭据（可留空）" />
        </label>

        <div class="tu-note tn">
          <ReIcon name="InfoFilled" :size="11" />
          {{ form.dir === 'forward'
            ? '本机程序连 127.0.0.1:3306，流量经 SSH 加密送达内网目标。'
            : '把内网服务「挂」到公网机器上，外网也能访问到它。' }}
        </div>

        <!-- ssh 命令：可选，用来在本地终端拉同一条隧道验证 -->
        <div class="tu-cmd-actions">
          <button
            type="button"
            class="lb-btn"
            :disabled="noHost || busyKey === 'cmd' || !form.name"
            title="按上面的参数生成 ssh -L / ssh -R 命令"
            @click="onGenerateCommand"
          >
            <ReIcon name="DocumentCopy" :size="11" />
            {{ busyKey === 'cmd' ? '生成中…' : '生成 ssh 命令' }}
          </button>
          <span class="lb-dim">可选：先在本地终端验证同一条隧道</span>
        </div>
        <div v-if="commandError" class="tu-note tu-note--bad">{{ commandError }}</div>
        <div v-if="sshCommand" class="tu-cmd">
          <div class="tu-cmd__head">
            <ReIcon name="Cpu" :size="11" />用来在本地终端拉起同一条隧道的命令
            <span class="lb-spacer" />
            <button type="button" class="lb-btn" title="复制" @click="copyCommand">
              <ReIcon name="CopyDocument" :size="11" />复制
            </button>
          </div>
          <div class="tu-cmd__body">{{ sshCommand }}</div>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.tu { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 8px; padding: 12px 14px; box-sizing: border-box; }
.tu-head { display: flex; flex: none; align-items: center; gap: 8px; flex-wrap: wrap; }
.tu-title { font-size: 13px; font-weight: 700; }
.tu-hint { font-size: 11px; }

/* ---------- 表格 ---------- */
.tu-pane { flex: 1; min-height: 0; }
.tu-table { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: auto; }
.tu-row {
  display: grid;
  /* 面板宽度会随分栏变化，所以列宽全部用 fr + minmax(0, …)：
     宽了就铺满，窄了就靠省略号 / 折行收，不再把「状态 / 速率 / 操作」顶到可视区外。 */
  grid-template-columns:
    minmax(84px, 1.2fr) 44px 42px minmax(0, 1.7fr) minmax(0, 0.9fr) 62px 60px 100px;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.tu-row--head {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 34px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #5c6270);
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-lighter, #e3e6ef);
}
.tu-row:not(.tu-row--head):hover { background: var(--el-fill-color-lighter, #fafbfd); }
.tu-th {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  color: inherit;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}
.tu-th:hover { color: var(--el-color-primary, #5a4bd9); }
.tu-th.is-sorted { color: var(--el-color-primary, #5a4bd9); }
.tu-th.is-ops { justify-content: flex-end; cursor: default; }
.tu-th.is-ops:hover { color: inherit; }
.tu-th__arrow { flex: none; }
.tu-cell { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.tu-cell.is-ops { justify-content: flex-end; gap: 6px; }
.tu-cell.is-path {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  font-size: 10.5px;
  min-width: 0;
  line-height: 1.35;
  white-space: nowrap;
}
.tu-path__from,
.tu-path__to { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tu-path__from { color: var(--el-text-color-regular, #4b5162); }
.tu-path__to { display: inline-flex; align-items: center; gap: 2px; }
.tu-path__arrow { flex: none; color: var(--el-text-color-placeholder, #a8abb2); }
.tu-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tu-ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* ---------- 弹框表单 ---------- */
.tu-form { display: flex; flex-direction: column; gap: 10px; }
.tu-field { display: flex; flex-direction: column; gap: 4px; }
.tu-field span { font-size: 10.5px; color: var(--el-text-color-placeholder); letter-spacing: 0.03em; }
.tu-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tu-input {
  height: 30px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 7px;
  outline: none;
}
.tu-input:focus { border-color: var(--el-color-primary, #6d5dfc); background: var(--el-bg-color, #fff); }
.tu-mono { font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace); font-size: 11.5px; }
.tu-note { display: flex; align-items: center; gap: 6px; font-size: 11px; line-height: 1.6; color: var(--el-text-color-secondary); }
.tu-note--bad { color: var(--el-color-danger, #d94d4d); }
.tu-cmd-actions { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
.tu-cmd-actions .lb-dim { font-size: 11px; }

.tu-cmd {
  padding: 10px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 7px;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
  &__body {
    font-size: 11.5px;
    font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
    color: var(--el-text-color-primary);
    word-break: break-all;
    line-height: 1.6;
  }
}

@media (max-width: 1080px) {
  .tu-row {
    grid-template-columns: minmax(0, 1.4fr) 56px minmax(0, 1.6fr) 72px 104px;
    gap: 6px;
  }
  .tu-row > .is-proto,
  .tu-row > .is-via,
  .tu-row > .is-rate { display: none; }
}
</style>
