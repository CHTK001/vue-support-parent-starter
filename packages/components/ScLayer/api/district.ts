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