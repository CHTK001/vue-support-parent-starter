<script setup lang="ts">
/**
 * ReRelationGraphV2 · default 主题
 *
 * <p>主题层只负责给核心画布挂主题类名，props/事件原样透传，
 * 并把核心实例的 expose（graph 句柄等）转发出去。</p>
 */
import { ref } from "vue";
import G6GraphV2 from "../../internals/G6GraphV2.vue";

defineOptions({ name: "ReRelationGraphV2", inheritAttrs: false });

const core = ref<{ graph: unknown } | null>(null);

defineExpose({
  /** 底层 G6 Graph 实例句柄（转发自核心） */
  get graph() {
    return core.value?.graph ?? null;
  },
});
</script>

<template>
  <G6GraphV2 ref="core" v-bind="$attrs" class="rrgv2-theme-default" />
</template>