const fs = require('fs');
const path = require('path');

const srcRoot = 'G:\\work\\vue-support-parent-starter\\layout\\koi\\src';
const files = [];

function findFiles(dir) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      findFiles(full);
    } else if (f.endsWith('.ts') || f.endsWith('.vue')) {
      files.push(full);
    }
  });
}

findFiles(srcRoot);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const relDir = path.dirname(file);
  const relFromSrc = path.relative(srcRoot, relDir);
  
  content = content.replace(/from "@\/([^"]+)"/g, (match, importPath) => {
    const targetPath = path.join(srcRoot, importPath);
    const relPath = path.relative(relDir, targetPath);
    const normalized = relPath.replace(/\\/g, '/');
    if (!normalized.startsWith('.')) normalized = './' + normalized;
    return 'from "' + normalized + '"';
  });
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed:', file.replace(srcRoot, ''));
});
