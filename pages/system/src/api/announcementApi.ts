import { getApiHttp } from "@repo/core";
import type { ApiResult, PageResult } from "./types";

export interface SysAnnouncement {
  sysAnnouncementId?: number;
  sysAnnouncementTitle?: string;
  sysAnnouncementContent?: string;
  sysAnnouncementLevel?: string;
  sysAnnouncementPosition?: string;
  sysAnnouncementType?: string;
  sysAnnouncementTargetRoles?: string;
  sysAnnouncementStatus?: number;
  sysAnnouncementSort?: number;
  sysAnnouncementPublishTime?: string;
  sysAnnouncementExpireTime?: string;
  sysAnnouncementTargetUrl?: string;
  sysAnnouncementPublisherName?: string;
  createTime?: string;
}

export function pageForAnnouncement(params: {
  page?: number;
  pageSize?: number;
  sysAnnouncementTitle?: string;
  sysAnnouncementStatus?: number;
  sysAnnouncementLevel?: string;
}) {
  return getApiHttp()
    .get("/v2/announcement/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysAnnouncement>>>((r) => r.data);
}

export function getAnnouncement(sysAnnouncementId: number) {
  return getApiHttp()
    .get("/v2/announcement/get")
    .query({ sysAnnouncementId })
    .then<ApiResult<SysAnnouncement>>((r) => r.data);
}

export function saveAnnouncement(data: SysAnnouncement) {
  return getApiHttp()
    .post("/v2/announcement/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysAnnouncement>>((r) => r.data);
}

export function updateAnnouncement(data: SysAnnouncement) {
  return getApiHttp()
    .put("/v2/announcement/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function deleteAnnouncement(sysAnnouncementId: number) {
  return getApiHttp()
    .delete("/v2/announcement/delete")
    .query({ sysAnnouncementId })
    .then<ApiResult<boolean>>((r) => r.data);
}

export function publishAnnouncement(sysAnnouncementId: number) {
  return getApiHttp()
    .put("/v2/announcement/publish")
    .data({ sysAnnouncementId } as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function unpublishAnnouncement(sysAnnouncementId: number) {
  return getApiHttp()
    .put("/v2/announcement/unpublish")
    .data({ sysAnnouncementId } as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function getActiveAnnouncements() {
  return getApiHttp()
    .get("/v2/announcement/active")
    .then<ApiResult<SysAnnouncement[]>>((r) => r.data);
}