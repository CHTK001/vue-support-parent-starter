# Codec WASM 构建说明

## 加密模式

此包支持三种加密模式：

- **`auto`** (默认): 优先 WASM，失败时自动降级到 JS
- **`wasm`**: 强制使用 WASM，失败时抛出错误
- **`js`**: 强制使用 JS 实现，不加载 WASM

详细使用方法请参考 `MODE_USAGE.md`

## 快速开始

### 开发环境（推荐）

如果不想构建 WASM，可以使用 JS 模式：

```javascript
import { setCodecMode, CodecMode } from '@repo/codec-wasm';
setCodecMode(CodecMode.JS);
```

这样可以避免 WASM 404 错误，直接使用 JS 实现。

### 生产环境

如果需要更好的性能，建议构建 WASM 并使用 auto 模式。

## 问题说明

`codec_wasm.js` 文件没有生成是因为缺少 Rust 工具链。这是一个 WebAssembly 项目，需要从 Rust 源代码编译。

## 为什么需要 Rust？

此包使用 Rust 编写加密/解密算法，然后编译为 WebAssembly 以获得更好的性能。源代码位于 `src-rust/` 目录。

## 安装 Rust 工具链

### Windows 系统

1. **使用 winget 安装（推荐）**
   ```powershell
   winget install Rustlang.Rustup
   ```

2. **或访问官网下载**
   - 访问 https://rustup.rs/
   - 下载并运行 `rustup-init.exe`
   - 按照提示完成安装

3. **安装 wasm-pack**
   ```powershell
   cargo install wasm-pack
   ```

4. **验证安装**
   ```powershell
   rustc --version
   cargo --version
   wasm-pack --version
   ```

### Linux/macOS 系统

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack
cargo install wasm-pack

# 验证安装
rustc --version
cargo --version
wasm-pack --version
```

## 构建 WASM 模块

安装完 Rust 工具链后，运行：

```bash
pnpm --filter @repo/codec-wasm build
```

构建成功后，`build/` 目录将包含：
- `codec_wasm.js` - WASM 绑定代码
- `codec_wasm_bg.wasm` - 编译后的 WASM 模块
- `codec_wasm.d.ts` - TypeScript 类型定义

## 当前解决方案

如果不想安装 Rust 工具链，代码已经实现了降级方案：
- WASM 模块加载失败时，会自动降级到 JavaScript 实现
- 使用动态导入 `@vite-ignore` 注释避免 Vite 构建时检查文件是否存在
- 运行时会捕获错误并使用 JS 版本的加密算法

## 性能对比

- **WASM 版本**：性能更好，适合大量加密/解密操作
- **JS 版本**：兼容性更好，无需额外构建步骤

## 相关文件

- `src-rust/` - Rust 源代码
- `scripts/build-wasm.mjs` - 构建脚本
- `src/index.js` - 主入口，包含降级逻辑
- `build/` - 构建输出目录（需要 .gitignore）
