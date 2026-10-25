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
import type { RelationGraphApi } from "../../internals/types";

defineOptions({ name: "ReRelationGraph", inheritAttrs: false });

const core = ref<RelationGraphApi | null>(null);

defineExpose(
  new Proxy({} as RelationGraphApi, {
    get: (_t, key) => (core.value as unknown as Record<string | symbol, unknown>)?.[key],
    has: (_t, key) => key in ((core.value as unknown as object) ?? {}),
  }),
);
</script>

<template>
  <G6Graph ref="core" v-bind="$attrs" class="rrg-theme-koi">
    <!-- 透传核心插槽（html 节点内容 / 悬停浮层 / 详情面板 / 右键菜单 / 工具栏扩展），
         供 ER 图等调用方渲染自定义节点 DOM。不传对应插槽时 G6Graph 行为与历史完全一致。 -->
    <template v-if="$slots['node-content']" #node-content="scope">
      <slot name="node-content" v-bind="scope" />
    </template>
    <template v-if="$slots.toolbarExtra" #toolbar-extra="scope">
      <slot name="toolbar-extra" v-bind="scope" />
    </template>
    <template v-if="$slots.hover" #hover="scope">
      <slot name="hover" v-bind="scope" />
    </template>
    <template v-if="$slots.nodeDetail" #node-detail="scope">
      <slot name="node-detail" v-bind="scope" />
    </template>
    <template v-if="$slots.menu" #menu="scope">
      <slot name="menu" v-bind="scope" />
    </template>
  </G6Graph>
</template>
