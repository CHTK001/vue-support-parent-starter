/**
 * 堆栈劫持工具
 * @description 使用 Error.prepareStackTrace（Node.js）或解析 Error.stack（浏览器）自定义错误堆栈格式
 */

/**
 * 堆栈帧信息（浏览器环境）
 */
interface StackFrame {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  isNative?: boolean;
}

/**
 * CallSite 接口（V8 堆栈跟踪 API）
 */
interface CallSite {
  getThis(): any;
  getTypeName(): string | null;
  getFunctionName(): string | null;
  getMethodName(): string | null;
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
  getFunction(): Function | undefined;
  getEvalOrigin(): string | undefined;
  isNative(): boolean;
  isToplevel(): boolean;
  isEval(): boolean;
  isConstructor(): boolean;
  isAsync(): boolean;
  isPromiseAll(): boolean;
  getPromiseIndex(): number | null;
}

/**
 * 堆栈格式化配置
 */
export interface StackTraceOptions {
  /** 是否显示文件名 */
  showFileName?: boolean;
  /** 是否显示行号 */
  showLineNumber?: boolean;
  /** 是否显示列号 */
  showColumnNumber?: boolean;
  /** 是否显示函数名 */
  showFunctionName?: boolean;
  /** 是否显示类型名 */
  showTypeName?: boolean;
  /** 是否过滤内部框架代码 */
  filterInternal?: boolean;
  /** 需要过滤的文件路径模式（正则表达式数组） */
  filterPatterns?: RegExp[];
  /** 最大堆栈深度 */
  maxDepth?: number;
  /** 是否显示原生代码 */
  showNative?: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<StackTraceOptions> = {
  showFileName: true,
  showLineNumber: true,
  showColumnNumber: false,
  showFunctionName: true,
  showTypeName: false,
  filterInternal: true,
  filterPatterns: [
    /node_modules/,
    /\.vue\?/,
    /webpack/,
    /vite/,
    /@vue/,
    /runtime/,
  ],
  maxDepth: 20,
  showNative: false,
};

/**
 * 当前堆栈格式化配置
 */
let currentOptions: Required<StackTraceOptions> = { ...DEFAULT_OPTIONS };

/**
 * 是否已初始化
 */
let isInitialized = false;

/**
 * 是否在浏览器环境
 */
const isBrowser = typeof window !== 'undefined';

/**
 * 原始 prepareStackTrace（如果存在）
 */
let originalPrepareStackTrace: ((error: Error, stack: CallSite[]) => any) | undefined;


/**
 * 全局错误监听器（浏览器环境）
 */
let globalErrorHandler: ((event: ErrorEvent) => void) | undefined;

/**
 * Promise 未处理错误监听器（浏览器环境）
 */
let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | undefined;

/**
 * 正在处理的错误集合（防止递归）
 */
const processingErrors = new WeakSet<Error>();

/**
 * 格式化单个堆栈帧
 */
function formatCallSite(callSite: CallSite, index: number): string | null {
  const {
    showFileName,
    showLineNumber,
    showColumnNumber,
    showFunctionName,
    showTypeName,
    showNative,
  } = currentOptions;

  // 过滤原生代码
  if (!showNative && callSite.isNative()) {
    return null;
  }

  const parts: string[] = [];

  // 添加函数信息
  if (showFunctionName || showTypeName) {
    const functionName = callSite.getFunctionName();
    const typeName = callSite.getTypeName();
    const methodName = callSite.getMethodName();

    let funcInfo = '';
    if (showTypeName && typeName) {
      funcInfo = typeName;
    }
    if (functionName) {
      funcInfo += funcInfo ? `.${functionName}` : functionName;
    } else if (methodName) {
      funcInfo += funcInfo ? `.${methodName}` : methodName;
    }

    if (funcInfo) {
      parts.push(funcInfo);
    } else {
      parts.push('<anonymous>');
    }
  }

  // 添加位置信息
  const fileName = callSite.getFileName();
  const lineNumber = callSite.getLineNumber();
  const columnNumber = callSite.getColumnNumber();

  if (showFileName && fileName) {
    let location = fileName;

    if (showLineNumber && lineNumber !== null) {
      location += `:${lineNumber}`;
      if (showColumnNumber && columnNumber !== null) {
        location += `:${columnNumber}`;
      }
    }

    parts.push(`(${location})`);
  } else if (showLineNumber && lineNumber !== null) {
    parts.push(`(line ${lineNumber})`);
  }

  return parts.length > 0 ? `    at ${parts.join(' ')}` : null;
}

/**
 * 检查是否应该过滤该堆栈帧（Node.js 环境）
 */
function shouldFilter(callSite: CallSite): boolean {
  if (!currentOptions.filterInternal) {
    return false;
  }

  const fileName = callSite.getFileName();
  if (!fileName) {
    return false;
  }

  // 检查过滤模式
  for (const pattern of currentOptions.filterPatterns) {
    if (pattern.test(fileName)) {
      return true;
    }
  }

  return false;
}

/**
 * 检查是否应该过滤该堆栈帧（浏览器环境）
 */
function shouldFilterBrowser(frame: StackFrame): boolean {
  if (!currentOptions.filterInternal) {
    return false;
  }

  const fileName = frame.fileName;
  if (!fileName) {
    return false;
  }

  // 检查过滤模式
  for (const pattern of currentOptions.filterPatterns) {
    if (pattern.test(fileName)) {
      return true;
    }
  }

  return false;
}

/**
 * 解析浏览器堆栈字符串
 */
function parseBrowserStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  const lines = stack.split('\n');

