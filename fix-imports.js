import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    
    // 跳过 node_modules, dist, .turbo 等目录
    if (file === 'node_modules' || file === 'dist' || file === '.turbo' || file === '.git') {
      return;
    }

    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.vue') || file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// 查找所有需要修复的文件
const files = getAllFiles(process.cwd());

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = readFileSync(file, 'utf-8');
    let modified = false;

    // 替换 MenuNewBadge 导入
    if (content.includes('from "@repo/components/MenuNewBadge"')) {
      content = content.replace(
        /from "@repo\/components\/MenuNewBadge"/g,
        'from "@repo/components"'
      );
      modified = true;
    }

    // 替换 hooks 导入
    if (content.includes('from "@repo/components/hooks"')) {
      content = content.replace(
        /from "@repo\/components\/hooks"/g,
        'from "@repo/components"'
      );
      modified = true;
    }

    if (modified) {
      writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n修复完成！共修复 ${fixedCount} 个文件`);
