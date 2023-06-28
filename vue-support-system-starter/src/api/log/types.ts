/**
 * 日志查询参数
 */
export interface LogQuery extends PageQuery {
    keywords?: string;
}

//日志信息
export class LoggerState {
    logId = undefined;     //id
    logName = undefined;        //名称
    logCost = undefined;
    logAction = undefined;
    logMapping = undefined;
    logContent = undefined;
    logAddress = undefined;
    createTime = undefined;
    logStatus = undefined;
    logArea = undefined;
    logLatitude = undefined;
    logLongitude = undefined;
    logWatch = undefined;
}
