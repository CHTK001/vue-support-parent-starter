<template>
  <div class="sc-date-time-example">
    <DemoBlock title="日期选择" :code="codes.date">
      <div class="demo-row">
        <ScDatePicker
          v-model="date1"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <ScDatePicker
          v-model="range1"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="时间选择" :code="codes.time">
      <div class="demo-row">
        <ScTimePicker
          v-model="time1"
          placeholder="选择时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
        />
        <ScTimePicker
          v-model="timeRange"
          is-range
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
        />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScDatePicker, ScTimePicker } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const date1 = ref<string | null>(null);
const range1 = ref<[string, string] | null>(null);
const time1 = ref<string | null>(null);
const timeRange = ref<[string, string] | null>(null);

const codes = {
  date: `<ScDatePicker
  v-model="date1"
  type="date"
  placeholder="选择日期"
  format="YYYY-MM-DD"
  value-format="YYYY-MM-DD"
/>
<ScDatePicker
  v-model="range1"
  type="daterange"
  start-placeholder="开始日期"
  end-placeholder="结束日期"
  format="YYYY-MM-DD"
  value-format="YYYY-MM-DD"
/>`,
  time: `<ScTimePicker
  v-model="time1"
  placeholder="选择时间"
  format="HH:mm:ss"
  value-format="HH:mm:ss"
/>
<ScTimePicker
  v-model="timeRange"
  is-range
  start-placeholder="开始时间"
  end-placeholder="结束时间"
  format="HH:mm:ss"
  value-format="HH:mm:ss"
/>`,
};
</script>

<style scoped lang="scss">
.sc-date-time-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
}
</style>


