/**
 * @repo/ui 默认安装不包含的地图组件不走 installUi；
 * 本目录存放本应用自定义的 Leaflet 地图封装组件：
 *   - GeoMap.vue       地图容器（底图 + 选区绘制）
 *   - ManualBounds.vue 手动四至输入
 */

// 地图模式
/**
 * 地图模式键
 * @author CH
 * @since 4.0.0
 */
export type ModeKey = "imagery" | "dem" | "wayback" | "tiles3d" | "mvt" | "osm"

/**
 * 地图模式元信息
 * @author CH
 * @since 4.0.0
 */
export interface ModeMeta {
  value: ModeKey
  label: string
  icon: string
  description: string
}

/** 应用模式列表 */
export const MODES: ModeMeta[] = [
  { value: "imagery", label: "影像", icon: "Picture", description: "高分影像瓦片下载" },
  { value: "dem", label: "高程", icon: "TrendCharts", description: "DEM 高程数据下载" },
  { value: "wayback", label: "历史影像", icon: "Calendar", description: "Esri Wayback 历史影像" },
  { value: "tiles3d", label: "3D 模型", icon: "Box", description: "3D Tiles 资产下载" },
  { value: "mvt", label: "矢量瓦片", icon: "Grid", description: "MVT 矢量瓦片预览" },
  { value: "osm", label: "OSM 矢量", icon: "Share", description: "OpenStreetMap 矢量数据" },
]

/** 输出格式选项 */
export const FORMAT_OPTIONS = [
  { value: "geotiff", label: "GeoTIFF (.tif)" },
  { value: "png", label: "PNG (.png)" },
  { value: "jpeg", label: "JPEG (.jpg)" },
  { value: "tiles", label: "原始瓦片目录" },
  { value: "mbtiles", label: "MBTiles (.mbtiles)" },
  { value: "gpkg", label: "GeoPackage (.gpkg)" },
]

/** TIFF 压缩选项 */
export const COMPRESSION_OPTIONS = [
  { value: "none", label: "无压缩（最快导出）" },
  { value: "lzw", label: "LZW（通用兼容）" },
  { value: "deflate", label: "Deflate（体积最小）" },
]