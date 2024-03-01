<template>
  <DraggableContainer ref="containerRef" class="overflow-hidden ">
    <div class="title-header">
      <span style="font-size: 18px; color: white; position: relative;  left: 36%;">系统信息</span>
      <dv-decoration5 :dur="2" style="width:300px;height:20px;"></dv-decoration5>
    </div>
    <div class=" bg-cover  bg-center h-screen p-2 flex overflow-hidden" :style="{ backgroundImage: `url(${bg})`,  }">
      <div class="flex-1 mr-2 bg-opacity-50 bg-slate-800  p-3 flex flex-col bg">
        <datav :value="viliable" id="1"   class="h-1/3 box-border pb-4 bg-transparent">
          <mem :data="memData" :free="memFreeData"></mem>
        </datav>

        <datav :value="viliable" id="3"  class="h-1/3 box-border pb-4">
          <cpu :data="cpuData"></cpu>
        </datav>

        <datav :value="viliable" id="2"  class="h-1/3">
          <disk :data="diskData"></disk>
        </datav>
      </div>

      <div class="w-1/2 mr-2 bg-opacity-50 bg-slate-800 flex flex-col">
      </div>

      <div class="flex-1 bg-opacity-50 bg-slate-800 p-3 flex flex-col" style="max-width: 450px;">
        <datav :value="viliable" id="4" :min="false" :closeable="false" :draggable="false" style="height: 280px; right: 0; width: 100%;" class="vdr-container1 h-1/3 box-border pb-3">
          <el-button @click="refreshLink" size="small" icon="el-icon-refresh" class="bg-opacity-50 bg-slate-800 absolute" style="right: 10px; background: transparent; color: white" circle plain ></el-button>
          <el-button @click="appValiable.link = true" size="small" icon="sc-icon-link" class="bg-opacity-50 bg-slate-800 absolute" style="right: 40px; background: transparent; color: white" circle plain ></el-button>
          <link-layout ref="linkRef" :data="form" class="h-1/3" :loading="loadLink" @success="loadLink = false"></link-layout>
          <dv-loading v-if="loadLink"> 
            <div color-white class="text-white">
              加载中...
            </div>
          </dv-loading>
        </datav>

        <datav :value="viliable"  id="5" :min="false" :closeable="false" :draggable="false" :y="290" style="height: 280px; top: 20px; right: 0;width: 100%" class="vdr-container1 h-1/3 box-border pb-3 w-full">
          <app-layout :data="form" @success="appSuccess"></app-layout>
        </datav>

        <datav :value="viliable"  id="5" :min="false" :closeable="false" :draggable="false" :y="290" style="height: 280px; top: 20px; right: 0;width: 100%" class="vdr-container1 h-1/3 box-border pb-3 w-full">
          <Jvm :data="jvmData" @success="appSuccess"></Jvm>
        </datav>
      </div>
    </div>

    <drag10 :draggable="false" @status="appStatus" title="系统调用" icon="sc-icon-link" :value="appValiable.link" draggable id="link" :width="1200" :height="700" :x="half1000" :y="20">
      <link2-layout :value="form"  ref="linkRef" :data="form"  :loading="loadLink" @success="loadLink = false"></link2-layout>
    </drag10>
    
    <drag10 @status="appStatus" title="系统日志" icon="sc-icon-log" :value="appValiable.log" id="log" :width="1200" :height="700" :x="half1000" :y="20">
      <ComLogLayout :value="form"  :h="600"/>
    </drag10>
 
    <drag10 @status="appStatus" title="系统链路" icon="sc-icon-trace" :value="appValiable.trace" id="trace" :width="1200" :height="700" :x="half1000" :y="20">
      <ComTraceLayout :value="form"  :h="600"/>
    </drag10>

    <drag10 @status="appStatus" title="系统进程 TOP10" icon="sc-icon-cpu" :value="appValiable.process" id="process" :width="700" :height="500" :x="half" :y="40">
      <ComProcessLayout :value="form"  :data="processData" :h="400"/>
    </drag10>

    <drag0 @status="appStatus" title="系统终端" icon="sc-icon-terminal" :value="appValiable.terminal" id="terminal" :width="1200" :height="700" :x="half1000" :y="40">
      <ComTerminalLayout :value="form" :data="processData" :h="400" @status="appStatus"/>
    </drag0>
  </DraggableContainer>
</template>

<script>
import { DraggableContainer } from 'vue3-draggable-resizable'
// 导入Utils模块中的getQueryString、getAssetsImages和getQueryPathString函数
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import { inject } from "vue"

import Mem from './mem.vue';
import Disk from './disk.vue';
import Cpu from './cpu.vue';
import Jvm from './Jvm.vue';
import LinkLayout from './link.vue'
import Link2Layout from './link2.vue'
import AppLayout from './app.vue'
import ComLogLayout  from '../log/index.vue'
import ComTraceLayout  from '../trace/index.vue'
import ComTerminalLayout  from '../terminal/index.vue'
import ComProcessLayout  from './process.vue'

