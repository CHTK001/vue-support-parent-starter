/**
 * 浠诲姟绠＄悊妯″潡绫诲瀷瀹氫箟锛園pages/task锛?
 *
 * 瑕嗙洊涓や釜鍚庣妯″潡锛?
 *   1) 浠诲姟娲惧彂 spring-support-taskdistribution-starter锛?v2/taskdistribution锛?
 *   2) 璋冨害涓績 spring-support-scheduler-starter锛?scheduler/api/v1/job-platform锛?
 */

/** 缁熶竴杩斿洖缁撴瀯锛堝悗绔?ReturnResult锛?*/
export interface ApiResult<T = unknown> {
  code?: string | number;
  msg?: string;
  data?: T;
}

/** 鍏叡瀹¤瀛楁 */
export interface Auditable {
  createName?: string;
  createBy?: number;
  createTime?: string;
  updateName?: string;
  updateBy?: number;
  updateTime?: string;
}

/* ================== 浠诲姟娲惧彂 ================== */

/** 娲惧彂浠诲姟 */
export interface DispatchTask {
  taskId?: string;
  /** 浠诲姟绫诲瀷 */
  taskType?: string;
  /** 浠诲姟鐘舵€?*/
  taskStatus?: string;
  /** 浠诲姟鍐呭锛圝SON 瀛楃涓诧級 */
  taskJson?: string;
  /** 浠诲姟缁撴灉锛圝SON 瀛楃涓诧級 */
  resultJson?: string;
  /** 閲嶈瘯娆℃暟 */
  retryCount?: number;
  /** 鍒涘缓鏃堕棿 */
  createdAt?: string;
  /** 瀹屾垚鏃堕棿 */
  completedAt?: string;
  [key: string]: unknown;
}

/** 娲惧彂鑺傜偣 */
export interface DispatchNode {
  nodeId?: string;
  /** 鑺傜偣鏍囩 */
  tags?: string[];
  /** 鑺傜偣鏉冮噸 */
  weight?: number;
  /** 涓绘満 */
  host?: string;
  /** 绔彛 */
  port?: number;
  /** 鏄惁鍦ㄧ嚎 */
  online?: boolean;
  /** 鏈€鍚庡績璺虫椂闂?*/
  lastHeartbeat?: string;
  /** 褰掑睘涓棿浠禝D */
  homeMiddlewareId?: string;
  [key: string]: unknown;
}

/* ================== 璋冨害涓績 ================== */

/** 璋冨害绫诲瀷甯搁噺 */
export const ScheduleType = {
  CRON: "CRON",
  FIXED: "FIXED",
  FIXED_MS: "FIXED_MS",
  DELAY: "DELAY",
  AT: "AT",
  NONE: "NONE",
} as const;

/** 瑙﹀彂鐘舵€佸父閲?*/
export const TriggerStatus = {
  /** 鍋滄 */
  STOPPED: 0,
  /** 杩愯 */
  RUNNING: 1,
} as const;

