<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="input" :text="data.reText" :color="data.reColor" :icon="data.reIcon" :subtitle="data.source ? '来源 ' + data.source : '输入节点'" />
</template>
