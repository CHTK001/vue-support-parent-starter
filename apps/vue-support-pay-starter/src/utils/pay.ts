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

export const handleOrigin = value => {
  if ("RECHARGE" === value) {
    return "充值";
  }
  return value;
};
export const handleStatus = value => {
  if (value == "0000") {
    return "新建";
  }
  if (value == "1000") {
    return "待支付";
  }
  if (value == "1003") {
    return "支付失败(订单创建失败)";
  }

  if (value == "2000") {
    return "支付成功";
  }

  if (value == "2005") {
    return "支付成功(订单解析失败)";
  }

  if (value == "3000") {
    return "订单超时";
  }

  if (value == "4000") {
    return "退款中";
  }

  if (value == "4002") {
    return "退款成功";
  }

  if (value == "4003") {
    return "退款失败";
  }

  if (value == "5001") {
    return "订单已关闭(手动)";
  }

  if (value == "5000") {
    return "订单已关闭";
  }

  if (value == "5002") {
    return "订单取消";
  }
};
/**
 * 根据不同的状态码返回对应的类型
 * @param {String} value - 状态码
 * @returns {String} - 类型 (danger, success, info)
 */
export const handleStatusType = value => {
  if (value == "1003") {
    return "danger";
  }

  if (value == "2000" || value == "2005") {
    return "success";
  }

  if (value == "4002") {
    return "success";
  }

  if (value == "4003") {
    return "danger";
  }
  return "info";
};
/**
 * @description: 支付方式
 */
export const handlePayWay = value => {
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
