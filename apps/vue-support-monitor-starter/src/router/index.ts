/**
 * 监控管理平台路由树（RouteConfigsTable[]）—— **宿主装配层**。
 *
 * <p>本文件只做一件事：把各 {@code pages/xx} 包产出的路由树拼起来。
 * 视图、API、路由声明三者同出于各自的功能包，宿主不再抄第二份 ——
 * 抄两份必然漂（历史上漏过 /prometheus 管理页、「服务管理」页迁包后成死链）。</p>
 *
 * <p>各包职责边界：</p>
 * <table>
 *   <tr><th>能力</th><th>归属包</th></tr>
 *   <tr><td>数据源台账 + 各类数据源管理页</td><td>{@code @pages/datasource}</td></tr>
 *   <tr><td>主机资产 / 远控 / ACME / 会话 / 批量作业 / 片段 / 维护计划 / 发布管理</td><td>{@code @pages/server}</td></tr>
 *   <tr><td>服务管理（协议服务器节点）/ 在线节点 / 服务发现 / 抓包分析 / 告警 / 概览</td><td>{@code @pages/monitor}</td></tr>
 *   <tr><td>设备资产 / 提供商 / 分组</td><td>{@code @pages/device}</td></tr>
 *   <tr><td>文件资产</td><td>{@code @pages/filesystem}</td></tr>
 *   <tr><td>内网穿透（统一隧道管理，提供方在页内选）</td><td>{@code @pages/tunnel}</td></tr>
 * </table>
 *
 * <p><strong>分组结构</strong>：一级为「分组父节点」（仅用于侧边栏分组标题 + 折叠/展开，
 * 无 component、无 redirect），二级为具体业务页面（叶子路由，带 component）。</p>
 *
 * <p><strong>装配说明</strong>：</p>
 * <ul>
 *   <li>菜单：buildMenuFromRoutes 递归保留 children → koi 侧边栏按 children 渲染 el-sub-menu。</li>
 *   <li>路由：registerRoutesUnderLayout 递归 visit，仅把「带 component」或「带 redirect」的节点
 *       通过 addRoute("layout", ...) 平铺到 koi 布局下；分组父节点既无 component 又无 redirect，
 *       因此不会被注册为路由，只作为菜单分组容器存在。</li>
 *   <li>隐藏路由（showLink:false）保留在顶层：菜单过滤时被剔除，但仍会被注册为可访问路由。</li>
 * </ul>
 *
 * <p><strong>page 菜单直接引用</strong>：各功能包都导出自己完整的二级菜单（分组 + 叶子），
 * 本文件用 {@code ...createXxxRoutes()} 展开引用；本文件不再手写业务叶子，只在确实需要
 * 调整菜单排版时才保留本地分组（如监控管理 / 数据中心 / 系统管理等跨包拼装）。</p>
 *
 * 路由模式：hash（routerMode: "hash"）
 */