/** 浠诲姟瀹炰綋 */
export interface JobEntity extends Auditable {
  sysJobId?: number;
  /** 浠诲姟缂栧彿 */
  sysJobNo?: string;
  /** 浠诲姟鍚嶇О */
  sysJobName?: string;
  /** 浣滆€?*/
  sysJobAuthor?: string;
  /** 鍛婅閭 */
  sysJobAlarmEmail?: string;
  /** 浠诲姟鍒嗙粍/鍛藉悕绌洪棿 */
  sysJobGroup?: string;
  /** 璋冨害绫诲瀷: CRON/FIXED/FIXED_MS/DELAY/AT/NONE */
  sysJobScheduleType?: string;
  /** 璋冨害鏃堕棿锛坈ron 琛ㄨ揪寮忔垨闂撮殧锛?*/
  sysJobScheduleTime?: string;
  /** 瑙﹀彂鐘舵€? 0鍋滄 1杩愯 */
  sysJobTriggerStatus?: number;
  /** 鎻忚堪 */
  sysJobDesc?: string;
  /** GLUE 鏇存柊鏃堕棿 */
  sysJobGlueUpdatetime?: string;
  /** GLUE 婧愮爜 */
  sysJobGlueSource?: string;
  /** GLUE 绫诲瀷: BEAN/GLUE */
  sysJobGlueType?: string;
  /** 鍒嗗彂妯″紡: LOCAL/REMOTE */
  sysJobDispatchMode?: string;
  /** 杩滅▼鎵ц鍣ㄥ湴鍧€ */
  sysJobRemoteExecutorAddress?: string;
  /** 瀛樺偍妯″紡: DATABASE/FILE */
  sysJobStorageMode?: string;
  /** 澶辫触閲嶈瘯娆℃暟 */
  sysJobFailRetry?: number;
  /** 閲嶈瘯闂撮殧 */
  sysJobRetryInterval?: number;
  /** 鎵ц瓒呮椂(绉? */
  sysJobExecuteTimeout?: number;
  /** 鎵ц Bean */
  sysJobExecuteBean?: string;
  /** 鎵ц鍙傛暟 */
  sysJobExecuteParam?: string;
  /** 寮傚父鍥炶皟 Bean */
  sysJobExceptionCallbackBean?: string;
  /** 閲嶈瘯鍥炶皟 Bean */
  sysJobRetryCallbackBean?: string;
  /** 鎵ц杩囨湡绛栫暐 */
  sysJobExecuteMisfireStrategy?: string;
  /** 涓婃瑙﹀彂鏃堕棿 */
  sysJobTriggerLastTime?: number;
  /** 涓嬫瑙﹀彂鏃堕棿 */
  sysJobTriggerNextTime?: number;
  /** 鏄惁鍒犻櫎 */
  sysJobIsDeleted?: number;
  /** 涔愯閿佺増鏈?*/
  sysJobVersion?: number;
}

/** 浠诲姟鏃ュ織 */
export interface JobLogEntity extends Auditable {
  sysJobLogId?: number;
  sysJobLogNo?: string;
  sysJobId?: number;
  sysJobNo?: string;
  /** 搴旂敤鍚?*/
  sysJobLogApp?: string;
  /** 瑙﹀彂 Bean */
  sysJobLogTriggerBean?: string;
  /** 瑙﹀彂绫诲瀷 */
  sysJobLogTriggerType?: string;
  /** 鎵ц鐜 */
  sysJobLogProfile?: string;
  /** 瑙﹀彂鏃堕棿 */
  sysJobLogTriggerTime?: string;
  /** 瑙﹀彂鏃ユ湡 */
  sysJobLogTriggerDate?: string;
  /** 瑙﹀彂缁撴灉鐮?*/
  sysJobLogTriggerCode?: string;
  /** 鎵ц缁撴灉鐮?*/
  sysJobLogExecuteCode?: string;
  /** 鑰楁椂 */
  sysJobLogCost?: number;
  /** 瑙﹀彂娑堟伅 */
  sysJobLogTriggerMsg?: string;
  /** 瑙﹀彂鍙傛暟 */
  sysJobLogTriggerParam?: string;
  /** 瑙﹀彂鍦板潃 */
  sysJobLogTriggerAddress?: string;
  /** 鑺傜偣ID */
  sysJobLogNodeId?: string;
  /** 鏃ュ織鏂囦欢璺緞 */
  sysJobLogFilePath?: string;
  /** 鏄惁鍒犻櫎 */
  sysJobLogIsDeleted?: number;
}

/** 璋冨害浠诲姟瑙嗗浘锛坱ask/list 杩斿洖锛?*/
export interface SchedulerTaskVO {
  jobId?: number;
  jobNo?: string;
  taskKey?: string;
  taskName?: string;
  scheduleType?: string;
  cronExpression?: string;
  enabled?: boolean;
  description?: string;
  scheduled?: boolean;
  dispatchMode?: string;
  remoteExecutorAddress?: string;
  storageMode?: string;
  nextExecutionTime?: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastRunStatus?: string;
  lastRunMessage?: string;
  deleted?: boolean;
}

/** 浠诲姟鏇存柊璇锋眰 */
export interface SchedulerTaskUpdateRequest {
  cronExpression?: string;
  enabled?: boolean;
}
