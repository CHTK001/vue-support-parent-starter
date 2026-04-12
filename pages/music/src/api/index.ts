import { http, type ReturnResult } from "@repo/utils";
import type {
  MusicOverview,
  MusicPlaylistCategoryCatalog,
  MusicPlaylistCategoryResult,
  MusicPlaylistDetail,
  MusicPlaylistSearchResult,
  MusicSearchResult,
  MusicSourceOption,
  MusicTrackDetail,
} from "../types";

export const fetchMusicSources = () =>
  http.request<ReturnResult<MusicSourceOption[]>>("get", "/v1/music/sources");

export const fetchMusicOverview = (source?: string) =>
  http.request<ReturnResult<MusicOverview>>("get", "/v1/music/overview", {
    params: { source },
  });

export const fetchMusicPlaylistCategories = (source?: string) =>
  http.request<ReturnResult<MusicPlaylistCategoryCatalog>>("get", "/v1/music/playlist/categories", {
    params: { source },
  });

export const fetchMusicCategoryPlaylists = (
  source?: string,
  tagId?: string,
  page: number = 1,
  pageSize: number = 12,
) =>
  http.request<ReturnResult<MusicPlaylistCategoryResult>>("get", "/v1/music/playlist/category", {
    params: { source, tagId, page, pageSize },
  });

export const searchMusicTracks = (
  keyword: string,
  source?: string,
  page: number = 1,
  pageSize: number = 24,
) =>
  http.request<ReturnResult<MusicSearchResult>>("get", "/v1/music/search", {
    params: { keyword, source, page, pageSize },
  });

export const searchMusicPlaylists = (
  keyword: string,
  source?: string,
  page: number = 1,
  pageSize: number = 12,
) =>
  http.request<ReturnResult<MusicPlaylistSearchResult>>("get", "/v1/music/search/playlists", {
    params: { keyword, source, page, pageSize },
  });

export const fetchMusicPlaylist = (source: string, playlistId: string) =>
  http.request<ReturnResult<MusicPlaylistDetail>>(
    "get",
    `/v1/music/playlist/${source}/${playlistId}`,
  );

export const fetchMusicTrack = (source: string, trackId: string) =>
  http.request<ReturnResult<MusicTrackDetail>>(
    "get",
    `/v1/music/track/${source}/${trackId}`,
  );
