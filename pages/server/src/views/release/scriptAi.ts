/**
 * 部署脚本 AI 生成：启动 / 停止 / 重启 / 状态检测。
 *
 * <p>后端 /v2/command/generate 只固定接收 os / projectType / mainEntry / projectPath /
 * logPath / appName 这几个字段；JDK 路径、端口、环境变量、JVM 参数、应用参数、是否走
 * Docker 都没有独立字段，只能折进 requirement 让模型读到。所以这里的 requirement 不是
 * 一句「帮我写个脚本」，而是把语料写全：缺了端口，生成出来的 status 会去 grep 错误的
 * 端口；缺了 JDK 路径，脚本会去用机器上碰巧默认的那个 java。</p>
 *
 * <p>两次调用：先 multi=true 一次拿三件套，返回里带 status 就直接用，没带才补一次
 * multi=false 单独生成状态检测。不自动重试 —— 生成是花钱且有副作用的一次性请求；
 * 也不执行脚本，执行是页面的事。</p>
 *
 * <p>本文件不依赖 Vue，纯 TS，可单测。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import {
  generateCommand,
  type CommandGeneratePayload,
} from "../../api/commandGenerate";

/**
 * 部署脚本四件套
 */
export type DeploymentScripts = {
  start: string;
  stop: string;
  restart: string;
  status: string;
};

/**
 * 脚本类型
 */
export type ScriptKind = "start" | "stop" | "restart" | "status";

/**
 * 生成入参（页面表单直接喂进来）
 */
export interface ScriptGenParams {
  os: string;
  projectType?: string;
  mainEntry?: string;
  projectPath?: string;
  logPath?: string;
  appName?: string;
  /** JDK 根目录，脚本内需显式设置 JAVA_HOME */
  jdkHome?: string;
  port?: string | number;
  /** 环境变量，可写多行 KEY=VALUE */
  env?: string;
  jvmArgs?: string;
  appArgs?: string;
  /** 是否容器化部署 */
  docker?: boolean;
}

/** 解析失败统一文案：页面据此提示「重试」而不是「脚本有问题」 */
const FORMAT_ERROR = "AI 返回格式不正确";

