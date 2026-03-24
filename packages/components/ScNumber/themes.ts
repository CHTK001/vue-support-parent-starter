/**
 * ScNumber 物联网主题配置
 * @author CH
 * @date 2025-12-07
 */

export interface NumberThemeConfig {
  icon: string;
  color: string;
  bgColor: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
}

// 物联网主题配置
export const iotThemes: Record<string, NumberThemeConfig> = {
  // 音量控制
  volume: {
    icon: "ri:volume-up-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    formatValue: (v) => `${v}%`
  },
  // 电量显示
  battery: {
    icon: "ri:battery-2-charge-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    formatValue: (v) => `${v}%`
  },
  // 温度控制
  temperature: {
    icon: "ri:temp-hot-line",
    color: "#f56c6c",
    bgColor: "rgba(245, 108, 108, 0.1)",
    unit: "°C",
    min: 16,
    max: 32,
    step: 0.5,
    formatValue: (v) => `${v}°C`
  },
  // 湿度显示
  humidity: {
    icon: "ri:drop-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    formatValue: (v) => `${v}%`
  },
  // 亮度调节
  brightness: {
    icon: "ri:sun-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    formatValue: (v) => `${v}%`
  },
  // 信号强度
  signal: {
    icon: "ri:signal-wifi-3-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    unit: "dBm",
    min: -100,
    max: 0,
    step: 1,
    formatValue: (v) => `${v}dBm`
  },
  // 风速控制
  fanSpeed: {
    icon: "ri:windy-line",
    color: "#909399",
    bgColor: "rgba(144, 147, 153, 0.1)",
    unit: "",
    min: 0,
    max: 5,
    step: 1,
    formatValue: (v) => v === 0 ? "关闭" : `${v}档`
  },
  // 定时器
  timer: {
    icon: "ri:timer-line",
    color: "#909399",
    bgColor: "rgba(144, 147, 153, 0.1)",
    unit: "min",
    min: 0,
    max: 120,
    step: 5,
    formatValue: (v) => v === 0 ? "关闭" : `${v}分钟`
  },
  // 功率显示
  power: {
    icon: "ri:flashlight-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    unit: "W",
    min: 0,
    max: 3000,
    step: 1,
    formatValue: (v) => `${v}W`
  },
  // 电流显示
  current: {
    icon: "ri:thunderstorms-line",
    color: "#f56c6c",
    bgColor: "rgba(245, 108, 108, 0.1)",
    unit: "A",
    min: 0,
    max: 20,
    step: 0.1,
    formatValue: (v) => `${v.toFixed(1)}A`
  },
  // 电压显示
  voltage: {
    icon: "ri:plug-line",
    color: "#409eff",
    bgColor: "rgba(64, 158, 255, 0.1)",
    unit: "V",
    min: 0,
    max: 250,
    step: 1,
    formatValue: (v) => `${v}V`
  },
  // PM2.5
  pm25: {
    icon: "ri:haze-line",
    color: "#67c23a",
    bgColor: "rgba(103, 194, 58, 0.1)",
    unit: "μg/m³",
    min: 0,
    max: 500,
    step: 1,
    formatValue: (v) => `${v}μg/m³`
  },
  // CO2
  co2: {
    icon: "ri:bubble-chart-line",
    color: "#909399",
    bgColor: "rgba(144, 147, 153, 0.1)",
    unit: "ppm",
    min: 0,
    max: 5000,
    step: 1,
    formatValue: (v) => `${v}ppm`
  },
  // 噪音
  noise: {
    icon: "ri:volume-vibrate-line",
    color: "#e6a23c",
    bgColor: "rgba(230, 162, 60, 0.1)",
    unit: "dB",
    min: 0,
    max: 120,
    step: 1,
    formatValue: (v) => `${v}dB`
  }
};

// 获取主题配置
export function getThemeConfig(theme: string): NumberThemeConfig | undefined {
  return iotThemes[theme];
}

// 主题类型
export type IotNumberTheme = keyof typeof iotThemes;
