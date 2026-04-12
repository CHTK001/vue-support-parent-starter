export type MusicSection = "discover" | "search" | "favorites" | "history";
export type MusicSearchTab = "tracks" | "playlists";

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
}

export interface MusicTrackDetail extends MusicTrackSummary {
  streamUrl: string;
  lyrics?: string;
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
}

export interface MusicPlaylistDetail extends MusicPlaylistSummary {
  tracks: MusicTrackSummary[];
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
