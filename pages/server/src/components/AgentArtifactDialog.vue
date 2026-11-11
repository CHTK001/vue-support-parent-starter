<template>
  <ReMaskDialog v-model="visible" :title="`获取 ${kindLabel} 构件`" width="620px" :z-index="3200">
    <div class="aad">
      <div class="aad-tip">
        目标主机上还没有 agent 包时用这里：平台负责<b>取包</b>（远程下载或读取本机路径），
        再经 SFTP <b>投放到目标主机</b>，投放成功后把远端路径回填到表单。下载发生在平台所在机器，不是目标主机。
      </div>

      <div v-if="!projectId" class="aad-block">
        <span class="aad-warn">项目还没保存，无法确定目标主机。请先保存项目，再获取构件。</span>
      </div>

      <template v-else>
        <div class="aad-row">
          <span class="aad-label">构件类型</span>
          <span class="aad-kind">{{ kindLabel }}</span>
        </div>

        <div class="aad-row">
          <span class="aad-label">来源</span>
          <el-radio-group v-model="source" size="small">
            <el-radio-button value="url">远程下载</el-radio-button>
            <el-radio-button value="local">平台本机路径</el-radio-button>
          </el-radio-group>
        </div>

        <label class="aad-field">
          <span class="aad-label">{{ source === 'url' ? '下载地址' : '平台本机路径' }}</span>
          <ReInput
            v-model="address"
            :placeholder="source === 'url' ? preset.url : preset.local"
            style="width:100%"
          />
        </label>

        <div class="aad-field-note">
          {{ source === 'url'
            ? '支持 jar / zip / tar.gz / tgz；发行包会先解压再定位 agent jar。平台需能访问该地址。'
            : '填平台服务器上的 jar 文件或解压后的 agent 目录（SkyWalking 建议给整个 agent 目录，config/plugins 一并投放）。' }}
        </div>

        <div class="aad-grid">
          <label class="aad-field">
            <span class="aad-label">目标目录（目标主机）</span>
            <ReInput v-model="targetDir" placeholder="默认放到「项目路径/lib/构件类型」" style="width:100%" />
          </label>
          <label v-if="source === 'url'" class="aad-field">
            <span class="aad-label">远端文件名（可选）</span>
            <ReInput v-model="fileName" placeholder="默认沿用源文件名" style="width:100%" />
          </label>
        </div>

        <div class="aad-actions">
          <ReButton type="primary" :loading="submitting" :disabled="!address.trim()" @click="submit">
            下载并投放到目标主机
          </ReButton>
          <ReButton :disabled="submitting" @click="visible = false">取消</ReButton>
          <span class="aad-hint" v-if="!result">同名文件会被覆盖</span>
        </div>

        <div v-if="result" class="aad-result">
          <div class="aad-result-head">
            <el-tag size="small" type="success" effect="dark">已投放</el-tag>
            <span class="aad-result-files">{{ result.files }} 个文件 · {{ formatBytes(result.bytes) }}</span>
          </div>
          <div class="aad-result-path">{{ result.remotePath }}</div>
          <div class="aad-result-meta">
            <span>{{ result.directory ? '整目录投放' : '单文件投放' }}</span>
            <span>·</span>
            <span>来源 {{ result.source === 'local' ? '平台本机' : '远程下载' }}</span>
            <span>·</span>
            <span>目标主机 {{ result.hostName }}</span>
          </div>
          <div class="aad-result-local">本地缓存：{{ result.localPath }}</div>
          <div class="aad-result-actions">
            <ReButton type="primary" @click="useResult">使用此路径</ReButton>
            <ReButton @click="visible = false">关闭</ReButton>
          </div>
        </div>
      </template>
    </div>
  </ReMaskDialog>
</template>

<script setup lang="ts">
/**
 * AgentArtifactDialog —— 平台侧获取并投放 Agent 构件
 *
 * 解决「目标主机没有 arthas-boot.jar / skywalking-agent.jar」的前置条件：
 * 远程下载（平台机器出网）或读取平台本机路径，缓存后经 SFTP 投放到项目目标目录。
 */
import { computed, ref, watch } from 'vue';
import { message } from '@repo/core';
import { http, unwrapResult } from '@repo/utils';
import ReMaskDialog from './ReMaskDialog.vue';

type AgentKind = 'arthas' | 'skywalking' | 'platform';

interface PrepareResult {
  remotePath: string;
  fileName: string;
  files: number;
  bytes: number;
  directory: boolean;
  source: string;
  hostName: string;
  localPath: string;
}

const props = defineProps<{
  modelValue: boolean;
  projectId: number | null;
  kind: AgentKind;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'done', remotePath: string, kind: AgentKind): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const source = ref<string>('url');
