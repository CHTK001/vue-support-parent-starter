<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="end" :text="data.reText" :color="data.reColor" :icon="data.reIcon" :subtitle="data.status ? '状态：' + data.status : '流程终点'" />
</template>
