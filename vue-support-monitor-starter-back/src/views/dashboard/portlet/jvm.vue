<script setup>
import tool from "@/utils/tool"
const store=useStore();

const state=reactive({
  arry:[
    {title:"最大内存",icon:"i carbon:ibm-z-cloud-mod-stack",unit:"GB",total:"0"},
    {title:"使用内存",icon:"i carbon:chip",unit:"GB",total:"0"},
    {title:"线程数",icon:"i carbon:user-speaker",unit:"个",total:"0"},
    {title:"已加载类",icon:"i carbon:airline-digital-gate",unit:"个",total:"0"},
    {title:"运行时间",icon:"i carbon:rule",unit:"秒",total:"0"},
  ],
})

const decoFrameConfig={
  directionAlt: true,
  scale:.8
}

watch( ()=>store.state.sys.jvm, (val,preVal)=>{
        const jvm = val;
        if(Object.keys(jvm).length > 0) {
            state.arry[0].total= tool.bytesToGB(jvm?.maxMemory || 0, 2).replace("GB", "");
            state.arry[1].total= tool.bytesToGB((jvm?.maxMemory  || 0)- (jvm?.freeMemory || 0), 2).replace("GB", "");
            state.arry[2].total= (jvm?.threadCount || 0) + '';
            state.arry[3].total= (jvm?.classLoadedCount || 0) + "";
            state.arry[4].total= (parseInt((jvm?.elapsedTime || 0) / 1000)) + "";
        }


    },{
    immediate: true,
    deep: true
}
)

</script>
<template>
  <div class="screenB-counterGrid">
    <div class="content-wrap" v-for="(item,index) in state.arry" :key="index">
      <decoFrameA2 :config="decoFrameConfig"><i :class="[item.icon,'icon']"></i></decoFrameA2>
      <DigitalTransform class="numbers" :value="!item.total ? 0 : item.total.substring(0, 6)" :title="item.total" :useGrouping="true" :interval="3000"></DigitalTransform>
      <div class="block-title">{{item.title}} <span class="unit" v-if="item.unit">({{item.unit}})</span></div>
      
    </div>
  </div>
</template>
<style lang="less">
.screenB-counterGrid{ margin-top:30px; display: grid; grid-template-columns: repeat(5,1fr); height: 100%; grid-template-rows: repeat(1,1fr); grid-gap: 12px;  position: relative;
  .content-wrap{.por;  text-align: center;
    .decoFrameA2{margin:0 auto;}
    .block-title{.ff("cn1"); .fc(@cbl3); font-size: 20px; line-height: 1.5; 
      .unit{display:block; font-size: 12px;}
    }
    .numbers{display:inline-block; text-align: center; height:38px; line-height: 1; font-size: 38px; .ff("en0");  position: relative; vertical-align: text-top; .fc(@cbl3); }
  }
}
</style>
