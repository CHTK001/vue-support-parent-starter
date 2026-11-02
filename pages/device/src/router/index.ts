/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备台账（设备列表 / 机房拓扑 2 个页签，分组/拓扑全部在页面内）
 * - /device/provider  厂商接入（接入凭据 / 厂商任务 2 个页签）
 * - /device/topo      路由别名 → 设备台账（tab=topo）
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
  }
]

/**
 * 设备管理静态菜单（一级菜单，展开为设备台账与厂商接入）
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
      }
    ]
  }
]
