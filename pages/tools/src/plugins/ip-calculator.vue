<script setup>
import { reactive, ref, onMounted } from "vue";
import { message } from "@repo/utils";

// 响应式数据
const env = reactive({
  // 输入值
  inputValue: "",
  // 输入类型
  inputType: "ipv4", // ipv4, ipv6, subnet
  // 加载状态
  loading: false,
  // 输出结果
  outputResults: [],
  // 历史记录
  history: [],
  // 子网掩码位数
  cidrValue: 24,
  // 子网掩码格式
  subnetFormat: "cidr", // cidr, dotted
  // 子网掩码
  subnetMask: "255.255.255.0",
  // 常用子网掩码预设
  subnetPresets: [
    { cidr: 8, mask: "255.0.0.0", hosts: "16,777,214", description: "A类网络" },
    { cidr: 16, mask: "255.255.0.0", hosts: "65,534", description: "B类网络" },
    { cidr: 24, mask: "255.255.255.0", hosts: "254", description: "C类网络" },
    { cidr: 27, mask: "255.255.255.224", hosts: "30", description: "小型子网" },
    { cidr: 29, mask: "255.255.255.248", hosts: "6", description: "极小子网" },
    { cidr: 30, mask: "255.255.255.252", hosts: "2", description: "点对点链路" },
    { cidr: 32, mask: "255.255.255.255", hosts: "1", description: "单主机" },
  ],
  // 常用私有IP范围
  privateRanges: [
    { range: "10.0.0.0/8", description: "大型私有网络 (A类)" },
    { range: "172.16.0.0/12", description: "中型私有网络" },
    { range: "192.168.0.0/16", description: "小型私有网络 (C类)" },
    { range: "169.254.0.0/16", description: "链路本地地址" },
    { range: "127.0.0.0/8", description: "本地回环地址" },
  ],
  // 子网划分
  subnetDivision: {
    count: 2,
    results: [],
  },
  // 超网合并
  supernetting: {
    networks: ["192.168.1.0/24", "192.168.2.0/24"],
    result: "",
  },
});

// 验证IP地址
const validateIP = (ip) => {
  // IPv4验证
  if (env.inputType === "ipv4") {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }
  // IPv6验证
  else if (env.inputType === "ipv6") {
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv6Regex.test(ip);
  }
  // 子网验证
  else if (env.inputType === "subnet") {
    const subnetRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
    return subnetRegex.test(ip);
  }
  return false;
};

