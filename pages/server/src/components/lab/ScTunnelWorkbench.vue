<script setup lang="ts">
/**
 * 隧道 / 反向隧道工作台 —— 按方向拆分版（真实接口）
 *
 * <p>正向隧道 = 把本地端口转发到远端（{@code ssh -L}）；反向隧道 = 把远端端口
 * 转发回本地（{@code ssh -R}），常用于「外网机器连不回内网」的救场。</p>
 *
 * <p>用户要求工作台各功能各自独立页签：本组件按 {@code mode} 只渲染一个方向
 * 的表单与隧道列表（forward 只建正向、reverse 只建反向），不再同屏双向对比。</p>
 *
 * <p>数据走后端真实接口（{@code /ms/server/host/{id}/tunnel}）：列表 / 建立 /
 * 启停 / 删除全量真连；建立与启停依赖受控主机的 SSH 登录身份。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { createTunnel, delTunnel, listTunnels, updateTunnelState } from "../../api";

const props = defineProps<{
  /** 当前上下文主机 id（隧道接口路径参数；0 表示无上下文 → 空态） */
  hostId: number;
  /** 当前上下文主机名（展示用） */
  hostName: string;
  /** 渲染方向：forward 只显示正向、reverse 只显示反向、both 双向（兼容旧用法） */
  mode?: "forward" | "reverse" | "both";
}>();

const mode = computed<"forward" | "reverse" | "both">(() => props.mode ?? "both");
/** 是否只渲染正向 */
const forwardOnly = computed(() => mode.value === "forward");
/** 是否只渲染反向 */
const reverseOnly = computed(() => mode.value === "reverse");
/** 标题 */
const title = computed(() =>
  forwardOnly.value ? "隧道（正向）" : reverseOnly.value ? "反向隧道" : "隧道 · 反向隧道");

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

/* ==================== 新建表单（按方向） ==================== */

const form = ref({
  name: "",
  listen: forwardOnly.value ? "127.0.0.1" : "0.0.0.0",
  port: forwardOnly.value ? "3306" : "8080",
  targetHost: "10.0.2.15",
  targetPort: "3306",
  backHost: "192.168.1.21",
  backPort: "3000",
  identity: "",
});

