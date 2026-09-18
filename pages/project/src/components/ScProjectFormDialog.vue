<script setup lang="ts">
/**
 * 项目表单弹窗（新建/编辑）
 * 含基础信息、目标服务器、部署目录、启停脚本、升级策略全部字段。
 * 组件约定：全量使用 Re 组件体系（ReButton/ReInput/ReSelect/ReRadioGroup/ReSwitch...）。
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import { queryHostOptions, saveProject, aiGenScript } from '../api';

interface HostOption {
  id: number;
  name: string;
  address: string;
  osType: string;
}

const props = defineProps<{ visible: boolean; project: any | null }>();
const emit = defineEmits<{ 'update:visible': [v: boolean]; saved: [] }>();

/**
 * ReDialog 的 v-model 契约是 `modelValue`（内部 `defineModel<boolean>()`），不是 `visible`。
 * 若写成 `v-model="props.visible"`：
 *   ① 关闭时回写的是只读 props，父组件状态永远停在 true；
 *   ② 父组件再次置 true 不产生 prop 变化 → 弹窗第二次打不开。
 * 因此用 computed 代理，把 ReDialog 的 modelValue 双向桥接到 visible。
 */
const dialogVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

const loading = ref(false);
const aiLoading = ref(false);
const hosts = ref<HostOption[]>([]);
const form = ref(newProjectForm());

const projectTypes = [
  { label: 'SpringBoot 单体jar', value: 'SPRINGBOOT_MONO' },
  { label: 'SpringBoot war包', value: 'SPRINGBOOT_WAR' },
  { label: '前后端分离', value: 'SPRINGBOOT_SPLIT' },
  { label: 'Node.js', value: 'NODEJS' },
  { label: '静态资源(dist)', value: 'STATIC' },
  { label: '自定义', value: 'CUSTOM' },
];

const typeDefaults: Record<string, { start: string; stop: string; restart: string }> = {
  SPRINGBOOT_MONO: {
    start: 'cd {{dir}} && nohup java -jar *.jar > /dev/null 2>&1 &',
    stop: 'ps -ef | grep "\.jar" | grep -v grep | awk \'NR==1{print $2}\' | xargs -r kill',
    restart: 'cd {{dir}} && nohup java -jar *.jar > /dev/null 2>&1 &',
  },
  SPRINGBOOT_WAR: {
    start: 'cd {{dir}} && nohup java -jar *.war > /dev/null 2>&1 &',
    stop: 'ps -ef | grep "\.war" | grep -v grep | awk \'NR==1{print $2}\' | xargs -r kill',
    restart: 'cd {{dir}} && nohup java -jar *.war > /dev/null 2>&1 &',
  },
  SPRINGBOOT_SPLIT: {
    start: 'cd {{dir}} && nohup java -jar app.jar > /dev/null 2>&1 &',
    stop: 'ps -ef | grep app.jar | grep -v grep | awk \'NR==1{print $2}\' | xargs -r kill',
    restart: 'cd {{dir}} && nohup java -jar app.jar > /dev/null 2>&1 &',
  },
  NODEJS: {
    start: 'cd {{dir}} && pm2 start ecosystem.config.js --env production',
    stop: 'cd {{dir}} && pm2 stop all',
    restart: 'cd {{dir}} && pm2 restart all',
  },
  STATIC: {
    start: 'systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null',
    stop: 'echo "无需停止"',
    restart: 'systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null',
  },
  CUSTOM: { start: '# 在此填写启动命令', stop: '# 在此填写停止命令', restart: '# 在此填写重启命令' },
};

const healthTypes = [
  { label: '端口检测', value: 'PORT' },
  { label: 'HTTP 探测', value: 'HTTP' },
  { label: '进程检测', value: 'PROCESS' },
];

/** 健康检查目标占位提示（随类型变化） */
const healthTargetPlaceholder = computed(() => {
  const t = form.value.msProjectHealthType;
  if (t === 'HTTP') return '如 127.0.0.1:8080/actuator/health';
  if (t === 'PROCESS') return '如 java 或 app.jar';
  return '如 8080';
});

