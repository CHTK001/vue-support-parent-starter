<script setup>
import tool from "@/utils/tool"


const store=useStore();
const state = reactive({
  chartOption: {
  }
});

const dataList =reactive({
  data: []
})

const loading = reactive({show: false});
const config={
  textColor:$c.cyl5,
}

watch( ()=>store.state.sys.process, (val,preVal)=>{
    //val为修改后的值,preVal为修改前的值
    if(val.data) {
      const {data} = val;
      dataList.data = data;
      loading.show = true;
    }
    },{
    immediate: true,
    deep: true
}
)

const configFrame={
  decorationAlt:true,
  glow:false,
  scale: 0.7
}

const popover = {
    backgroundColor:$c.bll9,
    borderColor:$c.bll7,
    decorationColor:[$c.bll3,$c.cyl5],
}
const calculateDuration = (durationInMillis) => {
      // 计算相差的天数
      var days = Math.floor(durationInMillis / (1000 * 60 * 60 * 24));
      
      // 计算相差的小时数（不包括天）
      var hours = Math.floor((durationInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      // 计算相差的分钟数（不包括小时）
      var minutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));
      
      return days + "天 " + hours + "小时 " + minutes + "分钟";
  }

  const getIcon = (item) => {
    const name = item?.name?.toLowerCase() || '';
    if(name.indexOf('java') > -1) {
      return 'sc-icon-app-java';
    }

    if(name.indexOf('vivaldi') > -1) {
      return 'sc-icon-app-vivaldi';
    }

    if(name.indexOf('node') > -1) {
      return 'sc-icon-app-node';
    }
    if(name == 'code') {
      return 'sc-icon-app-vscode';
    }
    if(name == 'explorer') {
      return 'sc-icon-app-explorer';
    }
    if(name.indexOf('idea') > -1) {
      return 'sc-icon-app-idea';
    }
    if(name.indexOf('todesk') > -1) {
      return 'sc-icon-app-desk';
    }
    if(name.indexOf('terminal') > -1) {
      return 'sc-icon-terminal';
    }
    if(name.indexOf('wechat') > -1) {
      return 'sc-icon-app-weixin';
    }
    if(name.indexOf('chrome') > -1) {
      return 'sc-icon-app-chrome';
    }
    return 'sc-icon-cpu'
  }
</script>
<template>
  <div style="margin-top: 32px; display: flex; flex-wrap: wrap;" v-if="loading.show">
      <decoFrameA2 style="flex: 0 0 auto; width: 20%; flex-direction: column;font-size: 45px" :config="configFrame"  v-for="item of dataList.data">
        <el-popover placement="left" :width="350" style="background: transparent; border: 0;">
          <template #reference>
          <el-icon>
            <component :is="getIcon(item)"></component>
          </el-icon>
        </template>
            <aYinTechBorderB1 :config="popover" style="height: 240px;padding: 20px">
              <el-row :gutter="10" style="margin: 0">
                <el-col :span="9" style="padding: 0">
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">进程名称</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">进程PID</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">进程开始时间</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">进程状态</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">内存大小</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">持续时间</div>
                </el-col>
                <el-col :span="15" style="padding: 0">
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ item.name }}</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ item.processId }}</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px"><span v-time="item.startTime"></span></div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ item.status }}</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ tool.sizeFormat(item.virtualSize) }}</div>
                  <div style="font-size: 14px; color: #fff; padding: 10px 0 0 10px">{{ calculateDuration(item.upTime) }}</div>

                </el-col>
              </el-row>
            </aYinTechBorderB1>
        </el-popover>
      </decoFrameA2>
  </div>
  <div style="position: relative;left: 44%; top: 50%" v-else :config="config">暂无数据</div>
  <echartsInit :chartOption="state.chartOption"></echartsInit>

</template>
<style lang="less">
.el-popper,
.el-popper.is-light,
:deep(.el-popper) {
  border: 0 !important;
  background: transparent !important;
}
</style>
