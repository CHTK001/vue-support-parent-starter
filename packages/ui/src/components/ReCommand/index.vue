<template>
  <div class="re-command" :class="{ 'is-disabled': disabled }">
    <div class="rc-toolbar">
      <span class="rc-label">
        <ReIcon :name="kindIcon" class="rc-label-icon" />
        {{ label || fallbackLabel }}
      </span>
      <span class="rc-spacer"></span>
      <div class="rc-tools">
        <!-- 内置模板 -->
        <el-popover v-model:visible="tplOpen" :width="330" placement="bottom-end" trigger="click">
          <template #reference>
            <ReButton icon="Files" layout="square" title="内置模板" />
          </template>
          <div class="rc-tpl-pop">
            <div class="rc-tpl-head">
              内置模板 · {{ os === 'windows' ? 'PowerShell' : 'bash' }}
              <span v-if="!projectType" class="rc-tpl-sub">未选类型，仅通用模板</span>
            </div>
            <ReEmpty v-if="!tplList.length" description="当前条件暂无模板" :image-size="56" style="padding: 20px 0" />
            <div v-else class="rc-tpl-list">
              <div v-for="t in tplList" :key="t.id" class="rc-tpl-item" @click="applyTpl(t)">
                <div class="rc-tpl-name">{{ t.name }}</div>
                <div class="rc-tpl-desc">{{ t.desc }}</div>
              </div>
            </div>
          </div>
        </el-popover>

        <!-- 占位符 / 内置变量 -->
        <el-popover :width="350" placement="bottom-end" trigger="click">
          <template #reference>
            <ReButton icon="Histogram" layout="square" title="插入占位符 / 内置变量" />
          </template>
          <div class="rc-tok-pop">
            <div class="rc-tok-head">占位符 · 点击插入到光标处</div>
            <div v-for="tk in TOKENS" :key="tk.t" class="rc-tok-item" @click="insertToken(tk.t)">
              <code>{{ tk.t }}</code>
              <span>{{ tk.d }}</span>
            </div>
          </div>
        </el-popover>

        <!-- AI 生成（无可用模型时整体隐藏） -->
        <template v-if="ai && modelList.length">
          <ReSelect v-model="aiModel" class="rc-model" :style="{ width: '150px' }" placeholder="选择模型" >
            <ReOption v-for="m in modelList" :key="m.id" :label="m.name" :value="m.code || m.name" />
          </ReSelect>
          <ReButton
            :icon="generating ? 'Loading' : 'ChatDotSquare'"
            :loading="generating"
            layout="square"

            :title="generating ? '停止生成' : 'AI 生成'"
            @click="aiGenerate"
          />
        </template>

        <!-- 复制 / 清空 / 放大 -->
        <ReButton icon="CopyDocument" layout="square" title="复制" @click="copy" />
        <ReButton icon="Delete" layout="square" title="清空" @click="clearCmd" />
        <ReButton v-if="!noExpand" icon="FullScreen" layout="square" title="放大编辑" @click="expandOpen = true" />
      </div>
    </div>
    <textarea
      ref="taRef"
      class="rc-editor"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      spellcheck="false"
      :value="modelValue"
      @input="onInput"
    ></textarea>

    <!-- 放大编辑弹窗 -->
    <ReDialog
      v-if="!noExpand"
      v-model="expandOpen"
      :title="label || fallbackLabel"
      width="92%"
      append-to-body
      :close-on-click-modal="false"
    >
      <ReCommand
        :model-value="modelValue"
        :os="os"
        :project-type="projectType"
        :script-kind="scriptKind"
        :context="context"
        :label="label"
        :rows="18"
        :ai="ai"
        :capability="capability"
        no-expand
        @update:model-value="(v: string) => emit('update:modelValue', v)"
      />
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { http, unwrapResult } from '@repo/utils';
import {
  fillTemplate,
  listTemplates,
  type CommandTemplate,
  type OsKind,
} from './templates';

interface AiModel {
  id: number;
  name: string;
  code: string;
  capabilities?: string[];
}