const isEdit = computed(() => !!props.project);
const selectedOs = ref('LINUX');
let initializing = false;

/** 服务器下拉选项（ReSelect data 格式） */
const hostOptions = computed(() =>
  hosts.value.map(h => ({ label: `${h.name} (${h.address})`, value: h.id })),
);

/**
 * 开关型字段清单。
 * 后端（以及 DDL 默认值）返回的是 0/1 数字，而 ElSwitch 的 checked 判定为
 * `modelValue === activeValue`（activeValue 默认 true），`1 === true` 为 false，
 * 会导致编辑回填时所有开关都显示为「关」，与实际策略不符。故回填时统一归一化为布尔。
 */
const BOOL_FIELDS = [
  'msProjectDeleteBefore',
  'msProjectAutoExtract',
  'msProjectAutoStart',
  'msProjectHealthEnabled',
  'msProjectAutoRollback',
  'msProjectWatchdogEnabled',
  'msProjectPreflightGate',
  'msProjectMetricEnabled',
] as const;

/** 把 0/1/true/false/'1' 统一成布尔 */
function normalizeBools(target: Record<string, any>) {
  for (const key of BOOL_FIELDS) {
    const v = target[key];
    target[key] = v === true || v === 1 || v === '1';
  }
}

/** 数值区间判定（ReInputNumber 允许手输，min/max 属性不拦截键盘输入） */
function inRange(v: unknown, min: number, max: number): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
}

watch(() => props.visible, async v => {
  if (!v) return;
  initializing = true;
  try {
    if (props.project) {
      form.value = { ...newProjectForm(), ...props.project };
      normalizeBools(form.value);
      // 编辑回填：hostIds JSON 字符串 → 数组，避免提交时重复 JSON.stringify 导致校验失败
      if (typeof form.value.msProjectHostIds === 'string') {
        try {
          const parsed = JSON.parse(form.value.msProjectHostIds);
          form.value.msProjectHostIds = Array.isArray(parsed) ? parsed as number[] : [];
        } catch { form.value.msProjectHostIds = []; }
      }
      if (typeof form.value.msProjectMetricHostIds === 'string') {
        try {
          const parsed = JSON.parse(form.value.msProjectMetricHostIds);
          form.value.msProjectMetricHostIds = Array.isArray(parsed) ? parsed as number[] : [];
        } catch { form.value.msProjectMetricHostIds = []; }
      }
      if (!Array.isArray(form.value.msProjectMetricHostIds)) {
        form.value.msProjectMetricHostIds = [];
      }
      selectedOs.value = props.project.msProjectHostOs || 'LINUX';
    } else {
      form.value = newProjectForm();
      selectedOs.value = 'LINUX';
    }
    await loadHosts(selectedOs.value);
  } finally {
    initializing = false;
  }
});

watch(selectedOs, v => {
  if (initializing) return;
  form.value.msProjectHostIds = [];
  loadHosts(v);
});

async function loadHosts(os: string) {
  try {
    hosts.value = await queryHostOptions(os);
  } catch {
    hosts.value = [];
  }
}

function fillDefaults(type: string) {
  const t = typeDefaults[type];
  if (t) {
    if (!form.value.msProjectStartScript || form.value.msProjectStartScript.startsWith('#'))
      form.value.msProjectStartScript = t.start;
    if (!form.value.msProjectStopScript || form.value.msProjectStopScript.startsWith('#'))
      form.value.msProjectStopScript = t.stop;
    if (!form.value.msProjectRestartScript || form.value.msProjectRestartScript.startsWith('#'))
      form.value.msProjectRestartScript = t.restart;
  }
}

