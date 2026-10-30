<script setup lang="ts">
/**
 * 递归分栏布局（内联自 reactive-layout，MIT）。
 *
 * <p>`split` 节点按 `sizes` 百分比排布子节点，两个子节点之间插一条分隔条；
 * `panel` 节点交给 LayoutPanel 渲染。拖动分隔条只调整相邻两项，并保证每项
 * 不小于 5%，避免拖出「看不见但关不掉」的面板。</p>
 */
import { ref, inject } from 'vue';
import type { LayoutNode, SplitNode } from './useLayout';
import ResizeHandle from './ResizeHandle.vue';
import LayoutPanel from './LayoutPanel.vue';

const props = defineProps<{
  node: LayoutNode;
}>();

const updateSizesForSplit = inject<(split: SplitNode, sizes: number[]) => void>('updateSizesForSplit')!;

const containerEl = ref<HTMLElement | null>(null);

function onResize(split: SplitNode, handleIndex: number, delta: number) {
  if (!containerEl.value) return;
  const container = containerEl.value;
  const totalSize = split.direction === 'horizontal' ? container.offsetWidth : container.offsetHeight;
  if (totalSize === 0) return;

  const deltaPercent = (delta / totalSize) * 100;
  const newSizes = [...split.sizes];
  const minSize = 5;

  newSizes[handleIndex] += deltaPercent;
  newSizes[handleIndex + 1] -= deltaPercent;

  if (newSizes[handleIndex] < minSize) {
    newSizes[handleIndex + 1] -= minSize - newSizes[handleIndex];
    newSizes[handleIndex] = minSize;
  }
  if (newSizes[handleIndex + 1] < minSize) {
    newSizes[handleIndex] -= minSize - newSizes[handleIndex + 1];
    newSizes[handleIndex + 1] = minSize;
  }

  updateSizesForSplit(split, newSizes);
}

function nodeKey(node: LayoutNode): string {
  return node.type === 'panel' ? node.id : `split-${node.direction}-${node.children.map(nodeKey).join('-')}`;
}
</script>

<template>
  <LayoutPanel v-if="node.type === 'panel'" :panel="node" />
  <div v-else ref="containerEl" class="split-container" :class="node.direction">
    <template v-for="(child, i) in node.children" :key="nodeKey(child)">
      <ResizeHandle
        v-if="i > 0"
        :direction="node.direction"
        @resize="(delta: number) => onResize(node as SplitNode, i - 1, delta)"
      />
      <div
        class="split-pane"
        :style="{
          flexBasis: node.sizes[i] + '%',
          flexGrow: 0,
          flexShrink: 0,
        }"
      >
        <SplitLayout :node="child" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.split-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.split-container.horizontal {
  flex-direction: row;
}
.split-container.vertical {
  flex-direction: column;
}
.split-pane {
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}
</style>
