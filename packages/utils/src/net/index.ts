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
      img.src = "https://www.aliyun.com/favicon.ico?" + Math.random();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    }
  });
};

/**
 * 获取当前 IP 地址
 */
// 添加必要的接口定义
interface IPDetails {
  country: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  asn: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

interface NetworkStatus {
  isOnline: boolean;
  isPublic: boolean;
  lastChecked: Date | null;
}

// IP 服务列表，按优先级排序
const IP_SERVICES = [
  {
    url: "https://api.ipify.org?format=json",
    parseIP: (data: any) => data.ip,
    parseDetails: () => null
  },
  {
    url: "https://ipinfo.io/json",
    parseIP: (data: any) => data.ip,
    parseDetails: (data: any) => ({
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      isp: data.org || "",
      org: data.org || "",
      asn: "",
      timezone: data.timezone || "",
      latitude: 0,
      longitude: 0
    })
  },
  {
    url: "https://api.ip.sb/geoip",
    parseIP: (data: any) => data.ip,
    parseDetails: (data: any) => ({
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      isp: data.isp || "",
      org: data.organization || "",
      asn: data.asn?.toString() || "",
      timezone: data.timezone || "",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    })
  }
];

/**
 * 获取当前 IP 地址及相关信息
 * @returns {Promise<{ip: string, details: IPDetails | null, networkStatus: NetworkStatus}>} IP信息对象
 */
export const getCurrentIP = async (): Promise<{
  ip: string;
  details: IPDetails | null;
  networkStatus: NetworkStatus;
}> => {
  // 初始化返回对象
  const result: {
    ip: string;
    details: IPDetails | null;
    networkStatus: NetworkStatus;
  } = {
    ip: "",
    details: null,
    networkStatus: {
      isOnline: false,
      isPublic: false,
      lastChecked: null
    }
  };
  
  try {
    // 检查网络连接
    const isOnline = await checkPublicNetwork();
    result.networkStatus.isOnline = isOnline;

    if (!isOnline) {
      result.ip = "离线状态";
      return result;
    }

    // 尝试多个 IP 服务
    for (const service of IP_SERVICES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(service.url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          result.ip = service.parseIP(data);
          
          if (result.ip) {
            // 检查是否为公网IP
            result.networkStatus.isPublic = !isPrivateIP(result.ip);
            // 获取IP地理位置信息
            result.details = service.parseDetails(data);
            result.networkStatus.lastChecked = new Date();
            return result;
          }
        }
      } catch (e) {
        // 当前服务失败，尝试下一个
        console.warn(`IP 服务 ${service.url} 失败:`, e);
        continue;
      }
    }
    
    // 所有服务都失败
    result.ip = "获取失败";
    return result;
  } catch (error) {
    console.error("获取 IP 地址失败:", error);
    result.ip = "获取失败";
    return result;
  }
};
/**
 * 检查是否有公网网络的函数
 * @returns {Promise<boolean>} 如果有公网网络返回 true，否则返回 false
 */
export const checkPublicNetwork = (): Promise<boolean> => {
  // 添加缓存机制，缓存结果10分钟
  const cacheKey = 'network_status_cache';
  const cacheExpiry = 'network_status_expiry';
  
  // 检查是否有有效的缓存结果
  const cachedStatus = localStorage.getItem(cacheKey);
  const expiryTime = localStorage.getItem(cacheExpiry);
  
  if (cachedStatus && expiryTime) {
    // 检查缓存是否过期（10分钟）
    if (Date.now() < parseInt(expiryTime)) {
      return Promise.resolve(cachedStatus === 'true');
    }
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    // 使用阿里云公共服务作为网络检测地址
    img.src = "https://www.aliyun.com/favicon.ico?" + Math.random();
    img.onload = () => {
      // 缓存结果，设置10分钟过期时间
      localStorage.setItem(cacheKey, 'true');
      localStorage.setItem(cacheExpiry, (Date.now() + 10 * 60 * 1000).toString());
      resolve(true);
    };
    img.onerror = () => {
      // 缓存结果，设置10分钟过期时间
      localStorage.setItem(cacheKey, 'false');
      localStorage.setItem(cacheExpiry, (Date.now() + 10 * 60 * 1000).toString());
      resolve(false);
    };
  });
};

/**
 * 判断IP地址是否为局域网IP
 * @param {string} ip - 要判断的IP地址
 * @returns {boolean} 如果是局域网IP返回true，否则返回false
 */
