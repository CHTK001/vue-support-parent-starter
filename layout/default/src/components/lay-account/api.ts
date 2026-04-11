import {
  fetchGetUserPreference,
  fetchSaveUserPreference,
} from "@repo/core";
import { http, type ReturnResult } from "@repo/utils";

export type UserAgreementSection = {
  title: string;
  content: string;
};

export type UserAgreementPayload = {
  title: string;
  label: string;
  headline: string;
  description: string;
  version: string;
  updatedAt: string;
  sections: UserAgreementSection[];
};

export type UserAgreementAcceptance = {
  agreementAcceptedVersion: string;
  agreementAcceptedAt: string;
};

type UserAgreementCacheRecord = {
  expiresAt: number;
  payload: UserAgreementPayload;
};

const USER_AGREEMENT_CACHE_KEY = "sc:user-agreement:v1";
const USER_AGREEMENT_CACHE_TTL = 30 * 60 * 1000;

const readAgreementCache = (): UserAgreementPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(USER_AGREEMENT_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as UserAgreementCacheRecord;
    if (!parsed?.payload || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(USER_AGREEMENT_CACHE_KEY);
      return null;
    }
    return parsed.payload;
  } catch {
    return null;
  }
};

const writeAgreementCache = (payload: UserAgreementPayload) => {
  if (typeof window === "undefined") {
    return;
  }
  const record: UserAgreementCacheRecord = {
    expiresAt: Date.now() + USER_AGREEMENT_CACHE_TTL,
    payload,
  };
  window.localStorage.setItem(USER_AGREEMENT_CACHE_KEY, JSON.stringify(record));
};

const parsePreference = (rawPreference?: string | null) => {
  if (!rawPreference) {
    return {};
  }
  try {
    const parsed = JSON.parse(rawPreference);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const fetchUserAgreement = async (force = false) => {
  if (!force) {
    const cached = readAgreementCache();
    if (cached) {
      return {
        code: "00000",
        data: cached,
      } as ReturnResult<UserAgreementPayload>;
    }
  }

  const response = await http.request<ReturnResult<UserAgreementPayload>>(
    "get",
    "/v2/user/agreement",
  );
  if (response?.data?.sections?.length) {
    writeAgreementCache(response.data);
  }
  return response;
};

export const acceptUserAgreement = async (
  version: string,
): Promise<UserAgreementAcceptance> => {
  const currentPreference = await fetchGetUserPreference();
  const preference = parsePreference(currentPreference?.data);
  const acceptedAt = new Date().toISOString();
  const nextPreference = {
    ...preference,
    agreementAcceptedVersion: version,
    agreementAcceptedAt: acceptedAt,
  };
  await fetchSaveUserPreference(JSON.stringify(nextPreference));
  return {
    agreementAcceptedVersion: version,
    agreementAcceptedAt: acceptedAt,
  };
};
