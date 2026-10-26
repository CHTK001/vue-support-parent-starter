<script setup lang="ts">
/**
 * Docker / Kubernetes 工作台 —— 卡片推进版式（已选定，真实接口）
 *
 * <p>硬约束是能力门控：<b>服务器没有安装对应服务就不显示这个功能</b>
 * （工具条入口不出现，页面里该项显示「未检测到服务」空态）。</p>
 *
 * <p>数据源为后端真实接口（{@code /ms/server/host/{id}/docker|kubernetes}，
 * SSH 执行受控主机 CLI）：能力探测决定门控，容器 / 工作负载卡片来自
 * {@code docker ps --format json} 与 {@code kubectl get ... -o json}。
 * 启动 / 停止调真实 docker CLI。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
import {
  dockerCapability,
  listDockerContainers,
  startDockerContainer,
  stopDockerContainer,
  restartDockerContainer,
  dockerContainerLogs,
  k8sCapability,
  k8sWorkloads,
} from "../../api";

const props = defineProps<{
  /** 当前上下文主机 id（后端接口路径参数；0 表示无上下文 → 空态） */
  hostId: number;
  /** 当前上下文主机名（展示用） */
  hostName: string;
  /** 渲染域：docker 只显示容器、k8s 只显示工作负载、both 同屏（兼容旧用法） */
  domain?: "docker" | "k8s" | "both";
}>();

const domain = computed<"docker" | "k8s" | "both">(() => props.domain ?? "both");
/** 是否只渲染 Docker 域 */
const dockerOnly = computed(() => domain.value === "docker");
/** 是否只渲染 K8s 域 */
const k8sOnly = computed(() => domain.value === "k8s");
/** 标题 */
const title = computed(() =>
  dockerOnly.value ? "Docker 工作台" : k8sOnly.value ? "Kubernetes 工作台" : "Docker · Kubernetes 工作台");

/* ==================== 真实能力与数据 ==================== */

/** 是否加载中 */
const loading = ref(false);

/** 能力状态（后端探测；能力不存在时前端隐藏对应域） */
const cap = ref({ docker: false, compose: false, k8s: false });

/** Docker 容器（真实） */
const containers = ref(
  [] as Array<{
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    ports: string;
    network: string;
    createdAt: string;
  }>,
);

/** K8s 数据（真实） */
const k8sData = ref({
  version: "",
  workloads: [] as Array<{ name: string; kind: string; namespace: string; ready: string; image: string; restarts: number }>,
});

/** 容器总数与运行数 */
const runningCount = computed(() => containers.value.filter((c) => c.state === "running").length);

/** 卡片墙分段（按域展开：docker 只列容器状态，k8s 只列工作负载，both 全列） */
const cardsActive = ref("running");
const cardsSeg = computed(() => {
  const segs: Array<{ key: string; label: string; n: number }> = [];
  if (!k8sOnly.value) {
    segs.push({ key: "running", label: "运行中", n: runningCount.value });
    segs.push({ key: "stopped", label: "已停止", n: containers.value.length - runningCount.value });
  }
  if (!dockerOnly.value && cap.value.k8s) {
    segs.push({ key: "k8s", label: "K8s 工作负载", n: k8sData.value.workloads.length });
  }
  return segs;
});

/** 某容器是否「就绪」（工作负载用就绪数判断） */
function readyOk(ready: string): boolean {
  const [a, b] = ready.split("/");
  return a === b;
}

/** 未安装的空态文案（按域） */
const emptyHint = computed(() => {
  const lines: string[] = [];
  if (!k8sOnly.value && !cap.value.docker) lines.push("Docker 未安装");
  if (!dockerOnly.value && !cap.value.k8s) lines.push("Kubernetes 未检测到集群");
  return lines.join(" · ") || "已全部安装";
});

/** 本域是否「无可用服务」（决定整页空态） */
const noService = computed(() =>
  dockerOnly.value ? !cap.value.docker : k8sOnly.value ? !cap.value.k8s : (!cap.value.docker && !cap.value.k8s));

/** 无有效主机上下文（不应调接口） */
const noHost = computed(() => !props.hostId);

/**
 * 拉取能力 + 各域数据（页面加载与「刷新」共用）
 *
 * <p>能力探测是门控的入口：接口未部署 / 主机未装服务（exploral 404 或后端返回
 * installed=false）一律静默按「未安装」处理（功能隐藏），不弹错误；只有
 * 能力判为已安装后列表拉取失败才报错，避免每次打开都弹一条噪音。</p>
 */
