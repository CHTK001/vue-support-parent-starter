/**
 * 设备管理路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /device           设备工作台（设备卡牌 + 详情面板）
 * - /device/providers 提供商配置（厂商 AK/SK 凭据，卡牌式）
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
      title: '设备工作台',
      icon: 'Monitor',
      showLink: true,
      keepAlive: true,
      isVisible: '1'
    }
  },
  {
    path: '/device/providers',
    name: 'DeviceProviders',
    component: () => import('../views/DeviceProviderView.vue'),
    meta: {
      title: '提供商配置',
      icon: 'Connection',
      showLink: true,
      keepAlive: true,
      isVisible: '1'
    }
  }
]

/**
 * 设备管理静态菜单（一级菜单，展开为设备工作台 / 提供商配置）
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
        meta: { title: '设备工作台', icon: 'Monitor', isVisible: '1' }
      },
      {
        path: '/device/providers',
        name: 'DeviceProviders',
        meta: { title: '提供商配置', icon: 'Connection', isVisible: '1' }
      }
    ]
  }
]
