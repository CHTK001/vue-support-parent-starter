export interface RegionData {
  code: string;
  name: string;
  parentCode: string;
  path: string;
  pathName: string;
  pinyin: string;
  licensePlate: string;
  abbreviation: string;
  level: number;
  children?: RegionData[];
}

/** 数据源类型 */
export type DataSourceType = 'custom' | 'element-china-area-data';

export interface RegionProps {
  modelValue?: string | string[] | string[][];
  /** 数据源类型，默认 custom 自定义 */
  dataSource?: DataSourceType;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  filterable?: boolean;
  size?: 'large' | 'default' | 'small';
  showAllLevels?: boolean;
  separator?: string;
  data?: RegionData[];
  provinceCode?: string;
  defaultProvince?: string;
  /** 是否支持任意级选择 */
  checkStrictly?: boolean;
  /** 是否只显示选择的编码 */
  showCodeOnly?: boolean;
  /** 是否在选项中显示编码（文字下方小字灰色） */
  showCode?: boolean;
  /** 是否支持多选 */
  multiple?: boolean;
  /** 多选时是否折叠标签 */
  collapseTags?: boolean;
  /** 多选时最多显示的标签数 */
  maxCollapseTags?: number;
  /** 是否返回完整路径，默认 true；设为 false 则只返回最后一级的值 */
  emitPath?: boolean;
}

export interface RegionEmits {
  (e: 'update:modelValue', value: string | string[] | string[][]): void;
  (e: 'change', value: string | string[] | string[][]): void;
}