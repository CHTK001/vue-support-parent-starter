<template>
  <div class="h-full">
    <div class="relative left-[94%]">
      <el-badge :value="dataList1.length" :show-zero="false" class="!sticky" />
    </div>
    <div class="h-full w-full overflow-y-auto">
      <el-empty v-if="dataList1.length == 0" />
      <div v-else class="screenB-counterGrid flex flex-auto w-full flex-wrap">
        <div v-for="item in dataList1 || []" :key="item" class="content-wrap">
          <div class="flex justify-center items-center">
            <decoFrameA1 :config="decoFrameConfig">
              <el-popover placement="left" :width="350" style="background: transparent !important; border: 0 !important" popper-class="custom">
                <template #reference>
                  <component :is="getIcon(item)" style="font-size: 34px" />
                </template>

                <aYinTechBorderB1 :config="decoFrameConfig2" style="height: 240px; padding: 20px">
                  <el-row :gutter="10" class="p-5">
                    <el-col :span="9" style="padding: 0">
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">硬件名称</div>
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">制造商</div>
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">时间</div>
                    </el-col>
                    <el-col :span="15" style="padding: 0">
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px" class="truncate" :title="item.name">{{ item.name }}</div>
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ item.vendor }}</div>
                      <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ dateFormat(item.timestamp) }}</div>
                    </el-col>
                  </el-row>
                </aYinTechBorderB1>
              </el-popover>
            </decoFrameA1>
          </div>
          <div class="flex justify-center items-center" style="padding-top: -10px">
            <div class="block-title truncate w-[78px]" :title="item.name">
              {{ item?.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { fetchIndicatorGet } from "@/api/monitor/service";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { dateFormat } from "@/utils/date";
import { Md5 } from "ts-md5";

import { onBeforeMount, reactive, ref, defineEmits } from "vue";
const decoFrameConfig = {
  directionAlt: false,
  scale: 0.6
};
const decoFrameConfig2 = {
  backgroundColor: $c.bll9,
  borderColor: $c.bll7,
  decorationColor: [$c.bll3, $c.cyl5]
};
const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});

const emits = defineEmits(["success"]);
const iconColl = reactive({});

const id = ref("USB:" + props.form.host + props.form.port);
const dataList1 = ref([]);

const getIcon = data => {
  if (data.vendor == "Microsoft") {
    return useRenderIcon("simple-icons:microsoft");
  }
  if (data.vendor.indexOf("标准系统设备") > -1) {
    return useRenderIcon("ri:computer-line");
  }
  return useRenderIcon("simple-icons:coinmarketcap");
};
onBeforeMount(async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "usb:" + Md5.hashStr(id.value);
    fetchIndicatorGet(q).then(res => {
      try {
        update(JSON.parse(res.data?.value || "{}"));
      } catch (error) {}
    });
  }
});
const update = async data => {
  setTimeout(() => {
    dataList1.value = data;
    emits("success", id.value, "count", data.length);
  }, 500);
};

defineExpose({
  update
});
</script>
<style lang="scss">
.custom {
  border: 0 !important;
  background: transparent !important;
  padding: 6px !important;
}
</style>
