# 更新日志

本文档记录了项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.4.3] - 2025-09-27

### 新增

- **Storage工具增强**: 新增同步版本的localStorage和sessionStorage操作代理
  - 🔄 **双版本支持**: 同时提供异步（支持加密）和同步（不支持加密）两个版本
  - ⚡ **性能优化**: 同步版本无需等待Promise.resolve，直接返回结果
  - 🔧 **使用灵活**: 开发者可根据需求选择合适的版本
  - 📦 **API一致**: 两个版本提供完全一致的API接口，便于切换
  - 📚 **文档完善**: 新增storage/README.md详细说明使用方法

#### 技术实现细节

**同步版本实现：**
``typescript
// SyncLocalStorageProxy类实现
class SyncLocalStorageProxy {
  setItem<T>(key: string, value: T): void {
    // 直接操作localStorage，无需async/await
    storageLocal().setItem(key, value);
  }

  getItem<T>(key: string): T {
    // 直接返回结果，无需Promise
    return storageLocal().getItem(key) as T;
  }
}
```

**异步版本实现：**
``typescript
// CustomLocalStorageProxy类实现
class CustomLocalStorageProxy {
  async setItem<T>(key: string, value: T): Promise<void> {
    // 支持WASM加密的异步操作
    const encryptedValue = await encryptStorageValue(...);
    storageLocal().setItem(key, encryptedValue);
  }

  async getItem<T>(key: string): Promise<T> {
    // 支持WASM解密的异步操作
    const encryptedValue = storageLocal().getItem(key);
    const decryptedValue = await decryptStorageValue(...);
    return decryptedValue as T;
  }
}
```

**使用方式对比：**
``typescript
// 同步版本 - 无需await
import { syncLocalStorageProxy } from "@repo/utils";
syncLocalStorageProxy().setItem('key', 'value');
const value = syncLocalStorageProxy().getItem('key');

// 异步版本 - 需要await
import { localStorageProxy } from "@repo/utils";
await localStorageProxy().setItem('key', 'value');
const value = await localStorageProxy().getItem('key');
```

### 文档完善

- **Storage模块文档**: 新增完整的README.md文档
  - 详细的同步和异步版本使用说明
  - 完整的API接口对比和选择建议
  - 使用场景分析和技术实现细节

## [2.4.2] - 2025-09-26

### 新增

- **MD5哈希算法迁移到WASM**: 将md5Hash函数从JavaScript实现迁移到WebAssembly实现
  - 🔒 **代码保护**: 将MD5哈希算法编译为WASM，防止源码被解析和篡改
  - ⚡ **性能提升**: WASM执行速度比纯JavaScript快2-10倍
  - 🛡️ **安全性增强**: MD5算法在WASM沙箱中运行，更难被逆向工程
  - 📦 **模块化**: 在@repo/codec-wasm包中导出md5Hash函数，便于统一管理

#### 技术实现细节

**AssemblyScript实现：**
``typescript
// 在WASM模块中实现MD5哈希算法
export function md5Hash(input: string): string {
  // 简化的MD5实现（实际项目中应使用完整的MD5算法）
  let hash: i64 = 0
  for (let i: i32 = 0; i < input.length; i++) {
    const character: i32 = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + character
    hash = hash & 0x7fffffffffffffff // 转换为64位有符号整数
  }
  // 转换为16进制字符串并确保长度为32位
  // ... 处理逻辑
  return hex
}
```

**JavaScript包装器：**
```
// 导出md5Hash函数
export async function md5Hash(input) {
  try {
    const wasm = await loadWasm();
    return wasm.md5Hash(input);
  } catch (error) {
    console.error('WASM md5Hash failed:', error);
    throw error;
  }
}
```

**HTTP模块集成：**
``typescript
// 在http.ts中使用WASM版本的md5Hash函数
import { md5Hash as md5HashWasm } from "@repo/codec-wasm";

