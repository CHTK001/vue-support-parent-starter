/**
 * 坐标搜索处理器
 */
import { SearchHandler } from '../SearchHandler';
import { SearchType } from '../../types/search';
import type { SearchBoxConfig, SearchResult, SearchOptions } from '../../types/search';
import { CoordSystem } from '../../types/coordinate';
import { GcoordUtils } from '../../utils/GcoordUtils';
import logger from '../../composables/LogObject';

export class CoordinateSearchHandler implements SearchHandler {
  type = SearchType.COORDINATE;
  
  async handleSearch(keyword: string, options: SearchBoxConfig): Promise<SearchResult[]> {
    // 坐标搜索的处理逻辑
    try {
      const formattedInput = this.formatInput(keyword);
      if (!this.validateInput(formattedInput)) {
        logger.warn(`[CoordinateSearchHandler] 无效的坐标输入: ${keyword}`);
        return [];
      }
      
      const coords = formattedInput.split(',').map(s => parseFloat(s.trim()));
      const lng = coords[0];
      const lat = coords[1];
      
      // 创建一个包含单个结果的搜索结果数组
      const result: SearchResult = {
        id: `coord-${Date.now()}`,
        name: `坐标 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
        address: `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`,
        location: {
          lng,
          lat
        },
        type: 'coordinate',
        provider: 'coordinate'
      };
      
      // 如果提供了坐标系转换，转换坐标
      if (options.projection && options.projection !== CoordSystem.WGS84) {
        try {
          // 转换为 EPSG:3857 坐标
          const epsg3857 = GcoordUtils.transform(
            { lng, lat },
            CoordSystem.WGS84,
            CoordSystem.EPSG3857
          );
          
          // 从 GeoPoint 提取经纬度
          const epsg3857Coords = GcoordUtils.toObject(epsg3857);
          
          // 添加到结果中
          result.location.epsg3857 = {
            lng: epsg3857Coords.lng,
            lat: epsg3857Coords.lat
          };
          
          logger.debug(`[CoordinateSearchHandler] 坐标转换成功: WGS84(${lng}, ${lat}) -> EPSG3857(${epsg3857Coords.lng}, ${epsg3857Coords.lat})`);
        } catch (error) {
          logger.warn(`[CoordinateSearchHandler] 坐标转换失败: ${error.message}`);
        }
      }
      
      // 记录搜索结果
      logger.debug(`[CoordinateSearchHandler] 坐标搜索结果: ${JSON.stringify(result)}`);
      
      return [result];
    } catch (error) {
      logger.error(`[CoordinateSearchHandler] 解析坐标失败: ${error.message}`);
      return [];
    }
  }
  
  validateInput(input: string): boolean {
    try {
      const coords = input.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      
      if (coords.length >= 2) {
        const lng = coords[0];
        const lat = coords[1];
        
        // 验证坐标是否有效
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  formatInput(input: string): string {
    // 尝试解析坐标字符串，支持多种格式：
    // "116.404,39.915" 或 "116.404 39.915" 或 "116.404，39.915"
    return input.trim().replace(/，/g, ',').replace(/\s+/g, ',');
  }
  
  getCacheKey(keyword: string, options: SearchOptions): string {
    // 坐标搜索的缓存键只需要包含类型和格式化后的坐标
    const formattedCoord = this.formatInput(keyword);
    return `${this.type}:${formattedCoord}`;
  }
} 