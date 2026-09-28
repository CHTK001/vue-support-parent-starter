<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="llm" :text="data.reText" :color="data.reColor" :icon="data.reIcon" :subtitle="'模型 ' + (data.model || 'gpt') + ' · T=' + (data.temperature ?? 0.7)" />
</template>
