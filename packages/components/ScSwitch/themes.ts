/**
 * ScSwitch 物联网主题配置
 * @author CH
 * @date 2025-12-07
 */

export interface SwitchThemeConfig {
  activeIcon: string;
  inactiveIcon: string;
  activeColor: string;
  inactiveColor: string;
  activeText: string;
  inactiveText: string;
  label?: string;
  description?: string;
}

// 物联网主题配置
export const iotThemes: Record<string, SwitchThemeConfig> = {
  // 电源开关
  power: {
    activeIcon: "ri:shut-down-line",
    inactiveIcon: "ri:shut-down-line",
    activeColor: "#67c23a",
    inactiveColor: "#909399",
    activeText: "开启",
    inactiveText: "关闭",
    label: "电源",
    description: "设备电源开关"
  },
  // 灯光开关
  light: {
    activeIcon: "ri:lightbulb-line",
    inactiveIcon: "ri:lightbulb-line",
    activeColor: "#e6a23c",
    inactiveColor: "#909399",
    activeText: "开灯",
    inactiveText: "关灯",
    label: "照明",
    description: "灯光控制"
  },
  // 风扇开关
  fan: {
    activeIcon: "ri:windy-line",
    inactiveIcon: "ri:windy-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "运行",
    inactiveText: "停止",
    label: "风扇",
    description: "风扇开关"
  },
  // 空调开关
  aircon: {
    activeIcon: "ri:snowflake-line",
    inactiveIcon: "ri:snowflake-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "制冷",
    inactiveText: "关闭",
    label: "空调",
    description: "空调开关"
  },
  // 门锁
  lock: {
    activeIcon: "ri:lock-line",
    inactiveIcon: "ri:lock-unlock-line",
    activeColor: "#f56c6c",
    inactiveColor: "#67c23a",
    activeText: "已锁",
    inactiveText: "已开",
    label: "门锁",
    description: "门锁状态"
  },
  // 警报
  alarm: {
    activeIcon: "ri:alarm-warning-line",
    inactiveIcon: "ri:alarm-warning-line",
    activeColor: "#f56c6c",
    inactiveColor: "#909399",
    activeText: "警戒",
    inactiveText: "撤防",
    label: "警报",
    description: "安防警报"
  },
  // WiFi
  wifi: {
    activeIcon: "ri:wifi-line",
    inactiveIcon: "ri:wifi-off-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "已连接",
    inactiveText: "未连接",
    label: "WiFi",
    description: "网络连接"
  },
  // 蓝牙
  bluetooth: {
    activeIcon: "ri:bluetooth-line",
    inactiveIcon: "ri:bluetooth-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "开启",
    inactiveText: "关闭",
    label: "蓝牙",
    description: "蓝牙连接"
  },
  // 窗帘
  curtain: {
    activeIcon: "ri:layout-masonry-line",
    inactiveIcon: "ri:layout-masonry-line",
    activeColor: "#67c23a",
    inactiveColor: "#909399",
    activeText: "打开",
    inactiveText: "关闭",
    label: "窗帘",
    description: "窗帘控制"
  },
  // 加热
  heater: {
    activeIcon: "ri:fire-line",
    inactiveIcon: "ri:fire-line",
    activeColor: "#f56c6c",
    inactiveColor: "#909399",
    activeText: "加热中",
    inactiveText: "关闭",
    label: "加热",
    description: "加热器开关"
  },
  // 加湿器
  humidifier: {
    activeIcon: "ri:drop-line",
    inactiveIcon: "ri:drop-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "运行",
    inactiveText: "关闭",
    label: "加湿器",
    description: "加湿器开关"
  },
  // 净化器
  purifier: {
    activeIcon: "ri:leaf-line",
    inactiveIcon: "ri:leaf-line",
    activeColor: "#67c23a",
    inactiveColor: "#909399",
    activeText: "净化中",
    inactiveText: "关闭",
    label: "净化器",
    description: "空气净化器"
  },
  // 摄像头
  camera: {
    activeIcon: "ri:camera-line",
    inactiveIcon: "ri:camera-off-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "监控中",
    inactiveText: "关闭",
    label: "摄像头",
    description: "监控摄像头"
  },
  // 静音
  mute: {
    activeIcon: "ri:volume-mute-line",
    inactiveIcon: "ri:volume-up-line",
    activeColor: "#f56c6c",
    inactiveColor: "#67c23a",
    activeText: "静音",
    inactiveText: "有声",
    label: "静音",
    description: "静音模式"
  },
  // 定时
  schedule: {
    activeIcon: "ri:timer-line",
    inactiveIcon: "ri:timer-line",
    activeColor: "#e6a23c",
    inactiveColor: "#909399",
    activeText: "已启用",
    inactiveText: "已禁用",
    label: "定时",
    description: "定时任务"
  },
  // 自动模式
  auto: {
    activeIcon: "ri:robot-line",
    inactiveIcon: "ri:robot-line",
    activeColor: "#409eff",
    inactiveColor: "#909399",
    activeText: "自动",
    inactiveText: "手动",
    label: "智能",
    description: "自动模式"
  }
};

// 获取主题配置
export function getThemeConfig(theme: string): SwitchThemeConfig | undefined {
  return iotThemes[theme];
}

// 主题类型
export type IotSwitchTheme = keyof typeof iotThemes;
