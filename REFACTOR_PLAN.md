# 模块重构计划

## 当前问题

### 1. 命名混淆

- `packages/pages` - 通用页面组件（error、game、loading、login等）
- `pages/*` - 业务模块（dict、pay、sync、system等）
- 两者名称相似，容易混淆

### 2. 重复依赖

各模块都独立引入了相同的依赖，没有复用系统已有的工具：

#### 重复的依赖

- **axios**: 各模块都直接使用 axios，而系统已有 `@repo/utils/http`
- **element-plus**: 所有模块都引入
- **vue/vue-router/pinia**: 基础依赖重复
- **@pureadmin/utils**: 工具库重复

#### 系统已有但未被复用的工具

- `packages/utils/src/http/` - 统一的 HTTP 请求工具（支持拦截器、SSE、请求取消等）
- `packages/utils/src/` - 其他工具函数
- `@repo/components` - 共享组件库

### 3. 模块结构不统一

- 有些模块有完整的 API、页面、stores
- 有些模块只有页面组件
- 缺乏统一的模块规范

## 改进方案

### 第一阶段：重命名避免混淆

1. **重命名 packages/pages**

   ```
   packages/pages → packages/common-pages
   @repo/common → @repo/common
   ```

2. **更新所有引用**
   - `layout/default/src/index.vue`
   - `apps/vue-support-system-parent/package.json`
   - `package.json`
   - `packages/build-config/src/utils.ts`
   - 其他引用文件

### 第二阶段：统一 HTTP 工具

1. **创建统一的 API 基类**

   ```typescript
   // packages/utils/src/http/api-base.ts
   import { http } from "./index";

   export class ApiBase {
     constructor(protected baseURL: string) {}

     protected get<T>(url: string, params?: any) {
       return http.request<T>("get", this.baseURL + url, { params });
     }

     protected post<T>(url: string, data?: any) {
       return http.request<T>("post", this.baseURL + url, { data });
     }

     // ... 其他方法
   }
   ```

2. **各模块改用统一工具**

   ```typescript
   // pages/sync/api/sync.ts (改造前)
   import axios from "axios";
   const api = axios.create({ baseURL: "/api/v1/sync" });

   // pages/sync/api/sync.ts (改造后)
   import { ApiBase } from "@repo/utils/http/api-base";
   class SyncApi extends ApiBase {
     constructor() {
       super("/api/v1/sync");
     }
   }
   export const syncApi = new SyncApi();
   ```

### 第三阶段：优化模块依赖

1. **提取公共依赖到 workspace 根**
   - element-plus
   - vue/vue-router/pinia
   - @pureadmin/utils

2. **各模块只保留特有依赖**
   - pages/sync: @repo/scReteEditor
   - pages/dict: pinyin-pro
   - pages/pay: 支付相关特有依赖

3. **统一使用 @repo/components**
   - 避免各模块重复实现相同组件
   - 共享组件统一维护

### 第四阶段：建立模块规范

创建模块模板和规范文档：

```
pages/[module-name]/
├── src/
│   ├── api/           # API 接口（使用 @repo/utils/http）
│   ├── components/    # 模块私有组件
│   ├── pages/         # 页面组件
│   ├── stores/        # Pinia stores
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 模块私有工具
│   └── index.ts       # 导出入口
├── package.json       # 依赖配置
├── README.md          # 模块文档
└── tsconfig.json      # TS 配置
```

## 实施优先级

### 高优先级（立即执行）

1. ✅ 修正模块位置（sync、pay 移回 pages/）
2. 🔄 重命名 packages/pages → packages/common-pages
3. 🔄 更新所有 @repo/common 引用

### 中优先级（本周完成）

4. 统一 HTTP 工具使用
5. 清理重复依赖

### 低优先级（逐步优化）

6. 建立模块规范文档
7. 重构现有模块符合规范

## 预期收益

1. **清晰的命名** - 不再混淆通用组件和业务模块
2. **减少重复** - 统一工具，减少维护成本
3. **更好的复用** - 充分利用系统已有能力
4. **统一规范** - 新模块开发有章可循
5. **更小的包体积** - 减少重复依赖

## 风险评估

- **低风险**: 重命名操作，影响范围可控
- **中风险**: HTTP 工具统一，需要逐个模块测试
- **需要测试**: 所有改动后需要完整的功能测试

## 下一步行动

1. 完成 packages/pages → packages/common-pages 重命名
2. 更新所有引用
3. 提交并测试
4. 开始 HTTP 工具统一改造
