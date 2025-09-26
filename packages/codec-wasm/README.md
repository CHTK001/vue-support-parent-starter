# Codec WASM Module

这个模块将codec.ts中的加密解密功能编译为WebAssembly (WASM)，以提供更好的性能和代码保护。

## 目录结构

```
codec-wasm/
├── assembly/           # AssemblyScript源代码
│   └── index.ts        # 核心加密解密逻辑
├── build/              # 编译输出目录
│   ├── release.wasm    # 生成的WASM文件（生产版本）
│   ├── debug.wasm      # 生成的WASM文件（调试版本）
│   └── *.d.ts          # TypeScript声明文件
├── src/                # JavaScript包装器
│   └── index.js        # WASM模块的JavaScript接口
├── asconfig.json       # AssemblyScript编译配置
└── package.json        # 项目配置文件
```

## 功能特性

1. **请求加密** - 使用SM4算法加密HTTP请求数据
2. **响应解密** - 使用SM2算法解密HTTP响应数据
3. **AES解密工具** - 提供AES解密功能
4. **反重放攻击保护** - 生成时间戳和nonce防止重放攻击
5. **特殊响应处理** - 处理特定格式的加密响应

## 编译要求

- Node.js >= 14.0.0
- AssemblyScript编译器

## 编译步骤

1. 安装依赖：
   ```bash
   npm install
   ```

2. 编译为WASM：
   ```bash
   # 开发版本（带调试信息）
   npm run asbuild:debug
   
   # 生产版本（优化）
   npm run asbuild:release
   
   # 或者一次性编译所有版本
   npm run asbuild
   ```

3. 编译后的文件将位于 `build/` 目录中

## 使用方法

在JavaScript/TypeScript项目中使用：

```javascript
import { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm, initWasm } from '@repo/codec-wasm';

// 初始化WASM模块（应用启动时调用一次）
await initWasm();

// 请求加密
const encryptedRequest = await uu2_wasm(request, getConfig);

// 响应解密
const decryptedResponse = await uu1_wasm(response);

// AES解密
const decryptedData = await uu3_wasm(encryptedValue);

// 特殊响应解密
const specialDecryptedData = await uu4_wasm(response);
```

## 性能优势

使用WASM版本相比纯JavaScript版本有以下优势：

1. **执行速度更快** - WASM运行速度比JavaScript快2-10倍
2. **内存使用更少** - WASM有更高效的内存管理
3. **代码保护** - WASM二进制代码难以反编译和分析
4. **安全性增强** - 加密算法在WASM沙箱中运行

## 安全特性

1. **代码混淆** - WASM二进制格式难以理解和修改
2. **反调试** - WASM运行环境提供反调试保护
3. **密钥保护** - 加密密钥在WASM模块中更难被提取
4. **完整性验证** - 提供时间戳和nonce验证机制

## 注意事项

1. WASM模块需要异步加载，首次使用前需要确保模块已加载完成
2. 某些浏览器API在WASM中不可用，需要通过JavaScript桥接
3. 错误处理需要考虑WASM和JavaScript之间的边界情况

## 生成的文件说明

- `release.wasm` - 优化后的生产版本WASM文件（12KB）
- `debug.wasm` - 包含调试信息的开发版本WASM文件（22KB）
- `release.d.ts` - TypeScript声明文件，提供类型支持
- `release.js` - WASM加载器脚本

## 集成到现有项目

要将此WASM模块集成到现有项目中：

1. 将整个`codec-wasm`目录复制到项目的`packages`目录下
2. 在主项目的`package.json`中添加依赖：
   ```json
   {
     "dependencies": {
       "@repo/codec-wasm": "file:packages/codec-wasm"
     }
   }
   ```
3. 在应用启动时初始化WASM模块：
   ```javascript
   import { initWasm } from '@repo/codec-wasm';
   
   // 应用启动时初始化
   initWasm().catch(error => {
     console.error('Failed to initialize codec WASM:', error);
   });
   ```

这样就可以在保持原有接口不变的情况下，使用WASM版本提供更好的性能和安全性。