# 服务器监控模块

## 📁 目录结构

```
src/views/server/
├── modules/                    # 功能模块
│   ├── server-management/      # 服务器管理模块
│   │   ├── components/         # 服务器管理组件
│   │   ├── composables/        # 服务器数据管理
│   │   ├── types/              # 服务器相关类型
│   │   ├── utils/              # 服务器工具函数
│   │   ├── index.vue           # 服务器列表页面
│   │   ├── detail.vue          # 服务器详情页面
│   │   ├── management.vue      # 服务器管理页面
│   │   └── index.ts            # 模块入口文件
│   │
│   ├── component-config/       # 组件配置模块
│   │   ├── components/         # 组件配置相关组件
│   │   ├── composables/        # 组件配置管理
│   │   ├── types/              # 组件配置类型
│   │   ├── utils/              # 组件配置工具
│   │   └── index.ts            # 模块入口文件
│   │
│   ├── layout-management/      # 布局管理模块
│   │   ├── components/         # 布局管理组件
│   │   ├── composables/        # 布局管理逻辑
│   │   ├── types/              # 布局相关类型
│   │   ├── utils/              # 布局工具函数
│   │   └── index.ts            # 模块入口文件
│   │
│   └── file-management/        # 文件管理模块
│       ├── components/         # 文件管理组件
│       ├── composables/        # 文件管理逻辑
│       ├── types/              # 文件相关类型
│       ├── utils/              # 文件工具函数
│       └── index.ts            # 模块入口文件
│
├── shared/                     # 共享资源
│   ├── components/             # 通用组件
│   │   └── charts/             # 图表组件
│   ├── composables/            # 通用组合式函数
│   ├── types/                  # 通用类型定义
│   ├── utils/                  # 通用工具函数
│   ├── constants/              # 常量定义
│   └── index.ts                # 共享模块入口
│
├── index.ts                    # 主入口文件
└── README.md                   # 说明文档
```

## 🚀 模块说明

### 1. 服务器管理模块 (server-management)
负责服务器的基本管理功能：
- 服务器列表展示
- 服务器详情查看
- 服务器连接管理
- 服务器监控数据

**主要组件：**
- `ServerList.vue` - 服务器列表
- `ServerDetail.vue` - 服务器详情页面
- `ServerConnectionStatus.vue` - 连接状态组件
- `ServerMonitor.vue` - 监控组件

**组合式函数：**
- `useServerData()` - 服务器数据管理

### 2. 组件配置模块 (component-config)
负责监控组件的配置和管理：
- 组件类型选择
- 数据源配置
- 图表样式设置
- 组件模板管理

**主要组件：**
- `ComponentConfigDialog.vue` - 组件配置对话框

**组合式函数：**
- `useComponentConfig()` - 组件配置管理

### 3. 布局管理模块 (layout-management)
负责页面布局的管理：
- 拖拽式布局编辑
- 布局模板管理
- 响应式布局
- 布局导入导出

**主要组件：**
- `GridLayoutEditor.vue` - 网格布局编辑器
- `LayoutConfigDialog.vue` - 布局配置对话框

**组合式函数：**
- `useLayoutManager()` - 布局管理

### 4. 文件管理模块 (file-management)
负责服务器文件的管理：
- 文件浏览
- 文件上传下载
- 文件编辑
- 权限控制

**主要组件：**
- `FileManagerDialog.vue` - 文件管理对话框

**组合式函数：**
- `useFileManager()` - 文件管理

### 5. 共享模块 (shared)
提供通用的组件、工具和类型定义：
- 图表组件（卡片、仪表盘、图表等）
- 通用工具函数
- 类型定义
- 常量定义

## 📦 使用方式

### 导入整个模块
```typescript
import * from '@/views/server';
```

### 导入特定功能模块
```typescript
// 导入服务器管理模块
import { useServerData, ServerList } from '@/views/server/modules/server-management';

// 导入组件配置模块
import { useComponentConfig, ComponentConfigDialog } from '@/views/server/modules/component-config';

// 导入布局管理模块
import { useLayoutManager, GridLayoutEditor } from '@/views/server/modules/layout-management';

// 导入文件管理模块
import { useFileManager, FileManagerDialog } from '@/views/server/modules/file-management';

// 导入共享组件
import { CardComponent, GaugeComponent } from '@/views/server/shared';
```

### 导入类型定义
```typescript
import type { 
  ServerInfo, 
  ComponentType, 
  LayoutItem, 
  FileItem 
} from '@/views/server';
```

## 🔧 开发指南

### 添加新组件
1. 确定组件属于哪个功能模块
2. 在对应模块的 `components/` 目录下创建组件
3. 在模块的 `index.ts` 中导出组件
4. 更新类型定义（如需要）

### 添加新的组合式函数
1. 在对应模块的 `composables/` 目录下创建
2. 在模块的 `index.ts` 中导出
3. 添加相关类型定义

### 添加新的工具函数
1. 在对应模块的 `utils/` 目录下创建
2. 如果是通用工具，放在 `shared/utils/` 下
3. 在相应的 `index.ts` 中导出

### 添加新的类型定义
1. 在对应模块的 `types/` 目录下创建
2. 如果是通用类型，放在 `shared/types/` 下
3. 在相应的 `index.ts` 中导出

## 🎯 设计原则

1. **模块化**：按功能划分模块，职责清晰
2. **可复用**：共享组件和工具函数提高复用性
3. **类型安全**：完整的TypeScript类型定义
4. **易维护**：清晰的目录结构和命名规范
5. **可扩展**：模块化设计便于功能扩展

## 📝 注意事项

1. 新增功能时请遵循现有的目录结构
2. 共享的组件和工具请放在 `shared/` 目录下
3. 每个模块都应该有完整的类型定义
4. 组合式函数应该提供完整的功能封装
5. 保持向后兼容性，避免破坏性更改
