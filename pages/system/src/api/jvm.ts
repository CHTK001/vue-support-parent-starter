import { http, type ReturnResult } from "@repo/utils";

/**
 * 内存信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface MemoryInfo {
  /** 初始内存(字节) */
  init?: number;
  /** 已使用内存(字节) */
  used?: number;
  /** 已提交内存(字节) */
  committed?: number;
  /** 最大内存(字节) */
  max?: number;
  /** 使用率(%) */
  usagePercent?: number;
}

/**
 * 内存池信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface MemoryPoolInfo {
  /** 内存池名称 */
  name?: string;
  /** 内存池类型 */
  type?: string;
  /** 内存使用信息 */
  usage?: MemoryInfo;
  /** 内存池峰值使用 */
  peakUsage?: MemoryInfo;
}

/**
 * 线程信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ThreadInfo {
  /** 当前线程数 */
  threadCount?: number;
  /** 峰值线程数 */
  peakThreadCount?: number;
  /** 守护线程数 */
  daemonThreadCount?: number;
  /** 总启动线程数 */
  totalStartedThreadCount?: number;
  /** 死锁线程数 */
  deadlockedThreadCount?: number;
}

/**
 * 类加载信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ClassLoadingInfo {
  /** 已加载类数量 */
  loadedClassCount?: number;
  /** 总加载类数量 */
  totalLoadedClassCount?: number;
  /** 已卸载类数量 */
  unloadedClassCount?: number;
}

/**
 * 垃圾收集器信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface GarbageCollectorInfo {
  /** 收集器名称 */
  name?: string;
  /** 收集次数 */
  collectionCount?: number;
  /** 收集时间(毫秒) */
  collectionTime?: number;
  /** 内存池名称 */
  memoryPoolNames?: string[];
}

/**
 * 操作系统信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface OsInfo {
  /** 操作系统名称 */
  name?: string;
  /** 操作系统版本 */
  version?: string;
  /** 操作系统架构 */
  arch?: string;
  /** 可用处理器数量 */
  availableProcessors?: number;
  /** 系统负载平均值 */
  systemLoadAverage?: number;
  /** 总物理内存(字节) */
  totalPhysicalMemory?: number;
  /** 空闲物理内存(字节) */
  freePhysicalMemory?: number;
  /** 总交换空间(字节) */
  totalSwapSpace?: number;
  /** 空闲交换空间(字节) */
  freeSwapSpace?: number;
}

/**
 * CPU 信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface CpuInfo {
  /** 进程 CPU 使用率(%) */
  processCpuLoad?: number;
  /** 系统 CPU 使用率(%) */
  systemCpuLoad?: number;
  /** 进程 CPU 时间(纳秒) */
  processCpuTime?: number;
}

/**
 * 线程详情接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ThreadDetail {
  /** 线程ID */
  threadId?: number;
  /** 线程名称 */
  threadName?: string;
  /** 线程状态 */
  state?: string;
  /** CPU 时间(纳秒) */
  cpuTime?: number;
  /** 用户时间(纳秒) */
  userTime?: number;
  /** CPU 使用率(%) */
  cpuUsage?: number;
  /** 是否守护线程 */
  daemon?: boolean;
  /** 线程优先级 */
  priority?: number;
  /** 阻塞次数 */
  blockedCount?: number;
  /** 阻塞时间(毫秒) */
  blockedTime?: number;
  /** 等待次数 */
  waitedCount?: number;
  /** 等待时间(毫秒) */
  waitedTime?: number;
  /** 锁名称 */
  lockName?: string;
  /** 锁拥有者ID */
  lockOwnerId?: number;
  /** 锁拥有者名称 */
  lockOwnerName?: string;
  /** 堆栈跟踪 */
  stackTrace?: string[];
}

/**
 * JVM 信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface JvmInfo {
  /** JVM 名称 */
  jvmName?: string;
  /** JVM 版本 */
  jvmVersion?: string;
  /** JVM 供应商 */
  jvmVendor?: string;
  /** Java 版本 */
  javaVersion?: string;
  /** Java Home */
  javaHome?: string;
  /** JVM 启动时间 */
  startTime?: number;
  /** JVM 运行时长(毫秒) */
  uptime?: number;
  /** JVM 输入参数 */
  inputArguments?: string[];
  /** 堆内存信息 */
  heapMemory?: MemoryInfo;
  /** 非堆内存信息 */
  nonHeapMemory?: MemoryInfo;
  /** 内存池信息列表 */
  memoryPools?: MemoryPoolInfo[];
  /** 线程信息 */
  threadInfo?: ThreadInfo;
  /** 类加载信息 */
  classLoadingInfo?: ClassLoadingInfo;
  /** GC 信息列表 */
  garbageCollectors?: GarbageCollectorInfo[];
  /** 操作系统信息 */
  osInfo?: OsInfo;
  /** CPU 信息 */
  cpuInfo?: CpuInfo;
  /** 线程详情列表(按CPU占用排序) */
  topCpuThreads?: ThreadDetail[];
}

