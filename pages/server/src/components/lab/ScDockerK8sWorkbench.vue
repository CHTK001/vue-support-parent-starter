<script setup lang="ts">
/**
 * Docker / Kubernetes 工作台 —— 卡片推进版式（已选定）
 *
 * <p>硬约束是能力门控：<b>服务器没有安装对应服务就不显示这个功能</b>
 * （工具条入口不出现，页面里该项显示「未检测到服务」空态）。</p>
 *
 * <p>卡片推进：容器卡片墙 + K8s 工作负载卡，每张卡自带
 * 启动 / 停止 / 日志 / 终端 四个动作 —— 容器不多时最顺手。</p>
 *
 * <p>数据为 mock（真实后端尚不存在），能力探测逻辑与真实代理保持一致：
 * 探到才能进来，探不到入口不出现。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, ref } from "vue";

const props = defineProps<{
  /** 当前上下文主机 */
  host: string;
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();

/* ==================== mock 能力与数据 ==================== */

/** 每台主机的容器能力（未安装的服务不显示功能） */
const CAP = {
  "web-01": { docker: true, compose: true, k8s: false },
  "db-01": { docker: true, compose: false, k8s: false },
  "web-02": { docker: false, compose: false, k8s: true },
} as Record<string, { docker: boolean; compose: boolean; k8s: boolean }>;

/** 当前主机的能力 */
const cap = computed(() => CAP[props.host] ?? { docker: false, compose: false, k8s: false });

/** Docker 容器 mock（web-01） */
const CONTAINERS = [
  { id: "3f2ab9c1d5e6", name: "nginx-proxy", image: "nginx:1.27-alpine", status: "running", ports: "0.0.0.0:80→80, 443→443", uptime: "42 天", cpu: "0.4%", mem: "18.2M", network: "proxy-net" },
  { id: "a71c0e2b4fd9", name: "api-gateway", image: "registry/apisix:3.9", status: "running", ports: "0.0.0.0:9080→9080", uptime: "42 天", cpu: "2.1%", mem: "96.4M", network: "proxy-net" },
  { id: "8d04f3a9b12c", name: "node-exporter", image: "prom/node-exporter:v1.7", status: "running", ports: "—", uptime: "15 天", cpu: "0.1%", mem: "12.6M", network: "mon-net" },
  { id: "5512c8d94ab0", name: "grafana", image: "grafana/grafana:11.1", status: "running", ports: "0.0.0.0:3000→3000", uptime: "31 天", cpu: "0.8%", mem: "121.5M", network: "mon-net" },
  { id: "c29e7a5f03d4", name: "redis-cache", image: "redis:7-alpine", status: "running", ports: "127.0.0.1:6379→6379", uptime: "7 天", cpu: "0.2%", mem: "9.1M", network: "app-net" },
  { id: "0b5f1c8e27d9", name: "batch-worker", image: "registry/batch:2.4", status: "exited", ports: "—", uptime: "3 小时前", cpu: "0%", mem: "0B", network: "app-net" },
];

/** K8s 工作负载 mock（web-02 才有） */
const K8S = {
  version: "v1.31.2",
  nodes: [
    { name: "web-02", role: "control-plane", ready: true, version: "v1.31.2", cpu: "2/4", mem: "3.2/7.8G" },
    { name: "node-a", role: "worker", ready: true, version: "v1.31.2", cpu: "1/4", mem: "2.1/7.8G" },
    { name: "node-b", role: "worker", ready: false, version: "v1.30.5", cpu: "0.5/2", mem: "1.9/3.9G" },
  ],
  workloads: [
    { name: "web-front", kind: "Deployment", ns: "frontend", ready: "3/3", image: "registry/front:v3", restarts: 0 },
    { name: "web-api", kind: "Deployment", ns: "frontend", ready: "2/2", image: "registry/api:v2.1", restarts: 2 },
    { name: "cache", kind: "StatefulSet", ns: "infra", ready: "1/1", image: "redis:7-alpine", restarts: 0 },
    { name: "ingress", kind: "DaemonSet", ns: "ingress-nginx", ready: "2/3", image: "ingress-nginx:1.11", restarts: 1 },
  ],
};