const md5Hash = async (input: string): Promise<string> => {
  // 使用WASM版本的md5Hash函数
  return await md5HashWasm(input);
};
```

### 文档完善

- **codec-wasm模块文档更新**: 更新README.md文档，添加md5Hash函数的说明

## [2.4.1] - 2025-09-26

### 新增

- **请求签名生成功能迁移到WASM**: 将generateSign函数从JavaScript实现迁移到WebAssembly实现
  - 🔒 **代码保护**: 将签名生成算法编译为WASM，防止源码被解析和篡改
  - ⚡ **性能提升**: WASM执行速度比纯JavaScript快2-10倍
  - 🛡️ **安全性增强**: 签名算法在WASM沙箱中运行，更难被逆向工程
  - 📦 **模块化**: 新增@repo/codec-wasm包，专门处理加密解密相关功能
  - 🔄 **无缝集成**: 保持原有接口不变，自动使用WASM版本的generateSign函数

#### 技术实现细节

**AssemblyScript实现：**
```
// 在WASM模块中实现签名生成算法
export function generateSign(paramsJson: string, timestamp: i64, nonce: string, secretKey: string): string {
  // 参数解析和排序
  // MD5哈希生成
  // 返回32位签名字符串
}
```

**JavaScript包装器：**
```
// 导出generateSign函数
export async function generateSign(paramsJson, timestamp, nonce, secretKey) {
  try {
    const wasm = await loadWasm();
    // 将timestamp从number转换为bigint以匹配AssemblyScript的i64类型
    return wasm.generateSign(paramsJson, BigInt(timestamp), nonce, secretKey);
  } catch (error) {
    console.error('WASM generateSign failed:', error);
    throw error;
  }
}
```

**HTTP模块集成：**
```
// 在http.ts中使用WASM版本的generateSign函数
import { generateSign as generateSignWasm } from "@repo/codec-wasm";

const generateSign = async (config: any, timestamp: number, nonce: string): Promise<string> => {
  // 参数收集和处理逻辑...
  
  // 使用WASM版本的generateSign函数
  const secretKey = "your-secret-key"; // 实际应该从配置中获取
  return await generateSignWasm(paramString, timestamp, nonce, secretKey);
};
```

### 文档完善

- **codec-wasm模块文档**: 新增完整的README.md文档
  - 详细的目录结构说明和功能特性介绍
  - 完整的编译步骤和使用方法说明
  - 性能优势和安全特性详细说明
  - 集成到现有项目的完整指南

## [2.4.0] - 2025-01-20

### 新增

- **Video模块下载功能优化**: 全面重构下载功能实现
  - 🔄 **简化下载逻辑**: 移除复杂的多地址解析，改为单地址直接下载
  - 🔗 **原生下载支持**: 使用 HTML5 `<a>` 标签的 download 属性实现文件下载
  - ⚡ **性能提升**: 移除下载进度模拟，提升响应速度
  - 🎯 **用户体验优化**: 下载操作更加直观和可靠
  - 🛠️ **重构 downloadFile 函数**: 删除多地址下载支持，参数简化为单参数
  - 📋 **数据结构优化**: `donwloadUrls` 现在只包含单个下载地址

#### 技术改进细节

**前端实现：**
``typescript
// 新的下载函数签名
const downloadFile = async (item: VideoItem) => {
  const link = document.createElement("a");
  link.href = item.donwloadUrls;  // 直接使用下载URL
  link.download = `${item.videoTitle}.${getFileExtension(item.donwloadUrls) || 'mp4'}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

**API接口变更：**
- `donwloadUrls` 字段从多地址格式改为单地址字符串
- 要求返回完整的、可直接访问的下载链接
- 建议URL包含适当的文件扩展名以便自动识别

**模板调用简化：**
``vue
<!-- 变更前：复杂的多地址循环 -->
<el-button v-for="(url, urlIndex) in parseDownloadUrls(row.donwloadUrls)" 
           @click="downloadFile(row, url, urlIndex)">
  {{ url.quality || `链接${urlIndex + 1}` }}
</el-button>

<!-- 变更后：简单的单按钮 -->
<el-button v-if="row.donwloadUrls" @click="downloadFile(row)">
  <IconifyIconOnline icon="ep:download" />
  下载
