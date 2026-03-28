import { readFile, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, resolve, dirname, relative } from "node:path";
import { appRoot } from "./spring-page-targets.mjs";

const HTML_REF_PATTERN =
  /\b(?:src|href|poster)=["']([^"'#?]+(?:\?[^"'#]*)?)["']/gi;
const JS_REF_PATTERNS = [
  /\bimport\s*\(\s*["']([^"'#?]+(?:\?[^"'#]*)?)["']\s*\)/gi,
  /\bfrom\s+["']([^"'#?]+(?:\?[^"'#]*)?)["']/gi,
  /\bimport\s+["']([^"'#?]+(?:\?[^"'#]*)?)["']/gi,
  /\b(?:new\s+URL|fetch)\(\s*["']([^"'#?]+(?:\?[^"'#]*)?)["']/gi,
];
const CSS_REF_PATTERNS = [/\burl\(\s*["']?([^"'#)]+(?:\?[^"'#)]*)?)["']?\s*\)/gi];

function stripQuery(value) {
  return value.split("?")[0]?.split("#")[0] || "";
}

function normalizeReference(reference) {
  if (!reference) {
    return "";
  }
  const normalized = stripQuery(reference).trim();
  if (!normalized || normalized.startsWith("data:") || normalized.startsWith("http:") || normalized.startsWith("https:") || normalized.startsWith("//")) {
    return "";
  }
  return normalized;
}

async function walkFiles(rootDir) {
  const result = [];
  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      result.push(fullPath);
    }
  }
  return result;
}

function resolveLocalPath(distRoot, ownerFile, reference) {
  const normalized = normalizeReference(reference);
  if (!normalized) {
    return "";
  }
  const ownerDir = dirname(ownerFile);
  const targetPath = normalized.startsWith("/")
    ? resolve(distRoot, `.${normalized}`)
    : resolve(ownerDir, normalized);
  const insideDist = relative(distRoot, targetPath);
  if (!insideDist || insideDist.startsWith("..")) {
    return "";
  }
  return targetPath;
}

async function collectReferencedFiles(distRoot, entryFiles) {
  const keep = new Set(entryFiles);
  const queue = [...entryFiles];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || !existsSync(current)) {
      continue;
    }
    const currentStat = await stat(current);
    if (!currentStat.isFile()) {
      continue;
    }
    const source = await readFile(current, "utf8");
    const extension = extname(current).toLowerCase();
    const patterns = [];
    if (extension === ".html") {
      patterns.push(HTML_REF_PATTERN);
    } else if (extension === ".js" || extension === ".mjs") {
      patterns.push(...JS_REF_PATTERNS);
    } else if (extension === ".css") {
      patterns.push(...CSS_REF_PATTERNS);
    }

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const candidate = resolveLocalPath(distRoot, current, match[1] || "");
        if (!candidate || keep.has(candidate) || !existsSync(candidate)) {
          continue;
        }
        keep.add(candidate);
        queue.push(candidate);
      }
    }
  }

  return keep;
}

async function pruneUnreferenced(distRoot, keep) {
  const files = await walkFiles(distRoot);
  for (const file of files) {
    if (keep.has(file)) {
      continue;
    }
    await rm(file, { force: true });
  }
}

async function removeEmptyDirectories(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const current = resolve(rootDir, entry.name);
    await removeEmptyDirectories(current);
    const remaining = await readdir(current);
    if (remaining.length === 0) {
      await rm(current, { force: true, recursive: true });
    }
  }
}

async function main() {
  const distRoot = resolve(appRoot, "dist");
  if (!existsSync(distRoot)) {
    throw new Error(`构建产物不存在: ${distRoot}`);
  }

  const rootEntries = await readdir(distRoot, { withFileTypes: true });
  const htmlEntries = rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => resolve(distRoot, entry.name));

  if (htmlEntries.length === 0) {
    throw new Error(`未找到 HTML 入口: ${distRoot}`);
  }

  const keep = await collectReferencedFiles(distRoot, htmlEntries);
  await pruneUnreferenced(distRoot, keep);
  await removeEmptyDirectories(distRoot);

  const keptFiles = [];
  for (const file of keep) {
    if (existsSync(file)) {
      const fileStat = await stat(file);
      if (fileStat.isFile()) {
        keptFiles.push(relative(distRoot, file));
      }
    }
  }
  keptFiles.sort();
  console.log(`[prune] kept ${keptFiles.length} files`);
  keptFiles.forEach((file) => console.log(`[prune] ${file}`));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
