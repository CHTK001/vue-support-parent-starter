interface PanType {
  value: string;
  label: string;
  icon: string;
}

/**
 * 网盘类型数据
 */
export const panTypes: PanType[] = [
  {
    value: '百度网盘',
    label: '百度网盘',
    icon: 'ep:folder',
  },
  {
    value: '阿里云盘',
    label: '阿里云盘',
    icon: 'ep:folder',
  },
  {
    value: '天翼网盘',
    label: '天翼网盘',
    icon: 'ep:folder',
  },
  {
    value: '微云',
    label: '微云',
    icon: 'ep:folder',
  },
  {
    value: '115网盘',
    label: '115网盘',
    icon: 'ep:folder',
  },
  {
    value: '迅雷网盘',
    label: '迅雷网盘',
    icon: 'ep:folder',
  },
  {
    value: '夸克网盘',
    label: '夸克网盘',
    icon: 'ep:folder',
  },
];

/**
 * 获取网盘图标
 * @param type 网盘类型
 * @returns 图标名称
 */
export const getPanIcon = (type: string): string => {
  const pan = panTypes.find(item => item.value === type);
  return pan?.icon || 'ep:folder';
};

/**
 * 解析网盘链接
 * @param downloadList 下载列表
 * @returns 网盘链接列表
 */
export const parsePanLinks = (downloadList: any[]): any[] => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((item) => 
    ['网盘资源', ...panTypes.map(type => type.value)].includes(item.videoDownloadType)
  );
};

export default panTypes; 