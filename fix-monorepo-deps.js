#!/usr/bin/env node

/**
 * 修复 monorepo 中 hoisted 模式下的依赖解析问题
 * 将根 node_modules 中的依赖复制到需要它们的包的 node_modules 中
 */

const fs = require('fs');
const path = require('path');

// 需要修复的包及其依赖
const fixes = [
  {
    package: 'packages/build-config',
    deps: ['@pureadmin', 'dayjs', 'gradient-string', 'boxen']
  },
  {
    package: 'packages/tailwind-config',
    deps: ['@iconify', 'autoprefixer', 'tailwindcss', 'cssnano', 'postcss-nesting', 
           'postcss-antd-fixes', 'postcss-import', 'postcss-preset-env']
  }
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  源目录不存在: ${src}`);
    return;
  }
  
  // 确保目标目录的父目录存在
  const destParent = path.dirname(dest);
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🔧 开始修复 monorepo 依赖...\n');

for (const fix of fixes) {
  console.log(`📦 处理 ${fix.package}...`);
  
  const nodeModulesDir = path.join(fix.package, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }
  
  for (const dep of fix.deps) {
    const srcPath = path.join('node_modules', dep);
    const destPath = path.join(nodeModulesDir, dep);
    
    if (fs.existsSync(srcPath)) {
      console.log(`  ✓ 复制 ${dep}`);
      copyDir(srcPath, destPath);
    } else {
      console.log(`  ⚠️  未找到 ${dep}`);
    }
  }
  
  console.log('');
}

console.log('✅ 依赖修复完成!');
