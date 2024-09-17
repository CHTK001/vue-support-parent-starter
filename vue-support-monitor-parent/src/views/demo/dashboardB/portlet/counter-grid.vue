<script setup>
import { reactive, onMounted } from "vue";

const state = reactive({
  arry: [
    { title: "软件销售额", icon: "i carbon:ibm-z-cloud-mod-stack", unit: "万元", total: "1874" },
    { title: "硬件销售额", icon: "i carbon:chip", unit: "万元", total: "3276" },
    { title: "技术服务", icon: "i carbon:user-speaker", unit: "万元", total: "315" },
    { title: "安全服务", icon: "i carbon:rule", unit: "万元", total: "769" },
    { title: "总支出费用", icon: "i carbon:airline-digital-gate", unit: "万元", total: "23769" }
  ]
});

const decoFrameConfig = {
  directionAlt: true,
  scale: 0.8
};
</script>
<template>
  <div class="screenB-counterGrid">
    <div v-for="(item, index) in state.arry" :key="index" class="content-wrap">
      <decoFrameA2 :config="decoFrameConfig"><i :class="[item.icon, 'icon']" /></decoFrameA2>
      <DigitalTransform class="numbers" :value="item.total" :useGrouping="true" :interval="3000" />
      <div class="block-title">
        {{ item.title }}
        <span v-if="item.unit" class="unit">({{ item.unit }})</span>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.screenB-counterGrid {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: 100%;
  grid-template-rows: repeat(1, 1fr);
  grid-gap: 12px;
  position: relative;
  .content-wrap {
    text-align: center;
    .decoFrameA2 {
      margin: 0 auto;
    }
    .block-title {
      font-size: 20px;
      line-height: 1.5;
      .unit {
        display: block;
        font-size: 12px;
      }
    }
    .numbers {
      display: inline-block;
      text-align: center;
      height: 38px;
      line-height: 1;
      font-size: 38px;
      position: relative;
      vertical-align: text-top;
    }
  }
}
</style>