const address = ref('');
const targetDir = ref('');
const fileName = ref('');
const submitting = ref(false);
const result = ref<PrepareResult | null>(null);

const PRESETS: Record<AgentKind, { label: string; url: string; local: string; targetDir: string }> = {
  arthas: {
    label: 'Arthas',
    url: 'https://arthas.aliyun.com/arthas-boot.jar',
    local: '如 D:/tools/arthas-bin（目录）或 /opt/arthas/arthas-boot.jar',
    targetDir: '',
  },
  skywalking: {
    label: 'SkyWalking Agent',
    url: 'https://dlcdn.apache.org/skywalking/java-agent/9.8.0/apache-skywalking-java-agent-9.8.0.tgz',
    local: '如 /opt/apache-skywalking-java-agent-9.4.0/agent（建议整目录）',
    targetDir: '',
  },
  platform: {
    label: '平台 APM Agent',
    url: '平台 APM agent jar 的下载地址',
    local: '如 /opt/agent/apm-agent.jar',
    targetDir: '',
  },
};

const preset = computed(() => PRESETS[props.kind] ?? PRESETS.arthas);
const kindLabel = computed(() => preset.value.label);

watch(
  () => [props.modelValue, props.kind] as const,
  ([open]) => {
    if (!open) return;
    result.value = null;
    fileName.value = '';
    targetDir.value = '';
    address.value = '';
    // 记住上次的来源与地址，重复给同一类构件投放时不用重贴
    try {
      const saved = JSON.parse(localStorage.getItem(`agent-artifact:${props.kind}`) || 'null');
      if (saved && typeof saved.address === 'string') {
        source.value = saved.source === 'local' ? 'local' : 'url';
        address.value = saved.address;
      }
    } catch {
      // 忽略损坏的本地缓存
    }
  },
);

function rememberChoice() {
  try {
    localStorage.setItem(
      `agent-artifact:${props.kind}`,
      JSON.stringify({ source: source.value, address: address.value.trim() }),
    );
  } catch {
    // 存储不可用时忽略
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function submit() {
  if (!props.projectId) {
    message.error('项目还没保存，无法投放构件');
    return;
  }
  if (!address.value.trim()) {
    message.error(source.value === 'url' ? '请填写下载地址' : '请填写平台本机路径');
    return;
  }
  submitting.value = true;
  try {
    const query: Record<string, string> = {
      kind: props.kind,
      source: source.value,
      value: address.value.trim(),
    };
    if (targetDir.value.trim()) query.targetDir = targetDir.value.trim();
    if (fileName.value.trim()) query.fileName = fileName.value.trim();
    const res = await http().post(`/ms/server/agent/project/${props.projectId}/prepare`).query(query);
    const data = unwrapResult<PrepareResult>(res);
    if (!data?.remotePath) {
      message.error('投放结果缺少远端路径');
      return;
    }
    result.value = data;
    rememberChoice();
    message.success(`已投放到 ${data.remotePath}`);
  } catch (e: any) {
    message.error(e?.message || '获取 Agent 构件失败');
  } finally {
    submitting.value = false;
  }
}

function useResult() {
  if (!result.value) return;
  emit('done', result.value.remotePath, props.kind);
  visible.value = false;
}
</script>

<style scoped>
.aad {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
}

.aad-tip {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-layout, #f6f7f9);
  color: var(--text-2, #4b5563);
  line-height: 1.7;
}

.aad-block {
  padding: 12px;
}

.aad-warn {
  color: var(--warning, #b45309);
}

.aad-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.aad-label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-2, #4b5563);
  font-size: 12px;
}

.aad-row .aad-label {
  margin-bottom: 0;
  min-width: 56px;
  font-size: 13px;
}

.aad-kind {
  font-weight: 600;
}

.aad-field {
  display: block;
}

.aad-field-note {
  margin-top: -4px;
  color: var(--text-3, #9ca3af);
  font-size: 12px;
  line-height: 1.6;
}

.aad-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.aad-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aad-hint {
  color: var(--text-3, #9ca3af);
  font-size: 12px;
}

.aad-result {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-card, #fff);
}

.aad-result-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.aad-result-files {
  color: var(--text-2, #4b5563);
  font-size: 12px;
}

.aad-result-path {
  font-family: var(--font-mono, 'Consolas', monospace);
  font-size: 13px;
  word-break: break-all;
}

.aad-result-meta,
.aad-result-local {
  color: var(--text-3, #9ca3af);
  font-size: 12px;
  word-break: break-all;
}

.aad-result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.aad-result-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