// 解析IP地址
const parseIP = () => {
  try {
    env.loading = true;
    env.outputResults = [];

    if (!env.inputValue) {
      throw new Error("请输入IP地址");
    }

    // 验证IP格式
    const isValidIP = validateIP(env.inputValue);
    if (!isValidIP) {
      throw new Error("无效的IP地址格式");
    }

    // 添加到历史记录
    if (!env.history.includes(env.inputValue)) {
      env.history.unshift(env.inputValue);
      if (env.history.length > 5) {
        env.history.pop();
      }
    }

    // 解析IPv4地址
    if (env.inputType === "ipv4" || env.inputType === "subnet") {
      let ipAddress = env.inputValue;
      let cidr = env.cidrValue;

      // 如果是CIDR格式，提取IP和CIDR
      if (env.inputType === "subnet" && ipAddress.includes("/")) {
        const parts = ipAddress.split("/");
        ipAddress = parts[0];
        cidr = parseInt(parts[1], 10);
      }

      // 添加IP地址到结果
      env.outputResults.push({
        label: "IP地址",
        value: ipAddress,
      });

      // 转换为二进制
      const octets = ipAddress.split(".");
      const binaryOctets = octets.map((octet) => parseInt(octet, 10).toString(2).padStart(8, "0"));
      const binaryIP = binaryOctets.join("");

      env.outputResults.push({
        label: "二进制表示",
        value: binaryOctets.join("."),
      });

      // 十六进制表示
      const hexIP = octets.map((octet) => parseInt(octet, 10).toString(16).padStart(2, "0")).join(":");

      env.outputResults.push({
        label: "十六进制表示",
        value: "0x" + hexIP,
      });

      // 计算子网掩码
      const subnetMaskBinary = "1".repeat(cidr) + "0".repeat(32 - cidr);
      const subnetMask = [parseInt(subnetMaskBinary.substring(0, 8), 2), parseInt(subnetMaskBinary.substring(8, 16), 2), parseInt(subnetMaskBinary.substring(16, 24), 2), parseInt(subnetMaskBinary.substring(24, 32), 2)].join(".");

      env.outputResults.push({
        label: "子网掩码",
        value: subnetMask,
      });

      env.outputResults.push({
        label: "CIDR表示法",
        value: `/${cidr}`,
      });

      // 计算网络地址
      const networkOctets = octets.map((octet, index) => {
        const octetBinary = parseInt(octet, 10).toString(2).padStart(8, "0");
        const maskBinary = subnetMaskBinary.substring(index * 8, (index + 1) * 8);
        const networkBinary = octetBinary
          .split("")
          .map((bit, i) => {
            return bit === "1" && maskBinary[i] === "1" ? "1" : "0";
          })
          .join("");
        return parseInt(networkBinary, 2);
      });

      const networkAddress = networkOctets.join(".");

      env.outputResults.push({
        label: "网络地址",
        value: networkAddress,
      });

      // 计算广播地址
      const broadcastOctets = octets.map((octet, index) => {
        const octetBinary = parseInt(octet, 10).toString(2).padStart(8, "0");
        const maskBinary = subnetMaskBinary.substring(index * 8, (index + 1) * 8);
        const broadcastBinary = octetBinary
          .split("")
          .map((bit, i) => {
            return maskBinary[i] === "0" ? "1" : bit;
          })
          .join("");
        return parseInt(broadcastBinary, 2);
      });

      const broadcastAddress = broadcastOctets.join(".");

      env.outputResults.push({
        label: "广播地址",
        value: broadcastAddress,
      });

      // 计算可用主机数
      const hostCount = Math.pow(2, 32 - cidr) - 2;

      env.outputResults.push({
        label: "可用主机数",
        value: hostCount > 0 ? hostCount.toLocaleString() : "0",
      });

      // 计算IP范围
      let firstIP = [...networkOctets];
      let lastIP = [...broadcastOctets];

      // 调整第一个和最后一个IP（如果主机数 > 0）
      if (hostCount > 0) {
        firstIP[3] += 1;
        lastIP[3] -= 1;
      }

      env.outputResults.push({
        label: "IP范围",
        value: `${firstIP.join(".")} - ${lastIP.join(".")}`,
      });

      // 判断IP类型
      let ipClass = "";
      const firstOctet = parseInt(octets[0], 10);
      if (firstOctet < 128) ipClass = "A类";
      else if (firstOctet < 192) ipClass = "B类";
      else if (firstOctet < 224) ipClass = "C类";
      else if (firstOctet < 240) ipClass = "D类 (多播)";
      else ipClass = "E类 (保留)";

      env.outputResults.push({
        label: "IP类别",
        value: ipClass,
      });

      // 判断是否为私有IP
      let isPrivate = false;
      if (firstOctet === 10 || (firstOctet === 172 && parseInt(octets[1], 10) >= 16 && parseInt(octets[1], 10) <= 31) || (firstOctet === 192 && parseInt(octets[1], 10) === 168) || (firstOctet === 169 && parseInt(octets[1], 10) === 254) || firstOctet === 127) {
        isPrivate = true;
      }

      env.outputResults.push({
        label: "IP类型",
        value: isPrivate ? "私有IP" : "公网IP",
      });

      // 计算子网划分
      calculateSubnetDivision(networkAddress, cidr);
    }
    // 解析IPv6地址
    else if (env.inputType === "ipv6") {
      const ipv6 = env.inputValue;

      // 添加IPv6地址到结果
      env.outputResults.push({
        label: "IPv6地址",
        value: ipv6,
      });

      // 标准化IPv6地址（展开缩写）
      let expandedIPv6 = ipv6;
      if (ipv6.includes("::")) {
        const parts = ipv6.split("::");
        const left = parts[0] ? parts[0].split(":") : [];
        const right = parts[1] ? parts[1].split(":") : [];
        const missing = 8 - left.length - right.length;
        const middle = Array(missing).fill("0000");
        expandedIPv6 = [...left, ...middle, ...right].join(":");
      }

      // 确保每个段都是4位
      expandedIPv6 = expandedIPv6
        .split(":")
        .map((segment) => segment.padStart(4, "0"))
        .join(":");

      env.outputResults.push({
        label: "标准化IPv6",
        value: expandedIPv6,
      });

      // 压缩形式（最短形式）
      const compressedIPv6 = compressIPv6(expandedIPv6);

      env.outputResults.push({
        label: "压缩形式",
        value: compressedIPv6,
      });

      // 二进制表示
      const binaryIPv6 = expandedIPv6
        .split(":")
        .map((segment) => parseInt(segment, 16).toString(2).padStart(16, "0"))
        .join(" ");

      env.outputResults.push({
        label: "二进制表示",
        value: binaryIPv6,
      });

      // IPv6范围信息
      env.outputResults.push({
        label: "IPv6范围",
        value: getIPv6RangeInfo(ipv6),
      });
    }

    message("解析成功", { type: "success" });
  } catch (error) {
    console.error("IP解析错误:", error);
    message("解析失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 压缩IPv6地址
const compressIPv6 = (expandedIPv6) => {
  // 找到最长的连续0序列
  const segments = expandedIPv6.split(":");
  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === "0000") {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
        currentZeroLength = 1;
      } else {
        currentZeroLength++;
      }
    } else {
      if (currentZeroLength > longestZeroLength) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }

  // 检查最后一个序列
  if (currentZeroLength > longestZeroLength) {
    longestZeroStart = currentZeroStart;
    longestZeroLength = currentZeroLength;
  }

  // 压缩地址
  if (longestZeroLength > 1) {
    const firstPart = segments.slice(0, longestZeroStart).map((s) => s.replace(/^0+/, "") || "0");
    const lastPart = segments.slice(longestZeroStart + longestZeroLength).map((s) => s.replace(/^0+/, "") || "0");

    if (longestZeroStart === 0) {
      return "::" + lastPart.join(":");
    } else if (longestZeroStart + longestZeroLength === segments.length) {
      return firstPart.join(":") + "::";
    } else {
      return firstPart.join(":") + "::" + lastPart.join(":");
    }
  }

  // 如果没有可压缩的部分，只去掉前导零
  return segments.map((s) => s.replace(/^0+/, "") || "0").join(":");
};

// 获取IPv6范围信息
const getIPv6RangeInfo = (ipv6) => {
  if (ipv6.startsWith("fe80:")) {
    return "链路本地地址";
  } else if (ipv6.startsWith("fc00:") || ipv6.startsWith("fd00:")) {
    return "唯一本地地址 (ULA)";
  } else if (ipv6.startsWith("2001:0db8:")) {
    return "文档示例地址";
  } else if (ipv6.startsWith("2001:")) {
    return "全球单播地址";
  } else if (ipv6.startsWith("2002:")) {
    return "6to4 地址";
  } else if (ipv6.startsWith("ff00:")) {
    return "多播地址";
  } else if (ipv6.startsWith("::1")) {
    return "本地回环地址";
  } else if (ipv6.startsWith("::ffff:")) {
    return "IPv4映射地址";
  } else {
    return "全球单播地址";
  }
};

// 计算子网划分
const calculateSubnetDivision = (networkAddress, cidr) => {
  const count = env.subnetDivision.count;
  if (count < 2 || count > 256) {
    message("子网数量必须在2-256之间", { type: "warning" });
    return;
  }

  // 计算需要的位数
  const bitsNeeded = Math.ceil(Math.log2(count));
  const newCidr = parseInt(cidr, 10) + bitsNeeded;

  if (newCidr > 30) {
    message("子网划分后CIDR超过30，不建议使用", { type: "warning" });
  }

  // 计算子网
  const subnets = [];
  const octets = networkAddress.split(".");
  const networkBinary = octets.map((octet) => parseInt(octet, 10).toString(2).padStart(8, "0")).join("");

  const subnetBits = Math.pow(2, bitsNeeded);
  for (let i = 0; i < Math.min(count, subnetBits); i++) {
    const subnetBinary = networkBinary.substring(0, cidr) + i.toString(2).padStart(bitsNeeded, "0") + "0".repeat(32 - cidr - bitsNeeded);

    // 转换回点分十进制
    const subnetOctets = [parseInt(subnetBinary.substring(0, 8), 2), parseInt(subnetBinary.substring(8, 16), 2), parseInt(subnetBinary.substring(16, 24), 2), parseInt(subnetBinary.substring(24, 32), 2)];

    // 计算广播地址
    const broadcastBinary = subnetBinary.substring(0, cidr + bitsNeeded) + "1".repeat(32 - cidr - bitsNeeded);
    const broadcastOctets = [parseInt(broadcastBinary.substring(0, 8), 2), parseInt(broadcastBinary.substring(8, 16), 2), parseInt(broadcastBinary.substring(16, 24), 2), parseInt(broadcastBinary.substring(24, 32), 2)];

    // 计算可用IP范围
    const firstIP = [...subnetOctets];
    const lastIP = [...broadcastOctets];

    if (newCidr < 31) {
      firstIP[3] += 1;
      lastIP[3] -= 1;
    }

    subnets.push({
      network: `${subnetOctets.join(".")}/${newCidr}`,
      broadcast: broadcastOctets.join("."),
      range: `${firstIP.join(".")} - ${lastIP.join(".")}`,
      hosts: Math.pow(2, 32 - newCidr) - 2,
    });
  }

  env.subnetDivision.results = subnets;
};

// 计算超网合并
const calculateSupernetting = () => {
  try {
    const networks = env.supernetting.networks;
    if (networks.length < 2) {
      throw new Error("至少需要两个网络进行合并");
    }

    // 解析网络地址和CIDR
    const parsedNetworks = networks.map((network) => {
      const [ip, cidr] = network.split("/");
      const octets = ip.split(".");
      const binary = octets.map((octet) => parseInt(octet, 10).toString(2).padStart(8, "0")).join("");
      return { ip, cidr: parseInt(cidr, 10), binary };
    });

    // 检查是否可以合并
    const firstCidr = parsedNetworks[0].cidr;
    if (!parsedNetworks.every((network) => network.cidr === firstCidr)) {
      throw new Error("所有网络必须有相同的CIDR前缀长度");
    }

    // 找到共同前缀
    let commonPrefixLength = 0;
    const firstBinary = parsedNetworks[0].binary;

    for (let i = 0; i < firstCidr; i++) {
      const bit = firstBinary[i];
      if (parsedNetworks.every((network) => network.binary[i] === bit)) {
        commonPrefixLength++;
      } else {
        break;
      }
    }

    // 计算新的CIDR
    const newCidr = commonPrefixLength;

    // 计算新的网络地址
    const newNetworkBinary = firstBinary.substring(0, newCidr) + "0".repeat(32 - newCidr);
    const newNetworkOctets = [parseInt(newNetworkBinary.substring(0, 8), 2), parseInt(newNetworkBinary.substring(8, 16), 2), parseInt(newNetworkBinary.substring(16, 24), 2), parseInt(newNetworkBinary.substring(24, 32), 2)];

    const newNetwork = `${newNetworkOctets.join(".")}/${newCidr}`;
    env.supernetting.result = newNetwork;

    message("超网计算成功", { type: "success" });
  } catch (error) {
    console.error("超网计算错误:", error);
    message("计算失败: " + error.message, { type: "error" });
  }
};

// 添加超网
const addSupernet = () => {
  env.supernetting.networks.push("");
};

// 删除超网
const removeSupernet = (index) => {
  env.supernetting.networks.splice(index, 1);
};

// 从历史记录中选择IP
const selectFromHistory = (ip) => {
  env.inputValue = ip;
  parseIP();
};

// 复制结果到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message("复制成功", { type: "success" });
    })
    .catch(() => {
      message("复制失败", { type: "error" });
    });
};

