/**
 * 部署脚本 AI 生成的三块纯逻辑单测。
 *
 * <p>这三个函数是「AI 生成脚本」这条链路里唯一不需要联网的部分，也是最容易悄悄坏掉的
 * 部分：模型偶尔会在 JSON 前后加一句「好的，脚本如下」，于是 extractScriptBundle 直接
 * JSON.parse 整段就炸；状态检测脚本偶尔会输出中文，normalizeStatus 一旦把它判成 running，
 * 用户会对着一个已经死掉的进程点不动重启。所以用例集中在「脏输入」而不是理想输入。</p>
 *
 * <p>不发任何请求：generateDeploymentScripts 依赖 SSE，属于集成范围，不在这里测。</p>
 */
import { describe, expect, it } from "vitest";
import {
  buildRequirement,
  extractScriptBundle,
  fallbackStatusScript,
  normalizeStatus,
  type ScriptGenParams,
} from "../views/release/scriptAi";

const START = "#!/bin/bash\nnohup java -jar ${APP_HOME}/app.jar > ${LOG_FILE} 2>&1 &\necho $! > ${PID_FILE}";
const STOP = "#!/bin/bash\nif [ -f ${PID_FILE} ]; then kill -TERM $(cat ${PID_FILE}); fi";
const RESTART = "#!/bin/bash\n${APP_HOME}/stop.sh && ${APP_HOME}/start.sh";
const STATUS = "#!/bin/bash\nif [ -f ${PID_FILE} ]; then echo running; else echo stopped; fi";

const BUNDLE = { start: START, stop: STOP, restart: RESTART };

const FULL_PARAMS: ScriptGenParams = {
  os: "linux",
  projectType: "springboot",
  mainEntry: "app.jar",
  projectPath: "/opt/app",
  logPath: "/opt/app/logs/app.log",
  appName: "demo-app",
  jdkHome: "/usr/local/jdk17",
  port: 8080,
  env: "SPRING_PROFILES_ACTIVE=prod\nTZ=Asia/Shanghai",
  jvmArgs: "-Xms512m -Xmx1024m",
  appArgs: "--server.port=8080 --logging.level.root=info",
  docker: false,
};

describe("extractScriptBundle", () => {
  it("标准 JSON 直接解出三件套", () => {
    const r = extractScriptBundle(JSON.stringify(BUNDLE));
    expect(r.start).toBe(START);
    expect(r.stop).toBe(STOP);
    expect(r.restart).toBe(RESTART);
    expect(r.status).toBeUndefined();
  });

  it("带 ```json 围栏也能解", () => {
    const text = ["```json", JSON.stringify(BUNDLE, null, 2), "```"].join("\n");
    const r = extractScriptBundle(text);
    expect(r.start).toContain("nohup");
    expect(r.restart).toContain("stop.sh");
  });

  it("前后有解释文字时，截取首个 { 到末个 }", () => {
    const text = `好的，脚本如下：\n\`\`\`json\n${JSON.stringify(BUNDLE)}\n\`\`\`\n如需调整请告诉我。`;
    const r = extractScriptBundle(text);
    expect(r.stop).toBe(STOP);
  });

  it("脚本正文里的花括号不影响截取", () => {
    const text = `说明文字\n${JSON.stringify({ ...BUNDLE, start: START })}\n结束`;
    expect(extractScriptBundle(text).start).toContain("${PID_FILE}");
  });

  it("返回里带 status 时一并保留", () => {
    const r = extractScriptBundle(JSON.stringify({ ...BUNDLE, status: STATUS }));
    expect(r.status).toBe(STATUS);
  });

  it("缺字段抛「AI 返回格式不正确」", () => {
    expect(() => extractScriptBundle(JSON.stringify({ start: START, stop: STOP }))).toThrow(
      "AI 返回格式不正确",
    );
  });

  it("字段值为空串同样算缺字段", () => {
    expect(() => extractScriptBundle(JSON.stringify({ ...BUNDLE, restart: "   " }))).toThrow(
      "AI 返回格式不正确",
    );
  });

  it("根本不是 JSON 时抛错，而不是返回半截文本", () => {
    expect(() => extractScriptBundle("抱歉，我无法生成该脚本。")).toThrow("AI 返回格式不正确");
    expect(() => extractScriptBundle("")).toThrow("AI 返回格式不正确");
  });

  it("JSON 本身不合法（模型少写了引号）抛错", () => {
    expect(() => extractScriptBundle('{"start": "a", "stop": , "restart": "c"}')).toThrow(
      "AI 返回格式不正确",
    );
  });
});

