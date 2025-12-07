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
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    title: "天气",
    layout: "stats"
  },
  // 空调面板
  aircon: {
    icon: "ri:snowflake-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    title: "空调",
    layout: "panel-3d"
  },
  // 温控面板
  thermostat: {
    icon: "ri:temp-hot-line",
    color: "#f56c6c",
    bgColor: "rgba(245, 108, 108, 0.1)",
    bgGradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    title: "温控",
    layout: "panel-3d"
  },
  // 照明面板
  lighting: {
    icon: "ri:lightbulb-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    bgGradient: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    title: "照明",
    layout: "panel-3d"
  },
  // 安防面板
  security: {
    icon: "ri:shield-check-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    bgGradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    title: "安防",
    layout: "panel-3d"
  },
  // 电量面板
  energy: {
    icon: "ri:flashlight-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    bgGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    title: "能耗",
    layout: "stats"
  },
  // 摄像头面板
  camera: {
    icon: "ri:camera-line",
    color: "#909399",
    bgColor: "rgba(144, 147, 153, 0.1)",
    bgGradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
    title: "监控",
    layout: "media"
  },
  // 音乐面板
  music: {
    icon: "ri:music-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    title: "音乐",
    layout: "media"
  },
  // 窗帘面板
  curtain: {
    icon: "ri:layout-masonry-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    bgGradient: "linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)",
    title: "窗帘",
    layout: "panel-3d"
  },
  // 风扇面板
  fan: {
    icon: "ri:windy-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    title: "风扇",
    layout: "panel-3d"
  },
  // 门锁面板
  lock: {
    icon: "ri:lock-line",
    color: "#f56c6c",
    bgColor: "rgba(245, 108, 108, 0.1)",
    bgGradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    title: "门锁",
    layout: "panel-3d"
  },
  // 空气质量
  airQuality: {
    icon: "ri:leaf-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    bgGradient: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    title: "空气质量",
    layout: "stats"
  },
  // 湿度面板
  humidity: {
    icon: "ri:drop-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    title: "湿度",
    layout: "stats"
  },
  // 网络状态
  network: {
    icon: "ri:wifi-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    bgGradient: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    title: "网络",
    layout: "stats"
  },
  // 设备面板
  device: {
    icon: "ri:device-line",
    color: "#909399",
    bgColor: "rgba(144, 147, 153, 0.1)",
    bgGradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    title: "设备",
    layout: "compact"
  },
  // 场景面板
  scene: {
    icon: "ri:home-smile-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    bgGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    title: "场景",
    layout: "compact"
  },
  // 传感器
  sensor: {
    icon: "ri:radar-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    bgGradient: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
    title: "传感器",
    layout: "stats"
  },
  // 电池面板
  battery: {
    icon: "ri:battery-2-charge-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    bgGradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
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