  // 跳过第一行（错误消息）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    // 匹配格式：at functionName (fileName:line:column) 或 at fileName:line:column
    // 也匹配：functionName@fileName:line:column（Firefox）
    
    // Chrome/Edge: at functionName (fileName:line:column)
    let match = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
    if (match) {
      const frame: StackFrame = {
        functionName: match[1].trim(),
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
        isNative: match[2] === '<anonymous>' || match[2].startsWith('native'),
      };
      frames.push(frame);
      continue;
    }

    // Firefox: functionName@fileName:line:column
    match = line.match(/^\s*(.+?)\s*@\s*(.+?):(\d+):(\d+)$/);
    if (match) {
      const frame: StackFrame = {
        functionName: match[1].trim(),
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
        isNative: match[2] === '<anonymous>' || match[2].startsWith('native'),
      };
      frames.push(frame);
      continue;
    }

    // 简化格式: at fileName:line:column
    match = line.match(/^\s*at\s+(.+?):(\d+):(\d+)$/);
    if (match) {
      const frame: StackFrame = {
        fileName: match[1],
        lineNumber: parseInt(match[2], 10),
        columnNumber: parseInt(match[3], 10),
        isNative: match[1] === '<anonymous>' || match[1].startsWith('native'),
      };
      frames.push(frame);
      continue;
    }

    // 无位置信息: at functionName
    match = line.match(/^\s*at\s+(.+?)$/);
    if (match) {
      const frame: StackFrame = {
        functionName: match[1].trim(),
        isNative: match[1].includes('native'),
      };
      frames.push(frame);
    }
  }

  return frames;
}

/**
 * 格式化浏览器堆栈帧
 */
function formatBrowserFrame(frame: StackFrame, index: number): string | null {
  const {
    showFileName,
    showLineNumber,
    showColumnNumber,
    showFunctionName,
    showNative,
  } = currentOptions;

  // 过滤原生代码
  if (!showNative && frame.isNative) {
    return null;
  }

  const parts: string[] = [];

  // 添加函数信息
  if (showFunctionName) {
    if (frame.functionName) {
      parts.push(frame.functionName);
    } else {
      parts.push('<anonymous>');
    }
  }

  // 添加位置信息
  if (showFileName && frame.fileName) {
    let location = frame.fileName;

    if (showLineNumber && frame.lineNumber !== undefined) {
      location += `:${frame.lineNumber}`;
      if (showColumnNumber && frame.columnNumber !== undefined) {
        location += `:${frame.columnNumber}`;
      }
    }

    parts.push(`(${location})`);
  } else if (showLineNumber && frame.lineNumber !== undefined) {
    parts.push(`(line ${frame.lineNumber})`);
  }

  return parts.length > 0 ? `    at ${parts.join(' ')}` : null;
}

/**
 * 格式化浏览器堆栈
 * @param error 错误对象
 * @param originalStack 原始堆栈字符串（可选，避免递归访问 error.stack）
 */
