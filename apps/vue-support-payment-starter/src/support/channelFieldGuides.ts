import type { PaymentMethodGuide } from "../types/payment";

export interface ChannelFieldGuideLink {
  label: string;
  url: string;
}

export interface ChannelFieldGuideMedia {
  title: string;
  src: string;
  caption: string;
  url?: string;
}

export interface ChannelFieldGuideDefinition {
  fieldKey: string;
  fieldLabel: string;
  headline: string;
  description: string;
  bullets: string[];
  example?: string;
  media: ChannelFieldGuideMedia[];
  links: ChannelFieldGuideLink[];
}

interface ChannelFieldGuideContext {
  fieldKey: string;
  channelType?: string;
  channelSubType?: string;
  guide?: PaymentMethodGuide | null;
}

const GUIDE_MEDIA = {
  alipayHome: {
    title: "支付宝开放平台首页",
    src: "/guide-images/alipay-open-home.png",
    caption: "先在开放平台创建应用，再进入应用详情页复制 AppID、配置密钥和回调地址。",
    url: "https://open.alipay.com/",
  },
  alipayDocs: {
    title: "支付宝产品文档页",
    src: "/guide-images/alipay-product-document.png",
    caption: "产品文档页可对应到电脑网站、手机网站、APP 支付的开通入口和参数说明。",
    url: "https://open.alipay.com/productDocument.htm",
  },
  alipaySupport: {
    title: "支付宝支持中心",
    src: "/guide-images/alipay-support-center.png",
    caption: "沙箱、开发设置和证书/密钥相关排障优先从支持中心进入。",
    url: "https://open.alipay.com/support/supportCenter.htm",
  },
  wechatHome: {
    title: "微信支付官网首页",
    src: "/guide-images/wechat-pay-home.png",
    caption: "先开通商户号，再进入商户平台绑定 AppID、配置 APIv3 Key 和回调地址。",
    url: "https://pay.wechatpay.cn/",
  },
  wechatDocs: {
    title: "微信支付商户文档中心",
    src: "/guide-images/wechat-doc-center.png",
    caption: "产品文档中心能对照 JSAPI、H5、APP、Native 的接入步骤和参数字段。",
    url: "https://pay.wechatpay.cn/doc/v3/merchant/4012791877",
  },
} as const;

function normalizeType(channelType?: string) {
  return (channelType || "").trim().toUpperCase();
}

function normalizeSubType(channelSubType?: string) {
  return (channelSubType || "").trim().toUpperCase();
}

function platformName(channelType?: string) {
  const type = normalizeType(channelType);
  if (type === "WECHAT") {
    return "微信支付";
  }
  if (type === "ALIPAY") {
    return "支付宝";
  }
  if (type === "COMPOSITE") {
    return "综合支付";
  }
  if (type === "WALLET") {
    return "站内钱包";
  }
  return "当前支付方式";
}

function buildGuideLinks(guide?: PaymentMethodGuide | null) {
  const links: ChannelFieldGuideLink[] = [];
  if (guide?.officialUrl) {
    links.push({ label: "官方平台", url: guide.officialUrl });
  }
  if (guide?.applyUrl) {
    links.push({ label: "开通入口", url: guide.applyUrl });
  }
  if (guide?.sandboxUrl) {
    links.push({ label: "沙箱/辅助资料", url: guide.sandboxUrl });
  }
  return links;
}

function buildMedia(channelType?: string) {
  const type = normalizeType(channelType);
  if (type === "ALIPAY") {
    return [GUIDE_MEDIA.alipayHome, GUIDE_MEDIA.alipayDocs, GUIDE_MEDIA.alipaySupport];
  }
  if (type === "WECHAT") {
    return [GUIDE_MEDIA.wechatHome, GUIDE_MEDIA.wechatDocs];
  }
  return [];
}

function withFallbackLinks(links: ChannelFieldGuideLink[], guide?: PaymentMethodGuide | null) {
  return links.length ? links : buildGuideLinks(guide);
}

