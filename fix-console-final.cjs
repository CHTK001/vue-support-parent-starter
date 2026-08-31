const fs = require('fs');
const path = require('path');

const base = 'D:/ch/project/vue-support-parent-starter';

function getAllTsFiles(dir, results) {
    results = results || [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!entry.name.includes('node_modules')) getAllTsFiles(full, results);
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(full);
        }
    }
    return results;
}

function fixFile(f) {
    let c = fs.readFileSync(f, 'utf8');
    const orig = c;

    // Add log import if needed
    if (c.match(/console\.(warn|error|debug|info)\(/) && !c.match(/import\s+\{[^}]*\blog\b/)) {
        const lines = c.split('\n');
        let idx = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith('import ') && lines[i].includes('from ')) { idx = i + 1; break; }
        }
        lines.splice(idx, 0, 'import { log } from "@repo/utils";');
        c = lines.join('\n');
    }

    // Replace patterns - handle single-quote strings too
    c = c.replace(/console\.warn\(\[`([^\]\`]+)`\]\s*,\s*([^)]+)\)/g, 'log.warn(`$1`, $2)');
    c = c.replace(/console\.error\(\[`([^\]\`]+)`\]\s*,\s*([^)]+)\)/g, 'log.error(`$1`, $2)');
    c = c.replace(/console\.debug\(\[`([^\]\`]+)`\]\s*,\s*([^)]+)\)/g, 'log.debug(`$1`, $2)');
    // "string" patterns
    c = c.replace(/console\.warn\("([^"]+)"\s*,\s*([^)]+)\)/g, 'log.warn(`$1`, $2)');
    c = c.replace(/console\.error\("([^"]+)"\s*,\s*([^)]+)\)/g, 'log.error(`$1`, $2)');
    c = c.replace(/console\.debug\("([^"]+)"\s*,\s*([^)]+)\)/g, 'log.debug(`$1`, $2)');
    c = c.replace(/console\.info\("([^"]+)"\s*,\s*([^)]+)\)/g, 'log.info(`$1`, $2)');
    // `template` patterns
    c = c.replace(/console\.warn\(`([^`]+)`\s*,\s*([^)]+)\)/g, 'log.warn(`$1`, $2)');
    c = c.replace(/console\.error\(`([^`]+)`\s*,\s*([^)]+)\)/g, 'log.error(`$1`, $2)');
    c = c.replace(/console\.debug\(`([^`]+)`\s*,\s*([^)]+)\)/g, 'log.debug(`$1`, $2)');
    c = c.replace(/console\.info\(`([^`]+)`\s*,\s*([^)]+)\)/g, 'log.info(`$1`, $2)');
    // 'single quote' patterns
    c = c.replace(/console\.warn\('([^']+)'  ,\s*([^)]+)\)/g, 'log.warn(`$1`, $2)');
    c = c.replace(/console\.error\('([^']+)'  ,\s*([^)]+)\)/g, 'log.error(`$1`, $2)');
    c = c.replace(/console\.debug\('([^']+)'  ,\s*([^)]+)\)/g, 'log.debug(`$1`, $2)');
    c = c.replace(/console\.info\('([^']+)'  ,\s*([^)]+)\)/g, 'log.info(`$1`, $2)');
    // Single arg string
    c = c.replace(/console\.warn\("([^"]+)"\)/g, 'log.warn(`$1`)');
    c = c.replace(/console\.error\("([^"]+)"\)/g, 'log.error(`$1`)');
    c = c.replace(/console\.debug\("([^"]+)"\)/g, 'log.debug(`$1`)');
    c = c.replace(/console\.info\("([^"]+)"\)/g, 'log.info(`$1`)');
    // Single arg backtick
    c = c.replace(/console\.warn\((`[^`]+`)\)/g, 'log.warn($1)');
    c = c.replace(/console\.error\((`[^`]+`)\)/g, 'log.error($1)');
    c = c.replace(/console\.debug\((`[^`]+`)\)/g, 'log.debug($1)');
    c = c.replace(/console\.info\((`[^`]+`)\)/g, 'log.info($1)');
    // Single arg variable
    c = c.replace(/console\.warn\((error|e|err|payload|event)\)/g, 'log.warn(`logger`, $1)');
    c = c.replace(/console\.error\((error|e|err|payload|event)\)/g, 'log.error(`logger`, $1)');
    c = c.replace(/console\.debug\((error|e|err|payload|event)\)/g, 'log.debug(`logger`, $1)');
    c = c.replace(/console\.info\((error|e|err|payload|event)\)/g, 'log.info(`logger`, $1)');
    // Arrow wrapper
    c = c.replace(/=>\s*console\.warn\(([^)]+)\)/g, '=> log.warn(`logger`, $1)');
    c = c.replace(/=>\s*console\.error\(([^)]+)\)/g, '=> log.error(`logger`, $1)');
    c = c.replace(/=>\s*console\.debug\(([^)]+)\)/g, '=> log.debug(`logger`, $1)');
    c = c.replace(/=>\s*console\.info\(([^)]+)\)/g, '=> log.info(`logger`, $1)');
    // Multi-line: console.warn(\n  ...
    c = c.replace(/console\.warn\(\s*\n/g, 'log.warn(\n  ');
    c = c.replace(/console\.error\(\s*\n/g, 'log.error(\n  ');
    c = c.replace(/console\.debug\(\s*\n/g, 'log.debug(\n  ');
    c = c.replace(/console\.info\(\s*\n/g, 'log.info(\n  ');

    if (c !== orig) {
        fs.writeFileSync(f, c, 'utf8');
        return true;
    }
    return false;
}

let fixed = 0;
['packages', 'pages', 'apps'].forEach(dir => {
    getAllTsFiles(path.join(base, dir)).forEach(f => {
        if (fixFile(f)) { fixed++; console.log(fixed + ': ' + f.replace(base + '/', '')); }
    });
});
console.log('Total fixed: ' + fixed);
