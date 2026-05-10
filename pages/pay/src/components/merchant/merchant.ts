import { ElMessage } from "element-plus";
import type { MerchantChannel } from "../../types/payment";
import { ChannelStatusMap, ChannelSubTypeOptions, ChannelTypeMap } from "../../types/payment";
import { normalizeTableResult } from "../../utils/format";

/* ── Types ── */

export type MerchantCapabilityKey =
  | "paymentSplitTableEnabled"
  | "paymentProfitSharingEnabled"
  | "paymentCouponEnabled";

export type MerchantCapabilityState = {
  paymentSplitTableEnabled: boolean;
  paymentProfitSharingEnabled: boolean;
  paymentCouponEnabled: boolean;
};

export type ChannelExtConfigMap = Record<string, unknown>;

export const KNOWN_CHANNEL_EXT_KEYS = new Set([
  "merchantSerialNumber",
  "refundNotifyUrl",
  "payScoreNotifyUrl",
  "paymentPointNotifyUrl",
  "miniProgramSecret",
  "appSecret",
  "keyPath",
  "serverUrl",
  "charset",
  "format",
  "signType",
]);

/* ── Factory Functions ── */

export function createMerchantForm() {
  return {
    id: undefined as number | undefined,
    merchantName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    businessLicense: "",
    legalPerson: "",
    paymentSplitTableEnabled: false,
    paymentProfitSharingEnabled: false,
    paymentCouponEnabled: false,
    remark: "",
  };
}

export function createChannelForm() {
  return {
    id: undefined as number | undefined,
    merchantId: 0,
    channelType: "",
    channelSubType: "",
    channelName: "",
    appId: "",
    merchantNo: "",
    apiKey: "",
    privateKey: "",
    publicKey: "",
    certPath: "",
    sandboxMode: 0,
    status: 0,
    extConfig: "",
  };
}

export function createWechatChannelConfig() {
  return {
    merchantSerialNumber: "",
    refundNotifyUrl: "",
    payScoreNotifyUrl: "",
    paymentPointNotifyUrl: "",
    miniProgramSecret: "",
    appSecret: "",
    keyPath: "",
  };
}

export function createAlipayChannelConfig() {
  return {
    serverUrl: "",
    charset: "UTF-8",
    format: "json",
    signType: "RSA2",
  };
}

/* ── Utility Helpers ── */

export function equalsIgnoreCase(source?: string, target?: string) {
  return String(source || "").toLowerCase() === String(target || "").toLowerCase();
}

export function parseChannelExtConfig(extConfig?: string): ChannelExtConfigMap {
  if (!String(extConfig || "").trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(extConfig || "{}");
    return parsed && typeof parsed === "object" ? (parsed as ChannelExtConfigMap) : {};
  } catch (error) {
    console.error(error);
    ElMessage.warning("检测到历史 extConfig 不是标准 JSON，已忽略无法识别的字段");
    return {};
  }
}

export function textOf(value: unknown) {
  return value == null ? "" : String(value);
}

