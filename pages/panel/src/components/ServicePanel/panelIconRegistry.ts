/**
 * Panel 面板离线图标注册
 *
 * 注册 InstalledSoftware / SoftwareCard / SoftwareLogPanel 等组件使用的
 * ep:* 和 simple-icons:* 图标，使其在无 Iconify CDN 环境下仍可渲染。
 *
 * 在 ServicePanelPage.vue 中 import 一次即全局生效。
 */
import { addIcon } from "@iconify/vue/dist/offline";
import { markRaw } from "vue";

// ── ep:* (Element Plus) ─────────────────────────────────────
import EpClose from "@iconify-icons/ep/close";
import EpDownload from "@iconify-icons/ep/download";
import EpLightning from "@iconify-icons/ep/lightning";
import EpVideoPause from "@iconify-icons/ep/video-pause";
import EpVideoPlay from "@iconify-icons/ep/video-play";
import EpRefresh from "@iconify-icons/ep/refresh";
import EpSetting from "@iconify-icons/ep/setting";
import EpTools from "@iconify-icons/ep/tools";
import EpDocument from "@iconify-icons/ep/document";
import EpTrendCharts from "@iconify-icons/ep/trend-charts";
import EpBox from "@iconify-icons/ep/box";
import EpMonitor from "@iconify-icons/ep/monitor";
import EpChatLineSquare from "@iconify-icons/ep/chat-line-square";
import EpInfoFilled from "@iconify-icons/ep/info-filled";
import EpDelete from "@iconify-icons/ep/delete";
import EpArrowRight from "@iconify-icons/ep/arrow-right";
import EpShip from "@iconify-icons/ep/ship";
import EpConnection from "@iconify-icons/ep/connection";
import EpMoreFilled from "@iconify-icons/ep/more-filled";
import EpWarningFilled from "@iconify-icons/ep/warning-filled";
import EpSearch from "@iconify-icons/ep/search";
import EpArrowDown from "@iconify-icons/ep/arrow-down";
import EpArrowLeft from "@iconify-icons/ep/d-arrow-left";
import EpArrowRightBold from "@iconify-icons/ep/d-arrow-right";

addIcon("ep:close", markRaw(EpClose));
addIcon("ep:download", markRaw(EpDownload));
addIcon("ep:lightning", markRaw(EpLightning));
addIcon("ep:video-pause", markRaw(EpVideoPause));
addIcon("ep:video-play", markRaw(EpVideoPlay));
addIcon("ep:refresh", markRaw(EpRefresh));
addIcon("ep:setting", markRaw(EpSetting));
addIcon("ep:tools", markRaw(EpTools));
addIcon("ep:document", markRaw(EpDocument));
// trend-chart → trend-charts (npm 包名是趋势-charts，但组件用 trend-chart)
addIcon("ep:trend-chart", markRaw(EpTrendCharts));
// container 不存在，用 box 替代
addIcon("ep:container", markRaw(EpBox));
// terminal 不存在，用 monitor 替代
addIcon("ep:terminal", markRaw(EpMonitor));
addIcon("ep:chat-line-square", markRaw(EpChatLineSquare));
addIcon("ep:info-filled", markRaw(EpInfoFilled));
addIcon("ep:monitor", markRaw(EpMonitor));
addIcon("ep:delete", markRaw(EpDelete));
addIcon("ep:arrow-right", markRaw(EpArrowRight));
addIcon("ep:ship", markRaw(EpShip));
addIcon("ep:connection", markRaw(EpConnection));
addIcon("ep:more-filled", markRaw(EpMoreFilled));
addIcon("ep:warning-filled", markRaw(EpWarningFilled));
addIcon("ep:box", markRaw(EpBox));
addIcon("ep:search", markRaw(EpSearch));
addIcon("ep:arrow-down", markRaw(EpArrowDown));
addIcon("ep:d-arrow-left", markRaw(EpArrowLeft));
addIcon("ep:d-arrow-right", markRaw(EpArrowRightBold));

// ── simple-icons:* (软件 Logo) ─────────────────────────────
import SiMysql from "@iconify-icons/simple-icons/mysql";
import SiMariadb from "@iconify-icons/simple-icons/mariadb";
import SiPostgresql from "@iconify-icons/simple-icons/postgresql";
import SiRedis from "@iconify-icons/simple-icons/redis";
import SiNginx from "@iconify-icons/simple-icons/nginx";
import SiMongodb from "@iconify-icons/simple-icons/mongodb";
import SiApachekafka from "@iconify-icons/simple-icons/apachekafka";
import SiMinio from "@iconify-icons/simple-icons/minio";
import SiRabbitmq from "@iconify-icons/simple-icons/rabbitmq";
import SiElasticsearch from "@iconify-icons/simple-icons/elasticsearch";

addIcon("simple-icons:mysql", markRaw(SiMysql));
addIcon("simple-icons:mariadb", markRaw(SiMariadb));
addIcon("simple-icons:postgresql", markRaw(SiPostgresql));
addIcon("simple-icons:redis", markRaw(SiRedis));
addIcon("simple-icons:nginx", markRaw(SiNginx));
addIcon("simple-icons:mongodb", markRaw(SiMongodb));
addIcon("simple-icons:apachekafka", markRaw(SiApachekafka));
addIcon("simple-icons:minio", markRaw(SiMinio));
addIcon("simple-icons:rabbitmq", markRaw(SiRabbitmq));
addIcon("simple-icons:elasticsearch", markRaw(SiElasticsearch));

// nacos / apachezookeeper / apacheguacamole 在当前 npm 包版本中不存在，
// 这些软件 logo 将回退到 fallback 图标。

/** 确保注册生效（空函数，仅用于触发模块加载） */
export function ensurePanelIcons(): void {
  // 所有 addIcon 调用已在模块作用域执行
}
