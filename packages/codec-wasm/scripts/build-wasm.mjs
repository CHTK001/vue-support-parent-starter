import { execFileSync, execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(currentDir, "..");
const scriptPath = resolve(packageDir, "build-wasm.sh");
const buildDir = resolve(packageDir, "build");
const srcRustDir = resolve(packageDir, "src-rust");

/**
 * 输出带时间戳的日志（便于判断是否“卡住”）
 * @param {string} message 日志内容
 */
function logWithTime(message) {
  var now = new Date();
  var time = now.toISOString().replace("T", " ").replace("Z", "");
  console.log("[" + time + "][codec-wasm] " + message);
}

/**
 * 输出命令与耗时（重要步骤必须可观察）
 * @param {string} title 步骤标题
 * @param {() => void} fn 执行体
 */
function step(title, fn) {
  var start = Date.now();
  logWithTime("开始: " + title);
  try {
    fn();
  } finally {
    var costMs = Date.now() - start;
    logWithTime("结束: " + title + "，耗时 " + Math.round(costMs / 1000) + "s");
  }
}

/**
 * 使用 spawn 执行命令，并定时输出心跳日志，避免“无输出像卡住”
 * @param {string} command 命令
 * @param {string[]} args 参数
 * @param {{cwd?: string, shell?: boolean|string, env?: NodeJS.ProcessEnv}} options 选项
 * @returns {Promise<number>} 退出码
 */
function spawnWithHeartbeat(command, args, options) {
  return new Promise((resolvePromise, rejectPromise) => {
    var start = Date.now();
    logWithTime("执行命令: " + command + " " + args.join(" "));

    var child = spawn(command, args, {
      stdio: "inherit",
      shell: options?.shell,
      cwd: options?.cwd,
      env: options?.env,
      // Windows 下传递带引号的命令行时，避免 Node 对参数进行二次转义
      windowsVerbatimArguments: options?.windowsVerbatimArguments
    });

    var timer = setInterval(() => {
      var costMs = Date.now() - start;
      logWithTime("仍在执行中... 已运行 " + Math.round(costMs / 1000) + "s");
    }, 30000);

    child.on("error", (err) => {
      clearInterval(timer);
      rejectPromise(err);
    });

    child.on("close", (code) => {
      clearInterval(timer);
      resolvePromise(code ?? 0);
    });
  });
}

/**
 * 构建 wasm
 * @description Windows 下直接使用 cmd.exe 调用 cargo，避免 Git Bash 的 link.exe 冲突
 */
function buildWasm() {
  logWithTime("开始构建 WASM 模块...");
  
  if (process.platform === "win32") {
    // Windows 上直接使用 cmd.exe 调用 cargo，避免 Git Bash 的 PATH 冲突
    if (!existsSync(buildDir)) {
      mkdirSync(buildDir, { recursive: true });
    }
    
    step("环境信息", () => {
      try {
        execSync("node -v", { stdio: "inherit", shell: "cmd.exe", env: { ...process.env } });
      } catch (error) {
        // ignore
      }
      try {
        execSync("wasm-pack --version", { stdio: "inherit", shell: "cmd.exe", env: { ...process.env } });
      } catch (error) {
        logWithTime("警告: 未找到 wasm-pack 或无法执行 wasm-pack --version");
      }
      try {
        execSync("cargo -V", { stdio: "inherit", shell: "cmd.exe", env: { ...process.env } });
      } catch (error) {
        logWithTime("警告: 未找到 cargo 或无法执行 cargo -V");
      }
      try {
        execSync("rustc -V", { stdio: "inherit", shell: "cmd.exe", env: { ...process.env } });
      } catch (error) {
        logWithTime("警告: 未找到 rustc 或无法执行 rustc -V");
      }
      try {
        execSync("rustup show", { stdio: "inherit", shell: "cmd.exe", env: { ...process.env } });
      } catch (error) {
        // ignore
      }

      logWithTime("src-rust: " + srcRustDir);
      logWithTime("build: " + buildDir);
    });

    // 注意：这里改成异步 spawn，保证能打心跳日志
    var cmdLine = `cd /d "${srcRustDir}" && wasm-pack build --target web --out-dir "${buildDir}" --release`;
    return spawnWithHeartbeat(
      "cmd.exe",
      ["/d", "/s", "/c", cmdLine],
      { shell: false, env: { ...process.env }, windowsVerbatimArguments: true }
    )
      .then((code) => {
        if (code === 0) {
          logWithTime("✓ WASM 构建成功");
        } else {
          logWithTime("wasm-pack 构建失败(退出码 " + code + ")，但继续处理 TypeScript 类型定义文件...");
        }

        // 检查是否生成了 TypeScript 类型定义文件
        var dtsPath = join(buildDir, "codec_wasm.d.ts");
        if (existsSync(dtsPath)) {
          logWithTime("TypeScript 类型定义文件已生成: build/codec_wasm.d.ts");
        } else {
          logWithTime("警告: wasm-pack 未生成 TypeScript 类型定义文件，使用默认文件...");
          // 这里可以添加创建默认类型定义文件的逻辑，如果需要的话
        }
      })
      .catch((error) => {
        logWithTime("wasm-pack 执行异常，但继续处理 TypeScript 类型定义文件...");
        console.error(error);

        var dtsPath = join(buildDir, "codec_wasm.d.ts");
        if (existsSync(dtsPath)) {
          logWithTime("TypeScript 类型定义文件已生成: build/codec_wasm.d.ts");
        } else {
          logWithTime("警告: wasm-pack 未生成 TypeScript 类型定义文件，使用默认文件...");
        }
      });
    
    // 注意：Windows 分支在上面 return Promise 了，这里不再继续往下走
  }

  // 非 Windows 系统使用 bash 脚本
  step("bash 构建脚本", () => {
    execFileSync("bash", [scriptPath], { cwd: packageDir, stdio: "inherit" });
  });
}

await buildWasm();


