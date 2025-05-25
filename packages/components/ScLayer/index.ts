// 导出接口和类型
export * from './types';

// 导出组件
export { default as ScLayer } from './components/ScLayer.vue';

// 导出工具函数
export * from './utils/GcoordUtils';
export * from './utils/IndexedDBProxy';

// 导出边界数据提供者接口和实现
export { BoundaryDataProvider, BoundaryDataProviderFactory } from './interfaces/BoundaryDataProvider';
export { GaodeBoundaryProvider } from './interfaces/providers/GaodeBoundaryProvider';
export { BaiduBoundaryProvider } from './interfaces/providers/BaiduBoundaryProvider';
export { TiandituBoundaryProvider } from './interfaces/providers/TiandituBoundaryProvider';

// 导出搜索数据提供者接口和实现
export { SearchDataProvider, SearchDataProviderFactory } from './interfaces/SearchDataProvider';
export { GaodeSearchProvider } from './interfaces/providers/GaodeSearchProvider';
export { BaiduSearchProvider } from './interfaces/providers/BaiduSearchProvider';

// 导出注册函数
export { registerAllProviders, registerAllSearchProviders } from './interfaces/providers'; 