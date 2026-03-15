# Codec 加密模式使用说明

## 三种加密模式

### 1. `auto` 模式（默认）
- **行为**: 优先尝试加载 WASM，失败时自动降级到 JS 实现
- **适用场景**: 大多数情况，平衡性能和兼容性
- **特点**: 
  - WASM 可用时使用 WASM（高性能）
  - WASM 不可用时使用 JS（高兼容性）
  - 无需担心 WASM 构建问题

### 2. `wasm` 模式
- **行为**: 强制使用 WASM，加载失败时抛出错误
- **适用场景**: 
  - 已确保 WASM 文件存在
  - 需要最佳性能
  - 生产环境且已构建 WASM
- **特点**:
  - 性能最优
  - WASM 不可用时会报错，不会降级

### 3. `js` 模式
- **行为**: 强制使用 JS 实现，不尝试加载 WASM
- **适用场景**:
  - 开发环境，未构建 WASM
  - 兼容性优先
  - 调试 JS 实现
- **特点**:
  - 不加载 WASM，避免 404 错误
  - 兼容性最好
  - 性能略低于 WASM

## 使用方法

### 在应用启动时设置模式

```javascript
import { setCodecMode, CodecMode, initializeWasmModule } from '@repo/codec-wasm';

// 方式 1: 设置为 auto 模式（默认）
setCodecMode(CodecMode.AUTO);
await initializeWasmModule();

// 方式 2: 设置为 wasm 模式（强制 WASM）
setCodecMode(CodecMode.WASM);
try {
  await initializeWasmModule();
} catch (error) {
  console.error('WASM 加载失败:', error);
  // 处理错误，可能需要回退到其他方案
}

// 方式 3: 设置为 js 模式（强制 JS）
setCodecMode(CodecMode.JS);
// 不需要调用 initializeWasmModule()
```

### 在 main.ts 中配置

```typescript
// apps/vue-support-monitor-starter/src/main.ts
import { setCodecMode, CodecMode, initializeWasmModule } from '@repo/codec-wasm';

// 根据环境变量或配置决定模式
const codecMode = import.meta.env.VITE_CODEC_MODE || 'auto';
setCodecMode(codecMode);

// 如果不是 js 模式，初始化 WASM
if (codecMode !== 'js') {
  initializeWasmModule().catch(error => {
    console.warn('WASM 初始化失败，将使用 JS 实现:', error);
  });
}
```

### 环境变量配置

在 `.env` 文件中设置：

```bash
# 开发环境 - 使用 JS 模式避免 WASM 404 错误
VITE_CODEC_MODE=js

# 生产环境 - 使用 auto 模式
VITE_CODEC_MODE=auto

# 如果已构建 WASM - 使用 wasm 模式获得最佳性能
VITE_CODEC_MODE=wasm
```

## 运行时切换模式

```javascript
import { setCodecMode, CodecMode, getCodecMode } from '@repo/codec-wasm';

// 查看当前模式
console.log('当前模式:', getCodecMode());

// 切换到 JS 模式
setCodecMode(CodecMode.JS);

// 切换到 WASM 模式（需要重新初始化）
setCodecMode(CodecMode.WASM);
await initializeWasmModule();
```

## 检查当前使用的实现

```javascript
import { isWasmLoaded, getCodecMode } from '@repo/codec-wasm';

console.log('当前模式:', getCodecMode());
console.log('WASM 是否已加载:', isWasmLoaded());

if (isWasmLoaded()) {
  console.log('✅ 使用 WASM 实现（高性能）');
} else {
  console.log('ℹ️ 使用 JS 实现（高兼容性）');
}
```

## 推荐配置

### 开发环境
```javascript
// 避免 WASM 404 错误
setCodecMode(CodecMode.JS);
```

### 生产环境（已构建 WASM）
```javascript
// 优先使用 WASM，失败时降级
setCodecMode(CodecMode.AUTO);
await initializeWasmModule();
```

### 生产环境（未构建 WASM）
```javascript
// 直接使用 JS
setCodecMode(CodecMode.JS);
```

## 性能对比

| 操作 | WASM 模式 | JS 模式 | 性能提升 |
|------|-----------|---------|----------|
| SM3 哈希 | ~0.5ms | ~2ms | 4x |
| AES 加密 | ~0.3ms | ~1.5ms | 5x |
| SM2 加密 | ~1ms | ~5ms | 5x |
| 大量数据处理 | 显著更快 | 较慢 | 5-10x |

## 注意事项

1. **模式切换**: 切换模式后需要重新初始化 WASM（如果切换到 wasm 或 auto）
2. **错误处理**: wasm 模式下 WASM 加载失败会抛出错误，需要妥善处理
3. **构建要求**: wasm 模式需要先构建 WASM 文件（参考 BUILD_INSTRUCTIONS.md）
4. **默认模式**: 如果不设置，默认使用 auto 模式
