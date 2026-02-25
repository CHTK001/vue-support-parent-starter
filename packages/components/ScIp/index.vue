<template>
  <div class="sc-ip" :class="[`sc-ip--${variant}`, `sc-ip--${size}`, { 'sc-ip--card': card }]">
    <!-- 加载状态 -->
    <template v-if="loading">
      <div class="sc-ip__loading">
        <el-skeleton :rows="1" animated style="width: 120px" />
      </div>
    </template>

    <!-- 主内容 -->
    <template v-else>
      <!-- 图标 -->
      <div v-if="showIcon" class="sc-ip__icon" :class="{ 'sc-ip__icon--animated': animated }">
        <!-- 优先显示国旗或城市 -->
        <template v-if="!isLocal && ipInfo">
           <span v-if="isChina" class="sc-ip__icon-text">{{ cityAbbr }}</span>
           <IconifyIconOnline v-else :icon="countryFlagIcon" style="font-size: 24px;" />
        </template>
        <!-- 默认图标 -->
        <template v-else>
          <svg v-if="iconType === 'location'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <svg v-else-if="iconType === 'globe'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM3 17V7h18v10H3z"/>
            <circle cx="7.5" cy="12" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="16.5" cy="12" r="1.5"/>
          </svg>
        </template>
      </div>

      <!-- 内容区 -->
      <div class="sc-ip__content">
        <!-- 物理地址 -->
        <div v-if="displayAddress" class="sc-ip__address">
          <span class="sc-ip__location">{{ displayAddress }}</span>
        </div>

        <!-- IP 地址 -->
        <div v-if="showOriginal && ip" class="sc-ip__ip">
          <span
            v-if="openSearchOriginal"
            class="sc-ip__ip-text sc-ip__ip-text--link"
            @click="handleOpenIpAddress"
          >
            {{ ip }}
          </span>
          <span v-else class="sc-ip__ip-text">{{ ip }}</span>

          <!-- 复制按钮 -->
          <el-tooltip v-if="copyable" :content="copied ? '已复制' : '复制IP'" placement="top">
            <button class="sc-ip__copy" :class="{ 'sc-ip__copy--success': copied }" @click="handleCopy">
              <svg v-if="!copied" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
          </el-tooltip>
        </div>

        <!-- 空状态 -->
        <div v-if="!displayAddress && !ip" class="sc-ip__empty">
          {{ emptyText }}
        </div>
      </div>

      <!-- 状态标签 -->
      <el-tag v-if="showTag && displayAddress" :type="tagType" size="small" class="sc-ip__tag" effect="light">
        {{ isLocal ? '本地' : '公网' }}
      </el-tag>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted, computed } from "vue";
import { getPhysicalAddressByIp, getIpInfo } from "@repo/utils";

const PROVINCE_ABBR_MAP = {
  "Beijing": "京",
  "Shanghai": "沪",
  "Tianjin": "津",
  "Chongqing": "渝",
  "Hebei": "冀",
  "Shanxi": "晋",
  "Liaoning": "辽",
  "Jilin": "吉",
  "Heilongjiang": "黑",
  "Jiangsu": "苏",
  "Zhejiang": "浙",
  "Anhui": "皖",
  "Fujian": "闽",
  "Jiangxi": "赣",
  "Shandong": "鲁",
  "Henan": "豫",
  "Hubei": "鄂",
  "Hunan": "湘",
  "Guangdong": "粤",
  "Hainan": "琼",
  "Sichuan": "川",
  "Guizhou": "贵",
  "Yunnan": "云",
  "Shaanxi": "陕",
  "Gansu": "甘",
  "Qinghai": "青",
  "Taiwan": "台",
  "Inner Mongolia": "蒙",
  "Guangxi": "桂",
  "Tibet": "藏",
  "Ningxia": "宁",
  "Xinjiang": "新",
  "Hong Kong": "港",
  "Macao": "澳"
};

