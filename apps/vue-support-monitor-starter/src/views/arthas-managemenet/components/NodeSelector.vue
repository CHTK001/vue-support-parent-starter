<template>
  <el-form :inline="true">
    <el-form-item :label="label" class="!mb-0">
      <el-select v-model="value" filterable :placeholder="placeholder" style="min-width: 320px" @change="$emit('change', value)">
        <el-option v-for="node in nodes" :key="node.nodeId" :label="formatNodeLabel(node)" :value="node.nodeId" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { OnlineNodeInfo } from "@/api/server/node-management";
import { computed } from "vue";

const props = defineProps<{
  nodes: OnlineNodeInfo[];
  label?: string;
  placeholder?: string;
  modelValue?: string;
}>();
const emit = defineEmits(["update:modelValue", "change"]);

const value = computed({
  get: () => (props.modelValue as string) || "",
  set: (v: string) => emit("update:modelValue", v),
});

function formatNodeLabel(n: OnlineNodeInfo) {
  const app = n.applicationName || "-";
  const ip = `${n.ipAddress}:${n.port}`;
  return `${app} (${ip})`;
}
</script>