export const isPrivateIP = (ip: string): boolean => {
  // 处理空值或无效值
  if (!ip || typeof ip !== "string") {
    return false;
  }

  // 处理可能带有端口号的IP
  const ipAddress = ip.split(":")[0];

  // 检查IP格式是否有效
  const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ipAddress.match(ipPattern);
  if (!match) {
    return false;
  }

  // 提取IP地址的各个部分
  const parts = match.slice(1).map(Number);

  // 检查IP地址是否有效
  if (parts.some((part) => part > 255)) {
    return false;
  }

  // 检查是否为局域网IP
  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) {
    return true;
  }

  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }

  // 169.254.0.0 - 169.254.255.255 (APIPA)
  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }

  // 127.0.0.0 - 127.255.255.255 (本地回环)
  if (parts[0] === 127) {
    return true;
  }

  return false;
};

/**
 * 根据 IP 地址返回物理地址
 * @param {string} ip - 要查询的 IP 地址
 * @returns {Promise<string>} 包含物理地址的字符串，如果查询失败则返回空字符串
 */
export const getPhysicalAddressByIp = async (ip: string): Promise<string> => {
  return new Promise((resolve) => {
    // 判断是否为局域网IP
    if (isPrivateIP(ip)) {
      resolve("局域网");
      return;
    }

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
          const address = !data.city ? "未知位置" : `${data.city || ""}, ${data.region || ""}, ${data.country_name || ""}`;
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

/**
 * 摄像头厂商RTSP地址接口
 */
interface CameraRtspTemplate {
  manufacturer: string; // 厂商名称
  version: string; // 版本号
  rtspTemplate: string; // RTSP地址模板
  description?: string; // 描述信息
  params?: {
    // 参数说明
    [key: string]: string;
  };
}

/**
 * 获取摄像头RTSP地址模板
 * @returns {CameraRtspTemplate[]} RTSP地址模板数组
 */
export const getCameraRtspTemplates = (): CameraRtspTemplate[] => {
  return [
    {
      manufacturer: "海康威视",
      version: "v1.0",
      rtspTemplate: "rtsp://${sysDeviceAccount}:${sysDevicePassword}@${sysDeviceNetAddress}/h264/ch${channelNo}/${subtype}/av_stream",
      description: "海康威视通用RTSP地址",
      params: {
        sysDeviceAccount: "用户名",
        sysDevicePassword: "密码",
        ip: "设备IP",
        port: "端口号，默认554",
        channelNo: "通道号",
        subtype: "码流类型：main(主码流)，sub(子码流)",
      },
    },
    {
      manufacturer: "大华",
      version: "v1.0",
      rtspTemplate: "rtsp://${sysDeviceAccount}:${sysDevicePassword}@${sysDeviceNetAddress}/cam/realmonitor?channel=${channelNo}&subtype=${subtype}",
      description: "大华通用RTSP地址",
      params: {
        sysDeviceAccount: "用户名",
        sysDevicePassword: "密码",
        ip: "设备IP",
        port: "端口号，默认554",
        channelNo: "通道号",
        subtype: "码流类型：0(主码流)，1(子码流)",
      },
    },
    {
      manufacturer: "宇视",
      version: "v1.0",
      rtspTemplate: "rtsp://${sysDeviceAccount}:${sysDevicePassword}@${sysDeviceNetAddress}/video${channelNo}/${subtype}",
      description: "宇视通用RTSP地址",
      params: {
        sysDeviceAccount: "用户名",
        sysDevicePassword: "密码",
        ip: "设备IP",
        port: "端口号，默认554",
        channelNo: "通道号",
        subtype: "码流类型：main(主码流)，sub(子码流)",
      },
    },
    {
      manufacturer: "华为",
      version: "v1.0",
      rtspTemplate: "rtsp://${sysDeviceAccount}:${sysDevicePassword}@${sysDeviceNetAddress}/LiveMedia/ch${channelNo}/${subtype}",
      description: "华为通用RTSP地址",
      params: {
        sysDeviceAccount: "用户名",
        sysDevicePassword: "密码",
        ip: "设备IP",
        port: "端口号，默认554",
        channelNo: "通道号",
        subtype: "码流类型：main(主码流)，sub(子码流)",
      },
    },
    {
      manufacturer: "天地伟业",
      version: "v1.0",
      rtspTemplate: "rtsp://${sysDeviceAccount}:${sysDevicePassword}@${sysDeviceNetAddress}/stream${channelNo}/${subtype}",
      description: "天地伟业通用RTSP地址",
      params: {
        sysDeviceAccount: "用户名",
        sysDevicePassword: "密码",
        ip: "设备IP",
        port: "端口号，默认554",
        channelNo: "通道号",
        subtype: "码流类型：1(主码流)，2(子码流)",
      },
    },
  ];
};
