// 容器监控小组件配置
export const containerMonitorWidget = {
  id: 'container-monitor',
  title: '容器监控',
  description: '实时监控Docker容器资源使用情况',
  icon: 'ri:dashboard-line',
  component: () => import('./ContainerMonitorWidget.vue'),
  type: 2, // 2表示Vue组件
  sysSfcIcon: 'ri:dashboard-line',
  width: 4,
  height: 4,
  x: 0,
  y: 0
}

// 主机资源监控小组件配置
export const containerHostMonitorWidget = {
  id: 'container-host-monitor',
  title: '主机资源监控',
  description: '监控主机CPU、内存、磁盘使用情况',
  icon: 'ri:server-line',
  component: () => import('./ContainerHostMonitor.vue'),
  type: 2, // 2表示Vue组件
  sysSfcIcon: 'ri:server-line',
  width: 4,
  height: 4,
  x: 0,
  y: 0
}

// 导出所有Docker相关的小组件
export const dockerWidgets = [
  containerMonitorWidget,
  containerHostMonitorWidget
]