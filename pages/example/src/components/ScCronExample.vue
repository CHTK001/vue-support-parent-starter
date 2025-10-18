<template>
  <div class="sc-cron-example">
    <el-form label-width="100px" class="mb-3">
      <el-form-item label="当前表达式">
        <el-input v-model="cron" readonly />
      </el-form-item>
      <el-form-item label="快捷项">
        <el-select v-model="shortcut" placeholder="选择快捷表达式" @change="applyShortcut">
          <el-option v-for="it in shortcuts" :key="it.value" :label="it.text" :value="it.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <ScCron v-model="cron" :shortcuts="shortcuts" />

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ScCron from "@repo/components/ScCron/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const cron = ref("0 0 0 * * ?");
const shortcut = ref("");
const shortcuts = [
  { text: "每分钟", value: "0 * * * * ?" },
  { text: "每小时", value: "0 0 * * * ?" },
  { text: "每天零点", value: "0 0 0 * * ?" }
];

const applyShortcut = (v) => (cron.value = v);

const code = computed(() => `<ScCron v-model=\"cron\" :shortcuts=\"${JSON.stringify(shortcuts)}\" />`);
</script>

<style scoped>
.sc-cron-example { padding: 12px; }
</style>