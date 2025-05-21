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
    subdistrict: 0,
    extensions: 'all'
  });
  if (districts && districts[0]) {
    return districts[0]; // 包含 polyline 字段
  }
  throw new Error('未查询到边界数据');
} 