/**
 * 地图类型配置接口
 */
export interface MapTypeConfig {
  /**
   * 地图类型名称
   */
  name: string;
  
  /**
   * 地图URL模板
   */
  url: string;
  
  /**
   * 地图描述
   */
  description?: string;
  
  /**
   * 地图瓦片大小
   */
  tileSize?: number;
  
  /**
   * 地图最小缩放级别
   */
  minZoom?: number;
  
  /**
   * 地图最大缩放级别
   */
  maxZoom?: number;
  
  /**
   * 地图属性信息
   */
  attribution?: string;
  
  /**
   * 子域名设置（用于负载均衡）
   */
  subdomains?: string | string[];
  
  /**
   * 是否启用缓存
   */
  useCache?: boolean;
  
  /**
   * 图层显示范围
   */
  bounds?: [[number, number], [number, number]];
  
  /**
   * 是否为叠加层
   */
  isOverlay?: boolean;
  
  /**
   * 图层不透明度
   */
  opacity?: number;
  
  /**
   * 额外选项配置
   */
  options?: Record<string, any>;
} 