async function refresh(): Promise<void> {
  if (noHost.value) {
    cap.value = { docker: false, compose: false, k8s: false };
    containers.value = [];
    k8sData.value = { version: "", workloads: [] };
    return;
  }
  loading.value = true;
  // 按域名只探测对应能力：Docker 页不查 K8s，反之亦然，减少无谓 SSH 调用
  const probeDocker = !k8sOnly.value;
  const probeK8s = !dockerOnly.value;
  const [dkRes, k8Res] = await Promise.allSettled([
    probeDocker ? dockerCapability(props.hostId) : Promise.resolve(null),
    probeK8s ? k8sCapability(props.hostId) : Promise.resolve(null),
  ]);
  const dk = dkRes.status === "fulfilled" ? (dkRes.value as any) : null;
  const k8 = k8Res.status === "fulfilled" ? (k8Res.value as any) : null;

  cap.value = {
    docker: !!dk?.installed,
    compose: !!dk?.compose,
    k8s: !!k8?.installed,
  };
  containers.value = [];
  k8sData.value = { version: k8?.serverVersion ?? "", workloads: [] };

  try {
    // 判为已安装后才拉数据；失败才提示（说明装了但读不出来）
    if (dk?.installed) {
      containers.value = await listDockerContainers(props.hostId, true);
    }
    if (k8?.installed) {
      k8sData.value.workloads = await k8sWorkloads(props.hostId);
    }
  } catch (e: any) {
    message.error("加载工作台数据失败: " + (e?.message ?? e));
  } finally {
    loading.value = false;
  }
}

/**
 * 启停容器（运行中 → 停止；其他 → 启动）
 *
 * @param c 容器
 */
async function toggleContainer(c: { id: string; state: string }): Promise<void> {
  if (noHost.value) return;
  try {
    if (c.state === "running") {
      await stopDockerContainer(props.hostId, c.id);
      message.success(`已停止 ${c.id.slice(0, 12)}`);
    } else {
      await startDockerContainer(props.hostId, c.id);
      message.success(`已启动 ${c.id.slice(0, 12)}`);
    }
    await refresh();
  } catch (e: any) {
    message.error((e?.message ?? e) || "操作失败");
  }
}

/**
 * 查看容器最近日志（弹窗展示）
 *
 * @param c 容器
 */
async function showLogs(c: { id: string; name: string }): Promise<void> {
  if (noHost.value) return;
  try {
    const text = await dockerContainerLogs(props.hostId, c.id, 200);
    ElMessageBox.alert(text || "（空）", `日志 · ${c.name}`, {
      customClass: "ty-docker-log",
      confirmButtonText: "关闭",
    });
  } catch (e: any) {
    message.error((e?.message ?? e) || "读取日志失败");
  }
}

/**
 * 重启容器
 *
 * @param c 容器
 */
async function restartContainer(c: { id: string }): Promise<void> {
  if (noHost.value) return;
  try {
    await restartDockerContainer(props.hostId, c.id);
    message.success(`已重启 ${c.id.slice(0, 12)}`);
    await refresh();
  } catch (e: any) {
    message.error((e?.message ?? e) || "重启失败");
  }
}

onMounted(refresh);
</script>