import type { RouteConfigsTable } from "@repo/core";
// 深导入 src/routes 而不是从包根导入 —— 包根 index.ts 有 registerMenuViewModules
// 顶层副作用，会把整个 api/组件桶拖进主 chunk；本文件只需要路由工厂。
import { createDatasourceManageRoutes } from "@pages/datasource/src/routes";
import { createServerHostRoutes } from "@pages/server/src/routes";
import { createDockerRoutes } from "@pages/docker/src/routes";
// 内网穿透：统一隧道管理页，通过 @pages/tunnel/src/routes 的 createTunnelRoutes 展开。
import { createTunnelRoutes } from "@pages/tunnel/src/routes";
// 调试中心（CDP）：并进「分析管理」分组的叶子页（不再单开「运维管理」）。
import { createCdpRoutes } from "@pages/debug/src/routes";
import { createMonitorRoutes, createMonitorManageRoutes } from "@pages/monitor/src/routes";
// P2P 房间（@pages/room）：不单独占菜单，也不再注册 /room 路由——
// 房间是服务侧的一种能力，由「服务管理」页在工作区里以页签打开。
// 设备远程控制（@pages/control）：WebRTC 信令 + 桌面视频 + 键鼠控制。
import { createControlRoutes } from "@pages/control/src/routes";
// APM 观测台（@pages/apm）：按 SkyWalking 语义组织，自动适配当前服务器接入的 APM 引擎。
// apmConfig 只用于菜单可见性（app.yaml 的 apmConfig.enable），与后端探测无关。
import { apmRoutes } from "@pages/apm/src/routes";
import { apmConfig } from "@pages/apm/src/config";
// 账号管理（账号资产 + 模板管理 + 消息模板）：源码在后端项目
// spring-support-account-starter/web（包名 @account/web），这里只合并它的隐藏子路由
// （打印机管理 / 调用日志 / 设计器 / 预览），供模板工作台的 router.push({name}) 命中。
import { templateChildRoutes } from "@account/web/src/router";
// 已并入又移除的包（留档，避免有人再加回来）：
//   - 2026-11-02 曾并入 achievement / collect / job / message / signin / task 六包；
//   - 本次再移除 @pages/system（systemRoutes 与下方「日志管理」分组）。
//
// 移除 @pages/system 的判据（实测，不是估计）：monitor 后端
// （spring-support-monitor-starter 打的 ngx-console）的 /actuator/mappings 里
// 一条 /manage/** 都没有 —— /manage/user/page、/manage/role/page 带 token 全部
// 404（S0503C0000 资源不存在）。而 systemRoutes 的 16 个叶子全是 /manage/** 页面，
// 且都是 showLink:true 的顶层路由：buildMenuFromRoutes 只剔除「顶层 isVisible=0」，
// 于是它们以 16 条平铺菜单混进 monitor 侧边栏（个人设置 / 用户 / 租户 / 角色 / 菜单 /
// 机构 / 字典 / 参数配置 / 公告 / 反馈 / 岗位 / 消息 / 登录日志 / 系统日志 /
// 文件管理 / 在线用户），点开即 404，还和「模板管理」等分组挤在一起。
// 系统域页面属于系统管理应用（vue-support-system-starter，后端 18170），不在本应用。

