<template>
  <div class="overflow-x-hidden p-2 bg-gray-200 h-dvh relative">
    <div dv-bg class="h-full w-full !z-10 absolute top-0">
      <component :is="JvmMapViewer" ref="jvmMapViewerRef" :form="form" class="h-full w-full" @success="handleInitializeMap" />
    </div>
    <div class="absolute left-0 !text-white !z-30">
      <el-form :inline="true">
        <el-form-item>
          <el-select v-model="form.province" placeholder="请选择省份" class="!w-[200px]" @change="handleChange">
            <el-option v-for="item in provinceList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="!z-20">
      <el-row :gutter="20" class="py-1 !h-[230px]">
        <el-col :span="6" class="pt-2">
          <aYinTechBorderA1
            class="h-full z-20"
            :config="{
              title: '',
              titleWidth: 190,
              decorationAlt: true,
              rotate: 'y'
            }"
          >
            <div dv-bg class="h-full">
              <component :is="DiskViewer" ref="diskViewerRef" class="h-full w-full" @success="handleInitializeDisk" />
            </div>
          </aYinTechBorderA1>
        </el-col>
        <el-col :span="12" class="pt-2">
          <div dv-bg class="h-full">
            <component :is="JvmViewer" ref="jvmViewerRef" class="h-full w-full" @success="handleInitializeJvm" />
          </div>
        </el-col>
        <el-col :span="6" class="pt-2">
          <div dv-bg class="h-full">
            <component :is="JvmBaseViewer" ref="jvmBaseViewerRef" class="h-full w-full" @success="handleInitializeBase" />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="py-1" style="height: calc(100vh - 300px) !important">
        <el-col :span="6" class="pt-2 h-1/2 z-20">
          <aYinTechBorderA1
            class="h-1/2 pt-4"
            :config="{
              title: '系统CPU',
              titleWidth: 190,
              decorationAlt: true,
              rotate: 'y'
            }"
          >
            <div dv-bg class="h-full">
              <component :is="CpuViewer" ref="cpuViewerRef" class="h-full w-full" @success="handleInitializeCpu" />
            </div>
          </aYinTechBorderA1>
          <aYinTechBorderA1
            class="h-1/2 mt-4"
            :config="{
              title: '网络信息',
              titleWidth: 190,
              decorationAlt: true,
              rotate: 'y'
            }"
          >
            <div dv-bg class="h-full">
              <component :is="IoNetViewer" ref="ioNetViewerRef" class="h-full w-full" @success="handleInitializeIoNet" />
            </div>
          </aYinTechBorderA1>
        </el-col>
        <el-col :span="12" class="pt-2 h-full" />
        <el-col :span="6" class="pt-2 h-1/2 z-20">
          <aYinTechBorderA1
            class="h-full pt-4"
            :config="{
              title: '内存信息',
              titleWidth: 190,
              decorationAlt: true
            }"
          >
            <div dv-bg class="h-full">
              <component :is="MemViewer" ref="memViewerRef" class="h-full w-full" @success="handleInitializeMem" />
            </div>
          </aYinTechBorderA1>
          <aYinTechBorderA1
            class="h-full mt-4"
            :config="{
              title: '请求信息',
              titleWidth: 190,
              decorationAlt: true
            }"
          >
            <div dv-bg class="h-full">
              <component :is="JvmRequestViewer" ref="jvmRequestViewerRef" class="h-full w-full" @success="handleInitializeRequest" />
            </div>
          </aYinTechBorderA1>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script setup>
import { fetchIndicatorGet, fetchIndicatorQuery, fetchIndicatoryQps, fetchSearchQuery, fetchSearchAggregate } from "@/api/monitor/service";
import LoadingComponent from "@repo/components/ScLoad/index.vue";
import { Md5 } from "ts-md5";
import { computed, defineAsyncComponent, defineExpose, reactive, ref } from "vue";
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
const jvmViewerRef = ref(null);
const jvmBaseViewerRef = ref(null);
const jvmMapViewerRef = ref(null);
const cpuViewerRef = ref(null);
const memViewerRef = ref(null);
const ioNetViewerRef = ref(null);
const diskViewerRef = ref(null);
const jvmRequestViewerRef = ref(null);

const JvmViewer = defineAsyncComponent({
  loader: () => import("./part/jvm.vue"),
  loadingComponent: LoadingComponent
});

const JvmBaseViewer = defineAsyncComponent({
  loader: () => import("./part/jvm-base.vue"),
  loadingComponent: LoadingComponent
});

const JvmRequestViewer = defineAsyncComponent({
  loader: () => import("./part/jvm-request.vue"),
  loadingComponent: LoadingComponent
});

const JvmMapViewer = defineAsyncComponent({
  loader: () => import("./part/jvm-map.vue"),
  loadingComponent: LoadingComponent
});

const IoNetViewer = defineAsyncComponent({
  loader: () => import("./part/network.vue"),
  loadingComponent: LoadingComponent
});