interface CmdFrame {
  type: string;
  shell?: string;
  content?: string;
  full?: string;
  message?: string;
}

interface CommandContext {
  entry?: string;
  log?: string;
  path?: string;
  appName?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    os?: OsKind;
    projectType?: string;
    scriptKind?: 'start' | 'stop' | 'restart' | 'status';
    context?: CommandContext;
    label?: string;
    rows?: number;
    placeholder?: string;
    ai?: boolean;
    disabled?: boolean;
    capability?: string;
    noExpand?: boolean;
  }>(),
  {
    modelValue: '',
    os: 'linux',
    projectType: '',
    scriptKind: 'start',
    context: () => ({}),
    rows: 5,
    ai: true,
    disabled: false,
    capability: 'chat',
    noExpand: false,
    placeholder: '请输入命令，或使用模板 / AI 生成',
  },
);

const emit = defineEmits<{
  'update:modelValue': [string];
}>();

const fallbackLabel = computed(() => (os.value === 'windows' ? 'PowerShell 命令' : 'bash 命令'));

const kindIcon = computed(
  () =>
    ({ start: 'VideoPlay', stop: 'VideoPause', restart: 'RefreshRight', status: 'Aim' } as const)[
      props.scriptKind
    ],
);

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}

function setValue(v: string) {
  emit('update:modelValue', v);
}

// ==================== 占位符 / 放大编辑 ====================

const expandOpen = ref(false);
const taRef = ref<HTMLTextAreaElement | null>(null);

const TOKENS: { t: string; d: string }[] = [
  { t: '__JVMARGS__', d: '变量设置中的 JVM 参数（自动放在 -jar 之前）' },
  { t: '__ARGS__', d: '变量设置中的应用 / 命令参数' },
  { t: '__ENTRY__', d: '主入口名称（套用模板时替换）' },
  { t: '__PATH__', d: '项目路径（套用模板时替换）' },
  { t: '__LOG__', d: '日志文件路径（套用模板时替换）' },
  { t: '__APPNAME__', d: '项目 / 应用名称（套用模板时替换）' },
];

function insertToken(tk: string) {
  const ta = taRef.value;
  const s = props.modelValue || '';
  if (!ta) {
    setValue(s + tk);
    return;
  }
  const a = ta.selectionStart ?? s.length;
  const b = ta.selectionEnd ?? s.length;
  const next = s.slice(0, a) + tk + s.slice(b);
  emit('update:modelValue', next);
  nextTick(() => {
    ta.focus();
    const p = a + tk.length;
    ta.setSelectionRange(p, p);
  });
}

// ==================== 内置模板 ====================

const tplOpen = ref(false);
const tplList = computed(() => listTemplates(props.os, props.projectType));

function applyTpl(t: CommandTemplate) {
  try {
    const filled = fillTemplate(t, {
      entry: props.context.entry,
      log: props.context.log,
      path: props.context.path,
      appName: props.context.appName,
    });
    setValue(filled[props.scriptKind]);
    tplOpen.value = false;
    ElMessage.success('已套用内置模板');
  } catch (e: any) {
    ElMessage.error(e?.message || '模板生成失败');
  }
}

// ==================== 复制 / 清空 ====================

async function copy() {
  const text = props.modelValue || '';
  if (!text) {
    ElMessage.warning('暂无内容可复制');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败');
  }
}

function clearCmd() {
  if (props.modelValue) {
    setValue('');
  }
}

// ==================== 模型列表 ====================

const modelList = ref<AiModel[]>([]);
const aiModel = ref('');

async function loadModels() {
  if (!props.ai) {
    return;
  }
  try {
    const res = await http()
      .get('/v2/command/models')
      .query({ capability: props.capability });
    const list = unwrapResult<AiModel[]>(res) || [];
    modelList.value = list;
    const stillValid = list.some((m) => (m.code || m.name) === aiModel.value);
    if (!stillValid) {
      aiModel.value = list.length ? list[0].code || list[0].name : '';
    }
  } catch {
    modelList.value = [];
    aiModel.value = '';
  }
}

