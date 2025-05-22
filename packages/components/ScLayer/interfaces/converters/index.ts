import { BoundaryConverterFactory } from '../BoundaryConverter';
import { GaodeConverter } from './GaodeConverter';
import { BaiduConverter } from './BaiduConverter';
import { TiandituConverter } from './TiandituConverter';

// 注册所有转换器
BoundaryConverterFactory.register('gaode', new GaodeConverter());
BoundaryConverterFactory.register('baidu', new BaiduConverter());
BoundaryConverterFactory.register('tianditu', new TiandituConverter());

export { BoundaryConverterFactory };
export * from './GaodeConverter';
export * from './BaiduConverter';
export * from './TiandituConverter'; 