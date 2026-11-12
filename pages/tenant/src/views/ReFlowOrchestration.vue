<script setup lang="ts">
/**
 * 租户模块 / ReFlow 编排服务架构
 *
 * 目标：给平台租户一个“从编排画布到执行运行时”的全局视图，而不是再堆一张
 * 服务清单表。页面只读取静态架构元数据，不依赖后端接口，便于在租户刚创建、
 * 服务尚未全部上线时也能看到目标拓扑。
 */
type NodeTone = "entry" | "gateway" | "core" | "runtime" | "data";

interface ArchNode {
  code: string;
  title: string;
  desc: string;
  tag?: string;
  tone?: NodeTone;
}

interface ArchLayer {
  key: string;
  index: string;
  title: string;
  note: string;
  nodes: ArchNode[];
}

const layers: ArchLayer[] = [
  {
    key: "entry",
    index: "01",
    title: "入口层",
    note: "租户用户与外部系统进入编排能力的入口",
    nodes: [
      { code: "ST", title: "ReFlow Studio", desc: "流程画布、节点编排、调试运行", tag: "编排前端", tone: "entry" },
      { code: "TC", title: "租户控制台", desc: "服务订阅、凭证与配额", tag: "Tenant", tone: "entry" },
      { code: "API", title: "Open API / Webhook", desc: "外部事件触发与回调", tag: "Trigger", tone: "entry" },
    ],
  },
  {
    key: "gateway",
    index: "02",
    title: "接入与隔离层",
    note: "所有请求在进入编排核心前完成租户识别与边界校验",
    nodes: [
      { code: "GW", title: "API Gateway", desc: "路由、限流、鉴权、审计", tone: "gateway" },
      { code: "TX", title: "Tenant Context", desc: "tenantId / 数据源 / 凭证上下文", tone: "gateway" },
    ],
  },
  {
    key: "core",
    index: "03",
    title: "ReFlow 编排核心",
    note: "把画布定义编译成可调度、可恢复的执行计划",
    nodes: [
      { code: "CP", title: "Flow Compiler", desc: "DAG 校验、版本快照、发布", tag: "Compile", tone: "core" },
      { code: "SC", title: "Scheduler", desc: "定时、事件、依赖与并发控制", tag: "Schedule", tone: "core" },
      { code: "EX", title: "Execution Engine", desc: "节点执行、重试、补偿、人工任务", tag: "Execute", tone: "core" },
      { code: "SS", title: "State Store", desc: "运行实例、步骤状态、断点恢复", tag: "State", tone: "core" },
    ],
  },
  {
    key: "runtime",
    index: "04",
    title: "执行运行时",
    note: "按租户注入连接器、Agent 与模型能力",
    nodes: [
      { code: "CN", title: "Connector Runtime", desc: "HTTP / SQL / SSH / 消息队列", tone: "runtime" },
      { code: "AG", title: "Agent Runtime", desc: "租户侧执行器与长任务托管", tone: "runtime" },
      { code: "MG", title: "Model / Tool Gateway", desc: "模型、工具与外部能力调用", tone: "runtime" },
    ],
  },
  {
    key: "data",
    index: "05",
    title: "数据与可观测",
    note: "运行数据按租户隔离，指标、日志、链路统一回收",
    nodes: [
      { code: "DB", title: "Tenant DB", desc: "流程定义、实例与业务数据", tone: "data" },
      { code: "MQ", title: "Redis / Queue", desc: "调度队列、锁与事件流", tone: "data" },
      { code: "OS", title: "Object Storage", desc: "运行产物、附件与大对象", tone: "data" },
      { code: "OB", title: "Trace / Log / Metric", desc: "全链路观测与告警", tone: "data" },
    ],
  },
];

const flowSteps = [
  { no: "01", name: "触发", desc: "手动 / 定时 / Webhook" },
  { no: "02", name: "编译", desc: "校验 DAG 并生成版本" },
  { no: "03", name: "调度", desc: "租户队列与并发控制" },
  { no: "04", name: "执行", desc: "节点运行与状态持久化" },
  { no: "05", name: "观测", desc: "日志、链路、指标回收" },
];

const boundaries = [
  "所有请求携带 tenantId，网关统一做租户边界校验",
  "流程定义、运行实例、连接器凭证按租户隔离",
  "执行器与模型调用使用租户级凭证，不共享平台密钥",
  "运行数据进入租户库/队列/对象存储，观测数据带租户标签",
];
</script>