function genericGuide(
  fieldKey: string,
  fieldLabel: string,
  channelType: string,
  guide: PaymentMethodGuide | null | undefined,
  description: string,
  bullets: string[],
  example?: string,
) {
  return {
    fieldKey,
    fieldLabel,
    headline: `${fieldLabel}填写说明`,
    description,
    bullets,
    example,
    media: buildMedia(channelType),
    links: buildGuideLinks(guide),
  } satisfies ChannelFieldGuideDefinition;
}

export function getChannelFieldGuide({
  fieldKey,
  channelType,
  channelSubType,
  guide,
}: ChannelFieldGuideContext): ChannelFieldGuideDefinition | null {
  const type = normalizeType(channelType);
  const subType = normalizeSubType(channelSubType);
  const channelNameText = platformName(type);

  if (!fieldKey) {
    return null;
  }

  switch (fieldKey) {
    case "channelType":
      return genericGuide(
        fieldKey,
        "渠道类型",
        type,
        guide,
        "先决定是微信、支付宝、综合支付还是钱包。类型一旦确定，下面的必填项、校验规则和后端执行器都会跟着变化。",
        [
          "第三方直连接入优先选微信支付或支付宝。",
          "只做内部余额扣减时选站内钱包。",
          "需要系统先做路由再下发到真实渠道时选综合支付。",
        ],
      );
    case "channelSubType":
      return genericGuide(
        fieldKey,
        "渠道子类型",
        type,
        guide,
        "子类型决定实际开通的产品能力。比如支付宝 WEB/WAP/APP、微信 JSAPI/H5/APP/Native 对应的是不同产品和调用链路。",
        [
          `当前已选 ${channelNameText}${subType ? ` / ${subType}` : ""}。`,
          "WEB/WAP 更依赖 returnUrl 和浏览器跳转体验。",
          "JSAPI、小程序等需要前端能拿到 openId 或平台侧用户标识。",
        ],
      );
    case "providerSpi":
      return genericGuide(
        fieldKey,
        "Provider SPI",
        type,
        guide,
        "这是后端实际调用哪套支付网关实现的开关。不确定时保持空值，系统会按当前渠道的默认 SPI 走。",
        [
          "只有在你明确知道要切换到自定义网关实现时才需要改它。",
          "切换 SPI 后，必填字段和 extConfig 可能会跟着变化。",
        ],
        guide?.defaultProviderSpi ? `默认 SPI: ${guide.defaultProviderSpi}` : undefined,
      );
    case "channelName":
      return genericGuide(
        fieldKey,
        "展示名称",
        type,
        guide,
        "这是运营侧可读的显示名，用来区分不同商户、不同产品能力或不同环境的配置。",
        [
          "建议把平台、产品和环境一起写清楚，例如“支付宝电脑网站-沙箱”。",
          "这个字段不参与第三方签名，只影响管理界面识别。",
        ],
      );
    case "status":
      return genericGuide(
        fieldKey,
        "渠道状态",
        type,
        guide,
        "建议先保持禁用，等 AppID、密钥、回调地址和 extConfig 全部校验通过后再启用。",
        [
          "启用时后端会立即做必填项校验。",
          "配置未齐全时启用会直接报错，不会保存成半可用状态。",
        ],
      );
    case "appId":
      if (type === "WECHAT") {
        return {
          fieldKey,
          fieldLabel: "AppID / 应用ID",
          headline: "填写微信 AppID",
          description: "这里填的是小程序、公众号、服务号或移动应用自己的 AppID，不是微信支付商户号。",
          bullets: [
            "先在微信开放平台或公众平台确认应用已经和微信支付商户号绑定。",
            "不同子类型对应的 AppID 来源不同，小程序支付要填小程序 AppID，JSAPI 通常填公众号 AppID。",
            "如果是 APP 支付，填移动应用 AppID；Native/H5 通常仍建议绑定清楚商户场景。",
          ],
          example: "示例: wx1234567890abcdef",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "ALIPAY") {
        return {
          fieldKey,
          fieldLabel: "AppID / 应用ID",
          headline: "填写支付宝应用 AppID",
          description: "这里填支付宝开放平台里创建应用后生成的应用 ID。正式环境和沙箱环境的 AppID 不是同一个值。",
          bullets: [
            "先在开放平台创建应用，再进入应用详情页复制 AppID。",
            "切换到沙箱模式时，建议同步切换为沙箱应用的 AppID。",
            "同一商户如果同时做 WEB/WAP/APP，可以按产品能力分别配置不同渠道记录。",
          ],
          example: "示例: 2021001234567890",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      return genericGuide(
        fieldKey,
        "AppID / 应用ID",
        type,
        guide,
        "这里填当前渠道在对应平台上的应用标识。",
        ["第三方渠道通常都要先在官方平台创建应用后才能拿到这个值。"],
      );
    case "merchantNo":
      if (type === "WECHAT") {
        return {
          fieldKey,
          fieldLabel: "商户号 / PID",
          headline: "填写微信支付商户号",
          description: "微信这里填的是微信支付商户号，也就是签约后在商户平台看到的 mchid。",
          bullets: [
            "它和 AppID 不是一个字段，两个值都要配置。",
            "商户号通常用于签名、下单和回调验签。",
            "如果是服务商模式，请按你当前 SPI 的约定填主商户号或子商户号。",
          ],
          example: "示例: 1900000109",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "ALIPAY") {
        return {
          fieldKey,
          fieldLabel: "商户号 / PID",
          headline: "填写支付宝商户标识",
          description: "支付宝直连场景通常填 PID 或你们内部约定的商户标识；如果是路由或服务商模式，则填网关实现要求的标识。",
          bullets: [
            "支付宝大多数场景核心是 AppID + 私钥 + 公钥，merchantNo 更多用于运营识别或路由。",
            "如果你们接入的是自定义 SPI，优先看该 SPI 的字段约定。",
          ],
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "COMPOSITE") {
        return genericGuide(
          fieldKey,
          "路由标识",
          type,
          guide,
          "综合支付这里更适合填内部路由标识，帮助运营区分不同入口或策略组。",
          [
            "真正的目标渠道一般在 extConfig.targetChannelId 或 defaultChannelId 里指定。",
            "如果没有内部路由体系，这个字段可以只作为展示名辅助识别。",
          ],
        );
      }
      return genericGuide(
        fieldKey,
        "商户号 / PID",
        type,
        guide,
        "这里填写当前渠道使用的商户标识。",
        ["第三方渠道会在开户或签约完成后生成该标识。"],
      );
    case "apiKey":
      if (type === "WECHAT") {
        return {
          fieldKey,
          fieldLabel: "API Key",
          headline: "填写微信 APIv3 Key",
          description: "这里填微信商户平台里设置的 APIv3 Key，不是旧版 API Key，也不是证书序列号。",
          bullets: [
            "APIv3 Key 用于回调通知解密和敏感数据解密。",
            "建议用 32 位随机字符串，并在商户平台与系统里保持一致。",
            "修改 APIv3 Key 后，要同步检查回调解密是否仍能通过。",
          ],
          example: "示例: 32 位随机字符串",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "ALIPAY") {
        return genericGuide(
          fieldKey,
          "API Key",
          type,
          guide,
          "支付宝直连通常不需要额外 API Key。只有当前 Provider SPI 明确要求额外密钥时才填写。",
          [
            "如果你不确定，先留空，使用默认 SPI 的默认行为。",
            "遇到签名或网关适配异常，再回头按 SPI 文档补这个字段。",
          ],
        );
      }
      return genericGuide(
        fieldKey,
        "API Key",
        type,
        guide,
        "这里填写当前网关实现要求的额外密钥。",
        ["是否必填由当前渠道和 Provider SPI 决定。"],
      );
    case "privateKey":
      if (type === "WECHAT") {
        return {
          fieldKey,
          fieldLabel: "私钥",
          headline: "填写微信商户私钥",
          description: "这里通常填 apiclient_key.pem 的内容。系统会加密保存；如果当前 SPI 只认文件路径，则请同时配置证书路径。",
          bullets: [
            "私钥必须和商户平台证书序列号配套使用。",
            "内容一般以 -----BEGIN PRIVATE KEY----- 开头。",
            "建议直接贴 PEM 原文，不要去掉换行。",
          ],
          example: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "ALIPAY") {
        return {
          fieldKey,
          fieldLabel: "私钥",
          headline: "填写支付宝应用私钥",
          description: "这里填应用私钥，通常是 RSA2 / PKCS8 格式，用来给下单参数做签名。",
          bullets: [
            "私钥来自你在开放平台生成并保存在本地的应用密钥，不是支付宝公钥。",
            "如果切换了应用或重置密钥，要同步更新这里和开放平台后台。",
            "沙箱与正式环境可共用算法，但推荐分别管理密钥对。",
          ],
          example: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----",
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      return genericGuide(
        fieldKey,
        "私钥",
        type,
        guide,
        "这里填当前支付渠道签名用的私钥内容。",
        ["建议直接保存 PEM 原文，并和平台后台中绑定的公钥配套。"],
      );
    case "publicKey":
      return {
        fieldKey,
        fieldLabel: "公钥",
        headline: "填写支付宝公钥",
        description: "这里填支付宝开放平台返回给你的支付宝公钥或平台公钥，用来验签支付宝回包和通知。",
        bullets: [
          "不要把应用公钥填到这里；应用公钥是你把私钥上传到开放平台后生成给平台的那一份。",
          "如果开放平台切换到平台证书/平台公钥模式，记得把对应值同步到这里。",
          "一旦验签失败，优先检查公钥是否和当前 AppID 环境匹配。",
        ],
        example: "-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----",
        media: buildMedia(type),
        links: withFallbackLinks(buildGuideLinks(guide), guide),
      };
    case "certPath":
      return {
        fieldKey,
        fieldLabel: "证书路径",
        headline: "填写微信证书文件路径",
        description: "这里填部署服务机器上可访问的证书私钥文件路径，例如 apiclient_key.pem。不是本地电脑路径，也不是下载链接。",
        bullets: [
          "如果当前 SPI 直接读取 privateKey 文本，这个字段可以作为补充；如果 SPI 依赖文件路径，就必须填真实服务器绝对路径。",
          "部署到 Linux 时优先用类似 /data/certs/apiclient_key.pem 的绝对路径。",
          "改路径后记得一起检查容器挂载和文件权限。",
        ],
        example: "/data/certs/apiclient_key.pem",
        media: buildMedia(type),
        links: withFallbackLinks(buildGuideLinks(guide), guide),
      };
    case "notifyUrl":
      return genericGuide(
        fieldKey,
        "支付回调地址",
        type,
        guide,
        "这里填异步通知地址，第三方支付成功或退款结果会主动回调到这个地址。必须公网可访问，并且和平台后台配置保持一致。",
        [
          "推荐填业务服务的专属通知地址，不要填本地 localhost。",
          "通知地址一般只处理服务端异步确认，不负责给用户展示结果页。",
          "如果渠道级未填，系统会回退到商户默认回调地址。",
        ],
        "示例: https://example.com/payment/api/callback/alipay/order/notify",
      );
    case "returnUrl":
      return genericGuide(
        fieldKey,
        "返回地址",
        type,
        guide,
        "这里填用户支付完成后浏览器回跳的页面地址。它主要影响前端体验，不用于异步验签。",
        [
          "电脑网站和手机网站支付更依赖 returnUrl。",
          "如果不需要前端回跳，可以保持空值，改走前端主动轮询订单状态。",
          "如果渠道级未填，系统会回退到商户默认返回地址。",
        ],
        "示例: https://example.com/pay/result",
      );
    case "sandboxMode":
      return genericGuide(
        fieldKey,
        "沙箱模式",
        type,
        guide,
        "打开后表示当前渠道使用测试环境。建议沙箱和正式环境各建一条独立渠道记录，不要频繁在同一条记录上来回切换。",
        [
          "支付宝沙箱要同时切换沙箱 AppID、沙箱公私钥和沙箱网关。",
          "微信如果用测试商户，也建议单独建测试渠道，避免误用正式证书。",
        ],
      );
    case "onboardingStatus":
      return genericGuide(
        fieldKey,
        "开通状态",
        type,
        guide,
        "这是运营可见的人工状态，不直接决定能否下单，主要用于标记当前渠道开通推进到了哪一步。",
        [
          "未开始: 还没在官方平台发起开户或创建应用。",
          "开通中: 材料、审核或密钥配置还没收齐。",
          "已开通: 官方平台能力和系统参数都已配齐，可进入联调或生产。",
        ],
      );
    case "onboardingLink":
      return genericGuide(
        fieldKey,
        "开通链接",
        type,
        guide,
        "这里可以覆盖系统预置的官方开通入口，适合填你们内部 SOP、供应商操作台或指定产品文档。",
        [
          "不填时会优先使用系统内置的官方开通地址。",
          "适合把团队内部常用的开户文档、沙箱说明或审批地址放这里。",
        ],
      );
    case "extConfig":
      if (type === "WECHAT") {
        return {
          fieldKey,
          fieldLabel: "扩展配置",
          headline: "填写微信扩展配置 JSON",
          description: "微信渠道最关键的扩展项是 merchantSerialNumber。你也可以在这里显式指定 providerSpi 或其他网关实现需要的扩展字段。",
          bullets: [
            "merchantSerialNumber 是微信商户证书序列号，启用渠道时会校验。",
            "extConfig 必须是合法 JSON；字段名建议和后端约定完全一致。",
            "如果当前 SPI 还要求别的扩展参数，也统一放在这里。",
          ],
          example: '{\n  "merchantSerialNumber": "4A1B2C3D4E5F6A7B8C9D",\n  "providerSpi": "default"\n}',
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "ALIPAY") {
        return {
          fieldKey,
          fieldLabel: "扩展配置",
          headline: "填写支付宝扩展配置 JSON",
          description: "支付宝常见扩展项是 serverUrl，用来显式覆盖网关地址；切沙箱时可以在这里填写沙箱网关。",
          bullets: [
            "正式网关一般是 https://openapi.alipay.com/gateway.do。",
            "沙箱网关一般是 https://openapi-sandbox.dl.alipaydev.com/gateway.do。",
            "如果当前 Provider SPI 还要求额外字段，也统一放在这个 JSON 里。",
          ],
          example: '{\n  "serverUrl": "https://openapi-sandbox.dl.alipaydev.com/gateway.do",\n  "providerSpi": "default"\n}',
          media: buildMedia(type),
          links: withFallbackLinks(buildGuideLinks(guide), guide),
        };
      }
      if (type === "COMPOSITE") {
        return {
          fieldKey,
          fieldLabel: "扩展配置",
          headline: "填写综合支付路由配置",
          description: "综合支付通过 extConfig 指向真实目标渠道。至少要填 targetChannelId 或 defaultChannelId 之一。",
          bullets: [
            "targetChannelId 指向默认下游渠道。",
            "defaultChannelId 可作为兜底渠道。",
            "目标渠道不能再是 COMPOSITE，避免出现递归路由。",
          ],
          example: '{\n  "targetChannelId": 123,\n  "defaultChannelId": 123\n}',
          media: [],
          links: [],
        };
      }
      if (type === "WALLET") {
        return {
          fieldKey,
          fieldLabel: "扩展配置",
          headline: "填写站内钱包扩展配置",
          description: "站内钱包没有外部开户平台，extConfig 主要用于放业务侧扩展开关，例如风控、额度或记账策略。",
          bullets: [
            "如果当前钱包能力不需要额外参数，可以保持空值。",
            "建议把真正影响资金规则的参数收口到统一配置，不要零散堆在 JSON 里。",
          ],
          media: [],
          links: [],
        };
      }
      return genericGuide(
        fieldKey,
        "扩展配置",
        type,
        guide,
        "这里填 JSON 扩展参数，具体字段由当前渠道类型和 Provider SPI 决定。",
        ["不确定时先按表单占位示例填写，启用时报错再补齐缺失项。"],
      );
    default:
      return null;
  }
}
