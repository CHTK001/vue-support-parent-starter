import { http } from "@repo/utils";
import { buildApiUrl } from "./url";

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
}

export interface AcmeOrder {
  acmeOrderId?: number;
  acmeAccountId: number;
  acmeCertId: number;
  acmeOrderUrl?: string;
  acmeAuthzUrls?: string;
  acmeOrderStatus?: string;
  acmeCertificateUrl?: string;
  createTime?: string;
  updateTime?: string;
}

export interface AcmeCertificateDetail {
  certificate: AcmeCertificate;
  account?: AcmeAccount;
  orders?: AcmeOrder[];
  daysUntilExpiry?: number;
  soonExpiring?: boolean;
}

export interface AcmeCertStats {
  accountCount: number;
  certCount: number;
  validCount: number;
  pendingCount: number;
  expiringCount: number;
  expiredCount: number;
  revokedCount: number;
  failedCount: number;
}

export interface ApplyCertRequest {
  acmeAccountId: number;
  primaryDomain: string;
  sanDomains?: string[];
  challengeType: string;
}

export function getAccountPage(params: Record<string, unknown>) {
  return http.get("/v1/cert/account/page", { params });
}

export function getAccountList() {
  return http.get("/v1/cert/account/list");
}

export function getAccountDetail(accountId: number) {
  return http.get(`/v1/cert/account/${accountId}`);
}

export function saveAccount(data: AcmeAccount) {
  return http.post("/v1/cert/account/save", data);
}

export function deleteAccount(accountId: number) {
  return http.delete(`/v1/cert/account/${accountId}`);
}

export function getCertPage(params: Record<string, unknown>) {
  return http.get("/v1/cert/page", { params });
}

export function getCertDetail(certId: number) {
  return http.get(`/v1/cert/${certId}`);
}

export function applyCert(data: ApplyCertRequest) {
  return http.post("/v1/cert/apply", data);
}

export function renewCert(certId: number) {
  return http.post(`/v1/cert/${certId}/renew`);
}

export function revokeCert(certId: number) {
  return http.post(`/v1/cert/${certId}/revoke`);
}

export function deleteCert(certId: number) {
  return http.delete(`/v1/cert/${certId}`);
}

export function downloadCert(certId: number, fileType: string = "cert") {
  return buildApiUrl(`/v1/cert/${certId}/download`, { fileType });
}

export function getCertStats() {
  return http.get("/v1/cert/stats");
}

export function triggerRenewCheck() {
  return http.post("/v1/cert/renew-check");
}

export function retryValidation(certId: number) {
  return http.post(`/v1/cert/${certId}/retry-validation`);
}

export function getCertOrders(certId: number) {
  return http.get(`/v1/cert/${certId}/orders`);
}

export const ACME_SERVER_GROUPS = [
  {
    label: "国内推荐",
    options: [{ label: "HiCA", value: "https://acme.hi.cn/directory" }],
  },
  {
    label: "免费证书",
    options: [
      {
        label: "Let's Encrypt (生产)",
        value: "https://acme-v02.api.letsencrypt.org/directory",
      },
      {
        label: "Let's Encrypt (测试)",
        value: "https://acme-staging-v02.api.letsencrypt.org/directory",
      },
      { label: "ZeroSSL", value: "https://acme.zerossl.com/v2/DV90" },
      {
        label: "Buypass (生产)",
        value: "https://api.buypass.com/acme/directory",
      },
      {
        label: "Buypass (测试)",
        value: "https://api.test4.buypass.no/acme/directory",
      },
    ],
  },
  {
    label: "Google",
    options: [
      {
        label: "Google Trust Services",
        value: "https://dv.acme-v02.api.pki.goog/directory",
      },
      {
        label: "Google Trust Services (测试)",
        value: "https://dv.acme-v02.test-api.pki.goog/directory",
      },
    ],
  },
  {
    label: "商业证书",
    options: [
      { label: "SSL.com (RSA)", value: "https://acme.ssl.com/sslcom-dv-rsa" },
      { label: "SSL.com (ECC)", value: "https://acme.ssl.com/sslcom-dv-ecc" },
      {
        label: "DigiCert",
        value: "https://acme.digicert.com/v2/acme/directory",
      },
      { label: "Sectigo", value: "https://acme.sectigo.com/v2/DV" },
    ],
  },
  {
    label: "测试环境",
    options: [
      { label: "Pebble (本地测试)", value: "https://localhost:14000/dir" },
    ],
  },
] as const;

export const ACME_SERVERS = ACME_SERVER_GROUPS.flatMap((group) => group.options);

export const CHALLENGE_TYPES = [
  { label: "HTTP-01 (HTTP验证)", value: "HTTP-01" },
  { label: "DNS-01 (DNS验证)", value: "DNS-01" },
];

export const CERT_STATUS = [
  { label: "待验证", value: "pending", type: "warning" },
  { label: "验证中", value: "validating", type: "warning" },
  { label: "有效", value: "valid", type: "success" },
  { label: "已过期", value: "expired", type: "danger" },
  { label: "已吊销", value: "revoked", type: "danger" },
  { label: "失败", value: "failed", type: "danger" },
];

export const ACCOUNT_STATUS = [
  { label: "有效", value: "valid", type: "success" },
  { label: "已停用", value: "deactivated", type: "warning" },
  { label: "已吊销", value: "revoked", type: "danger" },
];

export interface EabServerConfig {
  serverUrl: string;
  name: string;
  eabUrl: string;
  eabTip: string;
}

export const EAB_SERVER_CONFIGS: EabServerConfig[] = [
  {
    serverUrl: "https://acme.hi.cn/directory",
    name: "HiCA",
    eabUrl: "https://www.hi.cn/user/ssl",
    eabTip: "登录 HiCA 后在 SSL 证书管理页面获取 ACME 凭证",
  },
  {
    serverUrl: "https://acme.zerossl.com/v2/DV90",
    name: "ZeroSSL",
    eabUrl: "https://app.zerossl.com/developer",
    eabTip: "登录后在 Developer 页面生成 EAB Credentials",
  },
  {
    serverUrl: "https://acme.ssl.com/sslcom-dv-rsa",
    name: "SSL.com (RSA)",
    eabUrl: "https://www.ssl.com/how-to/obtain-eab-credentials-for-ssl-com-acme/",
    eabTip: "登录后在账户设置中获取 ACME 凭证",
  },
  {
    serverUrl: "https://acme.ssl.com/sslcom-dv-ecc",
    name: "SSL.com (ECC)",
    eabUrl: "https://www.ssl.com/how-to/obtain-eab-credentials-for-ssl-com-acme/",
    eabTip: "登录后在账户设置中获取 ACME 凭证",
  },
  {
    serverUrl: "https://dv.acme-v02.api.pki.goog/directory",
    name: "Google Trust Services",
    eabUrl: "https://cloud.google.com/certificate-manager/docs/public-ca-tutorial",
    eabTip: "在 Google Cloud Console 中启用 Public CA 并获取凭证",
  },
  {
    serverUrl: "https://dv.acme-v02.test-api.pki.goog/directory",
    name: "Google Trust Services (测试)",
    eabUrl: "https://cloud.google.com/certificate-manager/docs/public-ca-tutorial",
    eabTip: "在 Google Cloud Console 中启用 Public CA 并获取凭证",
  },
];

export function isEabRequired(serverUrl: string): boolean {
  return EAB_SERVER_CONFIGS.some((config) => config.serverUrl === serverUrl);
}

export function getEabConfig(serverUrl: string): EabServerConfig | undefined {
  return EAB_SERVER_CONFIGS.find((config) => config.serverUrl === serverUrl);
}
