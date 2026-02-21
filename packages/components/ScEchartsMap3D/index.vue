<template>
  <div ref="containerRef" class="sc-echarts-map3d" :style="{ width: containerWidth, height: containerHeight }" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDark } from "@vueuse/core";
import * as echarts from "echarts";
import "echarts-gl";
import T from "../ScEcharts/echarts-theme-T";

type LngLat = [number, number];

export interface Map3DPoint {
  /**
   * 点位名称（用于 tooltip / label）
   */
  name?: string;
  /**
   * 经度
   */
  lng: number;
  /**
   * 纬度
   */
  lat: number;
  /**
   * 数值（用于高度/颜色映射）
   */
  value?: number;
}

export interface Map3DLine {
  /**
   * 起点经纬度
   */
  from: LngLat;
  /**
   * 终点经纬度
   */
  to: LngLat;
  /**
   * 线名称
   */
  name?: string;
  /**
   * 数值（用于宽度/颜色映射）
   */
  value?: number;
}

export interface Props {
  width?: string | number;
  height?: string | number;
  /**
   * 地图 GeoJSON URL（默认读取 public/data/china-province.json）
   */
  mapUrl?: string;
  /**
   * registerMap 的名称
   */
  mapName?: string;
  /**
   * 直接传入 GeoJSON（传了就不会再 fetch mapUrl）
   */
  mapData?: any;
  /**
   * 经纬度点位数据（scatter3D）
   */
  points?: Map3DPoint[];
  /**
   * 经纬度线数据（lines3D）
   */
  lines?: Map3DLine[];
  /**
   * 允许业务侧完全覆盖 option（会与默认 option 合并）
   */
  option?: Record<string, any>;
  /**
   * 自动 resize
   */
  autoResize?: boolean;
  /**
   * 主题名称（默认 T）
   */
  theme?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
  height: "100%",
  mapUrl: "/data/china-province.json",
  mapName: "china-province",
  points: () => [],
  lines: () => [],
  option: () => ({}),
  autoResize: true,
  theme: "T"
});

const emit = defineEmits<{
  /**
   * ECharts 实例准备完成
   */
  ready: [chart: echarts.ECharts];
}>();

echarts.registerTheme("T", T);

const isDark = useDark();
const containerRef = ref<HTMLDivElement | null>(null);
const chartRef = ref<echarts.ECharts | null>(null);
const resizeHandlerRef = ref<(() => void) | null>(null);

const containerWidth = computed(() => (typeof props.width === "number" ? `${props.width}px` : props.width));
const containerHeight = computed(() => (typeof props.height === "number" ? `${props.height}px` : props.height));

function buildOption(): Record<string, any> {
  const dark = isDark.value;
  const textColor = dark ? "#E5EAF3" : "#606266";

  const scatterData = (props.points || []).map((it) => ({
    name: it.name,
    value: [it.lng, it.lat, it.value ?? 0]
  }));

  const lineData = (props.lines || []).map((it) => ({
    name: it.name,
    value: it.value ?? 0,
    coords: [it.from, it.to]
  }));

  const base = {
    backgroundColor: "transparent",
    textStyle: { color: textColor },
    tooltip: { trigger: "item" },
    geo3D: {
      map: props.mapName,
      shading: "lambert",
      environment: "transparent",
      label: {
        show: false
      },
      itemStyle: {
        color: dark ? "#0f2a4a" : "#b8d4ff",
        opacity: 0.95,
        borderWidth: 0.8,
        borderColor: dark ? "#2b4a7a" : "#5a87c5"
      },
      emphasis: {
        itemStyle: {
          color: dark ? "#1d4d80" : "#8bb7ff"
        }
      },
      viewControl: {
        distance: 100,
        alpha: 45,
        beta: 0,
        rotateSensitivity: 1,
        zoomSensitivity: 1,
        panSensitivity: 1
      },
      light: {
        main: { intensity: 1.2, shadow: true },
        ambient: { intensity: 0.3 }
      }
    },
    series: [
      {
        name: "点位",
        type: "scatter3D",
        coordinateSystem: "geo3D",
        symbolSize: 8,
        itemStyle: {
          color: "#ffcc00"
        },
        data: scatterData
      },
      {
        name: "连线",
        type: "lines3D",
        coordinateSystem: "geo3D",
        blendMode: "lighter",
        effect: {
          show: true,
          trailWidth: 2,
          trailLength: 0.2,
          trailOpacity: 0.7
        },
        lineStyle: {
          width: 2,
          opacity: 0.8,
          color: "#3fb1ff"
        },
        data: lineData
      }
    ]
  };

  return { ...base, ...(props.option || {}) };
}

async function ensureMapRegistered(): Promise<void> {
  const mapName = props.mapName;
  if (!mapName) {
    return;
  }

  // 已注册则跳过
  // @ts-expect-error echarts 内部 API
  if (echarts.getMap && echarts.getMap(mapName)) {
    return;
  }

  const geoJson = props.mapData ? props.mapData : await (await fetch(props.mapUrl)).json();
  echarts.registerMap(mapName, geoJson);
}

async function initChart(): Promise<void> {
  if (!containerRef.value) {
    return;
  }

  await ensureMapRegistered();

  const chart = echarts.init(containerRef.value, props.theme);
  chart.setOption(buildOption(), true);
  chartRef.value = chart;
  emit("ready", chart);

  if (props.autoResize) {
    const handler = () => {
      chart.resize();
    };
    resizeHandlerRef.value = handler;
    window.addEventListener("resize", handler);
  }
}

function updateChart(): void {
  if (!chartRef.value) {
    return;
  }
  chartRef.value.setOption(buildOption(), false);
}

watch(
  () => [props.points, props.lines, props.option, props.mapName, props.mapUrl, props.mapData, isDark.value],
  async () => {
    if (!chartRef.value) {
      return;
    }
    await ensureMapRegistered();
    updateChart();
  },
  { deep: true }
);

onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  if (resizeHandlerRef.value) {
    window.removeEventListener("resize", resizeHandlerRef.value);
  }
  if (chartRef.value) {
    chartRef.value.dispose();
    chartRef.value = null;
  }
});
</script>

<style scoped>
.sc-echarts-map3d {
  position: relative;
}
</style>