/**
 * 获取 JVM 信息
 * @returns JVM 信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const fetchJvmInfo = (): Promise<ReturnResult<JvmInfo>> => {
  return http.request<JvmInfo>("get", "/v2/jvm/info");
};

/**
 * 手动执行 GC
 * @returns 执行结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const triggerGc = (): Promise<ReturnResult<string>> => {
  return http.request<string>("post", "/v2/jvm/gc");
};

/**
 * 获取线程详情列表
 * @param topN 返回前 N 个线程
 * @param includeStack 是否包含堆栈信息
 * @returns 线程详情列表
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const fetchThreadDetails = (topN: number = 50, includeStack: boolean = false): Promise<ReturnResult<ThreadDetail[]>> => {
  return http.request<ThreadDetail[]>("get", "/v2/jvm/threads", { params: { topN, includeStack } });
};

/**
 * 获取单个线程详细信息
 * @param threadId 线程ID
 * @returns 线程详情
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const fetchThreadDetail = (threadId: number): Promise<ReturnResult<ThreadDetail>> => {
  return http.request<ThreadDetail>("get", "/v2/jvm/thread", { params: { threadId } });
};

/**
 * CPU 热点信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface CpuHotspot {
  /** 类名 */
  className?: string;
  /** 方法名 */
  methodName?: string;
  /** 文件名 */
  fileName?: string;
  /** 行号 */
  lineNumber?: number;
  /** 采样命中次数 */
  hitCount?: number;
  /** 占比(%) */
  percentage?: number;
  /** 完整方法签名 */
  fullMethod?: string;
  /** 调用者列表 */
  callers?: string[];
}

/**
 * 类级别热点接口
 */
export interface ClassHotspot {
  /** 类名 */
  className?: string;
  /** 采样命中次数 */
  hitCount?: number;
  /** 占比(%) */
  percentage?: number;
  /** 方法数 */
  methodCount?: number;
}

/**
 * 包级别热点接口
 */
export interface PackageHotspot {
  /** 包名 */
  packageName?: string;
  /** 采样命中次数 */
  hitCount?: number;
  /** 占比(%) */
  percentage?: number;
  /** 类数 */
  classCount?: number;
}

/**
 * CPU 热点分析结果接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface CpuHotspotAnalysis {
  /** 采样次数 */
  sampleCount?: number;
  /** 采样时长(毫秒) */
  sampleDuration?: number;
  /** 采样间隔(毫秒) */
  sampleInterval?: number;
  /** 分析的线程数 */
  threadCount?: number;
  /** 热点方法列表 */
  hotspots?: CpuHotspot[];
  /** 热点类统计 */
  classHotspots?: ClassHotspot[];
  /** 热点包统计 */
  packageHotspots?: PackageHotspot[];
}

/**
 * CPU 热点分析
 * @param sampleCount 采样次数
 * @param interval 采样间隔(毫秒)
 * @param topN 返回前 N 个热点
 * @param excludeIdle 排除空闲线程
 * @param packageFilter 包过滤
 * @returns CPU 热点分析结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const analyzeCpuHotspots = (
  sampleCount: number = 20,
  interval: number = 50,
  topN: number = 30,
  excludeIdle: boolean = true,
  packageFilter?: string
): Promise<ReturnResult<CpuHotspotAnalysis>> => {
  return http.request<CpuHotspotAnalysis>("get", "/v2/jvm/hotspots", { 
    params: { sampleCount, interval, topN, excludeIdle, packageFilter } 
  });
};

/**
 * 内存对象信息接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface HeapObjectInfo {
  /** 类名 */
  className?: string;
  /** 实例数量 */
  instanceCount?: number;
  /** 占用内存(字节) */
  bytes?: number;
  /** 内存占比(%) */
  percentage?: number;
  /** 简化类名 */
  simpleClassName?: string;
}

/**
 * 包级别内存统计接口
 */
export interface PackageMemory {
  /** 包名 */
  packageName?: string;
  /** 占用内存(字节) */
  bytes?: number;
  /** 内存占比(%) */
  percentage?: number;
  /** 实例数量 */
  instanceCount?: number;
  /** 类数量 */
  classCount?: number;
}

