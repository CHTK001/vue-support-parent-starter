/* eslint-disable */
/* prettier-ignore */
// Generated by elegant-router
// Read more: https://github.com/soybeanjs/elegant-router

import type { GeneratedRoute } from '@elegant-router/types';

export const generatedRoutes: GeneratedRoute[] = [
  {
    name: '403',
    path: '/403',
    component: 'layout.blank$view.403',
    meta: {
      title: '403',
      i18nKey: 'route.403',
      constant: true,
      hideInMenu: true
    }
  },
  {
    name: '404',
    path: '/404',
    component: 'layout.blank$view.404',
    meta: {
      title: '404',
      i18nKey: 'route.404',
      constant: true,
      hideInMenu: true
    }
  },
  {
    name: '500',
    path: '/500',
    component: 'layout.blank$view.500',
    meta: {
      title: '500',
      i18nKey: 'route.500',
      constant: true,
      hideInMenu: true
    }
  },
  {
    name: 'about',
    path: '/about',
    component: 'layout.base$view.about',
    meta: {
      title: 'about',
      i18nKey: 'route.about',
      icon: 'fluent:book-information-24-regular',
      order: 999
    }
  },
  {
    name: 'function',
    path: '/function',
    component: 'layout.base',
    meta: {
      title: 'function',
      i18nKey: 'route.function',
      icon: 'icon-park-outline:all-application',
      order: 6
    },
    children: [
      {
        name: 'function_hide-child',
        path: '/function/hide-child',
        meta: {
          title: 'function_hide-child',
          i18nKey: 'route.function_hide-child',
          icon: 'material-symbols:filter-list-off',
          order: 2
        },
        redirect: '/function/hide-child/one',
        children: [
          {
            name: 'function_hide-child_one',
            path: '/function/hide-child/one',
            component: 'view.function_hide-child_one',
            meta: {
              title: 'function_hide-child_one',
              i18nKey: 'route.function_hide-child_one',
              icon: 'material-symbols:filter-list-off',
              hideInMenu: true,
              activeMenu: 'function_hide-child'
            }
          },
          {
            name: 'function_hide-child_three',
            path: '/function/hide-child/three',
            component: 'view.function_hide-child_three',
            meta: {
              title: 'function_hide-child_three',
              i18nKey: 'route.function_hide-child_three',
              hideInMenu: true,
              activeMenu: 'function_hide-child'
            }
          },
          {
            name: 'function_hide-child_two',
            path: '/function/hide-child/two',
            component: 'view.function_hide-child_two',
            meta: {
              title: 'function_hide-child_two',
              i18nKey: 'route.function_hide-child_two',
              hideInMenu: true,
              activeMenu: 'function_hide-child'
            }
          }
        ]
      },
      {
        name: 'function_multi-tab',
        path: '/function/multi-tab',
        component: 'view.function_multi-tab',
        meta: {
          title: 'function_multi-tab',
          i18nKey: 'route.function_multi-tab',
          icon: 'ic:round-tab',
          multiTab: true,
          hideInMenu: true,
          activeMenu: 'function_tab'
        }
      },
      {
        name: 'function_request',
        path: '/function/request',
        component: 'view.function_request',
        meta: {
          title: 'function_request',
          i18nKey: 'route.function_request',
          icon: 'carbon:network-overlay',
          order: 3
        }
      },
      {
        name: 'function_super-page',
        path: '/function/super-page',
        component: 'view.function_super-page',
        meta: {
          title: 'function_super-page',
          i18nKey: 'route.function_super-page',
          icon: 'ic:round-supervisor-account',
          order: 5,
          roles: ['R_SUPER']
        }
      },
      {
        name: 'function_tab',
        path: '/function/tab',
        component: 'view.function_tab',
        meta: {
          title: 'function_tab',
          i18nKey: 'route.function_tab',
          icon: 'ic:round-tab',
          order: 1
        }
      },
      {
        name: 'function_toggle-auth',
        path: '/function/toggle-auth',
        component: 'view.function_toggle-auth',
        meta: {
          title: 'function_toggle-auth',
          i18nKey: 'route.function_toggle-auth',
          icon: 'ic:round-construction',
          order: 4
        }
      }
    ]
  },
  {
    name: 'home',
    path: '/home',
    component: 'layout.base$view.home',
    meta: {
      title: 'home',
      i18nKey: 'route.home',
      icon: 'mdi:monitor-dashboard',
      order: 1
    }
  },
  {
    name: 'iframe-page',
    path: '/iframe-page/:url',
    component: 'layout.base$view.iframe-page',
    props: true,
    meta: {
      title: 'iframe-page',
      i18nKey: 'route.iframe-page',
      constant: true,
      hideInMenu: true,
      keepAlive: true
    }
  },
  {
    name: 'login',
    path: '/login/:module(pwd-login|code-login|register|reset-pwd|bind-wechat)?',
    component: 'layout.blank$view.login',
    props: true,
    meta: {
      title: 'login',
      i18nKey: 'route.login',
      constant: true,
      hideInMenu: true
    }
  },
  {
    name: 'manage',
    path: '/manage',
    component: 'layout.base',
    meta: {
      title: 'manage',
      i18nKey: 'route.manage',
      icon: 'carbon:cloud-service-management',
      order: 9,
      roles: ['R_ADMIN']
    },
    children: [
      {
        name: 'manage_dict',
        path: '/manage/dict',
        component: 'view.manage_dict',
        meta: {
          title: 'manage_dict',
          i18nKey: 'route.manage_dict'
        }
      },
      {
        name: 'manage_menu',
        path: '/manage/menu',
        component: 'view.manage_menu',
        meta: {
          title: 'manage_menu',
          i18nKey: 'route.manage_menu',
          icon: 'material-symbols:route',
          order: 3,
          roles: ['R_ADMIN'],
          keepAlive: true
        }
      },
      {
        name: 'manage_org',
        path: '/manage/org',
        component: 'view.manage_org',
        meta: {
          title: 'manage_org',
          i18nKey: 'route.manage_org'
        }
      },
      {
        name: 'manage_position',
        path: '/manage/position',
        component: 'view.manage_position',
        meta: {
          title: 'manage_position',
          i18nKey: 'route.manage_position'
        }
      },
      {
        name: 'manage_role',
        path: '/manage/role',
        component: 'view.manage_role',
        meta: {
          title: 'manage_role',
          i18nKey: 'route.manage_role',
          icon: 'carbon:user-role',
          order: 2,
          roles: ['R_SUPER']
        }
      },
      {
        name: 'manage_user',
        path: '/manage/user',
        component: 'view.manage_user',
        meta: {
          title: 'manage_user',
          i18nKey: 'route.manage_user',
          icon: 'ic:round-manage-accounts',
          order: 1,
          roles: ['R_ADMIN']
        }
      },
      {
        name: 'manage_user-detail',
        path: '/manage/user-detail/:id',
        component: 'view.manage_user-detail',
        props: true,
        meta: {
          title: 'manage_user-detail',
          i18nKey: 'route.manage_user-detail',
          hideInMenu: true,
          roles: ['R_ADMIN'],
          activeMenu: 'manage_user'
        }
      }
    ]
  },
  {
    name: 'monitor',
    path: '/monitor',
    component: 'layout.base',
    meta: {
      title: 'monitor',
      i18nKey: 'route.monitor'
    },
    children: [
      {
        name: 'monitor_cache',
        path: '/monitor/cache',
        component: 'view.monitor_cache',
        meta: {
          title: 'monitor_cache',
          i18nKey: 'route.monitor_cache'
        }
      },
      {
        name: 'monitor_logs',
        path: '/monitor/logs',
        meta: {
          title: 'monitor_logs',
          i18nKey: 'route.monitor_logs'
        },
        children: [
          {
            name: 'monitor_logs_error',
            path: '/monitor/logs/error',
            component: 'view.monitor_logs_error',
            meta: {
              title: 'monitor_logs_error',
              i18nKey: 'route.monitor_logs_error'
            }
          },
          {
            name: 'monitor_logs_login',
            path: '/monitor/logs/login',
            component: 'view.monitor_logs_login',
            meta: {
              title: 'monitor_logs_login',
              i18nKey: 'route.monitor_logs_login'
            }
          },
          {
            name: 'monitor_logs_operation',
            path: '/monitor/logs/operation',
            component: 'view.monitor_logs_operation',
            meta: {
              title: 'monitor_logs_operation',
              i18nKey: 'route.monitor_logs_operation'
            }
          },
          {
            name: 'monitor_logs_scheduler',
            path: '/monitor/logs/scheduler',
            component: 'view.monitor_logs_scheduler',
            meta: {
              title: 'monitor_logs_scheduler',
              i18nKey: 'route.monitor_logs_scheduler'
            }
          }
        ]
      },
      {
        name: 'monitor_scheduler',
        path: '/monitor/scheduler',
        component: 'view.monitor_scheduler',
        meta: {
          title: 'monitor_scheduler',
          i18nKey: 'route.monitor_scheduler'
        }
      },
      {
        name: 'monitor_system',
        path: '/monitor/system',
        component: 'view.monitor_system',
        meta: {
          title: 'monitor_system',
          i18nKey: 'route.monitor_system'
        }
      }
    ]
  },
  {
    name: 'multi-menu',
    path: '/multi-menu',
    component: 'layout.base',
    meta: {
      title: 'multi-menu',
      i18nKey: 'route.multi-menu',
      order: 8
    },
    children: [
      {
        name: 'multi-menu_first',
        path: '/multi-menu/first',
        meta: {
          title: 'multi-menu_first',
          i18nKey: 'route.multi-menu_first',
          order: 1
        },
        children: [
          {
            name: 'multi-menu_first_child',
            path: '/multi-menu/first/child',
            component: 'view.multi-menu_first_child',
            meta: {
              title: 'multi-menu_first_child',
              i18nKey: 'route.multi-menu_first_child'
            }
          }
        ]
      },
      {
        name: 'multi-menu_second',
        path: '/multi-menu/second',
        meta: {
          title: 'multi-menu_second',
          i18nKey: 'route.multi-menu_second',
          order: 2
        },
        children: [
          {
            name: 'multi-menu_second_child',
            path: '/multi-menu/second/child',
            meta: {
              title: 'multi-menu_second_child',
              i18nKey: 'route.multi-menu_second_child'
            },
            children: [
              {
                name: 'multi-menu_second_child_home',
                path: '/multi-menu/second/child/home',
                component: 'view.multi-menu_second_child_home',
                meta: {
                  title: 'multi-menu_second_child_home',
                  i18nKey: 'route.multi-menu_second_child_home'
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'user-center',
    path: '/user-center',
    component: 'layout.base$view.user-center',
    meta: {
      title: 'user-center',
      i18nKey: 'route.user-center',
      hideInMenu: true,
      constant: true
    }
  }
];