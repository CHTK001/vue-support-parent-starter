<template>
  <div class="h-[100vh] relative bg">
    <div class="fixed z-[999] right-4 top-4 flex flex-col justify-center items-end gap-2 m-4">
      <el-button :icon="useRenderIcon('fa:power-off')" type="danger" circle draggable @click="handleOff" />
      <el-button :icon="useRenderIcon('ep:refresh')" type="primary" circle draggable @click="handleRefresh" />
      <el-button :icon="useRenderIcon('ep:d-arrow-left')" circle draggable @click="handleOpenMore" />
    </div>
    <component :is="JvmView" ref="viewRef" :form="form" class="bg" :data="config.urlData" />
  </div>
  <el-drawer v-model="config.visible" title="设置" @close="handleCloseMore">
    <el-form :inline="true">
      <el-form-item label="显示省份">
        <el-select v-model="form.province" placeholder="请选择省份" class="!w-[200px]" @change="handleChange">
          <el-option v-for="item in provinceList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { fetchSetting, socket } from "@repo/core";
import * as Base64 from "js-base64";
import { Md5 } from "ts-md5";
import { defineAsyncComponent, onMounted, onUnmounted, reactive, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
const router = useRouter();

const route = useRoute();
const urlData = route.query.data;
const JvmView = defineAsyncComponent({
  loader: () => import("./jvm.vue"),
  loadingComponent: LoadingComponent
});

const form = reactive({
  province: "zhejiang",
  provinceName: computed(() => {
    return provinceList.find(item => item.value === form.province)?.label;
  })
});
const provinceList = reactive([
  {
    label: "北京市",
    value: "beijing"
  },
  {
    label: "天津市",
    value: "tianjin"
  },
  {
    label: "河北省",
    value: "hebei"
  },
  {
    label: "山西省",
    value: "shanxi"
  },
  {
    label: "内蒙古自治区",
    value: "neimenggu"
  },
  {
    label: "辽宁省",
    value: "liaoning"
  },
  {
    label: "吉林省",
    value: "jilin"
  },
  {
    label: "黑龙江省",
    value: "heilongjiang"
  },
  {
    label: "上海市",
    value: "shanghai"
  },
  {
    label: "江苏省",
    value: "jiangsu"
  },
  {
    label: "浙江省",
    value: "zhejiang"
  },
  {
    label: "安徽省",
    value: "anhui"
  },
  {
    label: "福建省",
    value: "fujian"
  },
  {
    label: "江西省",
    value: "jiangxi"
  },
  {
    label: "山东省",
    value: "shandong"
  },
  {
    label: "河南省",
    value: "henan"
  },
  {
    label: "湖北省",
    value: "hubei"
  },
  {
    label: "湖南省",
    value: "hunan"
  },
  {
    label: "广东省",
    value: "guangdong"
  },
  {
    label: "海南省",
    value: "hainan"
  },
  {
    label: "重庆市",
    value: "chongqing"
  },
  {
    label: "四川省",
    value: "sichuan"
  },
  {
    label: "贵州省",
    value: "guizhou"
  },
  {
    label: "云南省",
    value: "yunnan"
  },
  {
    label: "陕西省",
    value: "shanxi1"
  },
  {
    label: "甘肃省",
    value: "gansu"
  },
  {
    label: "青海省",
    value: "qinghai"
  },
  {
    label: "台湾省",
    value: "taiwan"
  },
  {
    label: "香港特别行政区",
    value: "xianggang"
  },
  {
    label: "澳门特别行政区",
    value: "aomen"
  },
  {
    label: "广西壮族自治区",
    value: "guangxi"
  },
  {
    label: "西藏自治区",
    value: "xizang"
  },
  {
    label: "宁夏回族自治区",
    value: "ningxia"
  },
  {
    label: "新疆维吾尔自治区",
    value: "xinjiang"
  }
]);

// 按照 value 首字母排序
provinceList.sort((a, b) => a.value.localeCompare(b.value));
provinceList.push({
  label: "局域网",
  value: "juyuwang"
});
const viewRef = ref();
const config = reactive({
  events: [],
  visible: false,
  activeTab: "Jvm",
  urlData: JSON.parse(Base64.decode(urlData)),
  selectedServer: [],
  environment: {},
  socket: null
});

const suffix = ":" + config.urlData.host + config.urlData.port;
["URL", "LOG", "JVM", "SYS", "CPU", "MEM", "DISK", "IO_NETWORK"].forEach(it => {
  config.events.push(it);
});

const handleOff = async () => {
  handleCloseSocket();
  router.go(-1);
};
const handleChange = async () => {
  viewRef.value.handleChange();
};
const handleCloseMore = async () => {
  config.visible = false;
};
const handleOpenMore = async () => {
  config.visible = true;
};

const handleRefresh = async () => {
  viewRef.value.handleRefresh();
};
const handleInitialize = async () => {
  const setting = await fetchSetting("config");
  setting.data.forEach(it => {
    const key = it["sysSettingName"];
    config.environment[key] = it["sysSettingValue"];
  });
};
const handleCloseSocket = () => {
  if (!config.socket) {
    return;
  }
  config.events.forEach(it => {
    config.socket.off(Md5.hashStr(it + suffix));
  });
  config.socket.close();
};
const handleOpenSocket = async () => {
  if (config.environment["SocketOpen"] != "true") {
    return;
  }
  config.socket = socket(config.environment["SocketUrl"]?.split(","), config.environment["SocketPath"] || "/socket.io");
  config.events.forEach(it => {
    config.socket.on(Md5.hashStr(it + suffix), data => {
      const item = data?.data;
      if (item) {
        viewRef.value?.publish(it, JSON.parse(item));
      }
    });
  });
};

onMounted(async () => {
  await handleInitialize();
  handleOpenSocket();
});

onUnmounted(async () => {
  handleCloseSocket();
});
</script>

<style lang="scss" scoped>
:deep(.el-drawer) {
  background: rgba(255, 255, 255, 0.9);
}
.bg {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%231f3347' fill-opacity='0.3' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(ellipse at bottom, #1c1c1c 10%, #000000 50%, #1c1c1c 100%);
}
</style>
