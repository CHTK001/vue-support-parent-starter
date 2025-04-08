export function handleToTradeType(type) {
  if (type === "js_api") {
    return "WECHAT_JS_API";
  }
  if (type === "h5") {
    return "WECHAT_H5";
  }
  if (type === "native") {
    return "WECHAT_NATIVE";
  }
  return type.toUpperCase();
}
export function handleType(type, subject) {
  if (type === "wechat") {
    if (subject === "H5") {
      return "微信H5";
    }

    if (subject === "js_api") {
      return "微信小程序";
    }

    if (subject === "native") {
      return "微信支付";
    }
  }

  return handlePayWay(type);
}

export const listOrigin = () => {
  return [
    {
      key: "wallet",
      value: "wallet",
      label: "钱包",
    },
    {
      key: "wechat_h5",
      value: "wechat_h5",
      label: "微信H5",
    },
    {
      key: "wechat_native",
      value: "wechat_native",
      label: "微信支付",
    },
    {
      key: "wechat_js_api",
      value: "wechat_js_api",
      label: "微信小程序",
    },
  ];
};

export const handleOrigin = (value) => {
  if ("RECHARGE" === value) {
    return "充值";
  }
  if ("STUDY PLANNING" === value) {
    return "升学规划";
  }
  if ("EXPERT_CATHEDRA" === value) {
    return "专家讲座";
  }
  if ("JCHY" === value) {
    return "基础会员";
  }
  return value;
};

export const mapStatus = () => {
  return {
    "0000": "新建",
    "1000": "待支付",
    "1003": "支付失败(订单创建失败)",
    "2000": "支付成功",
    "2005": "支付成功(订单解析失败)",
    "3000": "订单超时",
    "4000": "退款中",
    "4002": "退款成功",
    "4003": "退款失败",
    "5001": "已关闭",
    "5000": "已关闭",
    "5002": "订单取消",
  };
};
export const handleStatus = (value) => {
  return mapStatus()[value];
};
/**
 * 根据不同的状态码返回对应的类型
 * @param {String} value - 状态码
 * @returns {String} - 类型 (danger, success, info)
 */
export const handleStatusType = (value) => {
  if (value == "2000" || value == "2005") {
    return "success";
  }

  if (value == "4002") {
    return "danger";
  }
  if (value == "5000") {
    return "close";
  }

  if (value == "1000") {
    return "";
  }

  return "info";
};
/**
 * @description: 支付方式
 */
export const handlePayWay = (value) => {
  if ("wechat_js_api" === value) {
    return "微信小程序";
  }

  if ("wechat_h5" === value) {
    return "微信H5";
  }

  if ("wechat_native" === value) {
    return "微信支付";
  }
  if ("wallet" === value) {
    return "钱包";
  }

  return "其它";
};