function formatBrowserStack(error: Error, originalStack?: string): string {
  const errorName = error.name || 'Error';
  const errorMessage = error.message || '';
  const header = errorMessage ? `${errorName}: ${errorMessage}` : errorName;

  // 使用提供的原始堆栈，绝不访问 error.stack（避免触发 getter 导致递归）
  const stackString = originalStack ?? (error as any).__originalStack;
  
  if (!stackString) {
    return header;
  }

  const frames = parseBrowserStack(stackString);
  const stackLines: string[] = [header];

  let depth = 0;
  for (const frame of frames) {
    // 检查深度限制
    if (depth >= currentOptions.maxDepth) {
      stackLines.push(`    ... (${frames.length - depth} more frames)`);
      break;
    }

    // 过滤内部代码
    if (shouldFilterBrowser(frame)) {
      continue;
    }

    const formatted = formatBrowserFrame(frame, depth);
    if (formatted) {
      stackLines.push(formatted);
      depth++;
    }
  }

  // 如果没有堆栈信息，返回基本错误信息
  if (stackLines.length === 1) {
    return header;
  }

  return stackLines.join('\n');
}

/**
 * 自定义堆栈格式化函数
 */
function customPrepareStackTrace(
  error: Error,
  structuredStackTrace: CallSite[]
): string {
  // 如果正在处理中，返回基本错误信息（防止递归）
  if (processingErrors.has(error)) {
    const errorName = error.name || 'Error';
    const errorMessage = error.message || '';
    return errorMessage ? `${errorName}: ${errorMessage}` : errorName;
  }

  const errorName = error.name || 'Error';
  const errorMessage = error.message || '';
  const header = errorMessage ? `${errorName}: ${errorMessage}` : errorName;

  const stackLines: string[] = [header];

  let depth = 0;
  for (const callSite of structuredStackTrace) {
    // 检查深度限制
    if (depth >= currentOptions.maxDepth) {
      stackLines.push(`    ... (${structuredStackTrace.length - depth} more frames)`);
      break;
    }

    // 过滤内部代码
    if (shouldFilter(callSite)) {
      continue;
    }

    const formatted = formatCallSite(callSite, depth);
    if (formatted) {
      stackLines.push(formatted);
      depth++;
    }
  }

  // 如果没有堆栈信息，返回基本错误信息
  if (stackLines.length === 1) {
    return header;
  }

  return stackLines.join('\n');
}

/**
 * 格式化错误堆栈（统一入口）
 */
export function formatErrorStack(error: Error): string {
  // 如果已经有格式化后的堆栈，直接返回
  if ((error as any).__formattedStack) {
    return (error as any).__formattedStack;
  }

  // 如果正在处理中，返回基本错误信息（防止递归）
  if (processingErrors.has(error)) {
    return `${error.name}: ${error.message}`;
  }

  // Node.js 环境：使用 prepareStackTrace（如果已初始化）
  if (typeof Error.prepareStackTrace !== 'undefined' && isInitialized) {
    try {
      // 标记为正在处理
      processingErrors.add(error);
      
      try {
        // 优先使用已保存的原始堆栈（避免触发 getter）
        let originalStack: string | undefined = (error as any).__originalStack;
        
        if (!originalStack) {
          // 安全地获取堆栈，避免触发循环
          try {
            const stackDescriptor = Object.getOwnPropertyDescriptor(error, 'stack');
            if (stackDescriptor && stackDescriptor.get) {
              // 如果有 getter，尝试调用但捕获可能的递归错误
              try {
                originalStack = stackDescriptor.get.call(error) as string;
              } catch (e) {
                if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
                  originalStack = `${error.name}: ${error.message}`;
                } else {
                  throw e;
                }
              }
            } else {
              // 没有 getter，直接访问
              originalStack = error.stack;
            }
            
            if (originalStack) {
              (error as any).__originalStack = originalStack;
            }
          } catch (e) {
            if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
              originalStack = `${error.name}: ${error.message}`;
            } else {
              // 其他错误，尝试直接读取
              originalStack = (error as any).stack || `${error.name}: ${error.message}`;
            }
          }
        }
        
        // 访问 error.stack 会触发 customPrepareStackTrace
        // 但如果已经有原始堆栈，customPrepareStackTrace 应该使用它
        const result = error.stack || originalStack || `${error.name}: ${error.message}`;
        
        // 缓存格式化结果
        if (result && result !== `${error.name}: ${error.message}`) {
          (error as any).__formattedStack = result;
        }
        
        return result;
      } finally {
        processingErrors.delete(error);
      }
    } catch (e) {
      processingErrors.delete(error);
      // 如果出现 RangeError，返回基本错误信息
      if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
        return `${error.name}: ${error.message}`;
      }
      console.error('[堆栈格式化] 格式化过程中发生异常:', e);
      return `${error.name}: ${error.message}`;
    }
  }

  // 浏览器环境：解析堆栈字符串
  if (isBrowser) {
    try {
      // 如果正在处理中，返回基本错误信息（防止递归）
      if (processingErrors.has(error)) {
        return `${error.name}: ${error.message}`;
      }

      // 优先使用已保存的原始堆栈
      let originalStack: string | undefined = (error as any).__originalStack;
      
      // 如果没有保存的原始堆栈，安全地获取原始堆栈
      if (!originalStack) {
        // 标记为正在处理
        processingErrors.add(error);
        
        try {
          // 使用更安全的方式获取堆栈
          try {
            const stackDescriptor = Object.getOwnPropertyDescriptor(error, 'stack');
            if (stackDescriptor && stackDescriptor.get) {
              try {
                originalStack = stackDescriptor.get.call(error) as string;
              } catch (e) {
                if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
                  originalStack = `${error.name}: ${error.message}`;
                } else {
                  throw e;
                }
              }
            } else {
              originalStack = error.stack;
            }
          } catch (e) {
            if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
              originalStack = `${error.name}: ${error.message}`;
            } else {
              originalStack = (error as any).stack;
            }
          }
          
          if (originalStack) {
            (error as any).__originalStack = originalStack;
          }
        } finally {
          processingErrors.delete(error);
        }
      }
      
      if (originalStack) {
        const formatted = formatBrowserStack(error, originalStack);
        // 缓存格式化结果
        (error as any).__formattedStack = formatted;
        return formatted;
      }
    } catch (e) {
      // 如果出现 RangeError，返回基本错误信息
      if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
        return `${error.name}: ${error.message}`;
      }
      console.error('[堆栈格式化] 格式化过程中发生异常:', e);
    }
  }

  // 降级：返回基本错误信息
  return `${error.name}: ${error.message}`;
}

