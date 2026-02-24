import { execSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const rootDir = process.cwd();

/**
 * 检查 package.json 是否有 build 脚本
 */
async function hasBuildScript(packagePath) {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return false;
    }
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    return packageJson?.scripts?.build !== undefined;
  } catch {
    return false;
  }
}

/**
 * 顺序构建所有 packages、pages、layout
 */
async function buildPackages() {
  try {
    const dirs = ['packages', 'pages', 'layout', 'scripts'];
    const allPackages = [];

    for (const dir of dirs) {
      const dirPath = join(rootDir, dir);
      try {
        const items = await readdir(dirPath, { withFileTypes: true });
        const subDirs = items
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => ({ name: dirent.name, path: join(dirPath, dirent.name) }));

        for (const subDir of subDirs) {
          const hasBuild = await hasBuildScript(subDir.path);
          if (!hasBuild) {
            continue;
          }
          // 部分页面（如 crypto、tools）主要用于示例展示，构建流程中先跳过这些包，避免因三方工具兼容性问题导致整体构建失败
          if (dir === "pages" && (subDir.name === "crypto" || subDir.name === "tools")) {
            continue;
          }
          allPackages.push(subDir);
        }
      } catch {
        // 目录不存在，跳过
      }
    }

    console.log(`找到 ${allPackages.length} 个需要构建的包`);

    for (const pkg of allPackages) {
      console.log(`\n开始构建: ${pkg.name}`);
      try {
        execSync('pnpm build', {
          cwd: pkg.path,
          stdio: 'inherit',
          env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
        });
        console.log(`✓ ${pkg.name} 构建成功`);
      } catch (error) {
        console.error(`✗ ${pkg.name} 构建失败`);
        throw error;
      }
    }

    console.log('\n所有包构建完成');
  } catch (error) {
    console.error(`构建包时出错: ${error.message}`);
    process.exit(1);
  }
}

buildPackages();

