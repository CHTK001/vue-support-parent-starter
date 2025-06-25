/**
 * 布局工具函数
 */

import type { LayoutItem, LayoutConfig, LayoutTemplate } from '../types/layout';

/**
 * 生成唯一ID
 */
export function generateId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查布局项是否重叠
 */
export function isOverlapping(item1: LayoutItem, item2: LayoutItem): boolean {
  return !(
    item1.x + item1.w <= item2.x ||
    item2.x + item2.w <= item1.x ||
    item1.y + item1.h <= item2.y ||
    item2.y + item2.h <= item1.y
  );
}

/**
 * 查找布局中的重叠项
 */
export function findOverlaps(layout: LayoutItem[]): Array<{ item1: LayoutItem; item2: LayoutItem }> {
  const overlaps: Array<{ item1: LayoutItem; item2: LayoutItem }> = [];
  
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (isOverlapping(layout[i], layout[j])) {
        overlaps.push({ item1: layout[i], item2: layout[j] });
      }
    }
  }
  
  return overlaps;
}

/**
 * 查找可用位置
 */
export function findAvailablePosition(
  layout: LayoutItem[],
  width: number,
  height: number,
  colNum: number
): { x: number; y: number } {
  const occupied = new Set<string>();
  
  // 标记已占用的位置
  layout.forEach(item => {
    for (let x = item.x; x < item.x + item.w; x++) {
      for (let y = item.y; y < item.y + item.h; y++) {
        occupied.add(`${x},${y}`);
      }
    }
  });

  // 查找第一个可用位置
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - width; x++) {
      let canPlace = true;
      
      for (let dx = 0; dx < width && canPlace; dx++) {
        for (let dy = 0; dy < height && canPlace; dy++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            canPlace = false;
          }
        }
      }
      
      if (canPlace) {
        return { x, y };
      }
    }
  }
  
  return { x: 0, y: 0 };
}

/**
 * 压缩布局（移除空白行）
 */
export function compactLayout(layout: LayoutItem[]): LayoutItem[] {
  if (layout.length === 0) return layout;
  
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  const result: LayoutItem[] = [];
  
  for (const item of sorted) {
    const newItem = { ...item };
    
    // 查找可以放置的最高位置
    let targetY = 0;
    let canPlace = false;
    
    while (!canPlace) {
      canPlace = true;
      
      // 检查是否与已放置的项重叠
      for (const placedItem of result) {
        const testItem = { ...newItem, y: targetY };
        if (isOverlapping(testItem, placedItem)) {
          canPlace = false;
          targetY = Math.max(targetY, placedItem.y + placedItem.h);
          break;
        }
      }
    }
    
    newItem.y = targetY;
    result.push(newItem);
  }
  
  return result;
}

/**
 * 计算布局边界
 */
