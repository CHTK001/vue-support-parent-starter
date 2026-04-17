import fixedDicts from "./project-fixed-dicts.min.json";

type VendorScene = "DEVICE" | "AI" | "SMS";
type TemplateCategoryType = "sms" | "email";

type LegacyDictItem = {
  sysDictItemId: string | number;
  sysDictItemCode: string;
  sysDictItemName: string;
  sysDictItemIcon?: string;
};

const toLegacyDictItem = (
  code: string,
  label: string,
  id: string | number = code,
): LegacyDictItem => ({
  sysDictItemId: id,
  sysDictItemCode: code,
  sysDictItemName: label,
});

export const getProjectVendorOptions = (scene?: VendorScene): LegacyDictItem[] =>
  (fixedDicts.projectVendorOptions ?? [])
    .filter((item) => !scene || item.scenes?.includes(scene))
    .map((item) => toLegacyDictItem(item.code, item.label));

export const getTemplateCategoryOptions = (
  type: TemplateCategoryType,
): LegacyDictItem[] =>
  (fixedDicts.templateCategoryOptions?.[type] ?? []).map((item) =>
    toLegacyDictItem(item.code, item.label, item.value),
  );

const secretFunctionOptions: LegacyDictItem[] = [
  toLegacyDictItem("SHE_BEI", "设备能力"),
  toLegacyDictItem("DUAN_XIN", "短信能力"),
  toLegacyDictItem("YOU_JIAN", "邮件能力"),
  toLegacyDictItem("DA_YU_YAN", "大语言模型", "DA_YU_YAN"),
  toLegacyDictItem("WEN_SHENG_TU", "文生图", "WEN_SHENG_TU"),
  toLegacyDictItem("WEN_SHENG_SHI_PIN", "文生视频", "WEN_SHENG_SHI_PIN"),
  toLegacyDictItem("COLORIZATION", "图像上色", "COLORIZATION"),
  toLegacyDictItem("RESOLUTION", "图像超分", "RESOLUTION"),
  toLegacyDictItem("OCR", "OCR识别", "OCR"),
  toLegacyDictItem("REN_XIANG_JIAN_CE", "人像检测", "REN_XIANG_JIAN_CE"),
  toLegacyDictItem("TU_XIANG_JIAN_CE", "图像检测", "TU_XIANG_JIAN_CE"),
  toLegacyDictItem("TU_XIANG_SHI_BIE", "图像识别", "TU_XIANG_SHI_BIE"),
  toLegacyDictItem("FACE_PIAN_SHI_BIE", "人脸识别", "FACE_PIAN_SHI_BIE"),
  toLegacyDictItem(
    "TU_XIANG_TE_ZHENG_ZHI",
    "图像特征值",
    "TU_XIANG_TE_ZHENG_ZHI",
  ),
  toLegacyDictItem(
    "REN_XIANG_TE_ZHENG_ZHI",
    "人像特征值",
    "REN_XIANG_TE_ZHENG_ZHI",
  ),
  toLegacyDictItem("TU_XIANG_FENG_GE", "图像风格", "TU_XIANG_FENG_GE"),
].map((item) => ({
  ...item,
  sysDictItemIcon:
    {
      SHE_BEI: "ri:camera-line",
      DUAN_XIN: "ri:message-2-line",
      YOU_JIAN: "ri:mail-line",
      DA_YU_YAN: "ri:robot-2-line",
      WEN_SHENG_TU: "ri:image-ai-line",
      WEN_SHENG_SHI_PIN: "ri:video-ai-line",
      COLORIZATION: "ri:palette-line",
      RESOLUTION: "ri:focus-3-line",
      OCR: "ri:file-search-line",
      REN_XIANG_JIAN_CE: "ri:user-search-line",
      TU_XIANG_JIAN_CE: "ri:scan-2-line",
      TU_XIANG_SHI_BIE: "ri:image-line",
      FACE_PIAN_SHI_BIE: "ri:account-pin-circle-line",
      TU_XIANG_TE_ZHENG_ZHI: "ri:fingerprint-line",
      REN_XIANG_TE_ZHENG_ZHI: "ri:user-star-line",
      TU_XIANG_FENG_GE: "ri:brush-2-line",
    }[item.sysDictItemCode] ?? "ri:apps-line",
}));

export const getSecretFunctionOptions = (): LegacyDictItem[] =>
  secretFunctionOptions.map((item) => ({ ...item }));
