<script setup>
import sysMem from './portlet/mem.vue'
import sysDisk from './portlet/disk.vue'
import sysCpu from './portlet/cpu.vue'
import sysJvm from './portlet/jvm.vue'
import sysLink from './portlet/link.vue'
import sysApp from './portlet/app.vue'
import sysProcess from './portlet/process.vue'

import Base64 from "@/utils/base64";
import { getQueryPathString, getQueryString } from '@/utils/Utils';

import { inject } from "vue"
const form = reactive({
  appValue: "",
  appName: "",
  appModelValue: ''
});

const plugins = reactive([{
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
      }])

const socket = inject('socket')

onMounted(() => {
  form.appValue = getQueryString("appName");
  form.appName = form.appValue;
  const item = JSON.parse(Base64.decode(getQueryString("data")));
  form.appModelValue = item.serverHost + ':' + item.serverPort;
  openSocket();
});

onUnmounted(() => {
  closeSocket();
});

const router = useRouter();
const { proxy } = getCtx();
const store=useStore();

const comps={
  sysMem,
  sysDisk,
  sysCpu,
  sysJvm,
  sysLink,
  sysApp,

  sysProcess
}
const state=reactive({
  systemTitleConfig:{
    width:500
  },
  panelTitleConfig:{
    width:160,
  },
  dialogConfig:{
    show:false,
    width:'60%',
    height:'60%',
    title:"对话框标题",
    titleWidth:350,
  },
  // panelTitleConfig:{
  //   width:180,
  //   theme:true
  // },
  
  areas:[
    {name:"left",portlets:[
      {id:"l2",title:"系统内存",component:"sysMem",border:"aYinTechBorderA1",hideTitle:true},
      {id:"l4",title:"系统磁盘",component:"sysDisk",border:"aYinTechBorderA1",hideTitle:true},
      {id:"l5",title:"系统CPU",component:"sysCpu",border:"aYinTechBorderA1",hideTitle:true},
    ]},
    {name:"center",portlets:[
      {id:"c1",title:"虚拟机",component:"sysJvm",border:"blank",hideTitle:true},
    ]},
    {name:"right",portlets:[
      {id:"r1",title:"系统链路",component:"sysLink",border:"aYinTechBorderA1",hideTitle:true},
      {id:"r2",title:"系统组件",component:"sysApp",border:"aYinTechBorderA1",hideTitle:true},
      {id:"r3",title:"系统进程",component:"sysProcess",border:"aYinTechBorderA1",hideTitle:true},
    ]},
    
  ]
      
})


const {systemTitleConfig,panelTitleConfig,dialogConfig,areas}=toRefs(state)


const chartCounter=computed(()=>{
  return this.$vuex.state.adaptiveConfig.chartCounter;
})
const closeSocket = () => {
  plugins.forEach(item => {
    socket.off(item);
  })
}
const openSocket = () => {
    plugins.forEach(item => {
      socket.on(item.name, (it) => {
        const value = it;
        if (!isMatch(value)) {
          return false;
        }
        const reportType = value.reportType;
        if (reportType == 'memory') {
          doMemory(value?.data);
          return;
        }
        if (reportType == 'disk') {
          doDisk(value?.data);
          return;
        }
        if (reportType == 'cpu') {
          doCpu(value?.data);
          return;
        }
        if (reportType == 'process') {
          doProcess(value?.data);
          return;
        }
        if (reportType == 'jvm') {
          doJvm(value?.data);
          return;
        }
      })
  })
}
const doDisk = (item) => {
  store.commit('updateDisk', item);
}
const doJvm = (item) => {
  store.commit('updateJvm', item);
}
const doCpu = (item) => {
  store.commit('updateCpu', item);
}
const doMemory = (item) => {
  store.commit('updateMem', item);
}
const doProcess = (item) => {
  store.commit('updateProcess', item);
}
const isMatch = (item) => {
    const appValue = form.appValue;
    const appModelValue = form.appModelValue;
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
}
const getConfig=(item)=>{
  const {id}=item
  if(id.includes("l")){
    return {
      title:item.title,
      titleWidth:120,
      decoration:false,
      decorationAlt: true,
      rotate: "y",
      opacity: 0.5
    }
  }else{
    return {
      title:item.title,
      titleWidth:120,
      decoration:false,
      opacity:.5
    }
  }
}


