<template>
  <div ref="scEcharts" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from "echarts";
import T from "./echarts-theme-T";
import { useDark } from "@vueuse/core";

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
  setup() {
    const isDark = useDark();
    return { isDark };
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
      // Trigger reactivity when dark mode changes
      const dark = this.isDark;
      const option = this.option || {};
      const colors = this.getGlobalColors();
      
      const textColor = dark ? '#E5EAF3' : '#606266';

      return {
        color: colors.length ? colors : undefined,
        textStyle: { color: textColor },
        ...option
      };
    },
    // 版本号用于监听 option 变化，避免深度监听
    optionVersion() {
      return JSON.stringify(this.option);
    }
  },
  watch: {
    optionVersion(newVersion, oldVersion) {
      if (newVersion !== oldVersion) {
        setTimeout(() => unwarp(this.myChart).setOption(this.myOptions), 300);
      }
    },
    isDark() {
      if (this.myChart) {
        setTimeout(() => unwarp(this.myChart).setOption(this.myOptions), 300);
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
    },
    getGlobalColors() {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue('--el-color-primary');
      const success = style.getPropertyValue('--el-color-success');
      const warning = style.getPropertyValue('--el-color-warning');
      const danger = style.getPropertyValue('--el-color-danger');
      const info = style.getPropertyValue('--el-color-info');
      
      if (!primary) return [];
      
      return [
        primary.trim(),
        success.trim(),
        warning.trim(),
        danger.trim(),
        info.trim(),
        '#909399' // fallback/extra
      ];
    }
  }
};
</script>