/** 去掉 Markdown 代码围栏（```json / ```bash / ```） */
const stripFence = (text: string): string => String(text ?? "").replace(/```[a-zA-Z]*/g, "").trim();

/**
 * 从模型输出里抠出脚本包
 *
 * <p>模型很少老老实实只回 JSON：常见是「好的，脚本如下：」+ ```json 围栏 + 尾巴解释。
 * 所以先剥围栏，再取第一个 `{` 到最后一个 `}` —— 脚本正文里的花括号被外层 JSON 包着，
 * 用首尾括号截取不会截断它们。</p>
 *
 * @param text 模型原文
 * @returns 三件套（带 status 时一并返回）
 */
export function extractScriptBundle(text: string): {
  start: string;
  stop: string;
  restart: string;
  status?: string;
} {
  const plain = stripFence(text);
  const begin = plain.indexOf("{");
  const end = plain.lastIndexOf("}");
  if (begin < 0 || end <= begin) {
    throw new Error(FORMAT_ERROR);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(plain.slice(begin, end + 1));
  } catch {
    throw new Error(FORMAT_ERROR);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(FORMAT_ERROR);
  }

  const bag = parsed as Record<string, unknown>;
  const pick = (key: string): string => (typeof bag[key] === "string" ? (bag[key] as string).trim() : "");

  const start = pick("start");
  const stop = pick("stop");
  const restart = pick("restart");
  if (!start || !stop || !restart) {
    throw new Error(FORMAT_ERROR);
  }

  const status = pick("status");
  return status ? { start, stop, restart, status } : { start, stop, restart };
}

/**
 * 归一状态检测输出
 *
 * <p>状态脚本约定只输出 running / stopped，但模型常带上时间戳或中文。只认「running」
 * 与「运行」两种肯定信号，其余（空输出、报错文本、stopped）一律按 stopped —— 判活宁可
 * 保守，把活着的服务报成停着，用户点一下重启就恢复了；反过来会让人对着一个已死的服务
 * 等半小时。</p>
 *
 * <p>只用于状态脚本的**执行输出**；生成阶段拿到的是脚本文本，不能拿它判活
 * （脚本正文里本来就含 running 字样，直接判断会永远返回 running）。</p>
 *
 * @param text 状态脚本执行后的输出
 */
export function normalizeStatus(text: string): "running" | "stopped" {
  const plain = stripFence(text).toLowerCase();
  if (!plain) {
    return "stopped";
  }
  // 先认否定表达："not running" / "未运行" 里同样含有 running，不能先按肯定判
  if (/not\s+running|isn'?t\s+running|no\s+longer\s+running|未运行|没有运行|不在运行/.test(plain)) {
    return "stopped";
  }
  return /running|运行/.test(plain) ? "running" : "stopped";
}

/** 目标 shell 名称 */
const shellName = (os: string): string => (String(os ?? "").toLowerCase() === "windows" ? "PowerShell" : "bash");

/** 是否给出了有效取值 */
const filled = (v?: string | number | null): boolean => v !== undefined && v !== null && String(v).trim() !== "";

/**
 * 公共上下文：这些是模型必须知道的硬约束
 */
function contextLines(p: ScriptGenParams): string[] {
  const lines: string[] = [`目标系统：${shellName(p.os)}（os=${p.os}）`];
  if (filled(p.projectType)) {
    lines.push(`项目类型：${p.projectType}`);
  }
  if (filled(p.mainEntry)) {
    lines.push(`主入口：${p.mainEntry}`);
  }
  if (filled(p.projectPath)) {
    lines.push(`项目路径：${p.projectPath}`);
  }
  if (filled(p.logPath)) {
    lines.push(`日志路径：${p.logPath}（标准输出与标准错误都要重定向到这里）`);
  }
  if (filled(p.appName)) {
    lines.push(`应用名称：${p.appName}（pid 文件与进程匹配都用它做标识）`);
  }
  if (filled(p.jdkHome)) {
    lines.push(`JDK 路径：${p.jdkHome}（脚本内显式设置 JAVA_HOME 与 PATH，不要依赖系统默认 JDK）`);
  }
  if (filled(p.port)) {
    lines.push(`服务端口：${p.port}（状态检测与端口占用判断都按这个端口）`);
  }
  if (filled(p.env)) {
    lines.push(`环境变量：${String(p.env).trim()}`);
  }
  if (filled(p.jvmArgs)) {
    lines.push(`JVM 参数：${String(p.jvmArgs).trim()}（放在 -jar 之前）`);
  }
  if (filled(p.appArgs)) {
    lines.push(`应用参数：${String(p.appArgs).trim()}（放在 -jar 与主入口之后）`);
  }
  if (p.docker) {
    lines.push("运行形态：Docker 容器（用容器名 / docker 命令处理，不要按宿主机裸进程处理）");
  }
  return lines;
}

/** 单个脚本的具体要求 */
function kindSpec(p: ScriptGenParams, kind: ScriptKind): string {
  const pid = filled(p.appName) ? `${p.appName}.pid` : "应用名.pid";
  switch (kind) {
    case "start":
      return [
        "脚本要求（启动）：",
        "1) 后台启动，不占用当前终端（nohup ... & 或 Start-Process 隐藏窗口）；",
        `2) 标准输出与标准错误重定向到日志文件${filled(p.logPath) ? `（${p.logPath}）` : ""}，日志目录不存在则先创建；`,
        `3) 启动成功后写入 pid 文件（与日志同目录，文件名 ${pid}）；`,
        "4) 可重复执行：检测到已在运行就打印提示并退出，不重复启动、不覆盖日志；",
        "5) 只输出脚本正文，不要解释、不要额外示例。",
      ].join("\n");
    case "stop":
      return [
        "脚本要求（停止）：",
        `1) 优先读取 pid 文件（${pid}），确认该 pid 的进程确实属于本应用后再停止；`,
        "2) 停止先发 TERM 并等待指定秒数，仍未退出再 KILL，避免直接硬杀丢数据；",
        "3) 没有 pid 文件或 pid 已失效时，才按进程名 / 命令行关键字匹配兜底；",
        `4) 匹配关键字必须带上应用名${filled(p.mainEntry) ? `或主入口（${p.mainEntry}）` : ""}，避免误杀其它 java / node 进程；`,
        "5) 停止完成后清理 pid 文件；",
        "6) 只输出脚本正文，不要解释。",
      ].join("\n");
    case "restart":
      return [
        "脚本要求（重启）：",
        "1) 先复用停止逻辑优雅停止，并在超时时间内确认进程真的退出；",
        "2) 再复用启动逻辑启动，启动前确认端口未被残留进程占用；",
        `3) 前后使用同一份 pid 文件（${pid}）与同一个服务名，避免重启后状态检测失联；`,
        "4) 只输出脚本正文，不要解释。",
      ].join("\n");
    default:
      return [
        "脚本要求（状态检测）：",
        `1) 按 pid 文件（${pid}）与进程 / 端口判断应用是否存活；`,
        "2) 存活时只输出 running，未存活时只输出 stopped；",
        "3) 除这一个词之外不要输出任何字符（无表头、无换行说明、无退出码提示）；",
        "4) 你输出的是脚本正文，不要只回复 running / stopped 这个结果词。",
      ].join("\n");
  }
}

const KIND_LABEL: Record<ScriptKind, string> = {
  start: "启动",
  stop: "停止",
  restart: "重启",
  status: "状态检测",
};

/**
 * 拼单脚本的 requirement
 *
 * <p>附加参数（jdkHome / port / env / jvmArgs / appArgs / docker）只能从这里进后端，
 * 所以它们必须全部落进文本；漏一个，生成结果就会退回「机器上碰巧能跑」的通用脚本。</p>
 *
 * @param params 生成入参
 * @param kind 脚本类型
 */
export function buildRequirement(params: ScriptGenParams, kind: ScriptKind): string {
  return [
    `请生成 ${shellName(params.os)} 部署脚本：${KIND_LABEL[kind]}。`,
    ...contextLines(params),
    kindSpec(params, kind),
  ].join("\n");
}

/**
 * 拼「一次出四件套」的 requirement
 */
function buildMultiRequirement(params: ScriptGenParams): string {
  return [
    `请一次性生成 ${shellName(params.os)} 的启动、停止、重启、状态检测四个部署脚本。`,
    ...contextLines(params),
    kindSpec(params, "start"),
    kindSpec(params, "stop"),
    kindSpec(params, "restart"),
    kindSpec(params, "status"),
    '输出格式：只输出一个 JSON 对象，形如 {"start":"<启动脚本>","stop":"<停止脚本>","restart":"<重启脚本>","status":"<状态脚本>"}。',
    "不要 Markdown 代码围栏、不要在 JSON 之外写任何说明。",
  ].join("\n");
}

/** 组装后端固定字段 */
function toPayload(params: ScriptGenParams): CommandGeneratePayload {
  return {
    os: params.os,
    projectType: params.projectType ?? "",
    mainEntry: params.mainEntry ?? "",
    projectPath: params.projectPath ?? "",
    logPath: params.logPath ?? "",
    appName: params.appName ?? "",
  };
}

/**
 * 发一次生成请求，等 done 帧收全文
 *
 * <p>done 帧优先用 full（后端已拼好完整结果），缺省时退回累计 chunk。</p>
 */
function requestScript(payload: CommandGeneratePayload): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let acc = "";
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const client = generateCommand(payload, {
      onChunk: (content) => {
        acc += content;
      },
      onDone: (full) => {
        if (settled) {
          return;
        }
        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        resolve((full || "").trim() || acc.trim());
      },
      onError: (message) => {
        if (settled) {
          return;
        }
        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        reject(new Error(message || "AI 生成脚本失败"));
      },
    });
    // 后端不保证一定发 done（连接被中间层掐断时既无 done 也无 error），
    // 没有超时这个 Promise 会永远挂着，页面按钮一直转圈。
    timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      client.close();
      reject(new Error("AI 生成超时（120 秒），请重试或改用内置模板"));
    }, 120_000);
    // 极端情况下 done 可能先于定时器赋值到达：立即清掉，避免留下空转的 2 分钟定时器
    if (settled && timer) {
      clearTimeout(timer);
    }
  });
}