/** 容器总数与运行数 */
const runningCount = computed(() => CONTAINERS.filter((c) => c.status === "running").length);

/** 卡片墙分段（K8s 只在有集群能力时出现） */
const cardsActive = ref("running");
const cardsSeg = computed(() => {
  const segs: Array<{ key: string; label: string; n: number }> = [
    { key: "running", label: "运行中", n: runningCount.value },
    { key: "stopped", label: "已停止", n: CONTAINERS.length - runningCount.value },
  ];
  if (cap.value.k8s) segs.push({ key: "k8s", label: "K8s 工作负载", n: K8S.workloads.length });
  return segs;
});

/** 某容器是否「就绪」（工作负载用就绪数判断） */
function readyOk(ready: string): boolean {
  const [a, b] = ready.split("/");
  return a === b;
}

/** 未安装的空态文案 */
const emptyHint = computed(() => {
  const lines: string[] = [];
  if (!cap.value.docker) lines.push("Docker 未安装");
  if (!cap.value.k8s) lines.push("Kubernetes 未检测到集群");
  return lines.join(" · ") || "已全部安装";
});
</script>

<template>
  <div class="dk">
    <div class="dk-head">
      <button type="button" class="lb-btn" title="返回分屏终端" @click="emit('back')">
        <ReIcon name="Back" :size="11" />返回
      </button>
      <span class="dk-title">Docker · Kubernetes 工作台</span>
      <span class="lb-pill lb-pill--plain">{{ host }}</span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">
        未安装的服务入口已隐藏（{{ emptyHint }}）
      </span>
    </div>

    <!-- ============ 能力状态条 ============ -->
    <div class="dk-cap">
      <span class="lb-pill" :class="cap.docker ? 'lb-ok' : 'lb-bad'">
        <ReIcon :name="cap.docker ? 'CircleCheck' : 'CircleClose'" :size="11" />
        Docker {{ cap.docker ? "已安装" : "未安装" }}
      </span>
      <span class="lb-pill" :class="cap.compose ? 'lb-brand' : 'lb-mute'">
        Compose {{ cap.compose ? "已安装" : "未安装" }}
      </span>
      <span class="lb-pill" :class="cap.k8s ? 'lb-ok' : 'lb-mute'">
        <ReIcon :name="cap.k8s ? 'CircleCheck' : 'CircleClose'" :size="11" />
        Kubernetes {{ cap.k8s ? `已连接 · ${K8S.version}` : "未检测到集群" }}
      </span>
      <span class="lb-spacer" />
      <button type="button" class="lb-btn" title="刷新能力与数据（mock）">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
    </div>

    <!-- 该主机的服务一个都没装：整页空态（功能被隐藏的旁证） -->
    <div v-if="!cap.docker && !cap.k8s" class="lb-empty lb-pane" style="flex: 1">
      <ReIcon name="Warning" :size="34" color="var(--el-text-color-placeholder)" />
      <b>这台主机没有检测到容器 / 编排服务</b>
      <span>Docker 与 Kubernetes 工具条入口已隐藏。安装 Docker 或 K8s 后此页自动出现。</span>
    </div>

    <!-- ============ 卡片推进（已选定版式） ============ -->
    <div v-else class="dk-cards-mode">
      <div class="dk-cards-head">
        <div class="lb-seg">
          <button
            v-for="s in cardsSeg"
            :key="s.key"
            type="button"
            class="lb-seg__btn"
            :class="{ 'is-active': cardsActive === s.key }"
            @click="cardsActive = s.key"
          >
            {{ s.label }}<span class="lb-seg__n">{{ s.n }}</span>
          </button>
        </div>
        <span class="lb-spacer" />
        <span class="lb-dim" style="font-size: 11px">卡片 = 一个容器 / 工作负载，点右下角动作直接操作</span>
      </div>

      <template v-if="cardsActive === 'k8s'">
        <div class="dk-wl-cards">
          <article v-for="w in K8S.workloads" :key="w.name" class="dk-wcard" :class="readyOk(w.ready) ? 'lb-ok' : 'lb-warn'">
            <header>
              <b>{{ w.name }}</b>
              <span class="lb-pill">{{ w.kind }}</span>
              <span class="lb-spacer" />
              <span class="lb-dim" style="font-size: 10.5px">{{ w.ns }}</span>
            </header>
            <p class="lb-mono lb-dim">{{ w.image }}</p>
            <footer>
              <span class="lb-pill" :class="readyOk(w.ready) ? 'lb-ok' : 'lb-warn'">{{ w.ready }} 就绪</span>
              <span class="lb-mono lb-dim" style="font-size: 10.5px">重启 {{ w.restarts }}</span>
              <span class="lb-spacer" />
              <button type="button" class="lb-btn" title="查看日志（mock）"><ReIcon name="Document" :size="11" />日志</button>
              <button type="button" class="lb-btn" title="更多（mock）"><ReIcon name="More" :size="11" /></button>
            </footer>
          </article>
        </div>
      </template>

      <template v-else>
        <div class="dk-ccards">
          <article
            v-for="c in CONTAINERS.filter((x) => (cardsActive === 'running' ? x.status === 'running' : x.status !== 'running'))"
            :key="c.id"
            class="dk-ccard"
            :class="c.status === 'running' ? 'lb-ok' : 'lb-bad'"
          >
            <header>
              <i class="lb-dot" />
              <b class="lb-mono">{{ c.name }}</b>
              <span class="lb-spacer" />
              <span class="lb-dim" style="font-size: 10.5px">{{ c.uptime }}</span>
            </header>
            <p class="lb-mono lb-dim">{{ c.image }}</p>
            <p class="lb-mono lb-dim" style="font-size: 10.5px">{{ c.ports }}</p>
            <footer>
              <span class="lb-mono" style="font-size: 10.5px">{{ c.cpu }} · {{ c.mem }}</span>
              <span class="lb-spacer" />
              <button type="button" class="lb-btn" title="查看日志（mock）"><ReIcon name="Document" :size="11" /></button>
              <button type="button" class="lb-btn" title="进入容器终端（mock）"><ReIcon name="Terminal" :size="11" /></button>
              <button type="button" class="lb-btn" :class="c.status === 'running' ? 'is-bad' : 'is-primary'" :title="c.status === 'running' ? '停止' : '启动'">
                <ReIcon :name="c.status === 'running' ? 'VideoPause' : 'VideoPlay'" :size="11" />
              </button>
            </footer>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.dk {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}