/**
 * 堆内存分析结果接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface HeapAnalysis {
  /** 分析时间 */
  analysisTime?: number;
  /** 堆内存使用 */
  heapUsage?: MemoryInfo;
  /** 对象总数 */
  totalObjects?: number;
  /** 占用内存总量(字节) */
  totalBytes?: number;
  /** 类数量 */
  classCount?: number;
  /** 对象列表(按内存排序) */
  topByBytes?: HeapObjectInfo[];
  /** 对象列表(按数量排序) */
  topByCount?: HeapObjectInfo[];
  /** 包级别内存统计 */
  packageMemory?: PackageMemory[];
}

/**
 * 堆内存分析
 * @param topN 返回前 N 个
 * @param packageFilter 包名过滤
 * @returns 堆内存分析结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const analyzeHeap = (
  topN: number = 50,
  packageFilter?: string
): Promise<ReturnResult<HeapAnalysis>> => {
  return http.request<HeapAnalysis>("get", "/v2/jvm/heap", { 
    params: { topN, packageFilter } 
  });
};

/**
 * 业务代码影响接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface BusinessCodeImpact {
  /** 业务方法 */
  businessMethod?: string;
  /** 类名 */
  className?: string;
  /** 方法名 */
  methodName?: string;
  /** 文件名 */
  fileName?: string;
  /** 行号 */
  lineNumber?: number;
  /** 影响分数 */
  impactScore?: number;
  /** 影响占比(%) */
  impactPercentage?: number;
  /** 关联热点 */
  relatedHotspots?: string[];
  /** 调用次数 */
  callCount?: number;
  /** 影响类型: CPU/MEMORY/BOTH */
  impactType?: string;
  /** 描述 */
  description?: string;
}

/**
 * 调用链分析接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface CallChainAnalysis {
  /** 热点方法 */
  hotspotMethod?: string;
  /** 业务入口 */
  businessEntry?: string;
  /** 调用链 (从业务入口到热点) */
  callChain?: string[];
  /** 出现次数 */
  occurrenceCount?: number;
  /** 占比(%) */
  percentage?: number;
}

/**
 * 业务入口点接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface BusinessEntryPoint {
  /** 入口方法 */
  entryMethod?: string;
  /** 类名 */
  className?: string;
  /** 方法名 */
  methodName?: string;
  /** 入口类型: Controller/Service/Scheduler/MessageListener等 */
  entryType?: string;
  /** 触发次数 */
  triggerCount?: number;
  /** 关联热点数量 */
  relatedHotspotCount?: number;
  /** CPU影响分数 */
  cpuImpactScore?: number;
  /** 描述 */
  description?: string;
}

/**
 * 业务代码归因分析结果接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface BusinessCodeAnalysis {
  /** 分析时间 */
  analysisTime?: number;
  /** 采样次数 */
  sampleCount?: number;
  /** 采样间隔(毫秒) */
  sampleInterval?: number;
  /** 业务包前缀 */
  businessPackage?: string;
  /** CPU相关业务代码 */
  cpuImpacts?: BusinessCodeImpact[];
  /** 内存相关业务代码 */
  memoryImpacts?: BusinessCodeImpact[];
  /** 调用链分析 */
  callChains?: CallChainAnalysis[];
  /** 业务入口点 */
  entryPoints?: BusinessEntryPoint[];
}

/**
 * 业务代码归因分析
 * @param businessPackage 业务包前缀(如 com.chua)
 * @param sampleCount 采样次数
 * @param interval 采样间隔(毫秒)
 * @param topN 返回前N个结果
 * @returns 业务代码归因分析结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const analyzeBusinessCode = (
  businessPackage: string = "com.chua",
  sampleCount: number = 30,
  interval: number = 50,
  topN: number = 20
): Promise<ReturnResult<BusinessCodeAnalysis>> => {
  return http.request<BusinessCodeAnalysis>("get", "/v2/jvm/business-analysis", { 
    params: { businessPackage, sampleCount, interval, topN } 
  });
};

/**
 * JVM 参数接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface JvmParameter {
  /** 参数名 */
  name?: string;
  /** 当前值 */
  currentValue?: string;
  /** 推荐值 */
  recommendedValue?: string;
  /** 参数类型: MEMORY/GC/PERFORMANCE/DEBUG */
  type?: string;
  /** 优先级: HIGH/MEDIUM/LOW */
  priority?: string;
  /** 说明 */
  description?: string;
  /** 推荐原因 */
  reason?: string;
}

