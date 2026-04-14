export type MusicSection =
  | "discover"
  | "moon"
  | "radio"
  | "radar"
  | "search"
  | "favorites"
  | "history";
export type MusicSearchTab = "tracks" | "playlists";
export type MusicLoopMode = "all" | "one" | "random";

export interface MusicComment {
  commentId: string;
  author: string;
  avatar?: string;
  content: string;
  likedCount?: number;
  time?: string;
}

export interface MusicNavItem {
  code: MusicSection;
  label: string;
  hint: string;
}

export interface MusicSourceOption {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface MusicTrackSummary {
  trackId: string;
  source: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationSeconds: number;
  playCount?: number;
  commentCount?: number;
}

export interface MusicTrackDetail extends MusicTrackSummary {
  streamUrl: string;
  lyrics?: string;
  comments?: MusicComment[];
}

export interface MusicPlaylistSummary {
  playlistId: string;
  source: string;
  title: string;
  description: string;
  coverUrl: string;
  author: string;
  trackCount: number;
  accentColor?: string;
  playCount?: number;
  commentCount?: number;
}

export interface MusicPlaylistDetail extends MusicPlaylistSummary {
  tracks: MusicTrackSummary[];
}

export interface MusicPlaylistCategory {
  tagId: string;
  name: string;
  hot: boolean;
}

export interface MusicPlaylistCategoryGroup {
  groupId: string;
  name: string;
  tags: MusicPlaylistCategory[];
}

export interface MusicPlaylistCategoryCatalog {
  source: string;
  hotTags: MusicPlaylistCategory[];
  groups: MusicPlaylistCategoryGroup[];
}

export interface MusicOverview {
  sources: MusicSourceOption[];
  defaultSource: string;
  hotKeywords: string[];
  featuredPlaylists: MusicPlaylistSummary[];
}

export interface MusicSearchResult {
  source: string;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  tracks: MusicTrackSummary[];
}

export interface MusicPlaylistSearchResult {
  source: string;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  playlists: MusicPlaylistSummary[];
}

export interface MusicPlaylistCategoryResult {
  source: string;
  tagId: string;
  categoryName: string;
  page: number;
  pageSize: number;
  total: number;
  playlists: MusicPlaylistSummary[];
}
