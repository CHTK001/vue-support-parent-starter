<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { getCurrentIP, message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 防抖解析函数
const debounceParseIP = (value) => {
  if (!value) return;

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器，延迟500ms执行
  debounceTimer = setTimeout(() => {
    if (env.inputValue) {
      parseIP();
    }
  }, 500);
};

/**
 * 获取结果项的图标
 * @param {string} label - 结果项标签
 * @returns {string} - 图标名称
 */
const getResultIcon = (label) => {
  if (label.includes("IP 版本")) return "ri:information-line";
  if (label.includes("二进制")) return "ri:code-box-line";
  if (label.includes("十六进制")) return "ri:code-line";
  if (label.includes("子网掩码")) return "ri:shield-keyhole-line";
  if (label.includes("网络地址")) return "ri:router-line";
  if (label.includes("广播地址")) return "ri:broadcast-line";
  if (label.includes("可用主机数")) return "ri:computer-line";
  if (label.includes("IP 范围")) return "ri:list-ordered";
  if (label.includes("反向 DNS")) return "ri:arrow-go-back-line";
  if (label.includes("位置信息")) return "ri:map-pin-line";
  if (label.includes("MAC 地址")) return "ri:device-line";
  if (label.includes("端口")) return "ri:door-lock-line";
  if (label.includes("安全评级")) return "ri:shield-check-line";
  return "ri:information-line";
};

// 环境变量
const env = reactive({
  loading: false,
  currentIP: "",
  inputValue: "",
  outputResults: [],
  ipTypes: [
    { label: "IPv4", value: "ipv4", example: "192.168.1.1" },
    { label: "IPv6", value: "ipv6", example: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" },
    { label: "CIDR", value: "cidr", example: "192.168.1.0/24" },
  ],
  ipType: "ipv4",
  activeTab: "basic",
  pingResults: [],
  pingStatus: "idle", // idle, running, completed
  tracerouteResults: [],
  tracerouteStatus: "idle",
  whoisData: null,
  whoisLoading: false,
  portScanResults: [],
  portScanStatus: "idle",
  commonPorts: [
    { port: 21, service: "FTP" },
    { port: 22, service: "SSH" },
    { port: 23, service: "Telnet" },
    { port: 25, service: "SMTP" },
    { port: 53, service: "DNS" },
    { port: 80, service: "HTTP" },
    { port: 110, service: "POP3" },
    { port: 143, service: "IMAP" },
    { port: 443, service: "HTTPS" },
    { port: 3306, service: "MySQL" },
    { port: 3389, service: "RDP" },
    { port: 8080, service: "HTTP Proxy" },
  ],
  selectedPorts: [80, 443, 22, 21],
  ipHistory: [],
  securityInfo: {
    risk: "低",
    score: 85,
    details: [
      { item: "黑名单检查", status: "通过", icon: "ri:checkbox-circle-line" },
      { item: "恶意活动", status: "未发现", icon: "ri:shield-check-line" },
      { item: "垃圾邮件", status: "未发现", icon: "ri:mail-check-line" },
    ],
  },
  ipDetails: {
    country: "中国",
    region: "北京市",
    city: "北京",
    isp: "联通",
    org: "China Unicom",
    asn: "AS4837",
    timezone: "Asia/Shanghai",
    latitude: 39.9042,
    longitude: 116.4074,
  },
});

// 计算属性：IP 类型的图标
const ipTypeIcon = computed(() => {
  switch (env.ipType) {
    case "ipv4":
      return "ri:file-list-2-line";
    case "ipv6":
      return "ri:file-list-3-line";
    case "cidr":
      return "ri:file-list-line";
    default:
      return "ri:file-list-line";
  }
});

/**
 * 获取当前 IP 地址
 */

/**
 * 解析 IP 地址
 */
const parseIP = () => {
  if (!env.inputValue) {
    return;
  }

  env.loading = true;
  env.outputResults = [];

  try {
    // 验证 IP 地址格式
    let ipAddress = env.inputValue.trim();
    let cidrNotation = "";
    let ipVersion = 4;
    let validIP = false;

    // 检查是否为 CIDR 格式
    if (ipAddress.includes("/")) {
      const parts = ipAddress.split("/");
      ipAddress = parts[0];
      cidrNotation = parts[1];

      // 验证 CIDR 部分是否为有效数字
      if (!/^\d+$/.test(cidrNotation)) {
        throw new Error("无效的 CIDR 格式");
      }
    }

    // 检查是否为 IPv4
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddress)) {
      // 验证每个段是否在 0-255 范围内
      const octets = ipAddress.split(".");
      validIP = octets.every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
      ipVersion = 4;
    }
    // 检查是否为 IPv6
    else if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ipAddress) || /^([0-9a-fA-F]{1,4}:){1,7}:$/.test(ipAddress) || /^::[0-9a-fA-F]{1,4}(:([0-9a-fA-F]{1,4})?){0,6}$/.test(ipAddress) || /^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/.test(ipAddress)) {
      validIP = true;
      ipVersion = 6;
    }

    if (!validIP) {
      throw new Error("无效的 IP 地址格式");
    }

    // 添加到历史记录
    if (!env.ipHistory.includes(ipAddress)) {
      env.ipHistory.unshift(ipAddress);
      if (env.ipHistory.length > 5) {
        env.ipHistory.pop();
      }
    }

    // 基本信息
    env.outputResults.push({
      label: "IP 版本",
      value: `IPv${ipVersion}`,
    });

    // IPv4 特定处理
    if (ipVersion === 4) {
      const octets = ipAddress.split(".");

      // 二进制表示
      const binaryIP = octets
        .map((octet) => {
          return parseInt(octet, 10).toString(2).padStart(8, "0");
        })
        .join(".");

      env.outputResults.push({
        label: "二进制表示",
        value: binaryIP,
      });

      // 十六进制表示
      const hexIP = octets
        .map((octet) => {
          return parseInt(octet, 10).toString(16).padStart(2, "0");
        })
        .join(":");

      env.outputResults.push({
        label: "十六进制表示",
        value: hexIP,
      });

      // 如果有 CIDR 表示法
      if (cidrNotation) {
        const cidr = parseInt(cidrNotation, 10);

        if (cidr < 0 || cidr > 32) {
          throw new Error("IPv4 CIDR 必须在 0-32 范围内");
        }

        // 计算子网掩码
        const subnetMaskBinary = "1".repeat(cidr) + "0".repeat(32 - cidr);
        const subnetMask = [parseInt(subnetMaskBinary.substring(0, 8), 2), parseInt(subnetMaskBinary.substring(8, 16), 2), parseInt(subnetMaskBinary.substring(16, 24), 2), parseInt(subnetMaskBinary.substring(24, 32), 2)].join(".");

        env.outputResults.push({
          label: "子网掩码",
          value: subnetMask,
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
          value: hostCount > 0 ? hostCount.toString() : "0",
        });

        // 计算 IP 范围
        let firstIP = [...networkOctets];
        let lastIP = [...broadcastOctets];

        // 调整第一个和最后一个 IP（如果主机数 > 0）
        if (hostCount > 0) {
          firstIP[3] += 1;
          lastIP[3] -= 1;
        }

        env.outputResults.push({
          label: "IP 范围",
          value: `${firstIP.join(".")} - ${lastIP.join(".")}`,
        });
      }
    }
    // IPv6 特定处理
    else if (ipVersion === 6) {
      // 标准化 IPv6 地址（展开缩写）
      let fullIPv6 = ipAddress;

      // 处理双冒号缩写
      if (ipAddress.includes("::")) {
        const parts = ipAddress.split("::");
        const leftParts = parts[0] ? parts[0].split(":") : [];
        const rightParts = parts[1] ? parts[1].split(":") : [];
        const missingGroups = 8 - leftParts.length - rightParts.length;

        fullIPv6 = [...leftParts, ...Array(missingGroups).fill("0000"), ...rightParts].join(":");
      }

      // 确保每个段都是 4 位十六进制
      fullIPv6 = fullIPv6
        .split(":")
        .map((segment) => {
          return segment.padStart(4, "0");
        })
        .join(":");

      env.outputResults.push({
        label: "标准化 IPv6",
        value: fullIPv6,
      });

      // 压缩形式（最短形式）
      let compressedIPv6 = ipAddress;
      // 这里可以实现 IPv6 压缩算法，但较为复杂

      env.outputResults.push({
        label: "压缩形式 IPv6",
        value: compressedIPv6,
      });

      // 二进制表示
      const binaryIPv6 = fullIPv6
        .split(":")
        .map((segment) => {
          return parseInt(segment, 16).toString(2).padStart(16, "0");
        })
        .join(":");

      env.outputResults.push({
        label: "二进制表示",
        value: binaryIPv6,
      });

      // 如果有 CIDR 表示法
      if (cidrNotation) {
        const cidr = parseInt(cidrNotation, 10);

        if (cidr < 0 || cidr > 128) {
          throw new Error("IPv6 CIDR 必须在 0-128 范围内");
        }

        // 计算可用地址数
        const addressCount = Math.pow(2, 128 - cidr);

        env.outputResults.push({
          label: "可用地址数",
          value: addressCount.toExponential(),
        });
      }
    }

    // 模拟位置信息（实际应用中可以调用 IP 地理位置 API）
    env.outputResults.push({
      label: "位置信息",
      value: `${env.ipDetails.country} ${env.ipDetails.region} ${env.ipDetails.isp}`,
    });

    message(t("message.parseSuccess") || "解析成功", { type: "success" });
  } catch (error) {
    console.error("IP 解析错误:", error);
    message(t("message.parseError") || "解析失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 复制结果到剪贴板
 * @param {string} text - 要复制的文本
 */
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

/**
 * 重置表单
 */
const resetForm = () => {
  env.inputValue = "";
  env.outputResults = [];
};

/**
 * 模拟 Ping 操作
 */
const pingIP = () => {
  if (!env.inputValue) {
    message("请先输入 IP 地址", { type: "warning" });
    return;
  }

  env.pingStatus = "running";
  env.pingResults = [];

  // 模拟 ping 结果
  const pingCount = 4;
  let completedPings = 0;

  const pingInterval = setInterval(() => {
    completedPings++;

    // 模拟随机延迟和结果
    const delay = Math.floor(Math.random() * 100) + 20;
    const success = Math.random() > 0.1; // 90% 成功率

    env.pingResults.push({
      seq: completedPings,
      time: success ? `${delay}ms` : "超时",
      status: success ? "success" : "timeout",
    });

    if (completedPings >= pingCount) {
      clearInterval(pingInterval);
      env.pingStatus = "completed";
    }
  }, 1000);
};

/**
 * 模拟 Traceroute 操作
 */
const tracerouteIP = () => {
  if (!env.inputValue) {
    message("请先输入 IP 地址", { type: "warning" });
    return;
  }

  env.tracerouteStatus = "running";
  env.tracerouteResults = [];

  // 模拟跳数
  const hops = Math.floor(Math.random() * 5) + 5;
  let completedHops = 0;

  const tracerouteInterval = setInterval(() => {
    completedHops++;

    // 模拟随机延迟和 IP
    const delay = Math.floor(Math.random() * 100) + 20;
    const hopIP = completedHops === hops ? env.inputValue : `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    env.tracerouteResults.push({
      hop: completedHops,
      ip: hopIP,
      time: `${delay}ms`,
      location: completedHops === hops ? `${env.ipDetails.country} ${env.ipDetails.region}` : "局域网",
    });

    if (completedHops >= hops) {
      clearInterval(tracerouteInterval);
      env.tracerouteStatus = "completed";
    }
  }, 800);
};

/**
 * 模拟 WHOIS 查询
 */
const queryWhois = () => {
  if (!env.inputValue) {
    message("请先输入 IP 地址", { type: "warning" });
    return;
  }

  env.whoisLoading = true;

  // 模拟 WHOIS 数据
  setTimeout(() => {
    env.whoisData = {
      netRange: "192.168.0.0 - 192.168.255.255",
      organization: "中国联通",
      registeredDate: "2000-01-01",
      updatedDate: "2022-05-15",
      status: "已分配",
      country: "CN",
      admin: {
        name: "网络管理员",
        email: "admin@example.com",
        phone: "+86.1012345678",
      },
    };

    env.whoisLoading = false;
  }, 1500);
};

/**
 * 模拟端口扫描
 */
const scanPorts = () => {
  if (!env.inputValue) {
    message("请先输入 IP 地址", { type: "warning" });
    return;
  }

  if (!env.selectedPorts.length) {
    message("请选择要扫描的端口", { type: "warning" });
    return;
  }

  env.portScanStatus = "running";
  env.portScanResults = [];

  let scannedPorts = 0;
  const totalPorts = env.selectedPorts.length;

  const scanInterval = setInterval(() => {
    const port = env.selectedPorts[scannedPorts];
    const service = env.commonPorts.find((p) => p.port === port)?.service || "未知";
    const isOpen = Math.random() > 0.7; // 30% 开放率

    env.portScanResults.push({
      port,
      service,
      status: isOpen ? "open" : "closed",
      banner: isOpen ? `${service} Server Ready` : "",
    });

    scannedPorts++;

    if (scannedPorts >= totalPorts) {
      clearInterval(scanInterval);
      env.portScanStatus = "completed";
    }
  }, 500);
};

/**
 * 从历史记录中选择 IP
 */
const selectFromHistory = (ip) => {
  env.inputValue = ip;
  parseIP();
};

// 组件挂载时获取当前 IP
onMounted(() => {
  getCurrentIP();
});
</script>

<template>
  <div class="ip-tool">
    <div class="ip-tool__content">
      <!-- 当前 IP 显示 -->
      <div class="ip-tool__header-container">
        <div class="ip-tool__header">
          <div class="ip-tool__header-inner">
            <div class="ip-tool__header-title">IP 地址解析工具</div>
            <div class="ip-tool__header-subtitle">解析 IP 地址，提供详细的网络信息</div>
            <div class="ip-tool__header-ip" v-if="env.currentIP">
              <span>当前 IP: {{ env.currentIP }}</span>
              <el-button type="primary" link size="small" @click="copyToClipboard(env.currentIP)">
                <IconifyIconOnline icon="ri:file-copy-line" />
              </el-button>
            </div>
          </div>
          <div class="ip-tool__header-decoration">
            <div class="ip-tool__header-circle"></div>
            <div class="ip-tool__header-circle"></div>
            <div class="ip-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-tool__input-card" shadow="hover">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:input-method-line" class="ip-tool__card-icon" />
                <span>输入 IP 地址</span>
              </div>
            </template>

            <el-form label-position="top">
              <el-form-item label="IP 类型">
                <el-radio-group v-model="env.ipType" class="ip-tool__radio-group">
                  <el-radio v-for="item in env.ipTypes" :key="item.value" :label="item.value">
                    <div class="ip-tool__radio-content">
                      <IconifyIconOnline :icon="item.value === 'ipv4' ? 'ri:file-list-2-line' : item.value === 'ipv6' ? 'ri:file-list-3-line' : 'ri:file-list-line'" />
                      <span>{{ item.label }}</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="输入值">
                <el-input v-model="env.inputValue" :placeholder="`请输入 ${env.ipTypes.find((t) => t.value === env.ipType)?.label} 地址，如：${env.ipTypes.find((t) => t.value === env.ipType)?.example}`" clearable class="ip-tool__input" @input="debounceParseIP">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:global-line" />
                  </template>
                </el-input>
              </el-form-item>

              <div class="ip-tool__actions">
                <el-button type="primary" :loading="env.loading" class="ip-tool__parse-btn" @click="parseIP">
                  <IconifyIconOnline icon="ri:search-line" />
                  <span>解析 IP</span>
                </el-button>

                <el-button type="success" class="ip-tool__now-btn" @click="getCurrentIP">
                  <IconifyIconOnline icon="ri:radar-line" />
                  <span>获取当前 IP</span>
                </el-button>

                <el-button class="ip-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
              </div>
            </el-form>
          </el-card>
        </el-col>

        <!-- 结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-tool__result-card" shadow="hover">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="ip-tool__card-icon" />
                <span>解析结果</span>
              </div>
            </template>

            <el-empty v-if="!env.outputResults.length" description="请先输入并解析 IP 地址" class="ip-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:global-line" class="ip-tool__empty-icon" />
              </template>
            </el-empty>

            <div v-else class="ip-tool__results">
              <div v-for="(result, index) in env.outputResults" :key="index" class="ip-tool__result-item" :class="{ 'ip-tool__result-item--highlight': index < 3 }">
                <div class="ip-tool__result-label">
                  <IconifyIconOnline :icon="getResultIcon(result.label)" class="ip-tool__result-icon" />
                  <span>{{ result.label }}</span>
                </div>
                <div class="ip-tool__result-value">
                  <span>{{ result.value }}</span>
                  <el-button type="primary" link size="small" class="ip-tool__copy-btn" @click="copyToClipboard(result.value)">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ip-tool {
  padding: 20px;

  /* 内容区域样式 */
  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
    padding: 24px;
  }

  /* 头部容器 */
  &__header-container {
    margin-bottom: 30px;
    perspective: 1000px;
  }

  /* 头部样式 */
  &__header {
    background: linear-gradient(135deg, var(--el-color-success-dark-2), var(--el-color-success));
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(var(--el-color-success-rgb), 0.3);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transform: rotateX(5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }

    &-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--el-color-white);
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
      letter-spacing: 1px;
    }

    &-subtitle {
      font-size: 18px;
      color: var(--el-color-white);
      opacity: 0.95;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }

    &-ip {
      font-size: 16px;
      color: var(--el-color-white);
      opacity: 0.9;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-flex;
      backdrop-filter: blur(5px);
      font-weight: 500;
    }
  }

  /* 卡片样式 */
  &__input-card,
  &__result-card {
    height: 100%;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 12px;
    overflow: hidden;
    border: none;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-fill-color-light);
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-success);
  }

  /* 单选按钮组样式 */
  &__radio-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .el-radio {
      margin-right: 0;
      padding: 8px 0;

      &.is-checked {
        .ip-tool__radio-content {
          color: var(--el-color-success);
          transform: translateY(-2px);
        }
      }
    }
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
  }

  /* 输入框美化 */
  &__input {
    width: 100%;

    &:deep(.el-input__wrapper) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.1),
          0 0 0 1px var(--el-color-success-light-5);
      }
    }
  }

  /* 操作按钮区域样式 */
  &__actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    gap: 12px;
  }

  &__parse-btn,
  &__now-btn,
  &__reset-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 8px;
    padding: 12px 16px;
    font-weight: 500;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 空状态美化 */
  &__empty {
    padding: 40px 0;

    &-icon {
      font-size: 80px;
      color: var(--el-color-info-light-5);
      margin-bottom: 20px;
      animation: pulse 3s infinite ease-in-out;
    }
  }

  /* 结果区域样式 */
  &__results {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 8px;
    padding-top: 5px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-success-light-7);
      border-radius: 3px;

      &:hover {
        background-color: var(--el-color-success-light-5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
  }

  &__result-item {
    padding: 14px;
    border-radius: 10px;
    background-color: var(--el-fill-color-light);
    margin-bottom: 12px;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;

    &:hover {
      background-color: var(--el-fill-color);
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &:last-child {
      margin-bottom: 0;
    }

    &--highlight {
      border-left: 3px solid var(--el-color-success);
      background-color: rgba(var(--el-color-success-rgb), 0.05);
    }
  }

  &__result-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__result-icon {
    font-size: 16px;
    color: var(--el-color-success);
  }

  &__result-value {
    font-size: 16px;
    color: var(--el-text-color-primary);
    font-weight: 500;
    word-break: break-all;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--el-bg-color);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px dashed var(--el-border-color);
  }

  &__copy-btn {
    opacity: 0.6;
    transition: all 0.3s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
