import { execSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const rootDir = process.cwd();
const appsDir = join(rootDir, 'apps');

/**
 * 获取命令行参数指定的应用名称
 */
function getTargetApp() {
  const args = process.argv.slice(2);
  // 支持 --app appName 格式
  const appIndex = args.indexOf('--app');
  if (appIndex !== -1 && args[appIndex + 1]) {
    return args[appIndex + 1];
  }
  // 支持直接传递应用名称作为第一个参数
  if (args.length > 0 && !args[0].startsWith('--')) {
    return args[0];
  }
  return null;
}

/**
 * 检查 package.json 是否有 build 脚本
 */
async function hasBuildScript(appPath) {
  try {
    const packageJsonPath = join(appPath, 'package.json');
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
 * 检查应用是否已成功构建（dist 目录存在且不为空）
 */
async function isAlreadyBuilt(appPath) {
  const distPath = join(appPath, 'dist');
  if (!existsSync(distPath)) {
    return false;
  }
  try {
    const stats = await stat(distPath);
    if (!stats.isDirectory()) {
      return false;
    }
    // 检查 dist 目录是否有内容
    const files = await readdir(distPath);
    return files.length > 0;
  } catch {
    return false;
  }
}

/**
 * 顺序构建所有 apps
 */
async function buildApps() {
  try {
    const targetApp = getTargetApp();
    const apps = await readdir(appsDir, { withFileTypes: true });
    let appDirs = apps
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // 如果指定了单个应用，只构建该应用
    if (targetApp) {
      if (!appDirs.includes(targetApp)) {
        console.error(`错误: 应用 ${targetApp} 不存在`);
        process.exit(1);
      }
      appDirs = [targetApp];
      console.log(`构建单个应用: ${targetApp}`);
    } else {
      console.log(`找到 ${appDirs.length} 个应用目录`);
    }

    const builtApps = [];
    const skippedApps = [];

    for (const appName of appDirs) {
      const appPath = join(appsDir, appName);
      const hasBuild = await hasBuildScript(appPath);

      if (!hasBuild) {
        console.log(`跳过 ${appName}（没有 build 脚本）`);
        skippedApps.push(appName);
        continue;
      }

      // 检查是否已构建
      const alreadyBuilt = await isAlreadyBuilt(appPath);
      if (alreadyBuilt) {
        console.log(`跳过 ${appName}（已构建，dist 目录存在）`);
        skippedApps.push(appName);
        continue;
      }

      console.log(`\n开始构建: ${appName}`);
      try {
        execSync('pnpm build', {
          cwd: appPath,
          stdio: 'inherit',
          env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
        });
        console.log(`✓ ${appName} 构建成功`);
        builtApps.push(appName);
      } catch (error) {
        console.error(`✗ ${appName} 构建失败`);
        throw error;
      }
    }

    console.log('\n构建总结:');
    if (builtApps.length > 0) {
      console.log(`  已构建: ${builtApps.join(', ')}`);
    }
    if (skippedApps.length > 0) {
      console.log(`  已跳过: ${skippedApps.join(', ')}`);
    }
    console.log('\n所有应用构建完成');
  } catch (error) {
    console.error(`构建应用时出错: ${error.message}`);
    process.exit(1);
  }
}

buildApps();

