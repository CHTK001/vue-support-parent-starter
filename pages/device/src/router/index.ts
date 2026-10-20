/**
 * 设备管理路由树（RouteConfigsTable[]）
 *
<<<<<<< HEAD
 * 路由挂在 layout 之下：
 * - /device           设备台账（列表 + 详情抽屉）
 * - /device/provider  厂商接入（AK/SK 凭据与厂商元数据）
=======
 * 分组结构：一级为「设备管理」分组父节点（仅作侧边栏分组标题 + 折叠展开，无 component、无 redirect），
 * 二级为具体业务页面（叶子路由，带 component）。
 *
 * 装配说明（由 @repo/app 的 createContextApp 完成，宿主只管交出这棵树）：
 *   - 菜单：buildMenuFromRoutes 递归保留 children → 侧边栏渲染成可折叠的二级菜单。
 *   - 路由：registerRoutesUnderLayout 递归 visit，只把「带 component」或「带 redirect」的节点
 *     挂到 layout 之下；分组父节点两者皆无，因此只作菜单容器，不会注册成路由。
 *
 * 分组口径与监控管理平台的「设备管理」保持一致（设备资产 / 设备组织 / 通道管理 / 设备日志 /
 * 提供商配置），另加两页设备侧专属入口：
 *   - 设备预览    多路实时画面墙（摄像机设备），另有 /device/preview/standalone 独立窗口形态；
 *   - 门禁记录    通行记录查询 + 远程开门（门禁/门口机设备）。
 * 分组名用「设备管理」而非「设备资产」：组内已不止资产台账。
>>>>>>> feat/device-stream
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示。
 *
 * @author CH
 * @since 4.0.0.42
 */
import type { RouteConfigsTable } from '@repo/core'

export const deviceRoutes: RouteConfigsTable[] = [
  {
    path: '/grp-device',
    name: 'GroupDevice',
    meta: {
      title: '设备台账',
      icon: 'VideoCamera',
      showLink: true,
<<<<<<< HEAD
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
    path: '/device/video-wall',
    name: 'DeviceVideoWall',
    component: () => import('../views/DeviceVideoWallView.vue'),
    meta: {
      title: '视频预览',
      showLink: false,
      keepAlive: false,
      isVisible: '0',
      rank: 13
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
      rank: 14
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
=======
>>>>>>> feat/device-stream
      isVisible: '1'
    },
    children: [
      {
        path: '/device',
        name: 'DeviceHome',
<<<<<<< HEAD
        meta: { title: '设备台账', icon: 'Monitor', isVisible: '1' }
      },
      {
        path: '/device/provider',
        name: 'DeviceProvider',
        meta: { title: '厂商接入', icon: 'Connection', isVisible: '1' }
=======
        component: () => import('../views/DeviceView.vue'),
        meta: {
          title: '设备资产',
          icon: 'Monitor',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
      },
      {
        path: '/device/orgs',
        name: 'DeviceOrgs',
        component: () => import('../views/DeviceOrganizationView.vue'),
        meta: {
          title: '设备组织',
          icon: 'FolderOpened',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
      },
      {
        path: '/device/channels',
        name: 'DeviceChannels',
        component: () => import('../views/DeviceChannelView.vue'),
        meta: {
          title: '通道管理',
          icon: 'Connection',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
      },
      {
        path: '/device/events',
        name: 'DeviceEvents',
        component: () => import('../views/DeviceEventLogView.vue'),
        meta: {
          title: '设备日志',
          icon: 'Tickets',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
      },
      {
        path: '/device/preview',
        name: 'DevicePreview',
        component: () => import('../views/DevicePreviewView.vue'),
        meta: {
          title: '设备预览',
          icon: 'VideoPlay',
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
          icon: 'Setting',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
      },
      {
        path: '/device/access',
        name: 'DeviceAccess',
        component: () => import('../views/DeviceAccessRecordView.vue'),
        meta: {
          title: '门禁记录',
          icon: 'Lock',
          showLink: true,
          keepAlive: true,
          isVisible: '1'
        }
>>>>>>> feat/device-stream
      }
    ]
  },
  // ==================== 独立全屏路由（不套 layout，不进菜单） ====================
  // 设备预览「新窗口打开」：只留左侧设备 + 右侧画面，由 registerRoutesUnderLayout
  // 按 meta.standalone 注册到顶层；props 把 standalone 形态注入同一个视图组件。
  // 墙面状态不写地址栏（改了 query 会触发路由重渲染），两个窗口读同一份本机缓存。
  {
    path: '/device/preview/standalone',
    name: 'DevicePreviewStandalone',
    component: () => import('../views/DevicePreviewView.vue'),
    props: { standalone: true },
    meta: {
      title: '设备预览（独立窗口）',
      showLink: false,
      standalone: true
    }
  }
]
