import { getConfig } from "@repo/config";

/**
 * 检查网络状态的函数
 * @returns {Promise<boolean>} 如果在线返回 true，离线返回 false
 */
export const checkNetworkStatus = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 现代浏览器可以使用 navigator.onLine 属性来快速判断
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      resolve(navigator.onLine);
    } else {
      // 对于不支持 navigator.onLine 的情况，可以通过发送一个简单的请求来检查
      const img = new Image();
      img.src = "https://223.5.5.5/favicon.ico?" + Math.random();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    }
  });
};

/**
 * 检查是否有公网网络的函数
 * @returns {Promise<boolean>} 如果有公网网络返回 true，否则返回 false
 */
export const checkPublicNetwork = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    // 使用 Google 的公共 DNS 服务器地址作为测试，可根据实际情况更换
    img.src = "https://223.5.5.5/favicon.ico?" + Math.random();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

/**
 * 根据 IP 地址返回物理地址
 * @param {string} ip - 要查询的 IP 地址
 * @returns {Promise<string>} 包含物理地址的字符串，如果查询失败则返回空字符串
 */
export const getPhysicalAddressByIp = async (ip: string): Promise<string> => {
  return new Promise((resolve) => {
    const _OpenPublicApi = getConfig().OpenPublicApi;
    if (_OpenPublicApi !== undefined && !_OpenPublicApi) {
      resolve("-");
      return;
    }
    // 尝试从本地存储中获取缓存数据
    const cachedData = localStorage.getItem(`physicalAddress_${ip}`);
    if (cachedData) {
      resolve(cachedData);
      return;
    }

    try {
      fetch(`https://ipapi.co/${ip}/json/`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          const address = !data.city ? "局域网" : `${data.city || ""}, ${data.region || ""}, ${data.country_name || ""}`;
          // 将查询结果存入本地存储
          localStorage.setItem(`physicalAddress_${ip}`, address);
          resolve(address);
        })
        .catch((error) => {
          console.error("Error getting physical address:", error);
          resolve("");
        });
    } catch (error) {
      console.error("Error getting physical address:", error);
      resolve("");
    }
  });
};
