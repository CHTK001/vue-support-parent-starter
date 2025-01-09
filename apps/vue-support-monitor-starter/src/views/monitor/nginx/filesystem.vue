<template>
  <div>
    <el-tree :lazy="true" :load="handleShowTree" />
  </div>
</template>
<script setup>
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { defineEmits } from "vue";

const emit = defineEmits([]);
const handleShowTree = async (node, resolve, reject) => {
  debugger;
};
</script>
