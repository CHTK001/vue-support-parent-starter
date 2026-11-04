/**
 * 监控大屏「宿主自带」卡片（自注册到 {@link ./registry}）
 *
 * <p>本文件只保留<b>宿主自己的</b>卡片 —— 用户自定义卡片（自选数据源 / iframe）。
 * 领域卡片已按首页 widget 的同一套模式迁出：</p>
 * <ul>
 *   <li>{@code @pages/actuator} —— {@code /actuator/**} 端点卡片，应用入口用
 *       {@code defineMonitorCardContribution(actuatorCards)} 注册；</li>
 *   <li>{@code @pages/apm} —— APM 观测卡片（SkyWalking / OpenTelemetry 合并视图）。</li>
 * </ul>
 *
 * <p>为什么这么拆：卡片属于「读懂某个领域」的能力，应当由该领域的 {@code pages/xx}
 * 自己维护元数据、组件与数据通道；监控大屏只负责网格、目录与持久化。
 * 早期把 Actuator / OTel 全塞在这里，结果是每加一个领域卡片都要回宿主改 import。</p>
 *
 * <p>本文件被 {@code MonitorCardBoard.vue} 副作用导入，因此即使应用入口不注册任何
 * 领域贡献，自定义卡片与页面区块也照常可用。</p>
 */
import { markRaw } from "vue";
import { DataBoard } from "@element-plus/icons-vue";
import { registerMonitorCards, type MonitorCardRegistration } from "./registry";

/** 宿主自带卡片注册项 */
export const BUILTIN_MONITOR_CARDS: MonitorCardRegistration[] = [
  {
    type: "custom-data",
    title: "自定义卡片",
    description: "自选数据源（Actuator 端点 / 任意 URL / 嵌入页面）与展示方式",
    icon: "DataBoard",
    iconComponent: markRaw(DataBoard),
    category: "custom",
    defaultSize: { w: 6, h: 5 },
    maxCount: 12,
    editableSource: true,
    defaultConfig: { kind: "actuator", path: "health", intervalSec: 15, render: "kv" },
    component: () => import("./cards/CustomDataCard.vue"),
  },
];

// 自注册：必须在本模块求值时完成，早于 app 的 mount() 与各 pages 模块的贡献
registerMonitorCards(BUILTIN_MONITOR_CARDS);
