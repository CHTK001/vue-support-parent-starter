<template>
  <div class="h-full relative p-6">
    <el-table :data="newData" border>
      <el-table-column prop="name" label="字段" />
      <el-table-column prop="value" label="值" class="overflow-ellipsis overflow-hidden whitespace-nowrap" />
    </el-table>
  </div>
</template>
<script setup>
import { defineProps, reactive } from "vue";
const props = defineProps({
  data: Object
});
const newData = Object.keys(props.data).map(it => {
  return props.data[it];
});
</script>
