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
  <G6Graph ref="core" v-bind="$attrs" class="rrg-theme-koi" />
</template>
