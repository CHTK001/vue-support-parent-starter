import { getLogger } from "./slf4j";

/**
 * 使用 SLF4J 风格日志替换全局 console 输出
 * 统一前端日志格式，避免在业务代码中直接调用 console.*
 */
export function replaceConsoleWithLogger(): void {
  const logger = getLogger("[前端][Console]");

  /**
   * 通用包装函数
   * 第一个参数视为日志模板，其余作为占位符参数
   */
  const wrap =
    (fn: (message: string, ...args: any[]) => void) =>
    (...args: any[]): void => {
      if (!args.length) {
        return;
      }

      const [first, ...rest] = args;

      // 如果第一个参数是字符串，则作为日志模板，其余作为占位符
      if (typeof first === "string") {
        fn(first, ...rest);
        return;
      }

      // 否则将整体作为占位符参数输出
      fn("{}", first, ...rest);
    };

  // 映射 console 到 SLF4J 日志
  console.debug = wrap((message, ...rest) => logger.debug(message, ...rest));
  console.info = wrap((message, ...rest) => logger.info(message, ...rest));
  console.log = wrap((message, ...rest) => logger.info(message, ...rest));
  console.warn = wrap((message, ...rest) => logger.warn(message, ...rest));
  console.error = wrap((message, ...rest) => logger.error(message, ...rest));
}
