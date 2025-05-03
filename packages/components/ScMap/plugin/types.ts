/**
 * 迁徙图配置选项
 */
export interface MigrationOptions {
  /**
   * 是否启用3D效果
   */
  enable3D: boolean;
  
  /**
   * 是否自动开始动画
   */
  autoStart: boolean;
  
  /**
   * 是否启用动画
   */
  animation: boolean;
  
  /**
   * 动画延迟时间（毫秒）
   */
  animationDelay: number;
  
  /**
   * 动画持续时间（毫秒）
   */
  animationDuration: number;
  
  /**
   * 动画缓动效果
   */
  animationEasing: string;
  
  /**
   * 线条类型，支持 'solid', 'dashed', 'dotted'
   */
  lineType: string;
  
  /**
   * 路径效果类型，支持 'path', 'none'
   */
  pathEffect: string;
  
  /**
   * 路径效果图标，支持内置图标和自定义SVG路径
   * 内置图标: 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'plane'
   * 自定义路径以 'path://' 开头，后接SVG路径数据
   */
  pathSymbol?: string;
  
  /**
   * 路径效果图标的颜色
   * 支持颜色名称、十六进制、rgba等格式
   * 例如: 'red', '#FF0000', 'rgba(255,0,0,0.8)'
   */
  pathSymbolColor?: string;
  
  /**
   * 线条宽度
   */
  lineWidth: number;
  
  /**
   * 线条透明度
   */
  lineOpacity: number;
  
  /**
   * 符号大小
   */
  symbolSize: number;
  
  /**
   * 曲线曲率，值越大曲线越弯曲，取值范围0-1
   */
  curvature: number;
  
  /**
   * 涟漪特效配置
   */
  rippleEffect: {
    /**
     * 动画周期，秒数
     */
    period: number;
    
    /**
     * 动画中波纹的最大缩放比例
     */
    scale: number;
    
    /**
     * 波纹的绘制方式，可选 'stroke' 和 'fill'
     */
    brushType: 'stroke' | 'fill';
  };
  
  /**
   * 是否启用鼠标悬停动画
   */
  hoverAnimation: boolean;
  
  /**
   * 标签配置
   */
  label: {
    /**
     * 是否显示标签
     */
    show: boolean;
    
    /**
     * 标签位置，支持 'top', 'left', 'right', 'bottom', 'inside', 'insideLeft', 'insideRight', 'insideTop', 'insideBottom', 'insideTopLeft', 'insideTopRight', 'insideBottomLeft', 'insideBottomRight'
     */
    position: string;
    
    /**
     * 标签内容格式化器
     * 支持字符串模板和回调函数
     * 模板变量：{a}（系列名），{b}（数据名），{c}（数据值）
     */
    formatter: string;
  };
} 