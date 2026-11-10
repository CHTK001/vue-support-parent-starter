<script setup lang="ts">
/**
 * ProjectInfoPanel —— 项目「系统信息」页签。
 *
 * <p>左侧项目行单击时在右侧打开它：把「这个项目到底是什么、跑在哪、能不能点开
 * Swagger/Actuator/APM」一次讲清楚，而不是只能靠日志和右键菜单猜。
 * 面板本身不发请求：端点探测与依赖包数量都由页面传进来，避免切页签重复 SSH。</p>
 *
 * <p>所有操作都通过 `action` 事件回给页面，面板不直接调接口 —— 启动/停止/升级
 * 这些动作在页面里已经有确认、任务浮层与错误详情，抽两份迟早会走岔。</p>
 *
 * <p>版式：抬头（身份 + 状态 + 操作）→ 指标条 → 左「项目本体」右「部署与观测」两栏。
 * 列表数据由 basicRows / sourceRows / endpointRows / varSummary 统一给出，
 * 模板只负责排版，避免新增字段时只管一处。</p>
 */
import { computed } from 'vue';
import ReIcon from '@repo/ui/re-icon';

defineOptions({ name: 'ProjectInfoPanel' });

/** 面板需要的最小项目字段（页面里的 Project 是它的超集） */
interface InfoProject {
  id: number;
  projectName: string;
  projectType: string;
  status: string;
  enabled?: boolean;
  projectPath?: string;
  logPath?: string;
  mainEntry?: string;
  serviceName?: string;
  pid?: string;
  runningSince?: string;
  gitUrl?: string;
  gitBranch?: string;
  gitLastCommit?: string;
  jvmArgs?: string;
  envVars?: string;
  cmdArgs?: string;
  appConfig?: string;
  deployType?: string;
  uploadTargetDir?: string;
  runtimeProcess?: boolean;
  javaProcess?: boolean;
}

/** 端点探测结果（与页面 EndpointProbe 同形） */
interface EndpointInfo {
  swagger?: boolean;
  actuator?: boolean;
  port?: number;
  swaggerUrl?: string;
  actuatorUrl?: string;
  health?: string;
  metricCount?: number;
  metrics?: string[];
  message?: string;
}

const props = withDefaults(
  defineProps<{
    project: InfoProject;
    /** 主机展示名（发布绑定的那台） */
    hostLabel?: string;
    /** 端点探测结果；null 表示还没探测 */
    endpoint?: EndpointInfo | null;
    /** 端点探测中 */
    probing?: boolean;
    /** 依赖包数量（分离式项目） */
    libCount?: number;
    /** 项目注入的 APM 类型标签（空串=未接入） */
    apmLabel?: string;
    /** 是否有可跳转的 APM 观测台 */
    apmObservable?: boolean;
    /** 是否支持系统日志（配了日志地址） */
    canLog?: boolean;
  }>(),
  {
    hostLabel: '',
    endpoint: null,
    probing: false,
    libCount: 0,
    apmLabel: '',
    apmObservable: false,
    canLog: false,
  },
);

const emit = defineEmits<{
  (e: 'action', command: string): void;
}>();

interface InfoRow {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  title?: string;
}
interface EndpointRow {
  name: string;
  text: string;
  tone: string;
  command: string;
  enabled: boolean;
  action: string;
}
interface ActionItem {
  command: string;
  label: string;
  icon: string;
  primary?: boolean;
  disabled?: boolean;
}
interface StatItem {
  label: string;
  value: string;
  tone?: string;
}

const TYPE_LABELS: Record<string, string> = {
  springboot: 'SpringBoot 单体',
  fatjar: 'FatJar',
  git: 'Git 源码部署',
  separated: '分离式部署',
  model: '模型',
  static: '静态页面',
  nginx: 'Nginx',
  docker: 'Docker 容器',
};

const TYPE_ICONS: Record<string, string> = {
  springboot: 'Cpu',
  fatjar: 'Cpu',
  git: 'GitBranch',
  separated: 'Box',
  model: 'Files',
  static: 'Picture',
  nginx: 'Connection',
  docker: 'Box',
};

