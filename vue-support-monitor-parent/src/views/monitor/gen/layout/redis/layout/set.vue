<template>
  <div class="h-full relative p-6">
    <el-table :data="newData" border>
      <el-table-column prop="name" label="序号" type="index" width="80" />
      <el-table-column prop="value" label="节点" class="overflow-ellipsis overflow-hidden whitespace-nowrap" />
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
