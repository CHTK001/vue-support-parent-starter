/**
 * ScThree 与地图组件（ScMap/ScLayer）的集成工具
 * 支持在地图上显示 3D 模型
 * @author AI
 * @date 2025-01-XX
 */
import * as THREE from "three";
import type { Model3DOptions } from "@repo/components/ScLayer/composables/CesiumModelObject";

/**
 * 地理坐标转换为 Three.js 坐标
 * @param longitude 经度
 * @param latitude 纬度
 * @param height 高度（米）
 * @param centerLon 中心经度（用于局部坐标系）
 * @param centerLat 中心纬度（用于局部坐标系）
 * @returns Three.js 坐标 [x, y, z]
 */
export function geoToThree(
  longitude: number,
  latitude: number,
  height: number = 0,
  centerLon: number = 0,
  centerLat: number = 0
): [number, number, number] {
  // 简化的地理坐标转换（适用于小范围）
  // 1 度经度 ≈ 111320 * cos(latitude) 米
  // 1 度纬度 ≈ 111320 米
  const latRad = (latitude * Math.PI) / 180;
  const lonDiff = longitude - centerLon;
  const latDiff = latitude - centerLat;
  
  const x = lonDiff * 111320 * Math.cos(latRad);
  const y = height;
  const z = -latDiff * 111320; // 注意：Three.js 中 z 轴向下
  
  return [x, y, z];
}

/**
 * Three.js 坐标转换为地理坐标
 * @param x Three.js X 坐标
 * @param y Three.js Y 坐标（高度）
 * @param z Three.js Z 坐标
 * @param centerLon 中心经度
 * @param centerLat 中心纬度
 * @returns 地理坐标 { longitude, latitude, height }
 */
export function threeToGeo(
  x: number,
  y: number,
  z: number,
  centerLon: number = 0,
  centerLat: number = 0
): { longitude: number; latitude: number; height: number } {
  const latRad = (centerLat * Math.PI) / 180;
  const lonDiff = x / (111320 * Math.cos(latRad));
  const latDiff = -z / 111320; // 注意：Three.js 中 z 轴向下
  
  return {
    longitude: centerLon + lonDiff,
    latitude: centerLat + latDiff,
    height: y
  };
}

/**
 * 将 ScThree 模型配置转换为 ScLayer 的 Model3DOptions
 * @param modelUrl 模型 URL
 * @param position 地理坐标位置 [longitude, latitude, height]
 * @param scale 缩放 [x, y, z] 或统一值
 * @param rotation 旋转 [heading, pitch, roll]（度）
 * @returns ScLayer Model3DOptions
 */
export function convertToCesiumModelOptions(
  modelUrl: string,
  position: [number, number, number],
  scale: [number, number, number] | number = 1,
  rotation: [number, number, number] = [0, 0, 0]
): Model3DOptions {
  const scaleObj = Array.isArray(scale)
    ? { x: scale[0], y: scale[1], z: scale[2] }
    : { x: scale, y: scale, z: scale };

  return {
    id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: modelUrl,
    position: {
      longitude: position[0],
      latitude: position[1],
      height: position[2] || 0
    },
    scale: scaleObj,
    rotation: {
      heading: rotation[0],
      pitch: rotation[1],
      roll: rotation[2]
    }
  };
}

/**
 * 创建 Three.js 场景中的地理参考模型
 * @param scene Three.js 场景
 * @param modelUrl 模型 URL
 * @param geoPosition 地理坐标 [longitude, latitude, height]
 * @param centerGeo 中心地理坐标 [longitude, latitude]
 * @param scale 缩放
 * @param rotation 旋转（弧度）
 * @returns 模型对象
 */
export async function createGeoReferencedModel(
  scene: THREE.Scene,
  modelUrl: string,
  geoPosition: [number, number, number],
  centerGeo: [number, number] = [0, 0],
  scale: [number, number, number] | number = 1,
  rotation: [number, number, number] = [0, 0, 0]
): Promise<THREE.Object3D | null> {
  try {
    // 将地理坐标转换为 Three.js 坐标
    const threePos = geoToThree(
      geoPosition[0],
      geoPosition[1],
      geoPosition[2] || 0,
      centerGeo[0],
      centerGeo[1]
    );

    // 这里需要根据模型格式加载，暂时返回 null
    // 实际使用时应该在 ScThree 组件中调用 loadModels
    return null;
  } catch (error) {
    console.error("[MapIntegration] 创建地理参考模型失败:", error);
    return null;
  }
}

