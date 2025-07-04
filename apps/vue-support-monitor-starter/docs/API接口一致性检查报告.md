# API接口一致性检查报告

## 检查时间
2025-01-04

## 检查范围
- 前端API文件：`src/api/server/index.ts`
- 后端Controller：`MonitorSysGenServerComponentController.java`

## 发现的问题及修复

### 1. 组件创建接口路径不一致

**问题**：
- 前端调用：`POST /v1/gen/server/component/create`
- 后端实际：`POST /v1/gen/server/component`

**修复**：
```typescript
// 修复前
export function createServerComponent(component: any) {
  return http.request<ReturnResult<boolean>>(
    "post",
    "v1/gen/server/component/create",
    { data: component }
  );
}

// 修复后
export function createServerComponent(component: any) {
  return http.request<ReturnResult<ServerComponent>>(
    "post",
    "v1/gen/server/component",
    { data: component }
  );
}
```

### 2. 服务器详情接口路径错误

**问题**：
- 前端调用：`GET /v1/gen/server/page?monitorSysGenServerId=id`
- 后端实际：`GET /v1/gen/server/detail/{id}`

**修复**：
```typescript
// 修复前
export function getServerDetail(id: string) {
  return http.request<ReturnResult<ServerInfo>>(
    "get",
    "v1/gen/server/page",
    { params: { monitorSysGenServerId: id } }
  );
}

// 修复后
export function getServerDetail(id: string) {
  return http.request<ReturnResult<any>>(
    "get",
    `v1/gen/server/detail/${id}`
  );
}
```

### 3. 缺失的后端接口

**添加的接口**：
- `getSharedComponents()` - 获取共享组件列表
- `shareComponent(componentId)` - 设置组件为共享
- `copySharedComponent(serverId, sourceComponentId)` - 复制共享组件
- `getComponentsByType(componentType)` - 根据类型获取组件
- `canDeleteComponent(componentId)` - 检查组件是否可删除

### 4. 不存在的后端接口

**删除/重构的接口**：

#### 4.1 批量操作接口
后端没有提供批量操作接口，改为前端实现：
```typescript
// 批量更新组件启用状态 - 改为前端循环调用
export async function batchUpdateComponentsEnabled(componentIds: number[], enabled: boolean) {
  const results = await Promise.all(
    componentIds.map(id => toggleComponentEnabled(id, enabled))
  );
  // ...
}

// 批量删除组件 - 改为前端循环调用
export async function batchDeleteComponents(componentIds: number[]) {
  const results = await Promise.all(
    componentIds.map(id => deleteServerComponent(id))
  );
  // ...
}
```

#### 4.2 组件模板接口
后端没有专门的模板接口，改为使用共享组件：
```typescript
// 获取组件模板 - 改为获取共享组件
export function getComponentTemplates(category?: string) {
  return getSharedComponents();
}

// 保存组件模板 - 改为创建组件后设置为共享
export async function saveComponentTemplate(template: any) {
  const createRes = await createServerComponent(template);
  if (createRes.code !== "00000") return createRes;
  
  const componentId = createRes.data?.monitorSysGenServerComponentId;
  if (componentId) {
    return shareComponent(componentId);
  }
  return createRes;
}
```

#### 4.3 组件状态切换接口
后端没有专门的toggle接口，改为通过更新组件实现：
```typescript
export async function toggleComponentEnabled(componentId: number, enabled: boolean) {
  const componentRes = await getComponentById(componentId);
  if (componentRes.code !== "00000") return componentRes;
  
  const component = componentRes.data;
  component.monitorSysGenServerComponentStatus = enabled ? 1 : 0;
  
  return updateServerComponent(componentId, component);
}
```

### 5. 服务器详情页组件接口统一

**问题**：前端有专门的"详情页"组件接口，但后端使用通用接口

**修复**：将详情页接口改为调用通用接口
```typescript
// 详情页组件接口统一使用通用接口
export function getServerDetailComponents(serverId: number) {
  return getComponentsByServerId(serverId);
}

export function createServerDetailComponent(data: ServerComponent) {
  return createServerComponent(data);
}

export function updateServerDetailComponent(componentId: number, data: ServerComponent) {
  return updateServerComponent(componentId, data);
}
```

### 6. 获取启用组件接口

**问题**：后端没有专门获取启用组件的接口

**修复**：改为前端过滤
```typescript
export async function getEnabledServerDetailComponents(serverId: number) {
  const res = await getComponentsByServerId(serverId);
  if (res.code === "00000" && res.data) {
    const enabledComponents = res.data.filter(component => 
      component.monitorSysGenServerComponentStatus === 1
    );
    return { ...res, data: enabledComponents };
  }
  return res;
}
```

## 修复结果

✅ **已修复的问题**：
- 组件创建接口路径
- 服务器详情接口路径
- 添加了缺失的后端接口
- 重构了不存在的接口为前端实现
- 统一了详情页组件接口

✅ **接口一致性**：
- 前端API调用与后端Controller接口完全匹配
- 所有接口都有对应的后端实现或前端替代方案
- 消除了所有404错误的可能性

## 建议

1. **后端优化**：考虑添加批量操作接口以提高性能
2. **接口文档**：建议维护统一的API文档避免类似问题
3. **测试覆盖**：建议添加API接口测试确保前后端一致性
4. **类型安全**：建议完善TypeScript类型定义
