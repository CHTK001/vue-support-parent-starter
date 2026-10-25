<script setup lang="ts">
/**
 * 隧道 / 反向隧道工作台 —— 双向网关版式（已选定）
 *
 * <p>正向隧道 = 把本地端口转发到远端（{@code ssh -L}）；反向隧道 = 把远端端口
 * 转发回本地（{@code ssh -R}），常用于「外网机器连不回内网」的救场。</p>
 *
 * <p>双向网关：左建正向、右建反向，同屏对比两个方向的表单；下方是活跃隧道
 * 带状态开关 —— 建得快、管得全。</p>
 *
 * <p>后端隧道接口尚不存在（仅数据源级 SSH 隧道有），这里用 mock 演示形态。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, ref } from "vue";

const props = defineProps<{
  /** 当前上下文主机 id（隧道接口就绪后作为路径参数） */
  hostId: number;
  /** 当前上下文主机名（展示用） */
  hostName: string;
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();

/* ==================== mock 数据 ==================== */

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

const TUNNELS: Tunnel[] = [
  { id: 1, name: "开发库直连", dir: "forward", proto: "TCP", status: "running", from: "127.0.0.1:3306", to: "10.0.2.15:3306", via: "web-01 (跳板)", rate: "2.1 MB/s" },
  { id: 2, name: "运维面板", dir: "reverse", proto: "HTTP", status: "running", from: "0.0.0.0:8080", to: "192.168.1.21:3000", via: "web-01", rate: "186 KB/s" },
  { id: 3, name: "内网 RDP 测试", dir: "forward", proto: "TCP", status: "stopped", from: "127.0.0.1:3389", to: "10.0.3.9:3389", via: "web-01 (跳板)" },
  { id: 4, name: "临时代理", dir: "reverse", proto: "TCP", status: "fail", from: "0.0.0.0:9999", to: "192.168.1.26:9999", via: "web-01" },
];

const activeCount = computed(() => TUNNELS.filter((t) => t.status === "running").length);

const seg = ref("all");
const SEG = [
  { key: "all", label: "全部", n: TUNNELS.length },
  { key: "forward", label: "正向隧道", n: TUNNELS.filter((t) => t.dir === "forward").length },
  { key: "reverse", label: "反向隧道", n: TUNNELS.filter((t) => t.dir === "reverse").length },
];

/** 分段筛选后的隧道 */
const shown = computed(() =>
  seg.value === "all" ? TUNNELS : TUNNELS.filter((t) => t.dir === seg.value),
);

function dirLabel(d: Tunnel["dir"]): string {
  return d === "forward" ? "正向" : "反向";
}
const dirTone = (d: Tunnel["dir"]) => (d === "forward" ? "lb-info" : "lb-brand");
const statusTone = (s: Tunnel["status"]) => (s === "running" ? "lb-ok" : s === "fail" ? "lb-bad" : "lb-mute");
const statusLabel = (s: Tunnel["status"]) => (s === "running" ? "运行中" : s === "fail" ? "连接失败" : "已停止");

function toggleStatus(t: Tunnel): void {
  t.status = t.status === "running" ? "stopped" : "running";
}

/* ==================== 新建表单 mock（两个方向） ==================== */

const form = ref({
  forward: { name: "", listen: "127.0.0.1", port: "3306", targetHost: "10.0.2.15", targetPort: "3306", identity: "deploy（SSH 密钥）" },
  reverse: { name: "", listen: "0.0.0.0", port: "8080", backHost: "192.168.1.21", backPort: "3000", identity: "deploy（SSH 密钥）" },
});
</script>

