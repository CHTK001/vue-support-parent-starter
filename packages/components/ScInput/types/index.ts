/**
 * 输入类型
 */
export enum InputType {
  TEXT = "text",
  TEXTAREA = "textarea",
  NUMBER = "number",
  PASSWORD = "password",
  SEARCH = "search",
  TEL = "tel",
  URL = "url",
  EMAIL = "email",
  DATE = "date",
  DATETIME = "datetime",
  MONTH = "month",
  WEEK = "week",
  TIME = "time",
  YEAR = "year",
  DATETIME_RANGE = "datetimerange",
  DATE_RANGE = "daterange",
  MONTH_RANGE = "monthrange",
  WEEK_RANGE = "weekrange",
  TIME_RANGE = "timerange",
  COLOR = "color",
  IP = "ip",
  BOOLEAN = "boolean",
  DICT = "dict",
  CARD = "card",
  CAPTCHA = "captcha",
  SELECT = "select",
  TOTP = "totp",
  RICHTEXT = "richtext",
  LIST = "list",
  ARRAY = "array"
}

export default InputType;
