/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备台账（列表 + 详情抽屉）
 * - /device/provider  厂商接入（AK/SK 凭据与厂商元数据）
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
      }
    ]
  }
]
