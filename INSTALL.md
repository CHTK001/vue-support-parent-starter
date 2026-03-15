# 依赖安装指南

## 保守方案 - 推荐使用

### 当前配置说明

项目已配置为保守模式，确保在不同环境下都能稳定安装：

1. **Peer 依赖处理**
   - 自动安装 peer 依赖
   - 不严格检查 peer 依赖版本
   - 允许版本不匹配（vite 7, stylelint 16, eslint 9）

2. **可选依赖处理**
   - sharp 和 ttf2woff2 标记为可选，安装失败不影响项目
   - 使用国内镜像加速下载

3. **版本覆盖**
   - onnxruntime-web 使用 >=1.21.0 版本范围

### 安装步骤

```bash
# 1. 清理旧的依赖
pnpm store prune
rm -rf node_modules
rm -rf pnpm-lock.yaml

# 2. 重新安装
pnpm install

# 3. 如果遇到 sharp 或 ttf2woff2 错误，可以忽略
# 这些是可选依赖，不影响项目运行
```

### 常见警告说明

以下警告可以安全忽略：

1. **sharp 安装失败**
   - 原因：SSL 证书验证失败或网络问题
   - 影响：不影响项目运行，sharp 仅用于图片处理优化

2. **ttf2woff2 安装失败**
   - 原因：需要编译原生模块
   - 影响：不影响项目运行，字体转换功能可选

3. **deprecated 警告**
   - 已在 package.json 中配置 allowedDeprecatedVersions
   - 这些包仍然可以正常使用

4. **peer dependency 警告**
   - onnxruntime-web: 版本差异很小（1.21 vs 1.22-dev）
   - stylelint: 使用 16.x 而非 17.x（向后兼容）
   - vite: 使用 7.x 而非 5.x/6.x（向前兼容）

### 验证安装

```bash
# 检查是否可以启动开发服务器
cd apps/vue-support-monitor-starter
pnpm dev
```

## 激进方案（不推荐）

如果需要升级到最新版本，参考以下步骤：

### 核心依赖版本

当前稳定版本：
- Vite: 7.3.1 (最新)
- Element Plus: 2.9.3 (最新)
- ECharts: 5.6.0 (最新)
- Vue: 3.5.13 (最新)

### 升级步骤

```bash
# 1. 更新 catalog 中的版本
# 编辑 pnpm-workspace.yaml

# 2. 清理并重新安装
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. 测试所有功能
pnpm dev
pnpm build
```

### 风险提示

- 新版本可能引入 breaking changes
- 需要全面测试所有功能
- 可能需要修改代码适配新 API

## 故障排除

### 问题：pnpm install 卡住

```bash
# 清理缓存
pnpm store prune
rm -rf ~/.pnpm-store

# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

### 问题：编译错误

```bash
# 清理构建产物
pnpm clean
rm -rf node_modules
pnpm install
```

### 问题：类型错误

```bash
# 重新生成类型定义
pnpm build:packages
```

## 推荐配置

当前配置已经是最佳实践：

- ✅ 使用 pnpm 10.11.0
- ✅ 使用 Node.js 18/20/22
- ✅ 配置国内镜像
- ✅ 忽略可选依赖失败
- ✅ 放宽 peer 依赖检查
- ✅ 允许已知的 deprecated 包

## 总结

**保守方案（当前配置）优势：**
- ✅ 稳定可靠，不同环境都能安装成功
- ✅ 警告可以忽略，不影响功能
- ✅ 无需修改代码
- ✅ 适合团队协作

**激进方案风险：**
- ⚠️ 可能引入新 bug
- ⚠️ 需要大量测试
- ⚠️ 可能需要修改代码
- ⚠️ 不适合生产环境

**建议：使用当前保守配置，除非有明确的升级需求。**