export function numberOf(value: unknown) {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/* ── Pure Config Helpers ── */

export function appendText(target: ChannelExtConfigMap, key: string, value?: string) {
  const text = String(value || "").trim();
  if (text) {
    target[key] = text;
  }
}

export function appendNumber(target: ChannelExtConfigMap, key: string, value?: number) {
  if (value != null && Number.isFinite(value)) {
    target[key] = value;
  }
}

/* ── Capability Helpers ── */

export function buildMerchantCapabilityCards(state: MerchantCapabilityState) {
  return [
    {
      key: "paymentSplitTableEnabled" as MerchantCapabilityKey,
      title: "自动分表",
      subtitle: "订单与流水定时建表",
      description: "为订单与流水分区、迁移能力预留开关。",
      icon: "ri:table-2",
      theme: "primary" as const,
      active: state.paymentSplitTableEnabled,
      tagType: state.paymentSplitTableEnabled ? "primary" : "info",
    },
    {
      key: "paymentProfitSharingEnabled" as MerchantCapabilityKey,
      title: "自动分账",
      subtitle: "后续收益分账能力",
      description: "为收益表和自动分账能力预留开关。",
      icon: "ri:exchange-funds-line",
      theme: "success" as const,
      active: state.paymentProfitSharingEnabled,
      tagType: state.paymentProfitSharingEnabled ? "success" : "info",
    },
    {
      key: "paymentCouponEnabled" as MerchantCapabilityKey,
      title: "优惠功能",
      subtitle: "后续优惠券与营销",
      description: "为优惠券和支付营销能力预留开关。",
      icon: "ri:coupon-2-line",
      theme: "warning" as const,
      active: state.paymentCouponEnabled,
      tagType: state.paymentCouponEnabled ? "warning" : "info",
    },
  ];
}

export function toggleMerchantCapability(state: MerchantCapabilityState, key: MerchantCapabilityKey) {
  state[key] = !state[key];
}

/* ── Format Helpers ── */

export function formatChannelType(channelType?: string) {
  if (!channelType) {
    return "-";
  }
  return ChannelTypeMap[channelType] || channelType;
}

export function formatChannelSubType(channelType?: string, channelSubType?: string) {
  if (!channelSubType) {
    return "-";
  }
  const option = (ChannelSubTypeOptions[channelType || ""] || []).find((item) => item.value === channelSubType);
  return option?.label || channelSubType;
}

export function merchantStatusTag(status?: number) {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "info";
  return "";
}

export function resolveChannelDisplayName(source: { channelType?: string; channelSubType?: string }) {
  const channelType = String(source.channelType || "").toUpperCase();
  const channelSubType = String(source.channelSubType || "").toUpperCase();

  if (channelType === "WECHAT") {
    if (channelSubType === "JSAPI") return "微信 JSAPI";
    if (channelSubType === "MINI_PROGRAM" || channelSubType === "MINIPROGRAM") return "微信小程序";
    if (channelSubType === "H5") return "微信 H5";
    if (channelSubType === "APP") return "微信 APP";
    if (channelSubType === "NATIVE") return "微信 Native";
    return "微信支付";
  }

  if (channelType === "ALIPAY") {
    if (channelSubType === "WEB" || channelSubType === "PAY_WEB") return "支付宝电脑网站";
    if (channelSubType === "WAP" || channelSubType === "PAY_WAP") return "支付宝手机网站";
    if (channelSubType === "APP") return "支付宝 APP";
    return "支付宝";
  }

  if (channelType === "WALLET") {
    return "钱包";
  }

  return formatChannelType(channelType);
}

export function resolveChannelTypeDetail(token: string) {
  const [type, subType] = token.split(":");
  if (!type || !subType) return token;
  return resolveChannelDisplayName({ channelType: type, channelSubType: subType });
}

export function showChannelAlias(row: MerchantChannel) {
  const alias = String(row.channelName || "").trim();
  if (!alias) {
    return false;
  }
  return alias !== resolveChannelDisplayName(row);
}

export function normalizeStatusToken(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function isChannelDeleted(row: MerchantChannel) {
  return ["DELETED", "DELETE", "REMOVED"].includes(normalizeStatusToken(row.statusDesc));
}

export function isChannelEnabled(row: MerchantChannel) {
  return !isChannelDeleted(row) && Number(row.status) === 1;
}

export function channelStatusTag(row: MerchantChannel) {
  if (isChannelDeleted(row)) {
    return "danger";
  }
  return isChannelEnabled(row) ? "success" : "info";
}

export function formatChannelStatus(row: MerchantChannel) {
  const normalized = normalizeStatusToken(row.statusDesc);
  if (["DELETED", "DELETE", "REMOVED"].includes(normalized)) return "已删除";
  if (["ENABLE", "ENABLED"].includes(normalized)) return "已启用";
  if (["DISABLE", "DISABLED"].includes(normalized)) return "已禁用";
  return row.statusDesc || ChannelStatusMap[row.status] || "-";
}

export function resolveChannelIcon(channelType?: string) {
  const type = String(channelType || "").toUpperCase();
  if (type.startsWith("WECHAT")) return "微";
  if (type.startsWith("ALIPAY")) return "支";
  if (type.startsWith("WALLET")) return "钱";
  return type.charAt(0);
}

export function resolveChannelTone(channelType?: string) {
  const type = String(channelType || "").toUpperCase();
  if (type === "WECHAT") return "wechat";
  if (type === "ALIPAY") return "alipay";
  if (type === "WALLET") return "wallet";
  return "default";
}

export function resolveCredentialSummary(row: MerchantChannel) {
  if (String(row.channelType || "").toUpperCase() === "WALLET") {
    return "内建钱包能力";
  }
  const count = [row.apiKeyConfigured, row.privateKeyConfigured, row.publicKeyConfigured, row.certConfigured].filter(Boolean).length;
  return `${count}/4 已配置`;
}

export function resolveCallbackMode(row: MerchantChannel) {
  if (row.notifyUrl && row.returnUrl) return "结果回调 + 回跳已覆盖";
  if (row.notifyUrl) return "结果回调已覆盖";
  if (row.returnUrl) return "浏览器回跳已覆盖";
  return "沿用商户默认";
}

export function resolveChannelMode(row: MerchantChannel) {
  const type = String(row.channelType || "").toUpperCase();
  if (type === "WALLET") return "站内钱包直扣";
  return row.sandboxMode === 1 ? "沙箱联调" : "正式执行";
}

export function buildChannelSummary(row: MerchantChannel) {
  const extConfig = parseChannelExtConfig(row.extConfig);
  const summary: Array<{ label: string; value: string }> = [];

  if (String(row.channelType).toUpperCase() === "WECHAT") {
    if (extConfig.merchantSerialNumber) {
      summary.push({ label: "商户证书序列号", value: textOf(extConfig.merchantSerialNumber) });
    }
    if (extConfig.refundNotifyUrl) {
      summary.push({ label: "退款回调地址", value: textOf(extConfig.refundNotifyUrl) });
    }
  }

  if (String(row.channelType).toUpperCase() === "ALIPAY") {
    if (extConfig.serverUrl) {
      summary.push({ label: "网关地址", value: textOf(extConfig.serverUrl) });
    }
    summary.push({ label: "签名算法", value: textOf(extConfig.signType) || "RSA2" });
  }

  return summary;
}

export function describeChannelPurpose(row: MerchantChannel) {
  const type = String(row.channelType || "").toUpperCase();
  if (type === "WECHAT") {
    return "适合公众号、小程序、H5 和 Native 收银场景。";
  }
  if (type === "ALIPAY") {
    return "适合网站、WAP 和 APP 支付发起。";
  }
  if (type === "WALLET") {
    return "直接走站内余额账户，不依赖外部支付平台。";
  }
  return "当前支付方式用于承接业务订单支付。";
}

/* ── Table Data Helper ── */

export function wrapCardData<T>(items: T[]) {
  return normalizeTableResult(items, items.length);
}
