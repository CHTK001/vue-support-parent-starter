// 区划相关HTTP接口

/**
 * 高德区划查询接口
 * @param options { key, url, keywords, subdistrict, extensions }
 * @returns Promise<districts[]>
 */
export async function fetchGaodeDistrictTree({
  key,
  url = 'https://restapi.amap.com/v3/config/district',
  keywords = '',
  subdistrict = 2,
  extensions = 'base'
}: {
  key: string;
  url?: string;
  keywords?: string;
  subdistrict?: number;
  extensions?: 'base' | 'all';
}) {
  if (!key) throw new Error('高德区划接口请求必须提供key');
  const apiUrl = `${url}?key=${key}&keywords=${keywords}&subdistrict=${subdistrict}&extensions=${extensions}`;
  const res = await fetch(apiUrl);
  const data = await res.json();
  if (data.status === '1') {
    return data.districts;
  }
  throw new Error(data.info || '高德区划接口请求失败');
}

/**
 * 高德边界查询接口
 * @param options { key, adcode, url }
 * @returns Promise<{ polyline: string, ... }>
 */
export async function fetchGaodeBoundary({
  key,
  adcode,
  url = 'https://restapi.amap.com/v3/config/district'
}: {
  key: string;
  adcode: string;
  url?: string;
}) {
  const districts = await fetchGaodeDistrictTree({
    key,
    url,
    keywords: adcode,
    subdistrict: 1,
    extensions: 'all'
  });
  if (districts && districts[0]) {
    return districts[0]; // 包含 polyline 字段
  }
  throw new Error('未查询到边界数据');
}

/**
 * 百度边界查询接口
 * @param options { key, adcode, url }
 * @returns Promise<{ polyline: string, ... }>
 */
export async function fetchBaiduBoundary({
  key,
  adcode,
  url = 'https://api.map.baidu.com/api_district/v3/district'
}: {
  key: string;
  adcode: string;
  url?: string;
}) {
  try {
    const apiUrl = `${url}?ak=${key}&id=${adcode}&output=json&extensions_pol=1`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (data.status === 0 && data.result && data.result.length > 0) {
      // 百度地图返回的数据结构不同，需要做转换以保持与高德格式一致
      const district = data.result[0];
      
      // 构造类似高德数据格式的结果，保持polyline字段
      return {
        adcode: district.id,
        name: district.name,
        level: district.level,
        polyline: district.polyline || '', // 注意：这里的坐标格式需要在BaiduConverter中处理
        center: district.center || {}
      };
    }
    throw new Error(data.message || '百度地图区划接口请求失败');
  } catch (error) {
    console.error('百度地图区划接口请求失败:', error);
    throw error;
  }
}

/**
 * 天地图边界查询接口
 * @param options { key, adcode, url }
 * @returns Promise<{ polyline: string, ... }>
 */
export async function fetchTiandituBoundary({
  key,
  adcode,
  url = 'https://api.tianditu.gov.cn/administrative'
}: {
  key: string;
  adcode: string;
  url?: string;
}) {
  try {
    const apiUrl = `${url}?postStr={"searchWord":"${adcode}","searchType":0,"needSubInfo":false,"needAll":true,"needPolygon":true,"needPre":false}&tk=${key}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (data.status === 0 && data.data && data.data.length > 0) {
      // 天地图返回的数据结构与高德不同，需要转换
      const district = data.data[0];
      
      // 天地图返回的是GeoJSON格式的多边形，需要转换为类似高德的polyline格式
      let polyline = '';
      if (district.geometry && district.geometry.coordinates) {
        // 将GeoJSON格式转换为polyline字符串
        polyline = convertGeoJSONToPolyline(district.geometry);
      }
      
      // 构造类似高德数据格式的结果
      return {
        adcode: district.code,
        name: district.name,
        level: district.level,
        polyline: polyline,
        center: district.center || {}
      };
    }
    throw new Error(data.message || '天地图区划接口请求失败');
  } catch (error) {
    console.error('天地图区划接口请求失败:', error);
    throw error;
  }
}

/**
 * 将GeoJSON格式转换为polyline字符串
 * @param geometry GeoJSON几何对象
 * @returns polyline格式字符串
 */
function convertGeoJSONToPolyline(geometry: any): string {
  try {
    if (!geometry || !geometry.coordinates) {
      return '';
    }
    
    let result = '';
    // 处理不同类型的几何对象
    if (geometry.type === 'Polygon') {
      // 单个多边形
      geometry.coordinates.forEach((ring: number[][], index: number) => {
        const ringStr = ring.map(coord => `${coord[0]},${coord[1]}`).join(';');
        result += (index > 0 ? '|' : '') + ringStr;
      });
    } else if (geometry.type === 'MultiPolygon') {
      // 多个多边形
      geometry.coordinates.forEach((polygon: number[][][], pIndex: number) => {
        polygon.forEach((ring: number[][], rIndex: number) => {
          const ringStr = ring.map(coord => `${coord[0]},${coord[1]}`).join(';');
          result += (pIndex > 0 || rIndex > 0 ? '|' : '') + ringStr;
        });
      });
    }
    
    return result;
  } catch (error) {
    console.error('转换GeoJSON到polyline失败:', error);
    return '';
  }
}

/**
 * 获取指定父级行政区的下级行政区
 * @param options 请求参数 { key, keywords, subdistrict, extensions, url }
 * @returns Promise<{ districts: Array<any> }>
 */
export async function fetchGaodeDistrictsByParentId({
  key,
  keywords, // adcode或名称
  subdistrict = 1,
  extensions = 'base',
  url = 'https://restapi.amap.com/v3/config/district'
}: {
  key: string;
  keywords: string;
  subdistrict?: number; 
  extensions?: 'base' | 'all';
  url?: string;
}) {
  try {
    const districts = await fetchGaodeDistrictTree({
      key,
      url,
      keywords,
      subdistrict,
      extensions
    });
    
    if (districts && districts.length > 0) {
      return districts[0];
    }
    return null;
  } catch (error) {
    console.error('获取下级行政区划失败:', error);
    throw error;
  }
} 