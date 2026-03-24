import type { RegionData, DataSourceType } from './types';
import { regionData as customRegionData } from './data';

/**
 * element-china-area-data 的数据项类型
 */
interface ElementChinaAreaItem {
  value: string;
  label: string;
  children?: ElementChinaAreaItem[];
}

/**
 * 标准编码长度（12位）
 */
const STANDARD_CODE_LENGTH = 12;

/**
 * 将编码补齐到标准长度（后面补0）
 */
function normalizeCode(code: string): string {
  if (code.length >= STANDARD_CODE_LENGTH) {
    return code;
  }
  return code.padEnd(STANDARD_CODE_LENGTH, '0');
}

/**
 * 将 element-china-area-data 格式转换为 RegionData 格式
 */
function convertElementChinaAreaData(
  data: ElementChinaAreaItem[],
  parentCode: string = '0',
  parentPath: string = '0',
  parentPathName: string = '',
  level: number = 1
): RegionData[] {
  return data.map(item => {
    // 将编码补齐到12位
    const normalizedCode = normalizeCode(item.value);
    const path = parentPath ? `${parentPath},${normalizedCode}` : `0,${normalizedCode}`;
    const pathName = parentPathName ? `${parentPathName}-${item.label}` : item.label;
    
    const regionItem: RegionData = {
      code: normalizedCode,
      name: item.label,
      parentCode,
      path,
      pathName,
      pinyin: '',
      licensePlate: '',
      abbreviation: '',
      level
    };
    
    if (item.children && item.children.length > 0) {
      regionItem.children = convertElementChinaAreaData(
        item.children,
        normalizedCode,
        path,
        pathName,
        level + 1
      );
    }
    
    return regionItem;
  });
}

/**
 * 缓存转换后的数据
 */
let elementChinaAreaDataCache: RegionData[] | null = null;

/**
 * 获取 element-china-area-data 数据
 */
async function getElementChinaAreaData(): Promise<RegionData[]> {
  if (elementChinaAreaDataCache) {
    return elementChinaAreaDataCache;
  }
  
  try {
    // 动态导入 element-china-area-data
    const { regionData } = await import('element-china-area-data');
    elementChinaAreaDataCache = convertElementChinaAreaData(regionData as ElementChinaAreaItem[]);
    return elementChinaAreaDataCache;
  } catch (error) {
    console.warn('[ScRegion] element-china-area-data 未安装，请运行: npm install element-china-area-data');
    return [];
  }
}

/**
 * 根据数据源类型获取地区数据
 */
export async function getRegionDataBySource(
  dataSource: DataSourceType,
  customData?: RegionData[]
): Promise<RegionData[]> {
  switch (dataSource) {
    case 'element-china-area-data':
      return await getElementChinaAreaData();
    case 'custom':
    default:
      return customData || customRegionData;
  }
}

/**
 * 同步获取数据（用于初始化）
 */
export function getRegionDataBySourceSync(
  dataSource: DataSourceType,
  customData?: RegionData[]
): RegionData[] {
  if (dataSource === 'element-china-area-data' && elementChinaAreaDataCache) {
    return elementChinaAreaDataCache;
  }
  return customData || customRegionData;
}

/**
 * 清除缓存
 */
export function clearDataSourceCache() {
  elementChinaAreaDataCache = null;
}
