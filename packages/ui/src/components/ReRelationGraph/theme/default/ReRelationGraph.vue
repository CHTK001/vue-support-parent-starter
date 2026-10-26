<script setup lang="ts">
/**
 * ReRelationGraph · default 主题
 *
 * <p>主题层只做两件事：给出主题标识类名、把 props / 事件 / 插槽原样透传给 G6 核心。
 * 外观差异一律走 CSS 变量，不在模板里分叉逻辑。</p>
 *
 * <p>实例能力（fitView / select / addNode / shortestPath …）由核心 {@code G6Graph}
 * 提供，这里用 {@link forwardCore} 按清单一把转发 —— 之前是手写 expose 逐个转发，
 * 每加一个 API 要改两处、极易漏。</p>
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
  <G6Graph ref="core" v-bind="$attrs" class="rrg-theme-default">
    <!-- 透传核心插槽：html 节点内容（ER 表卡）/ 工具栏扩展 / 节点与边提示 / 右键菜单。
         不传对应插槽时核心行为与历史完全一致。 -->
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
