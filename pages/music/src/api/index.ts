import type { MusicApiResponse, MusicSearchResult, MusicSearchParams, MusicInfo, MusicPlaylist } from "../types";
import { musicTypes, musicPlatforms, musicHotKeywords, musicList, musicPlaylists } from "./mockData";
// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 获取音乐类型
export const fetchMusicTypes = async (): Promise<MusicApiResponse<typeof musicTypes>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: musicTypes,
    success: true,
  };
};

// 获取音乐平台
export const fetchMusicPlatforms = async (): Promise<MusicApiResponse<typeof musicPlatforms>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: musicPlatforms,
    success: true,
  };
};

// 获取热门关键词
export const fetchMusicHotKeywords = async (): Promise<MusicApiResponse<typeof musicHotKeywords>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: musicHotKeywords,
    success: true,
  };
};

// 搜索音乐
export const fetchMusicSearch = async (params: MusicSearchParams): Promise<MusicApiResponse<MusicSearchResult>> => {
  await delay(800);

  let filteredMusics = [...musicList];

  // 关键词过滤
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredMusics = filteredMusics.filter((music) => music.musicTitle.toLowerCase().includes(keyword) || music.musicArtist.toLowerCase().includes(keyword) || music.musicAlbum.toLowerCase().includes(keyword));
  }

  // 类型过滤
  if (params.type && params.type !== "all") {
    filteredMusics = filteredMusics.filter((music) => music.musicType === params.type);
  }

  // 平台过滤
  if (params.platform && params.platform !== "all") {
    filteredMusics = filteredMusics.filter((music) => music.musicPlatform === params.platform);
  }

  // 分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedMusics = filteredMusics.slice(start, end);

  return {
    code: "00000",
    message: "搜索成功",
    data: {
      data: paginatedMusics,
      total: filteredMusics.length,
    },
    success: true,
  };
};

// 获取音乐详情
export const fetchMusicDetail = async (id: string): Promise<MusicApiResponse<MusicInfo>> => {
  await delay(500);

  const music = musicList.find((item) => item.musicId === id);

  if (!music) {
    return {
      code: "10001",
      message: "音乐不存在",
      data: {} as MusicInfo,
      success: false,
    };
  }

  return {
    code: "00000",
    message: "获取成功",
    data: music,
    success: true,
  };
};

// 获取推荐歌单
export const fetchMusicRecommendPlaylists = async (): Promise<MusicApiResponse<MusicPlaylist[]>> => {
  await delay(600);

  return {
    code: "00000",
    message: "获取成功",
    data: musicPlaylists,
    success: true,
  };
};

// 获取歌单详情
export const fetchMusicPlaylistDetail = async (id: string): Promise<MusicApiResponse<{ playlist: MusicPlaylist; songs: MusicInfo[] }>> => {
  await delay(800);

  const playlist = musicPlaylists.find((item) => item.musicId === id);

  if (!playlist) {
    return {
      code: "10002",
      message: "歌单不存在",
      data: {} as { playlist: MusicPlaylist; songs: MusicInfo[] },
      success: false,
    };
  }

  // 根据歌单ID返回不同的歌曲列表
  let songs: MusicInfo[] = [];

  if (id === "1") {
    // 华语流行经典
    songs = musicList.filter((item) => item.musicType === "pop");
  } else if (id === "5") {
    // 周杰伦精选
    songs = musicList.filter((item) => item.musicArtist === "周杰伦");
  } else if (id === "6") {
    // 林俊杰精选
    songs = musicList.filter((item) => item.musicArtist === "林俊杰");
  } else {
    // 其他歌单随机返回一些歌曲
    songs = musicList.slice(0, 3);
  }

  return {
    code: "00000",
    message: "获取成功",
    data: {
      playlist,
      songs,
    },
    success: true,
  };
};

// 导出类型
export type { MusicInfo, MusicPlaylist, MusicApiResponse, MusicSearchParams, MusicSearchResult };
