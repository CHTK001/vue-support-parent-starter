# Vue前端页面路由和组件结构设计

## 1. 路由结构设计

### 主路由配置
```javascript
const routes = [
  {
    path: '/docker',
    name: 'Docker',
    component: DockerLayout,
    redirect: '/docker/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'DockerDashboard',
        component: () => import('@/views/docker/Dashboard.vue'),
        meta: { title: 'Docker管理首页', icon: 'dashboard' }
      },
      {
        path: 'registry',
        name: 'DockerRegistry',
        component: () => import('@/views/docker/Registry.vue'),
        meta: { title: '软件仓库管理', icon: 'registry' }
      },
      {
        path: 'software',
        name: 'DockerSoftware',
        component: () => import('@/views/docker/Software.vue'),
        meta: { title: '软件管理', icon: 'software' }
      },
      {
        path: 'software/:id/detail',
        name: 'DockerSoftwareDetail',
        component: () => import('@/views/docker/SoftwareDetail.vue'),
        meta: { title: '软件详情', hidden: true },
        props: true
      },
      {
        path: 'image',
        name: 'DockerImage',
        component: () => import('@/views/docker/Image.vue'),
        meta: { title: '镜像管理', icon: 'image' }
      },
      {
        path: 'container',
        name: 'DockerContainer',
        component: () => import('@/views/docker/Container.vue'),
        meta: { title: '容器管理', icon: 'container' }
      },
      {
        path: 'logs',
        name: 'DockerLogs',
        component: () => import('@/views/docker/Logs.vue'),
        meta: { title: '操作日志', icon: 'logs' }
      }
    ]
  }
]
```

## 2. 组件层次结构

### 主布局组件 (DockerLayout.vue)
```
DockerLayout
├── NavBar (顶部导航)
├── SideBar (侧边栏菜单)
├── MainContent (主内容区域)
│   └── router-view (页面内容)
└── StatusBar (状态栏)
```

### 页面组件结构

#### 2.1 Dashboard页面组件
```
Dashboard.vue
├── StatisticsCards (统计卡片)
│   ├── RegistryStats (仓库统计)
│   ├── SoftwareStats (软件统计)
│   ├── ImageStats (镜像统计)
│   └── ContainerStats (容器统计)
├── QuickActions (快捷操作)
│   ├── SyncRegistryAction (同步仓库)
│   ├── PullImageAction (拉取镜像)
│   └── CreateContainerAction (创建容器)
├── RecentActivities (最近活动)
└── SystemMonitor (系统监控)
```

#### 2.2 Registry页面组件
```
Registry.vue
├── RegistryToolbar (工具栏)
│   ├── AddRegistryBtn (添加仓库按钮)
│   ├── SyncAllBtn (同步全部按钮)
│   └── SearchBox (搜索框)
├── RegistryTable (仓库列表表格)
│   ├── RegistryRow (仓库行)
│   │   ├── RegistryInfo (仓库信息)
│   │   ├── StatusBadge (状态标识)
│   │   └── ActionButtons (操作按钮)
│   └── Pagination (分页组件)
├── RegistryDialog (仓库编辑对话框)
└── SyncProgressDialog (同步进度对话框)
```

#### 2.3 Software页面组件
```
Software.vue
├── SoftwareToolbar (工具栏)
│   ├── RegistrySelector (仓库选择器)
│   ├── SyncFromRegistryBtn (同步按钮)
│   ├── CategoryFilter (分类过滤)
│   └── SearchBox (搜索框)
├── SoftwareGrid (软件网格)
│   └── SoftwareCard (软件卡片)
│       ├── SoftwareIcon (软件图标)
│       ├── SoftwareInfo (软件信息)
│       ├── TagsDisplay (标签显示)
│       └── InstallButton (安装按钮)
├── SoftwareTable (软件列表表格)
├── InstallDialog (安装对话框)
│   ├── ServerSelector (服务器选择)
│   ├── TagSelector (标签选择)
│   └── ConfigForm (配置表单)
└── SyncProgressDialog (同步进度对话框)
```

#### 2.4 Image页面组件
```
Image.vue
├── ImageToolbar (工具栏)
│   ├── PullImageBtn (拉取镜像按钮)
│   ├── StatusFilter (状态过滤)
│   └── SearchBox (搜索框)
├── ImageTable (镜像列表表格)
│   ├── ImageRow (镜像行)
│   │   ├── ImageInfo (镜像信息)
│   │   ├── SizeDisplay (大小显示)
│   │   ├── StatusBadge (状态标识)
│   │   └── ActionButtons (操作按钮)
│   └── Pagination (分页组件)
├── StartImageDialog (启动镜像对话框)
│   ├── ContainerConfig (容器配置)
│   ├── PortMapping (端口映射)
│   ├── VolumeMapping (卷映射)
│   └── EnvironmentVars (环境变量)
└── ProgressDialog (操作进度对话框)
```