/**
 * 把状态脚本原文规整成可保存的脚本。
 *
 * <p>模型偶尔只回一个 running / stopped（把「脚本输出」当成「脚本」）。
 * 这种回答不能当脚本执行，更不能补成 {@code echo running}：那条命令永远输出
 * running，服务死了页面也会显示在运行。这里改为按 pid 文件生成一段真正的状态
 * 检测脚本；pid 文件位置与 start 脚本约定一致（日志同目录，缺日志时用项目目录）。</p>
 *
 * @param text 模型返回的状态脚本原文
 * @param params 生成参数（用于兜底脚本定位 pid 文件）
 * @returns 可直接保存的状态脚本
 */
function normalizeStatusScript(text: string, params: ScriptGenParams): string {
  const raw = stripFence(text).trim();
  if (/^(running|stopped)$/i.test(raw)) {
    return fallbackStatusScript(params);
  }
  return raw;
}

/** 取文件路径的父目录（同时兼容 / 与 \\） */
function dirOfPath(path?: string): string {
  const s = String(path ?? '').trim();
  if (!s) {
    return '';
  }
  const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
  if (i > 0) {
    return s.slice(0, i);
  }
  return s.startsWith('/') ? '/' : '';
}

/**
 * 生成 pid 文件路径：与日志同目录，没有日志时落到项目目录。
 *
 * <p>和 buildRequirement 里给模型的约定保持一致，避免 AI 返回一个词时兜底脚本
 * 去错地方找 pid。</p>
 */