describe("normalizeStatus", () => {
  it("running 判定为 running", () => {
    expect(normalizeStatus("running")).toBe("running");
    expect(normalizeStatus("RUNNING\n")).toBe("running");
  });

  it("中文「运行」判定为 running", () => {
    expect(normalizeStatus("服务正在运行")).toBe("running");
  });

  it("stopped 判定为 stopped", () => {
    expect(normalizeStatus("stopped")).toBe("stopped");
    expect(normalizeStatus("服务已停止")).toBe("stopped");
  });

  it("剥掉围栏后仍能判定", () => {
    expect(normalizeStatus("```\nstopped\n```")).toBe("stopped");
  });

  it("空输出按 stopped（宁可让人多点一次重启，也不要对着死进程等）", () => {
    expect(normalizeStatus("")).toBe("stopped");
    expect(normalizeStatus("   \n\t ")).toBe("stopped");
  });

  it("否定表达不能被 running / 运行 误判成存活", () => {
    expect(normalizeStatus("not running")).toBe("stopped");
    expect(normalizeStatus("service isn't running")).toBe("stopped");
    expect(normalizeStatus("进程未运行")).toBe("stopped");
    expect(normalizeStatus("服务没有运行")).toBe("stopped");
  });
});

describe("buildRequirement", () => {
  it("把端口 / JDK / 环境变量等附加参数全部写进文本", () => {
    const text = buildRequirement(FULL_PARAMS, "start");
    expect(text).toContain("/usr/local/jdk17");
    expect(text).toContain("8080");
    expect(text).toContain("SPRING_PROFILES_ACTIVE=prod");
    expect(text).toContain("TZ=Asia/Shanghai");
    expect(text).toContain("-Xms512m -Xmx1024m");
    expect(text).toContain("--server.port=8080");
    expect(text).toContain("端口");
    expect(text).toContain("JDK");
    expect(text).toContain("环境变量");
  });

  it("启动脚本要求后台、日志重定向、pid 文件与可重复执行", () => {
    const text = buildRequirement(FULL_PARAMS, "start");
    expect(text).toContain("后台启动");
    expect(text).toContain("日志");
    expect(text).toContain("pid 文件");
    expect(text).toContain("可重复执行");
    expect(text).toContain("demo-app.pid");
  });

  it("停止脚本要求先 pid 再进程匹配，且提示避免误杀", () => {
    const text = buildRequirement(FULL_PARAMS, "stop");
    expect(text).toContain("优先读取 pid 文件");
    expect(text).toContain("兜底");
    expect(text).toContain("误杀");
  });

  it("重启脚本要求先停止再启动且 pid 一致", () => {
    const text = buildRequirement(FULL_PARAMS, "restart");
    expect(text).toContain("优雅停止");
    expect(text).toContain("启动");
    expect(text).toContain("同一份 pid 文件");
  });

  it("状态脚本只允许 running / stopped", () => {
    const text = buildRequirement(FULL_PARAMS, "status");
    expect(text).toContain("running");
    expect(text).toContain("stopped");
    expect(text).toContain("只输出");
  });

  it("windows 目标用 PowerShell 描述", () => {
    const text = buildRequirement({ os: "windows", appName: "demo" }, "start");
    expect(text).toContain("PowerShell");
  });

  it("docker 形态明确要求按容器处理", () => {
    const text = buildRequirement({ ...FULL_PARAMS, docker: true }, "stop");
    expect(text).toContain("Docker");
  });

  it("未提供的附加参数不写进文本（避免出现 undefined）", () => {
    const text = buildRequirement({ os: "linux" }, "start");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });
});

describe("fallbackStatusScript", () => {
  it("linux 按 pid 文件真判活，而不是 echo 常量", () => {
    const script = fallbackStatusScript(FULL_PARAMS);
    expect(script).toContain('PID_FILE="/opt/app/logs/demo-app.pid"');
    expect(script).toContain('kill -0 "$(cat "$PID_FILE")"');
    // 两个分支都要有：活着 running，死了 stopped
    expect(script).toContain("echo running");
    expect(script).toContain("echo stopped");
  });

  it("没有日志地址时用项目目录", () => {
    const script = fallbackStatusScript({ ...FULL_PARAMS, logPath: "" });
    expect(script).toContain('PID_FILE="/opt/app/demo-app.pid"');
  });

  it("windows 用 PowerShell 的 Test-Path / Get-Process", () => {
    const script = fallbackStatusScript({
      ...FULL_PARAMS,
      os: "windows",
      projectPath: "C:/apps/demo",
      logPath: "C:/apps/demo/logs/app.log",
    });
    expect(script).toContain("Test-Path $pidFile");
    expect(script).toContain("Get-Process -Id $appPid");
    expect(script).toContain("C:/apps/demo/logs/demo-app.pid");
  });

  it("应用名里的路径分隔符不会跑出目录", () => {
    const script = fallbackStatusScript({ ...FULL_PARAMS, appName: "../evil/app" });
    expect(script).not.toContain("../evil");
    expect(script).toContain(".._evil_app.pid");
  });
});