const typeLabel = computed(() => TYPE_LABELS[props.project.projectType] || props.project.projectType || '未知');
const typeIcon = computed(() => TYPE_ICONS[props.project.projectType] || 'Folder');

const running = computed(() => props.project.status === 'running');
const disabled = computed(() => props.project.enabled === false);
const statusText = computed(() => (disabled.value ? '已禁用' : running.value ? '运行中' : '已停止'));
const statusTone = computed(() => (disabled.value ? 'off' : running.value ? 'on' : 'idle'));

/** 运行时长：runningSince 是后端给的 ISO 时间 */
const runtimeLabel = computed(() => {
  const since = props.project.runningSince;
  if (!running.value || !since) return '';
  const ms = Date.now() - new Date(since).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} 分钟`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时 ${min % 60} 分`;
  return `${Math.floor(hour / 24)} 天 ${hour % 24} 小时`;
});

/** 配置项计数：只统计 JSON 数组里的有效项，空/坏值按 0 */
function countOf(raw?: string): number {
  if (!raw) return 0;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => String(x ?? '').trim()).length : 0;
  } catch {
    return 0;
  }
}

const varSummary = computed(() => [
  { key: 'env', label: '环境变量', count: countOf(props.project.envVars) },
  { key: 'jvm', label: 'JVM 参数', count: countOf(props.project.jvmArgs) },
  { key: 'args', label: '程序参数', count: countOf(props.project.cmdArgs) },
  { key: 'app', label: '应用配置', count: countOf(props.project.appConfig) },
]);

/** 端点状态文案：未探测 / 探测中 / 可用 / 不可用 */
function endpointState(ok?: boolean): { text: string; tone: string } {
  if (props.probing) return { text: '探测中', tone: 'muted' };
  if (!props.endpoint) return { text: '未探测', tone: 'muted' };
  return ok ? { text: '可用', tone: 'ok' } : { text: '不可用', tone: 'off' };
}

const swaggerState = computed(() => endpointState(props.endpoint?.swagger));
const actuatorState = computed(() => endpointState(props.endpoint?.actuator));

const basicRows = computed<InfoRow[]>(() => {
  const p = props.project;
  const rows: InfoRow[] = [
    { label: '项目地址', value: p.projectPath || '—', mono: true, title: p.projectPath, muted: !p.projectPath },
    { label: '日志地址', value: p.logPath || '未配置', mono: true, title: p.logPath, muted: !p.logPath },
    { label: '主入口', value: p.mainEntry || '—', mono: true, muted: !p.mainEntry },
    { label: '主机', value: props.hostLabel || '未绑定', muted: !props.hostLabel },
  ];
  if (p.serviceName) rows.push({ label: '服务名', value: p.serviceName, mono: true });
  if (p.runtimeProcess !== false) {
    rows.push({ label: 'PID', value: running.value ? p.pid || '—' : '—', mono: true, muted: !running.value || !p.pid });
  }
  if (runtimeLabel.value) rows.push({ label: '运行时长', value: runtimeLabel.value });
  return rows;
});

const sourceRows = computed<InfoRow[]>(() => {
  const p = props.project;
  const rows: InfoRow[] = [
    { label: '仓库', value: p.gitUrl || '未配置', mono: true, title: p.gitUrl, muted: !p.gitUrl },
  ];
  if (p.gitUrl) rows.push({ label: '分支', value: p.gitBranch || 'main', mono: true });
  if (p.gitLastCommit) {
    rows.push({ label: '最近提交', value: p.gitLastCommit.slice(0, 12), mono: true, title: p.gitLastCommit });
  }
  rows.push({ label: '部署类型', value: p.deployType || '—', muted: !p.deployType });
  if (p.projectType === 'separated') rows.push({ label: '依赖包', value: `${props.libCount} 个` });
  rows.push({ label: '上传目录', value: p.uploadTargetDir || 'uploads/', mono: true });
  return rows;
});

