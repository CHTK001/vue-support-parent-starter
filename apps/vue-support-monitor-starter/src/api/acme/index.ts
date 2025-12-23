/**
 * ACME 证书管理 API
 * 提供证书申请、续签、吊销、下载等完整的证书生命周期管理功能
 *
 * @author CH
 * @since 2025-12-06
 */

import { http } from "@repo/utils";
import { loadRouterBase } from "../config";

// ======================== 类型定义 ========================

/** ACME 账户 */
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

/** ACME 证书 */
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

/** ACME 订单 */
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

/** 证书详情 VO */
export interface AcmeCertificateDetail {
  certificate: AcmeCertificate;
  account?: AcmeAccount;
  orders?: AcmeOrder[];
  daysUntilExpiry?: number;
  soonExpiring?: boolean;
}

/** 证书统计 */
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

/** 申请证书请求 */
export interface ApplyCertRequest {
  acmeAccountId: number;
  primaryDomain: string;
  sanDomains?: string[];
  challengeType: string;
}

// ======================== 账户管理 API ========================

/**
 * 分页查询 ACME 账户列表
 * @param params 查询参数
 */
export function getAccountPage(params: Record<string, unknown>) {
  return http.get("/v1/cert/account/page", { params });
}

/**
 * 查询所有 ACME 账户列表
 */
export function getAccountList() {
  return http.get("/v1/cert/account/list");
}

/**
 * 获取 ACME 账户详情
 * @param accountId 账户ID
 */
export function getAccountDetail(accountId: number) {
  return http.get(`/v1/cert/account/${accountId}`);
}

/**
 * 保存/更新 ACME 账户
 * @param data 账户数据
 */
export function saveAccount(data: AcmeAccount) {
  return http.post("/v1/cert/account/save", data);
}

/**
 * 删除 ACME 账户
 * @param accountId 账户ID
 */
export function deleteAccount(accountId: number) {
  return http.delete(`/v1/cert/account/${accountId}`);
}

// ======================== 证书管理 API ========================

/**
 * 分页查询证书列表
 * @param params 查询参数
 */
export function getCertPage(params: Record<string, unknown>) {
  return http.get("/v1/cert/page", { params });
}

/**
 * 获取证书详情
 * @param certId 证书ID
 */
export function getCertDetail(certId: number) {
  return http.get(`/v1/cert/${certId}`);
}

/**
 * 申请证书
 * @param data 申请参数
 */
export function applyCert(data: ApplyCertRequest) {
  return http.post("/v1/cert/apply", data);
}

/**
 * 续签证书
 * @param certId 证书ID
 */
export function renewCert(certId: number) {
  return http.post(`/v1/cert/${certId}/renew`);
}

/**
 * 吊销证书
 * @param certId 证书ID
 */
export function revokeCert(certId: number) {
  return http.post(`/v1/cert/${certId}/revoke`);
}

/**
 * 删除证书
 * @param certId 证书ID
 */
export function deleteCert(certId: number) {
  return http.delete(`/v1/cert/${certId}`);
}

/**
 * 下载证书文件
 * @param certId 证书ID
 * @param fileType 文件类型: cert/key/chain
 */
export function downloadCert(certId: number, fileType: string = "cert") {
  return loadRouterBase(`/v1/cert/${certId}/download`, { fileType });
}

/**
 * 获取证书统计信息
 */
export function getCertStats() {
  return http.get("/v1/cert/stats");
}

/**
 * 手动触发续签检查
 */
export function triggerRenewCheck() {
  return http.post("/v1/cert/renew-check");
}

// ======================== 订单管理 API ========================

/**
 * 查询证书关联的订单列表
 * @param certId 证书ID
 */
export function getCertOrders(certId: number) {
  return http.get(`/v1/cert/${certId}/orders`);
}

// ======================== 常量定义 ========================

/** ACME 服务器分组列表 */
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
];

/** ACME 服务器扁平列表（兼容旧代码） */
export const ACME_SERVERS = ACME_SERVER_GROUPS.flatMap(
  (group) => group.options
);

/** 验证类型 */
export const CHALLENGE_TYPES = [
  { label: "HTTP-01 (HTTP验证)", value: "HTTP-01" },
  { label: "DNS-01 (DNS验证)", value: "DNS-01" },
];

/** 证书状态 */
export const CERT_STATUS = [
  { label: "待验证", value: "pending", type: "warning" },
  { label: "验证中", value: "validating", type: "info" },
  { label: "有效", value: "valid", type: "success" },
  { label: "已过期", value: "expired", type: "danger" },
  { label: "已吊销", value: "revoked", type: "danger" },
  { label: "失败", value: "failed", type: "danger" },
];

/** 账户状态 */
export const ACCOUNT_STATUS = [
  { label: "有效", value: "valid", type: "success" },
  { label: "已停用", value: "deactivated", type: "warning" },
  { label: "已吊销", value: "revoked", type: "danger" },
];

/** 需要 EAB (External Account Binding) 的 ACME 服务器配置 */
export interface EabServerConfig {
  /** ACME 服务器地址 */
  serverUrl: string;
  /** CA 名称 */
  name: string;
  /** 获取 EAB 凭证的链接 */
  eabUrl: string;
  /** 获取说明 */
  eabTip: string;
}

/** 需要 EAB 的服务器配置列表 */
export const EAB_SERVER_CONFIGS: EabServerConfig[] = [
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

/**
 * 检查服务器是否需要 EAB
 * @param serverUrl ACME 服务器地址
 */
export function isEabRequired(serverUrl: string): boolean {
  return EAB_SERVER_CONFIGS.some((c) => c.serverUrl === serverUrl);
}

/**
 * 获取服务器的 EAB 配置信息
 * @param serverUrl ACME 服务器地址
 */
export function getEabConfig(serverUrl: string): EabServerConfig | undefined {
  return EAB_SERVER_CONFIGS.find((c) => c.serverUrl === serverUrl);
}
