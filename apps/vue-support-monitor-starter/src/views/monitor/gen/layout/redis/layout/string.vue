<template>
  <div class="h-full relative">
    <div class="absolute right-0 z-[999]">
      <el-radio-group v-model="config.formatType" class="w-[180px]">
        <el-radio-button value="json" label="JSON" />
        <el-radio-button value="string" label="字符串" />
      </el-radio-group>
    </div>
    <div v-if="config.formatType == 'json'" class="h-full">
      <vue-json-pretty :data="formatJson(newData)" :showLineNumber="true" :showIcon="true" :showLength="true" />
    </div>
    <div v-if="config.formatType == 'string'" class="h-full">
      <el-input v-model="newData" readonly disabled type="textarea" :rows="30" class="h-full overflow-auto" />
    </div>
  </div>
</template>
<script setup>
import { format } from "sql-formatter";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { defineProps, reactive } from "vue";
const props = defineProps({
  data: Object
});

const formatJson = data => {
  try {
    return JSON.parse(data);
  } catch (error) {}
  return {};
};
const newData = props.data[0].value;
const config = reactive({
  formatType: "json"
});
</script>
