// 音乐信息接口
export interface MusicInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  lyrics?: string;
  duration: number;
  type: string;
  platform: string;
}

// 歌单接口
export interface Playlist {
  id: string;
  name: string;
  cover: string;
  description: string;
  count: number;
  creator: string;
  createTime: string;
}

// 通用响应接口
interface MusicApiResponse<T> {
  code: string;
  message: string;
  data: T;
  success: boolean;
}

// 搜索参数接口
interface MusicSearchParams {
  keyword: string;
  page: number;
  pageSize: number;
  type?: string;
  platform?: string;
}

// 搜索结果接口
interface MusicSearchResult {
  data: MusicInfo[];
  total: number;
}

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 获取音乐类型
export const fetchMusicTypes = async (): Promise<MusicApiResponse<typeof musicTypes>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: musicTypes,
    success: true
  };
};

// 获取音乐平台
export const fetchMusicPlatforms = async (): Promise<MusicApiResponse<typeof musicPlatforms>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: musicPlatforms,
    success: true
  };
};

// 获取热门关键词
export const fetchMusicHotKeywords = async (): Promise<MusicApiResponse<typeof musicHotKeywords>> => {
  await delay(300);
  return {
    code: '00000',
    message: '获取成功',
    data: musicHotKeywords,
    success: true
  };
};

// 搜索音乐
export const fetchMusicSearch = async (params: MusicSearchParams): Promise<MusicApiResponse<MusicSearchResult>> => {
  await delay(800);
  
  let filteredMusics = [...musicList];
  
  // 关键词过滤
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredMusics = filteredMusics.filter(music => 
      music.title.toLowerCase().includes(keyword) || 
      music.artist.toLowerCase().includes(keyword) || 
      music.album.toLowerCase().includes(keyword)
    );
  }
  
  // 类型过滤
  if (params.type && params.type !== 'all') {
    filteredMusics = filteredMusics.filter(music => music.type === params.type);
  }
  
  // 平台过滤
  if (params.platform && params.platform !== 'all') {
    filteredMusics = filteredMusics.filter(music => music.platform === params.platform);
  }
  
  // 分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedMusics = filteredMusics.slice(start, end);
  
  return {
    code: '00000',
    message: '搜索成功',
    data: {
      data: paginatedMusics,
      total: filteredMusics.length
    },
    success: true
  };
};

// 获取音乐详情
export const fetchMusicDetail = async (id: string): Promise<MusicApiResponse<MusicInfo>> => {
  await delay(500);
  
  const music = musicList.find(item => item.id === id);
  
  if (!music) {
    return {
      code: '10001',
      message: '音乐不存在',
      data: {} as MusicInfo,
      success: false
    };
  }
  
  return {
    code: '00000',
    message: '获取成功',
    data: music,
    success: true
  };
};

// 获取推荐歌单
export const fetchMusicRecommendPlaylists = async (): Promise<MusicApiResponse<MusicPlaylist[]>> => {
  await delay(600);
  
  return {
    code: '00000',
    message: '获取成功',
    data: musicPlaylists,
    success: true
  };
};

// 获取歌单详情
export const fetchMusicPlaylistDetail = async (id: string): Promise<MusicApiResponse<{playlist: MusicPlaylist, songs: MusicInfo[]}>> => {
  await delay(800);
  
  const playlist = musicPlaylists.find(item => item.id === id);
  
  if (!playlist) {
    return {
      code: '10002',
      message: '歌单不存在',
      data: {} as {playlist: MusicPlaylist, songs: MusicInfo[]},
      success: false
    };
  }
  
  // 根据歌单ID返回不同的歌曲列表
  let songs: MusicInfo[] = [];
  
  if (id === '1') { // 华语流行经典
    songs = musicList.filter(item => item.type === 'pop');
  } else if (id === '5') { // 周杰伦精选
    songs = musicList.filter(item => item.artist === '周杰伦');
  } else if (id === '6') { // 林俊杰精选
    songs = musicList.filter(item => item.artist === '林俊杰');
  } else {
    // 其他歌单随机返回一些歌曲
    songs = musicList.slice(0, 3);
  }
  
  return {
    code: '00000',
    message: '获取成功',
    data: {
      playlist,
      songs
    },
    success: true
  };
};

// 导出类型
export type { MusicInfo, MusicPlaylist, MusicApiResponse, MusicSearchParams, MusicSearchResult };