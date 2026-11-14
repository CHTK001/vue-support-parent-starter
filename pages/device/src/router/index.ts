/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备台账（左侧单树含 组织 / 分组 / 厂家，拓扑在抽屉中打开）
 * - /device/provider  厂商接入（接入凭据 / 厂商任务 2 个页签）
 * - /device/topo      机房拓扑独立页（外部直达用，无菜单入口）
 * - /device/tasks     路由别名 → 厂商接入（tab=tasks）
 *
 * 分组 / 拓扑 / 定时任务都是页面内能力，不再出现在一级菜单里；路由里只保留
 * 「设备台账」与「厂商接入」两个真实入口，否则 url 指向已不存在的独立页签。
 */
import type { RouteConfigsTable } from '@repo/core'

export const deviceRoutes: RouteConfigsTable[] = [
  {
    path: '/device',
    name: 'DeviceHome',
    component: () => import('../views/DeviceView.vue'),
    meta: {
      title: '设备台账',
      icon: 'VideoCamera',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 11
    }
  },
  {
    path: '/device/provider',
    name: 'DeviceProvider',
    component: () => import('../views/DeviceProviderView.vue'),
    meta: {
      title: '厂商接入',
      icon: 'Connection',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 12
    }
  },
  {
    path: '/device/preview',
    name: 'DevicePreview',
    component: () => import('../views/DevicePreviewView.vue'),
    props: { standalone: false },
    meta: {
      title: '视频预览',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      rank: 14
    }
  },
  {
    // 独立窗口形态：只在页面内留预览墙与工具条，无外壳
    path: '/device/preview/standalone',
    name: 'DevicePreviewStandalone',
    component: () => import('../views/DevicePreviewView.vue'),
    props: { standalone: true },
    meta: {
      title: '视频预览',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      remind: true,
      rank: 14
    }
  },
  {
    // 视频墙（多选设备 → 布局向导 → 视频墙）：1 / 4 / 9 / 16 宫格，每格独立通道/码流/取流协议
    path: '/device/video-wall',
    name: 'DeviceVideoWall',
    component: () => import('../views/DeviceVideoWallView.vue'),
    meta: {
      title: '视频预览',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      rank: 14
    }
  },
  {
    // 路由别名：定时任务是厂商的功能，收敛到厂商接入的「厂商任务」页签
    path: '/device/tasks',
    name: 'DeviceTasks',
    component: () => import('../views/DeviceTaskView.vue'),
    redirect: '/device/provider?tab=tasks',
    meta: {
      title: '定时任务',
      icon: 'Timer',
      /** 定时任务属于厂商维度的能力，收起为厂商接入页签 */
      showLink: false,
      keepAlive: true,
      isVisible: '0',
      rank: 16
    }
  },
  {
    // 机房拓扑：台账内通过右键在抽屉中查看；本路由供外部直达（无菜单入口）
    path: '/device/topo',
    name: 'DeviceTopo',
    component: () => import('../views/DeviceTopoView.vue'),
    meta: {
      title: '机房拓扑',
      icon: 'Grid',
      showLink: false,
      keepAlive: true,
      isVisible: '0',
      rank: 17
    }
  },
  {
    path: '/device/screen',
    name: 'DeviceScreen',
    component: () => import('../views/DeviceScreenView.vue'),
    meta: {
      title: '设备大屏',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      rank: 15
    }
  },
  {
    // 设备大屏独立页：台账「设备大屏」页签里的「新标签打开」跳到这里，
    // 宿主把它注册为 standalone（无侧边栏/页签栏），整屏只有画面墙。
    path: '/device/wall',
    name: 'DeviceWall',
    component: () => import('../views/DeviceWallView.vue'),
    meta: {
      title: '设备大屏',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      rank: 15
    }
  },
  {
    path: '/device/vehicle',
    name: 'DeviceVehicle',
    component: () => import('../views/DeviceVehicleView.vue'),
    meta: {
      title: '车辆管理',
      icon: 'Van',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 13
    }
  },
  {
    path: '/device/vehicle-pass',
    name: 'DeviceVehiclePass',
    component: () => import('../views/DeviceVehiclePassView.vue'),
    meta: {
      title: '过车记录',
      icon: 'Tickets',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 14
    }
  },
  {
    path: '/device/attendance',
    name: 'DeviceAttendance',
    component: () => import('../views/DeviceAttendanceView.vue'),
    meta: {
      title: '考勤记录',
      icon: 'Clock',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 15
    }
  },
  {
    // 设备日志：按设备拉取事件；之前只在台账右键页签里出现，补一个可直达的路由
    path: '/device/events',
    name: 'DeviceEvents',
    component: () => import('../views/DeviceEventLogView.vue'),
    meta: {
      title: '设备日志',
      icon: 'Document',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 17
    }
  },
  {
    path: '/device/access',
    name: 'DeviceAccess',
    component: () => import('../views/DeviceAccessRecordView.vue'),
    meta: {
      title: '门禁记录',
      icon: 'Door',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 16
    }
  },
  {
    path: '/device/person',
    name: 'DevicePerson',
    component: () => import('../views/DevicePersonView.vue'),
    meta: {
      title: '人员管理',
      icon: 'User',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 17
    }
  },
  {
    // 传感器记录：环境指标的历史读数，落点是时序引擎（plugin.device.timeseries.engine）。
    // 与「设备详情 → 环境指标」（最新快照）互补：一个看现在，一个看趋势。
    path: '/device/metric-history',
    name: 'DeviceMetricHistory',
    component: () => import('../views/DeviceMetricHistoryView.vue'),
    meta: {
      title: '传感器记录',
      icon: 'Odometer',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 18
    }
  },
]

/**
 * 设备管理静态菜单（一级菜单，展开为设备台账、厂商接入、车辆管理、过车、考勤、门禁与人员）
 * 定时任务 / 分组 / 拓扑已收起为这两个菜单内的页签，不再出现在菜单中。
 */
export const deviceMenus = [
  {
    path: '/device',
    name: 'DeviceRoot',
    redirect: '/device',
    meta: {
      title: '设备管理',
      icon: 'VideoCamera',
      isVisible: '1'
    },
    children: [
      {
        path: '/device',
        name: 'DeviceHome',
        meta: { title: '设备台账', icon: 'Monitor', isVisible: '1' }
      },
      {
        path: '/device/provider',
        name: 'DeviceProvider',
        meta: { title: '厂商接入', icon: 'Connection', isVisible: '1' }
      },
      {
        path: '/device/vehicle',
        name: 'DeviceVehicle',
        meta: { title: '车辆管理', icon: 'Van', isVisible: '1' }
      },
      {
        path: '/device/vehicle-pass',
        name: 'DeviceVehiclePass',
        meta: { title: '过车记录', icon: 'Tickets', isVisible: '1' }
      },
      {
        path: '/device/attendance',
        name: 'DeviceAttendance',
        meta: { title: '考勤记录', icon: 'Clock', isVisible: '1' }
      },
      {
        path: '/device/access',
        name: 'DeviceAccess',
        meta: { title: '门禁记录', icon: 'Door', isVisible: '1' }
      },
      {
        path: '/device/person',
        name: 'DevicePerson',
        meta: { title: '人员管理', icon: 'User', isVisible: '1' }
      },
      {
        path: '/device/metric-history',
        name: 'DeviceMetricHistory',
        meta: { title: '传感器记录', icon: 'Odometer', isVisible: '1' }
      }
    ]
  }
]
