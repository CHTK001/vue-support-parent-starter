import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 修复生成的JS文件，移除Node.js特定代码
const filePath = join(process.cwd(), 'build/release.js');

// 读取文件内容
let content = readFileSync(filePath, 'utf8');

// 替换包含Node.js特定代码的部分
content = content.replace(
  /const isNodeOrBun = typeof process != "undefined" && process\.versions != null && \(process\.versions\.node != null \|\| process\.versions\.bun != null\);\s*if \(isNodeOrBun\) \{ return globalThis\.WebAssembly\.compile\(await \(await import\("node:fs\/promises"\)\)\.readFile\(url\)\); \}\s*else \{ return await globalThis\.WebAssembly\.compileStreaming\(globalThis\.fetch\(url\)\); \}/g,
  'return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url));'
);

// 写回文件
writeFileSync(filePath, content, 'utf8');

console.log('Fixed release.js file for browser compatibility');