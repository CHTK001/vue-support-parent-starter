import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 路径配置
const distDir = resolve(__dirname, 'dist');
const springStaticDir = resolve(__dirname, '../../../spring-support-parent-starter/spring-support-swagger-starter/src/main/resources/static');

console.log('🚀 开始部署 Vue Swagger 到 Spring...\n');

// 1. 清空 Spring static 目录
console.log('📁 清空目标目录:', springStaticDir);
if (existsSync(springStaticDir)) {
  rmSync(springStaticDir, { recursive: true, force: true });
}
mkdirSync(springStaticDir, { recursive: true });
console.log('✅ 目标目录已清空\n');

// 2. 读取 index.html 并重命名为 docv2.html
console.log('📝 处理 index.html...');
const indexHtmlPath = join(distDir, 'index.html');
const indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');

// 提取 JS 和 CSS 文件名
const jsMatch = indexHtmlContent.match(/static\/js\/(index-[^"]+\.js)/);
const cssMatch = indexHtmlContent.match(/static\/css\/(index-[^"]+\.css)/);

if (!jsMatch || !cssMatch) {
  console.error('❌ 无法找到 JS 或 CSS 文件引用');
  process.exit(1);
}

const jsFileName = jsMatch[1];
const cssFileName = cssMatch[1];

console.log('  - JS 文件:', jsFileName);
console.log('  - CSS 文件:', cssFileName);

// 重命名为固定文件名
const newJsFileName = 'doc-v2.js';
const newCssFileName = 'doc-v2-style.css';

// 更新 HTML 内容 - 移除 static/js 和 static/css 路径前缀
let newHtmlContent = indexHtmlContent
  .replace(`static/js/${jsFileName}`, newJsFileName)
  .replace(`static/css/${cssFileName}`, newCssFileName)
  .replace('<title>API 文档</title>', '<title>API 文档 V2</title>');

// 写入 docv2.html
const docv2HtmlPath = join(springStaticDir, 'doc-v2.html');
writeFileSync(docv2HtmlPath, newHtmlContent, 'utf-8');
console.log('✅ 已生成 doc-v2.html\n');

// 3. 复制并重命名 JS 文件
console.log('📦 复制 JavaScript 文件...');
const srcJsPath = join(distDir, 'static', 'js', jsFileName);
const destJsPath = join(springStaticDir, newJsFileName);
copyFileSync(srcJsPath, destJsPath);
console.log(`✅ ${jsFileName} -> ${newJsFileName}\n`);

// 4. 复制并重命名 CSS 文件
console.log('🎨 复制 CSS 文件...');
const srcCssPath = join(distDir, 'static', 'css', cssFileName);
const destCssPath = join(springStaticDir, newCssFileName);
copyFileSync(srcCssPath, destCssPath);
console.log(`✅ ${cssFileName} -> ${newCssFileName}\n`);

// 5. 复制其他静态资源（如果需要）
console.log('📋 复制其他静态资源...');
const staticFiles = ['favicon.ico', 'logo.svg', 'loader.js', 'platform-config.json'];
staticFiles.forEach(file => {
  const srcPath = join(distDir, file);
  if (existsSync(srcPath)) {
    const destPath = join(springStaticDir, file);
    copyFileSync(srcPath, destPath);
    console.log(`  ✅ ${file}`);
  }
});

// 6. 复制 static 目录下的其他资源（图片、字体等）
const copyDirRecursive = (src, dest) => {
  if (!existsSync(src)) return;
  
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过 js 和 css 目录（已经处理过了）
      if (entry.name !== 'js' && entry.name !== 'css') {
        copyDirRecursive(srcPath, destPath);
      }
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
};

const distStaticDir = join(distDir, 'static');
if (existsSync(distStaticDir)) {
  const staticSubDirs = readdirSync(distStaticDir, { withFileTypes: true });
  staticSubDirs.forEach(entry => {
    if (entry.isDirectory() && entry.name !== 'js' && entry.name !== 'css') {
      const srcPath = join(distStaticDir, entry.name);
      const destPath = join(springStaticDir, entry.name);
      copyDirRecursive(srcPath, destPath);
      console.log(`  ✅ ${entry.name}/`);
    }
  });
}

console.log('\n🎉 部署完成！');
console.log('\n访问地址:');
console.log('  - http://localhost:19180/doc-v2');
console.log('  - http://localhost:19180/doc-v2.html');
console.log('\n注意: 需要先启动包含 spring-support-swagger-starter 的 Spring Boot 应用');
