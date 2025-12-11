# 脚本管理模块

## 概述

简化版脚本管理模块，专注于核心的脚本CRUD功能。

## 功能特性

- 脚本创建、编辑、删除、复制
- 支持6种脚本类型(Shell/Python/PowerShell/Batch/JavaScript/SQL)
- 集成代码编辑器，支持语法高亮
- 搜索和筛选功能
- 分页显示
- 状态管理(启用/禁用)

## 技术栈

- Vue 3 + TypeScript
- Element Plus
- SCSS
- Monaco Editor

## 文件结构

```
script-management/
├── components/
│   └── ScriptEditDialog.vue   # 编辑对话框
├── styles/
│   ├── variables.scss         # 样式变量
│   └── mixins.scss            # 样式混合
├── types/
│   └── index.ts               # 类型定义
├── utils/
│   └── index.ts               # 工具函数
└── index.vue                  # 主页面
```

## API接口

API文件位置: `src/api/server/script-management.ts`

- getScriptPage - 分页查询脚本列表
- getScriptById - 获取脚本详情
- createScript - 创建脚本
- updateScript - 更新脚本
- deleteScript - 删除脚本
- batchDeleteScripts - 批量删除
- updateScriptStatus - 更新状态
- copyScript - 复制脚本
- checkScriptName - 检查名称

## 使用说明

### 创建脚本

1. 点击"新建脚本"按钮
2. 填写脚本信息
3. 编写脚本内容或加载模板
4. 保存

### 编辑脚本

1. 点击脚本卡片
2. 修改内容
3. 保存

### 删除脚本

1. 点击更多按钮
2. 选择删除
3. 确认

## 脚本模板

系统为每种脚本类型提供了实用的模板，包含：

- 完整的注释说明
- 错误处理
- 日志输出
- 实用示例代码
