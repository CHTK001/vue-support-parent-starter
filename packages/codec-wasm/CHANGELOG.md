# Changelog

## [1.2.4] - 2025-10-10

### Fixed
- 修复了build目录缺失的问题，确保WASM模块文件正确放置在build目录中
- 生成了独立的source map文件，满足用户的source map输出要求
- 确保index.js能够正确加载位于build目录中的WASM模块

## [1.2.3] - 2025-10-10

### Changed
- 将UU1相关函数中的所有调试日志输出改为中文说明
- 包括[uu1_decrypt_response](file:///h:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src-rust/src/lib.rs#L239-L372)、[uu1_decrypt_response_object](file:///h:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src-rust/src/lib.rs#L551-L656)和[uu1_decrypt_response_object_with_arraybuffer](file:///h:/workspace/spring-support-api-starter/spring-api-support-monitor-starter/vue-support-parent-starter/packages/codec-wasm/src-rust/src/lib.rs#L658-L766)函数中的日志也改为中文

## [1.2.2] - 2025-10-10

### Changed
- 将UU1函数中的所有调试日志输出改为中文说明
- 优化了SM2解密后的数据处理逻辑，提高了字符串转换的准确性

## [1.2.1] - 2025-10-10

### Fixed
- 修复了UU1函数中SM2解密结果乱码的问题
- 改进了SM2解密后的数据处理逻辑，增强了解密结果的字符串转换处理
- 添加了更多的调试日志以便于问题诊断

## [1.2.0] - 2025-09-30

### Changed
- 完全移除了AssemblyScript实现，仅保留Rust实现
- 更新了JavaScript包装器以直接加载WASM文件而不是JS绑定文件
- 修改了构建脚本以使用Rust直接编译到WASM
- 简化了项目结构，删除了不必要的文件

### Added
- 实现了基于Rust的WASM模块，使用成熟的加密库
- 添加了内存管理函数(alloc/dealloc)以支持字符串传递
- 实现了XOR加密算法以匹配JavaScript版本的行为

### Fixed
- 修复了WASM版本和JavaScript版本加密结果不一致的问题
- 解决了WASM模块导入对象缺失的问题
- 修正了index.html中对已删除文件的引用

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