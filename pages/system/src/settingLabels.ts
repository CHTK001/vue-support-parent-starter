/**
 * 内置配置项的「中文短标签」映射。
 *
 * 背景：smtp / sms 等分组的 sys_setting_name 必须与 SmtpSetting / SmsSetting
 * POJO 字段名一致（后端按 name 绑定），因此 name 保持英文机器键；业务界面通过
 * 稳定的 sys_setting_code（少数无 code 的用 '@' + name）映射为中文短标签。
 *
 * 第三方登录渠道（alipay / wechat / dingtalk …）是另一种情况：库里这些行的
 * sys_setting_code 为空串，name 只有 clientId / clientSecret / redirectUri 三个
 * 通用键，靠 code 或全局 name 都识别不出属于哪个渠道 —— 所以按「分组 + name」
 * 二级映射（GROUP_LABELS），渠道清单见 THIRD_PARTY_SETTING_GROUPS。
 *
 * 用户在「配置管理」中自建的配置不在此表内，回退显示其 code / name。
 */
import type { SysSetting } from "./api/types";

/**
 * 第三方登录 / 集成渠道的分组 code。
 *
 * <p>库里的分组是按渠道 code 平铺的（alipay / dingtalk / wechat…），
 * 配置管理页的分组归类、图标、描述与中文名都以本清单为准，
 * 新增渠道时只加这里，避免各页面各维护一份而漂移。</p>
 */
export const THIRD_PARTY_SETTING_GROUPS: readonly string[] = [
  "alipay",
  "baidu",
  "dingtalk",
  "douyin",
  "feishu",
  "gitee",
  "github",
  "google",
  "microsoft",
  "oidc",
  "qq",
  "sso",
  "taobao",
  "wechat",
  "wechat_enterprise",
  "wechat_mp",
  "weibo",
];

/** 全局唯一 code（或 '@' + name）→ 中文短标签 */
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
  "@SystemName": "系统名称",

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

  /* config 连接配置 / 安全与外观 */
  "socket.enable": "启用连接",
  "socket.urls": "服务地址",
  "socket.context": "路径",
  "socket.protocol": "协议",
  "security.dynamicFont.enable": "动态字体（防 OCR）",
  "@CodecRequestOpen": "请求体加密",
  "@CodecRequestKey": "请求加密密钥",
  "@CodecResponseOpen": "响应体加密",
  "@WatermarkOpen": "启用水印",
  "@WatermarkColor": "水印颜色",
  "@WatermarkAlpha": "水印透明度",
  "@WatermarkRotate": "水印旋转角度",
  "@Version": "前端版本号",

  /* schedule 定时任务 */
  "schedule.task.announcement-status.enabled": "公告状态任务 · 启用",
  "schedule.task.announcement-status.cron": "公告状态任务 · 执行周期",
};

/**
 * 分组内同名键 → 中文短标签。
 *
 * <p>用于「一个 name 在不同分组里含义不同」或「name 太泛不能全局唯一」的场景：
 * 渠道凭据组里的 clientId 是应用 ID，单点登录组里的 Gitee 是开关。</p>
 */
const CHANNEL_CREDENTIAL_LABELS: Record<string, string> = {
  clientId: "应用 ID",
  clientSecret: "应用密钥",
  redirectUri: "回调地址",
  issuerUri: "签发者地址",
  scope: "授权范围",
};

const SSO_SWITCH_LABELS: Record<string, string> = {
  Gitee: "Gitee 登录",
  Github: "GitHub 登录",
  Google: "Google 登录",
  Oidc: "OIDC 单点登录",
  Wechat: "微信登录",
  Wechat_mp: "微信公众号登录",
  Wechat_enterprise: "企业微信登录",
  Qq: "QQ 登录",
  Alipay: "支付宝登录",
  Dingtalk: "钉钉登录",
  Weibo: "微博登录",
  Baidu: "百度登录",
  Microsoft: "微软登录",
  Taobao: "淘宝登录",
  Douyin: "抖音登录",
  Feishu: "飞书登录",
};

export const GROUP_LABELS: Record<string, Record<string, string>> = {
  sso: SSO_SWITCH_LABELS,
  userAgreement: {
    title: "协议标题",
    label: "协议副标题",
    headline: "头部说明",
    description: "协议摘要",
    version: "协议版本",
    updatedAt: "更新时间",
    "section.scope": "使用范围",
    "section.account": "账号责任",
    "section.data": "数据合规",
    "section.feedback": "异常反馈",
  },
  ...Object.fromEntries(
    THIRD_PARTY_SETTING_GROUPS.filter((g) => g !== "sso").map((g) => [g, CHANNEL_CREDENTIAL_LABELS]),
  ),
};

/** 返回配置项的中文短标签；无映射时回退到 code / name。 */
export function settingLabel(row: Partial<SysSetting> | null | undefined): string {
  if (!row) return "";
  const code = row.sysSettingCode;
  if (code && SETTING_LABELS[code]) return SETTING_LABELS[code];
  const name = row.sysSettingName;
  if (name && row.sysSettingGroup) {
    const scoped = GROUP_LABELS[row.sysSettingGroup]?.[name];
    if (scoped) return scoped;
  }
  if (name && SETTING_LABELS[`@${name}`]) return SETTING_LABELS[`@${name}`];
  return code || name || "";
}