/**
 * 初始化堆栈劫持
 * @param options 堆栈格式化配置
 * @returns 是否成功初始化
 */
export function initStackTrace(options?: StackTraceOptions): boolean {
  if (isInitialized) {
    return true;
  }

  // 更新配置
  currentOptions = { ...DEFAULT_OPTIONS, ...options };

  // 浏览器环境：在错误事件中格式化堆栈
  if (isBrowser) {
    // 添加全局错误监听器，在错误发生时格式化堆栈
    globalErrorHandler = (event: ErrorEvent) => {
      const error = event.error;
      if (!error || !(error instanceof Error)) {
        return;
      }

      // 如果正在处理中，跳过（防止递归）
      if (processingErrors.has(error)) {
        return;
      }

      // 如果已经格式化过，跳过
      if ((error as any).__formattedStack) {
        return;
      }

      // 标记为正在处理
      processingErrors.add(error);

      try {
        // 使用更安全的方式获取堆栈，避免触发 getter 导致递归
        let originalStack: string | undefined;
        
        try {
          // 尝试直接访问 stack 属性
          const stackDescriptor = Object.getOwnPropertyDescriptor(error, 'stack');
          if (stackDescriptor && stackDescriptor.get) {
            // 如果有 getter，尝试调用但捕获可能的递归错误
            try {
              originalStack = stackDescriptor.get.call(error) as string;
            } catch (e) {
              // 如果访问 stack 导致 RangeError，说明可能有递归
              if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
                // 从错误消息中提取信息
                originalStack = `${error.name}: ${error.message}`;
              } else {
                throw e;
              }
            }
          } else {
            // 没有 getter，直接访问
            originalStack = error.stack;
          }
        } catch (e) {
          // 如果访问 stack 导致 RangeError，说明可能有递归
          if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
            originalStack = `${error.name}: ${error.message}`;
          } else {
            // 其他错误，尝试直接读取
            originalStack = (error as any).stack;
          }
        }

        if (originalStack) {
          // 保存原始堆栈
          (error as any).__originalStack = originalStack;
          // 格式化堆栈并缓存
          const formatted = formatBrowserStack(error, originalStack);
          (error as any).__formattedStack = formatted;
        }
      } catch (e) {
        // 如果格式化失败，至少保存原始错误信息
        if (!(error as any).__originalStack) {
          (error as any).__originalStack = `${error.name}: ${error.message}`;
        }
        console.error('[堆栈格式化] 格式化过程中发生异常:', e);
      } finally {
        // 处理完成后移除标记
        processingErrors.delete(error);
      }
    };

    // 添加 Promise 未处理错误监听器
    unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (!reason || !(reason instanceof Error)) {
        return;
      }

      // 如果正在处理中，跳过（防止递归）
      if (processingErrors.has(reason)) {
        return;
      }

      // 如果已经格式化过，跳过
      if ((reason as any).__formattedStack) {
        return;
      }

      // 标记为正在处理
      processingErrors.add(reason);

      try {
        // 使用更安全的方式获取堆栈，避免触发 getter 导致递归
        let originalStack: string | undefined;
        
        try {
          // 尝试直接访问 stack 属性
          const stackDescriptor = Object.getOwnPropertyDescriptor(reason, 'stack');
          if (stackDescriptor && stackDescriptor.get) {
            // 如果有 getter，尝试调用但捕获可能的递归错误
            try {
              originalStack = stackDescriptor.get.call(reason) as string;
            } catch (e) {
              // 如果访问 stack 导致 RangeError，说明可能有递归
              if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
                // 从错误消息中提取信息
                originalStack = `${reason.name}: ${reason.message}`;
              } else {
                throw e;
              }
            }
          } else {
            // 没有 getter，直接访问
            originalStack = reason.stack;
          }
        } catch (e) {
          // 如果访问 stack 导致 RangeError，说明可能有递归
          if (e instanceof RangeError && e.message.includes('Maximum call stack')) {
            originalStack = `${reason.name}: ${reason.message}`;
          } else {
            // 其他错误，尝试直接读取
            originalStack = (reason as any).stack;
          }
        }

        if (originalStack) {
          // 保存原始堆栈
          (reason as any).__originalStack = originalStack;
          // 格式化堆栈并缓存
          const formatted = formatBrowserStack(reason, originalStack);
          (reason as any).__formattedStack = formatted;
        }
      } catch (e) {
        // 如果格式化失败，至少保存原始错误信息
        if (!(reason as any).__originalStack) {
          (reason as any).__originalStack = `${reason.name}: ${reason.message}`;
        }
        console.error('[堆栈格式化] 格式化过程中发生异常:', e);
      } finally {
        // 处理完成后移除标记
        processingErrors.delete(reason);
      }
    };

    window.addEventListener('error', globalErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    isInitialized = true;
    return true;
  }

  // Node.js 环境：使用 Error.prepareStackTrace
  if (typeof Error.prepareStackTrace !== 'undefined') {
    // 保存原始函数（如果存在）
    if (typeof Error.prepareStackTrace === 'function') {
      originalPrepareStackTrace = Error.prepareStackTrace;
    }

    // 设置自定义堆栈格式化函数
    Error.prepareStackTrace = customPrepareStackTrace;
    isInitialized = true;
    return true;
  }

  // 不支持的环境
  return false;
}