const MemViewer = defineAsyncComponent({
  loader: () => import("./part/mem.vue"),
  loadingComponent: LoadingComponent
});

const CpuViewer = defineAsyncComponent({
  loader: () => import("./part/cpu.vue"),
  loadingComponent: LoadingComponent
});
const DiskViewer = defineAsyncComponent({
  loader: () => import("./part/disk.vue"),
  loadingComponent: LoadingComponent
});

const props = defineProps({
  data: Object
});
const config = reactive({
  supportEvent: ["JVM", "URL", "DISK", "CPU", "MEM", "IO_NETWORK"]
});

const handleInitializeMem = async () => {
  handleInitialize(
    "mem",
    "MEM",
    it => {
      memViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};

const handleInitializeIoNet = async () => {
  handleInitialize(
    "io-network:read",
    "IO_NETWORK",
    it => {
      ioNetViewerRef.value.handle(it, "read");
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
  handleInitialize(
    "io-network:write",
    "IO_NETWORK",
    it => {
      ioNetViewerRef.value.handle(it, "write");
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};
const handleInitializeCpu = async () => {
  handleInitialize(
    "cpu",
    "CPU",
    it => {
      cpuViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};
const handleInitializeDisk = async () => {
  handleInitialize("disk", "DISK", it => {
    diskViewerRef.value.handle(it);
  });
};
const handleInitialize = async (name, type, fun, query = {}) => {
  const q = {};
  Object.assign(q, query);
  q.name = name + ":" + Md5.hashStr(type + ":" + props.data.host + props.data.port);
  if (type === "DISK") {
    fetchIndicatorGet(q).then(res => {
      handleRender(fun, JSON.parse(res.data?.value));
    });
    return;
  }
  if (type === "JVM") {
    fetchIndicatorGet(q).then(res => {
      handleRender(fun, JSON.parse(res.data?.value));
    });
    return;
  }

  fetchIndicatorQuery(q).then(res => {
    res.data.forEach(it => {
      handleRender(fun, { timestamp: it.timestamp, free: it.value });
    });
  });
};
const handleRender = async (fun, data) => {
  fun(data);
};
const handleInitializeJvm = async () => {
  handleInitialize(
    "jvm",
    "JVM",
    it => {
      jvmViewerRef.value.handle(it);
    },
    { toTimestamp: new Date().getTime(), fromTimestamp: new Date().getTime() - 3600000 }
  );
};

const handleInitializeMap = async () => {
  const q = {
    toTimestamp: new Date().getTime(),
    fromTimestamp: new Date().getTime() - 3600000,
    groupBy: "@city"
  };
  q.name = "url:" + Md5.hashStr("URL:" + props.data.host + props.data.port);
  fetchSearchAggregate(q).then(res => {
    jvmMapViewerRef.value.handle(res?.data?.data || {});
  });
};
const handleInitializeRequest = async () => {
  const q = {
    toTimestamp: new Date().getTime(),
    fromTimestamp: new Date().getTime() - 3600000,
    groupBy: "@timeOfMinute"
  };
  q.name = "url:" + Md5.hashStr("URL:" + props.data.host + props.data.port);
  fetchSearchAggregate(q).then(res => {
    jvmRequestViewerRef.value.handle(res?.data?.data || {});
  });
};

const handleChange = async () => {
  handleInitializeMap();
};
const handleInitializeBase = async () => {
  const q = {};
  q.name = "url:" + Md5.hashStr("URL:" + props.data.host + props.data.port);
  fetchIndicatoryQps(q).then(res => {
    jvmBaseViewerRef.value.handle("qps", res.data);
  });
};

const publish = async (event, data) => {
  if (!config.supportEvent.includes(event)) {
    return;
  }
  if ("JVM" === event) {
    handleRender(it => jvmViewerRef.value?.handle(it), data);
    return;
  }

  if ("DISK" === event) {
    handleRender(it => diskViewerRef.value?.handle(it), data);
    return;
  }

  if ("CPU" === event) {
    handleRender(it => cpuViewerRef.value?.handle(it), { timestamp: data.timestamp, free: data.free });
    return;
  }

  if ("MEM" === event) {
    handleRender(it => memViewerRef.value?.handle(it), { timestamp: data.timestamp, free: data.free });
    return;
  }

  if ("IO_NETWORK" === event) {
    handleRender(it => ioNetViewerRef.value?.handle(it), data);
  }

  if ("URL" === event) {
    jvmBaseViewerRef.value.increament("qps", 1 / 86400);
    jvmBaseViewerRef.value.increament("city", data.city);
    JvmMapViewerRef.value.increament("city", data.city);
    return;
  }
};

defineExpose({ publish });
</script>
<style lang="scss" scoped>
:deep(.el-card__body) {
  height: 100%;
}
:deep(.el-card) {
  background: transparent !important;
}
</style>
