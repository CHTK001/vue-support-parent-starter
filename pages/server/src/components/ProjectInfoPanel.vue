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

const TYPE_LABELS: Record<string, string> = {
  springboot: 'SpringBoot 单体',
  fatjar: 'FatJar',
  git: 'Git 源码部署',
  separated: '分离式部署',
  model: '模型',
  static: '静态页面',
  nginx: 'Nginx',
};

const TYPE_ICONS: Record<string, string> = {
  springboot: 'Cpu',
  fatjar: 'Cpu',
  git: 'GitBranch',
  separated: 'Box',
  model: 'Files',
  static: 'Picture',
  nginx: 'Connection',
};

const typeLabel = computed(() => TYPE_LABELS[props.project.projectType] || props.project.projectType || '未知');
const typeIcon = computed(() => TYPE_ICONS[props.project.projectType] || 'Folder');

const running = computed(() => props.project.status === 'running');
const disabled = computed(() => props.project.enabled === false);

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
</script>

<template>
  <div class="pip">
    <!-- 抬头：类型 + 名称 + 状态 + 主操作 -->
    <div class="pip-head">
      <span class="pip-ic" :class="`tone-${project.projectType}`">
        <ReIcon :name="typeIcon" :size="18" />
      </span>
      <div class="pip-title">
        <div class="pip-name" :title="project.projectName">{{ project.projectName }}</div>
        <div class="pip-sub">
          <span class="pip-type">{{ typeLabel }}</span>
          <span class="pip-dot">·</span>
          <span class="pip-state" :class="running ? 'is-on' : disabled ? 'is-off' : 'is-idle'">
            {{ disabled ? '已禁用' : running ? '运行中' : '已停止' }}
          </span>
          <template v-if="project.runtimeProcess === false">
            <span class="pip-dot">·</span><span class="pip-type">文件型项目（无常驻进程）</span>
          </template>
        </div>
      </div>
      <div class="pip-actions">
        <template v-if="project.enabled !== false && project.runtimeProcess !== false">
          <button v-if="!running" type="button" class="pip-btn is-primary" @click="emit('action', 'start')">
            <ReIcon name="VideoPlay" :size="13" />启动
          </button>
          <template v-else>
            <button type="button" class="pip-btn" @click="emit('action', 'stop')">
              <ReIcon name="VideoPause" :size="13" />停止
            </button>
            <button type="button" class="pip-btn" @click="emit('action', 'restart')">
              <ReIcon name="RefreshRight" :size="13" />重启
            </button>
          </template>
        </template>
        <button type="button" class="pip-btn" :disabled="!canLog" @click="emit('action', 'log')">
          <ReIcon name="Tickets" :size="13" />系统日志
        </button>
        <button type="button" class="pip-btn" @click="emit('action', 'files')">
          <ReIcon name="FolderOpened" :size="13" />文件
        </button>
        <button type="button" class="pip-btn" :disabled="project.enabled === false" @click="emit('action', 'upgrade')">
          <ReIcon name="Top" :size="13" />升级
        </button>
        <button type="button" class="pip-btn" @click="emit('action', 'edit')">
          <ReIcon name="EditPen" :size="13" />编辑
        </button>
      </div>
    </div>

    <div class="pip-grid">
      <!-- 基本信息 -->
      <section class="pip-card">
        <div class="pip-card-title"><ReIcon name="InfoFilled" :size="13" />基本信息</div>
        <dl class="pip-list">
          <div class="pip-row"><dt>项目地址</dt><dd class="mono" :title="project.projectPath">{{ project.projectPath || '—' }}</dd></div>
          <div class="pip-row"><dt>日志地址</dt><dd class="mono" :title="project.logPath">{{ project.logPath || '未配置' }}</dd></div>
          <div class="pip-row"><dt>主入口</dt><dd class="mono">{{ project.mainEntry || '—' }}</dd></div>
          <div class="pip-row"><dt>主机</dt><dd>{{ hostLabel || '未绑定' }}</dd></div>
          <div class="pip-row" v-if="project.serviceName"><dt>服务名</dt><dd class="mono">{{ project.serviceName }}</dd></div>
          <div class="pip-row" v-if="project.runtimeProcess !== false">
            <dt>PID</dt><dd class="mono">{{ running ? project.pid || '—' : '—' }}</dd>
          </div>
          <div class="pip-row" v-if="runtimeLabel"><dt>运行时长</dt><dd>{{ runtimeLabel }}</dd></div>
        </dl>
      </section>

      <!-- 观测入口 -->
      <section class="pip-card">
        <div class="pip-card-title"><ReIcon name="DataAnalysis" :size="13" />观测入口</div>
        <div class="pip-ep">
          <div class="pip-ep-row">
            <span class="pip-ep-name">Swagger</span>
            <span class="pip-ep-state" :class="`is-${swaggerState.tone}`">{{ swaggerState.text }}</span>
            <button
              type="button"
              class="pip-link"
              :disabled="!endpoint?.swagger"
              @click="emit('action', 'swagger')"
            >{{ endpoint?.swagger ? '打开' : '详情' }}</button>
          </div>
          <div class="pip-ep-row">
            <span class="pip-ep-name">Actuator</span>
            <span class="pip-ep-state" :class="`is-${actuatorState.tone}`">{{ actuatorState.text }}</span>
            <button
              type="button"
              class="pip-link"
              :disabled="!endpoint?.actuator"
              @click="emit('action', 'actuator')"
            >{{ endpoint?.actuator ? '打开' : '详情' }}</button>
          </div>
          <div class="pip-ep-row" v-if="apmLabel">
            <span class="pip-ep-name">APM</span>
            <span class="pip-ep-state is-ok">{{ apmLabel }}</span>
            <button type="button" class="pip-link" :disabled="!apmObservable" @click="emit('action', 'apm')">
              {{ apmObservable ? '观测' : '—' }}
            </button>
          </div>
          <div class="pip-ep-row" v-if="apmObservable">
            <span class="pip-ep-name">链路追踪</span>
            <span class="pip-ep-state is-muted">按服务名定位</span>
            <button type="button" class="pip-link" @click="emit('action', 'traces')">打开</button>
          </div>
          <div v-if="endpoint?.message" class="pip-ep-msg">{{ endpoint.message }}</div>
        </div>
      </section>

      <!-- Git 与投放 -->
      <section class="pip-card">
        <div class="pip-card-title"><ReIcon name="GitBranch" :size="13" />源码与投放</div>
        <dl class="pip-list">
          <div class="pip-row"><dt>仓库</dt><dd class="mono" :title="project.gitUrl">{{ project.gitUrl || '未配置' }}</dd></div>
          <div class="pip-row" v-if="project.gitUrl"><dt>分支</dt><dd class="mono">{{ project.gitBranch || 'main' }}</dd></div>
          <div class="pip-row" v-if="project.gitLastCommit"><dt>最近提交</dt><dd class="mono">{{ project.gitLastCommit.slice(0, 12) }}</dd></div>
          <div class="pip-row"><dt>部署类型</dt><dd>{{ project.deployType || '—' }}</dd></div>
          <div class="pip-row" v-if="project.projectType === 'separated'"><dt>依赖包</dt><dd>{{ libCount }} 个</dd></div>
          <div class="pip-row"><dt>上传目录</dt><dd class="mono">{{ project.uploadTargetDir || 'uploads/' }}</dd></div>
        </dl>
        <div class="pip-links">
          <button v-if="project.gitUrl" type="button" class="pip-link" @click="emit('action', 'git-repo')">Git 仓库</button>
          <button type="button" class="pip-link" :disabled="!project.projectPath" @click="emit('action', 'download-source')">下载源码</button>
          <button type="button" class="pip-link" @click="emit('action', 'system-config')">系统配置</button>
        </div>
      </section>

      <!-- 变量摘要 -->
      <section class="pip-card">
        <div class="pip-card-title"><ReIcon name="SetUp" :size="13" />变量摘要</div>
        <div class="pip-vars">
          <button
            v-for="v in varSummary"
            :key="v.key"
            type="button"
            class="pip-var"
            @click="emit('action', 'vars')"
          >
            <b>{{ v.count }}</b>
            <span>{{ v.label }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pip {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 14px 16px;
  overflow: auto;
}

.pip-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.pip-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(135deg, #6d5dfc, #8f7bff);
}

.pip-ic.tone-git { background: linear-gradient(135deg, #f08c00, #ffb454); }
.pip-ic.tone-separated { background: linear-gradient(135deg, #1f9d8b, #38c9a8); }
.pip-ic.tone-model { background: linear-gradient(135deg, #7a5af8, #b08bff); }
.pip-ic.tone-static { background: linear-gradient(135deg, #3b82f6, #63a4ff); }
.pip-ic.tone-nginx { background: linear-gradient(135deg, #0ea5a4, #2dd4bf); }

.pip-title { min-width: 0; }
.pip-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.pip-dot { opacity: 0.6; }
.pip-state.is-on { color: #2fbf71; }
.pip-state.is-off { color: #d29922; }
.pip-state.is-idle { color: var(--text-tertiary); }

.pip-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pip-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.pip-btn:hover:not(:disabled) { color: var(--brand-500, #6d5dfc); border-color: var(--brand-500, #6d5dfc); }
.pip-btn.is-primary {
  color: #fff;
  background: var(--brand-500, #6d5dfc);
  border-color: var(--brand-500, #6d5dfc);
}
.pip-btn:disabled, .pip-link:disabled { opacity: 0.45; cursor: not-allowed; }

.pip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  align-content: start;
}

.pip-card {
  padding: 12px 14px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

.pip-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pip-list { display: flex; flex-direction: column; gap: 7px; margin: 0; }
.pip-row { display: flex; align-items: baseline; gap: 10px; font-size: 12px; }
.pip-row dt { flex: none; width: 64px; color: var(--text-tertiary); }
.pip-row dd {
  margin: 0;
  min-width: 0;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mono { font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace; }

.pip-ep { display: flex; flex-direction: column; gap: 8px; }
.pip-ep-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.pip-ep-name { width: 84px; color: var(--text-secondary); }
.pip-ep-state { flex: 1; min-width: 0; color: var(--text-tertiary); }
.pip-ep-state.is-ok { color: #2fbf71; }
.pip-ep-state.is-off { color: #d29922; }
.pip-ep-state.is-muted { color: var(--text-tertiary); }
.pip-ep-msg {
  margin-top: 4px;
  padding: 6px 8px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  border-radius: 6px;
}

.pip-link {
  padding: 0;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--brand-500, #6d5dfc);
  cursor: pointer;
}
.pip-link:hover:not(:disabled) { text-decoration: underline; }

.pip-links { display: flex; gap: 12px; margin-top: 10px; }

.pip-vars { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.pip-var {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 10px;
  text-align: left;
  background: var(--bg-fill);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}
.pip-var:hover { border-color: var(--brand-500, #6d5dfc); }
.pip-var b { font-size: 15px; color: var(--text-primary); font-variant-numeric: tabular-nums; }
</style>