<template>
  <section class="reflow-page">
    <header class="hero">
      <div class="hero-copy">
        <div class="kicker"><span class="kicker-dot" /> TENANT SERVICE MAP / REFLOW</div>
        <h1>ReFlow 编排服务架构</h1>
        <p class="lede">
          从 ReFlow Studio 的可视化画布，到租户隔离的执行运行时。把“编排”拆成可解释的
          入口、编译、调度、执行与观测五段，方便平台侧按能力位排查和扩容。
        </p>
        <div class="pills">
          <span>租户级隔离</span>
          <span>DAG 编排</span>
          <span>多运行时</span>
          <span>全链路可观测</span>
        </div>
      </div>
      <aside class="tenant-card">
        <div class="tenant-card__label">CURRENT TENANT</div>
        <strong>ReFlow</strong>
        <p>流程编排 / 执行 / 观测</p>
        <div class="tenant-card__rows">
          <span><i class="status-dot" /> 服务边界已定义</span>
          <span>5 层 · 16 个能力节点</span>
          <span>编排前端：ReFlow Studio</span>
        </div>
      </aside>
    </header>

    <div class="workspace">
      <main class="canvas">
        <div class="canvas-head">
          <div>
            <span class="canvas-kicker">SERVICE TOPOLOGY</span>
            <h2>编排链路分层</h2>
          </div>
          <span class="canvas-hint">自上而下：请求进入 → 编译调度 → 执行回收</span>
        </div>

        <div class="stack">
          <template v-for="(layer, layerIndex) in layers" :key="layer.key">
            <section class="layer" :class="`layer--${layer.key}`">
              <div class="layer__rail">
                <span class="layer__index">{{ layer.index }}</span>
                <span class="layer__line" />
              </div>
              <div class="layer__body">
                <div class="layer__head">
                  <h3>{{ layer.title }}</h3>
                  <p>{{ layer.note }}</p>
                </div>
                <div class="node-grid">
                  <article
                    v-for="node in layer.nodes"
                    :key="node.code"
                    class="node"
                    :class="`node--${node.tone ?? 'core'}`"
                  >
                    <div class="node__top">
                      <span class="node__code">{{ node.code }}</span>
                      <span v-if="node.tag" class="node__tag">{{ node.tag }}</span>
                    </div>
                    <strong>{{ node.title }}</strong>
                    <p>{{ node.desc }}</p>
                  </article>
                </div>
              </div>
            </section>
            <div v-if="layerIndex < layers.length - 1" class="layer-arrow" aria-hidden="true">
              <span />
            </div>
          </template>
        </div>

        <section class="flow-strip">
          <div class="flow-strip__head">
            <span class="canvas-kicker">RUNTIME PATH</span>
            <h2>一次编排的运行路径</h2>
          </div>
          <div class="flow-steps">
            <div v-for="(step, index) in flowSteps" :key="step.no" class="flow-step">
              <span class="flow-step__no">{{ step.no }}</span>
              <strong>{{ step.name }}</strong>
              <p>{{ step.desc }}</p>
              <span v-if="index < flowSteps.length - 1" class="flow-step__arrow">→</span>
            </div>
          </div>
        </section>
      </main>

      <aside class="side">
        <section class="side-card">
          <span class="side-card__kicker">TENANT BOUNDARY</span>
          <h2>租户边界</h2>
          <ul class="boundary-list">
            <li v-for="item in boundaries" :key="item">{{ item }}</li>
          </ul>
        </section>
        <section class="side-card side-card--accent">
          <span class="side-card__kicker">CAPABILITY SLOTS</span>
          <h2>能力位</h2>
          <div class="capability-row"><span>编排画布</span><b>前端</b></div>
          <div class="capability-row"><span>流程编译</span><b>核心</b></div>
          <div class="capability-row"><span>调度执行</span><b>核心</b></div>
          <div class="capability-row"><span>连接器</span><b>运行时</b></div>
          <div class="capability-row"><span>可观测</span><b>平台</b></div>
        </section>
        <section class="side-note">
          <span>READING NOTE</span>
          <p>图中 ReFlow Studio 是编排前端；它只负责画布与调试，不直接持有租户执行凭证。</p>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.reflow-page {
  --ink: #152033;
  --muted: #6b778c;
  --line: #e4e9f2;
  --blue: #2f6fed;
  --violet: #7657d6;
  --cyan: #0e9f9a;
  --amber: #c47a12;
  min-height: 100%;
  padding: 28px;
  color: var(--ink);
  background:
    radial-gradient(circle at 88% 4%, rgba(118, 87, 214, 0.13), transparent 26rem),
    radial-gradient(circle at 4% 24%, rgba(47, 111, 237, 0.11), transparent 24rem),
    #f5f7fb;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: stretch;
  max-width: 1400px;
  margin: 0 auto 22px;
}

.hero-copy {
  padding: 10px 4px 8px;
}

.kicker,
.canvas-kicker,
.side-card__kicker,
.side-note > span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--blue);
}

.kicker-dot,
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #20b486;
  box-shadow: 0 0 0 4px rgba(32, 180, 134, 0.13);
}

h1 {
  margin: 14px 0 10px;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.08;
  letter-spacing: -0.035em;
}