export default defineComponent({
  name: "ScIp",
  props: {
    /**
     * IP地址
     */
    ip: {
      type: String,
      default: ""
    },
    /**
     * 物理地址
     */
    physicalAddress: {
      type: String,
      default: ""
    },
    /**
     * 是否显示原始IP地址
     */
    showOriginal: {
      type: Boolean,
      default: true
    },
    /**
     * 是否跳转到搜索页面
     */
    openSearchOriginal: {
      type: Boolean,
      default: true
    },
    /**
     * 当显示物理地址时，是否在悬停时显示IP
     */
    showIpOnHover: {
      type: Boolean,
      default: true
    },
    /**
     * 当IP和物理地址都不存在时显示的文本
     */
    emptyText: {
      type: String,
      default: "未知位置"
    },
    /**
     * 样式变体
     */
    variant: {
      type: String,
      default: "default",
      validator: (val) => ["default", "primary", "success", "warning", "danger", "info"].includes(val)
    },
    /**
     * 尺寸
     */
    size: {
      type: String,
      default: "default",
      validator: (val) => ["small", "default", "large"].includes(val)
    },
    /**
     * 是否显示图标
     */
    showIcon: {
      type: Boolean,
      default: true
    },
    /**
     * 图标类型
     */
    iconType: {
      type: String,
      default: "location",
      validator: (val) => ["location", "globe", "network"].includes(val)
    },
    /**
     * 是否显示为卡片样式
     */
    card: {
      type: Boolean,
      default: false
    },
    /**
     * 是否可复制IP
     */
    copyable: {
      type: Boolean,
      default: true
    },
    /**
     * 是否显示网络类型标签
     */
    showTag: {
      type: Boolean,
      default: false
    },
    /**
     * 是否启用动画
     */
    animated: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const loading = ref(false);
    const displayAddress = ref("");
    const copied = ref(false);
    const ipInfo = ref(null);

    // 判断是否是本地IP
    const isLocal = computed(() => {
      if (!props.ip) return false;
      const ip = props.ip.split(":")[0];
      return (
        ip.startsWith("192.168.") ||
        ip.startsWith("10.") ||
        ip.startsWith("172.16.") ||
        ip.startsWith("127.") ||
        ip === "localhost"
      );
    });

    const isChina = computed(() => {
        return ipInfo.value?.country_code === 'CN';
    });

    const countryFlagIcon = computed(() => {
        if (!ipInfo.value?.country_code) return "";
        return `circle-flags:${ipInfo.value.country_code.toLowerCase()}`;
    });

    const cityAbbr = computed(() => {
        if (!ipInfo.value) return "";
        const region = ipInfo.value.region || "";
        const city = ipInfo.value.city || "";
        
        for (const key in PROVINCE_ABBR_MAP) {
             if (region.includes(key) || city.includes(key)) {
                  return PROVINCE_ABBR_MAP[key];
             }
        }
        return "中";
    });

    // 标签类型
    const tagType = computed(() => {
      return isLocal.value ? "info" : "success";
    });

    // 获取物理地址
    const fetchPhysicalAddress = async () => {
      if (!props.ip) {
        displayAddress.value = "";
        return;
      }

      const pureIp = () => {
        if (!props.ip) return "";
        const ipParts = props.ip.split(":");
        return ipParts[0];
      };

      loading.value = true;
      try {
        const address = await getPhysicalAddressByIp(pureIp());
        displayAddress.value = address || props.emptyText;
        emit("address-loaded", address);
      } catch (error) {
        console.error("获取物理地址失败:", error);
        displayAddress.value = props.emptyText;
        emit("address-error", error);
      } finally {
        loading.value = false;
      }
    };

    // 更新显示地址
    const updateDisplayAddress = () => {
      if (props.physicalAddress) {
        displayAddress.value = props.physicalAddress;
      } else if (props.ip) {
        fetchPhysicalAddress();
        if (!isLocal.value) {
            getIpInfo(props.ip).then(info => {
                ipInfo.value = info;
            });
        }
      } else {
        displayAddress.value = "";
      }
    };

    // 复制IP
    const handleCopy = async () => {
      if (!props.ip || copied.value) return;
      try {
        await navigator.clipboard.writeText(props.ip);
        copied.value = true;
        emit("copy", props.ip);
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      } catch (error) {
        console.error("复制失败:", error);
      }
    };

    // 打开搜索
    const handleOpenIpAddress = () => {
      window.open(`https://www.baidu.com/s?wd=${props.ip}&from=t-io`, "_blank");
    };

    watch(() => props.physicalAddress, updateDisplayAddress);
    watch(() => props.ip, updateDisplayAddress);

    onMounted(updateDisplayAddress);

    return {
      loading,
      displayAddress,
      copied,
      isLocal,
      tagType,
      handleCopy,
      handleOpenIpAddress,
      ipInfo,
      isChina,
      countryFlagIcon,
      cityAbbr
    };
  }
});
</script>

<style lang="scss" scoped>
.sc-ip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 图标
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary-light-3) 100%);
    color: var(--el-color-primary);
    overflow: hidden;
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;
    }

    &--animated {
      animation: pulse 2s infinite;
    }
  }
  
  &__icon-text {
    font-weight: bold;
    font-size: 16px;
    color: var(--el-color-primary);
  }

  // 内容
  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__address {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__location {
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ip {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__ip-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;

    &--link {
      color: var(--el-color-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }
  }

  &__copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    &--success {
      color: var(--el-color-success);
    }
  }

  &__empty {
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }

  &__tag {
    flex-shrink: 0;
  }

  &__loading {
    display: flex;
    align-items: center;
  }

  // 卡片样式
  &--card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    padding: 12px 16px;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
  }

  // 变体样式
  &--primary .sc-ip__icon {
    background: linear-gradient(135deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary-light-3) 100%);
    color: var(--el-color-primary);
  }

  &--success .sc-ip__icon {
    background: linear-gradient(135deg, var(--el-color-success-light-5) 0%, var(--el-color-success-light-3) 100%);
    color: var(--el-color-success);
  }

  &--warning .sc-ip__icon {
    background: linear-gradient(135deg, var(--el-color-warning-light-5) 0%, var(--el-color-warning-light-3) 100%);
    color: var(--el-color-warning);
  }

  &--danger .sc-ip__icon {
    background: linear-gradient(135deg, var(--el-color-danger-light-5) 0%, var(--el-color-danger-light-3) 100%);
    color: var(--el-color-danger);
  }

  &--info .sc-ip__icon {
    background: linear-gradient(135deg, var(--el-color-info-light-5) 0%, var(--el-color-info-light-3) 100%);
    color: var(--el-color-info);
  }

  // 尺寸
  &--small {
    font-size: 12px;
    padding: 4px 8px;
    gap: 8px;

    .sc-ip__icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;

      svg {
        width: 14px;
        height: 14px;
      }
    }

    .sc-ip__ip-text {
      font-size: 11px;
    }
  }

  &--large {
    font-size: 16px;
    padding: 10px 14px;
    gap: 12px;

    .sc-ip__icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;

      svg {
        width: 22px;
        height: 22px;
      }
    }

    .sc-ip__ip-text {
      font-size: 14px;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