/** 建立隧道（真实接口，dir 由 mode 决定） */
async function createOne(): Promise<void> {
  if (noHost.value) return;
  busyKey.value = "create";
  try {
    const dir = forwardOnly.value ? "forward" : "reverse";
    const payload = dir === "forward"
      ? {
          name: form.value.name,
          dir,
          listen: form.value.listen,
          port: form.value.port,
          targetHost: form.value.targetHost,
          targetPort: form.value.targetPort,
          identity: form.value.identity,
        }
      : {
          name: form.value.name,
          dir,
          listen: form.value.listen,
          port: form.value.port,
          backHost: form.value.backHost,
          backPort: form.value.backPort,
          identity: form.value.identity,
        };
    const created = await createTunnel(props.hostId, payload);
    tunnels.value = [...tunnels.value, created];
    form.value.name = "";
    message.success("隧道已建立（stopped），点启动生效");
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
    <div class="tu-head">
      <span class="tu-title">{{ title }}</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span class="lb-pill" :class="activeCount ? 'lb-ok' : 'lb-mute'">
        {{ activeCount }} 运行中 · 共 {{ count }}
      </span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">
        {{ forwardOnly ? '本机端口 → 远端' : reverseOnly ? '远端端口 → 本机' : '正向：本机→远端 · 反向：远端→本机' }}
      </span>
    </div>

    <div class="tu-gateway" v-loading="loading">
      <!-- ============ 建立表单（按方向） ============ -->
      <section class="lb-pane">
        <div class="lb-pane__head">
          <ReIcon :name="forwardOnly ? 'TopRight' : 'RefreshLeft'" :size="12" />
          {{ forwardOnly ? '正向隧道（ssh -L）' : reverseOnly ? '反向隧道（ssh -R）' : '双向隧道' }}
          <span class="lb-spacer" />
          <button type="button" class="lb-btn" :disabled="noHost || busyKey === 'create'" title="按表单建立" @click="createOne">
            <ReIcon name="Plus" :size="11" />{{ busyKey === 'create' ? '建立中…' : '建立' }}
          </button>
        </div>
        <div class="lb-pane__body">
          <div class="tu-form">
            <label class="tu-field"><span>隧道名称</span><input v-model="form.name" class="tu-input" placeholder="如 开发库直连" /></label>
            <label class="tu-field"><span>{{ forwardOnly ? '本机监听' : '远端监听' }}</span><input v-model="form.listen" class="tu-input tu-mono" /></label>
            <div class="tu-pair">
              <label class="tu-field"><span>端口</span><input v-model="form.port" class="tu-input tu-mono" /></label>
              <template v-if="forwardOnly || mode === 'both'">
                <label class="tu-field"><span>目标主机</span><input v-model="form.targetHost" class="tu-input tu-mono" /></label>
                <label class="tu-field"><span>目标端口</span><input v-model="form.targetPort" class="tu-input tu-mono" /></label>
              </template>
              <template v-else>
                <label class="tu-field"><span>回流主机</span><input v-model="form.backHost" class="tu-input tu-mono" /></label>
                <label class="tu-field"><span>回流端口</span><input v-model="form.backPort" class="tu-input tu-mono" /></label>
              </template>
            </div>
            <label class="tu-field"><span>登录身份</span><input v-model="form.identity" class="tu-input" placeholder="默认凭据（可留空）" /></label>
          </div>
          <div class="tu-note lb-dim">
            <ReIcon name="InfoFilled" :size="11" />
            {{ forwardOnly ? '本机程序连 127.0.0.1:3306，流量经 SSH 加密送达内网目标。' : '把内网服务「挂」到公网机器上，外网也能访问到它。' }}
          </div>
        </div>
      </section>

      <!-- ============ 活跃隧道（按方向过滤） ============ -->
      <section class="lb-pane tu-active">
        <div class="lb-pane__head">
          活跃隧道（{{ activeCount }}）
          <span class="lb-spacer" />
          <button type="button" class="lb-btn" :disabled="noHost || loading" title="刷新" @click="refresh">
            <ReIcon name="RefreshRight" :size="11" />刷新
          </button>
        </div>
        <div class="lb-pane__body" style="padding: 0">
          <div v-if="!shown.length && !loading" class="lb-empty">
            <ReIcon name="Connection" :size="22" />
            <b>还没有隧道</b>
            <span>用上方表单建立一条{{ forwardOnly ? '正向' : reverseOnly ? '反向' : '正向或反向' }}隧道，点「建立」后启动生效。</span>
          </div>
          <div class="tu-list">
            <div v-for="t in shown" :key="t.id" class="tu-item">
              <i class="lb-dot" :class="statusTone(t.status)" />
              <b>{{ t.name }}</b>
              <span class="lb-pill" :class="dirTone(t.dir)">{{ dirLabel(t.dir) }}</span>
              <span class="tu-item__proto lb-pill lb-pill--plain">{{ t.proto }}</span>
              <span class="lb-mono tu-item__path">{{ t.from }} <ReIcon name="ArrowRight" :size="10" /> {{ t.to }}</span>
              <span class="lb-dim">{{ t.via }}</span>
              <span v-if="t.rate" class="lb-mono lb-dim">{{ t.rate }}</span>
              <span class="lb-spacer" />
              <span class="lb-pill" :class="statusTone(t.status)">{{ statusLabel(t.status) }}</span>
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
              <button type="button" class="lb-btn" :disabled="busyKey === `del-${t.id}`" title="删除" @click="removeTunnel(t)">
                <ReIcon name="Delete" :size="11" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.tu { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 8px; padding: 12px 14px; box-sizing: border-box; }
.tu-head { display: flex; align-items: center; gap: 8px; }
.tu-title { font-size: 13px; font-weight: 700; }

/* ---------- 双向网关 ---------- */
.tu-gateway {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
  flex: 1;
  align-content: start;
  overflow-y: auto;
}
.tu-active { grid-column: 1 / -1; }
.tu-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
  line-height: 1.6;
}

/* ---------- 表单 ---------- */
.tu-form { display: flex; flex-direction: column; gap: 8px; }
.tu-field { display: flex; flex-direction: column; gap: 3px; }
.tu-field span { font-size: 10.5px; color: var(--el-text-color-placeholder); letter-spacing: 0.03em; }
.tu-pair { display: grid; grid-template-columns: 0.8fr 1.2fr 0.8fr; gap: 8px; }
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

/* ---------- 隧道条目 ---------- */
.tu-list { display: flex; flex-direction: column; }
.tu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.tu-item:hover { background: var(--el-fill-color-lighter, #fafbfd); }
.tu-item b { font-weight: 600; white-space: nowrap; }
.tu-item__proto { font-size: 10px; }
.tu-item__path { font-size: 11px; display: inline-flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>