<template>
  <el-dialog  width="600px" v-model="visibleInner" title="配置">
    <el-empty description="暂不支持配置" />
  </el-dialog>
  
</template>
<script setup lang="ts">
import { defineEmits, defineProps, ref, watch, withDefaults } from "vue";

const props = withDefaults(defineProps<{ visible?: boolean }>(), { visible: false });
const emit = defineEmits<{ (e: "update:visible", visible: boolean): void }>();

const visibleInner = ref<boolean>(false);

watch(
  () => props.visible,
  v => { visibleInner.value = !!v; },
  { immediate: true }
);

watch(visibleInner, v => emit("update:visible", v));
</script>