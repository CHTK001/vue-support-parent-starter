<template>
  <div class="screenA-counterGrid !h-[200px] z-20">
    <aYinTechBorderB3 v-for="(item, index) in state.arry" :key="index" :config="borderConfig(index)">
      <div class="inner-content z-20">
        <div class="block-title">
          <span>{{ item.title }}</span>
          <span v-if="item.unit">({{ item.unit }})</span>
        </div>
        <div class="total absolute z-20">
          <el-icon
            v-if="item.icon"
            class="relative left-1"
            :style="{
              'font-size': item.type !== 'Time' ? '28px' : '14px'
            }"
          >
            <component :is="useRenderIcon(item.icon)" />
          </el-icon>
          <span v-if="item.type === 'Time'" class="numbers z-20" style="font-size: 14px">{{ formatDate(item.total, "YYYY-MM-DD HH:mm:ss") }}</span>
          <span v-else-if="item.type === 'Text'" class="relative top-[6px]" style="font-size: 16px">{{ item.total }}</span>
          <DigitalTransform v-else class="numbers z-20" :value="item.total" :useGrouping="true" :interval="3000" />
        </div>
      </div>
    </aYinTechBorderB3>
    <!-- <div class="block" > <div class="bdTechBottom"></div> </div> -->
  </div>
</template>
<script setup>
import { defineEmits, defineExpose, onMounted, reactive } from "vue";
import { formatDate } from "@vueuse/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const emit = defineEmits([]);
const state = reactive({
  arry: [
    { title: "QPS", icon: "ri:24-hours-fill", unit: "", total: "0" },
    { title: "最后更新时间", unit: "", total: new Date(), type: "Time" },
    { title: "最后访问客户端", icon: "ri:computer-line", total: "-", type: "Text" },
    { title: "", icon: "i carbon:rule", unit: "", total: "0" }
  ]
});
const borderConfig = index => {
  let rotate;
  if (index == 0) {
    rotate = "x";
  } else if (index == 1) {
    rotate = "all";
  } else if (index == 2) {
    rotate = null;
  } else if (index == 3) {
    rotate = "y";
  }
  return {
    dur: 3,
    opacity: 0.7,
    // decoration: false,
    rotate
  };
};
const handle = async (type, data) => {
  if ("qps" === type) {
    state.arry[0].total = data;
    return;
  }
  state.arry[1].total = new Date();
};

const increament = async (type, data) => {
  if ("qps" === type) {
    state.arry[0].total = (parseFloat(state.arry[0].total) + data).toFixed(5);
    return;
  }
  state.arry[2].total = data || "-";
};

onMounted(() => {
  emit("success");
});

defineExpose({
  handle,
  increament
});
</script>
<style scope lang="scss">
.screenA-counterGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 100%;
  grid-template-rows: repeat(2, 1fr);
  grid-gap: 12px;
  position: relative;
  .aYinTechBorderB3 {
    padding: 0;
    position: relative;
    //&:nth-child(1){ grid-area: 1 / 1 / 2 / 3;  }
    .inner-content {
      height: 100%;
      .block-title {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        top: 10px;
        font-size: 14px;
      }
      .total {
        margin: 0;
        position: absolute;
        text-align: center;
        line-height: 30px;
        left: 0;
        right: 0;
        top: 40% !important;
        i {
          display: inline-block;
          font-size: 32px;
          vertical-align: text-top;
          margin-right: 10px;
        }
        .numbers {
          display: inline-block;
          text-align: center;
          font-size: 32px;
          position: relative;
          vertical-align: text-top;
          .badge {
            position: absolute;
            left: 100%;
            top: -10px;
            font-size: 14px;
            width: 30px;
            height: 30px;
            padding: 0;
            line-height: 1;
          }
        }
        .unit {
          font-size: 14px;
          margin: 0 0 0 10px;
        }
      }
    }
  }
}
</style>