<template>
  <div class="dk">
    <div class="dk-head">
      <span class="dk-title">{{ title }}</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">
        未安装的服务入口已隐藏（{{ emptyHint }}）
      </span>
    </div>

    <!-- ============ 能力状态条 ============ -->
    <div class="dk-cap">
      <span v-if="!k8sOnly" class="lb-pill" :class="cap.docker ? 'lb-ok' : 'lb-bad'">
        <ReIcon :name="cap.docker ? 'CircleCheck' : 'CircleClose'" :size="11" />
        Docker {{ cap.docker ? "已安装" : "未安装" }}
      </span>
      <span v-if="!k8sOnly" class="lb-pill" :class="cap.compose ? 'lb-brand' : 'lb-mute'">
        Compose {{ cap.compose ? "已安装" : "未安装" }}
      </span>
      <span v-if="!dockerOnly" class="lb-pill" :class="cap.k8s ? 'lb-ok' : 'lb-mute'">
        <ReIcon :name="cap.k8s ? 'CircleCheck' : 'CircleClose'" :size="11" />
        Kubernetes {{ cap.k8s ? `已连接 · ${k8sData.version}` : "未检测到集群" }}
      </span>
      <span class="lb-spacer" />
      <button type="button" class="lb-btn" :disabled="noHost || loading" title="刷新能力与数据" @click="refresh">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
    </div>

    <!-- 该主机的服务一个都没装：整页空态（功能被隐藏的旁证） -->
    <div v-if="noHost" class="lb-empty lb-pane" style="flex: 1">
      <ReIcon name="Warning" :size="34" color="var(--el-text-color-placeholder)" />
      <b>没有选中的主机</b>
      <span>请从左侧主机列表进入工作台。</span>
    </div>

    <div v-else-if="noService" class="lb-empty lb-pane" style="flex: 1">
      <ReIcon name="Warning" :size="34" color="var(--el-text-color-placeholder)" />
      <b>这台主机没有检测到{{ dockerOnly ? ' Docker' : k8sOnly ? ' Kubernetes' : '容器 / 编排' }}服务</b>
      <span>对应工具条入口已隐藏。安装对应服务后此页自动出现。</span>
    </div>

    <!-- ============ 卡片推进（已选定版式） ============ -->
    <div v-else class="dk-cards-mode" v-loading="loading">
      <div class="dk-cards-head">
        <div v-if="cardsSeg.length > 1" class="lb-seg">
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

      <!-- K8s 工作负载（k8s 页恒显；both 页在 k8s 分段显） -->
      <template v-if="k8sOnly || cardsActive === 'k8s'">
        <div class="dk-wl-cards">
          <article v-for="w in k8sData.workloads" :key="w.name" class="dk-wcard" :class="readyOk(w.ready) ? 'lb-ok' : 'lb-warn'">
            <header>
              <b>{{ w.name }}</b>
              <span class="lb-pill">{{ w.kind }}</span>
              <span class="lb-spacer" />
              <span class="lb-dim" style="font-size: 10.5px">{{ w.namespace }}</span>
            </header>
            <p class="lb-mono lb-dim">{{ w.image }}</p>
            <footer>
              <span class="lb-pill" :class="readyOk(w.ready) ? 'lb-ok' : 'lb-warn'">{{ w.ready }} 就绪</span>
              <span class="lb-mono lb-dim" style="font-size: 10.5px">重启 {{ w.restarts }}</span>
              <span class="lb-spacer" />
              <button type="button" class="lb-btn" title="查看日志（接口待补）"><ReIcon name="Document" :size="11" />日志</button>
              <button type="button" class="lb-btn" title="更多操作（接口待补）"><ReIcon name="More" :size="11" /></button>
            </footer>
          </article>
        </div>
      </template>

      <template v-else>
        <div class="dk-ccards">
          <article
            v-for="c in containers.filter((x) => (cardsActive === 'running' ? x.state === 'running' : x.state !== 'running'))"
            :key="c.id"
            class="dk-ccard"
            :class="c.state === 'running' ? 'lb-ok' : 'lb-bad'"
          >
            <header>
              <i class="lb-dot" />
              <b class="lb-mono">{{ c.name }}</b>
              <span class="lb-spacer" />
              <span class="lb-dim" style="font-size: 10.5px">{{ c.status }}</span>
            </header>
            <p class="lb-mono lb-dim">{{ c.image }}</p>
            <p class="lb-mono lb-dim" style="font-size: 10.5px">{{ c.ports || "无端口映射" }}</p>
            <footer>
              <span class="lb-mono" style="font-size: 10.5px">{{ c.network || "—" }}</span>
              <span class="lb-spacer" />
              <button type="button" class="lb-btn" title="查看日志" @click="showLogs(c)"><ReIcon name="Document" :size="11" /></button>
              <button type="button" class="lb-btn" title="重启容器" @click="restartContainer(c)"><ReIcon name="RefreshRight" :size="11" /></button>
              <button type="button" class="lb-btn" :class="c.state === 'running' ? 'is-bad' : 'is-primary'" :title="c.state === 'running' ? '停止' : '启动'" @click="toggleContainer(c)">
                <ReIcon :name="c.state === 'running' ? 'VideoPause' : 'VideoPlay'" :size="11" />
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