#### 2.5 Container页面组件
```
Container.vue
├── ContainerToolbar (工具栏)
│   ├── StatusFilter (状态过滤)
│   ├── RefreshBtn (刷新按钮)
│   └── SearchBox (搜索框)
├── ContainerTable (容器列表表格)
│   ├── ContainerRow (容器行)
│   │   ├── ContainerInfo (容器信息)
│   │   ├── StatusIndicator (状态指示器)
│   │   ├── ResourceUsage (资源使用)
│   │   └── ActionButtons (操作按钮)
│   └── Pagination (分页组件)
├── ContainerDetailDialog (容器详情对话框)
│   ├── BasicInfo (基本信息)
│   ├── NetworkInfo (网络信息)
│   ├── VolumeInfo (卷信息)
│   └── LogsViewer (日志查看)
└── ConfirmDialog (确认对话框)
```

## 3. 公共组件

### 3.1 基础组件
```
common/
├── StatusBadge.vue (状态标识组件)
├── ActionButtons.vue (操作按钮组件)
├── SearchBox.vue (搜索框组件)
├── Pagination.vue (分页组件)
├── ProgressBar.vue (进度条组件)
├── LoadingSpinner.vue (加载动画组件)
└── ConfirmDialog.vue (确认对话框组件)
```

### 3.2 业务组件
```
docker/
├── ServerSelector.vue (服务器选择器)
├── TagSelector.vue (标签选择器)
├── LogsViewer.vue (日志查看器)
├── ResourceMonitor.vue (资源监控器)
├── ProgressDialog.vue (进度对话框)
└── RealTimeStatus.vue (实时状态组件)
```

## 4. 状态管理结构

### 4.1 Vuex Store模块
```
store/
├── index.js (根store)
└── modules/
    ├── docker.js (Docker总体状态)
    ├── registry.js (仓库管理状态)
    ├── software.js (软件管理状态)
    ├── image.js (镜像管理状态)
    ├── container.js (容器管理状态)
    └── websocket.js (WebSocket连接状态)
```

### 4.2 状态设计
```javascript
// docker.js
const state = {
  // 全局状态
  isConnected: false,
  operationProgress: {},
  notifications: [],
  
  // 统计数据
  statistics: {
    registryCount: 0,
    softwareCount: 0,
    imageCount: 0,
    containerCount: 0,
    runningContainers: 0
  }
}

// registry.js
const state = {
  registries: [],
  currentRegistry: null,
  syncProgress: {},
  loading: false,
  error: null
}

// software.js
const state = {
  softwareList: [],
  currentSoftware: null,
  availableTags: [],
  installProgress: {},
  loading: false,
  error: null
}

// image.js
const state = {
  images: [],
  currentImage: null,
  pullProgress: {},
  startProgress: {},
  loading: false,
  error: null
}

// container.js
const state = {
  containers: [],
  currentContainer: null,
  containerLogs: {},
  operationProgress: {},
  loading: false,
  error: null
}
```

## 5. 组件通信模式

### 5.1 父子组件通信
- Props传递数据
- Events向上通信
- v-model双向绑定

### 5.2 兄弟组件通信
- 通过Vuex Store
- Event Bus (适用于简单通信)

### 5.3 WebSocket实时通信
- 通过WebSocket Store模块
- 实时更新各模块状态
- 进度推送和状态同步

## 6. 路由守卫和权限控制

### 6.1 路由守卫
```javascript
router.beforeEach((to, from, next) => {
  // 检查用户权限
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
    return
  }
  
  // 检查Docker服务状态
  if (to.path.startsWith('/docker') && !isDockerServiceAvailable()) {
    Message.warning('Docker服务不可用')
    next('/dashboard')
    return
  }
  
  next()
})
```

### 6.2 页面权限控制
```javascript
// 在组件中检查权限
created() {
  if (!this.hasPermission('docker:manage')) {
    this.$router.push('/unauthorized')
  }
}
```

## 7. 响应式设计考虑

### 7.1 断点设计
- xs: <576px (手机)
- sm: ≥576px (小屏手机)
- md: ≥768px (平板)
- lg: ≥992px (桌面)
- xl: ≥1200px (大屏桌面)

### 7.2 组件自适应
- 表格在小屏幕转为卡片展示
- 侧边栏在移动端收缩为抽屉模式
- 操作按钮在小屏幕堆叠排列

## 8. 性能优化策略

### 8.1 组件懒加载
- 路由级别的懒加载
- 大型组件的异步加载

### 8.2 数据缓存
- API响应缓存
- 图片资源缓存
- 状态持久化

### 8.3 虚拟滚动
- 大量数据列表使用虚拟滚动
- 日志查看器虚拟滚动

这个设计确保了良好的用户体验、可维护性和扩展性。