/**
 * 恢复原始堆栈格式化
 */
export function restoreStackTrace(): void {
  if (!isInitialized) {
    return;
  }

  // 浏览器环境：移除全局错误监听器
  if (isBrowser) {
    if (globalErrorHandler && typeof window !== 'undefined') {
      window.removeEventListener('error', globalErrorHandler);
      globalErrorHandler = undefined;
    }
    if (unhandledRejectionHandler && typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      unhandledRejectionHandler = undefined;
    }
    isInitialized = false;
    return;
  }

  // Node.js 环境：恢复原始的 prepareStackTrace
  if (typeof Error.prepareStackTrace === 'undefined') {
    isInitialized = false;
    return;
  }

  if (originalPrepareStackTrace) {
    Error.prepareStackTrace = originalPrepareStackTrace;
  } else {
    delete Error.prepareStackTrace;
  }

  originalPrepareStackTrace = undefined;
  isInitialized = false;
}

/**
 * 更新堆栈格式化配置
 * @param options 新的配置选项
 */
export function updateStackTraceOptions(options: Partial<StackTraceOptions>): void {
  currentOptions = { ...currentOptions, ...options };
}

/**
 * 获取当前配置
 */
export function getStackTraceOptions(): Readonly<Required<StackTraceOptions>> {
  return { ...currentOptions };
}

