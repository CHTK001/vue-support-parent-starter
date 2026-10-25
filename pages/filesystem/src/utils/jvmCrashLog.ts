/**
 * hs_err_pid*.log（JVM 崩溃日志）前端解析器。
 *
 * <p>目标不是把整份 crash log 当文本罗列，而是提取<b>运维要看的要点</b>并给出
 * 处置建议：崩溃类型与信号、JRE/JVM 版本、问题帧（native/java/vm）、故障线程栈、
 * 启动参数、堆内存、系统环境。解析不依赖后端，纯前端正则 + 行号定位。</p>
 *
 * <p>hs_err 是 OpenJDK 的标准崩溃产物，段落固定：头部 `#` 说明块、
 * `---------------  T H R E A D  ---------------`、`P R O C E S S`、
 * `V M  Arguments`、`H E A P`、`E N V I R O N M E N T`。字段缺失时保持 null，
 * 面板不臆造。</p>
 */

/** hs_err 文件名匹配：hs_err_pid<数字>.log */
export function isHsErrLog(fileName: string): boolean {
  return /^hs_err_pid\d+\.log$/i.test(fileName);
}

/** 崩溃严重程度：原生崩溃 / 内存耗尽 / JVM 内部错误 / 未知 */
export type CrashSeverity = "native" | "oom" | "internal" | "unknown";

/** 问题帧类型：C=原生代码，J=编译 Java 代码，V=VM 代码，j=解释 Java 代码，_ 未知 */
export type FrameKind = "C" | "J" | "j" | "V" | "_";

/** JVM 崩溃日志解析结果 */
export interface JvmCrashReport {
  /** 是否识别为 hs_err（内容层面二次确认，不只看文件名） */
  isHsErr: boolean;
  /** 崩溃严重程度 */
  severity: CrashSeverity;
  /** 崩溃类型标题（如 SIGSEGV / 内存耗尽 / JVM 内部错误） */
  title: string;
  /** 致命错误说明块第一行（# 后的描述，如 `SIGSEGV (0xb) at pc=...`） */
  errorLine: string;
  /** JRE 版本行 */
  jreVersion: string;
  /** Java VM 行 */
  javaVm: string;
  /** Problematic frame 原始行（如 `C  [libc.so.6+0x...]`） */
  problematicFrame: string;
  /** 问题帧类型 */
  frameKind: FrameKind;
  /** 问题帧符号（[] 内内容，去地址） */
  frameSymbol: string;
  /** siginfo 原始行 */
  siginfo: string;
  /** 信号名（如 SIGSEGV / SIGBUS / SIGABRT） */
  signalName: string;
  /** 当前线程原始行 */
  currentThread: string;
  /** Native frames（J=编译 Java, j=解释, Vv=VM, C=native） */
  nativeFrames: string[];
  /** Java frames */
  javaFrames: string[];
  /** VM 参数（jvm_args） */
  vmArgs: string;
  /** java 启动命令（java_command） */
  javaCommand: string;
  /** 堆摘要（H E A P 段的 total/used/free） */
  heapSummary: string;
  /** 堆扩容建议依据：是否接近上限（used/total >= 0.95） */
  heapNearFull: boolean;
  /** OS 行 */
  os: string;
  /** CPU 行 */
  cpu: string;
  /** 内存行 */
  memory: string;
  /** vm_info 行 */
  vmInfo: string;
  /** 崩溃是否发生在原生代码（frameKind=C 或错误行提示 native） */
  crashedInNative: boolean;
  /** 处置建议（面向运维，按严重程度排序） */
  advice: string[];
}

/** 常量池：各信号的中文说明 */
const SIGNAL_HINTS: Record<string, string> = {
  SIGSEGV: "非法内存访问（段错误）：多半是原生库/JNI/驱动越界读写",
  SIGBUS: "总线错误：多半是 mmap/共享内存对齐或文件截断导致",
  SIGABRT: "主动中止：多为断言失败 / 堆元数据损坏 / glibc 检测到问题",
  SIGILL: "非法指令：JNI 代码被编译成非法机器码，或 CPU 不兼容",
  SIGFPE: "浮点异常：除零 / 非法数学运算（原生或 JIT 代码）",
  SIGTERM: "外部终止：进程被 kill 或容器 OOM-Killer 结束",
};

