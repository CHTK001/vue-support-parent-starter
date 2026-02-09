/**
 * ScCard 物联网主题配置
 * @author CH
 * @date 2025-12-07
 */

export interface CardThemeConfig {
  icon: string;
  color: string;
  bgColor: string;
  bgGradient?: string;
  title: string;
  layout?: string;
}

// 物联网主题配置
export const iotThemes: Record<string, CardThemeConfig> = {
  // 天气面板
  weather: {
    icon: "ri:sun-cloudy-line",
    color: "var(--stitch-lay-primary)",
    bgColor: "var(--stitch-lay-primary-alpha)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-primary-light) 0%, var(--stitch-lay-primary) 100%)",
    title: "天气",
    layout: "stats"
  },
  // 空调面板
  aircon: {
    icon: "ri:snowflake-line",
    color: "var(--stitch-lay-primary)",
    bgColor: "var(--stitch-lay-primary-alpha)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-primary-light) 0%, var(--stitch-lay-info) 100%)",
    title: "空调",
    layout: "panel-3d"
  },
  // 温控面板
  thermostat: {
    icon: "ri:temp-hot-line",
    color: "var(--stitch-lay-error)",
    bgColor: "var(--stitch-lay-error-bg)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-error-light) 0%, var(--stitch-lay-warning) 100%)",
    title: "温控",
    layout: "panel-3d"
  },
  // 照明面板
  lighting: {
    icon: "ri:lightbulb-line",
    color: "var(--stitch-lay-warning)",
    bgColor: "var(--stitch-lay-warning-bg)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-warning-light) 0%, var(--stitch-lay-error) 100%)",
    title: "照明",
    layout: "panel-3d"
  },
  // 安防面板
  security: {
    icon: "ri:shield-check-line",
    color: "var(--stitch-lay-success)",
    bgColor: "var(--stitch-lay-success-bg)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-success-light) 0%, var(--stitch-lay-success) 100%)",
    title: "安防",
    layout: "panel-3d"
  },
  // 电量面板
  energy: {
    icon: "ri:flashlight-line",
    color: "var(--stitch-lay-warning)",
    bgColor: "var(--stitch-lay-warning-bg)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-warning-light) 0%, var(--stitch-lay-error) 100%)",
    title: "能耗",
    layout: "stats"
  },
  // 摄像头面板
  camera: {
    icon: "ri:camera-line",
    color: "var(--stitch-lay-text-sub)",
    bgColor: "var(--stitch-lay-bg-group)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-text-sub) 0%, var(--stitch-lay-text-main) 100%)",
    title: "监控",
    layout: "media"
  },
  // 音乐面板
  music: {
    icon: "ri:music-line",
    color: "var(--stitch-lay-primary)",
    bgColor: "var(--stitch-lay-primary-alpha)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-primary-light) 0%, var(--stitch-lay-primary-dark) 100%)",
    title: "音乐",
    layout: "media"
  },
  // 窗帘面板
  curtain: {
    icon: "ri:layout-masonry-line",
    color: "var(--stitch-lay-success)",
    bgColor: "var(--stitch-lay-success-bg)",
    bgGradient: "linear-gradient(135deg, var(--stitch-lay-info-light) 0%, var(--stitch-lay-info) 100%)",
    title: "窗帘",
    layout: "panel-3d"
  },
  // 风扇面板
  fan: {
    icon: "ri:windy-line",
    color: "var(--el-color-primary)",
    bgColor: "var(--el-color-primary-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%)",
    title: "风扇",
    layout: "panel-3d"
  },
  // 门锁面板
  lock: {
    icon: "ri:lock-line",
    color: "var(--el-color-danger)",
    bgColor: "var(--el-color-danger-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%)",
    title: "门锁",
    layout: "panel-3d"
  },
  // 空气质量
  airQuality: {
    icon: "ri:leaf-line",
    color: "var(--el-color-success)",
    bgColor: "var(--el-color-success-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-success-light-3) 0%, var(--el-color-success) 100%)",
    title: "空气质量",
    layout: "stats"
  },
  // 湿度面板
  humidity: {
    icon: "ri:drop-line",
    color: "var(--el-color-primary)",
    bgColor: "var(--el-color-primary-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary-light-5) 100%)",
    title: "湿度",
    layout: "stats"
  },
  // 网络状态
  network: {
    icon: "ri:wifi-line",
    color: "var(--el-color-success)",
    bgColor: "var(--el-color-success-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-success-light-3) 0%, var(--el-color-success-light-5) 100%)",
    title: "网络",
    layout: "stats"
  },
  // 设备面板
  device: {
    icon: "ri:device-line",
    color: "var(--el-color-info)",
    bgColor: "var(--el-color-info-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-info-light-3) 0%, var(--el-color-info) 100%)",
    title: "设备",
    layout: "compact"
  },
  // 场景面板
  scene: {
    icon: "ri:home-smile-line",
    color: "var(--el-color-warning)",
    bgColor: "var(--el-color-warning-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-warning-light-3) 0%, var(--el-color-warning) 100%)",
    title: "场景",
    layout: "compact"
  },
  // 传感器
  sensor: {
    icon: "ri:radar-line",
    color: "var(--el-color-warning)",
    bgColor: "var(--el-color-warning-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-warning-light-3) 0%, var(--el-color-warning) 100%)",
    title: "传感器",
    layout: "stats"
  },
  // 电池面板
  battery: {
    icon: "ri:battery-2-charge-line",
    color: "var(--el-color-success)",
    bgColor: "var(--el-color-success-light-9)",
    bgGradient: "linear-gradient(135deg, var(--el-color-success-light-3) 0%, var(--el-color-success) 100%)",
    title: "电池",
    layout: "stats"
  }
};

// 获取主题配置
export function getThemeConfig(theme: string): CardThemeConfig | undefined {
  return iotThemes[theme];
}

// 主题类型
export type IotCardTheme = keyof typeof iotThemes;
