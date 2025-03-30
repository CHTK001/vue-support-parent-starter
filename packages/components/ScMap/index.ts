import { App } from 'vue';
import ScMap from './index.vue';
import { 
  MapType, 
  MapOptions, 
  Marker, 
  MapClickEvent, 
  MapViewType, 
  OfflineMapConfig 
} from './types';

// 导出类型
export { 
  MapType, 
  MapOptions, 
  Marker, 
  MapClickEvent, 
  MapViewType, 
  OfflineMapConfig 
};

// 注册组件
ScMap.install = (app: App) => {
  app.component('ScMap', ScMap);
};

export default ScMap;