/** 内存相关信号（OOM-Killer / 内存耗尽） */
const OOM_SIGNALS = new Set(["SIGKILL", "SIGTERM"]);

/** 提取首个捕获组（找不到返回 null） */
function first(re: RegExp, text: string): string | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  return m ? m[1] : null;
}

/** 收集某锚点之后、到下一个空行/段落分隔符前的行 */
function collectLines(text: string, anchor: RegExp, stopAt = /^\s*[A-Z][A-Z\s]+----/m): string[] {
  anchor.lastIndex = 0;
  const m = anchor.exec(text);
  if (!m) return [];
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const out: string[] = [];
  for (const line of rest.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) break;
    if (stopAt.test(line) && out.length > 0) break;
    // 跳过纯装饰行（如 `---------------`）
    if (/^[-=#]+$/.test(trimmed)) continue;
    out.push(trimmed);
  }
  return out;
}

/**
 * 解析 hs_err 日志文本。
 *
 * @param text  日志文本
 * @param fileName 文件名（用于首次判定 hs_err，内容命中会覆盖判定）
 * @returns 结构化报告
 */
export function parseJvmCrashLog(text: string, fileName: string): JvmCrashReport {
  const nameIsHsErr = isHsErrLog(fileName);
  // 内容二次确认：头部必须有 fatal/error 说明块
  const contentIsHsErr =
    /#\s*A fatal error has been detected/.test(text) ||
    /#\s+Out of Memory/i.test(text) ||
    /#\s+Internal Error/.test(text) ||
    /#\s+SIG[A-Z]+/.test(text);
  const isHsErr = nameIsHsErr || contentIsHsErr;

  const errorLine =
    first(/#\s+([^\n]+)/, text)
    ?? (isHsErr ? "JVM 崩溃日志" : "");

  // first() 未命中返回 null，而 JvmCrashReport 的这些字段是非空 string；
  // 缺行时用空串表达「日志里没有这一项」，与 vmArgs/heapSummary 的处理一致。
  const jreVersion = first(/#\s*JRE version:\s*(.+)/, text) ?? "";
  const javaVm = first(/#\s*Java VM:\s*(.+)/, text) ?? "";

  // Problematic frame（# 后一行，形如 `C  [libc.so.6+0x...]`）
  let problematicFrame = "";
  let frameKind: FrameKind = "_";
  let frameSymbol = "";
  {
    const pm = /#\s*Problematic frame:\s*\r?\n#\s*([^\n]+)/.exec(text);
    if (pm) {
      problematicFrame = pm[1].trim();
      const km = /^\s*([CJjV])\s+(.+)$/.exec(problematicFrame);
      if (km) {
        frameKind = km[1] as FrameKind;
        const sym = km[2].trim();
        const inner = /\[([^\]]+)\]/.exec(sym);
        frameSymbol = (inner ? inner[1] : sym).replace(/\+0x[0-9a-f]+$/i, "");
      } else {
        frameSymbol = problematicFrame;
      }
    }
  }

  const siginfo = first(/siginfo:\s*(.+)/, text) ?? "";
  const signalName = first(/siginfo: si_signo:\s*\d+\s*\(([^)]+)\)/, text) ?? "";

  const currentThread = first(/Current thread \([^)]+\):\s*(.+)/, text) ?? "";

  const nativeFrames = collectLines(text, /Native frames:/, /^\s*Java frames:/m);
  const javaFrames = collectLines(text, /Java frames:/);

  const vmArgs = first(/jvm_args:\s*(.+)/, text) ?? first(/VM Arguments:\s*\r?\n([^\n]+)/, text) ?? "";
  const javaCommand = first(/java_command:\s*(.+)/, text) ?? "";

  // 堆摘要：取 HEAP 段首个 total/used 描述
  let heapSummary = "";
  let heapNearFull = false;
  {
    const hm = /garbage-first heap total\s+(\d+)[KMG]?,\s*used\s+(\d+)[KMG]?/i.exec(text)
      ?? /total\s+(\d+)[KMG]?,\s*used\s+(\d+)[KMG]?/i.exec(text);
    if (hm) {
      heapSummary = hm[0].trim();
      const total = parseFloat(hm[1]);
      const used = parseFloat(hm[2]);
      if (total > 0) heapNearFull = used / total >= 0.95;
    } else {
      // 退而求其次：找 `Heap:` 段附近含 total/used 的行
      const any = /(?:\r?\n)([^\n]*(?:total|used)[^\n]*)\r?\n/.exec(text);
      heapSummary = any ? any[1].trim() : "";
    }
  }

  const os = first(/OS:\s*(.+)/, text) ?? "";
  const cpu = first(/CPU:\s*(.+)/, text) ?? "";
  const memory = first(/Memory:\s*(.+)/, text) ?? "";
  const vmInfo = first(/vm_info:\s*(.+)/, text) ?? "";

  // 崩溃类型判定
  let severity: CrashSeverity = "unknown";
  const upErr = (errorLine + " " + (signalName ?? "")).toUpperCase();
  if (/OUT OF MEMORY|OutOfMemory|not enough memory|insufficient memory/i.test(text)) {
    severity = "oom";
  } else if (OOM_SIGNALS.has(signalName ?? "") && /memory|killed/i.test(text)) {
    severity = "oom";
  } else if (/INTERNAL ERROR/i.test(text)) {
    severity = "internal";
  } else if (frameKind === "C" || /outside the Java Virtual Machine in native code/i.test(text)) {
    severity = "native";
  } else if (signalName) {
    severity = "native";
  } else if (isHsErr) {
    severity = "unknown";
  }

  const crashedInNative =
    frameKind === "C" || /outside the Java Virtual Machine in native code/i.test(text);

  const title = severity === "oom"
    ? "内存耗尽（Out of Memory）"
    : severity === "internal"
      ? "JVM 内部错误"
      : signalName
        ? signalName
        : isHsErr
          ? "JVM 崩溃"
          : "";

  // 处置建议（面向运维，按严重程度）
  const advice: string[] = [];
  if (severity === "oom") {
    advice.push("内存耗尽：优先增大 JVM 堆（-Xmx）与元空间（-XX:MaxMetaspaceSize），并核对容器/宿主机内存上限与 cgroup 限制");
    advice.push("结合上方堆摘要判断是堆满还是元空间/本机内存不足；堆接近满建议调大 -Xmx 并检查是否内存泄漏");
    advice.push("若进程被 OOM-Killer 结束（SIGKILL/SIGTERM），需同时查看系统 dmesg 中的 oom_score / 被杀进程");
  } else if (severity === "native") {
    advice.push("崩溃发生在原生代码：优先排查 JNI / 第三方 native 库 / 驱动是否与 JDK 版本不兼容");
    advice.push(`问题帧：${frameSymbol || problematicFrame || "未知"}，建议用 -Xint（禁用 JIT）复现以区分编译器问题`);
    advice.push("记录 hs_err 中的 siginfo 与堆栈，尝试升级 JDK 或对依赖的原生库做版本回归");
  } else if (severity === "internal") {
    advice.push("JVM 内部错误：多为 JDK 缺陷或堆/类元数据损坏，建议升级 JDK 并携带完整 hs_err 上报");
    advice.push("可尝试 -XX:+IgnoreUnrecognizedVMOptions 之外的常规调优参数回退，并用 -Xint 复现确认是否 JIT 相关");
  } else if (signalName && SIGNAL_HINTS[signalName]) {
    advice.push(`${signalName}：${SIGNAL_HINTS[signalName]}`);
  }
  if (isHsErr && advice.length === 0) {
    advice.push("保留完整 hs_err 日志与 core dump，作为问题定位与版本回归的依据");
  }
  advice.push("修复前建议保留 hs_err 原文、启动参数与故障前后日志，便于对比复现");

  return {
    isHsErr,
    severity,
    title,
    errorLine,
    jreVersion,
    javaVm,
    problematicFrame,
    frameKind,
    frameSymbol,
    siginfo,
    signalName,
    currentThread,
    nativeFrames,
    javaFrames,
    vmArgs,
    javaCommand,
    heapSummary,
    heapNearFull,
    os,
    cpu,
    memory,
    vmInfo,
    crashedInNative,
    advice,
  };
}