function statusPidFile(params: ScriptGenParams): string {
  const app = String(params.appName ?? '').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'app';
  const dir = dirOfPath(params.logPath) || String(params.projectPath ?? '').trim();
  const base = dir.replace(/[\\/]+$/, '');
  return `${base ? `${base}/` : ''}${app}.pid`;
}

/**
 * 按 pid 文件生成兜底状态脚本。
 *
 * <p>只回答 running / stopped 的模型没有给出可用脚本，但启动脚本仍然会写 pid
 * 文件；这里用同一份 pid 约定补一个真正会判活的脚本，比直接报错让四个脚本全废
 * 更实用。</p>
 *
 * @param params 生成参数
 * @returns 状态检测脚本
 */
export function fallbackStatusScript(params: ScriptGenParams): string {
  const pidFile = statusPidFile(params);
  if (String(params.os ?? '').toLowerCase() === 'windows') {
    const quoted = pidFile.replace(/'/g, "''");
    return [
      `$pidFile = '${quoted}'`,
      'if (Test-Path $pidFile) {',
      '  $appPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1',
      '  if ($appPid -and (Get-Process -Id $appPid -ErrorAction SilentlyContinue)) {',
      '    Write-Output "running"',
      '  } else {',
      '    Write-Output "stopped"',
      '  }',
      '} else {',
      '  Write-Output "stopped"',
      '}',
    ].join('\n');
  }
  // 双引号里要转义 $、`、\ 和双引号，否则路径里的特殊字符会被 shell 解释
  const quoted = pidFile.replace(/([\\"$`])/g, '\\$1');
  return [
    `PID_FILE="${quoted}"`,
    'if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then',
    '  echo running',
    'else',
    '  echo stopped',
    'fi',
  ].join('\n');
}

/**
 * 生成部署脚本四件套
 *
 * <p>先 multi=true 拿启动 / 停止 / 重启；返回里带 status 就保留，没带再补一次
 * multi=false 单独生成状态检测并归一成 running / stopped。</p>
 *
 * @param params 生成入参（含只能进 requirement 的附加参数）
 * @param opts 模型标识与进度回调
 * @returns 四件套脚本
 */
export async function generateDeploymentScripts(
  params: ScriptGenParams,
  opts: { model?: string; onProgress?: (stage: string) => void } = {},
): Promise<DeploymentScripts> {
  const base = toPayload(params);

  opts.onProgress?.("生成启动 / 停止 / 重启脚本");
  const multiText = await requestScript({
    ...base,
    model: opts.model,
    multi: true,
    requirement: buildMultiRequirement(params),
  });

  opts.onProgress?.("解析生成结果");
  const bundle = extractScriptBundle(multiText);

  let status = normalizeStatusScript(bundle.status ?? "", params);
  if (!status) {
    opts.onProgress?.("生成状态检测脚本");
    const statusText = await requestScript({
      ...base,
      model: opts.model,
      multi: false,
      requirement: buildRequirement(params, "status"),
    });
    // 生成的是「状态脚本」，不是执行结果：保留脚本文本，执行后再用 normalizeStatus 判活。
    status = normalizeStatusScript(statusText, params);
  }
  // 模型两轮都没给可用脚本时，按 start 脚本的 pid 约定补一个，避免状态字段为空
  if (!status) {
    status = fallbackStatusScript(params);
  }

  return {
    start: bundle.start,
    stop: bundle.stop,
    restart: bundle.restart,
    status,
  };
}
