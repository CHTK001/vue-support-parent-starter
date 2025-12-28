<template>
  <div ref="scEcharts" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from "echarts";
import T from "./echarts-theme-T";
echarts.registerTheme("T", T);
const unwarp = obj => obj && (obj.__v_raw || obj.valueOf() || obj);

export default {
  ...echarts,
  name: "scEcharts",
  props: {
    height: { type: String, default: "100%" },
    width: { type: String, default: "100%" },
    nodata: { type: Boolean, default: false },
    option: { type: Object, default: () => {} }
  },
  data() {
    return {
      isActivat: false,
      myChart: null,
      resizeHandler: null
    };
  },
  computed: {
    myOptions: function () {
      return this.option || {};
    },
    // 版本号用于监听 option 变化，避免深度监听
    optionVersion() {
      return JSON.stringify(this.option);
    }
  },
  watch: {
    optionVersion(newVersion, oldVersion) {
      if (newVersion !== oldVersion) {
        setTimeout(() => unwarp(this.myChart).setOption(this.option), 300);
      }
    }
  },
  activated() {
    if (!this.isActivat) {
      this.$nextTick(() => {
        this.myChart.resize();
      });
    }
  },
  deactivated() {
    this.isActivat = false;
  },
  mounted() {
    this.isActivat = true;
    this.$nextTick(() => {
      this.draw();
    });
  },
  beforeUnmount() {
    // 移除事件监听器
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    // 销毁 echarts 实例
    if (this.myChart) {
      this.myChart.dispose();
      this.myChart = null;
    }
  },
  methods: {
    draw() {
      var myChart = echarts.init(this.$refs.scEcharts, "T");
      myChart.setOption(this.myOptions, true);
      this.myChart = myChart;
      // 保存引用以便清理
      this.resizeHandler = () => myChart.resize();
      window.addEventListener("resize", this.resizeHandler);
    }
  }
};
</script>
