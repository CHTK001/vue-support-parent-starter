<script setup lang="ts">
/**
 * ReRelationGraphV2 · koi 主题
 *
 * <p>与 default 同核，仅主题类名不同；同样转发核心实例的 expose。</p>
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
  <G6GraphV2 ref="core" v-bind="$attrs" class="rrgv2-theme-koi" />
</template>