export default {
  name: 'BorderBox13',
  components: { DraggableContainer, Mem, Disk, Cpu, Jvm, LinkLayout, Link2Layout, AppLayout, ComLogLayout, ComTraceLayout, ComProcessLayout, ComTerminalLayout },
  props: {
    data: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      form: this.data,
      bg: getAssetsImages('bg-1.jpg'),
      viliable: true,
      appValiable: {
        log: false,
        trace: false,
        link: false,
        terminal: false,
        process: false
      },
      socket: inject('socket'),
      plugins: [{
        name: 'mem',
        label: '内存',
        type: 'percentage',
        isColl: false
      }, {
        name: "jvm",
        label: '虚拟机',
        type: 'table',
        isColl: false
      }, {
        name: "process",
        label: '进程(top 10)',
        type: 'table',
        isColl: false
      }, {
        name: "network",
        label: '网络',
        type: 'echarts-nolimit',
        isColl: true
      }, {
        name: 'disk',
        label: '磁盘',
        type: 'disk',
        isColl: false
      }, {
        name: 'cpu',
        type: 'echarts',
        isColl: true
      }],
      diskData: [],
      jvmData: {},
      memData: 0,
      memFreeData: 0,
      cpuData: [0],
      cpuXData: [0],
      appname: null,
      processData: [],
      loadLink: true,
      offsetWidth: window.document.body.offsetWidth,
      offsetHeight: 0,
      half: 0
    }
  },
  watch: {
    data() {
      this.form = this.data;
    }
  },
  computed: {
    half() {
      return this.offsetWidth == 0 ? 0 : (this.offsetWidth  - 600)/ 2;
    },
    half1000() {
      return this.offsetWidth == 0 ? 0 : (this.offsetWidth  - 1100)/ 2;
    },
  },
  beforeUnmount() {
    this.closeSocket();
  },
  created() {
    this.openSocket();
    this.afterPropertiesSet();
  },
  methods: {
    afterPropertiesSet() {
      this.$nextTick(() => {
        this.offsetWidth = this.$refs.containerRef.$el.offsetWidth;
        this.offsetHeight = this.$refs.containerRef.$el.offsetHeight;
        console.log("offsetWidth:" + this.offsetWidth );
        this.half = (this.offsetWidth  - 600)/ 2;
      })
    },  
    appStatus(status, id) {
      this.appValiable[id] = status;
    },
    appSuccess(data){
      this.appValiable[data] = true;
    },
    refreshLink(){
      this.$nextTick(() => {
        this.$refs.linkRef.query();
      })
    },
    openSocket() {
      const _this = this;
      this.plugins.forEach(item => {
        this.socket.on(item.name, (it) => {
          const value = it;
          if (!this.isMatch(value)) {
            return false;
          }
          const reportType = value.reportType;
          if (reportType == 'memory') {
            this.doMemory(value?.data);
            return;
          }
          if (reportType == 'disk') {
            this.doDisk(value?.data);
            return;
          }
          if (reportType == 'cpu') {
            this.doCpu(value?.data);
            return;
          }
          if (reportType == 'process') {
            this.doProcess(value?.data);
            return;
          }
          if (reportType == 'jvm') {
            this.doJvm(value?.data);
            return;
          }
        })
      })
    },
    doJvm(data){
      this.jvmData = data || {}
    },
    doProcess(data){
      this.processData = data?.data || []
    },
    doCpu(data) {
      if (this.cpuData.length > 100) {
        this.cpuData.shift();
      }
      this.cpuData.push(data?.sys);
      this.cpuXData.push(this.$TOOL.date.dateFormat(data?.timestamp));
    },
    doDisk(data) {
      this.diskData = data.map(item => {
        return {
          name: item.typeName + '\r(' + item.total + ')',
          value: item.usage.toFixed(2) +"%"
        }
      })
    },

    doMemory(data) {
      this.memData = [((data?.used || 0) * 100 / (data?.total || 1)).toFixed(2)];
      this.memFreeData = [((data?.free || 0) * 100 / (data?.total || 1)).toFixed(2)];
    },

    closeSocket() {
      this.plugins.forEach(item => {
        this.socket.off(item);
      })
    },
    isMatch(item) {
      const appValue = this.form.appValue;
      const appModelValue = this.form.appModelValue;
      if (!appModelValue && !appValue) {
        return true;
      }

      if (appModelValue && !appValue) {
        return appModelValue == item.serverHost + ':' + item.serverPort;
      }

      if (!appModelValue && appValue) {
        return item.appName == appValue;
      }
      return (appModelValue == item.serverHost + ':' + item.serverPort) && (item.appName == appValue);
    },
  }
}
</script>
<style scoped lang="less">
.bg {
  width: 100%;
  height: 100%;
}

.box {
  width: 98%;
  height: 600px;
  opacity: 0.6;
}
.dv-button,.dv-button-text {
  color: white !important
}
.title-header {
  height: 110px;
  width: 300px;
  position: absolute;
  left: calc(50% - 150px)
}
.w-10 {
  width: 100% !important;
  position: absolute;
  right: 0;
}
.vdr-container1{
  position: inherit !important;
  // width: 100% !important;
}
</style>