import type { RegionData } from './types';

// 示例数据，实际使用时需要替换为完整的数据
export const regionData: RegionData[] = [
  {
    code: '110000000000',
    name: '北京市',
    parentCode: '0',
    path: '0,110000000000',
    pathName: '北京市',
    pinyin: 'beijing',
    licensePlate: '京',
    abbreviation: 'BJ',
    level: 1,
    children: [
      {
        code: '110100000000',
        name: '市辖区',
        parentCode: '110000000000',
        path: '0,110000000000,110100000000',
        pathName: '北京市-市辖区',
        pinyin: 'shixiaqu',
        licensePlate: '',
        abbreviation: 'SXQ',
        level: 2,
        children: [
          {
            code: '110101000000',
            name: '东城区',
            parentCode: '110100000000',
            path: '0,110000000000,110100000000,110101000000',
            pathName: '北京市-市辖区-东城区',
            pinyin: 'dongcheng',
            licensePlate: '',
            abbreviation: 'DC',
            level: 3
          },
          {
            code: '110102000000',
            name: '西城区',
            parentCode: '110100000000',
            path: '0,110000000000,110100000000,110102000000',
            pathName: '北京市-市辖区-西城区',
            pinyin: 'xicheng',
            licensePlate: '',
            abbreviation: 'XC',
            level: 3
          }
        ]
      }
    ]
  },
  {
    code: '120000000000',
    name: '天津市',
    parentCode: '0',
    path: '0,120000000000',
    pathName: '天津市',
    pinyin: 'tianjin',
    licensePlate: '津',
    abbreviation: 'TJ',
    level: 1,
    children: [
      {
        code: '120100000000',
        name: '市辖区',
        parentCode: '120000000000',
        path: '0,120000000000,120100000000',
        pathName: '天津市-市辖区',
        pinyin: 'shixiaqu',
        licensePlate: '',
        abbreviation: 'SXQ',
        level: 2,
        children: [
          {
            code: '120101000000',
            name: '和平区',
            parentCode: '120100000000',
            path: '0,120000000000,120100000000,120101000000',
            pathName: '天津市-市辖区-和平区',
            pinyin: 'heping',
            licensePlate: '',
            abbreviation: 'HP',
            level: 3
          },
          {
            code: '120102000000',
            name: '河东区',
            parentCode: '120100000000',
            path: '0,120000000000,120100000000,120102000000',
            pathName: '天津市-市辖区-河东区',
            pinyin: 'hedong',
            licensePlate: '',
            abbreviation: 'HD',
            level: 3
          }
        ]
      }
    ]
  }
]; 