// 复制所有结果
const copyAllResults = () => {
  if (env.outputResults.length === 0) {
    message("没有可复制的结果", { type: "warning" });
    return;
  }

  const text = env.outputResults.map((result) => `${result.label}: ${result.value}`).join("\n");
  copyToClipboard(text);
};

// 应用子网掩码预设
const applySubnetPreset = (preset) => {
  env.cidrValue = preset.cidr;
  env.subnetMask = preset.mask;
  if (env.inputValue) {
    parseIP();
  }
};

// 应用私有IP范围预设
const applyPrivateRange = (range) => {
  env.inputValue = range.range;
  env.inputType = "subnet";
  parseIP();
};

// 更新子网掩码
const updateSubnetMask = () => {
  if (env.subnetFormat === "cidr") {
    // 从CIDR更新点分十进制掩码
    const subnetMaskBinary = "1".repeat(env.cidrValue) + "0".repeat(32 - env.cidrValue);
    env.subnetMask = [parseInt(subnetMaskBinary.substring(0, 8), 2), parseInt(subnetMaskBinary.substring(8, 16), 2), parseInt(subnetMaskBinary.substring(16, 24), 2), parseInt(subnetMaskBinary.substring(24, 32), 2)].join(".");
  } else {
    // 从点分十进制掩码更新CIDR
    const octets = env.subnetMask.split(".");
    const binaryMask = octets.map((octet) => parseInt(octet, 10).toString(2).padStart(8, "0")).join("");
    env.cidrValue = binaryMask.split("0")[0].length;
  }
};

