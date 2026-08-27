<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="start" :text="data.reText" :subtitle="data.trigger ? '触发：' + data.trigger : '流程起点'" />
</template>
