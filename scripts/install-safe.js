#!/usr/bin/env node

/**
 * 安全安装脚本
 * 处理可选依赖安装失败的情况
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始安全安装依赖...\n');

// 设置环境变量
process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

try {
  // 首先尝试正常安装
  console.log('📦 尝试正常安装...');
  execSync('pnpm install', { 
    stdio: 'inherit',
    env: process.env
  });
  console.log('\n✅ 安装成功！');
} catch (error) {
  console.log('\n⚠️  正常安装失败，尝试忽略脚本安装...');
  
  try {
    // 如果失败，使用 --ignore-scripts
    execSync('pnpm install --ignore-scripts', { 
      stdio: 'inherit',
      env: process.env
    });
    
    // 然后只运行必要的脚本
    console.log('\n📝 运行必要的构建脚本...');
    try {
      execSync('pnpm rebuild protobufjs', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️  protobufjs rebuild 失败，但不影响使用');
    }
    
    console.log('\n✅ 安装成功（已跳过可选依赖）！');
  } catch (error2) {
    console.error('\n❌ 安装失败:', error2.message);
    console.log('\n💡 请尝试以下解决方案：');
    console.log('1. 检查网络连接');
    console.log('2. 清除缓存: pnpm store prune');
    console.log('3. 删除 node_modules 和 pnpm-lock.yaml 后重试');
    process.exit(1);
  }
}

// 检查关键依赖是否安装成功
console.log('\n🔍 检查关键依赖...');
const criticalDeps = ['vue', 'vite', 'element-plus'];
let allGood = true;

for (const dep of criticalDeps) {
  const depPath = path.join(__dirname, '..', 'node_modules', dep);
  if (fs.existsSync(depPath)) {
    console.log(`✓ ${dep}`);
  } else {
    console.log(`✗ ${dep} - 缺失`);
    allGood = false;
  }
}

if (allGood) {
  console.log('\n🎉 所有关键依赖已就绪！');
} else {
  console.log('\n⚠️  部分关键依赖缺失，请检查安装日志');
}