function submit() {
  if (!form.value.msProjectName.trim()) { message.warning('项目名称不能为空'); return; }
  if (!form.value.msProjectCode.trim()) { message.warning('项目编码不能为空'); return; }
  if (!form.value.msProjectDeployDir.trim()) { message.warning('部署目录不能为空'); return; }
  if (!form.value.msProjectType) { message.warning('请选择项目类型'); return; }
  if (form.value.msProjectHostIds.length === 0) { message.warning('至少选择一台目标服务器'); return; }

  // 健康检查完整性：守护的失败阈值默认 1，配置缺失会导致探测恒失败 → 守护无限重启应用
  if (form.value.msProjectHealthEnabled && !form.value.msProjectCheckScript?.trim()) {
    if (!form.value.msProjectHealthTarget?.trim()) {
      message.warning('启用健康检查后必须填写检查目标（端口/URL/进程名），或改用自定义检测脚本');
      return;
    }
    if (!['PORT', 'HTTP', 'PROCESS'].includes(form.value.msProjectHealthType)) {
      message.warning('健康检查类型非法，仅支持 PORT/HTTP/PROCESS');
      return;
    }
  }

  // 调度间隔：后端时间轮对 <5 的值会静默回退默认值，前端先行拦截避免误配
  if (form.value.msProjectWatchdogEnabled && !inRange(form.value.msProjectWatchdogInterval, 5, 3600)) {
    message.warning('守护间隔必须在 5~3600 秒之间');
    return;
  }
  if (form.value.msProjectMetricEnabled && !inRange(form.value.msProjectMetricInterval, 5, 3600)) {
    message.warning('指标采集间隔必须在 5~3600 秒之间');
    return;
  }
  if (form.value.msProjectWatchdogMaxFail != null
    && (form.value.msProjectWatchdogMaxFail < 1 || form.value.msProjectWatchdogMaxFail > 100)) {
    message.warning('守护失败阈值必须在 1~100 之间');
    return;
  }

  // 实时日志依赖 目录 + 文件名 同时存在，只填一半属于死配置
  const hasLogDir = !!form.value.msProjectLogDir?.trim();
  const hasLogFile = !!form.value.msProjectLogFile?.trim();
  if (hasLogDir !== hasLogFile) {
    message.warning('日志目录与日志文件名必须同时填写，否则无法读取实时日志');
    return;
  }

  // 脚本安全确认：任意脚本非空时弹确认（防止未审核脚本/AI 脚本直接落库执行）
  const hasScript = [form.value.msProjectStartScript, form.value.msProjectStopScript,
    form.value.msProjectRestartScript, form.value.msProjectCheckScript]
    .some(s => s && !s.trim().startsWith('#'));
  const doSave = () => {
    loading.value = true;
    saveProject(form.value.id ?? null, {
      ...form.value,
      msProjectHostIds: JSON.stringify(form.value.msProjectHostIds),
      msProjectDeleteBefore: form.value.msProjectDeleteBefore ? 1 : 0,
      msProjectAutoExtract: form.value.msProjectAutoExtract ? 1 : 0,
      msProjectAutoStart: form.value.msProjectAutoStart ? 1 : 0,
      msProjectHealthEnabled: form.value.msProjectHealthEnabled ? 1 : 0,
      msProjectAutoRollback: form.value.msProjectAutoRollback ? 1 : 0,
      msProjectWatchdogEnabled: form.value.msProjectWatchdogEnabled ? 1 : 0,
      msProjectCheckScript: form.value.msProjectCheckScript || null,
      msProjectPreflightGate: form.value.msProjectPreflightGate ? 1 : 0,
      msProjectMetricEnabled: form.value.msProjectMetricEnabled ? 1 : 0,
      msProjectMetricHostIds: form.value.msProjectMetricHostIds.length > 0 ? JSON.stringify(form.value.msProjectMetricHostIds) : null,
    })
      .then(() => {
        message.success(isEdit.value ? '已更新' : '已创建');
        emit('update:visible', false);
        emit('saved');
      })
      .catch(e => message.error((e as Error).message))
      .finally(() => { loading.value = false; });
  };
  if (hasScript) {
    // 注意：只能用 message.confirm（= msgBox 的对象风格别名），
    // message 对象上没有 msgBox 成员，写 message.msgBox 会直接 TypeError 中断保存流程。
    message.confirm('脚本将随项目保存并可能被远程执行，请确认已审核（AI 生成的脚本请重点核对高危命令）。确定保存？', '脚本确认', '保存', '取消', 'warning')
      .then(() => doSave())
      .catch(() => {});
  } else {
    doSave();
  }
}