</script>
<template>
  <div class="screen1080B">
    <div :class="`area-box area-${area.name}`" v-for="area in areas" :key="area.id">
      <div class="portlet-wrapper" v-for="item in area.portlets" :key="item.id">
        <component v-if="item.border" :is='item.border' :config="getConfig(item)">
          <panelTitleA1 v-if="!item.hideTitle" :config="panelTitleConfig" >{{item.title}}</panelTitleA1>
          <component :is='comps[item.component]' ></component>
        </component>
        <template v-else>
          <component :is='item.component'></component>
          <i>{{item.component}}</i>
        </template>
      </div>
    </div>
    <systemTitleA1 :config="systemTitleConfig">监控管理</systemTitleA1>
  </div>
</template>
<style lang="less">
.screen1080B{ z-index: 1;padding:60px 30px 30px 30px; height: 100%; //url(../common/images/bg.png) 
  .techButtonA2 {z-index: 10; .poa; bottom:20px; left:50%; .fixc("x");}
.i(){.poa; bottom:0; right:10px; font-size: 12px; opacity: .1; .fc(@wh); z-index: 10;}
  display: grid; grid-template-columns: repeat(24,1fr); grid-template-rows:repeat(24,1fr); grid-gap: 30px;
  .area-box{.bdr(5px);  pointer-events: visible; position: relative; z-index: 10; 
    .board-3d-wrap{ .poa; .fullbox;

    }
    //<row-start> / <column-start> / <row-end> / <column-end>;
    .blank,
    .portlet-wrapper{.por;
      >i{.i;}
      
    }
    .border-content{>i{.i;}}
    &.area-left{ grid-area: 1 / 1 / 25 / 7; }
    &.area-right{ grid-area: 1 / 19 / 25 / 25; }
    &.area-center{grid-area: 1 / 7 / 25 / 19; }
    &.area-left,
    &.area-right,
    &.area-center{ display: grid; grid-template-columns: repeat(1,1fr); grid-template-rows:repeat(24,1fr); grid-gap: 20px;
      .portlet-wrapper{
        &:nth-child(1){grid-area: 1 / 1 / 8 / 3;}
        &:nth-child(2){grid-area: 8 / 1 / 15 / 3;}
        &:nth-child(3){grid-area: 15 / 1 / 25 / 3;}
      }
    }
    &.area-center{grid-template-columns: repeat(2,1fr);
      .portlet-wrapper{
        &:nth-child(1){grid-area: 1 / 1 / 8 / 3;}
        &:nth-child(2){grid-area: 8 / 1 / 15 / 2;}
        &:nth-child(3){grid-area: 8/ 2 / 15 / 3;}
        &:nth-child(4){grid-area: 15 / 1 / 25 / 3;}
      }
    }
    
  }
  .content-tabs{.poa;  top:-40px; left:80px; right:80px; text-align: center; height: 40px;
    &:before{content:" "; .bdb(var(--button-bd_hov));left:0; right:0; bottom:10px;.poa; z-index: 1;}
    .tabs-item{display:inline-block; padding:0 10px; .ff("cn1"); .fc(var(--font-normal)); height: 30px;line-height: 30px; cursor: pointer; .ani; z-index: 2; .por;
      &:before{content:" "; .bgc(var(--button-bd_hov)); .poa; .fullbox; opacity: 0;}
      &:hover{&:before{opacity: .3;}}
      &.active{ .bdb(var(--font-strong)); .fc(var(--font-strong));}
    }
  }
}
</style>