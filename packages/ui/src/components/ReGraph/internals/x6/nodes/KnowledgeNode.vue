<script setup lang="ts">
import { computed } from "vue";
import BaseNode from "./BaseNode.vue";
const props = defineProps<{ node?: any; graph?: any }>();
const data = computed(() => props.node?.getData?.() ?? {});
</script>

<template>
  <BaseNode type="knowledge" :text="data.reText" :color="data.reColor" :icon="data.reIcon" :subtitle="'知识库 ' + (data.dataset || 'default')" />
</template>
