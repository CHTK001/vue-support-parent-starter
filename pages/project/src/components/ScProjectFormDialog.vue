<script setup lang="ts">
/**
 * 项目表单弹窗（新建/编辑）
 * 含基础信息、目标服务器、部署目录、启停脚本、升级策略全部字段。
 * 组件约定：全量使用 Re 组件体系（ReButton/ReInput/ReSelect/ReRadioGroup/ReSwitch...）。
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import { queryHostOptions, saveProject } from '../api';

interface HostOption {
  id: number;
  name: string;
  address: string;
  osType: string;
}

const props = defineProps<{ visible: boolean; project: any | null }>();
const emit = defineEmits<{ 'update:visible': [v: boolean]; saved: [] }>();

const loading = ref(false);
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

watch(() => props.visible, async v => {
  if (!v) return;
  initializing = true;
  try {
    if (props.project) {
      form.value = { ...newProjectForm(), ...props.project };
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
  loading.value = true;
  saveProject(form.value.id ?? null, {
    ...form.value,
    msProjectHostIds: JSON.stringify(form.value.msProjectHostIds),
    msProjectDeleteBefore: form.value.msProjectDeleteBefore ? 1 : 0,
    msProjectAutoExtract: form.value.msProjectAutoExtract ? 1 : 0,
    msProjectAutoStart: form.value.msProjectAutoStart ? 1 : 0,
    msProjectHealthEnabled: form.value.msProjectHealthEnabled ? 1 : 0,
    msProjectAutoRollback: form.value.msProjectAutoRollback ? 1 : 0,
  })
    .then(() => {
      message.success(isEdit.value ? '已更新' : '已创建');
      emit('update:visible', false);
      emit('saved');
    })
    .catch(e => message.error((e as Error).message))
    .finally(() => { loading.value = false; });
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
    msProjectSort: 100,
    msProjectRemark: '',
  };
}
</script>

<template>
  <ReDialog
    v-model="props.visible"
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
      </ReFormItem>
      <ReFormItem label="停止脚本">
        <ReInput v-model="form.msProjectStopScript" type="textarea" :rows="3" placeholder="支持 {{dir}} 占位符" />
      </ReFormItem>
      <ReFormItem label="重启脚本">
        <ReInput v-model="form.msProjectRestartScript" type="textarea" :rows="3" placeholder="支持 {{dir}} 占位符" />
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
