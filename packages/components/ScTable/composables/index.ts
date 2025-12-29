/**
 * ScTable Composables 统一导出
 */

/** 分页模式类型 */
export type PaginationMode = 'server' | 'local' | 'prefetch';

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