/** AI 生成脚本目标脚本字段映射 */
const aiScriptField: Record<string, 'msProjectStartScript' | 'msProjectStopScript' | 'msProjectRestartScript' | 'msProjectCheckScript'> = {
  START: 'msProjectStartScript',
  STOP: 'msProjectStopScript',
  RESTART: 'msProjectRestartScript',
  CHECK: 'msProjectCheckScript',
};

/** AI 生成指定类型脚本并回填对应输入框（未保存时直接传表单上下文，保存后按 id 查询） */
async function genAiScript(kind: 'START' | 'STOP' | 'RESTART' | 'CHECK') {
  aiLoading.value = true;
  try {
    const context = {
      msProjectType: form.value.msProjectType,
      msProjectHostOs: form.value.msProjectHostOs || selectedOs.value,
      msProjectDeployDir: form.value.msProjectDeployDir,
      msProjectHealthType: form.value.msProjectHealthEnabled ? form.value.msProjectHealthType : 'PROCESS',
      msProjectHealthTarget: form.value.msProjectHealthTarget,
    };
    const script = await aiGenScript(isEdit.value ? form.value.id : null, kind, context as Record<string, unknown>);
    if (script) {
      form.value[aiScriptField[kind]] = script;
      message.success(`AI 已生成${kind === 'CHECK' ? '状态检测' : kind === 'START' ? '启动' : kind === 'STOP' ? '停止' : '重启'}脚本，请确认后保存`);
    }
  } catch (e) {
    message.warning((e as Error).message || 'AI 生成失败，请检查 AI 服务配置');
  } finally {
    aiLoading.value = false;
  }
}

function newProjectForm() {
  return {
    id: null as number | null,
    msProjectName: '',
    msProjectCode: '',
    msProjectType: 'SPRINGBOOT_MONO',
    msProjectHostIds: [] as number[],
    msProjectHostOs: 'LINUX',
    msProjectDeployDir: '/opt/apps',
    msProjectStartScript: '',
    msProjectStopScript: '',
    msProjectRestartScript: '',
    msProjectLogDir: '',
    msProjectLogFile: '',
    msProjectDeleteBefore: false,
    msProjectOverwriteMode: 'OVERWRITE',
    msProjectAutoExtract: true,
    msProjectAutoStart: false,
    msProjectHealthEnabled: false,
    msProjectHealthType: 'PORT',
    msProjectHealthTarget: '',
    msProjectHealthTimeout: 30,
    msProjectAutoRollback: false,
    msProjectDeployRetry: 0,
    msProjectArchiveKeep: 0,
    msProjectWatchdogEnabled: false,
    msProjectWatchdogInterval: 30,
    msProjectWatchdogMaxFail: 1,
    msProjectCheckScript: '',
    msProjectPreflightGate: true,
    msProjectMetricEnabled: false,
    msProjectMetricInterval: 60,
    msProjectMetricHostIds: [] as number[],
    msProjectSort: 100,
    msProjectRemark: '',
  };
}
</script>