/**
 * GC 建议接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface GcAdvice {
  /** 当前GC收集器 */
  currentGc?: string;
  /** 推荐GC收集器 */
  recommendedGc?: string;
  /** GC参数列表 */
  gcParams?: JvmParameter[];
  /** 推荐原因 */
  reason?: string;
  /** GC频率评估 */
  gcFrequencyAssessment?: string;
  /** GC停顿时间评估 */
  gcPauseAssessment?: string;
}

/**
 * 内存建议接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface MemoryAdvice {
  /** 推荐堆内存大小 */
  recommendedHeapSize?: string;
  /** 推荐初始堆大小 */
  recommendedInitialHeap?: string;
  /** 推荐新生代大小 */
  recommendedNewGenSize?: string;
  /** 推荐元空间大小 */
  recommendedMetaspaceSize?: string;
  /** 内存参数列表 */
  memoryParams?: JvmParameter[];
  /** 当前堆使用率 */
  currentHeapUsage?: number;
  /** 内存压力评估 */
  memoryPressureAssessment?: string;
  /** 建议说明 */
  advice?: string;
}

/**
 * 线程建议接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ThreadAdvice {
  /** 推荐线程栈大小 */
  recommendedStackSize?: string;
  /** 当前线程数 */
  currentThreadCount?: number;
  /** 线程数评估 */
  threadCountAssessment?: string;
  /** 线程参数列表 */
  threadParams?: JvmParameter[];
  /** 建议说明 */
  advice?: string;
}

/**
 * 性能建议接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface PerformanceAdvice {
  /** 类别: GC/MEMORY/THREAD/COMPILER/OTHER */
  category?: string;
  /** 级别: INFO/WARNING/CRITICAL */
  level?: string;
  /** 标题 */
  title?: string;
  /** 详细描述 */
  description?: string;
  /** 建议操作 */
  action?: string;
  /** 影响 */
  impact?: string;
}

/**
 * JVM 优化建议接口
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface JvmOptimizationAdvice {
  /** 分析时间 */
  analysisTime?: number;
  /** 当前JVM参数 */
  currentArgs?: string[];
  /** 推荐JVM参数 */
  recommendedParams?: JvmParameter[];
  /** GC收集器建议 */
  gcAdvice?: GcAdvice;
  /** 内存建议 */
  memoryAdvice?: MemoryAdvice;
  /** 线程建议 */
  threadAdvice?: ThreadAdvice;
  /** 性能建议 */
  performanceAdvices?: PerformanceAdvice[];
  /** 完整启动命令 */
  fullCommand?: string;
  /** 健康评分(0-100) */
  healthScore?: number;
  /** 诊断信息 */
  diagnostics?: string[];
}

/**
 * 获取JVM优化建议
 * @param targetLatency 目标响应时间(ms)
 * @param targetThroughput 目标吞吐量(%)
 * @returns JVM优化建议
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const getJvmOptimization = (
  targetLatency: number = 200,
  targetThroughput: number = 95
): Promise<ReturnResult<JvmOptimizationAdvice>> => {
  return http.request<JvmOptimizationAdvice>("get", "/v2/jvm/optimization", { 
    params: { targetLatency, targetThroughput } 
  });
};

// ==================== 线程Dump相关接口 ====================

/**
 * 线程Dump详情
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ThreadDumpDetail {
  /** 线程ID */
  threadId?: number;
  /** 线程名称 */
  threadName?: string;
  /** 线程状态 */
  state?: string;
  /** 是否为守护线程 */
  daemon?: boolean;
  /** 线程优先级 */
  priority?: number;
  /** 锁信息 */
  lockInfo?: string;
  /** 锁持有者 */
  lockOwner?: string;
  /** 堆栈跟踪 */
  stackTrace?: string[];
  /** 持有的监视器 */
  lockedMonitors?: string[];
  /** 持有的同步器 */
  lockedSynchronizers?: string[];
}

/**
 * 线程Dump信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ThreadDump {
  /** 时间戳 */
  timestamp?: number;
  /** JVM名称 */
  jvmName?: string;
  /** JVM版本 */
  jvmVersion?: string;
  /** 线程数 */
  threadCount?: number;
  /** 死锁线程数 */
  deadlockedCount?: number;
  /** 死锁线程ID列表 */
  deadlockedThreadIds?: number[];
  /** 线程列表 */
  threads?: ThreadDumpDetail[];
  /** Dump文本内容 */
  dumpContent?: string;
}

