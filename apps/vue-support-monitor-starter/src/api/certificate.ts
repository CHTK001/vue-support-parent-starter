import { http } from "@repo/utils";
import { buildApiUrl } from "@pages/system";

export interface AcmeAccount {
  acmeAccountId?: number;
  acmeAccountEmail: string;
  acmeAccountServer: string;
  acmeAccountStatus?: string;
  acmeAccountPrivateKeyPem?: string;
  acmeAccountEabKid?: string;
  acmeAccountEabHmacKey?: string;
  acmeAccountRemark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface AcmeCertificate {
  acmeCertId?: number;
  acmeAccountId: number;
  acmeCertPrimaryDomain: string;
  acmeCertSan?: string;
  acmeCertChallengeType: string;
  acmeCertStatus?: string;
  acmeCertNotBefore?: string;
  acmeCertNotAfter?: string;
  acmeCertRenewAt?: string;
  acmeCertChainPem?: string;
  acmeCertKeyPem?: string;
  acmeCertLastError?: string;
  createTime?: string;
  updateTime?: string;
  acmeCertDeployMode?: string;
  acmeCertWebrootPath?: string;
}

export interface AcmeCertStats {
  accountCount: number;
  certCount: number;
  validCount: number;
  pendingCount: number;
  revokedCount: number;
  failedCount: number;
  expiringCount: number;
  expiredCount: number;
}

export interface AcmeOrder {
  acmeOrderId?: number;
  acmeCertId: number;
  acmeAccountId?: number;
  acmeOrderStatus?: string;
  acmeAuthzUrls?: string;
  createTime?: string;
  updateTime?: string;
}

export interface AcmeCertificateDetail {
  certificate: AcmeCertificate;
  account?: AcmeAccount;
  orders?: AcmeOrder[];
  curlCommands?: string[];
  daysUntilExpiry?: number;
  soonExpiring?: boolean;
  currentStep?: number;
  stepDescription?: string;
}

export interface AcmeApplyCertRequest {
  acmeAccountId: number;
  primaryDomain: string;
  sanDomains?: string[];
  challengeType?: string;
  deployMode?: string;
  webrootPath?: string;
  sshHost?: string;
  sshPort?: number;
  sshUsername?: string;
  sshPassword?: string;
}

export interface EabConfig {
  eabUrl: string;
  eabKid: string;
  eabHmacKey: string;
  eabMode: string;
}

export const CERT_STATUS = {
  pending: { label: "待处理", type: "info" },
  validating: { label: "验证中", type: "warning" },
  valid: { label: "有效", type: "success" },
  failed: { label: "失败", type: "danger" },
  revoked: { label: "已吊销", type: "danger" },
  expired: { label: "已过期", type: "info" },
} as const;

export const CERT_CHALLENGE = {
  "HTTP-01": { label: "HTTP-01" },
  "DNS-01": { label: "DNS-01" },
} as const;

export const DEPLOY_MODE = {
  manual: { label: "手动模式" },
  local: { label: "本机模式" },
  ssh: { label: "SSH远程模式" },
} as const;

// ── ACME 服务器预设 ──

const ACME_SERVERS: Record<string, { label: string; eab: boolean }> = {
  "https://acme-v02.api.letsencrypt.org/directory": {
    label: "Let's Encrypt",
    eab: false,
  },
  "https://acme-staging-v02.api.letsencrypt.org/directory": {
    label: "Let's Encrypt (Staging)",
    eab: false,
  },
  "https://acme.zerossl.com/v2/DV90": {
    label: "ZeroSSL",
    eab: true,
  },
  "https://acme.ssl.com/sslcom-dv-rsa": {
    label: "SSL.com DV",
    eab: true,
  },
};

export function getServerLabel(url: string): string {
  return ACME_SERVERS[url]?.label ?? url;
}

export function requiresEab(url: string): boolean {
  return ACME_SERVERS[url]?.eab ?? false;
}

// ── 预设 EAB 配置 ──

const EAB_CONFIGS: Record<string, EabConfig> = {
  "https://acme.zerossl.com/v2/DV90": {
    eabUrl: "https://app.zerossl.com/developer",
    eabKid: "",
    eabHmacKey: "",
    eabMode: "ZeroSSL EAB",
  },
};

export function getEabConfig(url: string): EabConfig | null {
  return EAB_CONFIGS[url] ?? null;
}

const BASE = "/v1/cert";

export function getAccountPage(params: Record<string, any>) {
  return http.get(buildApiUrl(`${BASE}/account/page`), { params });
}

export function getAccountList() {
  return http.get(buildApiUrl(`${BASE}/account/list`));
}

export function saveAccount(data: AcmeAccount) {
  return http.post(buildApiUrl(`${BASE}/account/save`), data);
}

export function getAccountDetail(accountId: number) {
  return http.get(buildApiUrl(`${BASE}/account/${accountId}`));
}

export function deleteAccount(accountId: number) {
  return http.delete(buildApiUrl(`${BASE}/account/${accountId}`));
}

/** 证书管理 */
export function getCertPage(params: Record<string, any>) {
  return http.get(buildApiUrl(`${BASE}/page`), { params });
}

export function getCertDetail(certId: number) {
  return http.get(buildApiUrl(`${BASE}/${certId}`));
}

export function applyCert(data: AcmeApplyCertRequest) {
  return http.post(buildApiUrl(`${BASE}/apply`), data);
}

export function renewCert(certId: number) {
  return http.post(buildApiUrl(`${BASE}/${certId}/renew`));
}

export function revokeCert(certId: number) {
  return http.post(buildApiUrl(`${BASE}/${certId}/revoke`));
}

export function deleteCert(certId: number) {
  return http.delete(buildApiUrl(`${BASE}/${certId}`));
}

export function downloadCert(certId: number, fileType: string) {
  return buildApiUrl(`${BASE}/${certId}/download?fileType=${fileType}`);
}

export function retryValidation(certId: number) {
  return http.post(buildApiUrl(`${BASE}/${certId}/retry-validation`));
}

export function triggerRenewCheck() {
  return http.post(buildApiUrl(`${BASE}/renew-check`));
}

export function getCertOrders(certId: number) {
  return http.get(buildApiUrl(`${BASE}/${certId}/orders`));
}

export function getCertStats() {
  return http.get(buildApiUrl(`${BASE}/stats`));
}
