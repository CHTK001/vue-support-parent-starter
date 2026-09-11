<script setup lang="ts">
/**
 * 实时日志面板（轮询 tail 增量）
 * 组件约定：全量使用 Re 组件体系。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { tailProjectLog } from '../api';

const props = defineProps<{
  visible: boolean;
  projectId: number;
  projectName: string;
  hostOptions: Array<{ label: string; value: number }>;
}>();
const emit = defineEmits<{ 'update:visible': [v: boolean] }>();

const selectedHost = ref<number | null>(null);
const content = ref('');
const cursor = ref<number | null>(null);
const loading = ref(false);
const autoScroll = ref(true);
const paused = ref(false);
const logRef = ref<HTMLDivElement | null>(null);

let timer: number | undefined;

watch(() => props.visible, v => {
  if (v) {
    selectedHost.value = props.hostOptions[0]?.value ?? null;
    reset();
    start();
  } else {
    stop();
  }
});

watch(selectedHost, () => {
  reset();
});

onMounted(() => { if (props.visible) start(); });
onBeforeUnmount(stop);

function reset() {
  content.value = '';
  cursor.value = null;
  paused.value = false;
}

function start() {
  stop();
  if (!props.visible || !selectedHost.value) return;
  timer = window.setInterval(poll, 1500);
  poll();
}

function stop() {
  if (timer != null) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

async function poll() {
  if (paused.value || !selectedHost.value) return;
  try {
    loading.value = true;
    const data = await tailProjectLog(props.projectId, selectedHost.value, cursor.value ?? undefined);
    if (data.content) {
      content.value += data.content;
      if (content.value.length > 500000) {
        content.value = content.value.slice(-500000);
      }
      cursor.value = data.cursor;
      if (autoScroll.value) {
        scrollToBottom();
      }
    }
  } catch (e) {
    // 日志未就绪时静默，避免刷屏
  } finally {
    loading.value = false;
  }
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight;
    }
  });
}

function clearLog() {
  content.value = '';
  cursor.value = null;
}

function togglePause() {
  paused.value = !paused.value;
}
</script>

<template>
  <ReDrawer
    v-model="props.visible"
    :title="`${props.projectName} - 实时日志`"
    :size="760"
  >
    <div class="live-log">
      <div class="log-toolbar">
        <ReSelect
          v-model="selectedHost"
          placeholder="选择主机"
          :data="hostOptions"
          style="width:220px"
        />
        <ReButton layout="square" size="small" icon="Refresh" @click="poll">刷新</ReButton>
        <ReButton layout="square" size="small" :icon="paused ? 'VideoPlay' : 'VideoPause'" @click="togglePause">
          {{ paused ? '继续' : '暂停' }}
        </ReButton>
        <ReButton layout="square" size="small" icon="Delete" @click="clearLog">清空</ReButton>
        <ReSwitch v-model="autoScroll" />
        <span class="dim" style="font-size:12px">自动滚动</span>
        <div class="spacer" />
        <span class="dim" style="font-size:12px">{{ loading ? '读取中...' : '每 1.5s 增量拉取' }}</span>
      </div>

      <div
        ref="logRef"
        class="log-view"
        v-html="content || '<span class=\'log-placeholder\'>暂无日志输出，确认日志目录配置后等待应用写入...</span>'"
      />
    </div>
  </ReDrawer>
</template>

<style scoped>
.live-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
}
.log-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.log-view {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-page) 70%, #000 12%);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-placeholder { color: var(--text-tertiary); }
</style>