const endpointRows = computed<EndpointRow[]>(() => {
  const rows: EndpointRow[] = [
    {
      name: 'Swagger',
      text: swaggerState.value.text,
      tone: swaggerState.value.tone,
      command: 'swagger',
      enabled: !!props.endpoint?.swagger,
      action: props.endpoint?.swagger ? '打开' : '详情',
    },
    {
      name: 'Actuator',
      text: actuatorState.value.text,
      tone: actuatorState.value.tone,
      command: 'actuator',
      enabled: !!props.endpoint?.actuator,
      action: props.endpoint?.actuator ? '打开' : '详情',
    },
  ];
  if (props.apmLabel) {
    rows.push({
      name: 'APM',
      text: props.apmLabel,
      tone: 'ok',
      command: 'apm',
      enabled: props.apmObservable,
      action: props.apmObservable ? '观测' : '—',
    });
  }
  if (props.apmObservable) {
    rows.push({
      name: '链路追踪',
      text: '按服务名定位',
      tone: 'muted',
      command: 'traces',
      enabled: true,
      action: '打开',
    });
  }
  return rows;
});

const endpointOk = computed(() => [props.endpoint?.swagger, props.endpoint?.actuator].filter(Boolean).length);
const pidLabel = computed(() =>
  running.value && props.project.runtimeProcess !== false ? props.project.pid || '—' : '—',
);

const stats = computed<StatItem[]>(() => [
  { label: '运行状态', value: statusText.value, tone: statusTone.value },
  { label: '运行时长', value: runtimeLabel.value || '—' },
  { label: 'PID', value: pidLabel.value },
  {
    label: '端点可用',
    value: props.probing ? '探测中' : `${endpointOk.value} / 2`,
    tone: props.probing ? 'idle' : undefined,
  },
]);

const runActions = computed<ActionItem[]>(() => {
  const p = props.project;
  if (p.enabled === false || p.runtimeProcess === false) return [];
  if (!running.value) return [{ command: 'start', label: '启动', icon: 'VideoPlay', primary: true }];
  return [
    { command: 'stop', label: '停止', icon: 'VideoPause' },
    { command: 'restart', label: '重启', icon: 'RefreshRight', primary: true },
  ];
});

const toolActions = computed<ActionItem[]>(() => [
  { command: 'log', label: '系统日志', icon: 'Tickets', disabled: !props.canLog },
  { command: 'files', label: '文件', icon: 'FolderOpened' },
  { command: 'upgrade', label: '升级', icon: 'Top', disabled: props.project.enabled === false },
  { command: 'edit', label: '编辑', icon: 'EditPen' },
]);

const allActions = computed<ActionItem[]>(() => [...runActions.value, ...toolActions.value]);

const bodyClass = computed(() => ['pip-body', `type-${props.project.projectType || 'unknown'}`]);
</script>

