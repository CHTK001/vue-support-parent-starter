/**
 * 默认配置文件 - 包含地图组件常用的默认值
 */

/**
 * 标记点默认大小 [宽度, 高度]
 */
export const DEFAULT_MARKER_SIZE: [number, number] = [18, 25];

/**
 * 默认的聚合标记最小值
 */
export const DEFAULT_MIN_CLUSTER_SIZE = 2;

/**
 * 默认的图形样式
 */
export const DEFAULT_SHAPE_STYLES = {
  stroke: {
    color: '#1890ff', // 蓝色边框
    width: 2,         // 边框宽度
    opacity: 0.8      // 边框透明度
  },
  fill: {
    color: '#1890ff', // 蓝色填充
    opacity: 0.2      // 填充透明度
  }
};

/**
 * 默认的测距线样式
 */
export const DEFAULT_DISTANCE_LINE_STYLE = {
  strokeColor: '#1890ff',   // 线条颜色
  strokeWeight: 2,          // 线条宽度
  strokeOpacity: 0.8,       // 线条透明度
  strokeStyle: 'solid',     // 线条样式
  strokeDasharray: [10, 5], // 虚线样式
  lineJoin: 'round'         // 折线拐点样式
};

/**
 * 默认的点聚合配置
 */
export const DEFAULT_CLUSTER_OPTIONS = {
  gridSize: 60,            // 网格大小
  minClusterSize: 2,       // 最小聚合数量
  maxZoom: 16,             // 最大聚合层级
  averageCenter: true,     // 聚合点取平均值
  styles: [                // 聚合样式
    {
      backgroundColor: '#1890ff',
      size: 40,
      textColor: '#ffffff',
      textSize: 12
    },
    {
      backgroundColor: '#52c41a',
      size: 50,
      textColor: '#ffffff',
      textSize: 14
    },
    {
      backgroundColor: '#faad14',
      size: 60,
      textColor: '#ffffff',
      textSize: 16
    },
    {
      backgroundColor: '#f5222d',
      size: 70,
      textColor: '#ffffff',
      textSize: 18
    }
  ]
};

/**
 * 默认的图标组映射
 */
export const DEFAULT_MARKER_GROUP_ICONS = {
  'default': '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#1890FF" stroke="white" stroke-width="1"/><circle cx="12" cy="8" r="3" fill="white"/></svg>',
  'warning': '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#FAAD14" stroke="white" stroke-width="1"/><path d="M12,5 L12,11" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="1" fill="white"/></svg>',
  'danger': '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#F5222D" stroke="white" stroke-width="1"/><path d="M8,8 L16,8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
  'info': '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,22 L12,22 C12,22 20,15 20,8 C20,4 16,1 12,1 C8,1 4,4 4,8 C4,15 12,22 12,22 Z" fill="#13C2C2" stroke="white" stroke-width="1"/><circle cx="12" cy="6" r="1" fill="white"/><path d="M12,9 L12,14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
}; 