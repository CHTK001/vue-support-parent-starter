/**
 * 清理 console.log 调试代码脚本
 * @description 扫描并清理 layout 组件中的调试日志代码
 * 
 * 使用方式：
 *   node scripts/clean-console-logs.js --dry-run  # 预览要删除的代码
 *   node scripts/clean-console-logs.js            # 执行清理
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  // 要扫描的目录
  scanDirs: [
    'layout/default/src/components',
    'layout/default/src/hooks',
  ],
  // 文件扩展名
  extensions: ['.vue', '.ts', '.tsx'],
  // 要清理的模式
  patterns: [
    // 移除 console.log 调用（包含表情符号的调试日志）
    /^\s*console\.log\s*\([^)]*[🚀🎨🔄🌈][^)]*\);\s*$/gm,
    // 移除带有主题相关注释的 console.log
    /^\s*console\.log\s*\(['"`].*(?:主题|theme|Theme).*['"`].*\);\s*$/gm,
  ],
  // 排除的文件
  excludeFiles: [
    'themeStore.ts', // 保留 store 中的条件日志
  ],
};

// 是否为干运行模式
const isDryRun = process.argv.includes('--dry-run');

/**
 * 获取所有要扫描的文件
 */
function getFilesToScan() {
  const files = [];
  
  for (const dir of CONFIG.scanDirs) {
    const fullDir = path.resolve(__dirname, '..', dir);
    
    for (const ext of CONFIG.extensions) {
      const pattern = path.join(fullDir, '**', `*${ext}`);
      const matched = glob.sync(pattern, { nodir: true });
      files.push(...matched);
    }
  }
  
  return files.filter(file => {
    const basename = path.basename(file);
    return !CONFIG.excludeFiles.includes(basename);
  });
}

/**
 * 清理文件中的调试代码
 */
function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let hasChanges = false;
  const changes = [];
  
  for (const pattern of CONFIG.patterns) {
    const matches = content.match(pattern);
    if (matches) {
      hasChanges = true;
      changes.push(...matches.map(m => m.trim()));
      newContent = newContent.replace(pattern, '');
    }
  }
  
  // 清理空行（连续多个空行变成一个）
  newContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  return { newContent, hasChanges, changes };
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始扫描调试代码...\n');
  console.log(`模式: ${isDryRun ? '预览（干运行）' : '执行清理'}\n`);
  
  const files = getFilesToScan();
  console.log(`找到 ${files.length} 个文件\n`);
  
  let totalChanges = 0;
  const changedFiles = [];
  
  for (const file of files) {
    const { newContent, hasChanges, changes } = cleanFile(file);
    
    if (hasChanges) {
      changedFiles.push({ file, changes });
      totalChanges += changes.length;
      
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📝 ${relativePath}`);
      changes.forEach(change => {
        console.log(`   - ${change.substring(0, 80)}${change.length > 80 ? '...' : ''}`);
      });
      console.log('');
      
      if (!isDryRun) {
        fs.writeFileSync(file, newContent, 'utf-8');
      }
    }
  }
  
  console.log('━'.repeat(60));
  console.log(`\n📊 扫描完成!`);
  console.log(`   文件数: ${changedFiles.length}`);
  console.log(`   修改数: ${totalChanges}`);
  
  if (isDryRun && totalChanges > 0) {
    console.log('\n💡 使用 node scripts/clean-console-logs.js 执行实际清理');
  } else if (!isDryRun && totalChanges > 0) {
    console.log('\n✅ 清理完成!');
  }
}

main();
