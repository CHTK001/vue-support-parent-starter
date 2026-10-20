import { http, unwrapResult } from "@repo/utils";

/**
 * ACME 证书管理 API
 *
 * 独立 ACME 后端（spring-api-support-monitor-starter）默认上下文 /monitor/api。
 * 页面通过 vite 代理 /monitor/api/* 转发，生产环境由部署网关做同样的前缀转发。
 *
 * @author CH
 * @since 4.0.0.42
 */

const BASE = "/monitor/api/v1/cert";

const unwrap = <T>(res: unknown): T => unwrapResult<T>(res);

export type AcmeAccount = {
  acmeAccountId?: number;
  acmeAccountEmail: string;
  acmeAccountServer: string;
  acmeAccountProviderType?: string;
  acmeAccountStatus?: string;
  acmeAccountPrivateKeyPem?: string;
  acmeAccountEabKid?: string;
  acmeAccountEabHmacKey?: string;
  acmeAccountRemark?: string;
  createTime?: string;
  updateTime?: string;
};

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
  acmeCertDeployMode?: string;
  acmeCertWebrootPath?: string;
  createTime?: string;
  updateTime?: string;
}

export interface AcmeOrder {
  acmeOrderId?: number;
  acmeAccountId?: number;
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
  curlCommands?: string[];
  daysUntilExpiry?: number | null;
  soonExpiring?: boolean | null;
  currentStep?: number | null;
  stepDescription?: string | null;
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

export interface AcmePageResult<T> {
  records: T[];
  total: number;
  pageNo?: number;
  pageSize?: number;
  totalPage?: number;
}

/**
 * 统一解包分页结果。
 *
 * 后端分页响应可能有两层形态，取决于 http() 的 then 是否已经把 AxiosResponse 剥离：
 *   A) {code:"00000", data:{code:0,msg:"success",data:{pageNo,totalPages,total,data:[...]}}}
 *   B) {code:0,msg:"success",data:{pageNo,totalPages,total,data:[...]}}
 *   C) 已是 PageResult：{pageNo,totalPages,total,data:[...]}
 * 这里循环下钻，直到找到「带数组 data（或 records）+ 数值 total」的那一层，避免多剥/少剥一层。
 */
const unwrapPage = <T>(res: unknown): AcmePageResult<T> => {
  let node: any = unwrap<any>(res);
  for (let i = 0; i < 4 && node && typeof node === "object"; i++) {
    const rows = node.data ?? node.records;
    if (Array.isArray(rows)) {
      return {
        records: rows as T[],
        total: Number(node.total ?? rows.length),
        pageNo: node.pageNo,
        pageSize: node.pageSize,
        totalPage: node.totalPages,
      };
    }
    if (node.data && typeof node.data === "object") {
      node = node.data;
      continue;
    }
    break;
  }
  return { records: [], total: 0 };
};

export type AcmeApplyCertRequest = {
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
};

export interface AcmeDownloadResult {
  fileName: string;
  content: Blob;
}

// ==================== 账户 ====================

export const getAccountPage = (params: Record<string, unknown> = {}) =>
  http()
    .get(`${BASE}/account/page`)
    .query({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      ...params,
    })
    .then(r => unwrapPage<AcmeAccount>(r));

export const getAccountList = () =>
  http().get(`${BASE}/account/list`).then(r => unwrap<AcmeAccount[]>(r));

export const getAccountDetail = (accountId: number) =>
  http().get(`${BASE}/account/${accountId}`).then(r => unwrap<AcmeAccount>(r));

export const saveAccount = (data: AcmeAccount) =>
  http().post(`${BASE}/account/save`).data(data).then(r => unwrap<number>(r));

export const deleteAccount = (accountId: number) =>
  http().delete(`${BASE}/account/${accountId}`).then(r => unwrap<boolean>(r));

// ==================== 证书 ====================

export const getCertPage = (params: Record<string, unknown> = {}) =>
  http()
    .get(`${BASE}/page`)
    .query({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      ...params,
    })
    .then(r => unwrapPage<AcmeCertificate>(r));

export const getCertDetail = (certId: number) =>
  http().get(`${BASE}/${certId}`).then(r => unwrap<AcmeCertificateDetail>(r));

export const applyCert = (data: AcmeApplyCertRequest) =>
  http().post(`${BASE}/apply`).data(data).then(r => unwrap<number>(r));

export const renewCert = (certId: number) =>
  http().post(`${BASE}/${certId}/renew`).then(r => unwrap<boolean>(r));

export const revokeCert = (certId: number) =>
  http().post(`${BASE}/${certId}/revoke`).then(r => unwrap<boolean>(r));

export const deleteCert = (certId: number) =>
  http().delete(`${BASE}/${certId}`).then(r => unwrap<boolean>(r));

export const retryValidation = (certId: number) =>
  http().post(`${BASE}/${certId}/retry-validation`).then(r => unwrap<boolean>(r));

export const triggerRenewCheck = () =>
  http().post(`${BASE}/renew-check`).then(r => unwrap<string>(r));

export const getCertOrders = (certId: number) =>
  http().get(`${BASE}/${certId}/orders`).then(r => unwrap<AcmeOrder[]>(r));

export const getCertStats = () =>
  http().get(`${BASE}/stats`).then(r => unwrap<AcmeCertStats>(r));

/** 下载证书，走统一请求管线以携带鉴权头 */
export const downloadCertFile = async (certId: number, fileType: "cert" | "key" | "chain" = "cert"): Promise<AcmeDownloadResult> => {
  const res = await http()
    .get(`${BASE}/${certId}/download`)
    .query({ fileType })
    .responseType("blob");
  const disposition = String((res.headers as Record<string, string>)?.["content-disposition"] ?? "");
  const matched = /filename="?([^";]+)"?/.exec(disposition);
  return {
    fileName: matched?.[1] || `${certId}_${fileType}.pem`,
    content: res.data as Blob,
  };
};

