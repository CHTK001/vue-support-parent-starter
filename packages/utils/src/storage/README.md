# Storage 工具使用说明

本工具提供了多种存储操作方式，包括同步和异步版本，以及支持加密的版本。

## 使用方式

### 1. 异步存储（支持加密）

异步版本支持数据加密功能，使用WASM进行加密和解密，提供更高的安全性。

```typescript
import { localStorageProxy, sessionStorageProxy } from "@repo/utils";

// 存储数据（需要await）
await localStorageProxy().setItem('key', 'value');

// 读取数据（需要await）
const value = await localStorageProxy().getItem('key');

// 删除数据
await localStorageProxy().removeItem('key');

// 清空所有数据
await localStorageProxy().clear();
```

### 2. 同步存储（不支持加密）

同步版本不支持数据加密，但可以直接返回值，无需使用await。

```typescript
import { syncLocalStorageProxy, syncSessionStorageProxy } from "@repo/utils";

// 存储数据（直接调用，无需await）
syncLocalStorageProxy().setItem('key', 'value');

// 读取数据（直接返回值，无需await）
const value = syncLocalStorageProxy().getItem('key');

// 删除数据
syncLocalStorageProxy().removeItem('key');

// 清空所有数据
syncLocalStorageProxy().clear();
```

## 选择建议

1. **需要数据加密**：使用异步版本 `localStorageProxy()` 或 `sessionStorageProxy()`
2. **不需要数据加密且希望简单直接**：使用同步版本 `syncLocalStorageProxy()` 或 `syncSessionStorageProxy()`
3. **兼容性考虑**：同步版本在所有环境下都能正常工作，异步版本需要浏览器支持相关API

## 注意事项

1. 异步版本返回Promise，必须使用await或.then()处理
2. 同步版本不支持加密功能，如需加密请使用异步版本
3. 两种版本的API接口保持一致，便于切换