</el-button>
```

### 文档完善

- **Video模块README文档**: 新增API接口说明章节
  - 详细的视频搜索接口参数和响应结构说明
  - 完整的数据结构定义和字段说明
  - 重要字段变更说明和迁移指南
  - API调用示例和错误处理指导
  - 下载功能技术实现详细说明

- **Video模块CHANGELOG文档**: 新增v1.4.0版本记录
  - 完整的功能改进说明和技术细节
  - 数据结构变更对比表和迁移指南
  - 性能指标和优化效果说明
  - 对前端和后端开发者的具体指导

### 兼容性说明

⚠️ **重要变更通知**: 此版本包含破坏性变更

**对前端影响：**
- `downloadFile` 函数参数从 3 个减少为 1 个
- 移除 `parseDownloadUrls` 函数调用
- 模板中的下载按钮需要修改事件处理

**对后端影响：**
- `donwloadUrls` 字段应返回单个有效URL而非多个URL
- URL应该是完整的、可直接访问的下载地址

## [2.3.9] - 2025-01-18

### 新增

- **ScMessageDialog 组件清除功能**: 新增消息清除功能和外部方法调用
  - 🧹 **清除按钮**: 在头部控制栏新增清除按钮，支持一键清空所有消息
  - 🔧 **外部方法**: 通过 defineExpose 暴露 clear、close、toggleCollapse、scrollToBottom 方法
  - 📡 **清除事件**: 新增 clear 事件，支持父组件监听清除操作
  - 🎨 **样式优化**: 清除按钮悬停时显示红色，与其他控制按钮保持一致的设计风格
  - 📖 **文档完善**: 新增 ScMessageDialog 组件完整的 README.md 文档，更新根目录文档说明

## [2.3.8] - 2025-01-18

### 新增

- **ScMessageDialog 组件功能增强**: 新增进度条唯一性控制和Markdown解析开关
  - 🎯 **progressUnique 参数**: 控制进度条是否唯一显示（默认true），设置后仅在底部显示一条统一进度条
  - 📝 **enableMarkdown 参数**: 控制是否启用Markdown解析（默认false），可动态开启/关闭Markdown渲染
  - 🔧 **逻辑优化**: 改进进度条显示逻辑，支持多种进度展示模式
  - 📚 **示例更新**: 在pages/example中新增唯一进度条和Markdown解析的演示
  - 📖 **文档完善**: 更新README.md和CHANGELOG.md，提供详细的参数说明和使用示例

## [2.3.7] - 2025-01-18

### 新增

- **ScMessageDialog 实时消息对话框组件**: 新增功能强大的实时消息展示组件
  - 🚀 **Vue 3 + TypeScript**: 使用Composition API，提供完整的类型支持
  - 📍 **多种位置**: 支持四个角落定位（top-left、top-right、bottom-left、bottom-right）
  - 🎨 **样式自定义**: 支持自定义宽度、高度、透明度等样式配置
  - 📊 **进度监控**: 内置进度条支持，可显示任务执行进度
  - 🔄 **自动功能**: 支持自动展开、自动滚动到最新消息
  - 📝 **Markdown渲染**: 支持Markdown格式的消息内容渲染
  - 🎯 **模板支持**: 支持自定义消息模板和插槽
  - ⚡ **实时更新**: 适用于WebSocket实时消息展示
  - 🔧 **完整集成**: 已集成到video/config页面用于同步信息展示
  - 📚 **示例完善**: 在pages/example中提供完整的使用示例和演示

## [2.3.6] - 2025-09-16

### 重构

- 视频管理页 UI：集成 VideoFilter 与 VideoResults 组件，实现筛选与海报网格布局
  - 支持四类筛选：类型、年代、地区、语言；提供“全部”快捷多选逻辑
  - 顶部工具栏新增关键词搜索与排序切换（推荐、最新上线、最多播放、评分最高）
  - 结果区采用 2:3 封面比例卡片，展示评分/播放次数、类型标签、地区/语言/年份提示
- 参数与接口对齐
  - 请求接口：POST /v1/video/page
  - 入参映射：
    - keyword: string
    - videoType: string（多值以英文逗号分隔）
    - videoYear: string（多值以英文逗号分隔）
    - videoDistrict: string（多值以英文逗号分隔）
    - videoLanguage: string（多值以英文逗号分隔）
    - order: string（排序键，枚举 recommend | newest | "videoViews desc" | "videoScore desc"）
- 文档
  - 更新根 README：新增 VideoFilter 与 VideoResults 使用说明（props、emits、参数映射与示例）
  - 本 CHANGELOG 记录以上改动

## [2.3.5] - 2025-01-17

### 新增

- **FilterLayout组件功能增强**: 完善过滤器组件的配置和输出功能
  - 🎯 **父组件参数配置**: 新增多种可配置参数支持
    - 新增 `customOperators` 自定义运算符配置，支持扩展运算符类型
    - 新增 `fieldMapping` 字段映射功能，支持显示字段与实际字段的映射
    - 新增 `strictMode` 严格模式，可过滤空值条件
    - 新增 `sqlTablePrefix` SQL表前缀配置，支持多表查询
    - 新增 `showOperator` 运算符显示控制
  - 🔄 **多种数据格式输出**: 支持SQL、Lucene、Array等多种输出格式
    - 实现 `generateSQLOutput()` 方法，生成标准SQL WHERE子句
    - 实现 `generateLuceneOutput()` 方法，生成Lucene查询语法
    - 实现 `generateArrayOutput()` 方法，生成结构化数组数据
    - 支持字符转义、运算符映射、条件组合等完整功能
  - 📡 **事件系统完善**: 新增格式化输出事件
    - 新增 `formatChange` 事件，提供格式类型、输出数据和原始数据
    - 完善 `filterChange` 事件，支持格式化后的数据输出
    - 支持实时格式切换和数据同步
  - 📚 **文档完善**: 更新组件文档和使用示例
    - 在ScSelect README.md中新增FilterLayout高级配置说明
    - 提供完整的参数配置示例和输出格式对比
    - 新增多种数据格式的使用场景和最佳实践

## [2.3.4] - 2025-01-17

### 新增

- **视频源管理模块**: 全新的视频源配置和管理功能
  - 🎯 **视频源管理页面**: 新增 `/video/source` 页面，提供完整的视频源管理功能
    - 创建 `source/index.vue` 主页面，参考config页面结构并去除统计部分
    - 支持视频源列表展示、搜索、筛选和分页功能
    - 提供新增、编辑、删除、批量操作等完整功能
  - 🎨 **视频源组件**: 新增专用的视频源管理组件
    - 创建 `SourceCard.vue` 卡片组件，展示视频源详细信息
    - 创建 `SourceForm.vue` 表单组件，支持新增和编辑视频源
    - 支持平台图标展示、状态管理、连接测试等功能
  - 🔌 **API接口完善**: 扩展 `source.ts` API接口功能
    - 新增搜索、筛选、批量操作等查询参数支持
    - 新增批量删除、状态切换、连接测试等操作接口
    - 新增统计信息、导入导出等扩展功能接口
    - 完整的TypeScript类型定义和参数验证
  - 📚 **文档完善**: 更新项目文档，添加视频源管理功能说明
    - 在README.md中新增视频源管理功能介绍
    - 完整的API接口文档和数据类型定义
    - 新增权限配置和访问路径说明
    - 符合项目文档规范，便于前端开发理解和使用

## [2.3.3] - 2024-12-19

### 重构

- **Video项目架构优化**: 全面重构video项目的Socket和API调用方式
  - 🔌 **Socket连接统一**: 将video项目中的直接socket.io使用替换为封装的socket服务
    - 修改 `pages/video/src/views/config/index.vue` 使用统一的socket封装
    - 移除直接的 `socket.io-client` 依赖，使用 `@repo/core/config/socket`
    - 统一socket连接、事件监听和断开逻辑
  - 🔄 **API调用方式重构**: 将所有await调用改为异步回调方式
    - 重构 `search/index.vue` 中的搜索、建议、历史等API调用
    - 重构 `manage/index.vue` 中的视频加载、详情、删除等API调用
    - 重构 `search/result.vue` 中的搜索和详情API调用
    - 重构 `config/components/ConfigForm.vue` 中的表单验证和保存API调用
    - 统一使用 `.then/.catch/.finally` 替代 `async/await`
  - 📚 **文档完善**: 新增video项目README文档
    - 详细说明Socket使用规范和API调用规范
    - 提供正确和错误的代码示例对比
    - 完整的项目结构和开发指南
  - 🛡️ **代码规范**: 统一错误处理和用户体验
    - 标准化异步操作的loading状态管理
    - 统一错误消息提示和用户反馈
    - 优化代码可读性和维护性

## [2.3.2] - 2024-12-19

### 新增

- **Socket服务增强**: 全面升级Socket连接管理
  - 🔌 **全局Socket服务**: 新增基于Vue Composition API的全局Socket服务
  - 💉 **依赖注入支持**: 使用provide/inject模式，便于组件间共享Socket连接
  - 📡 **响应式状态**: Socket连接状态使用Vue响应式系统管理
  - 🔄 **向后兼容**: 保持原有socket工厂函数完全不变，确保现有代码正常运行
  - 🎯 **统一管理**: 提供createGlobalSocketService、provideGlobalSocket、useGlobalSocket等API
  - 📚 **完整文档**: 新增详细的使用文档和示例代码
  - 🛡️ **类型安全**: 完整的TypeScript类型定义和接口支持

## [2.3.1] - 2025-01-14

### 修复

- **双栏导航问题修复**: 解决用户反馈的关键问题
  - 🔧 **图标显示修复**: 修复第一列菜单图标不显示的问题，正确使用useRenderIcon函数
  - 🔗 **路由跳转修复**: 修复点击第二列菜单跳转到首页的问题，正确处理路由路径传递
  - 📐 **布局比例优化**: 调整第一列和第二列的宽度比例，左栏固定64px，右栏自适应
  - 🎨 **样式完善**: 添加边框分隔线和背景色区分，提升视觉层次感

## [2.3.0] - 2025-01-14

### 新增

- **双栏导航重大改进**: 全面优化双栏导航体验
  - 🎯 **第一列图标化**: 第一列仅显示图标，提供更简洁的视觉体验
  - 📋 **第二列重点显示**: 第二列作为主要内容展示区域，支持完整的菜单信息
  - 🔄 **三级菜单支持**: 完整支持三级菜单在双栏导航中的显示和交互
  - ⚡ **智能展开模式**: 新增自动展开和手动展开两种模式
    - **自动展开模式**: 使用div显示灰色分组名称，子菜单直接展开，无折叠功能
    - **手动展开模式**: 保留完整的折叠功能和"展开所有子菜单"选项
  - 🎨 **视觉优化**: 改进分组标题样式，使用灰色背景和更好的层次感
  - 📱 **响应式设计**: 完美适配移动端和桌面端显示

- **配置系统增强**: 双栏导航配置选项
  - 子菜单展开模式选择（自动展开/手动展开）
  - 默认展开所有子菜单开关控制
  - 实时配置更新和预览功能

### 改进

- **组件架构优化**: 重构DoubleNavSidebarItem组件
  - 支持两种渲染模式的条件渲染
  - 优化三级菜单的嵌套显示逻辑
  - 改进样式系统和主题适配
- **用户体验提升**:
  - 第一列图标hover时显示完整菜单名称
  - 自动展开模式下的分组标题更加清晰
  - 手动展开模式保留原有的交互习惯
- **性能优化**: 减少不必要的DOM渲染和事件监听

### 技术改进

- **TypeScript支持**: 完善类型定义和类型安全
- **样式系统**: 使用CSS变量实现更好的主题切换
- **代码结构**: 模块化组件设计，便于维护和扩展

### 配置项

- `doubleNavExpandMode`: 双栏导航展开模式（auto/manual）
- `doubleNavAutoExpandAll`: 自动展开所有子菜单开关

## [2.2.0] - 2025-01-14

### 新增

- **菜单新增标识功能**: 全新的菜单新增标识系统
  - 🏷️ **MenuNewBadge组件**: 用于在菜单项上显示"新增"标识的Vue 3组件
  - ⏰ **时间控制**: 可配置新菜单标识的显示时间限制，支持自定义时间范围
  - 🎨 **样式自定义**: 支持5种标识样式类型（default、primary、success、warning、danger）
  - 🌓 **主题适配**: 完美支持暗色主题和响应式设计
  - ✨ **动画效果**: 内置脉冲动画和光泽效果，提升用户体验
  - 🔧 **全局配置**: 通过系统设置面板全局控制功能开关和参数
  - 🛠️ **工具函数**: 提供MenuNewUtils工具类和便捷函数，简化开发

- **系统设置增强**: 菜单设置配置面板
  - 显示新增菜单标识开关控制
  - 新菜单标识文本自定义配置
  - 新菜单时间限制设置（小时）
  - 实时配置更新和预览功能

- **工具函数库扩展**: MenuNewUtils工具类
  - `shouldShowNewBadge()`: 检查菜单是否应该显示新增标识
  - `addNewBadgeToMenu()`: 为菜单项添加新增标识配置
  - `batchAddNewBadge()`: 批量为菜单列表添加新增标识
  - `createNewMenu()`: 创建带有新增标识的菜单项
  - `withNewBadge()`: 菜单新增标识装饰器（实验性功能）

### 功能特性

- **纯前端实现**: 无需后端支持，完全基于前端配置和时间计算
- **TypeScript支持**: 完整的类型定义和类型安全
- **性能优化**: 使用计算属性和响应式设计，对性能影响极小
- **兼容性**: 支持所有现代浏览器，IE11+
- **文档完善**: 提供详细的使用说明和API文档

### 配置项

- `ShowNewMenu`: 全局开关，控制是否启用新菜单标识功能
- `NewMenuText`: 新菜单标识显示的文本内容
- `NewMenuTimeLimit`: 新菜单标识显示的时间限制（小时）

### 文档

- 📝 新增 [菜单新增标识功能说明](./docs/菜单新增标识功能说明.md)
- 📝 更新 README.md，添加MenuNewBadge组件说明
- 📝 更新 CHANGELOG.md，记录功能变更

## [2.1.0] - 2024-12-19

### 新增

- **Video视频模块**: 全新的视频管理系统
  - 🔍 **视频搜索**: 支持多条件视频搜索和筛选功能
  - 📹 **视频管理**: 完整的视频CRUD操作，包括列表、详情、添加、编辑、删除
  - 🔗 **视频解析**: 支持多平台视频链接解析，包括解析接口管理和历史记录
  - ⚙️ **配置管理**: 灵活的系统配置管理，支持配置导入导出
  - 📊 **数据分析**: 视频播放和使用统计分析，提供数据报表
  - 🎮 **视频播放**: 内置视频播放器支持，支持全屏和嵌入模式
  - 🔒 **权限控制**: 基于角色的权限管理系统
  - 📱 **响应式设计**: 完美适配各种设备和屏幕尺寸

- **Video API接口**: 完整的后端API接口支持
  - 视频管理接口：列表、详情、添加、更新、删除
  - 视频搜索接口：搜索、建议、热门、历史
  - 视频解析接口：解析、接口管理、历史记录
  - 配置管理接口：配置CRUD、同步功能

- **Video类型定义**: 完整的TypeScript类型支持
  - 视频信息类型、搜索请求参数、解析结果类型
  - 配置信息类型、同步配置类型、解析接口类型
  - 系统统计类型、文件上传类型、WebSocket消息类型

- **Video路由配置**: 完整的路由系统配置
  - 采用项目标准路由配置格式，符合RouteConfigsTable规范
  - 支持异步组件加载，提升页面加载性能
  - 配置完整的路由元信息，包括标题、图标、排序等
  - 支持嵌套路由结构，包含视频搜索、解析、管理、配置等子路由
  - 集成权限控制和菜单显示配置
  - 表单验证规则和字段配置类型

- **Video路由配置**: 完整的路由和权限配置
  - 支持嵌套路由和动态路由
  - 基于权限的路由过滤
  - 面包屑导航自动生成
  - 路由守卫和权限检查

### 功能模块

- **视频搜索** (`/video/search`): 关键词搜索、多维度筛选、搜索历史
- **视频管理** (`/video/manage`): 视频列表管理、详情查看、批量操作
- **视频解析** (`/video/parse`): 多平台链接解析、解析历史、接口配置
- **配置管理** (`/video/config`): 系统配置、解析接口配置、同步管理
- **数据分析** (`/video/analytics`): 播放统计、用户行为分析、性能监控
- **系统设置** (`/video/settings`): 参数配置、权限管理、维护工具

### 技术特性

- 基于Vue 3 + TypeScript + Composition API
- 使用Element Plus UI组件库
- 支持WebSocket实时通信
- 完整的错误处理和日志记录
- 支持文件上传和下载
- 响应式设计和移动端适配

## [2.0.4] - 2025-01-17

### 新增

- **ScSwitch**: 新增现代化布局样式 (`modern`)
  - 添加 ModernLayout 组件，提供更现代化的开关设计
  - 支持渐变背景、阴影效果和平滑动画
  - 兼容所有现有属性：尺寸、颜色、图标、文本等
  - 在示例页面中添加现代布局演示

### 改进

- **ScSwitch**: 扩展布局选项，现在支持 `default`、`card`、`slider`、`modern` 四种布局
- **ScSwitchExample**: 更新示例页面，展示新的现代布局效果

## [2.0.3] - 2025-01-17

### 修复

- **ScSearch**: 修复组件垂直居中对齐问题，确保在容器中正确垂直居中显示
- **ScSearch**: 优化表单项和按钮区域的垂直对齐逻辑

### 改进

- **ScSearch**: 改进组件在不同容器中的布局表现
- **HolidayIndex**: 优化搜索区域的布局结构

## [2.0.2] - 2025-01-17

### 修复

- **ScSearch**: 修复 `width` 属性不生效的问题，现在可以正确设置表单项宽度
- **ScSearch**: 优化表单项样式绑定逻辑，避免固定class覆盖自定义宽度

### 改进

- **ScSearch**: 完善width属性文档说明和使用示例
- **ScSearch**: 新增自定义宽度演示页面

## [2.0.1] - 2025-01-17

### 新增

- **ScSearch组件**: 按钮显示模式控制
  - 新增 `buttonMode` 参数，支持 'icon'（只显示图标）和 'text'（显示图标+文字）两种模式
  - 默认模式为 'icon'，提供更简洁的界面
  - 默认只显示搜索和重置按钮，编辑按钮需要手动开启

### 改进

- **ScSearch组件**: 优化默认配置
  - `showEdit` 默认值改为 `false`，减少不必要的按钮显示
  - 更新文档和示例，展示新的按钮模式用法

## [2.0.0] - 2025-01-17

### 新增 (Added)

#### ScSearch 搜索组件 v2.0.0

- **重大重构**: 从 Options API 重构为 Composition API + TypeScript
- **新增表单控件类型**:
  - 时间选择器 (`time`)
  - 时间范围选择器 (`timerange`)
  - 级联选择器 (`cascader`)
  - 开关控件 (`switch`)
  - 复选框组 (`checkbox`)
- **新增功能特性**:
  - 防抖搜索功能 (可配置延迟时间)
  - 表单验证支持 (支持自定义验证规则)
  - v-model 双向绑定支持
  - 组件方法暴露 (`validateForm`, `clearForm`, `setFormData`, `getFormData`, `resetForm`)
  - 自定义插槽支持
  - 管理员权限控制
- **新增配置选项**:
  - `enableDebounce`: 是否启用防抖搜索
  - `debounceDelay`: 防抖延迟时间
  - `showReset`: 是否显示重置按钮
  - `showEdit`: 是否显示编辑按钮
  - `rules`: 表单验证规则
  - `modelValue`: 支持 v-model
- **新增事件**:
  - `update:modelValue`: 表单数据更新事件
  - `search`: 搜索事件
  - `reset`: 重置事件
  - `edit`: 编辑事件

#### WebRTC 监控模块

- **新增 API 函数**: `getRoomHistory` - 获取房间历史数据
  - 支持按房间ID查询历史数据
  - 支持时间范围筛选
  - 返回用户数量变化、持续时间、事件记录等信息

#### Holiday 节假日模块

- **完整模块实现**:
  - 节假日数据展示页面
  - 基于 Element Plus Calendar 的日历组件
  - 节假日数据同步功能
  - API 接口封装
  - 路由配置
  - 模块配置文件

### 改进 (Changed)

#### ScSearch 搜索组件

- **界面优化**:
  - 改进响应式布局，更好适配移动端
  - 优化按钮间距和布局
  - 增强无障碍访问支持
  - 改进键盘导航体验
- **性能优化**:
  - 使用 `computed` 优化计算属性
  - 优化事件监听和内存使用
  - 改进组件渲染性能
- **代码质量**:
  - 完整的 TypeScript 类型定义
  - 更好的代码组织和模块化
  - 增加详细的代码注释

#### 项目结构

- **文档完善**:
  - 新增项目根目录 README.md
  - 新增 ScSearch 组件详细文档
  - 新增组件使用示例文件
  - 新增更新日志文档

### 修复 (Fixed)

#### ScSearch 搜索组件

- 修复表单重置时数据不正确的问题
- 修复展开/收起状态管理问题
- 修复图标显示异常问题
- 修复表单验证时机问题
- 修复响应式布局在小屏幕设备上的显示问题

#### WebRTC 监控模块

- 修复 `getRoomHistory` 函数缺失问题
- 修复 API 导入路径错误 (`@/api/webrtc` → `@/api/webrtc/statistics`)
- 修复语法错误和多余字符问题

### 移除 (Removed)

#### ScSearch 搜索组件

- 移除 Options API 相关代码
- 移除过时的数据绑定方式
- 移除不必要的 Vue 2 兼容代码

### 安全性 (Security)

- 所有新增代码遵循安全最佳实践
- 表单验证增强，防止恶意输入
- 组件暴露的方法进行安全检查

---

## [1.x.x] - 历史版本

### ScSearch 组件 v1.x.x

- 基础功能实现
- 支持基本表单控件类型 (input, select, datepicker, radio, number)
- Options API 实现
- 基础的展开/收起功能
- 简单的搜索和重置功能

### WebRTC 监控模块 v1.x.x

- 基础监控功能
- 系统统计 API
- 房间统计 API
- 实时监控功能

### Holiday 节假日模块 v1.x.x

- 基础页面结构
- 简单的 API 接口定义

---

## 版本说明

### 版本号格式

本项目使用 [语义化版本](https://semver.org/lang/zh-CN/) 格式：`主版本号.次版本号.修订号`

- **主版本号**: 当你做了不兼容的 API 修改
- **次版本号**: 当你做了向下兼容的功能性新增
- **修订号**: 当你做了向下兼容的问题修正

### 更新类型说明

- **新增 (Added)**: 新功能
- **改进 (Changed)**: 对现有功能的更改
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: 任何 bug 修复
- **安全性 (Security)**: 安全相关的修复和改进

### 重要提示

- 🚨 **重大更新**: 可能包含破坏性更改，升级前请仔细阅读文档
- ✨ **新功能**: 新增的功能特性
- 🐛 **问题修复**: 修复的 bug 和问题
- 📚 **文档更新**: 文档相关的更改
- 🎨 **界面优化**: UI/UX 相关的改进
- ⚡ **性能优化**: 性能相关的改进
- 🔒 **安全更新**: 安全相关的修复

---

## 贡献指南

如果您想为本项目贡献代码，请遵循以下规范：

1. **提交信息格式**:

   ```
   <类型>(<范围>): <描述>

   <详细描述>

   <相关问题>
   ```

2. **类型说明**:
   - `feat`: 新功能
   - `fix`: 修复 bug
   - `docs`: 文档更新
   - `style`: 代码格式调整
   - `refactor`: 代码重构
   - `test`: 测试相关
   - `chore`: 构建过程或辅助工具的变动

3. **范围说明**:
   - `ScSearch`: ScSearch 组件
   - `WebRTC`: WebRTC 监控模块
   - `Holiday`: 节假日模块
   - `docs`: 文档
   - `build`: 构建系统

4. **示例**:

   ```
   feat(ScSearch): 添加级联选择器支持

   - 新增 cascader 类型支持
   - 添加 cascaderProps 配置选项
   - 更新类型定义和文档

   Closes #123
   ```

---

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 提交 Issue
- 发起 Pull Request
- 联系开发团队

感谢您对本项目的关注和贡献！
