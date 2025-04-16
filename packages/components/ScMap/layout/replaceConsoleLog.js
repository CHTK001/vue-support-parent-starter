const fs = require('fs');
const path = require('path');

// 文件路径
const aMapPath = path.join(__dirname, 'AMap.vue');
const tMapPath = path.join(__dirname, 'TMap.vue');

// 处理单个文件
function processFile(filePath) {
  console.log(`处理文件: ${filePath}`);
  
  // 读取文件内容
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查导入语句
  if (!content.includes("import { info } from '@repo/utils';")) {
    // 在导入部分添加info导入
    content = content.replace(
      /import {([^}]+)} from 'vue';/,
      "import {$1} from 'vue';\nimport { info } from '@repo/utils';"
    );
  }
  
  // 替换所有console.log调用
  // 匹配模式1: console.log('文本', 变量);
  content = content.replace(
    /console\.log\(['"](.+?)['"](?:,\s*([^)]+))?\);/g,
    (match, text, vars) => {
      if (vars) {
        return `info('${text} {}', ${vars});`;
      } else {
        return `info('${text}');`;
      }
    }
  );
  
  // 匹配模式2: console.log(`模板字符串${var}`);
  content = content.replace(
    /console\.log\(`(.+?)`\);/g,
    (match, template) => {
      // 将模板字符串中的${var}替换为{}
      const formattedTemplate = template.replace(/\${([^}]+)}/g, '{}');
      const vars = [];
      
      // 提取变量
      let varMatch;
      const varRegex = /\${([^}]+)}/g;
      while ((varMatch = varRegex.exec(template)) !== null) {
        vars.push(varMatch[1]);
      }
      
      if (vars.length > 0) {
        return `info('${formattedTemplate}', ${vars.join(', ')});`;
      } else {
        return `info('${formattedTemplate}');`;
      }
    }
  );
  
  // 特殊处理复杂情况: console.log('文本:', 复杂对象);
  content = content.replace(
    /console\.log\(['"]([^'"]+?):['"](?:,\s*([^)]+))?\);/g,
    (match, text, obj) => {
      if (obj) {
        return `info('${text}: {}', ${obj});`;
      } else {
        return `info('${text}:');`;
      }
    }
  );
  
  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`文件处理完成: ${filePath}`);
}

// 处理两个文件
processFile(aMapPath);
processFile(tMapPath);

console.log('所有文件处理完成！'); 