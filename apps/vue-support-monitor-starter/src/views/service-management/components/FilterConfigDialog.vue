<template>
  <el-dialog title="title" width="600px" v-model="visibleInner">
    <el-empty description="暂不支持配置"></el-empty>
  </el-dialog>>
</template>
<script lang="ts">
import { computed, defineEmits , defineProps , ref, watch } from "vue";
const visibleInner = ref(false);
const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
}>();

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
  },
  { immediate: true }
);
watch(visibleInner, (v) => emit("update:visible", v));

</script>