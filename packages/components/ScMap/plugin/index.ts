/**
 * Leaflet插件导入和配置
 * @description 集中导入所有使用的Leaflet插件
 */
import L from 'leaflet';

// 导入插件
import 'leaflet-trackplayer';
// 其他插件按需取消注释
// import 'leaflet-ant-path';
// import 'leaflet-editable';
// import 'leaflet-minimap';
// import 'leaflet-heatmap';
// import 'proj4leaflet';

/**
 * 注册和配置Leaflet插件
 * 如果插件尚未安装，则会显示警告信息
 */
export function setupLeafletPlugins() {
  // 修复Leaflet默认图标路径问题
  fixLeafletIcon();
  
  // 检查和配置Trackplayer插件
  if (!(L as any).TrackPlayer) {
    console.warn('Leaflet-Trackplayer插件未找到。请安装：npm install leaflet-trackplayer');
    
    // 添加一个模拟的trackplayer方法，以防插件不存在
    (L as any).trackplayer = function(options: any) {
      console.warn('使用了模拟的trackplayer方法，轨迹播放功能不可用');
      return L.control();
    };
  }
  
  // 检查AntPath插件
  if (!(L as any).AntPath) {
    console.warn('Leaflet-AntPath插件未找到。请安装：npm install leaflet-ant-path');
    
    // 添加一个模拟的antPath方法
    (L as any).antPath = function(path: any, options: any) {
      console.warn('使用了模拟的antPath方法，动画飞线功能不可用');
      return L.polyline(path, options);
    };
  }
  
  // 检查Editable插件
  if (!L.Editable) {
    console.warn('Leaflet-Editable插件未找到。请安装：npm install leaflet-editable');
  }
  
  // 检查MiniMap插件
  if (!(L as any).Control.MiniMap) {
    console.warn('Leaflet-MiniMap插件未找到。请安装：npm install leaflet-minimap');
  }
  
  // 检查Heatmap插件
  if (!(L as any).heatLayer) {
    console.warn('Leaflet-Heat插件未找到。请安装：npm install leaflet.heat');
  }
  
  // 检查Proj4Leaflet插件
  if (!(L as any).Proj) {
    console.warn('Proj4Leaflet插件未找到。请安装：npm install proj4leaflet');
  }
}

/**
 * 修复Leaflet默认图标问题
 */
function fixLeafletIcon() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} 