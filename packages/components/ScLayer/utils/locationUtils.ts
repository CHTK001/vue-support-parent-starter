import type { GeoPoint } from "../types";
import axios from 'axios';
import logger from '../composables/LogObject';

//获取当前位置 
export const getCurrentPoint = async (): Promise<GeoPoint> => {
  try {
    // 获取当前位置
    return new Promise<GeoPoint>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          resolve({
            lat: latitude,
            lng: longitude 
          });
        },
        (error) => {
          console.error(`Error Code: ${error.code}, Message: ${error.message}`);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
    });
  } catch (error) {
    console.error('获取当前位置失败:', error);
    throw error;
  }
};

/**
 * 根据坐标获取城市或区划编码
 * @param location 坐标点 {lng, lat} 或 [lng, lat]
 * @returns 城市编码或区划编码
 */
export const getLocationCityCode = async (location: GeoPoint): Promise<{
  cityCode: string;
  adcode: string;
  province: string;
  city: string;
  district: string;
}> => {
  try {
    // 处理不同格式的坐标点
    const lng = Array.isArray(location) ? location[0] : location.lng;
    const lat = Array.isArray(location) ? location[1] : location.lat;
    
    logger.debug(`[LocationUtils] 开始获取坐标 (${lng}, ${lat}) 的城市编码`);
    
    // BigDataCloud 逆地理编码API
    const url = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
    
    // 发送请求
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lng,
        localityLanguage: 'zh' // 使用中文结果
      }
    });
    
    const data = response.data;
    
    if (data) {
      logger.debug(`[LocationUtils] 获取城市编码成功: ${data.city}`);
      
      // 从FIPS中提取区划编码
      const adcode = data.fips?.place || '';
      // 从FIPS中提取城市编码
      const cityCode = data.fips?.county || '';
      
      return {
        cityCode: cityCode || '',
        adcode: adcode || '',
        province: data.principalSubdivision || '',
        city: data.city || '',
        district: data.locality || ''
      };
    }
    
    throw new Error('获取城市编码失败');
  } catch (error) {
    logger.error('[LocationUtils] 获取城市编码失败:', error);
    // 返回空值，避免阻塞后续流程
    return {
      cityCode: '',
      adcode: '',
      province: '',
      city: '',
      district: ''
    };
  }
};