<template>
  <div class="pip">
    <div :class="bodyClass">
      <!-- 抬头：身份 + 状态 + 操作 -->
      <header class="pip-hero">
        <span class="pip-ic"><ReIcon :name="typeIcon" :size="20" /></span>
        <div class="pip-id">
          <h2 class="pip-name" :title="project.projectName">{{ project.projectName }}</h2>
          <div class="pip-meta">
            <span class="pip-type-chip">{{ typeLabel }}</span>
            <span class="pip-status" :class="`is-${statusTone}`"><i></i>{{ statusText }}</span>
            <span v-if="project.runtimeProcess === false" class="pip-type-chip is-quiet">文件型项目</span>
          </div>
        </div>
        <div class="pip-actions">
          <button
            v-for="a in allActions"
            :key="a.command"
            type="button"
            class="pip-btn"
            :class="{ 'is-primary': a.primary }"
            :disabled="a.disabled"
            @click="emit('action', a.command)"
          >
            <ReIcon :name="a.icon" :size="13" />{{ a.label }}
          </button>
        </div>
      </header>

      <!-- 指标条：把「正不正常、跑了多久」提到第一屏 -->
      <div class="pip-kpis">
        <div v-for="s in stats" :key="s.label" class="pip-kpi">
          <span class="pip-kpi-label">{{ s.label }}</span>
          <span class="pip-kpi-value" :class="s.tone ? `is-${s.tone}` : ''" :title="s.value">{{ s.value }}</span>
        </div>
      </div>

      <div class="pip-cols">
        <!-- 项目本体 -->
        <div class="pip-stack">
          <section class="pip-card">
            <div class="pip-card-head"><ReIcon name="InfoFilled" :size="13" />基本信息</div>
            <dl class="pip-rows">
              <div v-for="r in basicRows" :key="r.label" class="pip-row">
                <dt>{{ r.label }}</dt>
                <dd :class="{ mono: r.mono, 'is-muted': r.muted }" :title="r.title || r.value">{{ r.value }}</dd>
              </div>
            </dl>
          </section>

          <section class="pip-card">
            <div class="pip-card-head"><ReIcon name="SetUp" :size="13" />变量摘要</div>
            <div class="pip-vars">
              <button v-for="v in varSummary" :key="v.key" type="button" class="pip-var" @click="emit('action', 'vars')">
                <b>{{ v.count }}</b><span>{{ v.label }}</span>
              </button>
            </div>
          </section>
        </div>

        <!-- 部署与观测 -->
        <div class="pip-stack">
          <section class="pip-card">
            <div class="pip-card-head"><ReIcon name="DataAnalysis" :size="13" />观测入口</div>
            <div class="pip-eps">
              <div v-for="e in endpointRows" :key="e.name" class="pip-ep">
                <span class="pip-ep-dot" :class="`is-${e.tone}`"></span>
                <span class="pip-ep-name">{{ e.name }}</span>
                <span class="pip-ep-state" :class="`is-${e.tone}`">{{ e.text }}</span>
                <button type="button" class="pip-link" :disabled="!e.enabled" @click="emit('action', e.command)">
                  {{ e.action }}
                </button>
              </div>
              <p v-if="endpoint?.message" class="pip-msg">{{ endpoint.message }}</p>
              <div v-if="endpoint && (endpoint.port || endpoint.health || endpoint.metricCount)" class="pip-ep-extra">
                <span v-if="endpoint.port">端口 <b>{{ endpoint.port }}</b></span>
                <span v-if="endpoint.health">健康 <b>{{ endpoint.health }}</b></span>
                <span v-if="endpoint.metricCount">指标 <b>{{ endpoint.metricCount }}</b></span>
              </div>
            </div>
          </section>

          <section class="pip-card">
            <div class="pip-card-head"><ReIcon name="GitBranch" :size="13" />源码与投放</div>
            <dl class="pip-rows">
              <div v-for="r in sourceRows" :key="r.label" class="pip-row">
                <dt>{{ r.label }}</dt>
                <dd :class="{ mono: r.mono, 'is-muted': r.muted }" :title="r.title || r.value">{{ r.value }}</dd>
              </div>
            </dl>
            <div class="pip-links">
              <button v-if="project.gitUrl" type="button" class="pip-link" @click="emit('action', 'git-repo')">Git 仓库</button>
              <button type="button" class="pip-link" :disabled="!project.projectPath" @click="emit('action', 'download-source')">下载源码</button>
              <button type="button" class="pip-link" @click="emit('action', 'system-config')">系统配置</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pip {
  position: relative;
  height: 100%;
  min-height: 0;
}

.pip-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 14px 16px 18px;
  overflow: auto;
  background:
    radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--type-1) 7%, transparent) 0%, transparent 55%),
    var(--bg-layout);
  --type-1: #1677ff;
  --type-2: #4d9bff;
}

