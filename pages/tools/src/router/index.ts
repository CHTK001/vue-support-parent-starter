  {
    path: '/color-picker',
    name: 'color-picker',
    component: () => import('../plugins/color-picker.vue'),
    meta: {
      title: '颜色选择器',
      icon: 'ri:palette-line'
    }
  },
  {
    path: '/pomodoro',
    name: 'pomodoro',
    component: () => import('../plugins/pomodoro.vue'),
    meta: {
      title: '番茄工作法',
      icon: 'ri:timer-line'
    }
  } 