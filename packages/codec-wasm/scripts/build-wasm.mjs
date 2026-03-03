import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(currentDir, "..");
const scriptPath = resolve(packageDir, "build-wasm.sh");

/**
 * 构建 wasm
 * @description Windows 下使用 Git Bash 执行，避免依赖 WSL；其他系统直接用 bash。
 */
function buildWasm() {
  if (process.platform === "win32") {
    const gitBashPath = "H:\\Program Files\\Git\\bin\\bash.exe";
    execFileSync(gitBashPath, ["-lc", `cd "${packageDir}" && bash "${scriptPath}"`], {
      stdio: "inherit"
    });
    return;
  }

  execFileSync("bash", [scriptPath], { cwd: packageDir, stdio: "inherit" });
}

buildWasm();


