declare module 'element-china-area-data' {
  interface AreaItem {
    value: string;
    label: string;
    children?: AreaItem[];
  }

  /** 省市区三级联动数据 */
  export const regionData: AreaItem[];
  
  /** 省市二级联动数据 */
  export const provinceAndCityData: AreaItem[];
  
  /** 编码转文字映射 */
  export const codeToText: Record<string, string>;
  
  /** 省市区纯文字数组 */
  export const pcaTextArr: string[][];
  
  /** 省市纯文字数组 */
  export const pcTextArr: string[][];
}
