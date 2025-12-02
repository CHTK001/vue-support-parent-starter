<template>
  <div class="sc-ip-container">
    <template v-if="displayAddress">
      <span class="flex flex-col justify-start">
        <span class="sc-ip-empty">{{ displayAddress }}</span>
        <template v-if="showOriginal">
          <span v-if="!openSearchOriginal" class="sc-ip-address">{{ ip }}</span>
          <span v-else class="text-blue-400 cursor-pointer" @click="handleOpenIpAddress()">{{ ip || "-" }}</span>
        </template>
      </span>
      <el-tooltip v-if="showIpOnHover && ip" effect="dark" :content="ip" placement="top">
        <i class="sc-ip-icon el-icon-info" />
      </el-tooltip>
    </template>
    <template v-else-if="loading">
      <el-skeleton :rows="1" animated />
    </template>
    <template v-else>
      <span class="flex flex-col">
        <span v-if="showOriginal" class="sc-ip-address">{{ ip }}</span>
        <span class="sc-ip-empty">{{ emptyText }}</span>
      </span>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onMounted, computed } from "vue";
import { getPhysicalAddressByIp } from "@repo/utils";

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
    }
  },
  setup(props, { emit }) {
    const loading = ref(false);
    const displayAddress = ref("");

    // 获取物理地址
    const fetchPhysicalAddress = async () => {
      if (!props.ip) {
        displayAddress.value = "";
        return;
      }

      // 提取纯IP地址（去除端口号）
      const pureIp = () => {
        if (!props.ip) return "";

        // 如果包含端口号（格式如 192.168.1.1:8080），则只取IP部分
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
      } else {
        displayAddress.value = "";
      }
    };

    // 监听属性变化
    watch(() => props.physicalAddress, updateDisplayAddress);
    watch(() => props.ip, updateDisplayAddress);

    // 组件挂载时初始化
    onMounted(updateDisplayAddress);

    return {
      loading,
      displayAddress
    };
  },
  methods: {
    async handleOpenIpAddress() {
      window.open(`https://www.baidu.com/s?wd=${this.ip}&from=t-io`, "_blank");
    }
  }
});
</script>

<style scoped>
.sc-ip-container {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.sc-ip-address {
  color: var(--el-text-color-regular);
}

.sc-ip-empty {
  color: var(--el-text-color);
  font-style: italic;
}

.sc-ip-icon {
  margin-left: 5px;
  font-size: 16px;
  color: var(--el-text-color);
  cursor: help;
}
</style>
