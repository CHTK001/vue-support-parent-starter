import { http, type ReturnResult } from "@repo/utils";
import type { MusicSourceOption } from "@pages/music";

export const fetchMusicSourceAdminList = () =>
  http.request<ReturnResult<MusicSourceOption[]>>(
    "get",
    "/v1/music/admin/sources",
  );

export const updateMusicSourceAdminState = (
  sourceCode: string,
  enabled: boolean,
) =>
  http.request<ReturnResult<MusicSourceOption>>(
    "put",
    `/v1/music/admin/sources/${sourceCode}`,
    {
      data: { enabled },
    },
  );
