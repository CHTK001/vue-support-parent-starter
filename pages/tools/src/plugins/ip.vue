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
  isLoading: false,
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

/**
 * 获取当前 IP 地址并自动解析
 */
const fetchCurrentIP = async () => {
  try {
    env.loading = true;
    const ipAddress = await getCurrentIP();
    if (ipAddress) {
      env.currentIP = ipAddress.ip;
      env.inputValue = ipAddress.ip;
      if (ipAddress.details) {
        env.ipDetails = ipAddress.details;
      }
      // 自动解析获取到的 IP
      parseIP();
      message(t("message.getCurrentIPSuccess") || "获取当前 IP 成功", { type: "success" });
    } else {
      message(t("message.getCurrentIPError") || "获取当前 IP 失败", { type: "error" });
    }
  } catch (error) {
    console.error("获取当前 IP 失败:", error);
    message(t("message.getCurrentIPError") || "获取当前 IP 失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

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
      value: `${env.ipDetails.country} ${env.ipDetails.region || ""} ${env.ipDetails.isp}`,
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
onMounted(async () => {
  await fetchCurrentIP();
});
</script>

<template>
  <div class="ip-tool">
    <div class="ip-tool__content">
      <!-- 页面头部区域 - 带有渐变背景和动画效果 -->
      <div class="ip-tool__header-container">
        <div class="ip-tool__header">
          <div class="ip-tool__header-inner">
            <div class="ip-tool__header-title">IP 地址解析工具</div>
            <div class="ip-tool__header-subtitle">解析 IP 地址，提供详细的网络信息</div>

            <!-- IP 信息卡片 -->
            <div class="ip-tool__header-info" v-if="env.currentIP">
              <!-- IP 地址显示 -->
              <div class="ip-tool__header-info-item ip-tool__header-info-ip">
                <IconifyIconOnline icon="ri:ip-line" class="ip-tool__header-info-icon" />
                <span>{{ env.currentIP }}</span>
                <el-button type="primary" link size="small" @click="copyToClipboard(env.currentIP)" class="ip-tool__copy-ip-btn">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </div>

              <!-- 位置信息显示 -->
              <div class="ip-tool__header-info-item" v-if="env.currentIP !== '离线状态' && env.currentIP !== '获取失败'">
                <IconifyIconOnline icon="ri:map-pin-line" class="ip-tool__header-info-icon" />
                <span>{{ env.ipDetails.country }} {{ env.ipDetails.region }} {{ env.ipDetails.city }}</span>
              </div>

              <!-- ISP 信息显示 -->
              <div class="ip-tool__header-info-item" v-if="env.currentIP !== '离线状态' && env.currentIP !== '获取失败'">
                <IconifyIconOnline icon="ri:global-line" class="ip-tool__header-info-icon" />
                <span>{{ env.ipDetails.isp }} {{ env.ipDetails.asn }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 左侧输入区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-tool__input-card" shadow="hover">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:input-method-line" class="ip-tool__card-icon" />
                <span>输入 IP 地址</span>
              </div>
            </template>

            <el-form label-position="top">
              <!-- IP 类型选择 -->
              <el-form-item label="IP 类型">
                <el-radio-group v-model="env.ipType" class="ip-tool__radio-group">
                  <el-radio v-for="item in env.ipTypes" :key="item.value" :label="item.value">
                    <div class="ip-tool__radio-content">
                      <IconifyIconOnline :icon="ipTypeIcon" />
                      <span>{{ item.label }}</span>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- IP 输入框 -->
              <el-form-item label="输入值">
                <el-input v-model="env.inputValue" :placeholder="`请输入 ${env.ipTypes.find((t) => t.value === env.ipType)?.label} 地址，如：${env.ipTypes.find((t) => t.value === env.ipType)?.example}`" clearable class="ip-tool__input" @input="debounceParseIP">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:global-line" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- 历史记录区域 -->
              <div class="ip-tool__history" v-if="env.ipHistory.length > 0">
                <div class="ip-tool__history-label">
                  <IconifyIconOnline icon="ri:history-line" class="ip-tool__history-icon" />
                  <span>历史记录:</span>
                </div>
                <div class="ip-tool__history-tags">
                  <el-tag v-for="(ip, index) in env.ipHistory" :key="index" class="ip-tool__history-tag" @click="selectFromHistory(ip)" :effect="env.inputValue === ip ? 'dark' : 'plain'" size="small">
                    {{ ip }}
                  </el-tag>
                </div>
              </div>

              <!-- 操作按钮区域 -->
              <div class="ip-tool__actions flex">
                <el-button type="primary" :loading="env.loading" class="ip-tool__parse-btn" @click="parseIP">
                  <IconifyIconOnline icon="ri:search-line" />
                  <span>解析 IP</span>
                </el-button>

                <el-button type="success" class="ip-tool__now-btn" @click="fetchCurrentIP" :loading="env.isLoading">
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

          <!-- 高级功能卡片 -->
          <el-card class="ip-tool__advanced-card" shadow="hover">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:tools-line" class="ip-tool__card-icon" />
                <span>高级功能</span>
              </div>
            </template>

            <el-tabs v-model="env.activeTab" class="ip-tool__tabs">
              <!-- Ping 功能 -->
              <el-tab-pane label="Ping" name="ping">
                <div class="ip-tool__tab-content">
                  <div class="ip-tool__tab-header">
                    <span class="ip-tool__tab-title">
                      <IconifyIconOnline icon="ri:radar-line" class="ip-tool__tab-icon" />
                      Ping 测试
                    </span>
                    <el-button type="primary" size="small" @click="pingIP" :loading="env.pingStatus === 'running'" :disabled="!env.inputValue"> 开始测试 </el-button>
                  </div>

                  <div class="ip-tool__ping-results" v-if="env.pingResults.length > 0">
                    <div v-for="(result, index) in env.pingResults" :key="index" class="ip-tool__ping-item" :class="{ 'ip-tool__ping-item--success': result.status === 'success', 'ip-tool__ping-item--timeout': result.status === 'timeout' }">
                      <span class="ip-tool__ping-seq">序列 {{ result.seq }}</span>
                      <span class="ip-tool__ping-time">{{ result.time }}</span>
                      <IconifyIconOnline :icon="result.status === 'success' ? 'ri:check-line' : 'ri:close-line'" class="ip-tool__ping-status-icon" />
                    </div>
                  </div>

                  <el-empty v-else description="点击开始测试按钮进行 Ping 测试" />
                </div>
              </el-tab-pane>

              <!-- Traceroute 功能 -->
              <el-tab-pane label="路由追踪" name="traceroute">
                <div class="ip-tool__tab-content">
                  <div class="ip-tool__tab-header">
                    <span class="ip-tool__tab-title">
                      <IconifyIconOnline icon="ri:route-line" class="ip-tool__tab-icon" />
                      路由追踪
                    </span>
                    <el-button type="primary" size="small" @click="tracerouteIP" :loading="env.tracerouteStatus === 'running'" :disabled="!env.inputValue"> 开始追踪 </el-button>
                  </div>

                  <div class="ip-tool__traceroute-results" v-if="env.tracerouteResults.length > 0">
                    <div v-for="(result, index) in env.tracerouteResults" :key="index" class="ip-tool__traceroute-item">
                      <div class="ip-tool__traceroute-hop">{{ result.hop }}</div>
                      <div class="ip-tool__traceroute-info">
                        <div class="ip-tool__traceroute-ip">{{ result.ip }}</div>
                        <div class="ip-tool__traceroute-details">
                          <span class="ip-tool__traceroute-time">{{ result.time }}</span>
                          <span class="ip-tool__traceroute-location">{{ result.location }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <el-empty v-else description="点击开始追踪按钮进行路由追踪" />
                </div>
              </el-tab-pane>

              <!-- WHOIS 查询 -->
              <el-tab-pane label="WHOIS" name="whois">
                <div class="ip-tool__tab-content">
                  <div class="ip-tool__tab-header">
                    <span class="ip-tool__tab-title">
                      <IconifyIconOnline icon="ri:information-line" class="ip-tool__tab-icon" />
                      WHOIS 查询
                    </span>
                    <el-button type="primary" size="small" @click="queryWhois" :loading="env.whoisLoading" :disabled="!env.inputValue"> 查询信息 </el-button>
                  </div>

                  <div class="ip-tool__whois-results" v-if="env.whoisData">
                    <el-descriptions border :column="1" size="small">
                      <el-descriptions-item label="IP 范围">{{ env.whoisData.netRange }}</el-descriptions-item>
                      <el-descriptions-item label="组织">{{ env.whoisData.organization }}</el-descriptions-item>
                      <el-descriptions-item label="注册日期">{{ env.whoisData.registeredDate }}</el-descriptions-item>
                      <el-descriptions-item label="更新日期">{{ env.whoisData.updatedDate }}</el-descriptions-item>
                      <el-descriptions-item label="状态">{{ env.whoisData.status }}</el-descriptions-item>
                      <el-descriptions-item label="国家/地区">{{ env.whoisData.country }}</el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <el-empty v-else description="点击查询信息按钮获取 WHOIS 数据" />
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>

        <!-- 右侧结果区域 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card class="ip-tool__result-card" shadow="hover">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:file-list-line" class="ip-tool__card-icon" />
                <span>解析结果</span>
              </div>
            </template>

            <!-- 空状态提示 -->
            <el-empty v-if="!env.outputResults.length" description="请先输入并解析 IP 地址" class="ip-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:global-line" class="ip-tool__empty-icon" />
              </template>
            </el-empty>

            <!-- 结果列表 -->
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

            <!-- IP 安全信息卡片 -->
            <div class="ip-tool__security-card" v-if="env.outputResults.length">
              <div class="ip-tool__security-header">
                <IconifyIconOnline icon="ri:shield-check-line" class="ip-tool__security-icon" />
                <span>IP 安全评估</span>
              </div>

              <div class="ip-tool__security-content">
                <div class="ip-tool__security-score">
                  <div class="ip-tool__security-score-circle" :style="`--score: ${env.securityInfo.score}%`">
                    <span>{{ env.securityInfo.score }}</span>
                  </div>
                  <div class="ip-tool__security-score-text">
                    <div class="ip-tool__security-score-label">安全评分</div>
                    <div class="ip-tool__security-score-risk">风险等级: {{ env.securityInfo.risk }}</div>
                  </div>
                </div>

                <div class="ip-tool__security-details">
                  <div v-for="(detail, index) in env.securityInfo.details" :key="index" class="ip-tool__security-detail-item">
                    <IconifyIconOnline :icon="detail.icon" class="ip-tool__security-detail-icon" />
                    <span class="ip-tool__security-detail-label">{{ detail.item }}</span>
                    <span class="ip-tool__security-detail-status">{{ detail.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- IP 地理位置卡片 -->
          <el-card class="ip-tool__map-card" shadow="hover" v-if="env.outputResults.length">
            <template #header>
              <div class="ip-tool__card-header">
                <IconifyIconOnline icon="ri:map-pin-line" class="ip-tool__card-icon" />
                <span>地理位置</span>
              </div>
            </template>

            <div class="ip-tool__map-content">
              <div class="ip-tool__map-details">
                <div class="ip-tool__map-detail-item">
                  <div class="ip-tool__map-detail-icon-wrapper">
                    <IconifyIconOnline icon="ri:global-line" class="ip-tool__map-detail-icon" />
                  </div>
                  <span class="ip-tool__map-detail-label">国家/地区:</span>
                  <span class="ip-tool__map-detail-value">{{ env.ipDetails.country }}</span>
                </div>

                <div class="ip-tool__map-detail-item">
                  <div class="ip-tool__map-detail-icon-wrapper">
                    <IconifyIconOnline icon="ri:map-pin-line" class="ip-tool__map-detail-icon" />
                  </div>
                  <span class="ip-tool__map-detail-label">城市:</span>
                  <span class="ip-tool__map-detail-value">{{ env.ipDetails.region }} {{ env.ipDetails.city }}</span>
                </div>

                <div class="ip-tool__map-detail-item">
                  <div class="ip-tool__map-detail-icon-wrapper">
                    <IconifyIconOnline icon="ri:building-line" class="ip-tool__map-detail-icon" />
                  </div>
                  <span class="ip-tool__map-detail-label">ISP:</span>
                  <span class="ip-tool__map-detail-value">{{ env.ipDetails.isp }}</span>
                </div>

                <div class="ip-tool__map-detail-item">
                  <div class="ip-tool__map-detail-icon-wrapper">
                    <IconifyIconOnline icon="ri:organization-chart" class="ip-tool__map-detail-icon" />
                  </div>
                  <span class="ip-tool__map-detail-label">组织:</span>
                  <span class="ip-tool__map-detail-value">{{ env.ipDetails.org }}</span>
                </div>

                <div class="ip-tool__map-detail-item">
                  <div class="ip-tool__map-detail-icon-wrapper">
                    <IconifyIconOnline icon="ri:time-line" class="ip-tool__map-detail-icon" />
                  </div>
                  <span class="ip-tool__map-detail-label">时区:</span>
                  <span class="ip-tool__map-detail-value">{{ env.ipDetails.timezone }}</span>
                </div>
              </div>

              <!-- 地图占位区域 -->
              <div class="ip-tool__map-container">
                <div class="ip-tool__map-placeholder">
                  <div class="ip-tool__map-placeholder-bg"></div>
                  <IconifyIconOnline icon="ri:map-2-line" class="ip-tool__map-placeholder-icon" />
                  <span class="ip-tool__map-placeholder-text">地图加载中...</span>
                  <div class="ip-tool__map-coordinates">
                    <span>经度: {{ env.ipDetails.longitude }}</span>
                    <span>纬度: {{ env.ipDetails.latitude }}</span>
                  </div>
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
  /* 地图卡片样式 */
  &__map-card {
    margin-bottom: 24px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    }
  }

  &__map-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__map-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 5px;
  }

  &__map-detail-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    background-color: var(--el-fill-color-light);
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9);
      transform: translateX(5px);
    }
  }

  &__map-detail-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: var(--el-color-primary-light-8);
    margin-right: 12px;
    transition: all 0.3s ease;

    .ip-tool__map-detail-item:hover & {
      background-color: var(--el-color-primary-light-5);
      transform: rotate(10deg);
    }
  }

  &__map-detail-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  &__map-detail-label {
    font-weight: 500;
    color: var(--el-text-color-secondary);
    margin-right: 8px;
    min-width: 80px;
  }

  &__map-detail-value {
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex: 1;
  }

  &__map-container {
    margin-top: 10px;
    border-radius: 12px;
    overflow: hidden;
    height: 220px;
  }

  &__map-placeholder {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);
    border-radius: 12px;
    overflow: hidden;
  }

  &__map-placeholder-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(45deg, var(--el-fill-color) 25%, transparent 25%, transparent 50%, var(--el-fill-color) 50%, var(--el-fill-color) 75%, transparent 75%, transparent);
    background-size: 20px 20px;
    opacity: 0.3;
    animation: ip-tool-map-bg-move 30s linear infinite;
  }

  &__map-placeholder-icon {
    font-size: 48px;
    color: var(--el-color-primary-light-3);
    margin-bottom: 12px;
    animation: ip-tool-map-pulse 2s ease-in-out infinite;
  }

  &__map-placeholder-text {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
  }

  &__map-coordinates {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @keyframes ip-tool-map-pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
  }

  @keyframes ip-tool-map-bg-move {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 500px 500px;
    }
  }
  /* 安全评估卡片样式 */
  &__security-card {
    margin-top: 24px;
    border-radius: 12px;
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: var(--el-color-primary-light-5);
    }
  }

  &__security-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--el-border-color);
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__security-icon {
    margin-right: 10px;
    font-size: 22px;
    color: var(--el-color-success);
  }

  &__security-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__security-score {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__security-score-circle {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: conic-gradient(var(--el-color-success) calc(var(--score) * 1%), var(--el-fill-color) 0%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(var(--el-color-success-rgb), 0.2);

    &::before {
      content: "";
      position: absolute;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--el-bg-color);
    }

    span {
      position: relative;
      font-size: 28px;
      font-weight: 700;
      color: var(--el-color-success);
    }
  }

  &__security-score-text {
    flex: 1;
  }

  &__security-score-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
  }

  &__security-score-risk {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 4px 12px;
    background-color: var(--el-color-success-light-9);
    border-radius: 20px;
    display: inline-block;
  }

  &__security-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
  }

  &__security-detail-item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color);
    transition: all 0.2s ease;

    &:hover {
      transform: translateX(5px);
      background-color: var(--el-color-success-light-9);
    }
  }

  &__security-detail-icon {
    font-size: 18px;
    color: var(--el-color-success);
    margin-right: 10px;
  }

  &__security-detail-label {
    flex: 1;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__security-detail-status {
    padding: 4px 10px;
    border-radius: 4px;
    background-color: var(--el-color-success-light-8);
    color: var(--el-color-success-dark-2);
    font-size: 13px;
    font-weight: 600;
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
    transition:
      transform 0.5s ease,
      box-shadow 0.5s ease;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
      box-shadow: 0 15px 40px rgba(var(--el-color-success-rgb), 0.4);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 20px;
    }

    /* IP 信息区域样式 */
    &-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 500px;
      margin: 0 auto;

      &-item {
        display: flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.15);
        padding: 8px 16px;
        border-radius: 10px;
        color: var(--el-text-color-primary);
        font-weight: 500;
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        text-align: left;

        &:hover {
          background-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }

      &-ip {
        background-color: rgba(255, 255, 255, 0.25);
        font-size: 1.1em;
        font-weight: 600;
      }

      &-icon {
        margin-right: 10px;
        font-size: 18px;
      }
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  }

  /* 内容区域样式 */
  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
    padding: 24px;
  }

  /* 头部容器样式 */
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
    transition:
      transform 0.5s ease,
      box-shadow 0.5s ease;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
      box-shadow: 0 15px 40px rgba(var(--el-color-success-rgb), 0.4);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 20px;
    }

    &-ip {
      display: inline-flex;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      backdrop-filter: blur(4px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
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
        animation: ip-tool-float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: ip-tool-float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        bottom: 50px;
        right: 100px;
        animation: ip-tool-float 10s infinite ease-in-out;
      }
    }
  }

  /* 卡片样式 */
  &__input-card,
  &__result-card,
  &__advanced-card,
  &__map-card {
    margin-bottom: 24px;
    border-radius: 8px;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    border: 1px solid var(--el-border-color-light);
    overflow: hidden;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  }

  /* 卡片头部样式 */
  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
    color: var(--el-color-primary);
  }

  /* 单选按钮组样式 */
  &__radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__radio-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 输入框样式 */
  &__input {
    margin-bottom: 16px;
  }

  /* 历史记录样式 */
  &__history {
    margin-bottom: 20px;
  }

  &__history-label {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__history-icon {
    margin-right: 6px;
  }

  &__history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__history-tag {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__parse-btn,
  &__now-btn,
  &__reset-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  /* 结果区域样式 */
  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 60px;
    color: var(--el-color-info-light-5);
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);
    }

    &--highlight {
      background-color: var(--el-color-success-light-9);
      border-color: var(--el-color-success-light-7);

      &:hover {
        background-color: var(--el-color-success-light-8);
      }
    }
  }

  &__result-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__result-icon {
    color: var(--el-color-primary);
  }

  &__result-value {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-regular);
    font-family: var(--el-font-family-monospace);
  }

  &__copy-btn {
    opacity: 0.6;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  /* 高级功能选项卡样式 */
  &__tabs {
    --el-tabs-header-height: 50px;
  }

  &__tab-content {
    padding: 16px 0;
  }

  &__tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__tab-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  &__tab-icon {
    color: var(--el-color-primary);
  }

  /* Ping 结果样式 */
  &__ping-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  &__ping-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-radius: 6px;
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s ease;

    &--success {
      border-left: 4px solid var(--el-color-success);
    }

    &--timeout {
      border-left: 4px solid var(--el-color-danger);
    }
  }

  &__ping-seq {
    font-weight: 500;
  }

  &__ping-time {
    color: var(--el-text-color-secondary);
  }

  &__ping-status-icon {
    font-size: 18px;
  }

  /* Traceroute 结果样式 */
  &__traceroute-results {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  &__traceroute-item {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  &__traceroute-hop {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    font-weight: 600;
  }

  &__traceroute-info {
    flex: 1;
  }

  &__traceroute-ip {
    font-weight: 500;
    margin-bottom: 4px;
    font-family: var(--el-font-family-monospace);
  }

  &__traceroute-details {
    display: flex;
    gap: 16px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  /* 安全评估卡片样式 */
  &__security-card {
    margin-top: 24px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
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
    bottom: 50px;
    right: 100px;
    animation: float 10s infinite ease-in-out;
  }
}

/* 浮动动画 */
@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}
</style>
