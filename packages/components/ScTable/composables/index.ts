/**
 * ScTable Composables 统一导出
 */

/** 分页模式类型 */
export type PaginationMode = 'server' | 'local';

// 缓存管理
export { useTableCache } from './useTableCache';
export type { UseTableCacheOptions, CacheItem } from './useTableCache';

// 选择管理
export { useTableSelection } from './useTableSelection';
export type { UseTableSelectionOptions } from './useTableSelection';

// 分页管理
export { useTablePagination } from './useTablePagination';
export type { UseTablePaginationOptions } from './useTablePagination';

// 拖拽排序
export { useTableDragSort } from './useTableDragSort';
export type { UseTableDragSortOptions } from './useTableDragSort';

// 配置管理
export { useTableConfig } from './useTableConfig';
export type { 
  UseTableConfigOptions, 
  ColumnConfig, 
  TableConfigState 
} from './useTableConfig';

// 数据管理
export { useTableData } from './useTableData';
export type { 
  UseTableDataOptions, 
  FetchParams, 
  SortState, 
  FilterState, 
  StatisticData 
} from './useTableData';

// 鼠标拖拽滚动
export { useTableDragScroll } from './useTableDragScroll';
export type { 
  DragScrollOptions, 
  DragScrollReturn 
} from './useTableDragScroll';

// 本地分页/静态数据模式
export { useTableLocalPagination } from './useTableLocalPagination';
export type { 
  LocalPaginationOptions, 
  LocalPaginationReturn 
} from './useTableLocalPagination';

// 预加载缓存
export { useTablePrefetch } from './useTablePrefetch';
export type { 
  PrefetchOptions, 
  PageData, 
  FetchParams as PrefetchFetchParams,
  PrefetchReturn 
} from './useTablePrefetch';

// 数据导出
export { useTableExport } from './useTableExport';
export type { 
  ExportType,
  ExportOptions,
  ExportReturn 
} from './useTableExport';

// 打印功能
export { useTablePrint } from './useTablePrint';
export type { 
  PrintOptions,
  PrintReturn 
} from './useTablePrint';

// 行展开
export { useTableExpand } from './useTableExpand';
export type { 
  ExpandOptions,
  ExpandReturn 
} from './useTableExpand';

// 批量操作
export { useTableBatchAction } from './useTableBatchAction';
export type { 
  BatchAction,
  BatchActionOptions,
  BatchActionReturn 
} from './useTableBatchAction';

// 数据编辑
export { useTableEdit } from './useTableEdit';
export type { 
  EditMode,
  EditState,
  EditOptions,
  EditReturn 
} from './useTableEdit';

// 列搜索
export { useTableColumnSearch } from './useTableColumnSearch';
export type { 
  ColumnSearchOptions,
  ColumnSearchReturn 
} from './useTableColumnSearch';

// 数据统计
export { useTableStatistics } from './useTableStatistics';
export type { 
  StatType,
  ColumnStatConfig,
  StatResult,
  StatisticsOptions,
  StatisticsReturn 
} from './useTableStatistics';

// 变更高亮
export { useTableChangeHighlight } from './useTableChangeHighlight';
export type { 
  ChangeRecord,
  ChangeHighlightOptions,
  ChangeHighlightReturn 
} from './useTableChangeHighlight';

// 行合并
export { useTableRowMerge } from './useTableRowMerge';
export type { 
  MergeInfo,
  RowMergeOptions,
  RowMergeReturn 
} from './useTableRowMerge';

// 性能优化
export { useTablePerformance, createDebounce, createThrottle, createRAFThrottle } from './useTablePerformance';
export type { 
  PerformanceOptions,
  PerformanceMetrics,
  PerformanceReturn 
} from './useTablePerformance';

// 十字高亮优化
export { useTableCrossHighlight, crossHighlightStyles } from './useTableCrossHighlight';
export type { 
  CrossHighlightOptions,
  CrossHighlightState,
  CrossHighlightReturn 
} from './useTableCrossHighlight';
