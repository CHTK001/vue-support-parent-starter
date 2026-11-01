/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备台账（列表 + 详情抽屉）
 * - /device/provider  厂商接入（AK/SK 凭据与厂商元数据）
 * - /device/groups    设备分组
 * - /device/topo      机房拓扑（区域 → 网段 → 设备 → 通道）
 * - /device/tasks     定时任务（时间轮任务状态与间隔）
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示。
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
    meta: {
      title: '设备分组',
      icon: 'FolderOpened',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
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
    path: '/device/tasks',
    name: 'DeviceTasks',
    component: () => import('../views/DeviceTaskView.vue'),
    meta: {
      title: '定时任务',
      icon: 'Timer',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 16
    }
  },
  {
    path: '/device/topo',
    name: 'DeviceTopo',
    component: () => import('../views/DeviceTopoView.vue'),
    meta: {
      title: '机房拓扑',
      icon: 'Grid',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
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
