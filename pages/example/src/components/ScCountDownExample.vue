<template>
  <div class="p-4">
    <el-form inline>
      <el-form-item label="倒计时(秒)">
        <el-input-number v-model="seconds" :min="1" :max="600" />
      </el-form-item>
      <el-form-item>
        <el-switch v-model="loop" active-text="循环" />
      </el-form-item>
    </el-form>

    <div class="mt-4 text-lg">
      <ScCountDown v-model="seconds" :loop="loop">
        <template #default="{ row }">
          <span>{{ row.minutes.toString().padStart(2,'0') }}:{{ row.seconds.toString().padStart(2,'0') }}</span>
        </template>
      </ScCountDown>
    </div>

    <el-divider />
    <CodeDisplay :code="code" language="html" title="使用示例" />
  </div>
</template>
<script setup>
import { ref, computed } from "vue";
import ScCountDown from "@repo/components/ScCountDown/index.vue";
import CodeDisplay from "./CodeDisplay.vue";

const seconds = ref(90);
const loop = ref(false);

const code = computed(() => `<ScCountDown v-model=\"time\" :loop=\"${loop.value}\">\n  <template #default=\"{ row }\">\n    <span>{{ row.minutes }}:{{ row.seconds }}</span>\n  </template>\n</ScCountDown>`);
</script>