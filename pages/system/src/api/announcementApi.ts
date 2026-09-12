import { http } from "@repo/utils";
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
  return http()
    .get("/v2/announcement/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysAnnouncement>>>((r) => r.data);
}

export function getAnnouncement(sysAnnouncementId: number) {
  return http()
    .get("/v2/announcement/get")
    .query({ sysAnnouncementId })
    .then<ApiResult<SysAnnouncement>>((r) => r.data);
}

export function saveAnnouncement(data: SysAnnouncement) {
  return http()
    .post("/v2/announcement/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysAnnouncement>>((r) => r.data);
}

export function updateAnnouncement(data: SysAnnouncement) {
  return http()
    .put("/v2/announcement/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function deleteAnnouncement(sysAnnouncementId: number) {
  return http()
    .delete("/v2/announcement/delete")
    .query({ sysAnnouncementId })
    .then<ApiResult<boolean>>((r) => r.data);
}

export function publishAnnouncement(sysAnnouncementId: number) {
  return http()
    .put("/v2/announcement/publish")
    .data({ sysAnnouncementId } as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function unpublishAnnouncement(sysAnnouncementId: number) {
  return http()
    .put("/v2/announcement/unpublish")
    .data({ sysAnnouncementId } as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

export function getActiveAnnouncements() {
  return http()
    .get("/v2/announcement/active")
    .then<ApiResult<SysAnnouncement[]>>((r) => r.data);
}