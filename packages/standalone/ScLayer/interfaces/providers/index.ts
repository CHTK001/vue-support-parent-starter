import { BoundaryDataProviderFactory } from '../BoundaryDataProvider';
import { GaodeBoundaryProvider } from './GaodeBoundaryProvider';
import { BaiduBoundaryProvider } from './BaiduBoundaryProvider';
import { TiandituBoundaryProvider } from './TiandituBoundaryProvider';

import { SearchDataProviderFactory } from '../SearchDataProvider';
import { GaodeSearchProvider } from './GaodeSearchProvider';
import { BaiduSearchProvider } from './BaiduSearchProvider';

/**
 * 注册所有边界数据提供者
 */
export function registerAllProviders(): void {
  // 注册边界数据提供者
  BoundaryDataProviderFactory.register('gaode', new GaodeBoundaryProvider());
  BoundaryDataProviderFactory.register('baidu', new BaiduBoundaryProvider());
  BoundaryDataProviderFactory.register('tianditu', new TiandituBoundaryProvider());
  
  // 注册搜索数据提供者
  registerAllSearchProviders();
}

/**
 * 注册所有搜索数据提供者
 */
export function registerAllSearchProviders(): void {
  SearchDataProviderFactory.register('gaode', new GaodeSearchProvider());
  SearchDataProviderFactory.register('baidu', new BaiduSearchProvider());
  // 可以在这里添加更多搜索提供者
}

// 导出所有提供者
export {
  GaodeBoundaryProvider,
  BaiduBoundaryProvider,
  TiandituBoundaryProvider
}; 