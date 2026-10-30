/**
 * 模板库路由表 + 静态菜单表
 *
 * 路由挂在 layout 之下：
 * - /template              模板库（列表 + 右键菜单）
 * - /template/designer/:id 模板设计器（拖拽式设计 + 打印预览）
 * - /template/preview/:id  模板预览（不含设计器外壳的只读预览）
 *
 * isVisible = "1" 才能在 koi 主题侧边栏中显示。
 */
import type { RouteConfigsTable } from '@repo/core'

export const templateRoutes: RouteConfigsTable[] = [
  {
    path: '/template',
    name: 'TemplateHome',
    component: () => import('../views/TemplateView.vue'),
    meta: {
      title: '模板库',
      icon: 'MagicStick',
      showLink: true,
      keepAlive: true,
      isVisible: '1',
      rank: 21
    }
  },
  {
    path: '/template/designer/:id',
    name: 'TemplateDesigner',
    component: () => import('../views/TemplateDesigner.vue'),
    props: true,
    meta: {
      title: '模板设计器',
      showLink: false,
      keepAlive: false,
      isVisible: '0'
    }
  },
  {
    path: '/template/preview/:id',
    name: 'TemplatePreview',
    component: () => import('../views/TemplatePreviewView.vue'),
    props: true,
    meta: {
      title: '模板预览',
      showLink: false,
      keepAlive: false,
      isVisible: '0'
    }
  }
]

/**
 * 模板库静态菜单（一级菜单，挂载于“系统管理”下方）
 */
export const templateMenus = [
  {
    path: '/template',
    name: 'TemplateRoot',
    redirect: '/template',
    meta: {
      title: '系统管理',
      icon: 'MagicStick',
      isVisible: '1'
    },
    children: [
      {
        path: '/template',
        name: 'TemplateHome',
        meta: { title: '模板库', icon: 'Monitor', isVisible: '1' }
      }
    ]
  }
]
