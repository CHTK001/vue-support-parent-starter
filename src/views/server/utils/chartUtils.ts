/**
 * 图表工具函数
 */

import type { ChartConfig, ComponentType } from '../types/component';

/**
 * 获取默认图表配置
 */
export function getDefaultChartConfig(type: ComponentType): ChartConfig {
  switch (type) {
    case 'card':
      return {
        card: {
          showIcon: true,
          icon: 'ri:bar-chart-line',
          iconColor: '#409eff',
          valueFormat: '0,0',
          unit: '',
          trend: {
            show: true,
            type: 'up',
            value: 0,
            format: '0.0%'
          },
          thresholds: []
        }
      };
      
    case 'gauge':
      return {
        gauge: {
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '75%',
          startAngle: 225,
          endAngle: -45,
          clockwise: true,
          axisLine: {
            lineStyle: {
              width: 30,
              color: [
                [0.3, '#67e0e3'],
                [0.7, '#37a2da'],
                [1, '#fd666d']
              ]
            }
          },
          pointer: {
            length: '60%',
            width: 6
          },
          detail: {
            formatter: '{value}%',
            fontSize: 20,
            color: '#333'
          }
        }
      };
      
    case 'line':
      return {
        title: {
          show: true,
          text: '',
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        },
        legend: {
          show: true,
          type: 'plain',
          orient: 'horizontal',
          left: 'center',
          top: 40
        },
        tooltip: {
          show: true,
          trigger: 'axis'
        },
        xAxis: {
          show: true,
          type: 'time',
          name: '',
          axisLabel: {
            show: true,
            formatter: '{HH}:{mm}',
            rotate: 0
          }
        },
        yAxis: {
          show: true,
          type: 'value',
          name: '',
          axisLabel: {
            show: true,
            formatter: '{value}'
          }
        },
        series: [{
          name: '数据',
          type: 'line',
          smooth: true,
          areaStyle: null,
          lineStyle: {
            width: 2
          },
          label: {
            show: false,
            position: 'top'
          }
        }]
      };
      
    case 'bar':
      return {
        title: {
          show: true,
          text: '',
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        },
        legend: {
          show: true,
          type: 'plain',
          orient: 'horizontal',
          left: 'center',
          top: 40
        },
        tooltip: {
          show: true,
          trigger: 'axis'
        },
        xAxis: {
          show: true,
          type: 'category',
          name: '',
          axisLabel: {
            show: true,
            rotate: 0
          }
        },
        yAxis: {
          show: true,
          type: 'value',
          name: '',
          axisLabel: {
            show: true,
            formatter: '{value}'
          }
        },
        series: [{
          name: '数据',
          type: 'bar',
          label: {
            show: false,
            position: 'top'
          }
        }]
      };
      
    case 'pie':
      return {
        title: {
          show: true,
          text: '',
          textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        },
        legend: {
          show: true,
          type: 'plain',
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        tooltip: {
          show: true,
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '数据',
          type: 'pie',
          radius: '50%',
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%'
          }
        }]
      };
      
    case 'table':
      return {
        table: {
          columns: [
            { prop: 'name', label: '名称', width: 120 },
            { prop: 'value', label: '值', width: 100 },
            { prop: 'status', label: '状态', width: 80 }
          ],
          pagination: {
            enabled: true,
            pageSize: 10
          },
          stripe: true,
          border: true,
          size: 'default',
          maxHeight: 400
        }
      };
      
    default:
      return {};
  }
}

/**
 * 合并图表配置
 */
export function mergeChartConfig(defaultConfig: ChartConfig, userConfig: ChartConfig): ChartConfig {
  return deepMerge(defaultConfig, userConfig);
}

/**
 * 深度合并对象
 */
function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * 判断是否为对象
 */
function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * 格式化数值
 */
export function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) return '-';
  
  if (!format) return String(value);
  
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  switch (format) {
    case '0,0':
      return num.toLocaleString();
    case '0.0':
      return num.toFixed(1);
    case '0.00':
      return num.toFixed(2);
    case '0.0%':
      return (num * 100).toFixed(1) + '%';
    case '0.00%':
      return (num * 100).toFixed(2) + '%';
    case '0%':
      return Math.round(num * 100) + '%';
    case '0b':
      return formatBytes(num);
    case '0.0b':
      return formatBytes(num, 1);
    default:
      return String(value);
  }
}

/**
 * 格式化字节数
 */
export function formatBytes(bytes: number, decimals = 0): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 生成颜色调色板
 */
export function generateColorPalette(count: number): string[] {
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#8085e9',
    '#f6bd16', '#e86452', '#6ca2ea', '#ba53a9', '#78d3f8'
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // 如果需要更多颜色，生成渐变色
  const result = [...colors];
  const baseColors = colors.slice(0, 5);
  
  while (result.length < count) {
    for (const baseColor of baseColors) {
      if (result.length >= count) break;
      result.push(adjustBrightness(baseColor, Math.random() * 0.4 - 0.2));
    }
  }
  
  return result.slice(0, count);
}

/**
 * 调整颜色亮度
 */
function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * amount)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * amount)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * amount)));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * 获取趋势图标
 */
export function getTrendIcon(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return 'ri:arrow-up-line';
    case 'down':
      return 'ri:arrow-down-line';
    case 'flat':
      return 'ri:subtract-line';
    default:
      return 'ri:subtract-line';
  }
}

/**
 * 获取趋势颜色
 */
export function getTrendColor(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return '#67c23a';
    case 'down':
      return '#f56c6c';
    case 'flat':
      return '#909399';
    default:
      return '#909399';
  }
}
