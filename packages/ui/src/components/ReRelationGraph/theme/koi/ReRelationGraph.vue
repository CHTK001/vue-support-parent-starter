<script setup lang="ts">
/**
 * ReRelationGraph · koi 主题
 *
 * <p>与 default 主题共用同一个 G6 核心；差异只体现在类名与主题变量上，
 * 保证「换主题不改行为」。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { ref } from "vue";
import G6Graph from "../../internals/G6Graph.vue";
import { forwardCore, type CoreHandle } from "../../internals/exposeCore";

defineOptions({ name: "ReRelationGraph", inheritAttrs: false });

const core = ref<CoreHandle | null>(null);

defineExpose(forwardCore(core));
</script>

<template>
  <G6Graph ref="core" v-bind="$attrs" class="rrg-theme-koi">
    <template v-if="$slots['node-content']" #node-content="scope">
      <slot name="node-content" v-bind="scope" />
    </template>
    <template v-if="$slots['toolbar-extra']" #toolbar-extra="scope">
      <slot name="toolbar-extra" v-bind="scope" />
    </template>
    <template v-if="$slots['node-tooltip']" #node-tooltip="scope">
      <slot name="node-tooltip" v-bind="scope" />
    </template>
    <template v-if="$slots['edge-tooltip']" #edge-tooltip="scope">
      <slot name="edge-tooltip" v-bind="scope" />
    </template>
    <template v-if="$slots['context-menu']" #context-menu="scope">
      <slot name="context-menu" v-bind="scope" />
    </template>
  </G6Graph>
</template>
