// 音乐信息接口
export interface MusicInfo {
  musicId: string;
  musicTitle: string;
  musicArtist: string;
  musicAlbum: string;
  musicCover: string;
  musicUrl: string;
  musicLyrics?: string;
  musicDuration: number;
  musicType: string;
  musicPlatform: string;
}

// 歌单接口
export interface MusicPlaylist {
  musicId: string;
  musicName: string;
  musicCover: string;
  musicDescription: string;
  musicCount: number;
  musicCreator: string;
  createTime: string;
}
// 音乐信息接口
export interface MusicInfo {
  musicId: string;
  musicTitle: string;
  musicArtist: string;
  musicAlbum: string;
  musicCover: string;
  musicUrl: string;
  musicLyrics?: string;
  musicDuration: number;
  musicType: string;
  musicPlatform: string;
}

// 歌单接口
export interface Playlist {
  musicId: string;
  musicName: string;
  musicCover: string;
  musicDescription: string;
  musicCount: number;
  musicCreator: string;
  createTime: string;
}

// 通用响应接口
export interface MusicApiResponse<T> {
  code: string;
  message: string;
  data: T;
  success: boolean;
}

// 搜索参数接口
export interface MusicSearchParams {
  keyword: string;
  page: number;
  pageSize: number;
  type?: string;
  platform?: string;
}

// 搜索结果接口
export interface MusicSearchResult {
  data: MusicInfo[];
  total: number;
}
