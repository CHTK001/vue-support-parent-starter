import { getProjectVendorOptions } from "@pages/project/constants/project-fixed-dicts";

export type DeviceVendorMeta = {
  code: string;
  label: string;
  family: string;
  icon: string;
  tone: "primary" | "success" | "warning" | "danger" | "info";
};

type VendorOption = {
  label: string;
  value: string;
};

const normalizeToken = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "")
    .toUpperCase();

const DEVICE_VENDOR_META: Record<string, DeviceVendorMeta> = {
  HIKVISION_YUNYAO: {
    code: "HIKVISION_YUNYAO",
    label: "海康云耀",
    family: "hik-yunyao",
    icon: "mdi:sun-wireless-outline",
    tone: "primary",
  },
  HIKVISION_YUNMOU: {
    code: "HIKVISION_YUNMOU",
    label: "海康云眸",
    family: "hik-yunmou",
    icon: "mdi:cloud-outline",
    tone: "primary",
  },
  HIKVISION_ISECURE: {
    code: "HIKVISION_ISECURE",
    label: "海康 iSecure",
    family: "hik-isecure",
    icon: "mdi:shield-lock-outline",
    tone: "primary",
  },
  DAHUA_DSS: {
    code: "DAHUA_DSS",
    label: "大华 DSS",
    family: "dahua",
    icon: "mdi:cctv",
    tone: "warning",
  },
  UNIVIEW: {
    code: "UNIVIEW",
    label: "宇视",
    family: "uniview",
    icon: "mdi:eye-outline",
    tone: "success",
  },
  HUAWEI_IVS: {
    code: "HUAWEI_IVS",
    label: "华为机器视觉",
    family: "huawei",
    icon: "mdi:camera-wireless-outline",
    tone: "danger",
  },
  HUAWEI: {
    code: "HUAWEI",
    label: "华为云",
    family: "huawei",
    icon: "mdi:server-outline",
    tone: "danger",
  },
  EZVIZ: {
    code: "EZVIZ",
    label: "萤石",
    family: "ezviz",
    icon: "mdi:camera-outline",
    tone: "info",
  },
  TIANDY: {
    code: "TIANDY",
    label: "天地伟业",
    family: "tiandy",
    icon: "mdi:video-vintage",
    tone: "info",
  },
  ZTE: {
    code: "ZTE",
    label: "中兴",
    family: "zte",
    icon: "mdi:router-wireless",
    tone: "primary",
  },
};

const DEVICE_VENDOR_LOOKUP = new Map<string, string>();

const registerLookup = (canonicalCode: string, ...aliases: string[]) => {
  const meta = DEVICE_VENDOR_META[canonicalCode];
  if (!meta) {
    return;
  }
  [canonicalCode, meta.label, ...aliases].forEach((token) => {
    if (!token) {
      return;
    }
    DEVICE_VENDOR_LOOKUP.set(normalizeToken(token), canonicalCode);
  });
};

registerLookup("HIKVISION_YUNYAO", "HAI_KANG_YUN_YAO", "YUN_YAO", "云耀", "云曜", "1", "2");
registerLookup("HIKVISION_YUNMOU", "YUN_MOU", "云眸", "3");
registerLookup("HIKVISION_ISECURE", "HAI_KANG", "HIKVISION", "海康", "4");
registerLookup("DAHUA_DSS", "DA_HUA", "DAHUA", "大华", "5");
registerLookup("UNIVIEW", "YU_SHI", "宇视", "6");
registerLookup("HUAWEI_IVS", "HUA_WEI_IVS", "华为机器视觉", "7");
registerLookup("HUAWEI", "HUA_WEI", "华为", "8");
registerLookup("EZVIZ", "萤石", "9");
registerLookup("TIANDY", "天地伟业", "10");
registerLookup("ZTE", "中兴", "11");

export const resolveDeviceVendorCode = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  const normalized = normalizeToken(raw);
  if (DEVICE_VENDOR_LOOKUP.has(normalized)) {
    return DEVICE_VENDOR_LOOKUP.get(normalized) || "";
  }

  return raw.toUpperCase();
};

const rawVendorOptions = getProjectVendorOptions("DEVICE");
const canonicalVendorOptions = new Map<string, VendorOption>();

rawVendorOptions.forEach((item, index) => {
  const rawCode = String(item.sysDictItemCode || item.sysDictItemId || "");
  const canonicalCode = resolveDeviceVendorCode(rawCode || String(index + 1));
  if (!canonicalCode || canonicalVendorOptions.has(canonicalCode)) {
    return;
  }
  const meta = DEVICE_VENDOR_META[canonicalCode];
  canonicalVendorOptions.set(canonicalCode, {
    label: meta?.label || item.sysDictItemName || canonicalCode,
    value: canonicalCode,
  });
});

export const getDeviceVendorOptions = (): VendorOption[] =>
  Array.from(canonicalVendorOptions.values()).map((item) => ({ ...item }));

export const getDeviceVendorMeta = (value: unknown): DeviceVendorMeta => {
  const code = resolveDeviceVendorCode(value);
  return DEVICE_VENDOR_META[code] || {
    code,
    label: code || "未知厂商",
    family: "default",
    icon: "mdi:key-chain-variant",
    tone: "info",
  };
};

export const getDeviceVendorFamily = (value: unknown): string => getDeviceVendorMeta(value).family;

export const getDeviceVendorIcon = (value: unknown): string => getDeviceVendorMeta(value).icon;

export const getDeviceVendorTone = (value: unknown): DeviceVendorMeta["tone"] =>
  getDeviceVendorMeta(value).tone;
