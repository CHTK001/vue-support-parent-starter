/**
 * 图标工具函数
 */
import { IconMap } from '../types/icon';
import PROJECTIONS, { createCRS, getProjectionConfig, registerProjection } from './projection';
import projectionHelper from './projectionHelper';

/**
 * 根据图标名称获取SVG图标字符串
 * @param name 图标名称
 * @returns SVG图标字符串
 */
export function iconString(name: string): string {
  return IconMap[name] || '';
}

export {
  PROJECTIONS,
  createCRS,
  getProjectionConfig,
  registerProjection,
  projectionHelper
};

export default {
  iconString,
  PROJECTIONS,
  createCRS,
  getProjectionConfig,
  registerProjection,
  projectionHelper
}; 