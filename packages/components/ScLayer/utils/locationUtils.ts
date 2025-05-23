import type { Coordinate } from "./GcoordUtils";

//获取当前位置 
export const getCurrentPoint = async (): Promise<Coordinate> => {
  try {
    // 获取当前位置
    return new Promise<Coordinate>((resolve, reject) => {
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