watch(() => props.capability, loadModels);

// ==================== AI 生成 ====================

const generating = ref(false);
let client: { close: () => void } | null = null;

const requirementText = computed(() => {
  const shell = os.value === 'windows' ? 'PowerShell' : 'bash';
  const entry = props.context.entry ? `主入口「${props.context.entry}」` : '';
  const path = props.context.path ? `项目路径「${props.context.path}」` : '';
  const target = [entry, path].filter(Boolean).join('，');
  const suffix = target ? `，${target}` : '';
  switch (props.scriptKind) {
    case 'start':
      return `请生成${shell}「启动」命令${suffix}：后台启动应用、日志重定向到日志文件、写入 pid，命令可重复执行。`;
    case 'stop':
      return `请生成${shell}「停止」命令${entry ? `，针对${entry}` : ''}：优先根据 pid 文件停止，无 pid 时按进程名 / 命令行匹配停止，避免误杀其它进程。`;
    case 'status':
      return `请生成${shell}「状态检测」命令${entry ? `，针对${entry}` : ''}：进程存在则输出 running，否则输出 stopped，只输出这一个词。`;
    default:
      return `请生成${shell}「重启」命令${suffix}：先优雅停止再启动，pid 与服务名保持一致。`;
  }
});

const os = computed(() => props.os);

function finish() {
  client = null;
  generating.value = false;
}

function aiGenerate() {
  if (generating.value) {
    client?.close();
    finish();
    return;
  }
  if (!modelList.value.length) {
    ElMessage.warning('暂无可用模型，请先在 AI 设置中配置并启用模型');
    return;
  }
  generating.value = true;
  const payload = {
    os: props.os,
    projectType: props.projectType,
    mainEntry: props.context.entry || '',
    projectPath: props.context.path || '',
    logPath: props.context.log || '',
    appName: props.context.appName || '',
    model: aiModel.value,
    multi: false,
    requirement: requirementText.value,
  };
  let acc = '';
  try {
    client = http()
      .post('/v2/command/generate')
      .data(payload)
      .sse<CmdFrame>({
        reconnect: false,
        onMessage: (e) => {
          const ev = e.data;
          if (!ev || typeof ev !== 'object') {
            return;
          }
          if (ev.type === 'chunk' && ev.content) {
            acc += ev.content;
            setValue(acc);
          } else if (ev.type === 'done') {
            if (ev.full) {
              setValue(ev.full);
            }
            finish();
            ElMessage.success('AI 已生成命令，请确认后使用');
          } else if (ev.type === 'error') {
            ElMessage.error(ev.message || '生成失败');
            finish();
          }
        },
        onError: () => {
          ElMessage.error('AI 连接失败');
          finish();
        },
        onClose: () => finish(),
      });
  } catch {
    ElMessage.error('AI 调用失败');
    finish();
  }
}

onBeforeUnmount(() => {
  client?.close();
});

loadModels();
</script>

<style scoped>
.re-command {
  width: 100%;
}
.rc-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.rc-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.rc-label-icon {
  font-size: 14px;
  color: var(--el-color-primary);
}
.rc-spacer {
  flex: 1;
}
.rc-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rc-model {
  width: 150px;
}
.rc-editor {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, "Courier New",
    monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-light);
  background-image: none;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rc-editor::placeholder {
  color: var(--el-text-color-placeholder);
}
.rc-editor:focus {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
.rc-editor:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.is-disabled .rc-tools {
  opacity: 0.6;
}
.rc-tpl-head {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.rc-tpl-sub {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.rc-tpl-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}
.rc-tpl-item {
  padding: 9px 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}
.rc-tpl-item:hover {
  border-color: var(--el-color-primary-light-5);
  background-color: var(--el-color-primary-light-9);
}
.rc-tpl-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rc-tpl-desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.rc-tok-head {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.rc-tok-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 9px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.rc-tok-item:hover {
  background: var(--el-color-primary-light-9);
}
.rc-tok-item code {
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  white-space: nowrap;
}
.rc-tok-item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
