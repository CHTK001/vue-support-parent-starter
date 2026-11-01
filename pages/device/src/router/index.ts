/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备台账（设备列表 / 分组管理 / 机房拓扑 3 个页签）
 * - /device/provider  厂商接入（接入凭据 / 厂商任务 2 个页签）
 * - /device/groups    路由别名 → 设备台账（tab=groups）
 * - /device/topo      路由别名 → 设备台账（tab=topo）
 * - /device/tasks     路由别名 → 厂商接入（tab=tasks）
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示；整体只有「设备台账」与「厂商接入」两个菜单，
 * 其余页签通过 showLink: false / isVisible: '0' 隐藏，再通过 redirect 把遗留 URL 导回原处。
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
    path: '/device/groups',
    name: 'DeviceGroup',
    component: () => import('../views/DeviceGroupView.vue'),
    redirect: '/device?tab=groups',
    meta: {
      title: '设备分组',
      icon: 'FolderOpened',
      /** 分组是设备的属性，收敛为设备台账页签，不再作为独立菜单 */
      showLink: false,
      keepAlive: true,
      isVisible: '0',
      rank: 13
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
    // 路由别名：机房拓扑收敛到设备台账页签，不影响单机渲染
    path: '/device/topo',
    name: 'DeviceTopo',
    component: () => import('../views/DeviceTopoView.vue'),
    redirect: '/device?tab=topo',
    meta: {
      title: '机房拓扑',
      icon: 'Grid',
      /** 机房拓扑是设备台账的页签，不再作为独立菜单 */
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
        path: '/device/groups',
        name: 'DeviceGroup',
        meta: { title: '设备分组', icon: 'FolderOpened', isVisible: '1' }
      },
      {
        path: '/device/tasks',
        name: 'DeviceTasks',
        meta: { title: '定时任务', icon: 'Timer', isVisible: '1' }
      },
      {
        path: '/device/topo',
        name: 'DeviceTopo',
        meta: { title: '机房拓扑', icon: 'Grid', isVisible: '1' }
      }
    ]
  }
]
