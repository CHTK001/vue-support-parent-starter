<template>
  <div v-if="debugMode" class="debug-viewer">
    <div class="debug-viewer__head" @click="expanded = !expanded">
      <el-icon :class="['debug-viewer__arrow', { 'debug-viewer__arrow--open': expanded }]" :size="12"><ArrowDown /></el-icon>
      <span class="debug-viewer__label">{{ label }}</span>
      <button type="button" class="debug-viewer__copy" title="复制 JSON" @click.stop="copyJson">复制</button>
    </div>
    <pre v-show="expanded" class="debug-viewer__body">{{ jsonStr }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown } from "@element-plus/icons-vue";
import { computed, inject, ref } from "vue";

const props = defineProps<{
  label: string;
  data: unknown;
}>();

const debugMode = inject("debugMode", ref(false));
const expanded = ref(false);

const jsonStr = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2);
  } catch {
    return String(props.data);
  }
});

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonStr.value);
  } catch { /* ignore */ }
}
</script>

<style scoped>
.debug-viewer {
  margin-top: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  background: rgba(0,0,0,0.2);
  overflow: hidden;
}
.debug-viewer__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.debug-viewer__arrow {
  transition: transform 0.2s;
  flex-shrink: 0;
}
.debug-viewer__arrow--open {
  transform: rotate(90deg);
}
.debug-viewer__label {
  flex: 1;
  font-weight: 600;
  color: var(--el-color-info);
}
.debug-viewer__copy {
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(34,211,238,0.2);
  background: transparent;
  color: var(--el-color-info);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.debug-viewer__copy:hover {
  background: rgba(34,211,238,0.1);
}
.debug-viewer__body {
  margin: 0;
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
  white-space: pre;
  tab-size: 2;
}
</style>