.lede {
  max-width: 700px;
  margin: 0;
  color: #5b687c;
  font-size: 14px;
  line-height: 1.8;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.pills span {
  padding: 6px 10px;
  border: 1px solid #dce5f4;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #42516a;
  font-size: 11px;
}

.tenant-card {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border: 1px solid rgba(47, 111, 237, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, #10244c, #1c3d76);
  color: #fff;
  box-shadow: 0 18px 42px rgba(28, 61, 118, 0.18);
}

.tenant-card::after {
  content: "";
  position: absolute;
  right: -38px;
  bottom: -44px;
  width: 150px;
  height: 150px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
}

.tenant-card__label {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: #b9cdf4;
}

.tenant-card strong {
  display: block;
  margin-top: 10px;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.tenant-card p {
  margin: 4px 0 18px;
  color: #c3d2ee;
  font-size: 12px;
}

.tenant-card__rows {
  display: grid;
  gap: 9px;
  font-size: 11px;
  color: #d7e3fa;
}

.tenant-card__rows span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  max-width: 1400px;
  margin: 0 auto;
}

.canvas,
.side-card,
.side-note {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 24px rgba(24, 38, 63, 0.04);
}

.canvas {
  padding: 22px;
  background-color: #fbfcff;
  background-image:
    linear-gradient(rgba(47, 111, 237, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 111, 237, 0.045) 1px, transparent 1px);
  background-size: 26px 26px;
}

.canvas-head,
.flow-strip__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.canvas-head h2,
.flow-strip__head h2,
.side-card h2 {
  margin: 4px 0 0;
  font-size: 17px;
  letter-spacing: -0.02em;
}

.canvas-hint {
  color: var(--muted);
  font-size: 11px;
}

.stack {
  display: grid;
}

.layer {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
}

.layer__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
}

.layer__index {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d8e2f2;
  border-radius: 9px;
  background: #fff;
  color: var(--blue);
  font-size: 10px;
  font-weight: 800;
}

.layer__line {
  width: 1px;
  flex: 1;
  margin-top: 8px;
  background: linear-gradient(#d8e2f2, transparent);
}

.layer__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0 0 10px;
}

.layer__head h3 {
  margin: 0;
  font-size: 13px;
}

.layer__head p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: 9px;
}

.node {
  position: relative;
  padding: 12px;
  border: 1px solid #e2e8f3;
  border-radius: 11px;
  background: #fff;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.node:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(31, 58, 108, 0.09);
}

.node--entry { border-top: 3px solid var(--blue); }
.node--gateway { border-top: 3px solid var(--cyan); }
.node--core { border-top: 3px solid var(--violet); }
.node--runtime { border-top: 3px solid var(--amber); }
.node--data { border-top: 3px solid #6b778c; }

.node__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}

.node__code {
  display: grid;
  place-items: center;
  width: 26px;
  height: 22px;
  border-radius: 6px;
  background: #f0f4fb;
  color: #42608e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.node__tag {
  padding: 2px 6px;
  border-radius: 999px;
  background: #f4f0ff;
  color: #6a4fc4;
  font-size: 9px;
}

.node strong {
  display: block;
  font-size: 12px;
  line-height: 1.35;
}

.node p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.layer-arrow {
  display: flex;
  justify-content: center;
  height: 22px;
}

.layer-arrow span {
  width: 1px;
  height: 100%;
  background: linear-gradient(#b9c9e2, #7f9ac7);
  position: relative;
}

.layer-arrow span::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: -3px;
  border-width: 4px 3.5px 0;
  border-style: solid;
  border-color: #7f9ac7 transparent transparent;
}

.flow-strip {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed #dce4f0;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.flow-step {
  position: relative;
  padding: 11px;
  border: 1px solid #e4eaf4;
  border-radius: 10px;
  background: #fff;
}

.flow-step__no {
  color: var(--blue);
  font-size: 9px;
  font-weight: 800;
}

.flow-step strong {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.flow-step p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}

.flow-step__arrow {
  position: absolute;
  top: 50%;
  right: -9px;
  z-index: 1;
  color: #9bb0d0;
  font-size: 12px;
}

.side {
  display: grid;
  align-content: start;
  gap: 12px;
}

.side-card,
.side-note {
  padding: 18px;
}

.side-card__kicker {
  color: var(--blue);
}

.boundary-list {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.boundary-list li {
  position: relative;
  padding-left: 16px;
  color: #58667b;
  font-size: 11px;
  line-height: 1.65;
}

.boundary-list li::before {
  content: "";
  position: absolute;
  top: 7px;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #8fb0e8;
}

.side-card--accent {
  background: linear-gradient(160deg, #f7f9ff, #fff);
  border-color: #d9e4f7;
}

.capability-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid #edf1f8;
  color: #58667b;
  font-size: 11px;
}

.capability-row:last-child {
  border-bottom: 0;
}

.capability-row b {
  color: #34517f;
  font-size: 10px;
  font-weight: 600;
}

.side-note {
  background: #172033;
  color: #d9e2f2;
}

.side-note > span {
  color: #8fa6c8;
}

.side-note p {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .hero,
  .workspace {
    grid-template-columns: 1fr;
  }

  .tenant-card {
    max-width: 360px;
  }
}

@media (max-width: 720px) {
  .reflow-page {
    padding: 16px;
  }

  .canvas {
    padding: 16px;
  }

  .flow-steps {
    grid-template-columns: 1fr 1fr;
  }

  .flow-step__arrow {
    display: none;
  }

  .layer {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .layer__head {
    display: block;
  }

  .layer__head p {
    margin-top: 3px;
  }
}
</style>
