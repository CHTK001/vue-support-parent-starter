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

export interface RegionProps {
  modelValue?: string[];
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
}

export interface RegionEmits {
  (e: 'update:modelValue', value: string[]): void;
  (e: 'change', value: string[]): void;
} 