export const monitorRoutes: RouteConfigsTable[] = [
  // ==================== 告警管理 ====================
  // 「告警管理」从「监控管理」里独立成一级分组。
  //
  // 告警的数据全部来自主机：每条事件都是某台被监控主机（ms_monitor）的某个指标
  // 越过了策略里配的阈值 —— 没有主机就没有告警。把它留在「监控管理」下，
  // 会让人以为告警是「监控平台自己的事」；独立成组之后，
  // 「主机 → 策略 → 告警 → 处理」这条链在菜单上就是一条直线。
  //
  // 组内两页是同一件事的两端：
  //   告警中心 = 正在发生什么（事件流 + 处理）
  //   告警策略 = 什么情况下该响（策略 / 规则 / 维护窗口）
  // 「因」与「果」分开摆，改策略时不会被一堆正在响的告警分心。
  {
    path: "/grp-alarm",
    name: "GroupAlarm",
    meta: { title: "告警管理", icon: "Bell", showLink: true, rank: 9 },
    children: [
      {
        path: "/alarms",
        name: "Alarms",
        component: () => import("@pages/monitor/src/views/AlarmsView.vue"),
        meta: { title: "告警中心", icon: "Bell", showLink: true, rank: 1 },
      },
      {
        path: "/alarm-policies",
        name: "AlarmPolicies",
        // 原「系统管理 → 监控配置」：该页本来就只做策略 / 规则 / 维护窗口，
        // 归到告警管理下才名副其实。视图与 API 不动，只改入口归属。
        component: () => import("@pages/monitor/src/views/ConfigView.vue"),
        meta: { title: "告警策略", icon: "SetUp", showLink: true, rank: 2 },
      },
    ],
  },

  // ==================== 监控概览 ====================
  // 工作台原先挂在「监控管理」分组下且 showLink:false。告警中心迁走后该分组已空，
  // 因此把工作台摊到顶层做隐藏路由：它本来就不进侧边栏，扁平之后行为与之前一致。
  {
    path: "/workbench",
    name: "Workbench",
    component: () => import("@pages/monitor/src/views/WorkbenchView.vue"),
    meta: { title: "监控概览", icon: "DataBoard", showLink: false, rank: 1 },
  },

  // ==================== 监控大屏 ====================
  // 大屏本体在 @pages/system/src/views/monitor/ServerMonitor.vue：页头按钮
  // （自定义 ↔ 保存 / 恢复默认）、卡片栅格与 Actuator / APM 页签都在那里。
  // 它读的是 monitor 后端（/v2/server/**、/actuator/**），属于本应用，不是系统域页面。
  // 上面整体移除 @pages/system 时它被一并带走，/#/monitor/server 就落到 404；
  // 所以这里只补回这一条隐藏路由（showLink:false，不进侧边栏），
  // /manage/** 的那些系统域页面仍然不挂（monitor 后端确实没有这些接口）。
  {
    path: "/monitor/server",
    name: "MonitorServer",
    component: () => import("@pages/system/src/views/monitor/ServerMonitor.vue"),
    meta: { title: "监控大屏", icon: "Cpu", showLink: false, keepAlive: true, rank: 2 },
  },

  // ==================== 分析管理 ====================
  // 这个分组的子页都是「分析工具」这一路的入口：
  //   「抓包分析」= 网卡实时抓包（起会话、管 BPF、边抓边看）
  //   「PCAP 分析」= 导入既有 pcap（上传、解析入库、原件下载）
  //   「调试中心」= 基于 Chrome DevTools Protocol 的浏览器现场分析（元素 / 控制台 / 网络）
  // 三者共用报文/请求这层「现场取证」语义，所以归在一个分组下；原先调试中心单独占
  // 一个「运维管理」一级菜单，只有一个子页，纯属多一层点击，已并入这里。
  //
  // 分组名从「抓包分析」改成「分析管理」：加了导入这一路之后，「抓包分析」既当分组名
  // 又当子页名（菜单上会出现两条一模一样的「抓包分析」），且盖不住「导入文件」这种
  // 不算抓包的场景。改叫「分析管理」后，子页各叫各的。
  {
    path: "/grp-capture",
    name: "GroupCapture",
    meta: { title: "分析管理", icon: "DataAnalysis", showLink: true, rank: 6 },
    children: [
      {
        path: "/tshark",
        name: "Tshark",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"),
        meta: { title: "抓包分析", icon: "Search", showLink: true, rank: 1 },
      },
      {
        path: "/tshark-pcap",
        name: "TsharkPcap",
        component: () => import("@pages/monitor/src/views/tshark/ScTsharkPcapAnalysis.vue"),
        meta: { title: "PCAP 分析", icon: "Files", showLink: true, rank: 2 },
      },
      // 调试中心：@pages/debug 的 createCdpRoutes 现在只产出扁平的 /debug 叶子路由
      // （不自建分组），这里直接展开到「分析管理」下，排在两条抓包页之后。
      ...createCdpRoutes({ showLink: true, rank: 3 }),
    ],
  },

  // ==================== 数据中心 ====================
  // 数据源中心独立成顶层分组，不再挂在「监控管理」下。
  //
  // 「数据源中心」页本体是 @pages/datasource 的 ScDataSourceView（共享包，采集台也在用），
  // 各类数据源的管理页由 createDatasourceManageRoutes 产出（见文件末尾的顶层合并）。
  {
    path: "/grp-data",
    name: "GroupData",
    meta: { title: "数据中心", icon: "Coin", showLink: true, rank: 5 },
    children: [
      {
        path: "/datasource",
        name: "DataSource",
        component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
        meta: { title: "数据源中心", icon: "DataLine", showLink: true, rank: 1 },
      },
      {
        path: "/sync-tasks",
        name: "SyncTasks",
        // 数据同步：源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的表，
        // 执行由后端复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。
        component: () => import("@pages/datasource/src/views/sync/SyncTaskView.vue"),
        meta: { title: "数据同步", icon: "Refresh", showLink: true, rank: 2 },
      },
      {
        path: "/sync-task-logs",
        name: "SyncTaskLogs",
        // 同步日志：跨任务汇总每一次同步执行的旅程与过程日志（落库 ms_sync_task_run_log，
        // 保留 30 天），与「数据同步」页里按单任务查的内存日志弹窗互补。
        component: () => import("@pages/datasource/src/views/sync/SyncTaskLogView.vue"),
        meta: { title: "同步日志", icon: "Tickets", showLink: true, rank: 3 },
      },
    ],
  },

  // ==================== 主机管理 ====================
  // 完整二级菜单由 @pages/server 的 createServerHostRoutes 产出
  // （主机资产 / 远程控制 / ACME / 会话审计 / 批量作业 / 片段 / 维护计划 / 发布管理），
  // 视图、API、路由三者同源，宿主只做一行展开；/projects 等隐藏路由也一并展开到顶层。
  ...createServerHostRoutes({ activeMenu: "/assets" }),

  // ==================== 文件管理 ====================
  // 与「主机管理」平级的独立分组：文件服务器(FileStorageServerFilter)可由
  // monitor 的 MonitorFileStorageGatewayConfig 随应用启动，也是本机验收场景
  // （FS_API_TARGET=http://127.0.0.1:8082 指向同进程 8082）。
  // 开发环境（pnpm dev）通过 Vite 的 /fs、/localFileStorage、/local、/ot、
  // /config、/recycle 前缀代理转发，目标由 FS_API_TARGET 决定（见 vite.config.ts）。
  {
    path: "/grp-file",
    name: "GroupFile",
    meta: { title: "文件管理", icon: "Folder", showLink: true, rank: 12 },
    children: [
      {
        path: "/files",
        name: "FileAssets",
        component: () => import("@pages/filesystem/src/views/FileStorageManage.vue"),
        meta: { title: "文件资产", icon: "FolderOpened", showLink: true, rank: 1 },
      },
      {
        // 文件记录页更名「文件管理」：任务化分片上传的发起与状态展示
        // （后台时间轮 + 虚拟线程合并）。分组名同为「文件管理」，接受两级同名。
        path: "/upload-tasks",
        name: "UploadTasks",
        component: () => import("@pages/filesystem/src/views/UploadTaskView.vue"),
        meta: { title: "文件管理", icon: "Upload", showLink: true, rank: 2 },
      },
      {
        // 协同管理：在线表格协同文档的列表与权限管理
        path: "/file-collabs",
        name: "FileCollabs",
        component: () => import("@pages/filesystem/src/views/FileCollabManage.vue"),
        meta: { title: "协同管理", icon: "Grid", showLink: true, rank: 4 },
      },
    ],
  },

  // ==================== Docker ====================
  // Docker 是独立页面包（@pages/docker），页面内再分容器 / 镜像 / 网络 / 卷 /
  // 镜像库 / 模板六个页签。资产页右键「工作台 → Docker（独立页）」会带
  // /docker?hostId= 跳到这里，因此菜单项直接由包的工厂产出，宿主不再维护副本。
  ...createDockerRoutes(),

  // Group: 内网穿透 - 由 @pages/tunnel/src/routes 提供
  // /grp-tunnel 分组 + 单个 /tunnel 叶子（提供方是页面里的一个字段，不再分成两个菜单）
  ...createTunnelRoutes(),

  // ==================== 设备管理 ====================
  // 从「主机管理」中独立成组：主机与设备是两类平级资产，各自的入口直接可见。
  // 设备资产页已改为左侧组织树 + 右侧设备列表的 Deck 布局（含「全部」根节点），
  // 独立的「设备组织」页已随改造并入该页左侧；「通道管理」「设备日志」不再
  // 是独立菜单页，收敛为设备资产行右键菜单项，以抽屉方式嵌入打开。
  {
    path: "/grp-device",
    name: "GroupDevice",
    meta: { title: "设备管理", icon: "VideoCamera", showLink: true, rank: 11 },
    children: [
      {
        path: "/device-assets",
        name: "DeviceAssets",
        component: () => import("@pages/device/src/views/DeviceView.vue"),
        meta: { title: "设备资产", icon: "Histogram", showLink: true, rank: 11 },
      },
      {
        path: "/device-providers",
        name: "DeviceProviders",
        component: () => import("@pages/device/src/views/DeviceProviderView.vue"),
        meta: { title: "提供商配置", icon: "SetUp", showLink: true, rank: 12 },
      },
      // 独立的「设备分组」页已并入设备资产页左侧树（组织 / 分组 / 厂家 三分支），
      // 分组的新增 / 重命名 / 分配设备 / 删除全部收口在该树的分组右键菜单里。
      // 页面内入口：设备资产页的大屏按钮 / 右键「视频预览」/ 预览页的独立窗口，
      // 都不进侧边栏（showLink: false），只保证这些跳转在宿主里有落点。
      {
        path: "/device",
        redirect: "/device-assets",
        meta: { title: "设备资产", showLink: false, rank: 11 },
      },
      {
        path: "/device/screen",
        name: "DeviceScreen",
        component: () => import("@pages/device/src/views/DeviceScreenView.vue"),
        meta: { title: "设备大屏", showLink: false, rank: 14 },
      },
      {
        path: "/device/preview",
        name: "DevicePreview",
        component: () => import("@pages/device/src/views/DevicePreviewView.vue"),
        meta: { title: "视频预览", showLink: false, rank: 15 },
      },
      {
        // 视频墙：多选设备 → 布局向导 → 1/4/9/16 宫格，每格独立通道/码流/取流协议
        path: "/device/video-wall",
        name: "DeviceVideoWall",
        component: () => import("@pages/device/src/views/DeviceVideoWallView.vue"),
        meta: { title: "视频预览", showLink: false, rank: 15 },
      },
      {
        path: "/device/preview/standalone",
        name: "DevicePreviewStandalone",
        component: () => import("@pages/device/src/views/DevicePreviewView.vue"),
        props: { standalone: true },
        meta: { title: "视频预览", showLink: false, standalone: true, rank: 15 },
      },
    ],
  },

  // ==================== 远程控制 ====================
  // WebRTC 远程控制（桌面共享 + 键鼠遥控）：由 @pages/control 的 createControlRoutes 产出
  // （一级分组父节点 + 叶子页 /control/remote，界面与后端 API 同出 @pages/control）。
  ...createControlRoutes({ showLink: true }),

  // ==================== 账号管理 ====================
  // 统一账号（设备密钥 / 邮箱 / 短信）是「设备资产」的凭据来源，但与设备不是同一种资产：
  // 一个邮箱 / 短信账号可能同时被设备、模板、脚本引用，因此独立成组，不做设备页签。
  // 账号数据只落在 sys_account（后端 spring-support-account-starter），AI 的
  // sys_ai_provider_connection 与本页无关。
  {
    path: "/grp-account",
    name: "GroupAccount",
    meta: { title: "账号管理", icon: "Key", showLink: true, rank: 14 },
    children: [
      {
        // 账号管理（账号资产 + 模板管理 + 消息模板）：页面本体、API、隐藏子路由
        // 都在 @account/web（后端项目 spring-support-account-starter/web）里，
        // 宿主只挂这一条，不再各自维护模板库代码。
        path: "/account-assets",
        name: "AccountAssets",
        component: () => import("@account/web/src/account/views/ScAccountAssets.vue"),
        meta: { title: "账号资产", icon: "Key", showLink: true, rank: 1 },
      },
      // 模板工作台里的「打印机管理」「调用日志」及设计器/预览用 router.push({name}) 跳转，
      // 这些路由必须真实存在。showLink:false 保证它们不进侧边栏
      // （模板管理是账号管理页里的一个视图，不再是独立菜单）。
      ...templateChildRoutes,
      // 渠道管理：**直接复用** @pages/channel 的完整渠道页（渠道品牌表 / 绑定授权 +
      // SSE 取凭据 / 刷新 / 签到 / 模型开关 / ChatClient / 文生图），
      // 宿主只负责挂路由，不再抄一份 API 与绑定业务（抄两份必然漂）。
      {
        path: "/channel-assets",
        name: "ChannelAssets",
        component: () => import("@pages/channel/src/components/ChannelManagementPage.vue"),
        meta: { title: "渠道管理", icon: "Connection", showLink: true, rank: 2 },
      },
    ],
  },

  // 调试中心已并入上面的「分析管理」分组（/grp-capture → /debug），
  // 原先在这里展开 createCdpRoutes 的「运维管理」分组已删除。

  // ==================== 系统管理 ====================
  // 本分组只放 monitor 自己的运维页（代理管理 / 系统配置），接口都在 /ms/server/**；
  // 用户 / 角色 / 菜单 / 字典等系统域页面不在这里 —— 那是系统管理应用的事，
  // monitor 后端没有 /manage/**（见文件头的移除说明）。
  {
    path: "/grp-system",
    name: "GroupSystem",
    meta: { title: "系统管理", icon: "Setting", showLink: true, rank: 30 },
    children: [
      {
        // 原「监控配置」：内容（策略 / 规则 / 维护窗口）整体并入
        // 「告警管理 → 告警策略」，这里只留一条跳转，老书签不会 404。
        path: "/config",
        name: "Config",
        redirect: "/alarm-policies",
        meta: { title: "监控配置", icon: "Operation", showLink: false, rank: 30 },
      },
      {
        path: "/proxy",
        name: "Proxy",
        component: () => import("@pages/monitor/src/views/ProxyView.vue"),
        meta: { title: "代理管理", icon: "Connection", showLink: true, rank: 31 },
      },
      {
        path: "/groups",
        name: "Groups",
        component: () => import("@pages/server/src/views/ScGroupTree.vue"),
        meta: { title: "分组管理", icon: "Menu", showLink: false, rank: 32 },
      },
      {
        // monitor 自己的「系统配置」（Settings Console）：读 /ms/server/config、
        // /ms/server/sip/**，都在本应用后端里。
        path: "/system-config",
        name: "SystemConfigView",
        component: () => import("@pages/monitor/src/views/SystemConfigView.vue"),
        meta: { title: "系统配置", icon: "Tools", showLink: true, rank: 34 },
      },
      {
        // 兼容旧链接：账号管理已迁到「主机管理 → 主机账号」，
        // 旧书签 / 外部引用仍打 /account，这里静默改道，不留 404。
        path: "/account",
        name: "AccountLegacy",
        redirect: "/host-accounts",
        meta: { title: "主机账号", showLink: false, rank: 35 },
      },
    ],
  },

  // ==================== APM 观测 ====================
  // 一套按 SkyWalking 语义组织的观测台（总览 / 服务 / 端点 / 链路 / 拓扑 / 3D 基础设施 /
  // 多实体对比 / 指标 / 剖析 / 告警 / 告警分析 / 日志），
  // 路由由 @pages/apm 的 apmRoutes 产出（视图、API、路由同源）。
  //
  // 与「系统指标（/hotsport）」分开成组是刻意的：那套读的是自研 agent 的进程内数据，
  // 这套读的是统一 APM 接口（可能来自 SkyWalking OAP，也可能来自 hotspot agent）。
  // 两套并存时，用户能一眼看出「这台机器到底接了哪个 APM」——正是 @pages/apm 的 ApmGate 在回答的问题。
  //
  // showLink 用 getter 而不是字面量：本模块在 main.ts 顶部被 import，那一刻 app.yaml 还没加载，
  // 求值会永远拿到默认值 true。菜单是在 mount 之后由 buildMenuFromRoutes 展开的，
  // 届时配置已就绪，getter 才读得到真实的 apmConfig().enable。
  {
    path: "/grp-apm",
    name: "GroupApm",
    meta: {
      title: "APM 观测",
      icon: "DataLine",
      get showLink() {
        return apmConfig().enable;
      },
      rank: 13,
    },
    children: apmRoutes,
  },

  // ==================== 日志（已移除） ====================
  // 原「日志管理」分组（/grp-logs → /logs/sys、/logs/user）指向 @pages/system 的
  // SysLogManage / UserLogManage，后端是 /manage/**，monitor 没有 —— 同属本次移除的
  // 系统域页面。主机侧真正的日志是「主机资产 → 某台服务器 → 日志」页签
  // （ScHostLogs，读 journalctl / wevtutil），与本分组无关。

  // ==================== 各功能包的隐藏路由合并 ====================
  // 以下几组路由的声明在各自的功能包里（视图、API、路由同源），宿主只做合并，
  // 全部 showLink:false（不进侧边栏），由所属列表页「打开管理」进入。

  // 监控侧：服务管理（协议服务器节点，进菜单）+ 服务发现 + 在线节点（隐藏）。
  // P2P 房间工作台不占菜单也不占路由：它是服务管理页里的一个工作区页签。
  ...createMonitorRoutes({ activeMenu: "/services" }),
  ...createMonitorManageRoutes({ activeMenu: "/services" }),

  // 数据源管理页：全部 showLink:false（不进侧边栏），由「数据中心」的「打开管理」进入，
  // 侧边栏仍停在 /datasource 上。activeMenu 指向本应用的数据源列表路径。
  ...createDatasourceManageRoutes({ activeMenu: "/datasource" }),

  // 功能包路由：@pages/system 已整体移除（见文件头的移除说明）——
  // monitor 后端没有任何 /manage/** 实现，16 个系统域页面只会让侧边栏多出一堆点开即 404 的条目。
  //
  // 2026-11-02 的 395b0c4b25 曾把 achievement / collect / job / message / signin / task
  // 六个包一起并入，同样只接了前端、没接后端，且多数包在 monitor 里没有对应 starter：
  //   - achievement / signin：后端只在系统管理应用（18170），monitor 的 /achievement、/signin
  //     在 /actuator/mappings 里计数为 0，菜单标题也因缺 i18n key 直接显示 menu.achievement；
  //   - collect：采集调度一体化平台（18190）的能力，monitor 无 /v2/collect；其中顶级
  //     /collect/datasource/list 还和本站「数据中心 → 数据源中心」重复（同一个 ScDataSourceView）；
  //   - message：monitor 只有 send/log/template/站内信，没有 pages/message 需要的
  //     provider CRUD 与 channel/list；provider 实现所在的 message-starter 与 system-starter
  //     同名 Bean 冲突，不能同进程引入；
  //   - task：唯一实现 taskdistribution-starter 没有任何应用引入，monitor 无 /v2/taskdistribution；
  //   - job：job-starter 虽在 monitor 的 jar 里，但 plugin.job.manage.enable 默认 false，
  //     前端也没配 url.jobApi，调度中心整组接口 404。将来要恢复调度页需同时满足两处配置
  //     （app.yaml 增加 urlConfig.jobApi: /v2/job + 后端 --plugin.job.manage.enable=true），
  //     再重新 import jobRoutes。
  //

  // ==================== 隐藏路由（不进菜单，仍可访问） ====================
  {
    // 关系图组件能力验收台：不挂侧边栏，仅供验收脚本访问
    path: "/re-relation-graph-lab",
    name: "ReRelationGraphLab",
    component: () => import("@pages/monitor/src/views/ReRelationGraphLab.vue"),
    meta: { title: "关系图验收台", icon: "Share", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 表格组件能力验收台：验证「远程数据异步化 + 按钮动画」，不挂侧边栏
    path: "/re-table-lab",
    name: "ReTableLab",
    component: () => import("@pages/monitor/src/views/ReTableLab.vue"),
    meta: { title: "表格验收台", icon: "Grid", showLink: false, activeMenu: "/datasource" },
  },
  {
    // 远程选择类组件能力验收台：ReSelect / ReRemoteSelect / ReSearch / ReFilter / ReTree
    path: "/re-remote-select-lab",
    name: "ReRemoteSelectLab",
    component: () => import("@pages/monitor/src/views/ReRemoteSelectLab.vue"),
    meta: { title: "远程组件验收台", icon: "Select", showLink: false, activeMenu: "/datasource" },
  },

  // ==================== 独立全屏路由（不套 layout，不进菜单） ====================
  {
    // 协同管理分享链接：hash 模式下跳转 #/file-collabs/share/:id，
    // standalone 让 registerRoutesUnderLayout 注册为顶层路由（无侧边栏/顶栏）。
    path: "/file-collabs/share/:id",
    name: "FileCollabShare",
    component: () => import("@pages/filesystem/src/views/FileCollabShareView.vue"),
    meta: { title: "协同分享", showLink: false, standalone: true },
  },
  {
    // 协同文档全屏编辑：新标签页打开 #/file-collabs/edit/:id，
    // 无侧边栏、无返回栏，专注编辑；保存由编辑器内部定时异步完成。
    path: "/file-collabs/edit/:id",
    name: "FileCollabEdit",
    component: () => import("@pages/filesystem/src/views/FileCollabEditView.vue"),
    meta: { title: "协同编辑", showLink: false, standalone: true },
  },
  {
    path: "/terminal-standalone",
    name: "TerminalStandalone",
    component: () => import("@pages/server/src/views/StandaloneTerminal.vue"),
    meta: { title: "远程控制", showLink: false, standalone: true },
  },
  {
    // 虚拟桌面：主入口是「主机资产」右侧工作区里的一个页签（与远控 / 文件管理平级），
    // 由 AssetsView 的 openDesktop 直接 openTab，不经过路由跳转。
    //
    // 这里只留一条兼容跳板：旧的 /desktop/:hostId 书签落到主机资产深链
    // （/assets?hostId=13&tab=desktop），落地后由 applyDeepLink 打开那个桌面页签。
    // 桌面是按主机开的，所以也不给它挂在全局侧边栏上。
    path: "/desktop/:hostId?",
    name: "VirtualDesktop",
    redirect: (to) => {
      const raw = Array.isArray(to.params.hostId) ? to.params.hostId[0] : to.params.hostId;
      return {
        path: "/assets",
        query: raw ? { hostId: String(raw), tab: "desktop" } : { tab: "desktop" },
      };
    },
  },
  {
    // 桌面窗口的独立弹出页：窗口标题栏的「在新标签页打开」走这里。
    // standalone 保证新标签页里只渲染那一个窗口（没有侧边栏 / 页签栏 / Dock）。
    path: "/desktop-window/:hostId?",
    name: "VirtualDesktopWindow",
    component: () => import("@pages/server/src/views/desktop/DesktopView.vue"),
    meta: { title: "虚拟桌面", showLink: false, standalone: true },
  },
];

export default monitorRoutes;
