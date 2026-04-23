<template>
  <div ref="scEcharts" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from "echarts";
import T from "./echarts-theme-T";
import { ref, onMounted, onBeforeUnmount } from "vue";

echarts.registerTheme("T", T);
const unwarp = obj => obj && (obj.__v_raw || obj.valueOf() || obj);

export default {
  name: "scEcharts",
  props: {
    height: { type: String, default: "100%" },
    width: { type: String, default: "100%" },
    nodata: { type: Boolean, default: false },
    option: { type: Object, default: () => ({}) }
  },
  setup() {
    const isDark = ref(false);
    let observer = null;

    const updateIsDark = () => {
      if (typeof document === "undefined") {
        isDark.value = false;
        return;
      }
      isDark.value = document.documentElement.classList.contains("dark");
    };

    onMounted(() => {
      updateIsDark();
      if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
        observer = new MutationObserver(updateIsDark);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"]
        });
      }
    });

    onBeforeUnmount(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    return { isDark };
  },
  data() {
    return {
      isActivat: false,
      myChart: null,
      resizeHandler: null,
      resizeObserver: null
    };
  },
  computed: {
    myOptions: function () {
      // Trigger reactivity when dark mode changes
      const dark = this.isDark;
      const option = this.option || {};
      const colors = this.getGlobalColors();

      const textColor = dark ? "#E5EAF3" : "#606266";

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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
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

      // 容器初次渲染可能是 0x0（例如在 Dialog / Grid / Loading 里），需要监听尺寸变化并触发 resize
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => {
          try {
            unwarp(this.myChart)?.resize();
          } catch (e) {
            // ignore
          }
        });
        this.resizeObserver.observe(this.$refs.scEcharts);
      }

      // 再补一次延迟 resize，兜底解决初次布局未完成导致的空白
      setTimeout(() => {
        try {
          unwarp(this.myChart)?.resize();
        } catch (e) {
          // ignore
        }
      }, 60);
    },
    getGlobalColors() {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--el-color-primary");
      const success = style.getPropertyValue("--el-color-success");
      const warning = style.getPropertyValue("--el-color-warning");
      const danger = style.getPropertyValue("--el-color-danger");
      const info = style.getPropertyValue("--el-color-info");

      if (!primary) return [];

      return [
        primary.trim(),
        success.trim(),
        warning.trim(),
        danger.trim(),
        info.trim(),
        "#909399" // fallback/extra
      ];
    }
  }
};
</script>