<template>
  <ReDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑项目' : '新建项目'"
    :width="720"
    confirm-text="保存"
    cancel-text="取消"
    :loading="loading"
    @confirm="submit"
    @cancel="emit('update:visible', false)"
  >
    <ReForm label-width="110px" label-position="left" class="project-form">
      <ReDivider content-position="left">基础信息</ReDivider>
      <ReFormItem label="项目名称" required>
        <ReInput v-model="form.msProjectName" placeholder="user-service" />
      </ReFormItem>
      <ReFormItem label="项目编码" required>
        <ReInput v-model="form.msProjectCode" :disabled="isEdit" placeholder="唯一标识，如 user-service" />
      </ReFormItem>
      <ReFormItem label="项目类型" required>
        <ReSelect v-model="form.msProjectType" :data="projectTypes" style="width: 100%" @change="fillDefaults" />
      </ReFormItem>

      <ReDivider content-position="left">目标服务器</ReDivider>
      <ReFormItem label="主机类型">
        <ReRadioGroup v-model="selectedOs">
          <ReRadioButton value="LINUX">Linux</ReRadioButton>
          <ReRadioButton value="WINDOWS">Windows</ReRadioButton>
        </ReRadioGroup>
      </ReFormItem>
      <ReFormItem label="选择服务器" required>
        <ReSelect
          v-model="form.msProjectHostIds"
          multiple
          filterable
          placeholder="至少选择一台同类型服务器"
          :data="hostOptions"
          style="width: 100%"
        />
      </ReFormItem>

      <ReDivider content-position="left">部署配置</ReDivider>
      <ReFormItem label="部署目录" required>
        <ReInput v-model="form.msProjectDeployDir" placeholder="/opt/apps/user-service" />
      </ReFormItem>
      <ReFormItem label="启动脚本">
        <ReInput v-model="form.msProjectStartScript" type="textarea" :rows="3" placeholder="支持 {{dir}} 占位符" />
        <ReButton size="small" style="margin-top:6px" :loading="aiLoading" @click="genAiScript('START')">AI 生成启动脚本</ReButton>
      </ReFormItem>
      <ReFormItem label="停止脚本">
        <ReInput v-model="form.msProjectStopScript" type="textarea" :rows="3" placeholder="支持 {{dir}} 占位符" />
        <ReButton size="small" style="margin-top:6px" :loading="aiLoading" @click="genAiScript('STOP')">AI 生成停止脚本</ReButton>
      </ReFormItem>
      <ReFormItem label="重启脚本">
        <ReInput v-model="form.msProjectRestartScript" type="textarea" :rows="3" placeholder="支持 {{dir}} 占位符" />
        <ReButton size="small" style="margin-top:6px" :loading="aiLoading" @click="genAiScript('RESTART')">AI 生成重启脚本</ReButton>
      </ReFormItem>

      <ReDivider content-position="left">日志配置</ReDivider>
      <ReFormItem label="日志目录">
        <ReInput v-model="form.msProjectLogDir" placeholder="/opt/apps/user-service/logs" />
      </ReFormItem>
      <ReFormItem label="日志文件">
        <ReInput v-model="form.msProjectLogFile" placeholder="app.log" />
      </ReFormItem>

      <ReDivider content-position="left">升级策略</ReDivider>
      <ReFormItem label="升级前删除旧内容">
        <ReSwitch v-model="form.msProjectDeleteBefore" />
        <span class="muted" style="margin-left:8px">开启后，部署前将清空部署目录</span>
      </ReFormItem>
      <ReFormItem label="覆盖模式">
        <ReRadioGroup v-model="form.msProjectOverwriteMode">
          <ReRadio value="OVERWRITE">直接覆盖</ReRadio>
          <ReRadio value="REPLACE">全量替换（清空后部署）</ReRadio>
        </ReRadioGroup>
      </ReFormItem>
      <ReFormItem label="自动解压">
        <ReSwitch v-model="form.msProjectAutoExtract" />
        <span class="muted" style="margin-left:8px">zip/tar.gz 上传后自动解压到部署目录</span>
      </ReFormItem>
      <ReFormItem label="部署后自动启动">
        <ReSwitch v-model="form.msProjectAutoStart" />
        <span class="muted" style="margin-left:8px">部署/回滚成功后自动执行启动脚本</span>
      </ReFormItem>

      <ReDivider content-position="left">健康检查</ReDivider>
      <ReFormItem label="启用健康检查">
        <ReSwitch v-model="form.msProjectHealthEnabled" />
        <span class="muted" style="margin-left:8px">启动后探测服务是否就绪</span>
      </ReFormItem>
      <ReFormItem label="检查类型" v-if="form.msProjectHealthEnabled">
        <ReSelect v-model="form.msProjectHealthType" :data="healthTypes" style="width: 100%" />
      </ReFormItem>
      <ReFormItem label="检查目标" v-if="form.msProjectHealthEnabled">
        <ReInput v-model="form.msProjectHealthTarget" :placeholder="healthTargetPlaceholder" />
      </ReFormItem>
      <ReFormItem label="检查超时(s)" v-if="form.msProjectHealthEnabled">
        <ReInputNumber v-model="form.msProjectHealthTimeout" :min="5" :max="300" />
      </ReFormItem>

      <ReDivider content-position="left">故障自愈</ReDivider>
      <ReFormItem label="失败自动回滚">
        <ReSwitch v-model="form.msProjectAutoRollback" />
        <span class="muted" style="margin-left:8px">部署失败自动回滚到上一版本</span>
      </ReFormItem>
      <ReFormItem label="单台重试次数">
        <ReInputNumber v-model="form.msProjectDeployRetry" :min="0" :max="5" />
        <span class="muted" style="margin-left:8px">单台部署失败自动重试</span>
      </ReFormItem>
      <ReFormItem label="归档保留数">
        <ReInputNumber v-model="form.msProjectArchiveKeep" :min="0" :max="50" />
        <span class="muted" style="margin-left:8px">0=不清理，超出自动删除旧版本包</span>
      </ReFormItem>

      <ReDivider content-position="left">部署门禁</ReDivider>
      <ReFormItem label="部署前置门禁">
        <ReSwitch v-model="form.msProjectPreflightGate" />
        <span class="muted" style="margin-left:8px">部署前校验目标主机在线状态与延迟，不可达主机直接拦截（区分网络故障 vs 部署失败）</span>
      </ReFormItem>

      <ReDivider content-position="left">指标采集</ReDivider>
      <ReFormItem label="启用指标采集">
        <ReSwitch v-model="form.msProjectMetricEnabled" />
        <span class="muted" style="margin-left:8px">SSH 轮询采集进程内存/CPU、端口存活、HTTP 健康码（需先配健康检查目标）</span>
      </ReFormItem>
      <ReFormItem label="采集目标主机" v-if="form.msProjectMetricEnabled">
        <ReSelect
          v-model="form.msProjectMetricHostIds"
          multiple
          filterable
          placeholder="为空时采集全部绑定主机"
          :data="hostOptions"
          style="width: 100%"
        />
      </ReFormItem>
      <ReFormItem label="采集间隔(s)" v-if="form.msProjectMetricEnabled">
        <ReInputNumber v-model="form.msProjectMetricInterval" :min="5" :max="3600" />
        <span class="muted" style="margin-left:8px">每个项目独立设置，时间轮统一调度</span>
      </ReFormItem>

      <ReDivider content-position="left">守护进程</ReDivider>
      <ReFormItem label="启用守护">
        <ReSwitch v-model="form.msProjectWatchdogEnabled" />
        <span class="muted" style="margin-left:8px">持续存活检测，挂了自动拉起（SSH 轮询，无需 Agent）</span>
      </ReFormItem>
      <template v-if="form.msProjectWatchdogEnabled">
        <ReFormItem label="检测间隔(s)">
          <ReInputNumber v-model="form.msProjectWatchdogInterval" :min="5" :max="3600" />
          <span class="muted" style="margin-left:8px">每个项目独立设置，时间轮统一调度</span>
        </ReFormItem>
        <ReFormItem label="失败阈值">
          <ReInputNumber v-model="form.msProjectWatchdogMaxFail" :min="1" :max="10" />
          <span class="muted" style="margin-left:8px">连续 N 次不健康才自动重启，避免误杀</span>
        </ReFormItem>
        <ReFormItem label="状态检测脚本">
          <ReInput v-model="form.msProjectCheckScript" type="textarea" :rows="3"
            placeholder="exit 0=健康；为空时回退健康检查类型探测，可 AI 生成" />
          <ReButton size="small" style="margin-top:6px" :loading="aiLoading" @click="genAiScript('CHECK')">AI 生成检测脚本</ReButton>
        </ReFormItem>
      </template>

      <ReDivider content-position="left">其他</ReDivider>
      <ReFormItem label="排序">
        <ReInputNumber v-model="form.msProjectSort" :min="0" :max="9999" />
      </ReFormItem>
      <ReFormItem label="备注">
        <ReInput v-model="form.msProjectRemark" type="textarea" :rows="2" />
      </ReFormItem>
    </ReForm>
  </ReDialog>
</template>

<style scoped>
.muted { color: var(--text-tertiary); font-size: 12px; }
</style>
