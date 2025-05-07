// 测试ScLayer组件导入
import { MapType, MapTile } from "./components/ScLayer/types/map";
import { DEFAULT_MAP_CONFIG } from "./components/ScLayer/types/map";

// 简单测试
console.log("MapType.GAODE:", MapType.GAODE);
console.log("MapType.TIANDI:", MapType.TIANDI);
console.log("MapType.OSM:", MapType.OSM);

console.log("MapTile.NORMAL:", MapTile.NORMAL);
console.log("MapTile.SATELLITE:", MapTile.SATELLITE);
console.log("MapTile.HYBRID:", MapTile.HYBRID);

console.log("DEFAULT_MAP_CONFIG[MapType.GAODE]:", DEFAULT_MAP_CONFIG[MapType.GAODE]);
