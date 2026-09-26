/**
 * 内置配置项的「中文短标签」映射。
 *
 * 背景：smtp / sms 等分组的 sys_setting_name 必须与 SmtpSetting / SmsSetting
 * POJO 字段名一致（后端按 name 绑定），因此 name 保持英文机器键；业务界面通过
 * 稳定的 sys_setting_code（少数无 code 的用 '@' + name）映射为中文短标签。
 *
 * 用户在「配置管理」中自建的配置不在此表内，回退显示其 name。
 */
import type { SysSetting } from "./api/types";

export const SETTING_LABELS: Record<string, string> = {
  /* default 界面与登录 */
  "login.brandName": "品牌名称",
  "login.welcome": "欢迎语",
  "login.description": "系统描述",
  "login.captcha": "图形验证码",
  "@SlidingBlockOpen": "滑块验证",
  "@OpenSmsLogin": "短信登录",
  "login.logoUrl": "品牌 Logo",
  "login.imageUrl": "主视觉图片",
  "login.avatarUrl": "默认头像",
  "login.beiAnHao": "备案号",
  "login.featureTags": "功能特性标签",
  "other.avatarFrame.enable": "头像框",
  "other.personalConfig.enable": "个性化配置",

  /* smtp 邮件服务 */
  "smtp.host": "主机",
  "smtp.port": "端口",
  "smtp.username": "登录账号",
  "smtp.from": "发件邮箱",
  "smtp.password": "密码/授权码",
  "smtp.auth": "登录认证",
  "smtp.starttls": "STARTTLS 升级",
  "smtp.sslEnable": "SSL 加密",
  "smtp.imapHost": "IMAP 主机",
  "smtp.imapPort": "IMAP 端口",

  /* sms 短信服务 */
  "sms.appType": "服务商",
  "sms.appId": "App ID",
  "sms.appSecret": "App 密钥",
  "sms.appSign": "短信签名",

  /* config 连接配置 */
  "socket.enable": "启用连接",
  "socket.urls": "服务地址",
  "socket.context": "路径",
  "socket.protocol": "协议",

  /* userAgreement 用户协议（code 由 V1.1 迁移补齐） */
  "agreement.title": "协议标题",
  "agreement.label": "协议副标题",
  "agreement.headline": "头部说明",
  "agreement.description": "协议摘要",
  "agreement.version": "协议版本",
  "agreement.updatedAt": "更新时间",
  "agreement.section.scope": "使用范围",
  "agreement.section.account": "账号责任",
  "agreement.section.data": "数据合规",
  "agreement.section.feedback": "异常反馈",
};

/** 返回配置项的中文短标签；无映射时回退到 code / name。 */
export function settingLabel(row: Partial<SysSetting> | null | undefined): string {
  if (!row) return "";
  const code = row.sysSettingCode;
  if (code && SETTING_LABELS[code]) return SETTING_LABELS[code];
  const name = row.sysSettingName;
  if (name && SETTING_LABELS[`@${name}`]) return SETTING_LABELS[`@${name}`];
  return code || name || "";
}
