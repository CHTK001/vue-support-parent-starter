<script setup lang="ts">
import { computed } from 'vue';
import { Document } from '@element-plus/icons-vue';

defineProps<{ node: any; palette: any[] }>();
</script>

<template>
  <div class="spider-node" :class="node.class">
    <div class="node-title">
      <el-icon>
        <component :is="palette.find((p: any) => p.label === node.data.label)?.icon ?? Document" />
      </el-icon>
      {{ node.data.label }}
    </div>
    <div class="node-params">
      <span v-for="(v, k) in node.data.params" :key="k" class="param-tag">
        {{ k }}: {{ v }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.spider-node {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  min-width: 140px;
}
.spider-node.is-source {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.node-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.node-params {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.param-tag {
  font-size: 11px;
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
}
</style>