// 获取结果图标
const getResultIcon = (label) => {
  if (label.includes("IP地址")) return "ri:global-line";
  if (label.includes("二进制")) return "ri:code-line";
  if (label.includes("十六进制")) return "ri:code-line";
  if (label.includes("子网掩码")) return "ri:shield-keyhole-line";
  if (label.includes("CIDR")) return "ri:hashtag";
  if (label.includes("网络地址")) return "ri:router-line";
  if (label.includes("广播地址")) return "ri:broadcast-line";
  if (label.includes("可用主机数")) return "ri:computer-line";
  if (label.includes("IP范围")) return "ri:list-ordered";
  if (label.includes("IP类别")) return "ri:information-line";
  if (label.includes("IP类型")) return "ri:information-line";
  if (label.includes("IPv6")) return "ri:global-line";
  if (label.includes("标准化")) return "ri:format-line";
  if (label.includes("压缩")) return "ri:compress-line";
  return "ri:information-line";
};

// 组件挂载时初始化
onMounted(() => {
  // 初始化操作
  updateSubnetMask();
});
</script>

<template>
  <div class="ip-calculator">
    <div class="ip-calculator__content">
      <!-- 头部信息 -->
      <div class="ip-calculator__header-container">
        <div class="ip-calculator__header">
          <div class="ip-calculator__header-inner">
            <h1 class="ip-calculator__header-title">IP网络计算器</h1>
            <p class="ip-calculator__header-subtitle">计算IP地址、子网掩码、网络地址、广播地址和可用主机数</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-calculator__input-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:calculator-line" class="ip-calculator__card-icon" />
                <span>IP网络计算器</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- IP类型选择 -->
              <el-form-item label="IP类型">
                <el-radio-group v-model="env.inputType" class="ip-calculator__radio-group">
                  <el-radio label="ipv4">
                    <div class="ip-calculator__radio-content">
                      <IconifyIconOnline icon="ri:global-line" />
                      <span>IPv4地址</span>
                    </div>
                  </el-radio>
                  <el-radio label="ipv6">
                    <div class="ip-calculator__radio-content">
                      <IconifyIconOnline icon="ri:global-line" />
                      <span>IPv6地址</span>
                    </div>
                  </el-radio>
                  <el-radio label="subnet">
                    <div class="ip-calculator__radio-content">
                      <IconifyIconOnline icon="ri:router-line" />
                      <span>子网 (CIDR)</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- IP地址输入 -->
              <el-form-item label="IP地址">
                <div class="ip-calculator__input-group">
                  <el-input v-model="env.inputValue" :placeholder="env.inputType === 'ipv4' ? '例如: 192.168.1.1' : env.inputType === 'ipv6' ? '例如: 2001:db8::1' : '例如: 192.168.1.0/24'" clearable />
                  <el-button type="primary" @click="parseIP" :loading="env.loading">
                    <IconifyIconOnline icon="ri:search-line" />
                    <span>解析</span>
                  </el-button>
                </div>
              </el-form-item>

              <!-- 子网掩码设置 (仅IPv4) -->
              <el-form-item v-if="env.inputType === 'ipv4'" label="子网掩码">
                <div class="ip-calculator__subnet-mask">
                  <el-radio-group v-model="env.subnetFormat" class="ip-calculator__subnet-format">
                    <el-radio label="cidr">CIDR</el-radio>
                    <el-radio label="dotted">点分十进制</el-radio>
                  </el-radio-group>

                  <div class="ip-calculator__subnet-input">
                    <template v-if="env.subnetFormat === 'cidr'">
                      <div class="ip-calculator__cidr-input">
                        <span class="ip-calculator__cidr-prefix">/</span>
                        <el-slider v-model="env.cidrValue" :min="0" :max="32" :step="1" show-input @change="updateSubnetMask" />
                      </div>
                    </template>
                    <template v-else>
                      <el-input v-model="env.subnetMask" placeholder="例如: 255.255.255.0" @change="updateSubnetMask" />
                    </template>
                  </div>
                </div>
              </el-form-item>

              <!-- 常用子网掩码预设 -->
              <el-form-item v-if="env.inputType === 'ipv4' || env.inputType === 'subnet'" label="常用子网掩码">
                <div class="ip-calculator__presets">
                  <el-button v-for="preset in env.subnetPresets" :key="preset.cidr" size="small" @click="applySubnetPreset(preset)" class="ip-calculator__preset-btn">
                    /{{ preset.cidr }} ({{ preset.mask }})
                    <el-tooltip :content="preset.description + ' - 可用主机数: ' + preset.hosts" placement="top">
                      <IconifyIconOnline icon="ri:information-line" class="ip-calculator__preset-info" />
                    </el-tooltip>
                  </el-button>
                </div>
              </el-form-item>

              <!-- 常用私有IP范围 -->
              <el-form-item v-if="env.inputType === 'ipv4' || env.inputType === 'subnet'" label="常用私有IP范围">
                <div class="ip-calculator__presets">
                  <el-button v-for="range in env.privateRanges" :key="range.range" size="small" @click="applyPrivateRange(range)" class="ip-calculator__preset-btn">
                    {{ range.range }}
                    <el-tooltip :content="range.description" placement="top">
                      <IconifyIconOnline icon="ri:information-line" class="ip-calculator__preset-info" />
                    </el-tooltip>
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 历史记录卡片 -->
          <el-card class="ip-calculator__history-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:history-line" class="ip-calculator__card-icon" />
                <span>历史记录</span>
              </div>
            </template>

            <el-empty v-if="!env.history.length" description="暂无历史记录" class="ip-calculator__empty">
              <template #image>
                <IconifyIconOnline icon="ri:history-line" class="ip-calculator__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="ip-calculator__history">
              <el-tag v-for="(ip, index) in env.history" :key="index" class="ip-calculator__history-item" @click="selectFromHistory(ip)">
                {{ ip }}
              </el-tag>
            </div>
          </el-card>

          <!-- 子网划分卡片 -->
          <el-card class="ip-calculator__subnet-division-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:split-cells-horizontal" class="ip-calculator__card-icon" />
                <span>子网划分</span>
              </div>
            </template>

            <div class="ip-calculator__subnet-division">
              <el-form label-position="top">
                <el-form-item label="子网数量">
                  <el-input-number v-model="env.subnetDivision.count" :min="2" :max="256" />
                </el-form-item>
              </el-form>

              <div v-if="env.subnetDivision.results.length" class="ip-calculator__subnet-results">
                <div class="ip-calculator__subnet-results-header">
                  <div class="ip-calculator__subnet-results-title">子网划分结果</div>
                  <div class="ip-calculator__subnet-results-count">共 {{ env.subnetDivision.results.length }} 个子网</div>
                </div>

                <el-table :data="env.subnetDivision.results" stripe style="width: 100%">
                  <el-table-column prop="network" label="网络地址" />
                  <el-table-column prop="broadcast" label="广播地址" />
                  <el-table-column prop="range" label="IP范围" />
                  <el-table-column prop="hosts" label="可用主机数" />
                </el-table>
              </div>
            </div>
          </el-card>

          <!-- 超网合并卡片 -->
          <el-card class="ip-calculator__supernetting-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:merge-cells-horizontal" class="ip-calculator__card-icon" />
                <span>超网合并</span>
              </div>
            </template>

            <div class="ip-calculator__supernetting">
              <el-form label-position="top">
                <el-form-item label="网络列表">
                  <div v-for="(network, index) in env.supernetting.networks" :key="index" class="ip-calculator__supernet-item">
                    <el-input v-model="env.supernetting.networks[index]" placeholder="例如: 192.168.1.0/24" />
                    <el-button type="danger" icon="Delete" @click="removeSupernet(index)" v-if="env.supernetting.networks.length > 2" />
                  </div>
                  <div class="ip-calculator__supernet-actions">
                    <el-button type="primary" @click="addSupernet">
                      <IconifyIconOnline icon="ri:add-line" />
                      <span>添加网络</span>
                    </el-button>
                    <el-button type="success" @click="calculateSupernetting">
                      <IconifyIconOnline icon="ri:merge-cells-horizontal" />
                      <span>计算超网</span>
                    </el-button>
                  </div>
                </el-form-item>

                <el-form-item v-if="env.supernetting.result" label="超网结果">
                  <el-input v-model="env.supernetting.result" readonly>
                    <template #append>
                      <el-button @click="copyToClipboard(env.supernetting.result)">
                        <IconifyIconOnline icon="ri:file-copy-line" />
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-calculator__result-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="ip-calculator__card-icon" />
                <span>计算结果</span>
                <div class="ip-calculator__header-actions" v-if="env.outputResults.length">
                  <el-button type="primary" link size="small" @click="copyAllResults">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    <span>复制全部</span>
                  </el-button>
                </div>
              </div>
            </template>

            <el-empty v-if="!env.outputResults.length" description="请先输入IP地址并解析" class="ip-calculator__empty">
              <template #image>
                <IconifyIconOnline icon="ri:calculator-line" class="ip-calculator__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="ip-calculator__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="ip-calculator__result-item">
                <div class="ip-calculator__result-label">
                  <IconifyIconOnline :icon="getResultIcon(result.label)" class="ip-calculator__result-icon" />
                  <span>{{ result.label }}</span>
                </div>
                <div class="ip-calculator__result-value">
                  <span>{{ result.value }}</span>
                  <el-button type="primary" link size="small" class="ip-calculator__copy-btn" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 参考卡片 -->
          <el-card class="ip-calculator__reference-card" shadow="hover">
            <template #header>
              <div class="ip-calculator__card-header">
                <IconifyIconOnline icon="ri:information-line" class="ip-calculator__card-icon" />
                <span>IP网络参考</span>
              </div>
            </template>

            <div class="ip-calculator__reference">
              <el-collapse accordion>
                <el-collapse-item title="IP地址基础知识" name="basics">
                  <div class="ip-calculator__reference-content">
                    <p>IP地址是互联网协议使用的地址，用于标识网络中的设备。</p>
                    <h4>IPv4地址</h4>
                    <ul>
                      <li>由4个8位字节组成，总共32位</li>
                      <li>表示为四个0-255之间的数字，用点分隔</li>
                      <li>例如：192.168.1.1</li>
                    </ul>
                    <h4>IPv6地址</h4>
                    <ul>
                      <li>由8个16位字段组成，总共128位</li>
                      <li>表示为8组4位十六进制数，用冒号分隔</li>
                      <li>例如：2001:0db8:85a3:0000:0000:8a2e:0370:7334</li>
                      <li>可以压缩：2001:db8:85a3::8a2e:370:7334</li>
                    </ul>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="子网掩码和CIDR" name="subnet">
                  <div class="ip-calculator__reference-content">
                    <p>子网掩码用于确定IP地址的网络部分和主机部分。</p>
                    <h4>子网掩码表示法</h4>
                    <ul>
                      <li><strong>点分十进制</strong>：255.255.255.0</li>
                      <li><strong>CIDR</strong>：/24（表示前24位是网络部分）</li>
                    </ul>
                    <h4>常见子网掩码</h4>
                    <ul>
                      <li>/8 (255.0.0.0) - A类网络，16,777,214个主机</li>
                      <li>/16 (255.255.0.0) - B类网络，65,534个主机</li>
                      <li>/24 (255.255.255.0) - C类网络，254个主机</li>
                      <li>/27 (255.255.255.224) - 小型子网，30个主机</li>
                      <li>/30 (255.255.255.252) - 点对点链路，2个主机</li>
                    </ul>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="私有IP地址范围" name="private">
                  <div class="ip-calculator__reference-content">
                    <p>私有IP地址是保留用于内部网络的地址范围，不会在公共互联网上路由。</p>
                    <h4>IPv4私有地址范围</h4>
                    <ul>
                      <li>10.0.0.0/8 (10.0.0.0 - 10.255.255.255)</li>
                      <li>172.16.0.0/12 (172.16.0.0 - 172.31.255.255)</li>
                      <li>192.168.0.0/16 (192.168.0.0 - 192.168.255.255)</li>
                      <li>169.254.0.0/16 - 链路本地地址</li>
                      <li>127.0.0.0/8 - 本地回环地址</li>
                    </ul>
                    <h4>IPv6私有地址</h4>
                    <ul>
                      <li>fc00::/7 - 唯一本地地址</li>
                      <li>fe80::/10 - 链路本地地址</li>
                      <li>::1/128 - 回环地址</li>
                    </ul>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="子网划分和超网合并" name="subnetting">
                  <div class="ip-calculator__reference-content">
                    <h4>子网划分</h4>
                    <p>将一个大网络分割成多个小网络的过程。</p>
                    <ul>
                      <li>增加CIDR前缀长度（例如从/24到/26）</li>
                      <li>每增加1位，可用子网数量翻倍</li>
                      <li>每个子网的可用主机数减半</li>
                    </ul>
                    <h4>超网合并</h4>
                    <p>将多个小网络合并为一个大网络的过程。</p>
                    <ul>
                      <li>减少CIDR前缀长度（例如从/24到/23）</li>
                      <li>要求网络地址连续且大小相同</li>
                      <li>合并后的网络包含所有原始网络的地址</li>
                    </ul>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ip-calculator {
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);

  &__content {
    margin: 0 auto;
    padding: 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary));
    border-radius: 12px;
    padding: 24px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-inner {
    max-width: 800px;
  }

  &__header-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__header-subtitle {
    font-size: 16px;
    opacity: 0.9;
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .ip-calculator__header-actions {
      margin-left: auto;
    }
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
  }

  &__input-card,
  &__result-card,
  &__history-card,
  &__reference-card,
  &__subnet-division-card,
  &__supernetting-card {
    margin-bottom: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__input-group {
    display: flex;
    gap: 8px;
  }

  &__subnet-mask {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__subnet-format {
    display: flex;
    gap: 16px;
  }

  &__subnet-input {
    width: 100%;
  }

  &__cidr-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__cidr-prefix {
    font-size: 16px;
    font-weight: bold;
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__preset-btn {
    margin-right: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__preset-info {
    font-size: 14px;
    opacity: 0.7;
  }

  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__history {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__history-item {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__result-item {
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  &__result-label {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__result-icon {
    margin-right: 8px;
  }

  &__result-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }

  &__copy-btn {
    margin-left: 8px;
  }

  &__reference-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;

    h4 {
      margin: 12px 0 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    ul {
      padding-left: 20px;
      margin: 8px 0;
    }

    p {
      margin: 8px 0;
    }
  }

  &__subnet-division {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__subnet-results {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__subnet-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__subnet-results-title {
    font-weight: 600;
    font-size: 16px;
  }

  &__subnet-results-count {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__supernetting {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__supernet-item {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__supernet-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  @media (max-width: 768px) {
    &__radio-group {
      flex-direction: column;
      gap: 8px;
    }

    &__input-group {
      flex-direction: column;
    }

    &__subnet-mask {
      flex-direction: column;
    }

    &__subnet-format {
      flex-direction: row;
    }

    &__presets {
      flex-direction: column;
    }
  }
}
</style>
