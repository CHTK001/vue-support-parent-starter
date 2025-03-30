import { http, type ReturnResult } from "@repo/utils";
import { VideoInfo, videoTypes, videoPlatforms, videoHotKeywords, videoList } from './mockData';

// 定义视频搜索结果接口
interface MonitorVideoResult {
  monitorVideoId: string;
  monitorVideoTitle: string;
  monitorVideoPlatform: string;
  monitorVideoThumbnail: string;
  monitorVideoUrl: string;
  monitorVideoViews: number;
  monitorVideoDuration: string;
  monitorVideoPublishDate: string;
  monitorVideoType: string;
  monitorVideoSize?: string;
  monitorVideoResolution?: string;
  monitorVideoAuthor?: string;
  monitorVideoDescription?: string;
  monitorVideoDownloadUrl?: string;
}

// 通用响应接口
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  success: boolean;
}

// 搜索参数接口
interface VideoSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  selectedType?: string;
  platformId?: string;
}

// 搜索结果接口
interface VideoSearchResult {
  data: VideoInfo[];
  total: number;
}

// 定义视频类型接口
interface VideoType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 定义视频平台接口
interface VideoPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 获取视频类型列表
 */
export const fetchVideoTypes = async (): Promise<ApiResponse<typeof videoTypes>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoTypes,
    success: true
  };
};

/**
 * 获取视频平台列表
 */
export const fetchVideoPlatforms = async (): Promise<ApiResponse<typeof videoPlatforms>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoPlatforms,
    success: true
  };
};

/**
 * 获取热门搜索关键词
 */
export const fetchHotKeywords = async (): Promise<ApiResponse<typeof videoHotKeywords>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoHotKeywords,
    success: true
  };
};

/**
 * 视频搜索接口
 * @param params 搜索参数
 */
export const fetchVideoSearch = async (params: VideoSearchParams): Promise<ApiResponse<VideoSearchResult>> => {
  await delay(800);
  
  let filteredVideos = [...videoList];
  
  // 关键词过滤
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredVideos = filteredVideos.filter(video => 
      video.monitorVideoTitle.toLowerCase().includes(keyword) || 
      video.monitorVideoDescription.toLowerCase().includes(keyword) ||
      video.monitorVideoAuthor.toLowerCase().includes(keyword)
    );
  }
  
  // 类型过滤
  if (params.selectedType && params.selectedType !== 'all') {
    filteredVideos = filteredVideos.filter(video => 
      video.monitorVideoType === videoTypes.find(t => t.videoId === params.selectedType)?.videoName
    );
  }
  
  // 平台过滤
  if (params.platformId && params.platformId !== 'all') {
    filteredVideos = filteredVideos.filter(video => 
      video.monitorVideoPlatform === videoPlatforms.find(p => p.videoId === params.platformId)?.videoName
    );
  }
  
  // 计算总数
  const total = filteredVideos.length;
  
  // 分页
  if (params.page && params.pageSize) {
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    filteredVideos = filteredVideos.slice(start, end);
  }
  
  return {
    code: '00000',
    message: '搜索成功',
    data: {
      data: filteredVideos,
      total
    },
    success: true
  };
};

/**
 * 生成模拟视频搜索结果（保留此函数以备将来使用）
 * @param keyword 搜索关键词
 * @param count 结果数量
 * @param type 视频类型
 * @param platform 视频平台
 * @returns 模拟的视频搜索结果数组
 */
function generateMockVideoResults(keyword: string, count: number, type: string = 'all', platform: string = 'all'): MonitorVideoResult[] {
  const mockResults: MonitorVideoResult[] = [];
  const platforms = ["哔哩哔哩", "腾讯视频", "爱奇艺", "优酷", "芒果TV", "抖音"];
  const types = ["电影", "电视剧", "综艺", "动漫", "纪录片", "短视频"];
  const resolutions = ["720p", "1080p", "4K", "8K", "标清", "高清"];
  const sizes = ["100MB", "500MB", "1.2GB", "2.5GB", "800MB", "300MB"];
  const authors = ["官方账号", "用户分享", "专业创作者", "影视工作室", "自媒体", "爱好者"];

  for (let i = 0; i < count; i++) {
    // 根据筛选条件过滤
    let selectedPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    let selectedType = types[Math.floor(Math.random() * types.length)];
    
    // 如果指定了平台且不是"all"，则使用指定平台
    if (platform !== 'all') {
      const platformMap: {[key: string]: string} = {
        'bilibili': '哔哩哔哩',
        'tencent': '腾讯视频',
        'iqiyi': '爱奇艺',
        'youku': '优酷',
        'mgtv': '芒果TV',
        'douyin': '抖音'
      };
      if (platformMap[platform]) {
        selectedPlatform = platformMap[platform];
      }
    }
    
    // 如果指定了类型且不是"all"，则使用指定类型
    if (type !== 'all') {
      const typeMap: {[key: string]: string} = {
        'movie': '电影',
        'tv': '电视剧',
        'variety': '综艺',
        'anime': '动漫',
        'documentary': '纪录片',
        'short': '短视频',
        'music': '音乐MV'
      };
      if (typeMap[type]) {
        selectedType = typeMap[type];
      }
    }

    const views = Math.floor(Math.random() * 10000000);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const minutes = Math.floor(Math.random() * 120);
    const seconds = Math.floor(Math.random() * 60).toString().padStart(2, "0");
    const duration = `${minutes}:${seconds}`;
    
    // 生成随机的视频描述
    const descriptions = [
      `这是一个关于${keyword}的精彩${selectedType}`,
      `${author}带来的${selectedType}作品，探索${keyword}的奥秘`,
      `高质量${selectedType}内容，深度解析${keyword}`,
      `最新${selectedType}：${keyword}完整版`,
      `独家${selectedType}：${keyword}全程高能`
    ];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // 生成随机下载地址
    const downloadUrl = `https://download.example.com/video/${i}?title=${encodeURIComponent(keyword)}&type=${selectedType}`;

    mockResults.push({
      monitorVideoId: `result-${i}`,
      monitorVideoTitle: `${keyword} - ${selectedType}内容 ${i + 1}`,
      monitorVideoPlatform: selectedPlatform,
      monitorVideoThumbnail: `https://picsum.photos/300/200?random=${i}`,
      monitorVideoUrl: "#",
      monitorVideoViews: views,
      monitorVideoDuration: duration,
      monitorVideoPublishDate: date.toISOString().split("T")[0],
      monitorVideoType: selectedType,
      monitorVideoSize: size,
      monitorVideoResolution: resolution,
      monitorVideoAuthor: author,
      monitorVideoDescription: description,
      monitorVideoDownloadUrl: downloadUrl
    });
  }

  return mockResults;
}

// 导出类型
export type { VideoInfo, ApiResponse, VideoSearchParams, VideoSearchResult };