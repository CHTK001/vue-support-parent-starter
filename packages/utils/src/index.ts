import * as log from './log';
// 导出日志模块
export { log };

// 导出实用工具
export function replaceConsoleWithLogger() {
  const originalConsole = { ...console };
  
  // 替换console.log为logger.info
  console.log = (...args: any[]) => {
    log.info(...args);
  };
  
  // 替换其他方法
  console.debug = (...args: any[]) => {
    log.debug(...args);
  };
  
  console.info = (...args: any[]) => {
    log.info(...args);
  };
  
  console.warn = (...args: any[]) => {
    log.warn(...args);
  };
  
  console.error = (...args: any[]) => {
    log.error(...args);
  };
  
  // 返回原始console对象，以便可以恢复
  return originalConsole;
} 