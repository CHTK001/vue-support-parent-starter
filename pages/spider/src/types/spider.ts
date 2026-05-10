export interface SpiderDefinition {
  spiderId?: number
  spiderCode: string
  spiderName: string
  spiderEntryUrl: string
  spiderSiteHost?: string
  spiderExecutorType?: string
  spiderExecutorRounds?: number
  spiderExecutorJobEnabled?: number
  spiderExecutorJobConfig?: string
  spiderExecutorConfig?: string
  spiderCollectDeepUrl?: number
  spiderNotifyOnFailure?: number
  spiderDedupStrategy?: string
  spiderUrlStorageType?: string
  spiderUrlStorageSpi?: string
  spiderUrlStorageConfig?: string
  spiderStatus?: number
  spiderRemark?: string
  createTime?: string
  updateTime?: string
}

export interface SpiderExecution {
  spiderId?: number
  spiderExecutionNo: string
  spiderDefinitionCode: string
  spiderTriggerType?: string
  spiderExecutionStatus?: string
  spiderCurrentNodeCode?: string
  spiderNeedManualIntervene?: number
  spiderContinueOnFailure?: number
  spiderTraceSnapshot?: string
  spiderStartedAt?: string
  spiderFinishedAt?: string
  createTime?: string
}

export interface DashboardSummary {
  spiderTotalCount?: number
  spiderRunningCount?: number
  spiderUrlCount?: number
  spiderParsedUrlCount?: number
  spiderResultCount?: number
  spiderRemainingUrlCount?: number
  spiderSitePortraits?: Array<{
    siteHost: string
    spiderUrlCount: number
    spiderResultCount: number
    spiderRunningCount: number
    spiderWarningCount: number
  }>
  spiderTimeTrends?: Array<{
    spiderDateLabel: string
    spiderParseCount: number
    spiderResultCount: number
  }>
}

export interface ApiResult<T> {
  code: string
  data: T
  msg: string
  timestamp: number
}
