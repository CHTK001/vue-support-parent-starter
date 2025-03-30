import { http, type ReturnResult } from "@repo/utils";

// 音乐类型接口
export interface MusicType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 音乐平台接口
export interface MusicPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

// 音乐信息接口
export interface MusicInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  duration: number;
  platform: string;
  type: string;
  publishDate: string;
  lyrics?: string;
  views?: number;
  likes?: number;
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

/**
 * 获取音乐类型列表
 */
export const fetchMusicTypes = () => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: "all",
              name: "全部",
              icon: "ri:music-2-line",
              color: "#409EFF",
            },
            {
              id: "pop",
              name: "流行",
              icon: "ri:disc-line",
              color: "#FF9C00",
            },
            {
              id: "rock",
              name: "摇滚",
              icon: "ri:guitar-line",
              color: "#FF4500",
            },
            {
              id: "folk",
              name: "民谣",
              icon: "ri:piano-line",
              color: "#00BE06",
            },
            {
              id: "electronic",
              name: "电子",
              icon: "ri:equalizer-line",
              color: "#FB7299",
            },
            {
              id: "classical",
              name: "古典",
              icon: "ri:music-line",
              color: "#8A2BE2",
            },
            {
              id: "jazz",
              name: "爵士",
              icon: "ri:saxophone-line",
              color: "#0099FF",
            },
            {
              id: "rap",
              name: "说唱",
              icon: "ri:mic-line",
              color: "#000000",
            },
          ]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<MusicType[]>>("get", "/v2/tool/music/types", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取音乐平台列表
 */
export const fetchMusicPlatforms = () => {
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
              id: "netease",
              name: "网易云音乐",
              icon: "ri:netease-cloud-music-line",
              color: "#FF0000",
              url: "https://music.163.com/#/search/m/?s={{keyword}}",
            },
            {
              id: "qq",
              name: "QQ音乐",
              icon: "ri:qq-line",
              color: "#00BE06",
              url: "https://y.qq.com/n/ryqq/search?w={{keyword}}",
            },
            {
              id: "kugou",
              name: "酷狗音乐",
              icon: "ri:music-line",
              color: "#0099FF",
              url: "https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord={{keyword}}",
            },
            {
              id: "kuwo",
              name: "酷我音乐",
              icon: "ri:headphone-line",
              color: "#FF9C00",
              url: "http://www.kuwo.cn/search/list?key={{keyword}}",
            },
            {
              id: "migu",
              name: "咪咕音乐",
              icon: "ri:music-2-line",
              color: "#FB7299",
              url: "https://music.migu.cn/v3/search?keyword={{keyword}}",
            },
            {
              id: "spotify",
              name: "Spotify",
              icon: "ri:spotify-line",
              color: "#1DB954",
              url: "https://open.spotify.com/search/{{keyword}}",
            },
            {
              id: "apple",
              name: "Apple Music",
              icon: "ri:apple-line",
              color: "#000000",
              url: "https://music.apple.com/search?term={{keyword}}",
            },
          ]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<MusicPlatform[]>>("get", "/v2/tool/music/platforms", {
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
          data: ["周杰伦", "林俊杰", "薛之谦", "Taylor Swift", "陈奕迅", "华晨宇", "邓紫棋", "Beyond"]
        });
      }, 300);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<string[]>>("get", "/v2/tool/music/hot-keywords", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 音乐搜索接口
 * @param params 搜索参数
 */
export const fetchMusicSearch = (params: any) => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            data: generateMockMusicResults(params.keyword, 18, params.type, params.platform),
            total: 30
          },
          code: '00000'
        });
      }, 800);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<{list: MusicInfo[], total: number}>>("get", "/v2/tool/music/search", {
    params,
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取音乐详情
 * @param id 音乐ID
 */
export const fetchMusicDetail = (id: string) => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMusic = generateMockMusicResults("", 1)[0];
        mockMusic.id = id;
        mockMusic.lyrics = generateMockLyrics();
        resolve({
          success: true,
          data: mockMusic
        });
      }, 500);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<MusicInfo>>("get", `/v2/tool/music/detail/${id}`, {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取推荐歌单
 */
export const fetchRecommendPlaylists = () => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: generateMockPlaylists(8)
        });
      }, 500);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<Playlist[]>>("get", "/v2/tool/music/recommend-playlists", {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 获取歌单详情
 * @param id 歌单ID
 */
export const fetchPlaylistDetail = (id: string) => {
  // 开发环境使用模拟数据
  if (process.env.NODE_ENV === 'development') {
    return new Promise((resolve) => {
      setTimeout(() => {
        const playlist = generateMockPlaylists(1)[0];
        playlist.id = id;
        const songs = generateMockMusicResults("", 10);
        resolve({
          success: true,
          data: {
            playlist,
            songs
          }
        });
      }, 500);
    });
  }
  
  // 生产环境使用真实接口
  return http.request<ReturnResult<{playlist: Playlist, songs: MusicInfo[]}>>("get", `/v2/tool/music/playlist/${id}`, {
    headers: {
      "x-remote-animation": "false"
    }
  });
};

/**
 * 生成模拟音乐搜索结果
 */
function generateMockMusicResults(keyword: string, count: number, type: string = 'all', platform: string = 'all'): MusicInfo[] {
  const mockResults: MusicInfo[] = [];
  const platforms = ["网易云音乐", "QQ音乐", "酷狗音乐", "酷我音乐", "咪咕音乐", "Spotify", "Apple Music"];
  const types = ["流行", "摇滚", "民谣", "电子", "古典", "爵士", "说唱"];
  const artists = ["周杰伦", "林俊杰", "薛之谦", "Taylor Swift", "陈奕迅", "华晨宇", "邓紫棋", "Beyond"];
  const albums = ["Jay", "JJ陆", "渡", "Lover", "U87", "新世界", "E=MC²", "光辉岁月"];

  for (let i = 0; i < count; i++) {
    // 根据筛选条件过滤
    let selectedPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    let selectedType = types[Math.floor(Math.random() * types.length)];
    
    // 如果指定了平台且不是"all"，则使用指定平台
    if (platform !== 'all') {
      const platformMap: {[key: string]: string} = {
        'netease': '网易云音乐',
        'qq': 'QQ音乐',
        'kugou': '酷狗音乐',
        'kuwo': '酷我音乐',
        'migu': '咪咕音乐',
        'spotify': 'Spotify',
        'apple': 'Apple Music'
      };
      if (platformMap[platform]) {
        selectedPlatform = platformMap[platform];
      }
    }
    
    // 如果指定了类型且不是"all"，则使用指定类型
    if (type !== 'all') {
      const typeMap: {[key: string]: string} = {
        'pop': '流行',
        'rock': '摇滚',
        'folk': '民谣',
        'electronic': '电子',
        'classical': '古典',
        'jazz': '爵士',
        'rap': '说唱'
      };
      if (typeMap[type]) {
        selectedType = typeMap[type];
      }
    }

    const views = Math.floor(Math.random() * 10000000);
    const likes = Math.floor(Math.random() * 500000);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 3650));
    const duration = Math.floor(Math.random() * 300) + 120; // 2-7分钟
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const album = albums[Math.floor(Math.random() * albums.length)];
    
    const title = keyword 
      ? `${keyword} - ${selectedType}风格`
      : `${artist}的${selectedType}歌曲 ${i + 1}`;

    mockResults.push({
      id: `music-${i}`,
      title: title,
      artist: artist,
      album: album,
      cover: `https://picsum.photos/300/300?random=${i}`,
      url: "https://music.163.com/song/media/outer/url?id=1824045033.mp3", // 示例URL
      duration: duration,
      platform: selectedPlatform,
      type: selectedType,
      publishDate: date.toISOString().split("T")[0],
      views: views,
      likes: likes
    });
  }

  return mockResults;
}