.dk-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dk-title { font-size: 13px; font-weight: 700; }

.dk-cap {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
  flex-wrap: wrap;
}

/* ---------- 卡片墙 ---------- */
.dk-cards-mode { display: flex; flex-direction: column; flex: 1; gap: 8px; min-height: 0; }
.dk-cards-head { display: flex; align-items: center; gap: 8px; }
.dk-ccards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
  align-content: start;
  overflow-y: auto;
}
.dk-ccard {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 11px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light);
  border-left: 3px solid var(--tone, var(--el-color-primary));
  border-radius: 9px;
}
.dk-ccard header { display: flex; align-items: center; gap: 7px; }
.dk-ccard header b { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dk-ccard footer { display: flex; align-items: center; gap: 4px; padding-top: 4px; border-top: 1px solid var(--el-border-color-extra-light); }
.dk-ccard p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }

/* ---------- K8s 工作负载卡 ---------- */
.dk-wl-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  align-content: start;
  overflow-y: auto;
}
.dk-wcard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 11px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light);
  border-left: 3px solid var(--tone, var(--el-color-primary));
  border-radius: 9px;
}
.dk-wcard header { display: flex; align-items: center; gap: 7px; }
.dk-wcard header b { font-size: 12.5px; }
.dk-wcard p { margin: 0; font-size: 11px; }
.dk-wcard footer { display: flex; align-items: center; gap: 5px; padding-top: 4px; border-top: 1px solid var(--el-border-color-extra-light); }
</style>