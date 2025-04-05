/**
 * 视频清晰度过滤选项
 */
export const qualityFilterOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '4K',
    value: '4K',
  },
  {
    label: '1080P',
    value: '1080P',
  },
  {
    label: '720P',
    value: '720P',
  },
  {
    label: '标清',
    value: '标清',
  },
];

/**
 * 视频下载类型映射
 */
export const downloadTypeIconMap = {
  磁力资源: 'ep:magnet',
  网盘资源: 'ep:folder',
  在线资源: 'ep:video-play',
  百度网盘: 'ep:folder',
  阿里云盘: 'ep:folder',
  天翼网盘: 'ep:folder',
  微云: 'ep:folder',
  '115网盘': 'ep:folder',
  迅雷网盘: 'ep:folder',
  夸克网盘: 'ep:folder',
};

/**
 * 获取下载资源图标
 * @param type 资源类型
 * @returns 图标名称
 */
export const getDownloadIcon = (type: string): string => {
  return downloadTypeIconMap[type] || 'ep:download';
};

/**
 * 下载字段映射
 */
export const downloadFieldMap = {
  name: 'videoDownloadName',
  url: 'videoDownloadUrl',
  type: 'videoDownloadType',
  quality: 'videoDownloadQuality',
  size: 'videoDownloadSize',
  count: 'videoDownloadCount',
  magnetic: 'videoDownloadMagnetic',
  status: 'videoDownloadStatus',
};

/**
 * 获取下载字段
 * @param download 下载对象
 * @param field 字段名
 * @returns 字段值
 */
export const getDownloadField = (download: any, field: string): any => {
  const mappedField = downloadFieldMap[field];
  return mappedField ? download[mappedField] : null;
};

/**
 * 解析磁力链接
 * @param downloadList 下载列表
 * @returns 磁力链接列表
 */
export const parseMagnetLinks = (downloadList: any[]): any[] => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => it.videoDownloadType === '磁力资源');
};

/**
 * 解析在线播放链接
 * @param downloadList 下载列表
 * @returns 在线播放链接列表
 */
export const parseOnlineLinks = (downloadList: any[]): any[] => {
  if (!downloadList || !Array.isArray(downloadList)) return [];
  return downloadList.filter((it) => it.videoDownloadType === '在线资源');
}; 