/* 类型色：抬头图标按项目类型着色，不再是统一的紫色 */
.type-springboot { --type-1: #1677ff; --type-2: #4d9bff; }
.type-fatjar { --type-1: #0f60e0; --type-2: #3b82f6; }
.type-git { --type-1: #d97706; --type-2: #fbbf24; }
.type-separated { --type-1: #0f8f7e; --type-2: #38c9a8; }
.type-model { --type-1: #6d4ef0; --type-2: #a78bfa; }
.type-static { --type-1: #2563eb; --type-2: #60a5fa; }
.type-nginx { --type-1: #0e8f8e; --type-2: #2dd4bf; }
.type-docker { --type-1: #1273b8; --type-2: #38bdf8; }

/* ---------------- 抬头 ---------------- */
.pip-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding: 12px 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}

.pip-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--type-1), var(--type-2));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--type-1) 26%, transparent);
}

.pip-id { min-width: 0; }
.pip-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
}

.pip-actions {
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.pip-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary);
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.pip-btn:hover:not(:disabled) {
  color: var(--brand-600);
  border-color: var(--brand-300);
  background: var(--brand-50);
}
.pip-btn.is-primary {
  color: #fff;
  background: var(--brand-500);
  border-color: var(--brand-500);
}
.pip-btn.is-primary:hover:not(:disabled) {
  color: #fff;
  background: var(--brand-600);
  border-color: var(--brand-600);
}
.pip-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ---------------- 状态 / 类型标签 ---------------- */
.pip-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  border-radius: 999px;
  white-space: nowrap;
}
.pip-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.pip-status.is-on { color: #178a4c; background: rgba(22, 201, 22, 0.1); }
.pip-status.is-on i { animation: pip-pulse 2.4s ease-out infinite; }
.pip-status.is-off { color: #9a6b00; background: rgba(255, 151, 48, 0.14); }

@keyframes pip-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22, 201, 22, 0.45); }
  70% { box-shadow: 0 0 0 5px rgba(22, 201, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 201, 22, 0); }
}

.pip-type-chip {
  padding: 2px 8px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-radius: 6px;
  white-space: nowrap;
}
.pip-type-chip.is-quiet { color: var(--text-tertiary); }

/* ---------------- 指标条 ---------------- */
.pip-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  flex: none;
}
.pip-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 9px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.pip-kpi-label {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--text-tertiary);
}
.pip-kpi-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-kpi-value.is-on { color: #178a4c; }
.pip-kpi-value.is-off { color: #b26b00; }
.pip-kpi-value.is-idle { color: var(--text-tertiary); }

/* ---------------- 两栏 ---------------- */
.pip-cols {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}
.pip-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.pip-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.pip-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pip-rows {
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin: 0;
}
.pip-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  font-size: 13px;
}
.pip-row dt {
  flex: none;
  width: 70px;
  color: var(--text-tertiary);
}
.pip-row dd {
  margin: 0;
  min-width: 0;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-row dd.is-muted { color: var(--text-tertiary); }
.mono {
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
}

/* ---------------- 端点 ---------------- */
.pip-eps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pip-ep {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12.5px;
}
.pip-ep-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
}
.pip-ep-dot.is-ok {
  background: var(--status-success);
  box-shadow: 0 0 0 3px rgba(22, 201, 22, 0.12);
}
.pip-ep-dot.is-off { background: var(--status-warning); }
.pip-ep-name {
  flex: none;
  width: 76px;
  color: var(--text-secondary);
}
.pip-ep-state {
  flex: 1;
  min-width: 0;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-ep-state.is-ok { color: #178a4c; }
.pip-ep-state.is-off { color: #b26b00; }
.pip-ep-state.is-muted { color: var(--text-tertiary); }
.pip-msg {
  margin: 2px 0 0;
  padding: 6px 9px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  border-radius: 6px;
}
.pip-ep-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  padding-top: 9px;
  font-size: 11.5px;
  color: var(--text-tertiary);
  border-top: 1px dashed var(--border-subtle);
}
.pip-ep-extra b {
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ---------------- 文字链接 ---------------- */
.pip-link {
  flex: none;
  padding: 0;
  font-size: 12px;
  color: var(--brand-500);
  background: transparent;
  border: none;
  cursor: pointer;
}
.pip-link:hover:not(:disabled) { color: var(--brand-600); text-decoration: underline; }
.pip-link:disabled { opacity: 0.4; cursor: not-allowed; }
.pip-links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: auto;
  padding-top: 10px;
}

/* ---------------- 变量 ---------------- */
.pip-vars {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(54px, auto);
  gap: 8px;
}
.pip-var {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 9px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: left;
  background: var(--bg-fill);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.pip-var:hover {
  background: var(--brand-50);
  border-color: var(--brand-200);
}
.pip-var b {
  font-size: 15px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 900px) {
  .pip-cols { grid-template-columns: minmax(0, 1fr); }
  .pip-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .pip-status.is-on i { animation: none; }
}
</style>
