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

// ... 其他代码保持不变 ...

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

/**
 * 视频搜索接口
 * @param params 搜索参数
 */
export const fetchVideoSearch = (params: any) => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            data: generateMockVideoResults(params.keyword, 18, params.type, params.platform),
            total: 30
          },
          code: '00000'
        });
      }, 800);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<{list: MonitorVideoResult[], total: number}>>("get", "/v2/tool/video/search", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取视频类型列表
 */
export const fetchVideoTypes = () => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: "all",
              name: "全部类型",
              icon: "ri:search-line",
              color: "#409EFF",
            },
            {
              id: "movie",
              name: "电影",
              icon: "ri:movie-line",
              color: "#FF9C00",
            },
            {
              id: "tv",
              name: "电视剧",
              icon: "ri:tv-line",
              color: "#00BE06",
            },
            {
              id: "anime",
              name: "动漫",
              icon: "ri:gamepad-line",
              color: "#FB7299",
            },
            {
              id: "variety",
              name: "综艺",
              icon: "ri:live-line",
              color: "#FF8800",
            },
            {
              id: "documentary",
              name: "纪录片",
              icon: "ri:film-line",
              color: "#0099FF",
            },
            {
              id: "short",
              name: "短视频",
              icon: "ri:video-line",
              color: "#000000",
            },
            {
              id: "music",
              name: "音乐MV",
              icon: "ri:music-line",
              color: "#FF0000",
            },
          ]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<VideoType[]>>("get", "/v2/tool/video/types", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取视频平台列表
 */
export const fetchVideoPlatforms = () => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: "all",
              name: "全部平台",
              icon: "ri:global-line",
              color: "#409EFF",
              url: "",
            },
            {
              id: "bilibili",
              name: "哔哩哔哩",
              icon: "ri:bilibili-line",
              color: "#FB7299",
              url: "https://search.bilibili.com/all?keyword={{keyword}}",
            },
            {
              id: "youtube",
              name: "YouTube",
              icon: "ri:youtube-line",
              color: "#FF0000",
              url: "https://www.youtube.com/results?search_query={{keyword}}",
            },
            {
              id: "iqiyi",
              name: "爱奇艺",
              icon: "ri:tv-line",
              color: "#00BE06",
              url: "https://so.iqiyi.com/so/q_{{keyword}}",
            },
            {
              id: "tencent",
              name: "腾讯视频",
              icon: "ri:video-line",
              color: "#FF9C00",
              url: "https://v.qq.com/x/search/?q={{keyword}}",
            },
            {
              id: "youku",
              name: "优酷",
              icon: "ri:play-circle-line",
              color: "#0099FF",
              url: "https://so.youku.com/search_video/q_{{keyword}}",
            },
            {
              id: "mgtv",
              name: "芒果TV",
              icon: "ri:movie-line",
              color: "#FF8800",
              url: "https://so.mgtv.com/so/k-{{keyword}}",
            },
            {
              id: "douyin",
              name: "抖音",
              icon: "ri:rhythm-line",
              color: "#000000",
              url: "https://www.douyin.com/search/{{keyword}}",
            },
          ]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<VideoPlatform[]>>("get", "/v2/tool/video/platforms", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取热门搜索关键词
 */
export const fetchHotKeywords = () => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: ["热门电影", "综艺节目", "动漫", "纪录片", "电视剧", "音乐MV", "教程", "游戏实况"]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<string[]>>("get", "/v2/tool/video/hot-keywords", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 生成模拟视频搜索结果
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

// 模拟延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取视频类型
export const fetchVideoTypes = async (): Promise<ApiResponse<typeof videoTypes>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoTypes,
    success: true
  };
};

// 获取视频平台
export const fetchVideoPlatforms = async (): Promise<ApiResponse<typeof videoPlatforms>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoPlatforms,
    success: true
  };
};

// 获取热门关键词
export const fetchHotKeywords = async (): Promise<ApiResponse<typeof videoHotKeywords>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: videoHotKeywords,
    success: true
  };
};

// 搜索视频
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

// 导出类型
export type { VideoInfo, ApiResponse, VideoSearchParams, VideoSearchResult };