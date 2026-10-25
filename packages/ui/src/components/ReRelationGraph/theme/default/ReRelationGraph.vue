<script setup lang="ts">
/**
 * ReRelationGraph · default 主题
 *
 * <p>主题层只做两件事：给出主题标识类名、把 props/事件/API 原样透传给 G6 核心。
 * 外观差异一律走 CSS 变量，不在模板里分叉逻辑。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { ref } from "vue";
import G6Graph from "../../internals/G6Graph.vue";
import type { RelationGraphApi } from "../../internals/types";

defineOptions({ name: "ReRelationGraph", inheritAttrs: false });

const core = ref<RelationGraphApi | null>(null);

/**
 * 对外 API 代理：把核心实例的方法原样转发出去。
 *
 * <p>用 Proxy 是为了避免把二十来个方法再抄一遍——那些方法名与签名由
 * {@link RelationGraphApi} 约束，抄写只会带来漂移风险。</p>
 */
defineExpose(
  new Proxy({} as RelationGraphApi, {
    get: (_t, key) => (core.value as unknown as Record<string | symbol, unknown>)?.[key],
    has: (_t, key) => key in ((core.value as unknown as object) ?? {}),
  }),
);
</script>

<template>
  <G6Graph ref="core" v-bind="$attrs" class="rrg-theme-default">
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
