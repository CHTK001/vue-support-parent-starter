<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="output" :text="data.reText" :color="data.reColor" :icon="data.reIcon" :subtitle="data.target ? '去向 ' + data.target : '输出节点'" />
</template>