// ==================== 预设数据 ====================

export interface AcmeServerOption {
  label: string;
  value: string;
  eab?: boolean;
}

export const ACME_SERVER_GROUPS: { label: string; options: AcmeServerOption[] }[] = [
  {
    label: "免费证书",
    options: [
      { label: "Let's Encrypt (生产)", value: "https://acme-v02.api.letsencrypt.org/directory" },
      { label: "Let's Encrypt (测试)", value: "https://acme-staging-v02.api.letsencrypt.org/directory" },
      { label: "ZeroSSL", value: "https://acme.zerossl.com/v2/DV90", eab: true },
      { label: "Buypass (生产)", value: "https://api.buypass.com/acme/directory" },
      { label: "Buypass (测试)", value: "https://api.test4.buypass.no/acme/directory" },
    ],
  },
  {
    label: "Google",
    options: [
      { label: "Google Trust Services", value: "https://dv.acme-v02.api.pki.goog/directory", eab: true },
      { label: "Google Trust Services (测试)", value: "https://dv.acme-v02.test-api.pki.goog/directory", eab: true },
    ],
  },
  {
    label: "商业证书",
    options: [
      { label: "SSL.com (RSA)", value: "https://acme.ssl.com/sslcom-dv-rsa", eab: true },
      { label: "SSL.com (ECC)", value: "https://acme.ssl.com/sslcom-dv-ecc", eab: true },
      { label: "DigiCert", value: "https://acme.digicert.com/v2/acme/directory" },
      { label: "Sectigo", value: "https://acme.sectigo.com/v2/DV" },
    ],
  },
  {
    label: "国内推荐",
    options: [{ label: "HiCA", value: "https://acme.hi.cn/directory", eab: true }],
  },
];

export const ACME_SERVERS = ACME_SERVER_GROUPS.flatMap(g => g.options);

export const isEabRequired = (serverUrl: string): boolean =>
  ACME_SERVERS.some(s => s.value === serverUrl && s.eab);

export const CHALLENGE_TYPES = [
  { label: "HTTP-01（HTTP 验证）", value: "HTTP-01" },
  { label: "DNS-01（DNS 验证）", value: "DNS-01" },
];

export const DEPLOY_MODES = [
  { label: "手动部署", value: "manual" },
  { label: "本机部署", value: "local" },
  { label: "SSH 远程部署", value: "ssh" },
];

export const CERT_STATUS_MAP: Record<string, { label: string; type: "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "待处理", type: "warning" },
  validating: { label: "验证中", type: "warning" },
  valid: { label: "有效", type: "success" },
  expired: { label: "已过期", type: "danger" },
  revoked: { label: "已吊销", type: "info" },
  failed: { label: "失败", type: "danger" },
};

export const ACCOUNT_STATUS_MAP: Record<string, { label: string; type: "success" | "warning" | "danger" | "info" }> = {
  valid: { label: "有效", type: "success" },
  deactivated: { label: "已停用", type: "warning" },
  revoked: { label: "已吊销", type: "danger" },
};

export const certStatusInfo = (status?: string | null) => CERT_STATUS_MAP[String(status ?? "")] ?? { label: status || "未知", type: "info" as const };
export const accountStatusInfo = (status?: string | null) => ACCOUNT_STATUS_MAP[String(status ?? "")] ?? { label: status || "未知", type: "info" as const };
export const serverLabel = (url?: string | null): string => (ACME_SERVERS.find(s => s.value === url)?.label ?? url) || "—";
