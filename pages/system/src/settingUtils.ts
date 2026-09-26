/**
 * 系统配置（sys_setting）共享工具：类型归一、类型标签、值校验。
 * 供 SettingManage.vue 与 SettingValueEditor.vue 复用。
 */

export const settingTypeOptions = [
  { label: "字符串", value: "STRING" },
  { label: "多行文本", value: "TEXTAREA" },
  { label: "数字", value: "NUMBER" },
  { label: "布尔", value: "BOOLEAN" },
  { label: "JSON", value: "JSON" },
  { label: "密码", value: "PASSWORD" },
  { label: "颜色", value: "COLOR" },
  { label: "数组", value: "ARRAY" },
];

/** 库内历史类型值 -> 中文展示名 */
export const typeLabelMap: Record<string, string> = {
  STRING: "字符串",
  TEXT: "字符串",
  TEXTAREA: "多行文本",
  NUMBER: "数字",
  BOOLEAN: "布尔",
  JSON: "JSON",
  COLOR: "颜色",
  PASSWORD: "密码",
  ARRAY: "数组",
};

/** 库内值类型大小写/别名不统一（TEXT / String / BOOL / Boolean / TextArea），归一到控件分支使用的大写键 */
export function normType(type?: string | null): string {
  const t = String(type ?? "").toUpperCase();
  if (!t || t === "NULL") return "STRING";
  if (t === "BOOL" || t === "BOOLEAN") return "BOOLEAN";
  if (t === "TEXTAREA" || t === "TEXT_AREA" || t === "LONGTEXT") return "TEXTAREA";
  if (t === "STRING" || t === "TEXT" || t === "VARCHAR" || t === "CHAR") return "STRING";
  if (t === "NUMBER" || t === "INT" || t === "INTEGER" || t === "FLOAT" || t === "DOUBLE" || t === "DECIMAL") return "NUMBER";
  return t;
}

export function typeLabel(type?: string | null): string {
  const n = normType(type);
  return typeLabelMap[n] ?? String(type ?? "字符串");
}

/**
 * 校验单个配置值，返回错误文案；无错误返回空串。
 * 覆盖：数字格式、JSON/数组结构、sysSettingValidate 正则规则。
 */
export function validateSettingValue(row: {
  sysSettingValueType?: string | null;
  sysSettingValue?: string | null;
  sysSettingValidate?: string | null;
}): string {
  const t = normType(row.sysSettingValueType);
  const v = row.sysSettingValue;
  if (t === "NUMBER") {
    if (v != null && v !== "" && Number.isNaN(Number(v))) return "请输入有效数字";
  }
  if (t === "JSON" || t === "ARRAY") {
    if (v) {
      try {
        JSON.parse(v);
      } catch {
        return t === "ARRAY" ? "数组需为合法 JSON（如 [1,2]）" : "JSON 格式不正确";
      }
    }
  }
  if (row.sysSettingValidate) {
    try {
      const re = new RegExp(row.sysSettingValidate);
      if (v && !re.test(v)) return "内容不符合校验规则";
    } catch {
      /* 后端配置的正则非法时忽略，避免阻断编辑 */
    }
  }
  return "";
}
