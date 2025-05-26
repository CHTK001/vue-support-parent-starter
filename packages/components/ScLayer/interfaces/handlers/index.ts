/**
 * 搜索处理器注册
 */
import { SearchHandlerFactory } from '../SearchHandler';
import { KeywordSearchHandler } from './KeywordSearchHandler';
import { CoordinateSearchHandler } from './CoordinateSearchHandler';
import { NearbySearchHandler } from './NearbySearchHandler';
import { DistrictSearchHandler } from './DistrictSearchHandler';

/**
 * 注册所有搜索处理器
 */
export function registerAllSearchHandlers(): void {
  // 注册关键词搜索处理器
  SearchHandlerFactory.registerHandler(new KeywordSearchHandler());
  
  // 注册坐标搜索处理器
  SearchHandlerFactory.registerHandler(new CoordinateSearchHandler());
  
  // 注册附近搜索处理器
  SearchHandlerFactory.registerHandler(new NearbySearchHandler());
  
  // 注册行政区搜索处理器
  SearchHandlerFactory.registerHandler(new DistrictSearchHandler());
}

// 默认导出所有处理器
export default {
  KeywordSearchHandler,
  CoordinateSearchHandler,
  NearbySearchHandler,
  DistrictSearchHandler
}; 