<template>
  <div class="tu">
    <div class="tu-head">
      <button type="button" class="lb-btn" @click="emit('back')">
        <ReIcon name="Back" :size="11" />返回
      </button>
      <span class="tu-title">隧道 · 反向隧道工作台</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">正向：本机端口 → 远端 · 反向：远端端口 → 本机</span>
    </div>

    <!-- ============ 双向网关（已选定版式） ============ -->
    <div class="tu-gateway">
      <!-- 正向：ssh -L -->
      <section class="lb-pane">
        <div class="lb-pane__head">
          <ReIcon name="TopRight" :size="12" />正向隧道（ssh -L）
          <span class="lb-spacer" />
          <button type="button" class="lb-btn" title="按表单建立（mock）"><ReIcon name="Plus" :size="11" />建立</button>
        </div>
        <div class="lb-pane__body">
          <div class="tu-form">
            <label class="tu-field"><span>隧道名称</span><input v-model="form.forward.name" class="tu-input" placeholder="如 开发库直连" /></label>
            <label class="tu-field"><span>本机监听</span><input v-model="form.forward.listen" class="tu-input tu-mono" /></label>
            <div class="tu-pair">
              <label class="tu-field"><span>端口</span><input v-model="form.forward.port" class="tu-input tu-mono" /></label>
              <label class="tu-field"><span>目标主机</span><input v-model="form.forward.targetHost" class="tu-input tu-mono" /></label>
              <label class="tu-field"><span>目标端口</span><input v-model="form.forward.targetPort" class="tu-input tu-mono" /></label>
            </div>
            <label class="tu-field"><span>登录身份</span><input v-model="form.forward.identity" class="tu-input" /></label>
          </div>
          <div class="tu-note lb-dim"><ReIcon name="InfoFilled" :size="11" />本机程序连 127.0.0.1:3306，流量经 SSH 加密送达内网目标。</div>
        </div>
      </section>

      <!-- 反向：ssh -R -->
      <section class="lb-pane">
        <div class="lb-pane__head">
          <ReIcon name="RefreshLeft" :size="12" />反向隧道（ssh -R）
          <span class="lb-spacer" />
          <button type="button" class="lb-btn" title="按表单建立（mock）"><ReIcon name="Plus" :size="11" />建立</button>
        </div>
        <div class="lb-pane__body">
          <div class="tu-form">
            <label class="tu-field"><span>隧道名称</span><input v-model="form.reverse.name" class="tu-input" placeholder="如 运维面板" /></label>
            <label class="tu-field"><span>远端监听</span><input v-model="form.reverse.listen" class="tu-input tu-mono" /></label>
            <div class="tu-pair">
              <label class="tu-field"><span>端口</span><input v-model="form.reverse.port" class="tu-input tu-mono" /></label>
              <label class="tu-field"><span>回流主机</span><input v-model="form.reverse.backHost" class="tu-input tu-mono" /></label>
              <label class="tu-field"><span>回流端口</span><input v-model="form.reverse.backPort" class="tu-input tu-mono" /></label>
            </div>
            <label class="tu-field"><span>登录身份</span><input v-model="form.reverse.identity" class="tu-input" /></label>
          </div>
          <div class="tu-note lb-dim"><ReIcon name="InfoFilled" :size="11" />把内网服务「挂」到公网机器上，外网也能访问到它。</div>
        </div>
      </section>

      <!-- 活跃隧道 -->
      <section class="lb-pane tu-active">
        <div class="lb-pane__head">
          活跃隧道（{{ activeCount }}）
          <div class="lb-seg" style="margin-left: 10px">
            <button
              v-for="s in SEG"
              :key="s.key"
              type="button"
              class="lb-seg__btn"
              :class="{ 'is-active': seg === s.key }"
              @click="seg = s.key"
            >
              {{ s.label }}<span class="lb-seg__n">{{ s.n }}</span>
            </button>
          </div>
          <span class="lb-spacer" />
          <button type="button" class="lb-btn" title="刷新（mock）"><ReIcon name="RefreshRight" :size="11" />刷新</button>
        </div>
        <div class="lb-pane__body" style="padding: 0">
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
              <button type="button" class="lb-btn" :class="t.status === 'running' ? 'is-bad' : 'is-primary'" @click="toggleStatus(t)">
                <ReIcon :name="t.status === 'running' ? 'VideoPause' : 'VideoPlay'" :size="11" />
                {{ t.status === 'running' ? '停止' : '启动' }}
              </button>
              <button type="button" class="lb-btn" title="删除"><ReIcon name="Delete" :size="11" /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.tu { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 8px; }
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