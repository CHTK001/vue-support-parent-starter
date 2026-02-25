#!/usr/bin/env node

/**
 * 字体生成脚本
 * 说明：
 * - 此脚本属于 @repo/font-encryption 模块
 * - 使用 font-cloak 对源字体进行加密，输出到 packages/assets/fonts 目录
 * - 同时生成 magicString 元信息，供运行时加解密使用
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateFont, generateMagicString } from "font-cloak";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 仓库根目录：packages/font-encryption/scripts/../../../ -> vue-support-parent-starter
const projectRoot = path.resolve(__dirname, "..", "..", "..");

// 源字体：默认使用 packages/assets/iconfont/iconfont.ttf 作为加密基础字体
const sourceFontPath = path.resolve(projectRoot, "packages", "assets", "iconfont", "iconfont.ttf");

// 字体输出目录：packages/assets/fonts
const outputDir = path.resolve(projectRoot, "packages", "assets", "fonts");

// 需要生成的字体变体配置，可按需增删
// id 仅用于 seed 与日志标识，fileName 为输出的字体文件名
const FONT_VARIANTS = [
  {
    id: "default",
    fileName: "font-cloak-default.woff2"
  },
  {
    id: "variant-a",
    fileName: "font-cloak-variant-a.woff2"
  },
  {
    id: "variant-b",
    fileName: "font-cloak-variant-b.woff2"
  }
];

/**
 * 确保目录存在
 * @param {string} dir 目标目录路径
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 生成多份加密字体与 magicString
 * - 基于 FONT_VARIANTS 配置生成多份不同 seed 的字体文件
 * - 每个变体输出独立的 woff2 与 json 元信息
 */
async function main() {
  if (!fs.existsSync(sourceFontPath)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[font-encryption] 源字体不存在，跳过加密字体生成: ${sourceFontPath}`
    );
    // 不中断整个构建流程，直接跳过
    return;
  }

  ensureDir(outputDir);

  const tasks = FONT_VARIANTS.map(async (variant) => {
    const seed = `${Date.now()}-${variant.id}`;

    const newFontBuffer = await generateFont(sourceFontPath, {
      type: "woff2",
      seed
    });

    const magicString = generateMagicString(seed);

    const fontPath = path.resolve(outputDir, variant.fileName);
    const metaPath = path.resolve(
      outputDir,
      `${variant.fileName.replace(/\.woff2?$/u, "")}.json`
    );

    fs.writeFileSync(fontPath, newFontBuffer);

    const meta = {
      id: variant.id,
      seed,
      magicString,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

    // eslint-disable-next-line no-console
    console.log(`[font-encryption] 变体 "${variant.id}" 已生成:`);
    // eslint-disable-next-line no-console
    console.log(`  font: ${fontPath}`);
    // eslint-disable-next-line no-console
    console.log(`  meta: ${metaPath}`);
  });

  await Promise.all(tasks);
}

void main();


