/**
 * 软件服务日志
 */
export interface SoftServiceLog {
  softServiceLogId?: number;
  softServiceLogInstallId: number;
  softServiceLogServiceId?: number;
  softServiceLogSshId?: string;
  softServiceLogType?: number; // 1-安装，2-卸载，3-启动，4-停止，5-重启，6-状态检查
  softServiceLogContent?: string;
  softServiceLogStatus?: number; // 0-进行中，1-成功，2-失败
  softServiceLogTime?: number;
  softServiceLogFilePath?: string;
  softServiceLogOperationType: string; // install, uninstall, start, stop, restart, status
  softServiceLogServiceName?: string;
  softServiceLogSshName?: string;
  softServiceLogSshHost?: string;
  softServiceLogFileSize?: number;
  softServiceLogDuration?: number;
  softServiceLogCommand?: string;
  softServiceLogError?: string;
  softServiceLogEndTime?: number;
}