/**
 * 获取线程Dump
 * @param format 输出格式: json/text
 * @returns 线程Dump信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const getThreadDump = (
  format: string = "json"
): Promise<ReturnResult<ThreadDump>> => {
  return http.request<ThreadDump>("get", "/v2/jvm/thread-dump", { 
    params: { format } 
  });
};

// ==================== 内存泄漏检测相关接口 ====================

/**
 * 对象增长信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ObjectGrowth {
  /** 类名 */
  className?: string;
  /** 简化类名 */
  simpleClassName?: string;
  /** 第一次快照实例数 */
  firstCount?: number;
  /** 第二次快照实例数 */
  secondCount?: number;
  /** 实例数增长 */
  countGrowth?: number;
  /** 增长百分比 */
  growthPercent?: number;
  /** 第一次快照字节数 */
  firstBytes?: number;
  /** 第二次快照字节数 */
  secondBytes?: number;
  /** 字节数增长 */
  bytesGrowth?: number;
  /** 字节增长百分比 */
  bytesGrowthPercent?: number;
}

/**
 * 内存泄漏分析结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface MemoryLeakAnalysis {
  /** 第一次快照时间 */
  firstSnapshotTime?: number;
  /** 第二次快照时间 */
  secondSnapshotTime?: number;
  /** 快照间隔(ms) */
  intervalMs?: number;
  /** 第一次快照堆使用量 */
  firstHeapUsed?: number;
  /** 第二次快照堆使用量 */
  secondHeapUsed?: number;
  /** 堆增长量 */
  heapGrowth?: number;
  /** 堆增长百分比 */
  heapGrowthPercent?: number;
  /** 增长对象列表 */
  growingObjects?: ObjectGrowth[];
  /** 是否可能存在泄漏 */
  possibleLeak?: boolean;
  /** 泄漏风险等级 */
  leakRiskLevel?: string;
  /** 分析结论 */
  conclusion?: string;
  /** 建议 */
  suggestions?: string[];
}

/**
 * 内存泄漏检测
 * @param intervalSeconds 两次快照间隔(秒)
 * @param topN 返回前N个增长的对象
 * @returns 内存泄漏分析结果
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const analyzeMemoryLeak = (
  intervalSeconds: number = 5,
  topN: number = 20
): Promise<ReturnResult<MemoryLeakAnalysis>> => {
  return http.request<MemoryLeakAnalysis>("get", "/v2/jvm/memory-leak", { 
    params: { intervalSeconds, topN } 
  });
};

// ==================== JVM诊断相关接口 ====================

/**
 * VM Flag信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface VmFlag {
  /** 名称 */
  name?: string;
  /** 值 */
  value?: string;
  /** 来源 */
  origin?: string;
  /** 类型 */
  type?: string;
}

/**
 * 类加载器信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface ClassLoaderInfo {
  /** 名称 */
  name?: string;
  /** 类型 */
  type?: string;
  /** 父加载器 */
  parent?: string;
  /** 加载类数量 */
  loadedClassCount?: number;
}

/**
 * 内存池详情
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface MemoryPoolDetail {
  /** 名称 */
  name?: string;
  /** 类型 */
  type?: string;
  /** 当前使用 */
  usage?: MemoryInfo;
  /** 峰值使用 */
  peakUsage?: MemoryInfo;
  /** GC后使用 */
  collectionUsage?: MemoryInfo;
  /** 使用阈值 */
  usageThreshold?: number;
  /** 是否超过阈值 */
  usageThresholdExceeded?: boolean;
  /** 超过阈值次数 */
  usageThresholdCount?: number;
}

/**
 * JVM诊断信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export interface JvmDiagnostic {
  /** 时间戳 */
  timestamp?: number;
  /** VM Flags */
  vmFlags?: VmFlag[];
  /** 系统属性 */
  systemProperties?: Record<string, string>;
  /** 环境变量 */
  environmentVariables?: Record<string, string>;
  /** 类加载器列表 */
  classLoaders?: ClassLoaderInfo[];
  /** 内存池详情 */
  memoryPoolDetails?: MemoryPoolDetail[];
}

/**
 * 获取JVM诊断信息
 * @param includeEnv 是否包含环境变量
 * @returns JVM诊断信息
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const getJvmDiagnostic = (
  includeEnv: boolean = false
): Promise<ReturnResult<JvmDiagnostic>> => {
  return http.request<JvmDiagnostic>("get", "/v2/jvm/diagnostic", { 
    params: { includeEnv } 
  });
};

/**
 * 执行VM诊断命令
 * @param command 命令名称
 * @returns 命令输出
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
export const executeVmCommand = (
  command: string
): Promise<ReturnResult<string>> => {
  return http.request<string>("get", "/v2/jvm/vm-command", { 
    params: { command } 
  });
};