/**
 * 生成模拟歌单
 */
function generateMockPlaylists(count: number): Playlist[] {
  const playlists: Playlist[] = [];
  const names = ["流行热歌", "摇滚精选", "民谣小调", "电子节拍", "古典名曲", "爵士情调", "说唱集锦", "经典老歌"];
  const creators = ["音乐编辑", "热门推荐", "系统推荐", "用户收藏", "官方精选"];
  const descriptions = [
    "精选热门歌曲，带你领略音乐的魅力",
    "汇集经典曲目，感受不同风格的音乐",
    "编辑精心挑选，打造专属音乐体验",
    "根据你的喜好推荐，发现更多好听的歌",
    "热门歌曲集锦，随时随地享受音乐"
  ];

  for (let i = 0; i < count; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const creator = creators[Math.floor(Math.random() * creators.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const songCount = Math.floor(Math.random() * 50) + 10;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));

    playlists.push({
      id: `playlist-${i}`,
      name: `${name} Vol.${i+1}`,
      cover: `https://picsum.photos/300/300?random=${i+100}`,
      description: description,
      count: songCount,
      creator: creator,
      createTime: date.toISOString().split("T")[0]
    });
  }

  return playlists;
}

/**
 * 生成模拟歌词
 */
function generateMockLyrics(): string {
  return `[00:00.000] 作词 : 周杰伦
[00:01.000] 作曲 : 周杰伦
[00:02.000] 编曲 : 周杰伦
[00:03.000] 制作人 : 周杰伦
[00:04.000] 
[00:05.000] 模拟歌词第一行
[00:10.000] 模拟歌词第二行
[00:15.000] 模拟歌词第三行
[00:20.000] 模拟歌词第四行
[00:25.000] 模拟歌词第五行
[00:30.000] 模拟歌词第六行
[00:35.000] 模拟歌词第七行
[00:40.000] 模拟歌词第八行
[00:45.000] 模拟歌词第九行
[00:50.000] 模拟歌词第十行
[00:55.000] 模拟歌词第十一行
[01:00.000] 模拟歌词第十二行
[01:05.000] 模拟歌词第十三行
[01:10.000] 模拟歌词第十四行
[01:15.000] 模拟歌词第十五行
[01:20.000] 模拟歌词第十六行
[01:25.000] 模拟歌词第十七行
[01:30.000] 模拟歌词第十八行
[01:35.000] 模拟歌词第十九行
[01:40.000] 模拟歌词第二十行
[01:45.000] 
[01:50.000] 模拟歌词第二十一行
[01:55.000] 模拟歌词第二十二行
[02:00.000] 模拟歌词第二十三行
[02:05.000] 模拟歌词第二十四行
[02:10.000] 模拟歌词第二十五行
[02:15.000] 模拟歌词第二十六行
[02:20.000] 模拟歌词第二十七行
[02:25.000] 模拟歌词第二十八行
[02:30.000] 模拟歌词第二十九行
[02:35.000] 模拟歌词第三十行`;
}