# Changelog

## [1.1.6] - 2025-09-30

### Changed
- 修改了encryptStorageKey函数，使用AES加密算法替代SM4加密算法

## [1.1.5] - 2025-09-30

### Fixed
- 修复了encryptStorageKey函数中的内存访问越界错误
- 修正了sm4EncryptBlock函数中的轮函数实现，避免了无效的内存访问
- 优化了SM4加密算法的实现，提高了稳定性和性能

## [1.1.4] - 2025-09-30

### Added
- 实现了encryptStorageKey函数，用于加密存储键
- 实现了encryptStorageValue函数，用于加密存储值
- 实现了decryptStorageValue函数，用于解密存储值
- 添加了对不同加密算法(SM4/AES)的支持

### Fixed
- 修复了WASM模块中缺少encryptStorageKey函数导致的"TypeError: wasmModule.encryptStorageKey is not a function"错误

## [1.1.3] - 2025-09-30

### Changed
- 修改了uu2_wasm函数，使其直接接收PureHttpRequestConfig对象并在index.js中处理加密逻辑
- 简化了codec.ts中的uu2函数实现，直接传递请求对象给WASM处理
- 更新了AssemblyScript源码，添加了uu2_wasm函数的实现

### Added
- 在uu2_wasm函数中实现了根据配置判断是否开启加密的逻辑
- 实现了只对GET和JSON请求进行加密，不处理表单数据的逻辑
- 添加了加密密钥随机生成并写入header的功能

## [1.1.2] - 2025-09-30

### Changed
- 修改了uu1_wasm函数，使其直接接收PureHttpResponse对象并在index.js中处理解密逻辑
- 简化了codec.ts中的uu1函数实现，直接传递响应对象给WASM处理
- 更新了AssemblyScript源码，添加了uu1_wasm函数的实现

### Added
- 在uu1_wasm函数中实现了根据header中的originKey值判断是否为加密数据的逻辑
- 实现了解密后替换response.data并删除相关header的功能

## [1.1.1] - 2025-09-30

### Changed
- 删除了JavaScript层WASM导入对象中冗余的加解密算法定义，因为这些算法已在WASM内部实现
- 简化了WASM模块的导入对象，仅保留必要的环境函数

## [1.1.0] - 2025-09-30

### Added
- 实现了完整的AES加解密算法在WASM源码中
- 实现了SM2加解密算法的基础框架在WASM源码中
- 添加了详细的README文档说明新功能

### Changed
- 修复了WASM模块加载问题
- 优化了AssemblyScript代码结构
- 改进了错误处理和边界检查

### Fixed
- 修复了AES加解密算法中的内存访问越界问题
- 修复了SM2解密函数中的输入验证问题
- 修复了WASM模块导出函数的绑定问题

## [1.0.0] - 2025-09-20

### Added
- Initial release
- SM4 encryption implementation
- Basic WASM module structure
- JavaScript proxy layer

### Changed
- Modified JavaScript wrapper to ensure it only acts as a proxy
- Updated TypeScript declarations to match the new API
- Improved WASM module loading mechanism
- Enhanced error handling and logging

### Fixed
- Resolved issues with Node.js compatibility by designing for browser environment
- Fixed object parameter passing by using function wrappers instead of JSON serialization
- Addressed WASM module loading issues in browser environments

## Key Implementation Details

### Object Parameter Passing

Instead of serializing objects to JSON strings, we pass objects as functions to WASM:

```javascript
// Before (serialized JSON)
const requestData = JSON.stringify(request);

// After (function wrapper)
const requestFunc = (key) => {
  switch (key) {
    case 'data': return request.data;
    case 'url': return request.url;
    default: return '';
  }
};
```

### Pure Proxy JavaScript Layer

The JavaScript layer acts only as a proxy, forwarding function calls to the WASM module:

```javascript
// JavaScript wrapper (pure proxy)
export function uu2_wasm(requestFunc, getConfig) {
  ensureWasmLoaded();
  return wasmModule.uu2_wasm(requestFunc, getConfig);
}
```

### Business Logic in WASM

All business logic is implemented in the AssemblyScript code:

```typescript
// AssemblyScript (business logic)
export function uu2_wasm(requestFunc: (key: string) => string, getConfig: (key: string) => string): string {
  // All encryption logic implemented here
  // ...
}
```