/**
 * Sign-in API (@pages/signin)
 *
 * All calls go through getApiHttp(), URL pattern: /signin/{action}
 */
import { getApiHttp } from "@repo/core";
import type {
  ApiResult,
  PageResult,
  SignInDay,
  SignInResult,
  SignInStats,
  TodayStatus,
  UserSignInSummary,
} from "./types";

const B = "/signin";

/* ================== User side ================== */

/** Perform daily sign-in */
export function doSignIn(userId: number | string) {
  return getApiHttp()
    .post(`${B}/do`)
    .query({ userId })
    .then<ApiResult<SignInResult>>((r) => r.data);
}

/** Check if already signed today */
export function checkToday(userId: number | string) {
  return getApiHttp()
    .get(`${B}/today/${userId}`)
    .then<ApiResult<TodayStatus>>((r) => r.data);
}

/** Get monthly calendar */
export function getCalendar(userId: number | string, yearMonth?: string) {
  const q = getApiHttp().get(`${B}/calendar/${userId}`);
  if (yearMonth) q.query({ yearMonth });
  return q.then<ApiResult<SignInDay[]>>((r) => r.data);
}

/** Get sign-in stats */
export function getStats(userId: number | string) {
  return getApiHttp()
    .get(`${B}/stats/${userId}`)
    .then<ApiResult<SignInStats>>((r) => r.data);
}

/* ================== Admin ================== */

/** Get user sign-in summary page (admin) */
export function pageUserSummary(params: { page?: number; pageSize?: number }) {
  return getApiHttp()
    .get(`${B}/users/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<UserSignInSummary>>>((r) => r.data);
}