export function getLayoutBounds(layout: LayoutItem[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (layout.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  layout.forEach(item => {
    minX = Math.min(minX, item.x);
    maxX = Math.max(maxX, item.x + item.w);
    minY = Math.min(minY, item.y);
    maxY = Math.max(maxY, item.y + item.h);
  });
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * 计算布局密度
 */
export function calculateLayoutDensity(layout: LayoutItem[], colNum: number): number {
  if (layout.length === 0) return 0;
  
  const bounds = getLayoutBounds(layout);
  const totalArea = layout.reduce((sum, item) => sum + item.w * item.h, 0);
  const containerArea = colNum * bounds.height;
  
  return containerArea > 0 ? totalArea / containerArea : 0;
}

/**
 * 验证布局项
 */
export function validateLayoutItem(item: LayoutItem, colNum: number): string[] {
  const errors: string[] = [];
  
  if (!item.i) {
    errors.push('组件ID不能为空');
  }
  
  if (item.x < 0) {
    errors.push('X坐标不能小于0');
  }
  
  if (item.y < 0) {
    errors.push('Y坐标不能小于0');
  }
  
  if (item.w <= 0) {
    errors.push('宽度必须大于0');
  }
  
  if (item.h <= 0) {
    errors.push('高度必须大于0');
  }
  
  if (item.x + item.w > colNum) {
    errors.push(`组件超出布局边界（最大列数：${colNum}）`);
  }
  
  if (item.minW && item.w < item.minW) {
    errors.push(`宽度不能小于最小宽度（${item.minW}）`);
  }
  
  if (item.maxW && item.w > item.maxW) {
    errors.push(`宽度不能大于最大宽度（${item.maxW}）`);
  }
  
  if (item.minH && item.h < item.minH) {
    errors.push(`高度不能小于最小高度（${item.minH}）`);
  }
  
  if (item.maxH && item.h > item.maxH) {
    errors.push(`高度不能大于最大高度（${item.maxH}）`);
  }
  
  return errors;
}

/**
 * 验证整个布局
 */
export function validateLayout(layout: LayoutItem[], colNum: number): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检查每个布局项
  layout.forEach((item, index) => {
    const itemErrors = validateLayoutItem(item, colNum);
    itemErrors.forEach(error => {
      errors.push(`组件 ${item.i || index}: ${error}`);
    });
  });
  
  // 检查重复ID
  const ids = layout.map(item => item.i);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`发现重复的组件ID: ${duplicateIds.join(', ')}`);
  }
  
  // 检查重叠
  const overlaps = findOverlaps(layout);
  if (overlaps.length > 0) {
    errors.push(`发现 ${overlaps.length} 个组件重叠`);
  }
  
  // 检查布局密度
  const density = calculateLayoutDensity(layout, colNum);
  if (density > 0.9) {
    warnings.push('布局密度过高，可能影响性能');
  } else if (density < 0.2) {
    warnings.push('布局密度较低，可以考虑调整组件大小');
  }
  
  // 检查组件数量
  if (layout.length > 50) {
    warnings.push('组件数量较多，可能影响性能');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 克隆布局
 */
export function cloneLayout(layout: LayoutItem[]): LayoutItem[] {
  return layout.map(item => ({ ...item }));
}

/**
 * 序列化布局为JSON
 */
export function serializeLayout(layout: LayoutItem[]): string {
  return JSON.stringify(layout, null, 2);
}

/**
 * 从JSON反序列化布局
 */
export function deserializeLayout(json: string): LayoutItem[] {
  try {
    const layout = JSON.parse(json);
    if (!Array.isArray(layout)) {
      throw new Error('布局数据必须是数组');
    }
    return layout;
  } catch (error) {
    throw new Error(`布局数据格式错误: ${error.message}`);
  }
}

/**
 * 导出布局模板
 */
export function exportLayoutTemplate(template: LayoutTemplate): Blob {
  const data = JSON.stringify(template, null, 2);
  return new Blob([data], { type: 'application/json' });
}

/**
 * 导入布局模板
 */
export function importLayoutTemplate(file: File): Promise<LayoutTemplate> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const template = JSON.parse(content) as LayoutTemplate;
        
        // 验证模板格式
        if (!template.id || !template.name || !template.config) {
          throw new Error('模板格式不正确');
        }
        
        resolve(template);
      } catch (error) {
        reject(new Error(`模板导入失败: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 生成默认布局配置
 */
export function getDefaultLayoutConfig(): LayoutConfig {
  return {
    layout: [],
    colNum: 24,
    rowHeight: 30,
    margin: [10, 10],
    containerPadding: [10, 10],
    isDraggable: true,
    isResizable: true,
    isMirrored: false,
    verticalCompact: true,
    useCSSTransforms: true,
    responsive: false
  };
}

/**
 * 调整布局以适应新的列数
 */
export function adjustLayoutForColumns(layout: LayoutItem[], newColNum: number, oldColNum: number): LayoutItem[] {
  if (newColNum === oldColNum) return layout;
  
  const ratio = newColNum / oldColNum;
  
  return layout.map(item => ({
    ...item,
    x: Math.round(item.x * ratio),
    w: Math.max(1, Math.round(item.w * ratio))
  }));
}
