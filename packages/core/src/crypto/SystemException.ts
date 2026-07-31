/**
 * 系统异常 —— createApp 链路上不可恢复的错误
 *
 * 依据失败策略：
 * - wasm 加密模块加载失败 → 抛 SystemException（链路中断）
 * - app.yaml 加载失败 → 使用默认配置（不抛）
 * - 主题等其它系统配置加载失败 → 抛 SystemException
 */
export class SystemException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SystemException";
  }
}
